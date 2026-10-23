import { shade } from './color';
import type { AccAnchor } from './kit';

/** species-specific extras: worn on the head / neck (ExtraAcc) or lying beside / held in front of the animal (PropLayer) */
export type ExtraKind =
  | 'glocke' | 'halsband' | 'schal' | 'fliege'
  | 'doktorhut' | 'strohhut' | 'zylinder' | 'kopfhoerer' | 'seerose' | 'blattkrone' | 'sterne' | 'eierschale' | 'taucherbrille' | 'sonnenbrille'
  | 'stein' | 'muschel' | 'seestern' | 'perle' | 'diamant' | 'ring' | 'muenze' | 'knochen' | 'ball' | 'wollknaeuel' | 'buch' | 'schluessel' | 'karotte' | 'fisch' | 'honigtopf' | 'apfel' | 'schatz' | 'kleeblatt' | 'koernchen' | 'note' | 'mond' | 'fernglas' | 'farn';

export const EXTRA_NAMES: Record<ExtraKind, { de: string; en: string }> = {
  glocke: { de: 'Glöckchen', en: 'Little bell' },
  halsband: { de: 'Halsband', en: 'Collar' },
  schal: { de: 'Schal', en: 'Scarf' },
  fliege: { de: 'Fliege', en: 'Bow tie' },
  doktorhut: { de: 'Doktorhut', en: 'Graduation cap' },
  strohhut: { de: 'Strohhut', en: 'Straw hat' },
  zylinder: { de: 'Zylinder', en: 'Top hat' },
  kopfhoerer: { de: 'Kopfhörer', en: 'Headphones' },
  seerose: { de: 'Seerose', en: 'Water lily' },
  blattkrone: { de: 'Blätterkrone', en: 'Leaf crown' },
  sterne: { de: 'Sternchen', en: 'Little stars' },
  eierschale: { de: 'Eierschale', en: 'Eggshell' },
  taucherbrille: { de: 'Taucherbrille', en: 'Goggles' },
  sonnenbrille: { de: 'Sonnenbrille', en: 'Sunglasses' },
  stein: { de: 'Stein', en: 'Stone' },
  muschel: { de: 'Muschel', en: 'Shell' },
  seestern: { de: 'Seestern', en: 'Starfish' },
  perle: { de: 'Perle', en: 'Pearl' },
  diamant: { de: 'Diamant', en: 'Diamond' },
  ring: { de: 'Glitzerring', en: 'Shiny ring' },
  muenze: { de: 'Goldmünze', en: 'Gold coin' },
  knochen: { de: 'Knochen', en: 'Bone' },
  ball: { de: 'Ball', en: 'Ball' },
  wollknaeuel: { de: 'Wollknäuel', en: 'Yarn ball' },
  buch: { de: 'Buch', en: 'Book' },
  schluessel: { de: 'Schlüssel', en: 'Key' },
  karotte: { de: 'Karotte', en: 'Carrot' },
  fisch: { de: 'Fisch', en: 'Fish' },
  honigtopf: { de: 'Honigtopf', en: 'Honey pot' },
  apfel: { de: 'Apfel', en: 'Apple' },
  schatz: { de: 'Schatz', en: 'Treasure' },
  kleeblatt: { de: 'Kleeblatt', en: 'Clover' },
  koernchen: { de: 'Körnchen', en: 'Seeds' },
  note: { de: 'Notenzeichen', en: 'Music note' },
  mond: { de: 'Mond', en: 'Moon' },
  fernglas: { de: 'Fernglas', en: 'Binoculars' },
  farn: { de: 'Farnblatt', en: 'Fern leaf' },
};

const DEFAULT_COLOR: Record<ExtraKind, string> = {
  glocke: '#ff7aa8', halsband: '#e5566b', schal: '#ef6f6c', fliege: '#5b8def',
  doktorhut: '#2f3a52', strohhut: '#e9cf8a', zylinder: '#2f2a3a', kopfhoerer: '#7a8fb8', seerose: '#ff9ccb', blattkrone: '#6fbf73', sterne: '#ffd84d', eierschale: '#fff6e4', taucherbrille: '#4fc3f7', sonnenbrille: '#2b2230',
  stein: '#9aa0aa', muschel: '#ffb3c6', seestern: '#ff9e6b', perle: '#fdf6ff', diamant: '#8fe3ff', ring: '#f2c14e', muenze: '#ffd54a',
  knochen: '#fff1d6', ball: '#d8e84a', wollknaeuel: '#f58ab0', buch: '#7aa6e0', schluessel: '#f2c14e', karotte: '#f59a3a', fisch: '#7cc4f0', honigtopf: '#e9b44c', apfel: '#e5444c', schatz: '#ffd34d', kleeblatt: '#4fb36a', koernchen: '#d9a45a', note: '#7a8fb8', mond: '#ffe27a', fernglas: '#4a4f66', farn: '#5fb36a',
};

