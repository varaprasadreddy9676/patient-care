const mongoose = require("mongoose");
const crypto = require("crypto");

const cacheSchema = new mongoose.Schema({
    key: { type: String, required: true, unique: true },
    value: { type: mongoose.Schema.Types.Mixed, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
});

cacheSchema.index({ "expiresAt": 1 }, { expireAfterSeconds: 0 });

const Cache = mongoose.model("Cache", cacheSchema);

class MongoCacheService {
    constructor(logger, defaultTTL = 3600) {  // defaultTTL is in seconds, 3600 seconds = 60 minutes
        this.logger = logger;
        this.defaultTTL = defaultTTL; // Configurable TTL, defaults to 30 minutes
    }

    /**
     * Generates a unique cache key based on the parameters provided.
     * @param {object} params - The parameters used to generate the cache key.
     * @returns {string} - The generated cache key.
     */
    generateCacheKey(params) {
        const keyComponents = [
            params.code,
            params.entityParentCode,
            params.fromDBDateTime,
            params.toDBDateTime,
            params.page
        ];

        const rawKey = keyComponents.join(":");
        const hash = crypto.createHash("sha256").update(rawKey).digest("hex");

        return `dataExport:${hash}`;
    }

        /**
     * Generates a unique cache key based on the parameters provided.
     * @param {object} params - The parameters used to generate the cache key.
     * @returns {string} - The generated cache key.
     */
        generateCountCacheKey(params) {
            const keyComponents = [
                params.code,
                params.entityParentCode,
                params.fromDBDateTime,
                params.toDBDateTime
            ];
    
            const rawKey = keyComponents.join(":");
            const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
    
            return `dataExport:${hash}`;
        }

    /**
     * Retrieves a value from the cache by key.
     * @param {string} key - The key of the cache entry.
     * @returns {Promise<*>} - The cached value, or null if not found or expired.
     */
    async get(key) {
        try {
            const cacheEntry = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
            if (cacheEntry) {
                this.logger.info(`Cache hit for key: ${key}`);
                return cacheEntry.value;
            } else {
                this.logger.info(`Cache miss for key: ${key}`);
                return null;
            }
        } catch (error) {
            this.logger.error(`Error fetching from cache: ${error.message}`);
            return null;
        }
    }

    /**
     * Stores a value in the cache under a given key.
     * @param {string} key - The key under which the value should be stored.
     * @param {*} value - The value to store in the cache.
     * @param {number} [ttl] - Optional TTL in seconds. Defaults to the service's default TTL.
     */
    async set(key, value, ttl = this.defaultTTL) {
        const expiresAt = new Date(Date.now() + ttl * 1000);
        try {
            await Cache.findOneAndUpdate(
                { key },
                { value, createdAt: Date.now(), expiresAt },
                { upsert: true }
            );
            this.logger.info(`Cached value for key: ${key} with TTL: ${ttl} seconds`);
        } catch (error) {
            this.logger.error(`Error setting cache: ${error.message}`);
        }
    }

    /**
     * Deletes a value from the cache by key.
     * @param {string} key - The key of the cache entry to delete.
     */
    async delete(key) {
        try {
            await Cache.deleteOne({ key });
            this.logger.info(`Deleted cache entry for key: ${key}`);
        } catch (error) {
            this.logger.error(`Error deleting cache entry: ${error.message}`);
        }
    }

    /**
     * Clears the entire cache collection. Use with caution.
     */
    async clearCache() {
        try {
            await Cache.deleteMany({});
            this.logger.info(`Cleared all cache entries.`);
        } catch (error) {
            this.logger.error(`Error clearing cache: ${error.message}`);
        }
    }

    /**
     * Implements a write-through cache strategy.
     * Fetches data from the cache or stores the result of a database query directly into the cache.
     * @param {string} key - The cache key.
     * @param {function} queryFn - The database query function to execute if the key is not in the cache.
     * @param {number} [ttl] - Optional TTL in seconds. Defaults to the service's default TTL.
     * @returns {Promise<*>} - The cached or freshly queried value.
     */
    async writeThroughCache(key, queryFn, ttl) {
        const cachedData = await this.get(key);
        if (cachedData) {
            return cachedData;
        }

        const data = await queryFn();
        await this.set(key, data, ttl);
        return data;
    }

    /**
     * Implements a lazy-loading (read-through) cache strategy.
     * Fetches data from the database only when a cache miss occurs.
     * @param {string} key - The cache key.
     * @param {function} queryFn - The database query function to execute if the key is not in the cache.
     * @param {number} [ttl] - Optional TTL in seconds. Defaults to the service's default TTL.
     * @returns {Promise<*>} - The cached or freshly queried value.
     */
    async lazyLoadingCache(key, queryFn, ttl) {
        return this.writeThroughCache(key, queryFn, ttl);
    }

    /**
     * Sets a new default TTL for the cache service.
     * @param {number} ttl - New default TTL in seconds.
     */
    setDefaultTTL(ttl) {
        this.defaultTTL = ttl;
        this.logger.info(`Default TTL set to ${ttl} seconds.`);
    }
}

module.exports = MongoCacheService;
