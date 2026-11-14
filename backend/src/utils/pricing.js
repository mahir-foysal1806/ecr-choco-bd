export const flashActive = (p) =>
  Boolean(p.flashSale?.enabled && p.flashSale.endsAt && new Date(p.flashSale.endsAt) > new Date() && p.flashSale.discountPercent > 0);

export const unitPrice = (p, v) => (flashActive(p) ? Math.round(v.price * (1 - p.flashSale.discountPercent / 100)) : v.price);

export const decorate = (p) => ({
  ...p,
  flashActive: flashActive(p),
  variants: (p.variants || []).map((v) => ({ ...v, salePrice: unitPrice(p, v) })),
});