export const PROP_KINDS: ExtraKind[] = ['stein', 'muschel', 'seestern', 'perle', 'diamant', 'ring', 'muenze', 'knochen', 'ball', 'wollknaeuel', 'buch', 'schluessel', 'karotte', 'fisch', 'honigtopf', 'apfel', 'schatz', 'kleeblatt', 'koernchen', 'note', 'mond', 'fernglas', 'farn'];
export const isProp = (k: string | undefined): k is ExtraKind => !!k && (PROP_KINDS as string[]).includes(k);
export const isExtra = (k: string | undefined): k is ExtraKind => !!k && k in EXTRA_NAMES;

/** things worn on head or neck – drawn inside the head group so they grow and tilt with it */
export function ExtraAcc({ kind, color, a }: { kind: string; color?: string; a: AccAnchor }) {
  if (!isExtra(kind) || isProp(kind)) return null;
  const c = color || DEFAULT_COLOR[kind];
  const cx = a.cx ?? 50;
  const t = a.top;
  const ch = a.chin;
  switch (kind) {
    case 'glocke':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 22} ${ch - 3} Q${cx} ${ch + 8} ${cx + 22} ${ch - 3} L${cx + 20} ${ch + 2} Q${cx} ${ch + 12} ${cx - 20} ${ch + 2}z`} fill={c} />
          <circle cx={cx} cy={ch + 9.4} r="4.4" fill="#ffd34d" stroke="#d9a21f" strokeWidth=".9" />
          <path d={`M${cx - 3} ${ch + 9.4} h6 M${cx} ${ch + 9.4} v4`} stroke="#b57f12" strokeWidth=".9" strokeLinecap="round" />
          <circle cx={cx - 1.4} cy={ch + 7.8} r="1" fill="#fff" opacity=".7" />
        </g>
      );
    case 'halsband':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 23} ${ch - 3} Q${cx} ${ch + 8} ${cx + 23} ${ch - 3} L${cx + 21} ${ch + 2.4} Q${cx} ${ch + 12.4} ${cx - 21} ${ch + 2.4}z`} fill={c} />
          <path d={`M${cx - 19} ${ch + 0.6} Q${cx} ${ch + 10} ${cx + 19} ${ch + 0.6}`} stroke="#fff" strokeWidth=".9" strokeDasharray="1.6 2" fill="none" opacity=".6" />
          <path d={`M${cx} ${ch + 8} l4.4 3 l-1.6 5.4 h-5.6 l-1.6 -5.4z`} fill="#ffd34d" stroke="#d9a21f" strokeWidth=".8" strokeLinejoin="round" />
          <path d={`M${cx - 1.4} ${ch + 12} q1.4 1.6 2.8 0`} stroke="#b57f12" strokeWidth=".8" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'schal':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 25} ${ch - 4} Q${cx} ${ch + 10} ${cx + 25} ${ch - 4} L${cx + 21} ${ch + 5} Q${cx} ${ch + 17} ${cx - 21} ${ch + 5}z`} fill={c} />
          <path d={`M${cx + 9} ${ch + 9} q7 3 5 16 l-8 -1 q2 -7 -2 -12z`} fill={shade(c, -0.12)} />
          <g stroke="#fff" strokeWidth="1.3" opacity=".55" strokeLinecap="round"><path d={`M${cx - 14} ${ch + 1} l1 6 M${cx - 4} ${ch + 4} l0 6 M${cx + 6} ${ch + 4} l-1 6 M${cx + 12} ${ch + 18} l-7 -1`} /></g>
        </g>
      );
    case 'fliege':
      return (
        <g className="pa-acc">
          <path d={`M${cx} ${ch + 7} l-11 -6 q-2 6 0 12z`} fill={c} />
          <path d={`M${cx} ${ch + 7} l11 -6 q2 6 0 12z`} fill={c} />
          <circle cx={cx} cy={ch + 7} r="3" fill={shade(c, -0.15)} />
          <circle cx={cx - 6} cy={ch + 5.4} r=".9" fill="#fff" opacity=".7" /><circle cx={cx + 6} cy={ch + 5.4} r=".9" fill="#fff" opacity=".7" />
        </g>
      );
    case 'doktorhut':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 12} ${t + 8} v8 q12 7 24 0 v-8z`} fill={shade(c, -0.1)} />
          <path d={`M${cx - 25} ${t + 4} L${cx} ${t - 7} L${cx + 25} ${t + 4} L${cx} ${t + 14}z`} fill={c} />
          <path d={`M${cx} ${t + 4} L${cx + 19} ${t + 6.4} v11`} stroke="#ffd34d" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <circle cx={cx + 19} cy={t + 18.4} r="2" fill="#ffd34d" />
          <circle cx={cx} cy={t + 4} r="1.6" fill="#ffd34d" />
        </g>
      );
    case 'strohhut':
      return (
        <g className="pa-acc">
          <ellipse cx={cx} cy={t + 8} rx="29" ry="6.4" fill={shade(c, -0.08)} />
          <path d={`M${cx - 15} ${t + 8} Q${cx - 16} ${t - 10} ${cx} ${t - 10} Q${cx + 16} ${t - 10} ${cx + 15} ${t + 8}z`} fill={c} />
          <rect x={cx - 15.4} y={t + 0.6} width="30.8" height="5" rx="2" fill="#e5566b" />
          <path d={`M${cx - 10} ${t - 5} q4 -3 9 -3 M${cx + 3} ${t + 1} h7`} stroke="#fff" strokeWidth="1" opacity=".5" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'zylinder':
      return (
        <g className="pa-acc">
          <ellipse cx={cx} cy={t + 8} rx="22" ry="4.6" fill={shade(c, -0.1)} />
          <rect x={cx - 12.5} y={t - 15} width="25" height="23" rx="3.4" fill={c} />
          <rect x={cx - 12.5} y={t + 1} width="25" height="5" fill="#e5566b" />
          <path d={`M${cx - 8} ${t - 11} v9`} stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".3" />
        </g>
      );
    case 'kopfhoerer':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 29} ${a.eyeY} Q${cx - 29} ${t - 9} ${cx} ${t - 9} Q${cx + 29} ${t - 9} ${cx + 29} ${a.eyeY}`} stroke={shade(c, -0.15)} strokeWidth="3.4" fill="none" strokeLinecap="round" />
          <ellipse cx={cx - 29} cy={a.eyeY + 3} rx="5.4" ry="8" fill={c} />
          <ellipse cx={cx + 29} cy={a.eyeY + 3} rx="5.4" ry="8" fill={c} />
          <ellipse cx={cx - 29} cy={a.eyeY + 3} rx="2.6" ry="4.6" fill="#fff" opacity=".28" />
          <ellipse cx={cx + 29} cy={a.eyeY + 3} rx="2.6" ry="4.6" fill="#fff" opacity=".28" />
        </g>
      );
    case 'seerose':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 15} ${t + 5} Q${cx} ${t - 6} ${cx + 15} ${t + 5} Q${cx} ${t + 11} ${cx - 15} ${t + 5}z`} fill="#7bc47f" />
          <path d={`M${cx} ${t + 5} L${cx + 9} ${t + 2.4}`} stroke="#5fa766" strokeWidth="1" strokeLinecap="round" />
          {[-52, -26, 0, 26, 52].map((r) => (
            <ellipse key={r} cx={cx - 1} cy={t - 3} rx="2.8" ry="6" fill={c} transform={`rotate(${r} ${cx - 1} ${t + 3})`} />
          ))}
          <circle cx={cx - 1} cy={t + 1} r="2.2" fill="#ffd34d" />
        </g>
      );
    case 'blattkrone':
      return (
        <g className="pa-acc">
          {[-3, -2, -1, 0, 1, 2, 3].map((i) => (
            <path key={i} d={`M${cx + i * 7} ${t + 7 - (3 - Math.abs(i)) * 1.2} q-3.6 -7 0 -13 q3.6 6 0 13z`} fill={i % 2 ? shade(c, -0.1) : c} transform={`rotate(${i * 13} ${cx + i * 7} ${t + 7})`} />
          ))}
          <circle cx={cx - 4} cy={t + 3} r="1.5" fill="#ff8fa8" /><circle cx={cx + 8} cy={t + 2.4} r="1.5" fill="#ffd34d" />
        </g>
      );
    case 'sterne': {
      const star = (x: number, y: number, s: number, o: number) => <path key={`${x}${y}`} d={`M${x} ${y - 4.6 * s} l${1.3 * s} ${3.2 * s} ${3.2 * s} ${1.3 * s} -${3.2 * s} ${1.3 * s} -${1.3 * s} ${3.2 * s} -${1.3 * s} -${3.2 * s} -${3.2 * s} -${1.3 * s} ${3.2 * s} -${1.3 * s}z`} fill={c} opacity={o} stroke={shade(c, -0.2)} strokeWidth=".4" />;
      return (
        <g className="pa-acc">
          {star(cx - 15, t - 1, 0.9, 0.95)}
          {star(cx, t - 8, 1.25, 1)}
          {star(cx + 15, t - 1, 0.9, 0.95)}
        </g>
      );
    }
    case 'eierschale':
      return (
        <g className="pa-acc">
          <path d={`M${cx - 19} ${t + 11} Q${cx - 22} ${t - 13} ${cx} ${t - 13} Q${cx + 22} ${t - 13} ${cx + 19} ${t + 11} l-4.2 -6.4 l-3.8 8 l-4.2 -8 l-4.2 8 l-4.2 -8 l-4 8 l-3.8 -8z`} fill={c} stroke={shade(c, -0.22)} strokeWidth=".9" strokeLinejoin="round" />
          <g fill="#f2c9a3" opacity=".8"><circle cx={cx - 7} cy={t - 5} r="1.8" /><circle cx={cx + 6} cy={t - 8} r="1.4" /><circle cx={cx + 10} cy={t} r="1.9" /></g>
          <path d={`M${cx - 12} ${t - 8} q4 -3 8 -3.4`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".8" />
        </g>
      );
    case 'taucherbrille': {
      const r = 8.8;
      return (
        <g className="pa-acc">
          <path d={`M${cx - a.eyeDx - r} ${a.eyeY - 1} q-7 -2 -9 -8 M${cx + a.eyeDx + r} ${a.eyeY - 1} q7 -2 9 -8`} stroke={shade(c, -0.4)} strokeWidth="3" fill="none" strokeLinecap="round" />
          <circle cx={cx - a.eyeDx} cy={a.eyeY} r={r} fill={c} fillOpacity=".25" stroke={shade(c, -0.35)} strokeWidth="2.6" />
          <circle cx={cx + a.eyeDx} cy={a.eyeY} r={r} fill={c} fillOpacity=".25" stroke={shade(c, -0.35)} strokeWidth="2.6" />
          <path d={`M${cx - a.eyeDx + r} ${a.eyeY} h${2 * (a.eyeDx - r)}`} stroke={shade(c, -0.35)} strokeWidth="2.6" />
          <path d={`M${cx - a.eyeDx - 5} ${a.eyeY - 5} q2 -2 5 -2.4 M${cx + a.eyeDx - 5} ${a.eyeY - 5} q2 -2 5 -2.4`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" fill="none" opacity=".8" />
        </g>
      );
    }
    case 'sonnenbrille': {
      const r = 8.2;
      return (
        <g className="pa-acc">
          <path d={`M${cx - a.eyeDx + r} ${a.eyeY - 1} q${a.eyeDx - r} -3 ${2 * (a.eyeDx - r)} 0 M${cx - a.eyeDx - r} ${a.eyeY - 1} l-5 -1.4 M${cx + a.eyeDx + r} ${a.eyeY - 1} l5 -1.4`} stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none" />
          <rect x={cx - a.eyeDx - r} y={a.eyeY - r + 1} width={2 * r} height={2 * r - 1.6} rx="5.4" fill={c} opacity=".92" />
          <rect x={cx + a.eyeDx - r} y={a.eyeY - r + 1} width={2 * r} height={2 * r - 1.6} rx="5.4" fill={c} opacity=".92" />
          <path d={`M${cx - a.eyeDx - 5} ${a.eyeY - 3} l5 -2.6 M${cx + a.eyeDx - 5} ${a.eyeY - 3} l5 -2.6`} stroke="#fff" strokeWidth="1.3" strokeLinecap="round" opacity=".5" />
        </g>
      );
    }
    default:
      return null;
  }
}

