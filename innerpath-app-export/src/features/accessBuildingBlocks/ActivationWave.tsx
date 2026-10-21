import { useState } from 'react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { SURVIVAL_STATE_ORDER, SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { SURVIVAL_TO_POLYVAGAL_ZONE } from '../zugang/zugangRepo';
import { POLYVAGAL_ZONE_META } from '../polyvagal/polyvagalMeta';
import type { ZugangSurvivalState } from '../../data/types';

const WIDTH = 300;
const HEIGHT = 140;
const Y_FOR_ZONE = { ventral: 30, sympathetic: 70, dorsal: 110 } as const;

/**
 * Priority 7 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief —
 * gives the Nervensystem page its own genuine animation/interactivity,
 * matching the treatment Körperwahrnehmung (silhouette) and
 * Schutzstrategien (balance) already got. Not a new data source: reuses
 * SURVIVAL_STATE_ORDER and each state's existing zone (from
 * SURVIVAL_TO_POLYVAGAL_ZONE) to place it along a wave-shaped curve —
 * loosely echoing the "urge surfing" idea that activation rises and
 * falls rather than staying fixed, without claiming a precise
 * physiological measurement.
 */
export function ActivationWave() {
  const t = useT();
  const { settings } = useSettings();
  // Deliberately narrower than the full ZugangSurvivalState union — this
  // wave only ever cycles through the original seven core states via
  // SURVIVAL_STATE_ORDER (unchanged by the "alle Fs"-Auftrag, which
  // only extended the separate selection pickers, not this wave).
  type CoreSurvivalState = Exclude<ZugangSurvivalState, 'fine' | 'flood' | 'friend' | 'fakeRuhe' | 'fokus' | 'praesent' | 'unruhe' | 'blockiert'>;
  const [active, setActive] = useState<CoreSurvivalState>(SURVIVAL_STATE_ORDER[0] as CoreSurvivalState);
  const [scenario, setScenario] = useState<'stress' | 'social' | 'calm'>('social');

  const points = SURVIVAL_STATE_ORDER.map((s, i) => {
    const zone = SURVIVAL_TO_POLYVAGAL_ZONE[s];
    const x = 24 + (i * (WIDTH - 48)) / (SURVIVAL_STATE_ORDER.length - 1);
    const y = Y_FOR_ZONE[zone];
    return { state: s, x, y, zone };
  });

  const path = points.map((p, i) => (i === 0 ? `M${p.x},${p.y}` : `L${p.x},${p.y}`)).join(' ');
  const activePoint = points.find((p) => p.state === active)!;

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] text-center mb-2">{t.nervousSystemRef.scenarioPickerLabel}</p>
      <div className="flex gap-1.5 justify-center mb-4 flex-wrap">
        {(['social', 'stress', 'calm'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            className="px-3 py-1.5 rounded-full text-[12px] transition-colors"
            style={{
              background: scenario === s ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: scenario === s ? 'var(--color-surface)' : 'var(--color-text-muted)',
            }}
          >
            {s === 'social' ? t.nervousSystemRef.scenarioSocialLabel : s === 'stress' ? t.nervousSystemRef.scenarioStressLabel : t.nervousSystemRef.scenarioCalmLabel}
          </button>
        ))}
      </div>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" role="img" aria-hidden="true" style={{ maxWidth: 360, aspectRatio: `${WIDTH} / ${HEIGHT}`, display: 'block', margin: '0 auto' }}>
        {/* "mit den jeweiligen Farben im Hintergrund"-Ergaenzung — three
         * horizontal bands, one per zone, using the same
         * POLYVAGAL_ZONE_META colors used everywhere else on this page,
         * so the wave's vertical position visually reads as "which
         * zone" even before looking at the point itself. */}
        <rect x="0" y="10" width={WIDTH} height="40" fill={POLYVAGAL_ZONE_META.ventral.color} opacity="0.08" />
        <rect x="0" y="50" width={WIDTH} height="40" fill={POLYVAGAL_ZONE_META.sympathetic.color} opacity="0.09" />
        <rect x="0" y="90" width={WIDTH} height="40" fill={POLYVAGAL_ZONE_META.dorsal.color} opacity="0.12" />
        {(['ventral', 'sympathetic', 'dorsal'] as const).map((zone) => (
          <line
            key={zone}
            x1="0" y1={Y_FOR_ZONE[zone]} x2={WIDTH} y2={Y_FOR_ZONE[zone]}
            stroke="var(--color-border)" strokeWidth="1" strokeDasharray="3,4"
          />
        ))}
        <path d={path} fill="none" stroke="var(--color-border-strong)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p) => (
          <circle
            key={p.state}
            cx={p.x} cy={p.y} r={p.state === active ? 9 : 6}
            fill={p.state === active ? 'var(--color-primary)' : 'var(--color-surface)'}
            stroke={POLYVAGAL_ZONE_META[p.zone].color}
            strokeWidth="2"
            style={{ cursor: 'pointer', transition: 'r 0.3s ease, fill 0.3s ease' }}
            onClick={() => setActive(p.state as CoreSurvivalState)}
          />
        ))}
        <circle
          cx={activePoint.x} cy={activePoint.y} r="14"
          fill="none" stroke="var(--color-primary)" strokeWidth="1.5" opacity="0.5"
          style={settings.reduceMotion ? undefined : { animation: 'wave-pulse 1.6s ease-out infinite' }}
        />
      </svg>
      <div className="text-center mt-1">
        <span className="text-[20px] mr-1.5">{SURVIVAL_STATE_META[active].emoji}</span>
        <span className="text-[14px] text-[var(--color-text)]">{SURVIVAL_STATE_META[active].label}</span>
      </div>
      <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-1 mb-3">{t.nervousSystemRef.waveHint}</p>
      <div className="rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--color-surface-muted)' }}>
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">{t.nervousSystemRef.waveExampleLabel}</p>
        <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{t.nervousSystemRef.waveScenarios[scenario][active]}</p>
      </div>
    </div>
  );
}
