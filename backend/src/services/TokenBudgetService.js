// src/services/TokenBudgetService.js
const { encoding_for_model } = require('tiktoken');

class TokenBudgetService {
  constructor() {
    this.encoders = new Map();
  }

  /**
   * Get encoder for a specific model
   * @param {string} model - Model name
   * @returns {Tiktoken} Encoder instance
   */
  getEncoder(model) {
    if (!this.encoders.has(model)) {
      try {
        this.encoders.set(model, encoding_for_model(model));
      } catch {
        // Fallback to gpt-4 encoder for unknown models
        this.encoders.set(model, encoding_for_model('gpt-4'));
      }
    }
    return this.encoders.get(model);
  }

  /**
   * Count tokens in a text string
   * @param {string} text - Text to count tokens for
   * @param {string} model - Model name (default: 'gpt-4')
   * @returns {number} Token count
   */
  countTokens(text, model = 'gpt-4') {
    if (!text) return 0;
    const encoder = this.getEncoder(model);
    return encoder.encode(text).length;
  }

  /**
   * Budget tokens for a conversation
   * Allocates tokens between system prompt, context, history, and user message
   * @param {Object} params
   * @param {string} params.systemPrompt - System prompt text
   * @param {string} params.contextText - Context text (visit EMR, appointment, etc.)
   * @param {Array} params.messages - Previous messages
   * @param {string} params.userMessage - New user message
   * @param {string} params.model - Model name (default: 'gpt-4')
   * @param {number} params.maxContextTokens - Max tokens for entire context (default: 6000)
   * @param {number} params.reserveForResponse - Tokens to reserve for response (default: 2000)
   * @returns {Object} Budgeted conversation parts with token usage
   */
  budgetConversation(params) {
    const {
      systemPrompt,
      contextText = '',
      messages = [],
      userMessage,
      model = 'gpt-4',
      maxContextTokens = 6000,  // Leave room for 2K response
      reserveForResponse = 2000
    } = params;

    const budget = maxContextTokens - reserveForResponse;

    // Fixed costs (can't truncate)
    const systemTokens = this.countTokens(systemPrompt, model);
    const userMessageTokens = this.countTokens(userMessage, model);
    const fixedCost = systemTokens + userMessageTokens;

    if (fixedCost > budget) {
      throw new Error(`System prompt + user message exceeds budget: ${fixedCost} > ${budget}`);
    }

    const remaining = budget - fixedCost;

    // Split remaining budget: 60% context, 40% history
    const contextBudget = Math.floor(remaining * 0.6);
    const historyBudget = Math.floor(remaining * 0.4);

    // Truncate context if needed
    const truncatedContext = this.truncateToTokenLimit(
      contextText,
      contextBudget,
      model
    );

    // Truncate history (keep most recent messages)
    const truncatedHistory = this.truncateHistory(
      messages,
      historyBudget,
      model
    );

    const contextTokens = this.countTokens(truncatedContext, model);
    const historyTokens = truncatedHistory.reduce((sum, msg) =>
      sum + this.countTokens(msg.content, model), 0
    );

    return {
      systemPrompt,
      context: truncatedContext,
      history: truncatedHistory,
      userMessage,
      tokenUsage: {
        system: systemTokens,
        context: contextTokens,
        history: historyTokens,
        userMessage: userMessageTokens,
        total: systemTokens + contextTokens + historyTokens + userMessageTokens,
        budget: budget,
        remaining: budget - (systemTokens + contextTokens + historyTokens + userMessageTokens)
      }
    };
  }

  /**
   * Truncate text to fit within token limit
   * @param {string} text - Text to truncate
   * @param {number} maxTokens - Maximum tokens allowed
   * @param {string} model - Model name
   * @returns {string} Truncated text
   */
  truncateToTokenLimit(text, maxTokens, model) {
    if (!text) return '';

    const encoder = this.getEncoder(model);
    const tokens = encoder.encode(text);

    if (tokens.length <= maxTokens) {
      return text;
    }

    // Truncate and add indicator
    const truncatedTokens = tokens.slice(0, maxTokens - 20);
    const truncated = encoder.decode(truncatedTokens);
    return truncated + '\n\n[...context truncated due to length...]';
  }

  /**
   * Truncate message history to fit within token limit
   * Keeps most recent messages
   * @param {Array} messages - Array of message objects with role and content
   * @param {number} maxTokens - Maximum tokens allowed for history
   * @param {string} model - Model name
   * @returns {Array} Truncated message array
   */
  truncateHistory(messages, maxTokens, model) {
    if (!messages || messages.length === 0) return [];

    const result = [];
    let tokenCount = 0;

    // Process messages in reverse (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = this.countTokens(msg.content, model);

      if (tokenCount + msgTokens > maxTokens) {
        break;
      }

      result.unshift(msg);
      tokenCount += msgTokens;
    }

    return result;
  }
}

module.exports = new TokenBudgetService();
