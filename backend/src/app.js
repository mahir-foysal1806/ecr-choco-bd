import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { productSeo, categorySeo, homeSeo } from './controllers/seoController.js';

const app = express();
app.set('trust proxy', 1); // behind nginx / a reverse proxy
app.disable('x-powered-by');

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || env.clientOrigins.includes(origin)),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })
);
app.use(compression());
if (env.NODE_ENV !== 'test') app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' })); // SSLCommerz posts form data
app.use(mongoSanitize()); // strips $ and . operators from body/query/params

app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 600, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many requests. Please slow down.' } }));
app.use('/api', routes);

// Crawler-friendly Open Graph pages (nginx routes social bots here)
app.get('/seo/product/:slug', productSeo);
app.get('/seo/category/:slug', categorySeo);
app.get('/seo/', homeSeo);

app.use(notFound);
app.use(errorHandler);

export default app;
