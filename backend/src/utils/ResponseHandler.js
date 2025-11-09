/**
 * Standardized Response Handler
 * Provides consistent response structure across all API endpoints
 */

const ErrorCodes = require('./ErrorCodes');
const AppError = require('./AppError');

class ResponseHandler {
  /**
   * Send success response
   * @param {Object} res - Express response object
   * @param {*} data - Data to send in response
   * @param {String} message - Optional success message
   * @param {Number} statusCode - HTTP status code (default: 200)
   */
  static success(res, data = null, message = null, statusCode = 200) {
    const response = {
      success: true
    };

    if (data !== null) {
      response.data = data;
    }

    if (message) {
      response.message = message;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send error response
   * @param {Object} res - Express response object
   * @param {Object|String} error - Error object or error message
   * @param {Number} statusCode - HTTP status code (default: 500)
   * @param {String} errorCode - Error code (optional)
   */
  static error(res, error, statusCode = 500, errorCode = null) {
    // If error is an instance of AppError
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details
        }
      });
    }

    // If error is a string
    if (typeof error === 'string') {
      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode || ErrorCodes.INTERNAL_SERVER_ERROR.code,
          message: error
        }
      });
    }

    // If error has ERROR_MSG property (from HTTPService)
    if (error && error.ERROR_MSG) {
      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode || ErrorCodes.EXTERNAL_SERVICE_ERROR.code,
          message: error.ERROR_MSG,
          details: error.DESCRIPTION || null
        }
      });
    }

    // If error is a standard Error object
    if (error instanceof Error) {
      return res.status(statusCode).json({
        success: false,
        error: {
          code: errorCode || ErrorCodes.INTERNAL_SERVER_ERROR.code,
          message: error.message,
          details: process.env.NODE_ENV === 'development' ? error.stack : null
        }
      });
    }

    // If error is an object with code and message
    if (error && error.code && error.message) {
      return res.status(statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details || null
        }
      });
    }

    // Default error response
    return res.status(statusCode).json({
      success: false,
      error: {
        code: errorCode || ErrorCodes.INTERNAL_SERVER_ERROR.code,
        message: 'An unexpected error occurred',
        details: process.env.NODE_ENV === 'development' ? error : null
      }
    });
  }

  /**
   * Wrapper function for HTTPService callbacks
   * Converts callback pattern to use standardized responses
   */
  static createHTTPServiceCallbacks(res, successCallback = null, errorCallback = null) {
    return {
      success: (response) => {
        if (successCallback) {
          successCallback(response);
        } else if (response && response.data !== undefined) {
          // If response has a data property, send it
          ResponseHandler.success(res, response.data, response.message);
        } else {
          // Otherwise send the whole response
          ResponseHandler.success(res, response);
        }
      },
      error: (error) => {
        if (errorCallback) {
          errorCallback(error);
        } else {
          // Check if it's a string error from HTTPService
          if (typeof error === 'string') {
            ResponseHandler.error(res, error, 500);
          } else if (error && error.ERROR_MSG) {
            ResponseHandler.error(res, error, 500);
          } else {
            ResponseHandler.error(res, error, 500);
          }
        }
      }
    };
  }

  /**
   * Async handler wrapper to catch errors in async route handlers
   * @param {Function} fn - Async function to wrap
   */
  static asyncHandler(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

module.exports = ResponseHandler;
