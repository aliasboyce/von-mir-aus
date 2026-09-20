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
 * conditions, rebuilt as a genuinely rotatable dial.
 *
 * "Zu schnell weiter, Symbole zu nah beieinander"-Auftrag — two fixes:
 * dragging used to fire onSelect (and the caller advances the whole
 * check-in step) the instant a drag ended, even from the smallest
 * nudge — so just spinning the wheel silently confirmed and moved on.
 * Dragging now only repositions the wheel and updates which condition
 * is currently framed at the top marker; nothing is chosen until the
 * person actually taps something — either a condition directly, or
 * the center circle to confirm whatever's currently framed. Radius
 * and item spacing also increased so 15 conditions no longer crowd
 * each other.
 */
const SIZE = 360;
const CENTER = SIZE / 2;
const RADIUS = 152;

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
  // "Nur bei echtem Antippen weitergehen"-Auftrag — what's currently
  // framed at the top marker, purely a preview until confirmed by a
  // tap (on this or on any condition directly).
  const [framed, setFramed] = useState<WeatherCondition>(selected ?? WEATHER_ORDER[Math.max(selectedIndex, 0)]);

  function indexAtTop(rot: number): number {
    const normalized = ((-rot % 360) + 360) % 360;
    return Math.round(normalized / stepDeg) % total;
  }

  function snapToNearest(rot: number) {
    const idx = indexAtTop(rot);
    const snapped = -idx * stepDeg;
    setRotation(snapped);
    const condition = WEATHER_ORDER[idx];
    if (condition !== framed) {
      triggerHaptic('select', settings);
      setFramed(condition);
    }
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragState.current || !wheelRef.current) return;
      const rect = wheelRef.current.getBoundingClientRect();
      const angle = angleFromCenter(e.clientX, e.clientY, rect);
      let delta = angle - dragState.current.lastAngle;
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
          snapToNearest(r);
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
  }, [framed]);

  function onPointerDown(e: React.PointerEvent) {
    if (!wheelRef.current) return;
    const rect = wheelRef.current.getBoundingClientRect();
    const angle = angleFromCenter(e.clientX, e.clientY, rect);
    dragState.current = { startAngle: angle, startRotation: rotation, lastAngle: angle, moved: false };
    setDragging(true);
  }

  function confirm(condition: WeatherCondition) {
    const idx = WEATHER_ORDER.indexOf(condition);
    setRotation(-idx * stepDeg);
    setFramed(condition);
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

        {/* "Nur bei echtem Antippen"-Auftrag — the center circle is now
         * itself the confirm button for whatever's currently framed at
         * the top, so exploring by dragging always ends in a
         * deliberate tap, never an accidental advance. */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            confirm(framed);
          }}
          className="absolute rounded-full bg-[var(--color-primary-soft)] flex flex-col items-center justify-center text-center px-3 gap-0.5"
          style={{
            width: RADIUS * 0.85,
            height: RADIUS * 0.85,
            left: CENTER,
            top: CENTER,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <span className="text-[22px]">{WEATHER_META[framed].emoji}</span>
          <span className="text-[12px] text-[var(--color-primary-soft-text)]">{WEATHER_META[framed].label(t)}</span>
          <span className="text-[10px] text-[var(--color-primary)] font-medium">{t.weather.wheelConfirmCta}</span>
        </button>

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
            const isFramed = framed === condition;
            const rawAngle = ((i * stepDeg + rotation) % 360 + 360) % 360;
            const distFromTop = Math.min(rawAngle, 360 - rawAngle);
            const proximity = Math.max(0, 1 - distFromTop / (stepDeg * 1.5));
            const liveScale = 1 + proximity * 0.3;
            const liveGlow = proximity * 0.45;
            return (
              <button
                key={condition}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  confirm(condition);
                }}
                aria-label={WEATHER_META[condition].label(t)}
                aria-pressed={isFramed}
                className="absolute flex flex-col items-center gap-0.5 weather-wheel-item"
                style={{
                  left: pos.x,
                  top: pos.y,
                  width: 50,
                  transform: `translate(-50%, -50%) rotate(${-rotation}deg) scale(${liveScale})`,
                  transition: dragging ? 'none' : 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
                  zIndex: isFramed || proximity > 0.3 ? 2 : 1,
                }}
              >
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-[17px] shadow-[var(--shadow-sm)] weather-wheel-orb"
                  style={{
                    background: isFramed ? 'var(--color-primary)' : 'var(--color-surface)',
                    border: isFramed ? 'none' : '1px solid var(--color-border)',
                    boxShadow: liveGlow > 0 ? `0 0 ${8 + liveGlow * 14}px ${liveGlow * 10}px var(--color-accent-clay)` : 'var(--shadow-sm)',
                  }}
                >
                  {WEATHER_META[condition].emoji}
                </span>
                <span className="text-[9px] text-[var(--color-text-muted)] leading-tight text-center max-w-[50px]">
                  {WEATHER_META[condition].label(t)}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-[12px] text-[var(--color-text-faint)] text-center max-w-[280px]">{t.weather.wheelDragHint}</p>
    </div>
  );
}
