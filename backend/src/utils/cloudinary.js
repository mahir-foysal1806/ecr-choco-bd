'use strict';

const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');
const AppError = require('./AppError');

const ensureConfigured = () => {
  if (!isCloudinaryConfigured) {
    throw new AppError('Image uploads are not configured on the server', 503);
  }
};

/** Upload one in-memory buffer via upload_stream. Resolves { url, publicId }. */
const uploadBuffer = (buffer, folder = 'ecr-choco-bd') => {
  ensureConfigured();
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', transformation: [{ quality: 'auto', fetch_format: 'auto' }] },
      (err, result) => {
        if (err) return reject(new AppError('Image upload failed', 502));
        return resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
};

/** Upload many multer files in parallel. On partial failure, already uploaded images are removed. */
const uploadMany = async (files = [], folder) => {
  if (files.length === 0) return [];
  const settled = await Promise.allSettled(files.map((f) => uploadBuffer(f.buffer, folder)));
  const ok = settled.filter((s) => s.status === 'fulfilled').map((s) => s.value);
  const failed = settled.find((s) => s.status === 'rejected');
  if (failed) {
    await deleteImages(ok.map((i) => i.publicId));
    throw failed.reason;
  }
  return ok;
};

/** Best effort deletion; never throws. */
const deleteImages = async (publicIds = []) => {
  if (!isCloudinaryConfigured) return;
  const ids = publicIds.filter(Boolean);
  await Promise.allSettled(ids.map((id) => cloudinary.uploader.destroy(id)));
};

module.exports = { uploadBuffer, uploadMany, deleteImages };
