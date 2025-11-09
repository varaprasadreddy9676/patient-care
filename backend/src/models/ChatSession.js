// src/models/ChatSession.js
const mongoose = require('mongoose');

const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'user',
    index: true
  },

  familyMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'family_member',
    index: true
  },

  // Context System
  contextType: {
    type: String,
    required: true,
    enum: ['VISIT', 'APPOINTMENT', 'PRESCRIPTION', 'GENERAL', 'LAB_REPORT', 'BILL'],
    index: true
  },

  contextId: {
    type: String,
    default: null,
    index: true
  },

  contextData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Metadata
  title: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ['ACTIVE', 'ARCHIVED'],
    default: 'ACTIVE',
    index: true
  },

  // Statistics
  messageCount: {
    type: Number,
    default: 0
  },

  lastMessageAt: {
    type: Date,
    default: Date.now
  },

  // Multi-tenant (optional)
  tenantId: {
    type: String,
    index: true
  }
}, {
  timestamps: true  // Auto-manages createdAt, updatedAt
});

// CRITICAL: Unique index for active sessions
// Prevents duplicate ACTIVE chats for same context
ChatSessionSchema.index(
  {
    userId: 1,
    familyMemberId: 1,
    contextType: 1,
    contextId: 1,
    status: 1
  },
  {
    unique: true,
    partialFilterExpression: { status: 'ACTIVE' }
  }
);

// Additional indexes
ChatSessionSchema.index({ userId: 1, status: 1 });
ChatSessionSchema.index({ tenantId: 1 });

// Export schema (to match existing pattern in this codebase)
module.exports = ChatSessionSchema;
