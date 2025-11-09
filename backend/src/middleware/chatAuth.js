// src/middleware/chatAuth.js
const mongoose = require('mongoose');
const ResponseHandler = require('../utils/ResponseHandler');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

// Get models at runtime
function getChatSessionModel() {
  return mongoose.models.chat_session;
}

function getFamilyMemberModel() {
  return mongoose.models.family_member;
}

/**
 * Validate user has access to chat session
 */
async function validateChatAccess(req, res, next) {
  try {
    const { sessionId } = req.params;
    const userId = req.user._id.toString();

    const ChatSession = getChatSessionModel();
    if (!ChatSession) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Chat system not initialized'),
        500
      );
    }

    const session = await ChatSession.findById(sessionId);

    if (!session) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found'),
        404
      );
    }

    // Verify ownership
    if (session.userId.toString() !== userId) {
      console.warn(`Unauthorized chat access attempt: user ${userId} tried to access session ${sessionId}`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied to this chat session'),
        403
      );
    }

    // Attach session to request
    req.chatSession = session;
    next();

  } catch (error) {
    console.error('Chat access validation error:', error);
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

/**
 * Validate user has access to family member
 */
async function validateFamilyMemberAccess(req, res, next) {
  try {
    const { familyMemberId } = req.body;
    const userId = req.user._id.toString();

    // Verify family member exists and belongs to user
    const FamilyMember = getFamilyMemberModel();

    if (!FamilyMember) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'System not initialized'),
        500
      );
    }

    const familyMember = await FamilyMember.findById(familyMemberId);

    if (!familyMember) {
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.NOT_FOUND, 'Family member not found'),
        404
      );
    }

    if (familyMember.userId.toString() !== userId) {
      console.warn(`Unauthorized family member access: user ${userId} tried to access family member ${familyMemberId}`);
      return ResponseHandler.error(
        res,
        new AppError(ErrorCodes.FORBIDDEN, 'Access denied to this family member'),
        403
      );
    }

    // Attach to request
    req.familyMember = familyMember;
    next();

  } catch (error) {
    console.error('Family member access validation error:', error);
    return ResponseHandler.error(
      res,
      new AppError(ErrorCodes.INTERNAL_SERVER_ERROR, 'Authorization check failed'),
      500
    );
  }
}

module.exports = {
  validateChatAccess,
  validateFamilyMemberAccess
};
