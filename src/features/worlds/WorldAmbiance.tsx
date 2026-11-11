import type React from 'react';
import { useSettings } from '../../state/SettingsContext';
import { tint, worldById, type WorldId } from './worldData';
import { WorldScene } from './WorldScene';
import './worlds.css';

const seq = (n: number) => Array.from({ length: n }, (_, i) => i);
/** deterministic pseudo-random 0..1 so the picture is the same on every render */
const r = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

export function Particles({ id }: { id: WorldId }) {
  switch (id) {
    case 'wald':
      return (
        <>
          {seq(9).map((i) => (
            <span key={i} className="w-anim w-firefly" style={{ left: `${8 + r(i, 1) * 84}%`, bottom: `${10 + r(i, 2) * 38}%`, animationDelay: `${-r(i, 3) * 8}s`, animationDuration: `${7 + r(i, 4) * 6}s` }} />
          ))}
        </>
      );
    case 'meer':
      return (
        <>
          {seq(9).map((i) => (
            <span key={i} className="w-anim w-bubble" style={{ left: `${6 + r(i, 1) * 88}%`, width: 5 + r(i, 2) * 8, height: 5 + r(i, 2) * 8, animationDelay: `${-r(i, 3) * 14}s`, animationDuration: `${12 + r(i, 4) * 10}s` }} />
          ))}
        </>
      );
    case 'wiese':
      return (
        <>
          {seq(4).map((i) => (
            <svg key={i} className="w-anim w-butterfly" viewBox="0 0 24 16" width="22" height="15" style={{ bottom: `${22 + r(i, 1) * 24}%`, animationDelay: `${-i * 6}s`, animationDuration: `${26 + i * 5}s` }}>
              <g className="w-flap" style={{ transformOrigin: '12px 8px' }}>
                <ellipse cx="7" cy="6" rx="6" ry="5" fill={tint(['#f2a7c0', '#f7d56b', '#c9a7f0', '#ffffff'][i], 80)} />
                <ellipse cx="17" cy="6" rx="6" ry="5" fill={tint(['#f2a7c0', '#f7d56b', '#c9a7f0', '#ffffff'][i], 80)} />
                <ellipse cx="9" cy="11" rx="4" ry="3.4" fill={tint(['#e58aa8', '#e8b93c', '#a98be0', '#e6e6e6'][i], 70)} />
                <ellipse cx="15" cy="11" rx="4" ry="3.4" fill={tint(['#e58aa8', '#e8b93c', '#a98be0', '#e6e6e6'][i], 70)} />
              </g>
            </svg>
          ))}
        </>
      );
    case 'herbst':
      return (
        <>
          {seq(12).map((i) => (
            <span key={i} className="w-anim w-leaf" style={{ left: `${3 + r(i, 1) * 94}%`, background: tint(['#d17a2f', '#c05a2b', '#d9a03f', '#b8472c'][i % 4], 85), animationDelay: `${-r(i, 3) * 16}s`, animationDuration: `${13 + r(i, 4) * 9}s` }} />
          ))}
        </>
      );
    case 'winter':
      return (
        <>
          {seq(18).map((i) => (
            <span key={i} className="w-anim w-flake" style={{ left: `${2 + r(i, 1) * 96}%`, width: 3 + r(i, 2) * 3, height: 3 + r(i, 2) * 3, animationDelay: `${-r(i, 3) * 18}s`, animationDuration: `${14 + r(i, 4) * 10}s` }} />
          ))}
        </>
      );
    case 'berge':
      return (
        <>
          {seq(3).map((i) => (
            <span key={i} className="w-anim w-cloud" style={{ top: `${6 + i * 11}%`, width: 120 + i * 40, height: 26 + i * 6, animationDelay: `${-i * 24}s`, animationDuration: `${80 + i * 25}s` }} />
          ))}
        </>
      );
    case 'strand':
      return (
        <>
          {seq(3).map((i) => (
            <svg key={i} className="w-anim w-bird" viewBox="0 0 26 10" width={26 - i * 3} height={10 - i} style={{ top: `${8 + i * 7}%`, animationDelay: `${-i * 21}s`, animationDuration: `${70 + i * 18}s` }}>
              <path d="M1 8 q6 -9 12 -2 q6 -7 12 2" stroke={tint('#6b7b88', 70)} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          ))}
          {seq(2).map((i) => (
            <span key={`c${i}`} className="w-anim w-cloud" style={{ top: `${5 + i * 10}%`, width: 110 + i * 30, height: 22 + i * 5, animationDelay: `${-i * 30}s`, animationDuration: `${100 + i * 20}s` }} />
          ))}
        </>
      );
    case 'abendrot':
      return (
        <>
          {seq(3).map((i) => (
            <span key={i} className="w-anim w-cloud w-cloud-warm" style={{ top: `${7 + i * 9}%`, width: 130 + i * 40, height: 24 + i * 6, animationDelay: `${-i * 26}s`, animationDuration: `${95 + i * 25}s` }} />
          ))}
          {seq(4).map((i) => (
            <svg key={`b${i}`} className="w-anim w-bird" viewBox="0 0 26 10" width={20 - i * 2} height={8} style={{ top: `${20 + i * 5}%`, animationDelay: `${-i * 12}s`, animationDuration: `${55 + i * 7}s` }}>
              <path d="M1 8 q6 -9 12 -2 q6 -7 12 2" stroke={tint('#5a3a5e', 80)} strokeWidth="1.5" fill="none" strokeLinecap="round" />
            </svg>
          ))}
        </>
      );
    case 'kirschbluete':
      return (
        <>
          {seq(14).map((i) => (
            <span key={i} className="w-anim w-petal" style={{ left: `${3 + r(i, 1) * 94}%`, background: tint(['#f4b6cb', '#f8cadb', '#ee9fbb'][i % 3], 88), animationDelay: `${-r(i, 3) * 18}s`, animationDuration: `${15 + r(i, 4) * 10}s` }} />
          ))}
        </>
      );
    case 'nebel':
      return (
        <>
          {seq(4).map((i) => (
            <span key={i} className="w-anim w-cloud w-fog" style={{ top: `${30 + i * 11}%`, width: 240 + i * 60, height: 40 + i * 10, animationDelay: `${-i * 28}s`, animationDuration: `${120 + i * 30}s` }} />
          ))}
        </>
      );
    case 'regen':
      return (
        <>
          {seq(3).map((i) => (
            <span key={`c${i}`} className="w-anim w-cloud w-cloud-grey" style={{ top: `${3 + i * 6}%`, width: 160 + i * 40, height: 28 + i * 6, animationDelay: `${-i * 30}s`, animationDuration: `${105 + i * 25}s` }} />
          ))}
          {seq(24).map((i) => (
            <span key={i} className="w-anim w-drop" style={{ left: `${2 + r(i, 1) * 96}%`, height: 14 + r(i, 2) * 14, animationDelay: `${-r(i, 3) * 4}s`, animationDuration: `${2.6 + r(i, 4) * 1.6}s` }} />
          ))}
        </>
      );
    case 'polarlicht':
      return (
        <>
          {seq(30).map((i) => (
            <span key={i} className="w-anim w-star" style={{ left: `${r(i, 1) * 100}%`, top: `${r(i, 2) * 48}%`, width: 1.4 + r(i, 3) * 1.6, height: 1.4 + r(i, 3) * 1.6, animationDelay: `${-r(i, 4) * 6}s`, animationDuration: `${3 + r(i, 5) * 4}s` }} />
          ))}
        </>
      );
    case 'maerchenwald':
      return (
        <>
          {seq(10).map((i) => (
            <span key={i} className="w-anim w-firefly" style={{ left: `${6 + r(i, 1) * 88}%`, bottom: `${8 + r(i, 2) * 44}%`, background: ['#f7b6e6', '#c9b4ff', '#a8f0e0'][i % 3], boxShadow: `0 0 10px 3px ${['rgba(247,182,230,.55)', 'rgba(201,180,255,.55)', 'rgba(168,240,224,.55)'][i % 3]}`, animationDelay: `${-r(i, 3) * 8}s`, animationDuration: `${8 + r(i, 4) * 6}s` }} />
          ))}
          {seq(16).map((i) => (
            <span key={`s${i}`} className="w-anim w-star" style={{ left: `${r(i, 5) * 100}%`, top: `${r(i, 6) * 38}%`, width: 1.4 + r(i, 7) * 1.6, height: 1.4 + r(i, 7) * 1.6, animationDelay: `${-r(i, 8) * 6}s`, animationDuration: `${3 + r(i, 9) * 4}s` }} />
          ))}
        </>
      );
    case 'unterwasser':
      return (
        <>
          {seq(8).map((i) => (
            <span key={i} className="w-anim w-bubble" style={{ left: `${6 + r(i, 1) * 88}%`, width: 4 + r(i, 2) * 8, height: 4 + r(i, 2) * 8, animationDelay: `${-r(i, 3) * 14}s`, animationDuration: `${12 + r(i, 4) * 10}s` }} />
          ))}
          {seq(4).map((i) => (
            <svg key={`f${i}`} className="w-anim w-bird" viewBox="0 0 30 14" width={26 - i * 3} height={12 - i} style={{ top: `${24 + i * 12}%`, animationDelay: `${-i * 15}s`, animationDuration: `${50 + i * 14}s` }}>
              <path d="M2 7 C8 0 18 0 24 7 C18 14 8 14 2 7 Z M24 7 L30 2 L30 12 Z" fill={tint(['#f2a65e', '#f7d56b', '#e58aa8', '#9ad0e8'][i], 80)} />
              <circle cx="8" cy="6" r="1.1" fill="#2f3a4a" />
            </svg>
          ))}
        </>
      );
    case 'himmel':
      return (
        <>
          {seq(4).map((i) => (
            <span key={i} className="w-anim w-cloud" style={{ top: `${4 + i * 9}%`, width: 150 + i * 45, height: 30 + i * 6, animationDelay: `${-i * 22}s`, animationDuration: `${85 + i * 22}s` }} />
          ))}
          {seq(3).map((i) => (
            <svg key={`b${i}`} className="w-anim w-bird" viewBox="0 0 26 10" width={22 - i * 3} height={9 - i} style={{ top: `${14 + i * 8}%`, animationDelay: `${-i * 17}s`, animationDuration: `${62 + i * 14}s` }}>
              <path d="M1 8 q6 -9 12 -2 q6 -7 12 2" stroke={tint('#5f7288', 70)} strokeWidth="1.6" fill="none" strokeLinecap="round" />
            </svg>
          ))}
        </>
      );
    case 'lagerfeuer':
      return (
        <>
          {seq(22).map((i) => (
            <span key={`s${i}`} className="w-anim w-star" style={{ left: `${r(i, 1) * 100}%`, top: `${r(i, 2) * 42}%`, width: 1.4 + r(i, 3) * 1.6, height: 1.4 + r(i, 3) * 1.6, animationDelay: `${-r(i, 4) * 6}s`, animationDuration: `${3 + r(i, 5) * 4}s` }} />
          ))}
          {seq(10).map((i) => (
            <span key={i} className="w-anim w-ember" style={{ left: `${44 + r(i, 1) * 12}%`, animationDelay: `${-r(i, 3) * 9}s`, animationDuration: `${6 + r(i, 4) * 5}s`, ['--w-dx' as string]: `${(r(i, 6) - 0.5) * 80}px` } as React.CSSProperties} />
          ))}
        </>
      );
    case 'cozy':
      return (
        <>
          {seq(14).map((i) => (
            <span key={i} className="w-anim w-mote" style={{ left: `${40 + r(i, 1) * 56}%`, top: `${22 + r(i, 2) * 56}%`, animationDelay: `${-r(i, 3) * 12}s`, animationDuration: `${12 + r(i, 4) * 10}s` }} />
          ))}
        </>
      );
    case 'nacht':
      return (
        <>
          {seq(26).map((i) => (
            <span key={i} className="w-anim w-star" style={{ left: `${r(i, 1) * 100}%`, top: `${r(i, 2) * 55}%`, width: 1.5 + r(i, 3) * 1.8, height: 1.5 + r(i, 3) * 1.8, animationDelay: `${-r(i, 4) * 6}s`, animationDuration: `${3 + r(i, 5) * 4}s` }} />
          ))}
          <span className="w-anim w-shooting" />
        </>
      );
  }
}

/**
 * The chosen aesthetic world: pinned to the viewport (inside the app column),
 * behind all content. Pure decoration – no pointer events, hidden when printing,
 * the moving parts vanish with "Weniger Bewegung" or the extra "nur Bild" switch.
 */
export function WorldAmbiance() {
  const { settings } = useSettings();
  const info = worldById(settings.world);
  if (!info) return null;
  return (
    <div className="world-pin no-print" aria-hidden="true" data-testid="world-ambiance" data-world={info.id} data-still={settings.worldStill ? 'true' : 'false'}>
      <div className="world-layer">
        <div className="absolute inset-x-0 top-0" style={{ height: '62%', background: `linear-gradient(180deg, ${tint(info.wash, ['nacht', 'lagerfeuer', 'maerchenwald'].includes(info.id) ? 30 : 24)} 0%, transparent 100%)` }} />
        <WorldScene id={info.id} height="62%" />
        {!settings.worldStill && <Particles id={info.id} />}
      </div>
    </div>
  );
}
