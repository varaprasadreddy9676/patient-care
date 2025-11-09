// src/services/ai/AIProviderFactory.js
const OpenAIProvider = require('./providers/OpenAIProvider');
// Future: const AnthropicProvider = require('./providers/AnthropicProvider');
// Future: const GeminiProvider = require('./providers/GeminiProvider');

class AIProviderFactory {
  /**
   * Create AI provider instance with validation
   * @param {string} providerName - Provider name ('openai', 'anthropic', 'gemini')
   * @param {Object} config - Provider configuration
   * @param {string} config.apiKey - API key for the provider
   * @param {string} config.model - Model name (optional)
   * @returns {AIProviderInterface} Provider instance
   */
  static create(providerName, config = {}) {
    const name = (providerName || '').toLowerCase();

    switch (name) {
      case 'openai':
        if (!config.apiKey) {
          throw new Error('OpenAI API key is missing in configuration');
        }
        return new OpenAIProvider(config.apiKey, config.model);

      // Future providers
      // case 'anthropic':
      //   if (!config.apiKey) {
      //     throw new Error('Anthropic API key is missing in configuration');
      //   }
      //   return new AnthropicProvider(config.apiKey, config.model);

      // case 'gemini':
      //   if (!config.apiKey) {
      //     throw new Error('Gemini API key is missing in configuration');
      //   }
      //   return new GeminiProvider(config.apiKey, config.model);

      default:
        throw new Error(`Unknown AI provider: ${providerName}`);
    }
  }
}

module.exports = AIProviderFactory;
