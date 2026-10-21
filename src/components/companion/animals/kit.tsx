import { createContext, useContext, useId, type ReactNode } from 'react';

import { shade, mix } from './color';
import { ExtraAcc, type ExtraKind } from './extras';
export { shade, mix };

export const INK = '#2b2230';

/** a gradient id that is unique per drawn animal (several colour variants can share one page) */
export function useUid(prefix: string): string {
  return prefix + useId().replace(/[^a-zA-Z0-9]/g, '');
}

/** The colours of one animal (one "Farbvariante"). Every art reads what it needs. */
export interface Pal {
  /** main fur / feather colour */
  body: string;
  /** light underside, muzzle, chest */
  belly: string;
  /** darker markings, ears, inner shadows */
  dark: string;
  /** a second marking colour (blaze, patches, wing tips …) */
  accent: string;
  nose?: string;
  /** iris colour (default: dark ink) */
  iris?: string;
  /** species specific extras */
  x1?: string;
  x2?: string;
  x3?: string;
}
export type EyeState = 'open' | 'closed';

/** Everything an art needs: the face state and the palette. */
export interface ArtOpts {
  /** accessory chosen for this animal */
  acc?: AccKind;
  /** its colour (optional override) */
  accColor?: string;
  /** static head tilt in degrees (e.g. the curious black collie) */
  tilt?: number;
  /** wears a harness (labrador puppy) */
  harness?: boolean;
}
export interface ArtProps {
  eyes: EyeState;
  pal: Pal;
  opt?: ArtOpts;
}

export type AccKind = 'none' | 'schleife' | 'halstuch' | 'krone' | 'blume' | 'brille' | 'muetze' | ExtraKind;
export const ACCESSORIES: { id: AccKind; name: string }[] = [
  { id: 'none', name: 'Nichts' },
  { id: 'schleife', name: 'Schleife' },
  { id: 'halstuch', name: 'Halstuch' },
  { id: 'krone', name: 'Krone' },
  { id: 'blume', name: 'Blume' },
  { id: 'brille', name: 'Brille' },
  { id: 'muetze', name: 'Mütze' },
];
const ACC_DEFAULT: Record<string, string> = { none: '#fff', schleife: '#ff7aa8', halstuch: '#4f9be0', krone: '#ffcf4a', blume: '#ff8fc0', brille: '#2b2230', muetze: '#e5566b' };

/** where an accessory sits on the head of a species (head coordinates, before the age scaling) */
export interface AccAnchor {
  cx?: number;
  top: number;
  chin: number;
  eyeY: number;
  eyeDx: number;
}

