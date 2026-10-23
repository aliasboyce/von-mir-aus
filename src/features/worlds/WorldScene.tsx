import type { CSSProperties } from 'react';
import { tint as baseTint, worldById, type WorldId } from './worldData';
import './worlds.css';

/** artwork sits a little stronger than the particles, still mixed into the page colour */
const tint = (c: string, pct: number) => baseTint(c, Math.min(62, Math.round(pct * 1.25)));

/** soft rolling ridge: sampled sine sum, closed at the bottom */
function ridge(y: number, amp: number, phase: number, freq = 1): string {
  const pts: string[] = [];
  for (let x = 0; x <= 400; x += 20) {
    const yy = y + Math.sin((x / 400) * Math.PI * 2 * freq + phase) * amp + Math.sin((x / 400) * Math.PI * 5 * freq + phase * 2) * amp * 0.35;
    pts.push(`${x} ${yy.toFixed(1)}`);
  }
  return `M0 400 L${pts.join(' L')} L400 400 Z`;
}
/** jagged mountain line */
function peaks(y: number, amp: number, seed: number): string {
  const pts: string[] = ['0 400', `0 ${y}`];
  for (let i = 0; i <= 8; i++) {
    const x = i * 50 + (i % 2 ? 0 : 0);
    const h = i % 2 === 0 ? y - amp * (0.55 + ((i * 7 + seed) % 5) / 8) : y + amp * 0.1;
    pts.push(`${x + (i === 8 ? 0 : 0)} ${h.toFixed(1)}`);
  }
  pts.push('400 400');
  return `M${pts.join(' L')} Z`;
}
/** a row of pine trees standing on `base` */
function pines(base: number, n: number, h: number, w: number, seed: number): string {
  let d = '';
  for (let i = 0; i < n; i++) {
    const x = (i + 0.5) * (400 / n) + (((i * 37 + seed) % 11) - 5) * 2.2;
    const hh = h * (0.75 + (((i * 13 + seed) % 7) / 7) * 0.5);
    const ww = w * (0.8 + (((i * 5 + seed) % 5) / 5) * 0.4);
    d += `M${x - ww / 2} ${base} L${x} ${base - hh * 0.62} L${x + ww / 2} ${base} Z M${x - ww * 0.4} ${base - hh * 0.38} L${x} ${base - hh} L${x + ww * 0.4} ${base - hh * 0.38} Z `;
  }
  return d;
}
function wave(y: number, amp: number, len: number): string {
  let d = `M0 400 L0 ${y}`;
  for (let x = 0; x <= 800; x += len) d += ` q ${len / 4} ${-amp} ${len / 2} 0 t ${len / 2} 0`;
  return `${d} L800 400 Z`;
}

