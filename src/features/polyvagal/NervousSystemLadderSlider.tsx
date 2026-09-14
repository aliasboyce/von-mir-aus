import { useEffect, useMemo, useState } from 'react';
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

const ZONE_ORDER_TOP_TO_BOTTOM: PolyvagalZone[] = ['sympathetic', 'ventral', 'dorsal'];

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
    if (onValueChange) onValueChange(v);
    else setInternalValue(v);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-stretch gap-4 rounded-[var(--radius-lg)] overflow-hidden" style={{ height: 260, background: 'var(--color-surface-muted)' }}>
        {/* vertical rainbow handle bar */}
        <div className="relative flex-shrink-0 py-3" style={{ width: 44 }}>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: 12, bottom: 12, width: 14, background: `linear-gradient(to top, ${GRADIENT})` }}
          />
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => handleChange(Number(e.target.value))}
            aria-label={t.polyvagal.ladderSliderLabel}
            style={{
              WebkitAppearance: 'none',
              appearance: 'none',
              width: 236,
              height: 44,
              background: 'transparent',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              position: 'absolute',
              left: -96,
              top: 108,
              margin: 0,
              cursor: 'pointer',
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 pointer-events-none"
            style={{
              top: `calc(12px + ${100 - value}% * (100% - 24px - 30px) / 100%)`,
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
                className="relative flex-1 flex items-start px-3 pt-2.5"
                style={{
                  background: isActive ? `${zMeta.color}1f` : 'transparent',
                  borderTop: i > 0 ? '1px dashed var(--color-border)' : undefined,
                  alignItems: z === 'dorsal' ? 'flex-end' : 'flex-start',
                  paddingBottom: z === 'dorsal' ? 10 : 0,
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
            {value}%
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
