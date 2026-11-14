import { Helmet } from 'react-helmet-async';
import { SITE_URL } from '../lib/format.js';

export default function SEO({ title, description, image, path, type = 'website', jsonLd, noindex }) {
  const full = title ? `${title} | ECR Choco BD` : 'ECR Choco BD | Premium Chocolates, Nuts and Dates in Bangladesh';
  const url = path !== undefined ? `${SITE_URL}${path}` : undefined;
  const img = image && image.startsWith('/') ? `${SITE_URL}${image}` : image;
  return (
    <Helmet>
      <title>{full}</title>
      {description && <meta name="description" content={description} />}
      {url && <link rel="canonical" href={url} />}
      <meta property="og:title" content={full} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:type" content={type} />
      {url && <meta property="og:url" content={url} />}
      {img && <meta property="og:image" content={img} />}
      <meta name="twitter:card" content={img ? 'summary_large_image' : 'summary'} />
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
