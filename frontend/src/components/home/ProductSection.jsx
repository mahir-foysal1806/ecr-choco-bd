import { useQuery } from '@tanstack/react-query';
import { ProductsApi } from '../../api';
import ProductGrid from '../ProductGrid.jsx';
import { GridSkeleton } from '../ui';
import SectionHeading from './SectionHeading.jsx';

export default function ProductSection({ title, sub, params, to, limit = 8 }) {
  const { data, isLoading } = useQuery({
    queryKey: ['products', 'section', params, limit],
    queryFn: () => ProductsApi.list({ ...params, limit }).then((r) => r.data),
    staleTime: 120000,
  });
  if (!isLoading && !(data || []).length) return null;
  return (
    <section className="container-x mt-12">
      <SectionHeading title={title} sub={sub} to={to} />
      {isLoading ? <GridSkeleton count={limit > 4 ? 4 : limit} /> : <ProductGrid products={data} />}
    </section>
  );
}
