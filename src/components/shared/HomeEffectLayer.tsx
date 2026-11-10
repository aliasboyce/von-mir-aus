import type { CSSProperties, ReactNode } from 'react';
import { DENSITY_FACTOR, type HomeEffectDensity, type HomeEffectId } from '../../services/homeEffects';

/**
 * Teilchen-Ebene für die Startseite. Alles rein dekorativ (aria-hidden), ohne Bilder, mit Alternative bei „Bewegung reduzieren“
 * (die Klasse ambient-fall wird dann ausgeblendet). `fall` ist die Strecke in px, damit auch kleine Vorschaukacheln passen.
 */
const SPARKLE = 'M12 1.5l2.2 8.3L22.5 12l-8.3 2.2L12 22.5l-2.2-8.3L1.5 12l8.3-2.2L12 1.5Z';
const STAR = 'M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.7-6.2 3.7 1.6-7L2 9.2l7.1-.6L12 2Z';
const HEART = 'M12 21s-8-5.3-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.7-8 11-8 11Z';
const FEATHER = 'M20 3C11 3 5 9 5 16l-2 5 5-2c7 0 12-6 12-16Zm-7 6-6 8';

const svg = (d: string, size: number, fill: string, stroke?: string): ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    <path d={d} fill={stroke ? 'none' : fill} stroke={stroke ?? 'none'} strokeWidth={stroke ? 1.6 : 0} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const blossom = (size: number, c: string): ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
    {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="12" cy="6.6" rx="3.6" ry="5" fill={c} transform={`rotate(${a} 12 12)`} />)}
    <circle cx="12" cy="12" r="2.2" fill="#f7e08a" />
  </svg>
);

const butterfly = (size: number, c: string): ReactNode => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" className="fx-wings">
    <ellipse cx="7.5" cy="8.5" rx="5.6" ry="4.4" fill={c} transform="rotate(-18 7.5 8.5)" />
    <ellipse cx="16.5" cy="8.5" rx="5.6" ry="4.4" fill={c} transform="rotate(18 16.5 8.5)" />
    <ellipse cx="8.2" cy="15.6" rx="3.8" ry="3" fill={c} fillOpacity="0.8" transform="rotate(20 8.2 15.6)" />
    <ellipse cx="15.8" cy="15.6" rx="3.8" ry="3" fill={c} fillOpacity="0.8" transform="rotate(-20 15.8 15.6)" />
    <rect x="11.2" y="5.5" width="1.6" height="12" rx="0.8" fill="#5b4a58" />
  </svg>
);

interface Spec { style: CSSProperties; inner?: ReactNode }

const AUTUMN = ['#c97a3d', '#d4a24a', '#a8542f', '#c7883a'];
const PINKS = ['#f6c9d6', '#fdeef2', '#f2b3c8'];
const WARM = ['#ffd978', '#fff4c2', '#ffe9a0', '#ffffff'];
const BFLY = ['#e7a3c4', '#9ec7e8', '#f2c46d', '#b79be0'];

