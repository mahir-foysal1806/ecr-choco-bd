import { uploadBuffer } from '../config/cloudinary.js';
import { AppError, asyncHandler } from '../utils/AppError.js';

const FOLDERS = ['products', 'banners', 'categories'];

export const uploadImages = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new AppError('No image received', 400);
  const folder = FOLDERS.includes(req.query.folder) ? req.query.folder : 'products';
  const images = await Promise.all(req.files.map((f) => uploadBuffer(f.buffer, `ecr-choco-bd/${folder}`)));
  res.status(201).json({ success: true, images });
});
