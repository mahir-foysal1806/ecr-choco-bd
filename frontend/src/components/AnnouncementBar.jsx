import { useQuery } from '@tanstack/react-query';
import { Phone } from 'lucide-react';
import { BannersApi } from '../api';
import { useSettings } from '../context/SettingsContext.jsx';

export default function AnnouncementBar() {
  const { settings } = useSettings();
  const { data } = useQuery({
    queryKey: ['banners', 'announcement'],
    queryFn: () => BannersApi.list('announcement').then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });
  const messages = [...(data || []).map((b) => b.title || b.subtitle), settings.announcement].filter(Boolean);
  if (!messages.length && !settings.hotline) return null;
  return (
    <div className="bg-brand-900 text-xs text-brand-100 sm:text-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2">
        <p className="min-w-0 flex-1 truncate text-center sm:text-left">{messages[0] || 'Premium chocolates, nuts and dates delivered across Bangladesh'}</p>
        {settings.hotline && (
          <a href={`tel:${settings.hotline}`} className="hidden shrink-0 items-center gap-1.5 text-gold-200 hover:text-white sm:flex">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" /> {settings.hotline}
          </a>
        )}
      </div>
    </div>
  );
}