function build(kind: HomeEffectId, i: number, n: number, fall: number): Spec {
  const slot = (i + 0.5) / n; // gleichmäßig über die Breite verteilt
  const left = `${Math.round(4 + slot * 90)}%`;
  const seed = (i * 37) % 11;
  const dur = (base: number) => base + (i % 4) * 1.1;
  const delay = (step: number) => -(i * step); // negative Verzögerung: Teilchen sind sofort verteilt, nicht erst nach Sekunden da
  const common = { position: 'absolute' as const, left, ['--fall' as string]: `${fall}px` } as CSSProperties;
  switch (kind) {
    case 'leaves':
      return { style: { ...common, top: -10, width: 8 + (seed % 3), height: 5 + (seed % 2), borderRadius: '2px 9px', background: AUTUMN[i % 4], animation: `leaf-fall ${dur(8)}s linear ${delay(1.3)}s infinite` } };
    case 'blossoms':
      return { style: { ...common, top: -12, animation: `petal-fall ${dur(9)}s linear ${delay(1.4)}s infinite` }, inner: blossom(11 + (seed % 3) * 2, PINKS[i % 3]) };
    case 'sparkle':
      return { style: { ...common, left: `${6 + ((i * 53) % 88)}%`, top: `${8 + ((i * 29) % 70)}%`, opacity: 0, animation: `fx-sparkle ${dur(3)}s ease-in-out ${delay(0.7)}s infinite` }, inner: svg(SPARKLE, 8 + (seed % 4) * 2, WARM[i % 4]) };
    case 'stars':
      return { style: { ...common, top: -12, animation: `star-fall ${dur(10)}s linear ${delay(1.5)}s infinite` }, inner: svg(STAR, 9 + (seed % 3) * 2, i % 2 ? '#f3d980' : '#ffe9a0') };
    case 'snow':
      return { style: { ...common, top: -14, width: 7 + (seed % 4) * 2, height: 7 + (seed % 4) * 2, borderRadius: '50%', background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #eef3fa 60%, #dfe8f3 100%)', boxShadow: '0 0 6px rgba(255,255,255,0.7)', animation: `snow-fall-ambient ${dur(9)}s linear ${delay(1.4)}s infinite` } };
    case 'rays':
      return { style: { position: 'absolute', top: -30, left: `${-10 + slot * 100}%`, width: 46 + (seed % 3) * 14, height: fall + 90, transform: `rotate(${18 + (i % 2) * 6}deg)`, transformOrigin: 'top center', background: 'linear-gradient(180deg, rgba(255,230,160,0.55) 0%, rgba(255,230,160,0.16) 55%, rgba(255,230,160,0) 100%)', filter: 'blur(5px)', animation: `fx-ray ${dur(7)}s ease-in-out ${delay(1.2)}s infinite` } };
    case 'fireflies':
      return { style: { ...common, top: `${14 + ((i * 41) % 66)}%`, left: `${6 + ((i * 47) % 86)}%`, width: 5, height: 5, borderRadius: '50%', background: '#ffe98a', boxShadow: '0 0 8px 3px rgba(255,226,120,0.7)', animation: `fx-firefly ${dur(6)}s ease-in-out ${delay(0.9)}s infinite` } };
    case 'bubbles':
      return { style: { ...common, bottom: -14, top: 'auto', width: 9 + (seed % 4) * 3, height: 9 + (seed % 4) * 3, borderRadius: '50%', border: '1.5px solid rgba(255,255,255,0.85)', background: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.85) 0%, rgba(190,225,245,0.25) 55%, rgba(190,225,245,0.12) 100%)', animation: `fx-bubble ${dur(9)}s ease-in ${delay(1.3)}s infinite` } };
    case 'hearts':
      return { style: { ...common, bottom: -14, top: 'auto', animation: `fx-heart ${dur(10)}s ease-in-out ${delay(1.6)}s infinite` }, inner: svg(HEART, 10 + (seed % 3) * 2, i % 2 ? '#f2a0b8' : '#f7c3d1') };
    case 'butterflies':
      return { style: { ...common, top: `${12 + ((i * 37) % 60)}%`, left: -14, animation: `fx-butterfly ${dur(16)}s linear ${delay(2.8)}s infinite` }, inner: butterfly(16 + (seed % 3) * 3, BFLY[i % 4]) };
    case 'rain':
      return { style: { ...common, top: -22, width: 1.5, height: 14 + (seed % 3) * 4, borderRadius: 2, background: 'linear-gradient(180deg, rgba(150,175,205,0) 0%, rgba(150,175,205,0.75) 100%)', animation: `fx-rain ${1.1 + (i % 4) * 0.25}s linear ${delay(0.23)}s infinite` } };
    case 'feathers':
      return { style: { ...common, top: -16, animation: `fx-feather ${dur(12)}s ease-in-out ${delay(1.9)}s infinite` }, inner: svg(FEATHER, 15 + (seed % 3) * 3, '#fff', '#b9b2c9') };
    case 'dust':
    default:
      return { style: { ...common, top: `${6 + ((i * 43) % 80)}%`, left: `${3 + ((i * 59) % 92)}%`, width: 2 + (seed % 3), height: 2 + (seed % 3), borderRadius: '50%', background: '#fff4c2', boxShadow: '0 0 4px 1px rgba(255,244,194,0.7)', animation: `pollen-drift ${dur(5)}s ease-in-out ${delay(0.8)}s infinite` } };
  }
}

const BASE_COUNT: Partial<Record<HomeEffectId, number>> = { sparkle: 9, rays: 3, fireflies: 7, butterflies: 3, hearts: 6, bubbles: 7, rain: 16, feathers: 5, dust: 14, snow: 7 };

export function HomeEffectLayer({ kind, density = 'normal', fall = 340 }: { kind: HomeEffectId; density?: HomeEffectDensity; fall?: number }) {
  if (kind === 'auto' || kind === 'off') return null;
  const base = BASE_COUNT[kind] ?? 7;
  const n = Math.max(2, Math.round(base * DENSITY_FACTOR[density]));
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const spec = build(kind, i, n, fall);
        return <div key={`${kind}${i}`} className="absolute ambient-fall pointer-events-none" style={spec.style} data-fx={kind}>{spec.inner}</div>;
      })}
    </>
  );
}
