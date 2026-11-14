import ProductCard from './ProductCard.jsx';

export default function ProductGrid({ products, className = 'grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4' }) {
  return (
    <div className={className}>
      {products.map((p) => (
        <ProductCard key={p._id} product={p} />
      ))}
    </div>
  );
}
