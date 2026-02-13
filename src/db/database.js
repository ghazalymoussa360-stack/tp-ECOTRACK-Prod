const { Pool } = require('pg');
const config = require('../config');
const logger = require('../utils/logger');

let pool = null;

const getPool = () => {
  if (!pool) {
    pool = new Pool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      min: config.db.pool.min,
      max: config.db.pool.max,
      idleTimeoutMillis: config.db.pool.idleTimeoutMillis,
      log: (msg) => logger.debug('PG Pool:', msg),
    });

    pool.on('error', (err) => {
      logger.error('Unexpected PG Pool error', err);
    });

    logger.info('Database pool created');
  }
  return pool;
};

const query = async (text, params) => {
  const start = Date.now();
  const pool = getPool();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  logger.debug('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

const getClient = async () => {
  const pool = getPool();
  return pool.connect();
};

const healthCheck = async () => {
  try {
    const result = await query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
};

const getPoolStats = () => {
  const p = getPool();
  return {
    totalCount: p.totalCount,
    idleCount: p.idleCount,
    waitingCount: p.waitingCount,
  };
};

const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    logger.info('Database pool closed');
  }
};

module.exports = {
  query,
  getClient,
  getPool,
  healthCheck,
  getPoolStats,
  closePool,
};
