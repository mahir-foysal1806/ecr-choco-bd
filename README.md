# ECR Choco BD (ইসিআর চকো বিডি)

Premium chocolates, dates, nuts and custom gift boxes. MERN stack, Dockerised.

- **Frontend**: React (Vite), Tailwind, lucide-react, TanStack Query, react-helmet-async
- **Backend**: Node/Express (MVC), Mongoose on MongoDB Atlas, Cloudinary, JWT + RBAC
- **Payments**: Cash on Delivery, SSLCommerz, bKash (each enabled only when its keys are set)

## Run (Docker)

1. Prepare services: a MongoDB Atlas cluster (allow your server IP in Network Access) and a Cloudinary account.
2. `cp .env.example .env` and fill in `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `CLOUDINARY_*`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
3. `docker compose up --build -d`
4. Open `http://localhost` (or your `WEB_PORT`). Log in at `/login` with the admin credentials; the admin panel is at `/admin`.

On first start the API creates the admin account, default site settings and four categories (Chocolates, Premium Dates, Nuts, Gift Boxes).
Optional demo products (no images): `docker compose exec backend npm run seed:demo`.

The backend refuses to start if required environment variables are missing or invalid.

## Production notes

- Put a TLS terminator (Caddy, Traefik, Cloudflare, or nginx + certbot) in front of the `frontend` container and set `CLIENT_URL` / `API_PUBLIC_URL` to your `https://` domain. Payment gateways need a public HTTPS callback URL.
- Social-share previews: nginx sends Facebook/WhatsApp/Twitter crawlers to `/seo/product/:slug` on the API, which returns server-rendered Open Graph tags (these crawlers do not run JavaScript). Regular visitors get the SPA, with `react-helmet-async` tags.
- Meta Pixel: set the Pixel ID in Admin > Settings. For server-side Conversion API also set `META_CAPI_TOKEN`; the Purchase event uses the order number as `event_id` for de-duplication.
- Invoices (PDF) use a built-in Latin font. For Bangla text in PDFs register a Bengali TTF in `backend/src/services/invoice.js`.
- bKash and SSLCommerz code follows their public sandbox APIs but must be verified end-to-end with your own sandbox credentials before going live.

## Local development

```
cd backend  && cp .env.example .env && npm install && npm run dev    # API on :5000
cd frontend && npm install && npm run dev                            # site on :5173 (proxies /api)
```

## Structure

```
backend/src
  config/       env validation (zod), db, cloudinary
  models/       User, Product, Category, Order, Coupon, Banner, Review, Setting
  controllers/  auth, product, category, order, coupon, banner, review, setting, admin stats, payment, upload, seo
  middleware/   auth + RBAC, validation, error handling, rate limiters, uploads
  services/     pricing + stock, SSLCommerz, bKash, Meta CAPI, PDF invoice
  routes/       all API routes under /api
frontend/src
  pages/        storefront pages; pages/admin/ for the CMS
  components/   header, cart drawer, search, product card, countdown, uploader
  context/      auth, cart
```

## Security summary

helmet, strict CORS allow-list, express-rate-limit (global plus tighter limits on login, orders, tracking, reviews), express-mongo-sanitize, zod validation on every write endpoint, bcrypt (cost 12), prices and stock always computed server-side, atomic stock reservation with rollback, role can never be set from the client.
