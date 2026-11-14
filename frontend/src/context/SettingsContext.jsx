import { createContext, useContext, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { SettingsApi } from '../api';

const DEFAULTS = {
  deliveryChargeInsideDhaka: 60,
  deliveryChargeOutsideDhaka: 120,
  freeDeliveryThreshold: 0,
};

const Ctx = createContext({ settings: DEFAULTS, loading: true });

export function SettingsProvider({ children }) {
  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => SettingsApi.get().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const value = useMemo(() => ({ settings: { ...DEFAULTS, ...(data || {}) }, loading: isLoading }), [data, isLoading]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useSettings = () => useContext(Ctx);
