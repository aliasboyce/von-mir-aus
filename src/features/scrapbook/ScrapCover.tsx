import type { CSSProperties } from 'react';
import type { ScrapBook, CoverStyle } from './scrapModel';

const hex = (h: string, a: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return `rgba(0,0,0,${a})`;
  const n = parseInt(m[1], 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
};
const mix = (h: string, to: number, k: number) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(h);
  if (!m) return h;
  const n = parseInt(m[1], 16);
  const c = (v: number) => Math.round(v + (to - v) * k);
  return `rgb(${c((n >> 16) & 255)},${c((n >> 8) & 255)},${c(n & 255)})`;
};

const FLOWERS = encodeURIComponent(
  `<svg xmlns='http://www.w3.org/2000/svg' width='44' height='44'><g fill='#fff' fill-opacity='.55'><circle cx='11' cy='11' r='2.4'/><circle cx='11' cy='6.5' r='2'/><circle cx='11' cy='15.5' r='2'/><circle cx='6.5' cy='11' r='2'/><circle cx='15.5' cy='11' r='2'/><circle cx='33' cy='33' r='2.4'/><circle cx='33' cy='28.5' r='2'/><circle cx='33' cy='37.5' r='2'/><circle cx='28.5' cy='33' r='2'/><circle cx='37.5' cy='33' r='2'/></g><g fill='#e8c26a' fill-opacity='.9'><circle cx='11' cy='11' r='1.2'/><circle cx='33' cy='33' r='1.2'/></g></svg>`,
);

function surface(style: CoverStyle, c: string): CSSProperties {
  switch (style) {
    case 'leinen':
      return {
        backgroundColor: c,
        backgroundImage: `repeating-linear-gradient(0deg, ${hex('#ffffff', 0.07)} 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, ${hex('#000000', 0.06)} 0 1px, transparent 1px 3px), linear-gradient(135deg, ${hex('#ffffff', 0.12)}, ${hex('#000000', 0.14)})`,
      };
    case 'leder':
      return {
        backgroundColor: mix(c, 0, 0.35),
        backgroundImage: `radial-gradient(circle at 30% 20%, ${hex('#ffffff', 0.14)}, transparent 55%), radial-gradient(circle at 80% 85%, ${hex('#000000', 0.3)}, transparent 55%), repeating-radial-gradient(circle at 50% 50%, ${hex('#000000', 0.05)} 0 2px, transparent 2px 5px)`,
      };
    case 'kraft':
      return {
        backgroundColor: '#c8a679',
        backgroundImage: `radial-gradient(${hex('#6b4a22', 0.28)} 1px, transparent 1.4px), radial-gradient(${hex('#ffffff', 0.18)} 1px, transparent 1.4px), linear-gradient(160deg, ${hex('#ffffff', 0.15)}, ${hex('#6b4a22', 0.18)})`,
        backgroundSize: '7px 7px, 11px 11px, 100% 100%',
        backgroundPosition: '0 0, 3px 4px, 0 0',
      };
    case 'blumen':
      return { backgroundColor: c, backgroundImage: `url("data:image/svg+xml,${FLOWERS}"), linear-gradient(160deg, ${hex('#ffffff', 0.1)}, ${hex('#000000', 0.16)})` };
    case 'karo':
      return {
        backgroundColor: mix(c, 255, 0.55),
        backgroundImage: `repeating-linear-gradient(0deg, ${hex(c, 0.5)} 0 14px, transparent 14px 28px), repeating-linear-gradient(90deg, ${hex(c, 0.5)} 0 14px, transparent 14px 28px), linear-gradient(160deg, ${hex('#ffffff', 0.12)}, ${hex('#000000', 0.12)})`,
      };
    case 'nacht':
      return {
        backgroundColor: mix(c, 0, 0.55),
        backgroundImage: `radial-gradient(1.6px 1.6px at 18% 22%, #fff, transparent), radial-gradient(1.2px 1.2px at 72% 14%, #fff, transparent), radial-gradient(1.8px 1.8px at 44% 58%, #ffe9a8, transparent), radial-gradient(1.2px 1.2px at 86% 66%, #fff, transparent), radial-gradient(1.4px 1.4px at 28% 84%, #fff, transparent), radial-gradient(1px 1px at 60% 36%, #fff, transparent), radial-gradient(1px 1px at 8% 52%, #fff, transparent), linear-gradient(170deg, ${hex('#ffffff', 0.06)}, ${hex('#000000', 0.3)})`,
      };
    case 'marmor':
      return {
        backgroundColor: mix(c, 255, 0.5),
        backgroundImage: `repeating-linear-gradient(115deg, transparent 0 22px, ${hex(c, 0.18)} 22px 24px, transparent 24px 61px), repeating-linear-gradient(63deg, transparent 0 37px, ${hex('#000000', 0.06)} 37px 38px, transparent 38px 83px), radial-gradient(ellipse at 30% 20%, ${hex('#ffffff', 0.5)}, transparent 60%)`,
      };
  }
}

