import 'dotenv/config';
import { z } from 'zod';

const bool = z.enum(['true', 'false']).default('false').transform((v) => v === 'true');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  API_PORT: z.coerce.number().default(5000),
  MONGODB_URI: z.string().min(10, 'MONGODB_URI is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  CLIENT_URL: z.string().min(1, 'CLIENT_URL is required (comma separated for multiple)'),
  API_PUBLIC_URL: z.string().optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),
  ADMIN_NAME: z.string().default('ECR Admin'),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(8),
  SSLCOMMERZ_STORE_ID: z.string().optional().default(''),
  SSLCOMMERZ_STORE_PASSWORD: z.string().optional().default(''),
  SSLCOMMERZ_IS_LIVE: bool,
  BKASH_APP_KEY: z.string().optional().default(''),
  BKASH_APP_SECRET: z.string().optional().default(''),
  BKASH_USERNAME: z.string().optional().default(''),
  BKASH_PASSWORD: z.string().optional().default(''),
  BKASH_IS_LIVE: bool,
  META_PIXEL_ID: z.string().optional().default(''),
  META_CAPI_TOKEN: z.string().optional().default(''),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('\nInvalid environment configuration:');
  for (const issue of parsed.error.issues) console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
  console.error('\nCopy .env.example to .env and fill in all required values.\n');
  process.exit(1);
}

export const env = parsed.data;
env.clientOrigins = env.CLIENT_URL.split(',').map((s) => s.trim().replace(/\/$/, ''));
env.PUBLIC_SITE_URL = env.clientOrigins[0];
env.API_URL = (env.API_PUBLIC_URL || env.PUBLIC_SITE_URL).replace(/\/$/, '');
env.sslEnabled = Boolean(env.SSLCOMMERZ_STORE_ID && env.SSLCOMMERZ_STORE_PASSWORD);
env.bkashEnabled = Boolean(env.BKASH_APP_KEY && env.BKASH_APP_SECRET && env.BKASH_USERNAME && env.BKASH_PASSWORD);
