// src/models/registerChatModels.js
const mongoose = require('mongoose');

/**
 * Register chat models with Mongoose
 * This needs to be called early in the application lifecycle
 * before ChatService is instantiated
 */
function registerChatModels(schemas) {
  try {
    // Only register if not already registered
    if (!mongoose.models.chat_session) {
      mongoose.model('chat_session', schemas.chatSession);
      console.log('Registered chat_session model');
    }

    if (!mongoose.models.chat_message) {
      mongoose.model('chat_message', schemas.chatMessage);
      console.log('Registered chat_message model');
    }

    if (!mongoose.models.chat_idempotency) {
      mongoose.model('chat_idempotency', schemas.chatIdempotency);
      console.log('Registered chat_idempotency model');
    }

    return true;
  } catch (error) {
    console.error('Error registering chat models:', error);
    return false;
  }
}

module.exports = registerChatModels;
