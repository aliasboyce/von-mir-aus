import { useEffect, useMemo, useRef, useState } from 'react';
import { POLYVAGAL_ZONE_META } from './polyvagalMeta';
import { useT } from '../../i18n';
import { EXTENDED_STATE_GROUPS, SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import type { PolyvagalZone, ZugangSurvivalState } from '../../data/types';

/**
 * "Regenbogen-Leiter, Farben ueber die ganze Seite, Video-Analyse"-
 * Auftrag — rebuilt to closely match the person's own working
 * prototype (analyzed frame-by-frame from their screen recording),
 * not just a similarly-colored slider on its own:
 *
 * - Three full-width zone BANDS stacked vertically (Hyperarousal /
 *   Toleranzbereich / Hypoarousal) instead of color confined to the
 *   14px slider bar — the color now genuinely spans the whole width,
 *   matching "ich will dass die Farben ueber die ganze Seite gehen".
 * - Only the band the slider currently sits in gets a tinted
 *   background + the animated line, exactly like the reference video.
 * - The label shown for a band is looked up by THAT band's own zone,
 *   never derived from the slider value a second, separately-rounded
 *   way — the fix for "der Text bei der jeweiligen Farbe stimmt
 *   nicht" (the previous version computed the zone label from a
 *   slightly different threshold than the one used for the band
 *   layout itself, which could drift apart at the edges).
 * - "Status-Niveau/Anspannung vereinen"-Auftrag — this raw 0-100
 *   slider value IS the single number now (no separate tension
 *   question elsewhere asks for a second, independent number).
 */
interface NervousSystemLadderSliderProps {
  onSelect: (zone: PolyvagalZone, state: ZugangSurvivalState) => void;
  selectedState?: ZugangSurvivalState | null;
  /** Raw 0-100 ladder value. Uncontrolled (starts at 75) if omitted —
   * pass both value+onValueChange to read/drive the single unified
   * number from a parent (e.g. to also store it as tensionValue). */
  value?: number;
  onValueChange?: (v: number) => void;
}

// "Reihenfolge korrigieren, exakte Video-Begriffe"-Auftrag — per
// direct correction: Hypoarousal/dorsal at the top, Hyperarousal/
// sympathetic in the middle, the Toleranzbereich/ventral band at the
// bottom. Low slider values sit near the top (dorsal) and high values
// near the bottom (ventral) to match — see the thumb position and
// gradient direction below, both flipped to stay consistent with
// this order (the earlier version had the gradient bar's own colors
// pointing the opposite way from the band layout, which is what
// caused the mismatch: blue visually at the top while the band
// actually showing there was labelled for a different zone).
const ZONE_ORDER_TOP_TO_BOTTOM: PolyvagalZone[] = ['dorsal', 'sympathetic', 'ventral'];

// Same stops as before, just still used for the thin slider handle bar.
const GRADIENT = [
  '#3d6b35 0%',
  '#7a9a3f 15%',
  '#e4c23b 30%',
  '#e4a63b 40%',
  '#c17a56 55%',
  '#b5533f 68%',
  '#8b6a9e 80%',
  '#6e9bb8 100%',
].join(', ');

function zoneForValue(v: number): PolyvagalZone {
  if (v >= 67) return 'ventral';
  if (v >= 34) return 'sympathetic';
  return 'dorsal';
}

const BAND_ICON: Record<PolyvagalZone, string> = { sympathetic: '🔥', ventral: '🌿', dorsal: '❄️' };

export function NervousSystemLadderSlider({ onSelect, selectedState, value: controlledValue, onValueChange }: NervousSystemLadderSliderProps) {
  const t = useT();
  const { settings } = useSettings();
  const [internalValue, setInternalValue] = useState(75);
  const value = controlledValue ?? internalValue;
  const [lastZone, setLastZone] = useState<PolyvagalZone>(() => zoneForValue(value));
  const zone = useMemo(() => zoneForValue(value), [value]);
  // "Prozent zaehlt dreimal bis 100"-Auftrag — the per-zone reset
  // (1-100 within whichever zone you're in) looked fine as a single
  // static screenshot, but while actually dragging continuously it
  // meant the number visibly reset back down every time you crossed a
  // zone boundary — climbing to 100, snapping back to 1, climbing
  // again. Reverted to the one continuous number the whole ladder
  // already uses (matches the stored value 1:1, no separate
  // display-only calculation to drift out of sync with the data).
  const displayPct = Math.max(1, value);
  const meta = POLYVAGAL_ZONE_META[zone];
  const states = EXTENDED_STATE_GROUPS.find((g) => g.zone === zone)?.states ?? [];

  useEffect(() => {
    if (zone !== lastZone) {
      triggerHaptic('select', settings);
      setLastZone(zone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zone]);

  function handleChange(v: number) {
    const clamped = Math.max(0, Math.min(100, Math.round(v)));
    if (onValueChange) onValueChange(clamped);
    else setInternalValue(clamped);
  }

  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  function valueFromClientY(clientY: number): number {
    const track = trackRef.current;
    if (!track) return value;
    const rect = track.getBoundingClientRect();
    const usableTop = rect.top + 12;
    const usableHeight = rect.height - 24;
    const ratio = (clientY - usableTop) / usableHeight;
    return Math.round(ratio * 100);
  }

  useEffect(() => {
    function onMove(e: PointerEvent) {
      if (!dragging.current) return;
      handleChange(valueFromClientY(e.clientY));
    }
    function onUp() {
      dragging.current = false;
    }
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    document.addEventListener('pointercancel', onUp);
    return () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.removeEventListener('pointercancel', onUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onValueChange]);

  function onTrackPointerDown(e: React.PointerEvent) {
    dragging.current = true;
    handleChange(valueFromClientY(e.clientY));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-stretch gap-4 rounded-[var(--radius-lg)] overflow-hidden" style={{ height: 260, background: 'var(--color-surface-muted)' }}>
        {/* vertical rainbow handle bar — "Regler auch per Ziehen
         * bedienbar"-Auftrag: rebuilt from a CSS-rotated native
         * <input type="range"> to a direct pointer-driven track. A
         * rotated native range input has known, inconsistent touch-
         * coordinate handling on some mobile browsers — taps could
         * land fine (a single point), but a smooth continuous drag
         * gesture could silently stop tracking partway through.
         * Reading the pointer position straight off the track's own
         * bounding box, with document-level move/up listeners (the
         * same robust pattern already used for image cropping and
         * photo positioning elsewhere in the app), sidesteps that
         * entirely regardless of rotation. */}
        <div
          ref={trackRef}
          className="relative flex-shrink-0 py-3"
          style={{ width: 44, touchAction: 'none', cursor: 'grab' }}
          onPointerDown={onTrackPointerDown}
          role="slider"
          tabIndex={0}
          aria-label={t.polyvagal.ladderSliderLabel}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={value}
          onKeyDown={(e) => {
            if (e.key === 'ArrowUp') handleChange(value - 2);
            else if (e.key === 'ArrowDown') handleChange(value + 2);
          }}
        >
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: 12, bottom: 12, width: 14, background: `linear-gradient(to top, ${GRADIENT})` }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 pointer-events-none"
            style={{
              // Low values near the top (dorsal), high values near the
              // bottom (ventral) — matches ZONE_ORDER_TOP_TO_BOTTOM above.
              top: `calc(12px + ${value}% * (100% - 24px - 30px) / 100%)`,
              width: 28,
              height: 28,
              background: '#1a1a1a',
              borderColor: 'var(--color-surface)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* three full-width zone bands */}
        <div className="relative flex-1 flex flex-col">
          {ZONE_ORDER_TOP_TO_BOTTOM.map((z, i) => {
            const zMeta = POLYVAGAL_ZONE_META[z];
            const isActive = z === zone;
            return (
              <div
                key={z}
                className="relative flex-1 flex items-center px-3"
                style={{
                  background: isActive ? `${zMeta.color}1f` : 'transparent',
                  borderTop: i > 0 ? `1px dashed ${POLYVAGAL_ZONE_META[ZONE_ORDER_TOP_TO_BOTTOM[i - 1]].color}55` : undefined,
                  transition: 'background 0.25s ease',
                }}
              >
                <span
                  className="text-[12.5px] flex items-center gap-1.5 px-2 py-1 rounded-full flex-shrink-0"
                  style={{ background: isActive ? 'var(--color-surface)' : 'transparent', color: isActive ? zMeta.color : 'var(--color-text-faint)' }}
                >
                  <span>{BAND_ICON[z]}</span>
                  {zMeta.label(t)}
                </span>
                {isActive && (
                  <svg viewBox="0 0 300 60" preserveAspectRatio="none" className="absolute left-0 right-0" style={{ top: '50%', height: 60, transform: 'translateY(-50%)' }}>
                    <path
                      d="M 20 30 Q 80 18, 140 30 T 260 26"
                      fill="none"
                      stroke={zMeta.color}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      className="ladder-curve-line"
                    />
                    <circle cx="270" cy="27" r="4.5" fill={zMeta.color} className="ladder-curve-dot" />
                  </svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* single unified status readout */}
      <div className="flex items-center justify-between px-1">
        <div>
          <p className="text-[11px] text-[var(--color-text-faint)]">{t.polyvagal.ladderStatusLabel}</p>
          <p className="text-[22px] font-medium" style={{ color: meta.color }}>
            {displayPct}%
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] text-[var(--color-text-faint)]">{t.polyvagal.ladderZoneLabel}</p>
          <p className="text-[15px] font-medium" style={{ color: meta.color }}>
            {meta.label(t)}
          </p>
        </div>
      </div>
      <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: `${meta.color}14` }}>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{meta.hint(t)}</p>
      </div>

      {/* dynamic F-tags for the current zone */}
      <div>
        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.polyvagal.ladderWhatFitsLabel}</p>
        <div className="flex flex-wrap gap-2">
          {states.map((s) => {
            const sMeta = SURVIVAL_STATE_META[s];
            const isSelected = selectedState === s;
            return (
              <button
                key={s}
                onClick={() => onSelect(zone, s)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-full text-[13px]"
                style={{
                  border: `1.5px solid ${isSelected ? meta.color : 'var(--color-border)'}`,
                  background: isSelected ? `${meta.color}1f` : 'var(--color-surface)',
                  color: 'var(--color-text)',
                }}
              >
                <span>{sMeta.emoji}</span>
                <span>{settings.language === 'en' ? sMeta.labelEn : sMeta.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {selectedState && (
        <div className="rounded-[var(--radius-lg)] p-3.5 animate-in" style={{ background: 'var(--color-surface-muted)' }}>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
            {t.zugang.survivalExplainers[SURVIVAL_STATE_META[selectedState].explanationKey as keyof typeof t.zugang.survivalExplainers]}
          </p>
        </div>
      )}
    </div>
  );
}
