import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import User from '../models/User.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

export const signToken = (id) => jwt.sign({ id }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });

const extract = (req) => {
  const h = req.headers.authorization;
  return h && h.startsWith('Bearer ') ? h.slice(7) : null;
};

export const protect = asyncHandler(async (req, res, next) => {
  const token = extract(req);
  if (!token) throw new AppError('Please log in to continue', 401);
  const { id } = jwt.verify(token, env.JWT_SECRET);
  const user = await User.findById(id);
  if (!user || !user.isActive) throw new AppError('Account not found or disabled', 401);
  req.user = user;
  next();
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = extract(req);
  if (token) {
    try {
      const { id } = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(id);
      if (user && user.isActive) req.user = user;
    } catch { /* ignore invalid token for optional auth */ }
  }
  next();
});

export const restrictTo = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError('You do not have permission to perform this action', 403));

export const adminOnly = [protect, restrictTo('admin')];
