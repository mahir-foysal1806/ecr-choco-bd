import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

export const useSettings = () =>
  useQuery({ queryKey: ['settings'], queryFn: async () => (await api.get('/settings')).data.settings, staleTime: 5 * 60 * 1000 });

export const useCategories = () =>
  useQuery({ queryKey: ['categories'], queryFn: async () => (await api.get('/categories')).data.items, staleTime: 5 * 60 * 1000 });

export const useProducts = (params, opts = {}) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: async () => (await api.get('/products', { params })).data,
    placeholderData: (prev) => prev,
    ...opts,
  });

export function useDebounce(value, delay = 300) {
  const [v, setV] = React.useState(value);
  React.useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}
