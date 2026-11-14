import rateLimit from 'express-rate-limit';

const make = (windowMs, limit, message) =>
  rateLimit({ windowMs, limit, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });

export const authLimiter = make(15 * 60 * 1000, 20, 'Too many attempts. Please try again in 15 minutes.');
export const orderLimiter = make(60 * 60 * 1000, 20, 'Too many orders from this network. Please try again later.');
export const reviewLimiter = make(60 * 60 * 1000, 15, 'Too many submissions. Please try again later.');
export const trackLimiter = make(15 * 60 * 1000, 40, 'Too many lookups. Please try again later.');
