# ECR Choco BD – API Contract (source of truth for backend + frontend)

Base URL: `/api` (frontend calls relative `/api`; nginx proxies to backend:5000, Vite dev proxy does the same).
All responses: `{ success: boolean, data?: any, message?: string, meta?: {page,limit,total,pages} }`.
Auth: `Authorization: Bearer <jwt>`. JWT payload `{ id, role }`. Roles: `customer | admin`.
Money: integers in BDT (taka).

## Models (Mongoose)
- User: name, email(unique,sparse), phone(unique), password(select:false), role, addresses[{label,name,phone,address,area:'inside_dhaka'|'outside_dhaka',isDefault}]
- Category: name, nameBn, slug(unique), image{url,publicId}, order, isActive
- Product: name, nameBn, slug(unique), description, category(ref), images[{url,publicId}],
  variants[{label:'250g', weightGrams, price, comparePrice, stock, sku}], basePrice(min variant price, indexed),
  isFeatured, isBestSeller, isGiftItem (usable in gift box builder), flashDeal{active, discountPercent, endsAt},
  ratingAvg, ratingCount, totalSold, lowStockThreshold(default 10), isActive. Text index on name,nameBn,description.
- Review: product, user, name, rating 1-5, comment, isVerifiedPurchase. Unique (product,user).
- Coupon: code(upper, unique), type:'percent'|'fixed', value, minOrder, maxDiscount, usageLimit, usedCount, expiresAt, isActive
- Banner: title, subtitle, ctaText, ctaLink, image{url,publicId}, order, isActive, placement:'hero'|'announcement'
- Setting (singleton key 'site'): hotline, whatsapp, messengerUsername, email, address, facebook, instagram, youtube,
  deliveryChargeInsideDhaka(default 60), deliveryChargeOutsideDhaka(default 120), freeDeliveryThreshold(default 0=off),
  announcement, metaPixelId
- Order: orderNumber('ECR-YYMMDD-XXXX'), user(optional), customer{name,phone,email,address,area,note},
  items[{product,name,variantLabel,price,quantity,image, giftBoxItems?[{product,name,variantLabel,quantity}]}],
  isGiftBox(bool), subtotal, discount, couponCode, shippingFee, total,
  paymentMethod:'cod'|'sslcommerz'|'bkash', paymentStatus:'unpaid'|'paid'|'failed'|'refunded', transactionId,
  status:'pending'|'processing'|'shipped'|'delivered'|'cancelled', statusHistory[{status,at,note}]

## Public endpoints
- GET  /health
- GET  /settings                       -> site settings
- GET  /banners?placement=hero         -> active banners sorted by order
- GET  /categories                     -> active categories
- GET  /products?page&limit&category(slug)&search&minPrice&maxPrice&inStock(true|false)&sort(newest|price_asc|price_desc|popular|rating)&featured&bestSeller&flash&giftItem
- GET  /products/suggest?q=            -> up to 6 {_id,name,slug,image,basePrice} (autocomplete)
- GET  /products/:slug                 -> product (category populated) + related[] (up to 4)
- GET  /products/:id/reviews
- POST /coupons/validate               {code, subtotal} -> {code, discount, type, value}
- POST /orders                         guest or authed; body {customer:{name,phone,email?,address,area,note?}, items:[{productId,variantLabel,quantity}], giftBox?:{boxName, items:[{productId,variantLabel,quantity}]}, couponCode?, paymentMethod}
                                       server recomputes prices/shipping/discount; returns order (incl. orderNumber)
- GET  /orders/track/:orderNumber?phone=  -> order (phone must match)
- GET  /orders/:id/invoice?token=      -> PDF stream (token = order.invoiceToken returned at creation; admin bearer also works)
- POST /payments/sslcommerz/init {orderId} -> {gatewayUrl}  (readiness: returns 501-style message if keys missing)
- POST /payments/sslcommerz/success|fail|cancel|ipn  (gateway callbacks)
- POST /payments/bkash/create {orderId}, /payments/bkash/execute (readiness stubs with clear TODO)
- POST /analytics/meta-event {eventName, eventId, userData, customData} -> Meta Conversions API relay (no-op if not configured)

## Auth
- POST /auth/register {name, phone, email?, password}
- POST /auth/login {identifier(phone|email), password} -> {user, token}
- GET  /auth/me ; PUT /auth/me {name,email,phone} ; PUT /auth/password {currentPassword,newPassword}
- POST /auth/addresses ; PUT /auth/addresses/:addressId ; DELETE /auth/addresses/:addressId
## Customer (auth)
- GET  /orders/mine
- POST /products/:id/reviews {rating, comment}
## Admin (auth + role admin), prefix /admin
- GET  /admin/stats?range=7|30|90  -> {revenue, orders, customers, pendingOrders, lowStock[], salesTrend[{date,revenue,orders}], topProducts[], statusBreakdown{}}
- GET  /admin/orders?page&limit&status&search&from&to ; GET /admin/orders/:id ; PATCH /admin/orders/:id/status {status,note} ; PATCH /admin/orders/:id/payment {paymentStatus}
- Products: GET /admin/products?page&search&lowStock ; POST /admin/products (multipart: fields + `images`[] ; `variants` JSON string) ; PUT /admin/products/:id (multipart, `removeImages` JSON array of publicIds) ; DELETE /admin/products/:id
- Categories: GET/POST/PUT/DELETE /admin/categories (multipart `image`)
- Banners: GET/POST/PUT/DELETE /admin/banners (multipart `image`) ; PUT /admin/banners/reorder {ids:[...]}
- Coupons: GET/POST/PUT/DELETE /admin/coupons
- Settings: PUT /admin/settings
- Customers: GET /admin/customers?page&search

## Seed
`npm run seed` creates admin (ADMIN_EMAIL/ADMIN_PASSWORD env, phone 01700000000), 4 categories, sample products (no images -> placeholder), settings, 2 coupons (WELCOME10, ECR50).
