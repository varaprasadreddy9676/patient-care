// src/utils/RetryHelper.js

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Retry options
 * @param {number} options.retries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelayMs - Base delay in milliseconds (default: 250)
 * @param {number} options.maxDelayMs - Maximum delay in milliseconds (default: 5000)
 * @param {Function} options.shouldRetry - Predicate to determine if error should be retried (default: always retry)
 * @returns {Promise} Result from successful function call
 */
async function withBackoff(fn, options = {}) {
  const {
    retries = 3,
    baseDelayMs = 250,
    maxDelayMs = 5000,
    shouldRetry = (err) => true
  } = options;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      attempt++;

      if (attempt > retries || !shouldRetry(error)) {
        throw error;
      }

      const delay = Math.min(
        baseDelayMs * Math.pow(2, attempt - 1),
        maxDelayMs
      );

      console.log(`Retry ${attempt}/${retries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

module.exports = { withBackoff };