function Landscape({ id }: { id: WorldId }) {
  switch (id) {
    case 'wald':
      return (
        <>
          <path d={ridge(215, 14, 0.5)} fill={tint('#5b8d6e', 16)} />
          <path d={pines(235, 13, 62, 26, 3)} fill={tint('#3d7355', 20)} />
          <path d={ridge(268, 16, 2.2)} fill={tint('#4f8662', 24)} />
          <path d={pines(310, 9, 105, 40, 7)} fill={tint('#2f6347', 30)} />
          <path d={ridge(345, 10, 4)} fill={tint('#3a7152', 36)} />
          <g className="w-ray w-anim" style={{ transformOrigin: '70% 0' }}>
            <polygon points="250,60 285,60 330,400 230,400" fill="#fff6c8" opacity="0.1" />
            <polygon points="300,60 320,60 400,400 320,400" fill="#fff6c8" opacity="0.08" />
          </g>
        </>
      );
    case 'meer':
      return (
        <>
          <path d={ridge(235, 5, 1)} fill={tint('#6aa6cf', 14)} />
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '26s' } as CSSProperties}><path d={wave(250, 10, 100)} fill={tint('#5b97c4', 20)} /></g>
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '19s', animationDirection: 'reverse' } as CSSProperties}><path d={wave(285, 12, 80)} fill={tint('#4a86b6', 28)} /></g>
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '14s' } as CSSProperties}><path d={wave(322, 14, 200)} fill={tint('#3c76a8', 36)} /></g>
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '11s', animationDirection: 'reverse' } as CSSProperties}><path d={wave(360, 12, 100)} fill={tint('#2f6a9c', 44)} /></g>
        </>
      );
    case 'wiese': {
      const flowers = Array.from({ length: 16 }, (_, i) => ({ x: 14 + ((i * 53) % 372), y: 318 + ((i * 29) % 66), c: ['#f2a7c0', '#f7d56b', '#ffffff', '#c9a7f0'][i % 4] }));
      return (
        <>
          <path d={ridge(235, 12, 0.3)} fill={tint('#9cc27a', 16)} />
          <path d={ridge(280, 14, 2)} fill={tint('#86b366', 24)} />
          <path d={ridge(325, 10, 3.6)} fill={tint('#74a557', 34)} />
          {flowers.map((f, i) => (
            <g key={i} className="w-sway w-anim" style={{ transformOrigin: `${f.x}px ${f.y + 14}px`, animationDelay: `${(i % 6) * -0.7}s` }}>
              <line x1={f.x} y1={f.y} x2={f.x} y2={f.y + 14} stroke={tint('#4f8a3e', 55)} strokeWidth="1.6" />
              <circle cx={f.x} cy={f.y} r="4.2" fill={tint(f.c, 78)} />
              <circle cx={f.x} cy={f.y} r="1.5" fill={tint('#e8a83d', 90)} />
            </g>
          ))}
        </>
      );
    }
    case 'herbst': {
      const trees = [60, 150, 255, 340];
      return (
        <>
          <path d={ridge(240, 12, 1.2)} fill={tint('#c98b4a', 18)} />
          <path d={ridge(290, 14, 3)} fill={tint('#b36a35', 28)} />
          {trees.map((x, i) => (
            <g key={x}>
              <rect x={x - 3} y={250 - i * 4} width="6" height={70 + i * 4} rx="2" fill={tint('#6b4a33', 40)} />
              <circle cx={x} cy={238 - i * 4} r={30 + (i % 2) * 6} fill={tint(['#d17a2f', '#c05a2b', '#d9a03f', '#b8472c'][i], 34)} />
              <circle cx={x - 16} cy={254 - i * 4} r="19" fill={tint(['#c05a2b', '#d9a03f', '#b8472c', '#d17a2f'][i], 30)} />
              <circle cx={x + 17} cy={252 - i * 4} r="20" fill={tint(['#d9a03f', '#b8472c', '#d17a2f', '#c05a2b'][i], 30)} />
            </g>
          ))}
          <path d={ridge(350, 8, 5)} fill={tint('#9a5326', 40)} />
        </>
      );
    }
    case 'winter':
      return (
        <>
          <path d={ridge(235, 12, 0.8)} fill={tint('#a5bfd9', 24)} />
          <path d={pines(262, 11, 70, 28, 5)} fill={tint('#4d6f86', 28)} />
          <path d={pines(266, 11, 26, 20, 5)} fill={tint('#e9f1f8', 52)} transform="translate(0,-22)" opacity="0.7" />
          <path d={ridge(290, 14, 2.4)} fill={tint('#c3d6e8', 40)} />
          <path d={ridge(335, 12, 4.1)} fill={tint('#d7e5f2', 52)} />
        </>
      );
    case 'berge':
      return (
        <>
          <path d={peaks(235, 120, 1)} fill={tint('#8b9bc4', 18)} />
          <path d={peaks(280, 110, 4)} fill={tint('#7184b3', 26)} />
          <path d={ridge(330, 14, 1.4)} fill={tint('#5f739f', 34)} />
          <path d={ridge(368, 8, 3.2)} fill={tint('#4c6290', 42)} />
        </>
      );
    case 'strand':
      return (
        <>
          <path d={ridge(238, 4, 0.7)} fill={tint('#7fb7d6', 16)} />
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '30s' } as CSSProperties}><path d={wave(252, 7, 120)} fill={tint('#6fb0d0', 22)} /></g>
          <g className="w-wave w-anim" style={{ ['--w-dur' as string]: '22s', animationDirection: 'reverse' } as CSSProperties}><path d={wave(276, 8, 140)} fill={tint('#9ccbe0', 28)} /></g>
          <path d={ridge(300, 10, 0.4)} fill={tint('#ecd9a6', 44)} />
          <path d={ridge(338, 12, 2.6)} fill={tint('#e2c88c', 52)} />
          <path d={ridge(374, 8, 4.4)} fill={tint('#d6b97a', 58)} />
        </>
      );
    case 'abendrot':
      return (
        <>
          <circle cx="285" cy="232" r="46" fill={tint('#f6b25c', 46)} />
          <circle cx="285" cy="232" r="64" fill={tint('#f6b25c', 16)} />
          <path d={ridge(250, 12, 0.6)} fill={tint('#b8708a', 26)} />
          <path d={ridge(290, 14, 2.2)} fill={tint('#9a5a7e', 34)} />
          <path d={pines(318, 10, 70, 26, 4)} fill={tint('#6d4670', 40)} />
          <path d={ridge(350, 10, 3.9)} fill={tint('#58365f', 46)} />
        </>
      );
    case 'kirschbluete': {
      const blossoms = [[255, 150, 30], [300, 130, 26], [215, 178, 24], [330, 176, 28], [270, 196, 26], [236, 120, 20], [352, 132, 20], [300, 212, 22]];
      return (
        <>
          <path d={ridge(262, 12, 1.1)} fill={tint('#d9b9c4', 20)} />
          <path d={ridge(305, 12, 3)} fill={tint('#b4cf9a', 28)} />
          <path d="M292 392 C290 330 284 290 276 250 C272 232 268 214 262 196 M276 262 C300 244 322 230 334 206 M278 238 C254 226 238 206 226 184" stroke={tint('#6b4a45', 55)} strokeWidth="6" fill="none" strokeLinecap="round" />
          {blossoms.map(([x, y, r], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r={r} fill={tint(['#f4b6cb', '#f8cadb', '#ee9fbb'][i % 3], 46)} />
              <circle cx={x - r * 0.35} cy={y - r * 0.25} r={r * 0.55} fill={tint('#fde3ec', 52)} opacity="0.7" />
            </g>
          ))}
          <path d={ridge(352, 9, 4.6)} fill={tint('#9bbc84', 40)} />
        </>
      );
    }
    case 'nebel':
      return (
        <>
          <path d={pines(228, 14, 52, 22, 2)} fill={tint('#9aa8b2', 14)} />
          <rect x="0" y="196" width="400" height="44" fill={tint('#e4eaee', 38)} opacity="0.55" />
          <path d={pines(270, 11, 80, 30, 6)} fill={tint('#7d8e99', 22)} />
          <rect x="0" y="236" width="400" height="46" fill={tint('#e4eaee', 44)} opacity="0.5" />
          <path d={pines(318, 9, 110, 40, 8)} fill={tint('#5f7381', 30)} />
          <path d={ridge(352, 10, 2.4)} fill={tint('#4d6371', 38)} />
        </>
      );
    case 'regen':
      return (
        <>
          <path d={ridge(232, 12, 0.9)} fill={tint('#9eb0c2', 20)} />
          <path d={pines(268, 11, 64, 26, 3)} fill={tint('#6f8396', 26)} />
          <path d={ridge(300, 14, 2.5)} fill={tint('#86a0b4', 32)} />
          <path d={pines(336, 8, 96, 36, 5)} fill={tint('#566f84', 38)} />
          <path d={ridge(364, 8, 4)} fill={tint('#486074', 44)} />
        </>
      );
    case 'polarlicht':
      return (
        <>
          <path d="M0 190 C70 120 130 210 200 150 S330 110 400 170 L400 230 C330 190 270 250 200 205 S70 270 0 240 Z" fill={tint('#5fd6a0', 30)} opacity="0.55" />
          <g className="w-aurora w-anim"><path d="M0 170 C80 100 150 200 220 130 S340 90 400 150 L400 205 C330 160 260 225 190 185 S70 240 0 215 Z" fill={tint('#4fc3d9', 26)} opacity="0.5" /></g>
          <g className="w-aurora w-anim" style={{ animationDelay: '-6s' }}><path d="M0 215 C60 175 140 235 210 190 S340 170 400 205 L400 245 C320 215 270 262 200 232 S60 285 0 255 Z" fill={tint('#a07be0', 24)} opacity="0.45" /></g>
          <path d={ridge(262, 12, 1.7)} fill={tint('#3d5078', 30)} />
          <path d={pines(300, 12, 82, 30, 11)} fill={tint('#27375c', 40)} />
          <path d={ridge(346, 10, 3.1)} fill={tint('#1f2d52', 48)} />
        </>
      );
    case 'nacht':
      return (
        <>
          <path d={ridge(250, 14, 0.9)} fill={tint('#46558f', 28)} />
          <path d={pines(290, 12, 80, 30, 9)} fill={tint('#2f3d73', 36)} />
          <path d={ridge(335, 12, 3.4)} fill={tint('#27346a', 44)} />
        </>
      );
  }
}

/** The static artwork of a world (hills, trees, waves …). Particles live in WorldAmbiance. */
export function WorldScene({ id, height = '100%' }: { id: WorldId; height?: string }) {
  const info = worldById(id);
  const waveWorld = id === 'meer';
  return (
    <svg viewBox={`0 0 ${waveWorld ? 400 : 400} 400`} preserveAspectRatio="xMidYMax slice" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, width: '100%', height, overflow: 'hidden' }} aria-hidden="true" data-world-art={info?.id}>
      <Landscape id={id} />
    </svg>
  );
}
