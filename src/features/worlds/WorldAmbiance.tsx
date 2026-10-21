import { useSettings } from '../../state/SettingsContext';
import { tint, worldById, type WorldId } from './worldData';
import { WorldScene } from './WorldScene';
import './worlds.css';

const seq = (n: number) => Array.from({ length: n }, (_, i) => i);
/** deterministic pseudo-random 0..1 so the picture is the same on every render */
const r = (i: number, k: number) => ((Math.sin(i * 12.9898 + k * 78.233) * 43758.5453) % 1 + 1) % 1;

function Particles({ id }: { id: WorldId }) {
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
        <div className="absolute inset-x-0 top-0" style={{ height: '62%', background: `linear-gradient(180deg, ${tint(info.wash, info.id === 'nacht' ? 30 : 24)} 0%, transparent 100%)` }} />
        <WorldScene id={info.id} height="62%" />
        {!settings.worldStill && <Particles id={info.id} />}
      </div>
    </div>
  );
}
