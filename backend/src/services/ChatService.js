// src/services/ChatService.js
const mongoose = require('mongoose');
const ContextBuilderService = require('./ContextBuilderService');
const TokenBudgetService = require('./TokenBudgetService');
const AIProviderFactory = require('./ai/AIProviderFactory');
const { appendDisclaimerIfNeeded } = require('../utils/AIPromptTemplates');
const aiConfig = require('../config/aiConfig');
const AppError = require('../utils/AppError');
const ErrorCodes = require('../utils/ErrorCodes');

class ChatService {
  constructor(ChatSession, ChatMessage) {
    this.ChatSession = ChatSession;
    this.ChatMessage = ChatMessage;

    // Initialize AI provider
    const providerConfig = aiConfig.providers[aiConfig.activeProvider];
    this.aiProvider = AIProviderFactory.create(aiConfig.activeProvider, providerConfig);
  }

  /**
   * Start or resume a chat session
   * @param {Object} params
   * @param {string} params.userId - User ID
   * @param {string} params.familyMemberId - Family member ID
   * @param {string} params.contextType - Context type (VISIT, APPOINTMENT, etc.)
   * @param {string} params.contextId - Context ID
   * @param {Object} params.contextData - Additional context data
   * @returns {Promise<Object>} Session and messages
   */
  async startOrResumeChat(params) {
    const { userId, familyMemberId, contextType, contextId, contextData } = params;

    // Check for existing ACTIVE session
    const existingSession = await this.ChatSession.findOne({
      userId,
      familyMemberId,
      contextType,
      contextId: contextId || null,
      status: 'ACTIVE'
    });

    if (existingSession) {
      // Resume existing session
      const messages = await this.getSessionMessages(existingSession._id, null, 50);
      return {
        session: existingSession,
        messages,
        isNew: false
      };
    }

    // Create new session
    try {
      // Build context
      const context = await ContextBuilderService.buildContext(
        contextType,
        contextId,
        contextData
      );

      // Generate title
      const title = this._generateTitle(contextType, contextId, contextData);

      // Create session
      const session = await this.ChatSession.create({
        userId,
        familyMemberId,
        contextType,
        contextId: contextId || null,
        contextData,
        title,
        status: 'ACTIVE',
        messageCount: 0,
        lastMessageAt: new Date()
      });

      // Create system message with context
      const systemMessage = await this.ChatMessage.create({
        sessionId: session._id,
        role: 'system',
        content: context.systemPrompt + '\n\n' + context.contextText,
        meta: {
          contextMetadata: context.metadata
        }
      });

      // Update message count
      session.messageCount = 1;
      await session.save();

      return {
        session,
        messages: {
          items: [systemMessage],
          pagination: {
            total: 1,
            limit: 50,
            nextCursor: null,
            hasMore: false
          }
        },
        isNew: true
      };

    } catch (error) {
      // Handle duplicate key error (race condition)
      if (error.code === 11000) {
        // Another request created the session, fetch it
        const session = await this.ChatSession.findOne({
          userId,
          familyMemberId,
          contextType,
          contextId: contextId || null,
          status: 'ACTIVE'
        });

        const messages = await this.getSessionMessages(session._id, null, 50);
        return {
          session,
          messages,
          isNew: false
        };
      }

      throw error;
    }
  }

  /**
   * Send a message in a chat session
   * @param {string} sessionId - Session ID
   * @param {string} userMessageText - User's message
   * @returns {Promise<Object>} User message and assistant response
   */
  async sendMessage(sessionId, userMessageText) {
    // Validate session exists
    const session = await this.ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found');
    }

    if (session.status !== 'ACTIVE') {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Cannot send message to archived session');
    }

    // Save user message
    const userMessage = await this.ChatMessage.create({
      sessionId,
      role: 'user',
      content: userMessageText
    });

