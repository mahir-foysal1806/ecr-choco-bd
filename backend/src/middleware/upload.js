import multer from 'multer';
import { AppError } from '../utils/AppError.js';

export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024, files: 10 },
  fileFilter: (req, file, cb) =>
    /^image\/(jpe?g|png|webp|avif|gif)$/.test(file.mimetype) ? cb(null, true) : cb(new AppError('Only JPG, PNG, WEBP, AVIF or GIF images are allowed', 400)),
});