/** things beside or in front of the animal. Local origin = bottom centre of the item. */
function Prop({ kind, c }: { kind: ExtraKind; c: string }) {
  switch (kind) {
    case 'stein':
      return (
        <g>
          <path d="M-8.4 -0.6 Q-10.6 -7 -5 -11.6 Q1 -14.4 6.6 -10.6 Q10.4 -6 8.4 -0.6z" fill={c} stroke={shade(c, -0.25)} strokeWidth=".8" />
          <path d="M-5 -9 Q-1 -12 3 -11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity=".55" />
          <g fill={shade(c, -0.22)} opacity=".6"><circle cx="2.6" cy="-5" r="1" /><circle cx="-3" cy="-3.4" r=".8" /><circle cx="5.4" cy="-2.6" r=".7" /></g>
        </g>
      );
    case 'muschel':
      return (
        <g>
          <path d="M0 -0.6 L-8.6 -9 Q-7 -15 0 -15 Q7 -15 8.6 -9z" fill={c} stroke={shade(c, -0.18)} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M0 -1.4 V-14.6 M-3.6 -3.6 L-6 -12.6 M3.6 -3.6 L6 -12.6" stroke={shade(c, -0.2)} strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".7" />
          <path d="M-3 -13 q2 -1.6 5 -1" stroke="#fff" strokeWidth="1.1" strokeLinecap="round" fill="none" opacity=".7" />
        </g>
      );
    case 'seestern':
      return (
        <g>
          <path d="M0 -15 L2.8 -9 L9 -8.6 L4.2 -4.6 L5.8 1 L0 -2.4 L-5.8 1 L-4.2 -4.6 L-9 -8.6 L-2.8 -9z" fill={c} stroke={shade(c, -0.2)} strokeWidth=".8" strokeLinejoin="round" />
          <g fill="#fff" opacity=".55"><circle cx="0" cy="-10" r=".9" /><circle cx="-4.2" cy="-7.6" r=".7" /><circle cx="4.2" cy="-7.6" r=".7" /><circle cx="0" cy="-6" r=".7" /></g>
        </g>
      );
    case 'perle':
      return (
        <g>
          <circle cx="0" cy="-5.6" r="5.4" fill={c} stroke="#d9c9ec" strokeWidth=".9" />
          <ellipse cx="-1.8" cy="-7.4" rx="1.8" ry="1.2" fill="#fff" opacity=".9" transform="rotate(-30 -1.8 -7.4)" />
          <circle cx="1.8" cy="-3.2" r="1.2" fill="#e6d4f7" opacity=".7" />
        </g>
      );
    case 'diamant':
      return (
        <g>
          <path d="M-7 -10 L-3.6 -15 H3.6 L7 -10 L0 -0.6z" fill={c} stroke={shade(c, -0.35)} strokeWidth=".8" strokeLinejoin="round" />
          <path d="M-7 -10 H7 M-3.6 -15 L-2 -10 L0 -0.6 L2 -10 L3.6 -15" stroke="#fff" strokeWidth=".8" fill="none" opacity=".8" strokeLinejoin="round" />
          <path d="M-9 -13 l1 2.4 2.4 1 -2.4 1 -1 2.4 -1 -2.4 -2.4 -1 2.4 -1z" fill="#fff" opacity=".9" transform="translate(11 -6) scale(.8)" />
        </g>
      );
    case 'ring':
      return (
        <g>
          <circle cx="0" cy="-4.6" r="4.4" fill="none" stroke={c} strokeWidth="2.2" />
          <path d="M-2.8 -11 L0 -14.6 L2.8 -11 L0 -8.4z" fill="#8fe3ff" stroke="#5bb7d6" strokeWidth=".7" strokeLinejoin="round" />
          <path d="M-3 -4.6 q0 3 2 3.6" stroke="#fff" strokeWidth=".9" fill="none" strokeLinecap="round" opacity=".7" />
        </g>
      );
    case 'muenze':
      return (
        <g>
          <circle cx="0" cy="-5.6" r="5.6" fill={c} stroke="#d9a21f" strokeWidth="1" />
          <circle cx="0" cy="-5.6" r="3.6" fill="none" stroke="#e8b52e" strokeWidth=".8" />
          <path d="M-2 -5.6 h4 M0 -7.6 v4" stroke="#d9a21f" strokeWidth=".9" strokeLinecap="round" />
          <path d="M-3.8 -8.6 q1.6 -1.6 3.6 -1.6" stroke="#fff6c8" strokeWidth="1" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'knochen':
      return (
        <g transform="rotate(-16)">
          <rect x="-9" y="-9" width="18" height="6.4" rx="3" fill={c} stroke={shade(c, -0.18)} strokeWidth=".8" />
          {[[-9, -9], [-9, -3.2], [9, -9], [9, -3.2]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="3.4" fill={c} stroke={shade(c, -0.18)} strokeWidth=".8" />)}
          <path d="M-5 -7.6 h8" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity=".7" />
        </g>
      );
    case 'ball':
      return (
        <g>
          <circle cx="0" cy="-7" r="7" fill={c} stroke={shade(c, -0.22)} strokeWidth=".8" />
          <path d="M-5.6 -11.4 Q0 -7 -5.6 -2.4 M5.6 -11.6 Q0 -7 5.6 -2.4" stroke="#fff" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          <circle cx="-2.4" cy="-10.4" r="1.4" fill="#fff" opacity=".5" />
        </g>
      );
    case 'wollknaeuel':
      return (
        <g>
          <path d="M6 -3 Q14 0 10 3 Q4 4 -2 1" stroke={shade(c, -0.1)} strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <circle cx="0" cy="-7" r="7.4" fill={c} />
          <g stroke={shade(c, 0.3)} strokeWidth="1" fill="none" strokeLinecap="round" opacity=".8"><path d="M-6 -8 Q0 -4 6 -9 M-6 -4 Q0 0 6 -5 M-3 -13 Q2 -8 -2 -1" /></g>
        </g>
      );
    case 'buch':
      return (
        <g transform="rotate(-6)">
          <rect x="-8.5" y="-14" width="17" height="14" rx="1.6" fill={c} />
          <rect x="-7" y="-12.6" width="14" height="11.4" rx="1" fill="#fff" opacity=".9" />
          <rect x="-8.5" y="-14" width="3" height="14" rx="1.2" fill={shade(c, -0.2)} />
          <path d="M-3 -9 h8 M-3 -6 h8 M-3 -3.4 h5" stroke={shade(c, 0.1)} strokeWidth="1" strokeLinecap="round" opacity=".6" />
          <path d="M4 -14 v6 l1.6 -1.4 l1.6 1.4 v-6" fill="#e5566b" />
        </g>
      );
    case 'schluessel':
      return (
        <g transform="rotate(-24)">
          <circle cx="0" cy="-13" r="4.6" fill="none" stroke={c} strokeWidth="2.4" />
          <path d="M0 -8.4 v10 M0 -1 h4 M0 -4 h3" stroke={c} strokeWidth="2.2" strokeLinecap="round" fill="none" />
          <circle cx="-1.6" cy="-14.6" r="1" fill="#fff" opacity=".7" />
        </g>
      );
    case 'karotte':
      return (
        <g transform="rotate(-14)">
          <path d="M-4.4 -16 Q0 -18 4.4 -16 L0.6 0 Q0 1 -0.6 0z" fill={c} />
          <path d="M-3 -13 h3 M-1.6 -8 h3 M-0.6 -4 h2" stroke={shade(c, -0.25)} strokeWidth=".9" strokeLinecap="round" />
          <path d="M0 -16.4 q-4 -4 -6 -8 q4 0 6 3 M0 -16.4 q0 -6 1 -9 q3 3 -1 9 M0 -16.4 q4 -3 7 -5 q0 4 -7 5" fill="#5fb36a" />
        </g>
      );
    case 'fisch':
      return (
        <g transform="rotate(-10)">
          <path d="M-9 -7 Q-2 -14 6 -7 Q-2 0 -9 -7z" fill={c} />
          <path d="M5 -7 L11 -12 L11 -2z" fill={shade(c, -0.1)} />
          <circle cx="-5.4" cy="-8" r="1.2" fill="#2b2230" /><circle cx="-5" cy="-8.4" r=".4" fill="#fff" />
          <path d="M-1 -11 q2 4 0 8" stroke="#fff" strokeWidth="1" opacity=".5" fill="none" strokeLinecap="round" />
        </g>
      );
    case 'honigtopf':
      return (
        <g>
          <path d="M-7 -12 Q-10 -6 -7 -1 Q0 2 7 -1 Q10 -6 7 -12z" fill={c} />
          <rect x="-7.6" y="-15" width="15.2" height="4" rx="2" fill="#f3e0b0" />
          <path d="M-5 -11 q0 5 2 5 q2 0 2 -5" fill="#c97d1d" opacity=".75" />
          <path d="M-5 -6 h10" stroke="#fff" strokeWidth="1" opacity=".5" />
          <circle cx="-3.4" cy="-5" r="1" fill="#fff" opacity=".6" />
        </g>
      );
    case 'apfel':
      return (
        <g>
          <path d="M0 -12 Q-8 -15 -8 -7 Q-8 0 -3 0 Q0 -1 3 0 Q8 0 8 -7 Q8 -15 0 -12z" fill={c} />
          <path d="M0 -12 q1 -3 3 -4" stroke="#7a5030" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <path d="M1.4 -14 q4 -3 6 0 q-3 3 -6 0z" fill="#5fb36a" />
          <ellipse cx="-3.6" cy="-8" rx="1.6" ry="2.4" fill="#fff" opacity=".4" transform="rotate(20 -3.6 -8)" />
        </g>
      );
    case 'schatz':
      return (
        <g>
          {[[-6, -2.6], [0, -2.6], [6, -2.6], [-3, -7.4], [3, -7.4], [0, -12]].map(([x, y]) => (
            <g key={`${x}${y}`}><circle cx={x} cy={y} r="3.6" fill={c} stroke="#d9a21f" strokeWidth=".8" /><path d={`M${x - 1.6} ${y} h3.2`} stroke="#d9a21f" strokeWidth=".8" strokeLinecap="round" /></g>
          ))}
          <path d="M8 -9 l3 -4 l3 4 l-3 4z" fill="#ff6b8a" stroke="#d4405f" strokeWidth=".7" strokeLinejoin="round" />
        </g>
      );
    case 'kleeblatt':
      return (
        <g>
          <path d="M0 0 Q2 -5 0 -8" stroke="#3b9a58" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          {[[-4.4, -11.4], [4.4, -11.4], [-4.4, -5.8], [4.4, -5.8]].map(([x, y]) => <circle key={`${x}${y}`} cx={x} cy={y} r="4.2" fill={c} />)}
          <circle cx="0" cy="-8.6" r="1.6" fill={shade(c, -0.2)} />
          <circle cx="-5.4" cy="-12.6" r="1" fill="#fff" opacity=".45" />
        </g>
      );
    case 'koernchen':
      return (
        <g>
          {[[-6, -1.6, 20], [-1, -2, -10], [4, -1.6, 30], [8.6, -1.4, -20], [-3, -5.4, 0], [3, -5.2, 40], [0, -8.6, -30]].map(([x, y, r]) => (
            <ellipse key={`${x}${y}`} cx={x} cy={y} rx="2.6" ry="1.5" fill={c} stroke={shade(c, -0.25)} strokeWidth=".5" transform={`rotate(${r} ${x} ${y})`} />
          ))}
        </g>
      );
    case 'note':
      return (
        <g>
          <ellipse cx="-3" cy="-3" rx="3.6" ry="2.8" fill={c} transform="rotate(-20 -3 -3)" />
          <path d="M0 -3.8 V-17" stroke={c} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M0 -17 q5 1 5 6" stroke={c} strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>
      );
    case 'mond':
      return (
        <g>
          <path d="M3 -16 A8 8 0 1 0 8 -2 A6.4 6.4 0 1 1 3 -16z" fill={c} stroke={shade(c, -0.2)} strokeWidth=".7" />
          <path d="M9 -14 l1 2.2 2.2 1 -2.2 1 -1 2.2 -1 -2.2 -2.2 -1 2.2 -1z" fill="#fff" opacity=".9" />
        </g>
      );
    case 'fernglas':
      return (
        <g>
          <rect x="-9.4" y="-14" width="8" height="12" rx="3.4" fill={c} />
          <rect x="1.4" y="-14" width="8" height="12" rx="3.4" fill={c} />
          <rect x="-3" y="-11" width="6" height="4" rx="1" fill={shade(c, -0.2)} />
          <circle cx="-5.4" cy="-2.2" r="3.6" fill="#8fd3f4" stroke={shade(c, -0.25)} strokeWidth="1" />
          <circle cx="5.4" cy="-2.2" r="3.6" fill="#8fd3f4" stroke={shade(c, -0.25)} strokeWidth="1" />
          <circle cx="-6.4" cy="-3.2" r="1" fill="#fff" opacity=".8" /><circle cx="4.4" cy="-3.2" r="1" fill="#fff" opacity=".8" />
        </g>
      );
    case 'farn':
      return (
        <g>
          <path d="M0 0 Q-3 -9 2 -19" stroke={shade(c, -0.2)} strokeWidth="1.3" fill="none" strokeLinecap="round" />
          {[[-1.2, -4], [-0.6, -8], [0.2, -12], [1.2, -16]].map(([x, y]) => (
            <g key={y}><ellipse cx={x - 4} cy={y} rx="4" ry="1.7" fill={c} transform={`rotate(-24 ${x - 4} ${y})`} /><ellipse cx={x + 4} cy={y - 1} rx="4" ry="1.7" fill={c} transform={`rotate(24 ${x + 4} ${y - 1})`} /></g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

const PLACE: Partial<Record<ExtraKind, [number, number]>> = { buch: [50, 100], fernglas: [50, 96], honigtopf: [50, 104] };

/** beside / in front of the figure; grows with the animal. `place` overrides where it sits (otter: in the paws), `hands` draws two little paws around it. */
export function PropLayer({ kind, color, age, place, hands }: { kind?: string; color?: string; age: number; place?: [number, number]; hands?: string }) {
  if (!isProp(kind)) return null;
  const [x, y] = place ?? PLACE[kind] ?? [20, 106];
  const k = (0.82 + 0.18 * age) * 1.25;
  return (
    <g className="pa-prop" transform={`translate(${x} ${y}) scale(${k.toFixed(3)})`}>
      <g className="pa-prop-in">
        <Prop kind={kind} c={color || DEFAULT_COLOR[kind]} />
      </g>
      {hands && (
        <g fill={hands}>
          <ellipse cx="-8" cy="-6" rx="3.6" ry="3" />
          <ellipse cx="8" cy="-6" rx="3.6" ry="3" />
        </g>
      )}
    </g>
  );
}

/** a small clock the animal has with it while the timer runs (instead of the leaf of the light beings) */
export function TimerClock({ age }: { age: number }) {
  const k = (0.85 + 0.15 * age) * 1.3;
  return (
    <g transform={`translate(80 105) scale(${k.toFixed(3)})`}>
     <g className="pa-clock">
      <path d="M-5 -1 q-2 2 -3 1 M5 -1 q2 2 3 1" stroke="#7a6a8a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="0" cy="-8" r="8" fill="#fffdf6" stroke="var(--color-primary, #7a8fb8)" strokeWidth="2.2" />
      <circle cx="-4.6" cy="-15.4" r="2" fill="var(--color-primary, #7a8fb8)" />
      <circle cx="4.6" cy="-15.4" r="2" fill="var(--color-primary, #7a8fb8)" />
      <g stroke="#9a90a8" strokeWidth="1" strokeLinecap="round"><path d="M0 -14.2 v1.6 M0 -3.4 v1.6 M-6.2 -8 h1.6 M4.6 -8 h1.6" /></g>
      <path d="M0 -8 L-2.6 -9.6" stroke="#4a3f5c" strokeWidth="1.6" strokeLinecap="round" />
      <g className="pa-clock-hand"><path d="M0 -8 V-13.4" stroke="#e5566b" strokeWidth="1.3" strokeLinecap="round" /></g>
      <circle cx="0" cy="-8" r="1.2" fill="#4a3f5c" />
     </g>
    </g>
  );
}
