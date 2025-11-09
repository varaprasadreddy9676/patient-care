// src/services/ai/providers/OpenAIProvider.js
const AIProviderInterface = require('../AIProviderInterface');
const axios = require('axios');
const { withBackoff } = require('../../../utils/RetryHelper');

class OpenAIProvider extends AIProviderInterface {
  constructor(apiKey, defaultModel = 'gpt-4') {
    super();

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.apiKey = apiKey;
    this.defaultModel = defaultModel;
    this.baseURL = 'https://api.openai.com/v1';
  }

  getName() {
    return 'openai';
  }

  async chat(messages, options = {}) {
    const startTime = Date.now();

    const makeRequest = async () => {
      try {
        const response = await axios.post(
          `${this.baseURL}/chat/completions`,
          {
            model: options.model || this.defaultModel,
            messages: messages,
            temperature: options.temperature || 0.7,
            max_tokens: options.maxTokens || 1500
          },
          {
            headers: {
              'Authorization': `Bearer ${this.apiKey}`,
              'Content-Type': 'application/json'
            },
            timeout: 30000  // 30 second timeout
          }
        );

        const latencyMs = Date.now() - startTime;

        if (response.data?.choices?.[0]?.message?.content) {
          return {
            content: response.data.choices[0].message.content,
            meta: {
              provider: 'openai',
              model: response.data.model || this.defaultModel,
              latencyMs: latencyMs,
              tokens: {
                prompt: response.data.usage?.prompt_tokens || 0,
                completion: response.data.usage?.completion_tokens || 0,
                total: response.data.usage?.total_tokens || 0
              }
            }
          };
        }

        throw new Error('Invalid response from OpenAI');

      } catch (error) {
        // Determine if error is retryable
        const isRetryable =
          error.code === 'ECONNABORTED' ||  // Timeout
          error.code === 'ETIMEDOUT' ||
          (error.response?.status >= 500) || // Server errors
          error.response?.status === 429;    // Rate limit

        if (error.response) {
          const errorMessage = error.response.data?.error?.message || error.message;
          const enhancedError = new Error(`OpenAI API Error: ${errorMessage}`);
          enhancedError.status = error.response.status;
          enhancedError.isRetryable = isRetryable;
          throw enhancedError;
        }

        error.isRetryable = isRetryable;
        throw error;
      }
    };

    // Retry with exponential backoff
    try {
      return await withBackoff(makeRequest, {
        retries: 3,
        baseDelayMs: 250,
        maxDelayMs: 5000,
        shouldRetry: (err) => err.isRetryable
      });
    } catch (error) {
      console.error('OpenAI Provider Error after retries:', error.message);

      // Return error metadata
      return {
        content: null,
        meta: {
          provider: 'openai',
          model: this.defaultModel,
          latencyMs: Date.now() - startTime,
          tokens: { prompt: 0, completion: 0, total: 0 },
          errorCode: error.status || 'PROVIDER_ERROR',
          error: error.message
        }
      };
    }
  }
}

module.exports = OpenAIProvider;
