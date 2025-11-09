// src/services/ai/AIProviderInterface.js

/**
 * Base interface for AI providers
 * All AI providers must extend this class and implement the chat() method
 */
class AIProviderInterface {
  /**
   * Send a chat completion request to the AI provider
   * @param {Array} messages - Array of message objects with role and content
   * @param {Object} options - Provider-specific options (temperature, maxTokens, etc.)
   * @returns {Promise<Object>} Response object with content and metadata
   *   {
   *     content: string,
   *     meta: {
   *       provider: string,
   *       model: string,
   *       latencyMs: number,
   *       tokens: { prompt: number, completion: number, total: number },
   *       errorCode?: string,
   *       error?: string
   *     }
   *   }
   */
  async chat(messages, options = {}) {
    throw new Error('chat() method must be implemented by provider');
  }

  /**
   * Get the provider name
   * @returns {string} Provider name
   */
  getName() {
    throw new Error('getName() method must be implemented by provider');
  }
}

module.exports = AIProviderInterface;
