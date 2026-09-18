import { useEffect, useRef, useState } from 'react';
import { WEATHER_META, WEATHER_ORDER } from './weatherMeta';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import type { WeatherCondition } from '../../data/types';

interface WeatherWheelProps {
  onSelect: (condition: WeatherCondition) => void;
  selected?: WeatherCondition | null;
}

/**
 * "Wetter-Kreis drehbar + neue Zustaende"-Auftrag — grown from 7 to 15
 * conditions, which no longer fit as a static ring of clickable
 * buttons without serious crowding. Rebuilt as a genuinely rotatable
 * dial instead: drag anywhere on the wheel to spin it, and whichever
 * condition lands at the top marker (with a satisfying snap on
 * release) becomes the selection — tapping a condition directly still
 * works too, as a shortcut for anyone who'd rather not drag.
 */
const SIZE = 320;
const CENTER = SIZE / 2;
const RADIUS = 128;

function pointFor(index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / total - Math.PI / 2;
  return { x: CENTER + Math.cos(angle) * RADIUS, y: CENTER + Math.sin(angle) * RADIUS };
}

function angleFromCenter(clientX: number, clientY: number, rect: DOMRect): number {
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  return (Math.atan2(clientY - cy, clientX - cx) * 180) / Math.PI;
}

export function WeatherWheel({ onSelect, selected }: WeatherWheelProps) {
  const t = useT();
  const { settings } = useSettings();
  const total = WEATHER_ORDER.length;
  const stepDeg = 360 / total;

  const selectedIndex = selected ? WEATHER_ORDER.indexOf(selected) : 0;
  const [rotation, setRotation] = useState(() => -(selectedIndex >= 0 ? selectedIndex : 0) * stepDeg);
  const dragState = useRef<{ startAngle: number; startRotation: number; lastAngle: number; moved: boolean } | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function indexAtTop(rot: number): number {
    const normalized = ((-rot % 360) + 360) % 360;
    return Math.round(normalized / stepDeg) % total;
  }

  function settle(rot: number) {
    const idx = indexAtTop(rot);
    const snapped = -idx * stepDeg;
    setRotation(snapped);
    const condition = WEATHER_ORDER[idx];
    if (condition !== selected) triggerHaptic('select', settings);
    onSelect(condition);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragState.current || !wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const angle = angleFromCenter(e.clientX, e.clientY, rect);
      let delta = angle - dragState.current.lastAngle;
      // handle wraparound at +-180deg
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      if (Math.abs(angle - dragState.current.startAngle) > 3) dragState.current.moved = true;
      dragState.current.lastAngle = angle;
      setRotation((r) => r + delta);
    }
    function onUp() {
      if (!dragState.current) return;
      const wasMoved = dragState.current.moved;
      dragState.current = null;
      setDragging(false);
      if (wasMoved) {
        setRotation((r) => {
          settle(r);
          return r;
        });
      }
    }
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function onPointerDown(e: React.PointerEvent) {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const angle = angleFromCenter(e.clientX, e.clientY, rect);
    dragState.current = { startAngle: angle, startRotation: rotation, lastAngle: angle, moved: false };
    setDragging(true);
  }

  function selectDirectly(condition: WeatherCondition) {
    const idx = WEATHER_ORDER.indexOf(condition);
    setRotation(-idx * stepDeg);
    if (condition !== selected) triggerHaptic('select', settings);
    onSelect(condition);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        ref={wheelRef}
        className="relative mx-auto touch-none"
        style={{ width: SIZE, height: SIZE, cursor: dragging ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        role="slider"
        aria-label={t.weather.subtitle}
        aria-valuemin={0}
        aria-valuemax={total - 1}
        aria-valuenow={selectedIndex}
      >
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} className="absolute inset-0" aria-hidden="true">
          <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--color-border)" strokeWidth={1} />
          <circle cx={CENTER} cy={CENTER} r={RADIUS * 0.5} fill="none" stroke="var(--color-border)" strokeWidth={1} strokeDasharray="2 5" />
          {/* top selection marker — fixed, does not rotate */}
          <path d={`M ${CENTER - 8} 10 L ${CENTER + 8} 10 L ${CENTER} 24 Z`} fill="var(--color-primary)" />
        </svg>

        <div
          className="absolute rounded-full bg-[var(--color-primary-soft)] flex items-center justify-center text-center px-3 pointer-events-none"
          style={{
            width: RADIUS * 0.85,
            height: RADIUS * 0.85,
            left: CENTER,
            top: CENTER,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-[12px] text-[var(--color-primary-soft-text)]">
            {selected ? WEATHER_META[selected].label(t) : t.weather.subtitle}
          </span>
        </div>

        {/* rotating group — the wheel of conditions itself */}
        <div
          className="absolute inset-0"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {WEATHER_ORDER.map((condition, i) => {
            const pos = pointFor(i, total);
            const active = selected === condition;
            return (
              <button
                key={condition}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  selectDirectly(condition);
                }}
                aria-label={WEATHER_META[condition].label(t)}
                aria-pressed={active}
                className="absolute flex flex-col items-center gap-0.5"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 56,
                  // counter-rotate each item's own content so the emoji/label
                  // always reads upright, only the ring positions spin
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg)`,
                }}
              >
                <span
                  className="w-11 h-11 rounded-full flex items-center justify-center text-[19px] shadow-[var(--shadow-sm)]"
                  style={{
                    background: active ? 'var(--color-primary)' : 'var(--color-surface)',
                    border: active ? 'none' : '1px solid var(--color-border)',
                  }}
                >
                  {WEATHER_META[condition].emoji}
                </span>
                <span className="text-[9.5px] text-[var(--color-text-muted)] leading-tight text-center max-w-[56px]">
                  {WEATHER_META[condition].label(t)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[12px] text-[var(--color-text-faint)]">{t.weather.wheelDragHint}</p>
    </div>
  );
}
