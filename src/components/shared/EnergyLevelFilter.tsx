import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { ENERGY_LEVELS, type EnergyLevel } from '../../content/energyLevels';

/**
 * "Energie als Kostenfilter, nicht als Modul"-Brief — deliberately
 * tiny: four tappable battery-icon buttons (with the selected level's description underneath), no onboarding, no new
 * page, no mandatory step. Selecting a level is a simple local filter
 * a person can ignore entirely.
 *
 * EXACT-match semantics (corrected after explicit feedback — the
 * earlier version used "at or below", showing untagged items too;
 * that's not what was asked for): once a level is selected, ONLY
 * items saved with exactly that energy level are shown — including
 * hiding untagged items. A clearly visible "Energielevel ausblenden"
 * link appears whenever a filter is active, resetting to show
 * everything again. Resources only — Bridges already have their own
 * "levels" progression and don't use this filter at all.
 */
export function energyExactMatch<T extends { energyLevel?: EnergyLevel }>(items: T[], level: EnergyLevel | null): T[] {
  if (level === null) return items;
  return items.filter((item) => item.energyLevel === level);
}

export function EnergyLevelFilter({ value, onChange }: { value: EnergyLevel | null; onChange: (v: EnergyLevel | null) => void }) {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const selected = value !== null ? ENERGY_LEVELS.find((e) => e.level === value) : undefined;
  return (
    <div className="mb-4">
      <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.energy.filterQuestion}</p>
      <div className="grid grid-cols-4 gap-1.5 mb-1.5">
        {ENERGY_LEVELS.map((e) => {
          const info = lang === 'en' ? e.en : e.de;
          return (
            <button
              key={e.level}
              onClick={() => onChange(value === e.level ? null : e.level)}
              aria-pressed={value === e.level}
              className="flex flex-col items-center gap-0.5 py-2 px-0.5 rounded-[var(--radius-md)] border transition-colors"
              style={{
                borderColor: value === e.level ? 'var(--color-primary)' : 'var(--color-border)',
                background: value === e.level ? 'var(--color-primary-soft)' : 'var(--color-surface)',
              }}
            >
              <span className="text-[11px] leading-none" aria-hidden="true">{'🔋'.repeat(e.level)}</span>
              <span className="text-[10.5px] text-[var(--color-text-muted)] text-center leading-tight">{info.label}</span>
            </button>
          );
        })}
      </div>
      {selected && (
        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-1.5 animate-in">{(lang === 'en' ? selected.en : selected.de).feel}</p>
      )}
      {value !== null && (
        <button onClick={() => onChange(null)} className="text-[12px] text-[var(--color-primary)] animate-in">
          {t.energy.hideFilterCta}
        </button>
      )}
    </div>
  );
}