    try {
      // Load conversation history (last N messages)
      const historyMessages = await this.ChatMessage.find({
        sessionId,
        active: true
      })
        .sort({ createdAt: 1 })
        .limit(aiConfig.chat.maxHistoryMessages)
        .lean();

      // Extract system prompt and context from first message
      const systemMessage = historyMessages.find(m => m.role === 'system');
      const systemPrompt = systemMessage?.content || '';

      // Build conversation messages (excluding system message)
      const conversationMessages = historyMessages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role,
          content: m.content
        }));

      // Budget tokens
      const budgeted = TokenBudgetService.budgetConversation({
        systemPrompt,
        contextText: '',  // Context already in system message
        messages: conversationMessages,
        userMessage: userMessageText,
        model: aiConfig.providers[aiConfig.activeProvider].model,
        maxContextTokens: aiConfig.tokenBudget.maxContextTokens,
        reserveForResponse: aiConfig.tokenBudget.reserveForResponse
      });

      // Prepare messages for AI provider
      const aiMessages = [
        { role: 'system', content: budgeted.systemPrompt },
        ...budgeted.history,
        { role: 'user', content: budgeted.userMessage }
      ];

      // Call AI provider
      const providerResponse = await this.aiProvider.chat(aiMessages, {
        model: aiConfig.providers[aiConfig.activeProvider].model,
        temperature: aiConfig.providers[aiConfig.activeProvider].temperature,
        maxTokens: aiConfig.providers[aiConfig.activeProvider].maxTokens
      });

      // Check if provider returned error
      if (!providerResponse.content) {
        throw new AppError(
          ErrorCodes.SERVICE_UNAVAILABLE,
          'AI provider temporarily unavailable. Please try again.',
          { providerMeta: providerResponse.meta }
        );
      }

      // Determine if this is first response
      // Note: Using .count() for Mongoose 4.x compatibility (countDocuments added in 5.2.0)
      const messageCount = await this.ChatMessage.count({
        sessionId,
        role: 'assistant',
        active: true
      });
      const isFirstResponse = messageCount === 0;

      // Append disclaimer if needed
      let assistantContent = providerResponse.content;
      assistantContent = appendDisclaimerIfNeeded(
        assistantContent,
        userMessageText,
        isFirstResponse
      );

      // Save assistant message with metadata
      const assistantMessage = await this.ChatMessage.create({
        sessionId,
        role: 'assistant',
        content: assistantContent,
        meta: providerResponse.meta
      });

      // Update session stats
      session.messageCount += 2;  // User + assistant
      session.lastMessageAt = new Date();
      await session.save();

      return {
        userMessage,
        assistantMessage,
        tokenUsage: budgeted.tokenUsage
      };

    } catch (error) {
      // Save error in user message meta
      userMessage.meta = {
        errorCode: error.code || 'SEND_MESSAGE_ERROR',
        error: error.message
      };
      await userMessage.save();

      throw error;
    }
  }

  /**
   * Get paginated messages for a session
   * @param {string} sessionId - Session ID
   * @param {string} cursor - Pagination cursor (message ID)
   * @param {number} limit - Messages per page (max 100)
   * @returns {Promise<Object>} Messages and pagination info
   */
  async getSessionMessages(sessionId, cursor = null, limit = 50) {
    limit = Math.min(limit, 100);  // Cap at 100

    const query = {
      sessionId,
      active: true
    };

    if (cursor) {
      query._id = { $lt: cursor };
    }

    const messages = await this.ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)  // Fetch one extra to determine if there are more
      .lean();

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();  // Remove extra message
    }

    const nextCursor = hasMore && messages.length > 0
      ? messages[messages.length - 1]._id
      : null;

    // Reverse to chronological order
    messages.reverse();

    // Note: Using .count() for Mongoose 4.x compatibility (countDocuments added in 5.2.0)
    const total = await this.ChatMessage.count({
      sessionId,
      active: true
    });

    return {
      items: messages,
      pagination: {
        total,
        limit,
        nextCursor,
        hasMore
      }
    };
  }

  /**
   * Get user's chat sessions
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters (familyMemberId, contextType, status)
   * @returns {Promise<Array>} List of sessions
   */
  async getUserSessions(userId, filters = {}) {
    const query = { userId };

    if (filters.familyMemberId) {
      query.familyMemberId = filters.familyMemberId;
    }

    if (filters.contextType) {
      query.contextType = filters.contextType;
    }

    if (filters.status) {
      query.status = filters.status;
    }

    const sessions = await this.ChatSession.find(query)
      .sort({ lastMessageAt: -1 })
      .lean();

    return sessions;
  }

  /**
   * Update session metadata (e.g., rename)
   * @param {string} sessionId - Session ID
   * @param {Object} updates - Updates to apply
   * @returns {Promise<Object>} Updated session
   */
  async updateSession(sessionId, updates) {
    // Only allow updating title for now
    const allowedUpdates = {};
    if (updates.title) {
      allowedUpdates.title = updates.title;
    }

    const session = await this.ChatSession.findByIdAndUpdate(
      sessionId,
      allowedUpdates,
      { new: true }
    );

    if (!session) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found');
    }

    return session;
  }

  /**
   * Archive a chat session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Archived session
   */
  async archiveSession(sessionId) {
    const session = await this.ChatSession.findByIdAndUpdate(
      sessionId,
      { status: 'ARCHIVED' },
      { new: true }
    );

    if (!session) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found');
    }

    return session;
  }

  /**
   * Delete a chat session and all its messages
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  async deleteSession(sessionId) {
    const session = await this.ChatSession.findById(sessionId);
    if (!session) {
      throw new AppError(ErrorCodes.NOT_FOUND, 'Chat session not found');
    }

    // Delete all messages
    await this.ChatMessage.deleteMany({ sessionId });

    // Delete session
    await this.ChatSession.findByIdAndRemove(sessionId);
  }

  /**
   * Retry last failed message
   * @param {string} sessionId - Session ID
   * @returns {Promise<Object>} Retry result
   */
  async retryLastMessage(sessionId) {
    // Find last user message
    const lastUserMessage = await this.ChatMessage.findOne({
      sessionId,
      role: 'user',
      active: true
    }).sort({ createdAt: -1 });

    if (!lastUserMessage) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'No message to retry');
    }

    // Check if last assistant message failed
    const lastAssistantMessage = await this.ChatMessage.findOne({
      sessionId,
      role: 'assistant',
      active: true
    }).sort({ createdAt: -1 });

    const shouldRetry = !lastAssistantMessage ||
      lastAssistantMessage.meta?.errorCode ||
      lastAssistantMessage.createdAt < lastUserMessage.createdAt;

    if (!shouldRetry) {
      throw new AppError(ErrorCodes.VALIDATION_ERROR, 'Last message did not fail');
    }

    // Retry by sending the same user message
    return await this.sendMessage(sessionId, lastUserMessage.content);
  }

  // ============ Private Helper Methods ============

  /**
   * Generate session title based on context
   * @private
   */
  _generateTitle(contextType, contextId, contextData) {
    const date = new Date().toLocaleDateString();

    switch (contextType) {
      case 'VISIT':
        return `Chat about Visit on ${date}`;
      case 'APPOINTMENT':
        return `Chat about Appointment on ${date}`;
      case 'PRESCRIPTION':
        return `Chat about Prescription on ${date}`;
      case 'LAB_REPORT':
        return `Chat about Lab Report on ${date}`;
      case 'GENERAL':
      default:
        return `General Health Chat - ${date}`;
    }
  }
}

module.exports = ChatService;
