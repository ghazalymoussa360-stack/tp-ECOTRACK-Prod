const Redis = require('ioredis');
const config = require('../config');
const logger = require('../utils/logger');

let redis = null;

const getRedis = () => {
  if (!redis) {
    redis = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      password: config.redis.password || undefined,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redis.on('connect', () => {
      logger.info('Redis connected');
    });

    redis.on('error', (err) => {
      logger.error('Redis error', err);
    });
  }
  return redis;
};

const cacheGet = async (key) => {
  try {
    const data = await getRedis().get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    logger.warn('Cache get error', { key, error: error.message });
    return null;
  }
};

const cacheSet = async (key, value, ttl = config.redis.ttl.bins) => {
  try {
    await getRedis().setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    logger.warn('Cache set error', { key, error: error.message });
    return false;
  }
};

const cacheDelete = async (key) => {
  try {
    await getRedis().del(key);
    return true;
  } catch (error) {
    logger.warn('Cache delete error', { key, error: error.message });
    return false;
  }
};

const cacheDeletePattern = async (pattern) => {
  try {
    const keys = await getRedis().keys(pattern);
    if (keys.length > 0) {
      await getRedis().del(...keys);
    }
    return true;
  } catch (error) {
    logger.warn('Cache delete pattern error', { pattern, error: error.message });
    return false;
  }
};

const healthCheck = async () => {
  try {
    const result = await getRedis().ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis health check failed', error);
    return false;
  }
};

const closeRedis = async () => {
  if (redis) {
    await redis.quit();
    redis = null;
    logger.info('Redis closed');
  }
};

module.exports = {
  getRedis,
  cacheGet,
  cacheSet,
  cacheDelete,
  cacheDeletePattern,
  healthCheck,
  closeRedis,
};
