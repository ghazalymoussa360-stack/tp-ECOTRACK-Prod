const logger = require('../utils/logger');
const { AppError } = require('../errors/appErrors');

const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  logger.error({
    message: err.message,
    statusCode: err.statusCode,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      code: err.code,
      message: err.message,
      errors: err.errors,
      stack: err.stack,
    });
  } else {
    if (err.isOperational) {
      res.status(err.statusCode).json({
        success: false,
        status: err.status,
        code: err.code,
        message: err.message,
        errors: err.errors,
      });
    } else {
      res.status(500).json({
        success: false,
        status: 'error',
        code: 'INTERNAL_ERROR',
        message: 'Something went wrong',
      });
    }
  }
};

const notFoundHandler = (req, res, next) => {
  const err = new AppError(`Route ${req.originalUrl} not found`, 404, 'NOT_FOUND');
  next(err);
};

module.exports = {
  errorHandler,
  notFoundHandler,
};
