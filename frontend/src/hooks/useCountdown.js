import { useEffect, useState } from 'react';

export function useCountdown(endsAt) {
  const target = endsAt ? new Date(endsAt).getTime() : null;
  const calc = () => (target ? Math.max(0, target - Date.now()) : 0);
  const [ms, setMs] = useState(calc);
  useEffect(() => {
    if (!target) return undefined;
    setMs(calc());
    const t = setInterval(() => setMs(calc()), 1000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);
  const s = Math.floor(ms / 1000);
  return {
    expired: Boolean(target) && ms <= 0,
    days: Math.floor(s / 86400),
    hours: Math.floor((s % 86400) / 3600),
    minutes: Math.floor((s % 3600) / 60),
    seconds: s % 60,
  };
}
