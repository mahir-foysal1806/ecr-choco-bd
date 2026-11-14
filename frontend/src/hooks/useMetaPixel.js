import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext.jsx';
import { loadPixel, track } from '../lib/fbq.js';

/** Loads the Meta Pixel from settings and fires PageView on every route change. */
export function useMetaPixel() {
  const { settings } = useSettings();
  const location = useLocation();
  const id = settings.metaPixelId;

  useEffect(() => {
    if (id) loadPixel(id);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    loadPixel(id);
    if (location.pathname.startsWith('/admin')) return;
    track('PageView');
  }, [id, location.pathname]);
}
