'use strict';

const config = require('../config/env');
const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

/** Normalize known library errors into AppError-like shapes. */
const normalize = (err) => {
  if (err instanceof AppError) return err;

  if (err.name === 'CastError') {
    return new AppError(`Invalid ${err.path || 'identifier'}: ${err.value}`, 400);
  }
  if (err.name === 'ValidationError' && err.errors) {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    return new AppError(details[0] ? details[0].message : 'Validation failed', 400, details);
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'field';
    return new AppError(`A record with this ${field} already exists`, 409);
  }
  if (err.name === 'JsonWebTokenError') return new AppError('Invalid token', 401);
  if (err.name === 'TokenExpiredError') return new AppError('Token expired, please log in again', 401);
  if (err.name === 'MulterError') {
    const msg = err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (max 5MB)' : `Upload error: ${err.message}`;
    return new AppError(msg, 400);
  }
  if (err.type === 'entity.parse.failed') return new AppError('Malformed JSON body', 400);
  if (err.type === 'entity.too.large') return new AppError('Request body too large', 413);
  return err;
};

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const e = normalize(err);
  const statusCode = e.statusCode || 500;
  const operational = e instanceof AppError;

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }

  const body = {
    success: false,
    message: operational || !config.isProd ? e.message : 'Something went wrong. Please try again later.',
  };
  if (e.details) body.errors = e.details;
  if (!config.isProd && !operational) body.stack = err.stack;

  res.status(statusCode).json(body);
};

module.exports = { notFound, errorHandler };
