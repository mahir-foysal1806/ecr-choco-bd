import mongoose from 'mongoose';
import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import './config/cloudinary.js';
import app from './app.js';
import { bootstrap } from './services/bootstrap.js';

await connectDB();
await bootstrap();

const server = app.listen(env.PORT, () => console.log(`ECR Choco BD API listening on :${env.PORT} (${env.NODE_ENV})`));

const shutdown = (sig) => {
  console.log(`${sig} received, shutting down`);
  server.close(async () => {
    await mongoose.connection.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (e) => console.error('Unhandled rejection:', e));
