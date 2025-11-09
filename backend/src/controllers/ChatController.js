// src/controllers/ChatController.js
const mongoose = require('mongoose');
const Joi = require('joi');
const ChatServiceClass = require('../services/ChatService');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');
const idempotencyMiddleware = require('../middleware/idempotency');
const { validateChatAccess, validateFamilyMemberAccess } = require('../middleware/chatAuth');

// Validation schemas
const startChatSchema = Joi.object({
  familyMemberId: Joi.string().required(),
  contextType: Joi.string()
    .valid('VISIT', 'APPOINTMENT', 'PRESCRIPTION', 'GENERAL', 'LAB_REPORT')
    .required(),
  contextId: Joi.string().allow(null, ''),
  contextData: Joi.object().default({})
});

const sendMessageSchema = Joi.object({
  message: Joi.string().min(1).max(2000).required()
});

const updateSessionSchema = Joi.object({
  title: Joi.string().min(1).max(200)
});

/**
 * POST /api/v1/chat/start
 * Start or resume a chat session
 */
function createStartChat(ChatService) {
  return async function startChat(req, res) {
    try {
      // Validate request body
      const { error, value } = startChatSchema.validate(req.body);

      if (error) {
        const fields = {};
        error.details.forEach(detail => {
          fields[detail.path[0]] = detail.message;
        });

        return ResponseHandler.error(
          res,
          new AppError(ErrorCodes.VALIDATION_ERROR, 'Invalid request body', fields),
          422
        );
      }

      // Add userId from authenticated user
      value.userId = req.user._id.toString();

      // Start or resume chat
      const result = await ChatService.startOrResumeChat(value);

      return ResponseHandler.success(res, result, null, result.isNew ? 201 : 200);

    } catch (error) {
      console.error('Start chat error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * POST /api/v1/chat/:sessionId/message
 * Send a message in a chat session
 */
function createSendMessage(ChatService) {
  return async function sendMessage(req, res) {
    try {
      const { sessionId } = req.params;

      // Validate request body
      const { error, value } = sendMessageSchema.validate(req.body);

      if (error) {
        return ResponseHandler.error(
          res,
          new AppError(ErrorCodes.VALIDATION_ERROR, error.details[0].message),
          422
        );
      }

      // Send message
      const result = await ChatService.sendMessage(sessionId, value.message);

      return ResponseHandler.success(res, result);

    } catch (error) {
      console.error('Send message error:', error);

      // Check if it's a provider error
      if (error.code === 'SERVICE_UNAVAILABLE') {
        return ResponseHandler.error(res, error, 503);
      }

      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * GET /api/v1/chat/:sessionId/messages
 * Get paginated messages for a session
 */
function createGetMessages(ChatService) {
  return async function getMessages(req, res) {
    try {
      const { sessionId } = req.params;
      const cursor = req.query.cursor || null;
      const limit = parseInt(req.query.limit) || 50;

      // Validate limit
      if (limit > 100) {
        return ResponseHandler.error(
          res,
          new AppError(ErrorCodes.VALIDATION_ERROR, 'Limit cannot exceed 100'),
          422
        );
      }

      const result = await ChatService.getSessionMessages(sessionId, cursor, limit);

      return ResponseHandler.success(res, result);

    } catch (error) {
      console.error('Get messages error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * POST /api/v1/chat/:sessionId/retry
 * Retry last failed message
 */
function createRetryMessage(ChatService) {
  return async function retryMessage(req, res) {
    try {
      const { sessionId } = req.params;

      const result = await ChatService.retryLastMessage(sessionId);

      return ResponseHandler.success(res, result);

    } catch (error) {
      console.error('Retry message error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * GET /api/v1/chat/sessions
 * Get user's chat sessions
 */
function createGetSessions(ChatService) {
  return async function getSessions(req, res) {
    try {
      const userId = req.user._id.toString();
      const filters = {
        familyMemberId: req.query.familyMemberId,
        contextType: req.query.contextType,
        status: req.query.status || 'ACTIVE'
      };

      const sessions = await ChatService.getUserSessions(userId, filters);

      return ResponseHandler.success(res, { sessions });

    } catch (error) {
      console.error('Get sessions error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * PATCH /api/v1/chat/:sessionId
 * Update session metadata
 */
function createUpdateSession(ChatService) {
  return async function updateSession(req, res) {
    try {
      const { sessionId } = req.params;

      // Validate request body
      const { error, value } = updateSessionSchema.validate(req.body);

      if (error) {
        return ResponseHandler.error(
          res,
          new AppError(ErrorCodes.VALIDATION_ERROR, error.details[0].message),
          422
        );
      }

      const session = await ChatService.updateSession(sessionId, value);

      return ResponseHandler.success(res, { session });

    } catch (error) {
      console.error('Update session error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * PUT /api/v1/chat/:sessionId/archive
 * Archive a chat session
 */
function createArchiveSession(ChatService) {
  return async function archiveSession(req, res) {
    try {
      const { sessionId } = req.params;

      const session = await ChatService.archiveSession(sessionId);

      return ResponseHandler.success(res, { session });

    } catch (error) {
      console.error('Archive session error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * DELETE /api/v1/chat/:sessionId
 * Delete a chat session
 */
function createDeleteSession(ChatService) {
  return async function deleteSession(req, res) {
    try {
      const { sessionId } = req.params;

      await ChatService.deleteSession(sessionId);

      return ResponseHandler.success(res, { message: 'Session deleted successfully' });

    } catch (error) {
      console.error('Delete session error:', error);
      return ResponseHandler.error(res, error, error.statusCode || 500);
    }
  };
}

/**
 * Register routes
 */
module.exports = function(app, route) {
  // Register models (following same pattern as CityController)
  let ChatSession, ChatMessage;

  try {
    // Try to get already registered models first
    ChatSession = mongoose.models.chat_session;
    ChatMessage = mongoose.models.chat_message;
  } catch (e) {
    console.log('Models not found in mongoose.models, will register them');
  }

  // If not found, register them
  if (!ChatSession) {
    ChatSession = mongoose.model('chat_session', app.models.chatSession);
    console.log('Registered chat_session model');
  }

  if (!ChatMessage) {
    ChatMessage = mongoose.model('chat_message', app.models.chatMessage);
    console.log('Registered chat_message model');
  }

  // Also register ChatIdempotency for the idempotency middleware
  if (!mongoose.models.chat_idempotency) {
    mongoose.model('chat_idempotency', app.models.chatIdempotency);
    console.log('Registered chat_idempotency model');
  }

  // Create ChatService instance with models
  const ChatService = new ChatServiceClass(ChatSession, ChatMessage);

  // Make ChatService available to route handlers
  app.chatService = ChatService;

  // POST /start - Start or resume chat
  app.post(
    `${route}/start`,
    idempotencyMiddleware,
    validateFamilyMemberAccess,
    createStartChat(ChatService)
  );

  // POST /:sessionId/message - Send message
  app.post(
    `${route}/:sessionId/message`,
    idempotencyMiddleware,
    validateChatAccess,
    createSendMessage(ChatService)
  );

  // GET /:sessionId/messages - Get messages
  app.get(
    `${route}/:sessionId/messages`,
    validateChatAccess,
    createGetMessages(ChatService)
  );

  // POST /:sessionId/retry - Retry failed message
  app.post(
    `${route}/:sessionId/retry`,
    idempotencyMiddleware,
    validateChatAccess,
    createRetryMessage(ChatService)
  );

  // GET /sessions - Get user's sessions
  app.get(
    `${route}/sessions`,
    createGetSessions(ChatService)
  );

  // PATCH /:sessionId - Update session
  app.patch(
    `${route}/:sessionId`,
    idempotencyMiddleware,
    validateChatAccess,
    createUpdateSession(ChatService)
  );

  // PUT /:sessionId/archive - Archive session
  app.put(
    `${route}/:sessionId/archive`,
    idempotencyMiddleware,
    validateChatAccess,
    createArchiveSession(ChatService)
  );

  // DELETE /:sessionId - Delete session
  app.delete(
    `${route}/:sessionId`,
    idempotencyMiddleware,
    validateChatAccess,
    createDeleteSession(ChatService)
  );

  // Return middleware (required by route loader)
  return function(req, res, next) {
    next();
  };
};
