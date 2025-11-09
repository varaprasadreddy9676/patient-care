// src/config/aiConfig.js

/**
 * AI Provider Configuration
 * This file centralizes all AI provider settings for easy switching
 */

const aiConfig = {
  // Active provider - can be 'openai', 'anthropic', or 'gemini'
  activeProvider: process.env.AI_PROVIDER || 'openai',

  // Provider-specific configurations
  providers: {
    openai: {
      apiKey: "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",
      model: process.env.OPENAI_MODEL || 'gpt-4',
      temperature: 0.7,
      maxTokens: 1500
    },

    anthropic: {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      temperature: 0.7,
      maxTokens: 1500
    },

    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL || 'gemini-pro',
      temperature: 0.7,
      maxTokens: 1500
    }
  },

  // Token budgeting settings
  tokenBudget: {
    // Maximum tokens for the entire context (leaving room for response)
    maxContextTokens: 6000,

    // Tokens to reserve for AI response
    reserveForResponse: 2000,

    // Budget allocation percentages
    allocation: {
      systemPrompt: 'fixed',     // ~200-400 tokens
      context: 0.35,              // 35% of available budget
      history: 0.25,              // 25% of available budget
      userMessage: 'fixed',       // Actual user message length
      response: 0.40              // 40% reserved for response
    }
  },

  // Chat settings
  chat: {
    // Maximum messages to include in conversation history
    maxHistoryMessages: 20,

    // Session timeout (in milliseconds)
    sessionTimeoutMs: 3600000,  // 1 hour

    // Rate limiting
    rateLimit: {
      maxMessagesPerMinute: 10,
      maxMessagesPerHour: 100
    }
  }
};

module.exports = aiConfig;
