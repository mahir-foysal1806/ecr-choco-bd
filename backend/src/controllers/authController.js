import { z } from 'zod';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/AppError.js';
import { BD_PHONE } from '../utils/helpers.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().toLowerCase().email(),
  phone: z.string().trim().regex(BD_PHONE, 'Enter a valid Bangladeshi mobile number').optional().or(z.literal('')),
  password: z.string().min(8, 'Password must be at least 8 characters').max(100),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
export const profileSchema = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().trim().regex(BD_PHONE).optional().or(z.literal('')) });
export const passwordSchema = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8).max(100) });
export const addressSchema = z.object({
  label: z.string().trim().max(30).default('Home'),
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().regex(BD_PHONE),
  address: z.string().trim().min(8).max(300),
  area: z.enum(['inside_dhaka', 'outside_dhaka']),
  isDefault: z.boolean().optional(),
});

const send = (res, user, status = 200) => res.status(status).json({ success: true, token: signToken(user._id), user: user.toSafe() });

export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email })) throw new AppError('An account with this email already exists', 409);
  const user = await User.create({ ...req.body, role: 'customer' }); // role can never be set by clients
  send(res, user, 201);
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new AppError('Incorrect email or password', 401);
  if (!user.isActive) throw new AppError('This account has been disabled', 403);
  send(res, user);
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, user: req.user.toSafe() }));

export const updateProfile = asyncHandler(async (req, res) => {
  Object.assign(req.user, req.body);
  await req.user.save();
  res.json({ success: true, user: req.user.toSafe() });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.currentPassword))) throw new AppError('Current password is incorrect', 400);
  user.password = req.body.newPassword;
  await user.save();
  send(res, user);
});

export const addAddress = asyncHandler(async (req, res) => {
  if (req.body.isDefault || req.user.addresses.length === 0) {
    req.user.addresses.forEach((a) => (a.isDefault = false));
    req.body.isDefault = true;
  }
  req.user.addresses.push(req.body);
  await req.user.save();
  res.status(201).json({ success: true, user: req.user.toSafe() });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  req.user.addresses.pull({ _id: req.params.id });
  await req.user.save();
  res.json({ success: true, user: req.user.toSafe() });
});
