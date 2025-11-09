// src/models/ChatMessage.js
const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema({
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'chat_session',
    index: true
  },

  role: {
    type: String,
    required: true,
    enum: ['user', 'assistant', 'system', 'tool']
  },

  content: {
    type: String,
    required: true
  },

  // Metadata for observability
  meta: {
    provider: String,              // 'openai', 'anthropic', 'gemini'
    model: String,                 // 'gpt-4', 'claude-3-sonnet', etc.
    latencyMs: Number,             // Response time
    tokens: {
      prompt: Number,
      completion: Number,
      total: Number
    },
    toolCalls: [{                  // For function calling (future)
      name: String,
      args: mongoose.Schema.Types.Mixed
    }],
    errorCode: String,             // If message failed
    retryCount: {
      type: Number,
      default: 0
    }
  },

  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Indexes
ChatMessageSchema.index({ sessionId: 1, createdAt: 1 });
ChatMessageSchema.index({ sessionId: 1, active: 1 });

// Export schema (to match existing pattern in this codebase)
module.exports = ChatMessageSchema;