/** Accessories are drawn inside HeadG, so they grow and tilt with the head. */
export function Acc({ kind, color, a }: { kind?: AccKind; color?: string; a: AccAnchor }) {
  if (!kind || kind === 'none') return null;
  const c = color || ACC_DEFAULT[kind];
  const cx = a.cx ?? 50;
  switch (kind) {
    case 'schleife': {
      const x = cx + 18;
      const y = a.top + 7;
      return (
        <g className="pa-acc">
          <path d={`M${x} ${y} l-10 -6 q-2 6 0 12z`} fill={c} />
          <path d={`M${x} ${y} l10 -6 q2 6 0 12z`} fill={c} />
          <path d={`M${x - 8} ${y - 3} q3 3 0 6M${x + 8} ${y - 3} q-3 3 0 6`} stroke={shade(c, -0.25)} strokeWidth="1" fill="none" strokeLinecap="round" />
          <circle cx={x} cy={y} r="3.2" fill={shade(c, -0.12)} />
          <circle cx={x - 0.8} cy={y - 0.9} r="1" fill="#fff" opacity=".6" />
        </g>
      );
    }
    case 'halstuch':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 24} ${a.chin - 3} Q${cx} ${a.chin + 9} ${cx + 24} ${a.chin - 3} L${cx + 19} ${a.chin + 6} Q${cx} ${a.chin + 16} ${cx - 19} ${a.chin + 6}z`} fill={c} />
          <path d={`M${cx - 6} ${a.chin + 7} L${cx} ${a.chin + 20} L${cx + 6} ${a.chin + 7}z`} fill={shade(c, -0.14)} />
          <g fill="#fff" opacity=".75"><circle cx={cx - 14} cy={a.chin + 3} r="1.2" /><circle cx={cx + 12} cy={a.chin + 4} r="1.2" /><circle cx={cx} cy={a.chin + 9.5} r="1.2" /></g>
        </g>
      );
    case 'krone':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 13} ${a.top + 6} L${cx - 15} ${a.top - 8} L${cx - 7} ${a.top - 1} L${cx} ${a.top - 11} L${cx + 7} ${a.top - 1} L${cx + 15} ${a.top - 8} L${cx + 13} ${a.top + 6}z`} fill={c} stroke={shade(c, -0.25)} strokeWidth="1" strokeLinejoin="round" />
          <circle cx={cx} cy={a.top - 11} r="2" fill="#ff6b8a" />
          <circle cx={cx - 15} cy={a.top - 8} r="1.6" fill="#7bd0ff" />
          <circle cx={cx + 15} cy={a.top - 8} r="1.6" fill="#7bd0ff" />
          <path d={`M${cx - 12} ${a.top + 3} h24`} stroke={shade(c, 0.4)} strokeWidth="1.3" strokeLinecap="round" opacity=".8" />
        </g>
      );
    case 'blume': {
      const x = cx - 22;
      const y = a.top + 9;
      return (
        <g className="pa-acc">
          {[0, 72, 144, 216, 288].map((r) => (
            <ellipse key={r} cx={x} cy={y - 5} rx="3.4" ry="4.6" fill={c} transform={`rotate(${r} ${x} ${y})`} />
          ))}
          <circle cx={x} cy={y} r="2.8" fill="#ffd34d" />
        </g>
      );
    }
    case 'brille': {
      const r = 8.2;
      return (
        <g className="pa-acc" fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round">
          <circle cx={cx - a.eyeDx} cy={a.eyeY} r={r} />
          <circle cx={cx + a.eyeDx} cy={a.eyeY} r={r} />
          <path d={`M${cx - a.eyeDx + r} ${a.eyeY} q${a.eyeDx - r} -4 ${2 * (a.eyeDx - r)} 0`} />
          <path d={`M${cx - a.eyeDx - r} ${a.eyeY} l-5 -1.5M${cx + a.eyeDx + r} ${a.eyeY} l5 -1.5`} />
          <path d={`M${cx - a.eyeDx - 4} ${a.eyeY - 5} q2 -2 5 -2.4`} stroke="#fff" strokeWidth="1.2" opacity=".7" />
        </g>
      );
    }
    case 'muetze':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 20} ${a.top + 9} Q${cx - 18} ${a.top - 12} ${cx} ${a.top - 12} Q${cx + 18} ${a.top - 12} ${cx + 20} ${a.top + 9}z`} fill={c} />
          <rect x={cx - 22} y={a.top + 5} width="44" height="7" rx="3.4" fill={shade(c, -0.14)} />
          <path d={`M${cx - 18} ${a.top + 8.5} h36`} stroke="#fff" strokeWidth="1" opacity=".4" strokeDasharray="2 2.4" />
          <circle cx={cx} cy={a.top - 13} r="4.4" fill={shade(c, 0.5)} />
          <circle cx={cx - 1.3} cy={a.top - 14.3} r="1.3" fill="#fff" opacity=".7" />
        </g>
      );
    default:
      return <ExtraAcc kind={kind} color={color} a={a} />;
  }
}

/** a harness on the body (dogs) */
export function Harness({ color = '#2f3a40', trim = '#c9d6a8', y = 84 }: { color?: string; trim?: string; y?: number }) {
  return (
    <g className="pa-acc">
      <path d={`M33 ${y - 8} Q50 ${y + 8} 67 ${y - 8} L63 ${y + 8} Q50 ${y + 16} 37 ${y + 8}z`} fill={color} />
      <path d={`M33 ${y - 8} Q50 ${y + 8} 67 ${y - 8}`} stroke={trim} strokeWidth="1.6" fill="none" strokeLinecap="round" strokeDasharray="1.6 2" />
      <rect x="47" y={y + 8} width="6" height="14" rx="1.4" fill={trim} />
      <path d={`M50 ${y + 8} v14`} stroke="#fff" strokeWidth=".7" opacity=".5" />
    </g>
  );
}

/** 0 = newborn … 1 = fully grown. Provided by AnimalFigure. */
export const AgeCtx = createContext(1);
export const useAge = () => useContext(AgeCtx);

const ease = (t: number) => t * t * (3 - 2 * t);

/** The body half of the animal: gets smaller and rounder while the animal is young. */
export function BodyG({ children, bottom = 106, top = 66 }: { children: ReactNode; bottom?: number; top?: number }) {
  const age = useAge();
  const b = 0.88 + 0.12 * ease(age);
  void top;
  return (
    <g transform={`translate(50 ${bottom}) scale(${b}) translate(-50 ${-bottom})`}>
      <g className="pa-body" style={{ transformOrigin: `50px ${bottom}px` }}>
        {children}
      </g>
    </g>
  );
}

/** The head half: relatively bigger while young, sits on the (smaller) body. */
export function HeadG({ children, cx = 50, cy = 52, bodyTop = 70, bottom = 106 }: { children: ReactNode; cx?: number; cy?: number; bodyTop?: number; bottom?: number }) {
  const age = useAge();
  const e = ease(age);
  const b = 0.88 + 0.12 * e;
  const h = 1.1 - 0.1 * e;
  const dy = (1 - b) * (bottom - bodyTop);
  return (
    <g className="pa-head" transform={`translate(0 ${dy.toFixed(2)}) translate(${cx} ${cy}) scale(${h.toFixed(3)}) translate(${-cx} ${-cy})`}>
      <g className="pa-head-idle" style={{ transformOrigin: `${cx}px ${cy + 22}px` }}>
        {children}
      </g>
    </g>
  );
}

/* ───── eyes ───── */
interface EyeProps {
  state: EyeState;
  y?: number;
  dx?: number;
  rx?: number;
  ry?: number;
  ring?: { r: number; fill: string; stroke?: string };
  iris?: string;
  lashes?: boolean;
  star?: boolean;
  /** slit pupil (dragon, cat-like) */
  slit?: boolean;
}

/**
 * Big, calm, dark eyes (as before): a plain dark iris, two catchlights, no extra shading – natural instead of over-detailed.
 * Young animals get bigger, rounder eyes that sit a little lower and wider apart (Kindchenschema).
 */
export function KEyes({ state, y = 52, dx = 13, rx = 5.4, ry = 6.4, ring, iris = INK, lashes, star, slit }: EyeProps) {
  const age = useAge();
  const e = ease(age);
  const k = 1.3 - 0.3 * e;
  const R = rx * k;
  const Ry = ry * k * (1 - 0.05 * (1 - e));
  const yy = y + (1 - e) * 2.4;
  const dd = dx * (1 + 0.07 * (1 - e));
  const xs = [50 - dd, 50 + dd];
  return (
    <g className="pa-eyes">
      {xs.map((x, i) =>
        state === 'closed' ? (
          <g key={i}>
            <path d={`M${x - R} ${yy} q${R} ${R * 1.05} ${R * 2} 0`} stroke={INK} strokeWidth="2.6" fill="none" strokeLinecap="round" />
            {lashes && <path d={`M${x + (i ? R : -R)} ${yy} l${i ? 2.8 : -2.8} -1.6`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" />}
          </g>
        ) : (
          <g key={i}>
            {ring && <circle cx={x} cy={yy} r={ring.r * k} fill={ring.fill} stroke={ring.stroke} strokeWidth={ring.stroke ? 1.2 : 0} />}
            <g className="pa-glance">
              <ellipse cx={x} cy={yy} rx={R} ry={Ry} fill={iris} />
              {iris !== INK && <ellipse cx={x} cy={yy + 0.6} rx={slit ? R * 0.26 : R * 0.62} ry={slit ? Ry * 0.9 : Ry * 0.62} fill={INK} />}
              {star ? (
                <path d={`M${x + 2} ${yy - 4.2} l0.9 2 2 0.9 -2 0.9 -0.9 2 -0.9 -2 -2 -0.9 2 -0.9z`} fill="#fff" />
              ) : (
                <circle cx={x + R * 0.36} cy={yy - Ry * 0.38} r={Math.max(1.8, R * 0.44)} fill="#fff" />
              )}
              <circle cx={x - R * 0.36} cy={yy + Ry * 0.4} r={Math.max(0.9, R * 0.2)} fill="#fff" opacity="0.9" />
            </g>
            {lashes && (
              <g stroke={INK} strokeWidth="1.8" strokeLinecap="round">
                <path d={`M${x + (i ? R - 0.5 : -R + 0.5)} ${yy - Ry + 1.5} l${i ? 3.2 : -3.2} -2`} />
                <path d={`M${x + (i ? R - 0.2 : -R + 0.2)} ${yy - Ry + 4} l${i ? 3.6 : -3.6} -0.4`} />
              </g>
            )}
          </g>
        ),
      )}
    </g>
  );
}

export function Blush({ y = 62, dx = 23, rx = 5.6, ry = 3.6, fill = '#ff8fa6', opacity = 0.5 }: { y?: number; dx?: number; rx?: number; ry?: number; fill?: string; opacity?: number }) {
  const age = useAge();
  const k = 1.18 - 0.18 * ease(age);
  return (
    <g className="pa-blush" opacity={opacity}>
      <ellipse cx={50 - dx} cy={y} rx={rx * k} ry={ry * k} fill={fill} />
      <ellipse cx={50 + dx} cy={y} rx={rx * k} ry={ry * k} fill={fill} />
    </g>
  );
}

export function Sparkle({ x, y, s = 1, fill = '#fff', cls = '' }: { x: number; y: number; s?: number; fill?: string; cls?: string }) {
  return <path className={cls} d={`M${x} ${y - 4 * s} l${1.2 * s} ${2.8 * s} ${2.8 * s} ${1.2 * s} -${2.8 * s} ${1.2 * s} -${1.2 * s} ${2.8 * s} -${1.2 * s} -${2.8 * s} -${2.8 * s} -${1.2 * s} ${2.8 * s} -${1.2 * s}z`} fill={fill} />;
}

/* ───── gradients ───── */
export const gid = (animal: string, name: string) => `pa-${animal}-${name}`;

export function Grad({ id, c, cx = 38, cy = 26, r = 85 }: { id: string; c: string; cx?: number; cy?: number; r?: number }) {
  return (
    <defs>
      <radialGradient id={id} cx={`${cx}%`} cy={`${cy}%`} r={`${r}%`}>
        <stop offset="0" stopColor={shade(c, 0.3)} />
        <stop offset="0.55" stopColor={c} />
        <stop offset="1" stopColor={shade(c, -0.17)} />
      </radialGradient>
    </defs>
  );
}

/** a soft shaded fill ready to use: <ellipse fill={`url(#${id})`} /> */
export function SoftBody({ id, c, cx = 50, cy = 88, rx = 25, ry = 19 }: { id: string; c: string; cx?: number; cy?: number; rx?: number; ry?: number }) {
  return (
    <>
      <Grad id={`${id}-b`} c={c} cx={40} cy={30} r={80} />
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${id}-b)`} />
    </>
  );
}

/* ───── fur ───── */
function rng(seed: number) {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Soft fluff around an ellipse: a fading halo (plush-toy edge, no hard spikes) plus a few small rounded tufts.
 * Draw it BEHIND the shape it belongs to, in the same (or a slightly darker) colour.
 */
export function Tufts({ cx, cy, rx, ry, fill, n = 24, len = 4, w = 3.6, seed = 1, from = 0, to = 360, k = 1 }: { cx: number; cy: number; rx: number; ry: number; fill: string; n?: number; len?: number; w?: number; seed?: number; from?: number; to?: number; k?: number }) {
  const age = useAge();
  const baby = 1.4 - 0.4 * ease(age); // babies are fluffier
  const uid = useUid('pt');
  const r = rng(seed);
  const L0 = len * baby * k;
  const full = to - from >= 300;
  let d = '';
  const cnt = Math.max(4, Math.round(n * 0.5));
  for (let i = 0; i < cnt; i++) {
    const a = ((from + ((to - from) * (i + 0.5)) / cnt + (r() - 0.5) * ((to - from) / cnt) * 0.5) * Math.PI) / 180;
    const px = cx + rx * Math.cos(a);
    const py = cy + ry * Math.sin(a);
    let nx = Math.cos(a) / rx;
    let ny = Math.sin(a) / ry;
    const nl = Math.hypot(nx, ny) || 1;
    nx /= nl;
    ny /= nl;
    const tx = -ny;
    const ty = nx;
    const L = L0 * 0.85 * (0.7 + 0.5 * r());
    const lean = (r() - 0.5) * 1.6;
    const hw = (w * 1.7 * (0.85 + 0.35 * r())) / 2;
    const inset = 1.8;
    const bx = px - nx * inset;
    const by = py - ny * inset;
    // a round-tipped bump: two cubic curves meeting in a soft blob
    const tipx = bx + nx * L + tx * lean;
    const tipy = by + ny * L + ty * lean;
    d += `M${(bx + tx * hw).toFixed(1)} ${(by + ty * hw).toFixed(1)} C${(bx + tx * hw * 1.15 + nx * L * 0.9).toFixed(1)} ${(by + ty * hw * 1.15 + ny * L * 0.9).toFixed(1)} ${(tipx + tx * hw * 0.55).toFixed(1)} ${(tipy + ty * hw * 0.55).toFixed(1)} ${tipx.toFixed(1)} ${tipy.toFixed(1)} C${(tipx - tx * hw * 0.55).toFixed(1)} ${(tipy - ty * hw * 0.55).toFixed(1)} ${(bx - tx * hw * 1.15 + nx * L * 0.9).toFixed(1)} ${(by - ty * hw * 1.15 + ny * L * 0.9).toFixed(1)} ${(bx - tx * hw).toFixed(1)} ${(by - ty * hw).toFixed(1)}Z`;
  }
  const HR = Math.max(1.5, L0 * 1.05);
  return (
    <g className="pa-tufts">
      {full && (
        <>
          <defs>
            <radialGradient id={uid} cx="50%" cy="50%" r="50%">
              <stop offset={Math.max(0.5, (Math.min(rx, ry) - 1) / (Math.min(rx, ry) + HR)).toFixed(3)} stopColor={fill} stopOpacity="0.95" />
              <stop offset="1" stopColor={fill} stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse cx={cx} cy={cy} rx={rx + HR} ry={ry + HR} fill={`url(#${uid})`} />
        </>
      )}
      <path d={d} fill={fill} />
    </g>
  );
}

