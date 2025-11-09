/**
 * MongoDB Connection Manager class for handling MongoDB connections with retry mechanism.
 * @class MongoDBConnectionManager
 */
const mongoose = require("mongoose");

/**
 * Class representing MongoDB Connection Manager.
 */
class MongoDBConnectionManager {
	/**
	 * Creates an instance of MongoDBConnectionManager.
	 * @param {string} [url] - MongoDB URI. If not provided, falls back to the default URI.
	 * @param {Object} [customLogger] - Custom logger object. If not provided, falls back to the default logger.
	 * @memberof MongoDBConnectionManager
	 */
	constructor(url, customLogger) {
		/**
		 * Default MongoDB URI.
		 * @member {string} defaultMongoDBURI
		 */
		this.defaultMongoDBURI = "mongodb://localhost:27017/local";

		/**
		 * MongoDB URI, either from environment variable, provided parameter, or default.
		 * @member {string} mongodbURL
		 */
		this.mongodbURL = url || process.env.MONGODB_URI || this.defaultMongoDBURI;

		/**
		 * MongoDB connection options.
		 * @member {Object} options
		 */
		this.options = {
			useNewUrlParser: true,
			useUnifiedTopology: true,
		};

		/**
		 * Flag indicating if connected before.
		 * @member {boolean} isConnectedBefore
		 */
		this.isConnectedBefore = false;

		/**
		 * Logger object for logging messages.
		 * @member {Object} logger
		 */
		this.logger = customLogger || {
			/**
			 * Log informational messages.
			 * @function info
			 * @param {...*} args - Informational message arguments.
			 */
			info: (...args) => console.log(new Date(), ...args),

			/**
			 * Log error messages.
			 * @function error
			 * @param {...*} args - Error message arguments.
			 */
			error: (...args) => console.error(new Date(), ...args),
		};

		/**
		 * Initial retry delay in milliseconds.
		 * @member {number} retryDelay
		 */
		this.retryDelay = 1000;

		/**
		 * Maximum retry delay in milliseconds.
		 * @member {number} maxRetryDelay
		 */
		this.maxRetryDelay = 60000;

		/**
		 * Maximum number of retry attempts.
		 * @member {number} maxRetryAttempts
		 */
		this.maxRetryAttempts = 5;

		// Bind methods to the instance to ensure 'this' refers to the class instance
		this.connectToDatabase = this.connectToDatabase.bind(this);
		this.closeDatabaseConnection = this.closeDatabaseConnection.bind(this);
		this.handleSIGINT = this.handleSIGINT.bind(this);

		mongoose.set("strictQuery", false);

		// Setup event listeners
		mongoose.connection.on("connecting", () =>
			this.logger.info("Connecting to MongoDB…"),
		);
		mongoose.connection.on("error", (error) =>
			this.handleConnectionError(error),
		);
		mongoose.connection.on("connected", () => this.handleConnected());
		mongoose.connection.on("reconnected", () =>
			this.logger.info("Reconnected to MongoDB."),
		);
		mongoose.connection.on("disconnected", () => this.handleDisconnected());

		// Graceful shutdown logic
		process.on("SIGINT", this.handleSIGINT);
	}
	async connectToDatabase() {
		if (mongoose.connection.readyState === 1) {
			this.logger.info("Already connected to the database");
			return mongoose.connection; // Return the Mongoose connection
		}
	
		let retryAttempts = 0;
		while (retryAttempts < this.maxRetryAttempts) {
			try {
				await mongoose.connect(this.mongodbURL, this.options);
				return mongoose.connection; // Return the Mongoose connection
			} catch (error) {
				this.logger.error(`MongoDB connection attempt ${retryAttempts + 1} failed:`, error);
				retryAttempts++;
				await this.retryConnection(retryAttempts);
			}
		}
	
		this.logger.error("Exceeded maximum retry attempts. Unable to connect to MongoDB.");
		throw new Error("Unable to connect to MongoDB");
	}
	
	/**
	 * Retry the MongoDB connection with exponential backoff.
	 * @async
	 * @function retryConnection
	 * @param {number} retryAttempts - The current number of retry attempts.
	 * @returns {Promise<void>} - A promise to be resolved after the retry delay.
	 * @memberof MongoDBConnectionManager
	 */
	async retryConnection(retryAttempts) {
		if (this.logger && typeof this.logger.info === "function") {
			const retryDelay = Math.min(
				this.maxRetryDelay,
				this.retryDelay * 2 ** retryAttempts,
			);
			this.logger.info(
				`Retrying MongoDB connection in ${retryDelay / 1000} seconds...`,
			);
			await new Promise((resolve) => setTimeout(resolve, retryDelay));
		} else {
			console.error(
				`Retrying MongoDB connection attempt ${retryAttempts + 1}...`,
			);
			// Fallback to console.log if logger.info is not a function
			await new Promise((resolve) => setTimeout(resolve, this.retryDelay));
		}
	}

	/**
	 * Close the MongoDB database connection.
	 * @async
	 * @function closeDatabaseConnection
	 * @memberof MongoDBConnectionManager
	 */
	async closeDatabaseConnection() {
		try {
			await mongoose.connection.close();
			this.logger.info("Disconnected from MongoDB.");
		} catch (error) {
			this.logger.error("Error during MongoDB disconnection", error);
		}
	}

	/**
	 * Handle successful MongoDB connection.
	 * @function handleConnected
	 * @memberof MongoDBConnectionManager
	 */
	handleConnected() {
		this.isConnectedBefore = true;
		this.logger.info("Connected to MongoDB.");
	}

	/**
	 * Handle MongoDB disconnection.
	 * @function handleDisconnected
	 * @memberof MongoDBConnectionManager
	 */
	handleDisconnected() {
		this.logger.error("MongoDB disconnected!");
		if (!this.isConnectedBefore) {
			const reconnectDelay = Math.min(
				60000,
				2 ** mongoose.connection.readyState * 1000,
			);
			setTimeout(() => this.connectToDatabase(), reconnectDelay);
		}
	}

	/**
	 * Handle MongoDB connection error.
	 * @function handleConnectionError
	 * @param {Error} error - The connection error.
	 * @memberof MongoDBConnectionManager
	 */
	handleConnectionError(error) {
		this.logger.error("MongoDB connection error:", error);
		mongoose.disconnect();
	}

	/**
	 * Handle SIGINT signal for graceful shutdown.
	 * @async
	 * @function handleSIGINT
	 * @memberof MongoDBConnectionManager
	 */
	async handleSIGINT() {
		this.logger.info("Received SIGINT. Closing MongoDB connection...");
		await this.closeDatabaseConnection();
		this.logger.info("MongoDB connection closed. Exiting process.");
		process.exit(0);
	}
}

module.exports = MongoDBConnectionManager;

