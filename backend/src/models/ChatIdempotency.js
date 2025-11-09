// src/models/ChatIdempotency.js
const mongoose = require('mongoose');

const ChatIdempotencySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user'
  },

  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'chat_session'
  },

  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },

  endpoint: {
    type: String,
    required: true
  },

  requestBody: {
    type: mongoose.Schema.Types.Mixed
  },

  response: {
    type: mongoose.Schema.Types.Mixed
  },

  statusCode: {
    type: Number,
    default: 200
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// TTL index - auto-delete after 24 hours
ChatIdempotencySchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 86400 }
);

// Export schema (to match existing pattern in this codebase)
module.exports = ChatIdempotencySchema;
