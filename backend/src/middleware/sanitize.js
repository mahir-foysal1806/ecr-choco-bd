'use strict';

/**
 * Hand written NoSQL injection guard (express-mongo-sanitize is incompatible with Express 5
 * and we do not want the dependency). Removes keys that start with "$" or contain "."
 * from req.body, req.query and req.params, in place and recursively.
 */
const isBadKey = (key) => key.startsWith('$') || key.includes('.');

const clean = (value, depth = 0) => {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    value.forEach((item, i) => {
      value[i] = clean(item, depth + 1);
    });
    return value;
  }
  Object.keys(value).forEach((key) => {
    if (isBadKey(key)) {
      delete value[key];
    } else {
      value[key] = clean(value[key], depth + 1);
    }
  });
  return value;
};

const sanitize = (req, res, next) => {
  ['body', 'query', 'params'].forEach((part) => {
    if (req[part] && typeof req[part] === 'object') clean(req[part]);
  });
  next();
};

/** Simple HTTP parameter pollution guard: repeated query keys collapse to the last value. */
const preventPollution = (req, res, next) => {
  if (req.query) {
    Object.keys(req.query).forEach((key) => {
      if (Array.isArray(req.query[key])) {
        req.query[key] = req.query[key][req.query[key].length - 1];
      }
    });
  }
  next();
};

module.exports = { sanitize, preventPollution };