/** short curved hair strokes inside an area – a hint of fur texture */
export function FurLines({ cx, cy, rx, ry, stroke, n = 14, len = 3.4, seed = 3, opacity = 0.35, width = 1.1, angle = 90 }: { cx: number; cy: number; rx: number; ry: number; stroke: string; n?: number; len?: number; seed?: number; opacity?: number; width?: number; angle?: number }) {
  const r = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2;
    const rad = Math.sqrt(r());
    const x = cx + Math.cos(a) * rx * rad;
    const y = cy + Math.sin(a) * ry * rad;
    const dir = ((angle + (r() - 0.5) * 60) * Math.PI) / 180;
    const dx = Math.cos(dir) * len;
    const dy = Math.sin(dir) * len;
    d += `M${x.toFixed(1)} ${y.toFixed(1)} q${(dx * 0.5 + dy * 0.25).toFixed(1)} ${(dy * 0.5 - dx * 0.25).toFixed(1)} ${dx.toFixed(1)} ${dy.toFixed(1)}`;
  }
  return <path d={d} stroke={stroke} strokeWidth={width} strokeLinecap="round" fill="none" opacity={opacity} />;
}

/** scallop ring of little circles – curly / woolly coats (poodle, lamb-like fluff) */
export function Curls({ cx, cy, rx, ry, fill, n = 18, r = 5, seed = 2, from = 0, to = 360, jitter = 1.4 }: { cx: number; cy: number; rx: number; ry: number; fill: string; n?: number; r?: number; seed?: number; from?: number; to?: number; jitter?: number }) {
  const rr = rng(seed);
  return (
    <g fill={fill}>
      {Array.from({ length: n }, (_, i) => {
        const a = ((from + ((to - from) * (i + 0.5)) / n) * Math.PI) / 180;
        const k = 0.9 + rr() * 0.25;
        return <circle key={i} cx={(cx + rx * Math.cos(a) + (rr() - 0.5) * jitter).toFixed(1)} cy={(cy + ry * Math.sin(a) + (rr() - 0.5) * jitter).toFixed(1)} r={(r * k).toFixed(1)} />;
      })}
    </g>
  );
}

