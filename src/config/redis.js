import Redis from 'ioredis';
import winston from 'winston';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

let redisClient = null;

try {
  redisClient = new Redis(redisUrl, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        winston.warn(`Redis connection retry limit reached. Redis is disabled.`);
        return null; // Stop retrying
      }
      return Math.min(times * 100, 2000);
    }
  });

  redisClient.on('connect', () => {
    winston.info('Redis client connected successfully');
  });

  redisClient.on('error', (err) => {
    winston.error(`Redis error: ${err.message}`);
  });
} catch (error) {
  winston.error(`Redis initialization failed: ${error.message}`);
}

/**
 * Cache data in Redis
 * @param {string} key 
 * @param {any} value 
 * @param {number} ttlInSeconds 
 */
export const setCache = async (key, value, ttlInSeconds = 300) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  try {
    const stringValue = JSON.stringify(value);
    await redisClient.set(key, stringValue, 'EX', ttlInSeconds);
  } catch (error) {
    winston.error(`Redis setCache error: ${error.message}`);
  }
};

/**
 * Get data from Redis cache
 * @param {string} key 
 * @returns {any|null}
 */
export const getCache = async (key) => {
  if (!redisClient || redisClient.status !== 'ready') return null;
  try {
    const value = await redisClient.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    winston.error(`Redis getCache error: ${error.message}`);
    return null;
  }
};

/**
 * Delete cache key(s) from Redis
 * @param {string|string[]} keys 
 */
export const deleteCache = async (keys) => {
  if (!redisClient || redisClient.status !== 'ready') return;
  try {
    if (Array.isArray(keys)) {
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } else {
      await redisClient.del(keys);
    }
  } catch (error) {
    winston.error(`Redis deleteCache error: ${error.message}`);
  }
};

export const cacheService = {
  getCache,
  setCache,
  deleteCache,
};

export default redisClient;
