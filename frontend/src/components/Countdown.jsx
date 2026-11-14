import { useEffect, useState } from 'react';

const parts = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
};

export default function Countdown({ endsAt, dark }) {
  const target = new Date(endsAt).getTime();
  const [left, setLeft] = useState(target - Date.now());
  useEffect(() => {
    const t = setInterval(() => setLeft(target - Date.now()), 1000);
    return () => clearInterval(t);
  }, [target]);
  if (left <= 0) return null;
  const p = parts(left);
  return (
    <div className="flex items-center gap-2" role="timer">
      {[['d', 'Days'], ['h', 'Hrs'], ['m', 'Min'], ['s', 'Sec']].map(([k, l]) => (
        <div key={k} className={`min-w-[52px] rounded-lg px-2 py-1.5 text-center ${dark ? 'bg-white/10 text-white' : 'bg-choco-800 text-white'}`}>
          <div className="text-lg font-bold tabular-nums leading-none">{String(p[k]).padStart(2, '0')}</div>
          <div className="mt-0.5 text-[10px] uppercase tracking-wide opacity-70">{l}</div>
        </div>
      ))}
    </div>
  );
}