/** curl texture inside: small ring marks */
export function CurlMarks({ cx, cy, rx, ry, stroke, n = 16, r = 2.6, seed = 5, opacity = 0.35 }: { cx: number; cy: number; rx: number; ry: number; stroke: string; n?: number; r?: number; seed?: number; opacity?: number }) {
  const rr = rng(seed);
  let d = '';
  for (let i = 0; i < n; i++) {
    const a = rr() * Math.PI * 2;
    const rad = Math.sqrt(rr());
    const x = cx + Math.cos(a) * rx * rad;
    const y = cy + Math.sin(a) * ry * rad;
    d += `M${(x - r).toFixed(1)} ${y.toFixed(1)} a${r} ${r} 0 1 1 ${r} ${r} a${r * 0.55} ${r * 0.55} 0 1 1 ${(-r * 0.5).toFixed(1)} ${(-r * 0.5).toFixed(1)}`;
  }
  return <path d={d} stroke={stroke} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity={opacity} />;
}

/* ───── shadows & light ───── */
const DefsCtx = createContext({ shade: 'pa-shade', shine: 'pa-shine' });

/** a soft dark patch (e.g. under the chin, between legs) – gives depth */
export function Shade({ cx, cy, rx, ry, op = 0.22 }: { cx: number; cy: number; rx: number; ry: number; op?: number }) {
  const ids = useContext(DefsCtx);
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${ids.shade})`} opacity={op} />;
}

/** a soft white sheen on top of a rounded shape */
export function Shine({ cx, cy, rx, ry, op = 0.35 }: { cx: number; cy: number; rx: number; ry: number; op?: number }) {
  const ids = useContext(DefsCtx);
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill={`url(#${ids.shine})`} opacity={op} />;
}

/** Wraps one animal drawing: defines its soft shade / sheen gradients under ids that are unique on the page
 *  (gradients inside a hidden svg would otherwise break every other animal that points at the same id). */
export function DefsScope({ children }: { children: ReactNode }) {
  const u = useUid('pd');
  const ids = { shade: `${u}s`, shine: `${u}h` };
  return (
    <DefsCtx.Provider value={ids}>
      <defs>
        <radialGradient id={ids.shade} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#2b1d2f" stopOpacity="1" />
          <stop offset="1" stopColor="#2b1d2f" stopOpacity="0" />
        </radialGradient>
        <radialGradient id={ids.shine} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      {children}
    </DefsCtx.Provider>
  );
}
