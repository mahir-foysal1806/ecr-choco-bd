import { z } from 'zod';
import User from '../models/User.js';
import { signToken } from '../middleware/auth.js';
import { AppError, asyncHandler } from '../utils/helpers.js';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email(),
  phone: z.string().trim().min(10).max(20).optional(),
  password: z.string().min(8).max(100),
});
export const loginSchema = z.object({ email: z.string().trim().email(), password: z.string().min(1) });

const out = (u) => ({ id: u._id, name: u.name, email: u.email, phone: u.phone, role: u.role, addresses: u.addresses });

export const register = asyncHandler(async (req, res) => {
  if (await User.exists({ email: req.body.email.toLowerCase() })) throw new AppError('An account with this email already exists', 409);
  const user = await User.create({ ...req.body, role: 'customer' });
  res.status(201).json({ success: true, token: signToken(user._id), user: out(user) });
});

export const login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(req.body.password))) throw new AppError('Invalid email or password', 401);
  if (!user.isActive) throw new AppError('This account has been disabled', 403);
  res.json({ success: true, token: signToken(user._id), user: out(user) });
});

export const me = asyncHandler(async (req, res) => res.json({ success: true, user: out(req.user) }));

export const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body;
  if (name) req.user.name = String(name).slice(0, 80);
  if (phone !== undefined) req.user.phone = String(phone).slice(0, 20);
  await req.user.save();
  res.json({ success: true, user: out(req.user) });
});

export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw new AppError('Current password is incorrect', 400);
  if (!newPassword || newPassword.length < 8) throw new AppError('New password must be at least 8 characters', 400);
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: 'Password updated' });
});

const cleanAddr = (b) => ({ label: b.label, name: b.name, phone: b.phone, address: b.address, area: b.area === 'outside_dhaka' ? 'outside_dhaka' : 'inside_dhaka', isDefault: Boolean(b.isDefault) });

export const addAddress = asyncHandler(async (req, res) => {
  const a = cleanAddr(req.body);
  if (!a.address) throw new AppError('Address is required', 400);
  if (a.isDefault) req.user.addresses.forEach((x) => { x.isDefault = false; });
  req.user.addresses.push(a);
  await req.user.save();
  res.status(201).json({ success: true, addresses: req.user.addresses });
});

export const updateAddress = asyncHandler(async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) throw new AppError('Address not found', 404);
  const a = cleanAddr(req.body);
  if (a.isDefault) req.user.addresses.forEach((x) => { x.isDefault = false; });
  addr.set(a);
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});

export const deleteAddress = asyncHandler(async (req, res) => {
  req.user.addresses.pull({ _id: req.params.id });
  await req.user.save();
  res.json({ success: true, addresses: req.user.addresses });
});
