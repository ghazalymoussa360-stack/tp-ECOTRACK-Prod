const rateLimit = require('express-rate-limit');
const config = require('../config');

const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.rateLimit.authMax,
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again in 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const createMeasurementsLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many measurement submissions, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? `${req.ip}-${req.user.userId}` : req.ip;
  },
});

module.exports = {
  generalLimiter,
  authLimiter,
  createMeasurementsLimiter,
};
