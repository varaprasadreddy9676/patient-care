const winston = require("winston");
require("winston-daily-rotate-file");
const path = require("path");

const createLogger = (appName = "ApplicationName", logPath = "../logs") => {
  // Define the log directory path
  const logDir = path.join(__dirname, logPath);

  // Create a logger that logs to both a file and the console
  return winston.createLogger({
    level: "info", // Set default log level
    format: winston.format.combine(
      winston.format.timestamp({ format: "DD-MM-YYYY HH:mm:ss" }),
      winston.format.json(), // Log in JSON format
      winston.format.prettyPrint(), // Improve readability in console logs
    ),
    transports: [
      // Log to the console with appropriate settings
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(), // Add colors to console logs
          winston.format.printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
          }),
        ),
      }),
      // Log to a rotating file
      new winston.transports.DailyRotateFile({
        format: winston.format.json(), // Log in JSON format
        filename: path.join(logDir, `${appName}-%DATE%.log`),
        datePattern: "YYYY-MM-DD", // Rotate logs every day
        zippedArchive: true,
        maxSize: "20m",
        maxFiles: "14d",
      }),
    ],
  });
};

module.exports = createLogger;