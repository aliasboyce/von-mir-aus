import { WEATHER_META, WEATHER_ORDER } from './weatherMeta';
import { useT } from '../../i18n';
import type { WeatherCondition } from '../../data/types';

interface WeatherWheelProps {
  onSelect: (condition: WeatherCondition) => void;
  selected?: WeatherCondition | null;
}

const SIZE = 280;
const CENTER = SIZE / 2;
const RADIUS = 108;

function pointFor(index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * RADIUS, y: CENTER + Math.sin(angle) * RADIUS };
}

export function WeatherWheel({ onSelect, selected }: WeatherWheelProps) {
  const t = useT();
  const total = WEATHER_ORDER.length;

  return (
    <div className="relative mx-auto animate-in" style={{ width: SIZE, height: SIZE }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden="true">
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={1} />
        <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.55} fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 5" />
      </svg>

      <div
        className="absolute rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-center px-3"
        style={{
          width: RADIUS * 0.9,
          height: RADIUS * 0.9,
          left: CENTER,
          top: CENTER,
          transform: 'translate(-50%, -50%)',
        }}
      >
        <span className="text-[12px] text-[var(--color-primary-soft-text)]">{t.weather.subtitle}</span>
      </div>

      {WEATHER_ORDER.map((condition, i) => {
        const pos = pointFor(i, total);
        const active = selected === condition;
        return (
          <button
            key={condition}
            type="button"
            onClick={() => onSelect(condition)}
            aria-label={WEATHER_META[condition].label(t)}
            aria-pressed={active}
            className={[
              'absolute flex flex-col items-center gap-1 rounded-full transition-transform',
              'hover:scale-110 active:scale-95',
            ].join(' ')}
            style={{
              left: pos.x,
              top: pos.y,
              transform: 'translate(-50%, -50%)',
              width: 64,
            }}
          >
            <span
              className={[
                'w-14 h-14 rounded-full flex items-center justify-center text-[24px] shadow-[var(--shadow-sm)]',
                active ? 'bg-[var(--color-primary)]' : 'bg-[var(--color-surface)]',
              ].join(' ')}
              style={{ border: active ? 'none' : '1px solid var(--color-border)' }}
            >
              {WEATHER_META[condition].emoji}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)] leading-tight">
              {WEATHER_META[condition].label(t)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
