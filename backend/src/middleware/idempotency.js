// src/middleware/idempotency.js
const mongoose = require('mongoose');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

// Get model at runtime
function getChatIdempotencyModel() {
  return mongoose.models.chat_idempotency;
}

/**
 * Idempotency middleware for chat endpoints
 * Ensures duplicate requests (same idempotency key) return cached responses
 */
async function idempotencyMiddleware(req, res, next) {
  const idempotentMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];

  // Skip for GET requests
  if (!idempotentMethods.includes(req.method)) {
    return next();
  }

  const key = req.headers['idempotency-key'];

  // Require idempotency key
  if (!key) {
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.VALIDATION_ERROR, 'Idempotency-Key header is required'),
      422
    );
  }

  try {
    const ChatIdempotency = getChatIdempotencyModel();

    if (!ChatIdempotency) {
      console.error('ChatIdempotency model not registered');
      return next();
    }

    // Check cache
    const cached = await ChatIdempotency.findOne({ idempotencyKey: key });

    if (cached) {
      console.log(`Idempotency cache hit: ${key}`);
      return res.status(cached.statusCode).json(cached.response);
    }

    // Intercept response to cache it
    const originalJson = res.json.bind(res);

    res.json = async function(body) {
      // Only cache successful responses (2xx)
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          await ChatIdempotency.create({
            userId: req.user?._id,
            sessionId: req.params?.sessionId || req.body?.sessionId,
            idempotencyKey: key,
            endpoint: req.path,
            requestBody: req.body,
            response: body,
            statusCode: res.statusCode
          });
        } catch (err) {
          // Log but don't fail request if caching fails
          console.error('Idempotency cache error:', err.message);
        }
      }

      return originalJson(body);
    };

    next();

  } catch (error) {
    console.error('Idempotency middleware error:', error);
    // Continue processing even if idempotency check fails
    next();
  }
}

module.exports = idempotencyMiddleware;
