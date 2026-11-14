import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export function uploadBuffer(buffer, folder = 'ecr-choco-bd') {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: 'image', quality: 'auto', fetch_format: 'auto' },
      (err, res) => (err ? reject(err) : resolve({ url: res.secure_url, publicId: res.public_id }))
    );
    stream.end(buffer);
  });
}

export async function destroyImages(publicIds = []) {
  await Promise.allSettled(publicIds.filter(Boolean).map((id) => cloudinary.uploader.destroy(id)));
}

export default cloudinary;
