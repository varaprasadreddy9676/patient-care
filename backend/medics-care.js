const express = require("express");
const http = require("http");
const cors = require("cors");
const helmet = require("helmet");
const methodOverride = require("method-override");
const createLogger = require("./src/core/Logger");
const MongoDBConnectionManager = require("./src/core/MongoDBService");
const config = require("./src/config/constants");
const LockManager = require("node-locksmith");
const jwt = require("jsonwebtoken");
const morgan = require("morgan");
const rfs = require("rotating-file-stream");
const path = require("path");
const hospitalPolicyService = require("./src/services/HospitalPolicyService");
const ResponseHandler = require("./src/utils/ResponseHandler");
const AppError = require("./src/utils/AppError");
const ErrorCodes = require("./src/utils/ErrorCodes");

// Create the Express app
const app = express();
const logger = createLogger("medics-care");
app.logger = logger;
module.exports = app;

// Middleware setup
app.use(cors());
app.use(helmet());
app.use(methodOverride("X-HTTP-Method-Override"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, parameterLimit: 100000 }));


// Static assets
app.use(config.BASE_URL + "/public/images", express.static(path.join(__dirname, "public/images")));

// CORS Support
app.use((req, res, next) => {
  console.log(`Processing: ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`Request Body: ${JSON.stringify(req.body)}`);
  }
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH");
  if (req.method === "OPTIONS") {
    return res.status(200).json({});
  }
  next();
});

// Health check endpoint
app.get(["/hc", "/healthcheck"], (req, res) => {
  res.status(200).send("OK");
});

// Application initialization
async function initializeApp() {

  const lockManager = new LockManager({ lockFileName: "medics-care.lock" });

  try {
    
    await lockManager.checkLock();
    await lockManager.createLock(Number.POSITIVE_INFINITY, 3);

    // Initialize MongoDB connection
    const dbManager = new MongoDBConnectionManager(config.MONGO_DB_URL, logger);
    await dbManager.connectToDatabase();

    // Load models
    app.models = require("./src/models/index");

    // JWT Authentication
    setupJWTMiddleware();

    // Load routes
    loadRoutes();

    // Setup error handlers (must be after routes)
    setupErrorHandlers();

    // Initialize engines
    // initializeEngines();

    // Unhandled Rejections
    process.on("unhandledRejection", (error) => {
      logger.error("Unhandled Promise Rejection:", error.message);
    });

    // Graceful Shutdown
    process.on("SIGTERM", () => {
      logger.info("Received SIGTERM. Shutting down gracefully.");
      process.exit(0);
    });

    // Start HTTP server
    const httpPort = config.PORT || 3081;
    logger.info(`HTTP server is listening on port: ${httpPort}`);
    http.createServer(app).listen(httpPort);

    // Initialize additional services
    hospitalPolicyService.init();
  } catch (error) {
    logger.error("Initialization error:", error);
    console.error("Full error details:", error);
    process.exit(1);
  }
}

// JWT Middleware
function setupJWTMiddleware() {
  app.use([config.BASE_URL + "/*"], (req, res, next) => {
    const authRequired = ![
      "/api/signup",
      "/api/signin",
      "/api/city",
      "/api/user/verifyToken",
      "/api/appointment/start",
      "/api/appointment/close",
      "/api/hospital",
      "/api/prescription/ready",
      "/api/externalLabReports",
      "/api/advertisements",
    ].some((path) => req.baseUrl.includes(path));

    if (req.method !== "OPTIONS" && authRequired) {
      const token = req.headers.authorization?.split(" ")[1] || "";
      jwt.verify(token, config.SECRET_KEY, (err, user) => {
        if (err) {
          if (err.name === "TokenExpiredError") {
            console.log("Token expired!!!");
            return ResponseHandler.error(res, new AppError(ErrorCodes.TOKEN_EXPIRED, err.message));
          } else {
            console.log("Authentication failed!!!");
            return ResponseHandler.error(res, new AppError(ErrorCodes.INVALID_TOKEN, "Authentication failed"));
          }
        } else {
          req.user = user;
          next();
        }
      });
    } else {
      next();
    }
  });
}

// Load routes dynamically
function loadRoutes() {
  const routes = require("./src/routes");
  Object.entries(routes).forEach(([route, controller]) => {
    app.use(route, controller(app, route));
  });
}

// Setup error handlers
function setupErrorHandlers() {
  // 404 handler - must be after all routes
  app.use((req, res, next) => {
    const error = new AppError(ErrorCodes.NOT_FOUND, `Route ${req.originalUrl} not found`);
    next(error);
  });

  // Global error handling middleware
  app.use((err, req, res, next) => {
    // Log the error
    logger.error("Error:", err);

    // Handle specific error types
    if (err.name === "UnauthorizedError") {
      return ResponseHandler.error(res, new AppError(ErrorCodes.UNAUTHORIZED, err.message));
    }

    if (err.name === "TokenExpiredError") {
      return ResponseHandler.error(res, new AppError(ErrorCodes.TOKEN_EXPIRED, err.message));
    }

    if (err.name === "ValidationError") {
      return ResponseHandler.error(res, new AppError(ErrorCodes.VALIDATION_ERROR, err.message));
    }

    // MongoDB duplicate key error
    if (err.code === 11000) {
      return ResponseHandler.error(res, new AppError(ErrorCodes.DUPLICATE_ENTRY, "Duplicate entry detected"));
    }

    // Handle AppError instances
    if (err instanceof AppError) {
      return ResponseHandler.error(res, err);
    }

    // Default to internal server error
    return ResponseHandler.error(res, err, 500);
  });
}

// Initialize engines
function initializeEngines() {
  require("./src/engines/SyncCities");
  require("./src/engines/PushNotifications");
  require("./src/engines/AppointmentReleaseReservedSlots");
  require("./src/engines/AppointmentCloseScheduledBookings");
  require("./src/engines/ConsultationNotStartedReminder");
  require("./src/engines/UpdateCallCenterAppointmentBookings");
}

// Initialize the application
initializeApp();