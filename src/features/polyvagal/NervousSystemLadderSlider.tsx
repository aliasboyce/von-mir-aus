import { useMemo, useState } from 'react';
import { POLYVAGAL_ZONE_META } from './polyvagalMeta';
import { useT } from '../../i18n';
import { EXTENDED_STATE_GROUPS, SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import type { PolyvagalZone, ZugangSurvivalState } from '../../data/types';

/**
 * "Regenbogen-Leiter mit Prozent-Zuweisung"-Auftrag — replaces the
 * discrete three-zone button grid with a continuous vertical slider,
 * following the shared brief closely: people in an ordinary,
 * in-between everyday moment (neither wound up nor completely shut
 * down) struggled to pick one of three hard-edged buttons. A
 * continuous position plus a "how far into this zone" percentage is
 * meant to fit that everyday in-between far more naturally, without
 * asking for more precision than someone actually has access to —
 * the zone + F-tags below are still the thing that actually gets
 * saved, the slider is just a more honest way to arrive there.
 *
 * Deliberately reuses the SAME data (EXTENDED_STATE_GROUPS,
 * SURVIVAL_STATE_META, POLYVAGAL_ZONE_META) as the rest of the app —
 * this is a new way to ARRIVE at a state, not a new set of states.
 */
interface NervousSystemLadderSliderProps {
  onSelect: (zone: PolyvagalZone, state: ZugangSurvivalState) => void;
  selectedState?: ZugangSurvivalState | null;
}

// Top to bottom: green (ventral) at 100, through the sympathetic
// middle, to blue/dorsal at 0 — matches the reference material's
// "leiter" orientation (calm at the top, shutdown at the bottom).
const GRADIENT = [
  '#3d6b35 0%',   // deep ventral green
  '#7a9a3f 15%',  // yellow-green
  '#e4c23b 30%',  // gold — upper edge of the window
  '#e4a63b 40%',  // amber — into sympathetic
  '#c17a56 55%',  // clay/orange
  '#b5533f 68%',  // red — sympathetic peak
  '#8b6a9e 80%',  // purple transition
  '#6e9bb8 100%', // dorsal blue
].join(', ');

function zoneForValue(v: number): { zone: PolyvagalZone; pct: number } {
  if (v >= 67) return { zone: 'ventral', pct: Math.round(((v - 67) / 33) * 100) };
  if (v >= 34) return { zone: 'sympathetic', pct: Math.round(((66 - v) / 32) * 100) };
  return { zone: 'dorsal', pct: Math.round(((33 - v) / 33) * 100) };
}

export function NervousSystemLadderSlider({ onSelect, selectedState }: NervousSystemLadderSliderProps) {
  const t = useT();
  const { settings } = useSettings();
  const [value, setValue] = useState(75);
  const [lastZone, setLastZone] = useState<PolyvagalZone>('ventral');
  const { zone, pct } = useMemo(() => zoneForValue(value), [value]);
  const meta = POLYVAGAL_ZONE_META[zone];
  const states = EXTENDED_STATE_GROUPS.find((g) => g.zone === zone)?.states ?? [];

  function handleChange(v: number) {
    setValue(v);
    const { zone: newZone } = zoneForValue(v);
    if (newZone !== lastZone) {
      // A small, distinct pulse right when crossing into a new zone —
      // not on every pixel of drag, which would feel buzzy rather than
      // meaningful.
      triggerHaptic('select', settings);
      setLastZone(newZone);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-5">
        {/* vertical rainbow slider */}
        <div className="relative flex-shrink-0" style={{ height: 220, width: 44 }}>
          <div
            className="absolute left-1/2 -translate-x-1/2 rounded-full"
            style={{ top: 0, bottom: 0, width: 14, background: `linear-gradient(to top, ${GRADIENT})` }}
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
              width: 220,
              height: 44,
              background: 'transparent',
              transform: 'rotate(-90deg)',
              transformOrigin: 'center',
              position: 'absolute',
              left: -88,
              top: 88,
              margin: 0,
              cursor: 'pointer',
            }}
          />
          <div
            className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 pointer-events-none"
            style={{
              bottom: `${value}%`,
              transform: 'translate(-50%, 50%)',
              width: 30,
              height: 30,
              background: meta.color,
              borderColor: 'var(--color-surface)',
              boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
            }}
          />
        </div>

        {/* live zone + percentage readout */}
        <div className="flex-1 rounded-[var(--radius-lg)] p-4 min-h-[160px] flex flex-col items-center justify-center text-center" style={{ background: `${meta.color}14` }}>
          <p className="text-[15px] font-medium mb-1" style={{ color: meta.color }}>
            {meta.label(t)}
          </p>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{meta.hint(t)}</p>
          <p className="text-[26px] font-medium" style={{ color: meta.color }}>
            {pct}%
          </p>
          <p className="text-[11px] text-[var(--color-text-faint)]">{t.polyvagal.ladderPctLabel}</p>
        </div>
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
                <span>{isEnLang(settings) ? sMeta.labelEn : sMeta.label}</span>
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

function isEnLang(settings: { language: string }): boolean {
  return settings.language === 'en';
}
