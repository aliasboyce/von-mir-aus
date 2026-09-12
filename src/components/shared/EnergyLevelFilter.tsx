import { useT } from '../../i18n';

/**
 * "Energie als Kostenfilter, nicht als Modul"-Brief — deliberately
 * tiny: three tappable battery-icon buttons, no onboarding, no new
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
export function energyExactMatch<T extends { energyLevel?: 1 | 2 | 3 }>(items: T[], level: 1 | 2 | 3 | null): T[] {
  if (level === null) return items;
  return items.filter((item) => item.energyLevel === level);
}

export function EnergyLevelFilter({ value, onChange }: { value: 1 | 2 | 3 | null; onChange: (v: 1 | 2 | 3 | null) => void }) {
  const t = useT();
  const levels: { level: 1 | 2 | 3; icon: string; label: string }[] = [
    { level: 1, icon: '🔋', label: t.energy.levelLow },
    { level: 2, icon: '🔋🔋', label: t.energy.levelMid },
    { level: 3, icon: '🔋🔋🔋', label: t.energy.levelHigh },
  ];
  return (
    <div className="mb-4">
      <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.energy.filterQuestion}</p>
      <div className="flex gap-1.5 mb-1.5">
        {levels.map(({ level, icon, label }) => (
          <button
            key={level}
            onClick={() => onChange(value === level ? null : level)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 rounded-[var(--radius-md)] border transition-colors"
            style={{
              borderColor: value === level ? 'var(--color-primary)' : 'var(--color-border)',
              background: value === level ? 'var(--color-primary-soft)' : 'var(--color-surface)',
            }}
          >
            <span className="text-[15px]">{icon}</span>
            <span className="text-[11px] text-[var(--color-text-muted)]">{label}</span>
          </button>
        ))}
      </div>
      {value !== null && (
        <button onClick={() => onChange(null)} className="text-[12px] text-[var(--color-primary)] animate-in">
          {t.energy.hideFilterCta}
        </button>
      )}
    </div>
  );
}
