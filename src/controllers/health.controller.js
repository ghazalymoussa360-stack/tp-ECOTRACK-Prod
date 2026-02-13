const db = require('../db/database');
const redis = require('../utils/redis');
const config = require('../config');

const healthController = {
  async general(req, res) {
    const health = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: config.env,
      memory: process.memoryUsage(),
    };

    res.status(200).json(health);
  },

  async db(req, res) {
    try {
      const isHealthy = await db.healthCheck();
      
      if (isHealthy) {
        const stats = db.getPoolStats();
        res.status(200).json({
          status: 'ok',
          database: 'connected',
          pool: stats,
        });
      } else {
        res.status(503).json({
          status: 'error',
          database: 'disconnected',
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        database: 'error',
        message: error.message,
      });
    }
  },

  async redis(req, res) {
    try {
      const isHealthy = await redis.healthCheck();
      
      if (isHealthy) {
        res.status(200).json({
          status: 'ok',
          redis: 'connected',
        });
      } else {
        res.status(503).json({
          status: 'error',
          redis: 'disconnected',
        });
      }
    } catch (error) {
      res.status(503).json({
        status: 'error',
        redis: 'error',
        message: error.message,
      });
    }
  },
};

module.exports = healthController;
