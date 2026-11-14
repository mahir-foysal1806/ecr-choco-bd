import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CategoriesApi } from '../../api';
import { Skeleton } from '../ui';
import SectionHeading from './SectionHeading.jsx';

export default function CategoryShowcase() {
  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: () => CategoriesApi.list().then((r) => r.data), staleTime: 300000 });
  if (!isLoading && !(data || []).length) return null;
  return (
    <section className="container-x mt-12">
      <SectionHeading title="Shop by category" sub="Chocolates, dates, nuts and more" to="/shop" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="aspect-[4/3]" />)
          : data.map((c) => (
              <Link key={c._id} to={`/category/${c.slug}`} className="group relative block aspect-[4/3] overflow-hidden rounded-xl bg-brand-100 shadow-card">
                {c.image?.url ? (
                  <img src={c.image.url} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-brand-700 to-brand-500" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-900/85 via-brand-900/20 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-3 sm:p-4">
                  <p className="text-sm font-bold text-white sm:text-lg">{c.name}</p>
                  {c.nameBn && <p className="font-bn text-xs text-gold-200 sm:text-sm">{c.nameBn}</p>}
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
