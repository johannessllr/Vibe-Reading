'use client';
import { useState } from 'react';

const SIZE = {
  sm: 'w-[38px] h-[56px] text-[7px]',
  md: 'w-[56px] h-[84px] text-[9px]',
  lg: 'w-[96px] h-[144px] text-xs',
} as const;

// Gradient pairs tuned to the cream theme; picked deterministically from the
// title so a book keeps its placeholder color across pages and reloads.
const PALETTES: Array<[string, string]> = [
  ['#7a4a2b', '#3d2414'],
  ['#2b5a7a', '#142c3d'],
  ['#5a7a2b', '#2c3d14'],
  ['#7a2b5a', '#3d1430'],
];

export function BookCover({
  assetId,
  title,
  size = 'md',
}: {
  assetId: string;
  title: string;
  size?: keyof typeof SIZE;
}) {
  const [failed, setFailed] = useState(false);
  const base = `${SIZE[size]} shrink-0 rounded-[3px] shadow-sm`;

  if (failed) {
    const [from, to] =
      PALETTES[[...title].reduce((s, c) => s + c.charCodeAt(0), 0) % PALETTES.length];
    return (
      <div
        className={`${base} flex items-end overflow-hidden p-1 font-semibold text-white/90`}
        style={{ background: `linear-gradient(160deg, ${from}, ${to})` }}
        aria-label={`Cover of ${title}`}
      >
        <span className="line-clamp-3 leading-tight">{title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- same-origin API stream, see above
    <img
      src={`/api/cover/${assetId}`}
      alt={`Cover of ${title}`}
      className={`${base} object-cover`}
      onError={() => setFailed(true)}
    />
  );
}
