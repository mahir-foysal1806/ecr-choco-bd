import { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { get } from '../lib/api';
import { initPixel } from '../lib/pixel';

const Ctx = createContext({});
export const useConfig = () => useContext(Ctx);

export function ConfigProvider({ children }) {
  const { data } = useQuery({ queryKey: ['config'], queryFn: () => get('/config'), staleTime: 5 * 60 * 1000 });
  const config = data?.config || { siteName: 'ECR Choco BD', delivery: { insideDhaka: 60, outsideDhaka: 120, freeShippingThreshold: 0 }, giftBoxSizes: [], payments: { cod: true }, social: {} };
  useEffect(() => { if (config.metaPixelId) initPixel(config.metaPixelId); }, [config.metaPixelId]);
  return <Ctx.Provider value={config}>{children}</Ctx.Provider>;
}