/** Der Einband eines Buchs: Material, Rücken, Titelschild, Lesebändchen. Läuft in jeder Größe (alles in %/em). */
export function ScrapCover({ book, className = '', style, testId }: { book: Pick<ScrapBook, 'title' | 'cover'>; className?: string; style?: CSSProperties; testId?: string }) {
  const { style: st, color, emoji } = book.cover;
  const dark = st === 'nacht' || st === 'leder';
  const plate = dark ? '#f2e6c8' : '#fbf6ea';
  return (
    <div
      className={`relative overflow-hidden ${className}`}
      data-testid={testId}
      style={{
        aspectRatio: '794 / 1123',
        borderRadius: '3% 5% 5% 3% / 2% 2% 2% 2%',
        boxShadow: '0 1px 0 rgba(255,255,255,.25) inset, 0 10px 22px rgba(40,30,15,.28), 0 2px 4px rgba(40,30,15,.3)',
        containerType: 'inline-size',
        ...surface(st, color),
        ...style,
      }}
    >
      {/* Rücken */}
      <div className="absolute inset-y-0 left-0" style={{ width: '9%', background: 'linear-gradient(90deg, rgba(0,0,0,.35), rgba(0,0,0,.05) 55%, rgba(255,255,255,.18) 80%, rgba(0,0,0,.18))' }} />
      {/* Naht */}
      <div className="absolute" style={{ left: '12%', top: '3%', bottom: '3%', borderLeft: `1.5px dashed ${hex(dark ? '#e8c26a' : '#ffffff', 0.7)}` }} />
      {st === 'leder' && <div className="absolute" style={{ inset: '4% 5% 4% 14%', border: '1.5px solid #d9b45c', borderRadius: 4, boxShadow: '0 0 0 3px rgba(217,180,92,.22) inset' }} />}
      {/* Titelschild */}
      <div className="absolute" style={{ left: '22%', right: '12%', top: '22%', background: plate, padding: '7% 5% 8%', borderRadius: 3, boxShadow: '0 1px 3px rgba(0,0,0,.35), 0 0 0 2px ' + hex('#000000', 0.08) + ' inset', textAlign: 'center', color: '#3a2f22' }}>
        {emoji && <div style={{ fontSize: '9cqw', lineHeight: 1.1, marginBottom: '3cqw' }}>{emoji}</div>}
        <div style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: '8.6cqw', lineHeight: 1.15, fontWeight: 600, overflowWrap: 'anywhere', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {book.title || '…'}
        </div>
        <div style={{ margin: '4cqw auto 0', width: '40%', borderTop: '1.5px solid #3a2f22', opacity: 0.35 }} />
      </div>
      {/* Lesebändchen */}
      <div className="absolute" style={{ right: '16%', bottom: '-2%', width: '4.4%', height: '12%', background: '#b34a4a', clipPath: 'polygon(0 0,100% 0,100% 100%,50% 86%,0 100%)', boxShadow: '0 2px 3px rgba(0,0,0,.3)' }} />
      {/* Glanz */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(115deg, rgba(255,255,255,.18), rgba(255,255,255,0) 35%, rgba(0,0,0,.08) 100%)' }} />
    </div>
  );
}
