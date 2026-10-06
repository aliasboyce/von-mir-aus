import { useT } from '../../i18n';
import { NEED_META, NEED_ORDER } from '../../features/innerWeather/weatherMeta';
import type { NeedDirection } from '../../data/types';

/** Chips for "which needs does this help with?" — used in the Hilfsmittel
 * and Skill forms. Tags set here win over the category-based default
 * (see content/needResources.ts). */
export function NeedsMultiPicker({ selected, onChange }: { selected: NeedDirection[]; onChange: (v: NeedDirection[]) => void }) {
  const t = useT();
  return (
    <div>
      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-0.5">{t.resources.needsFieldTitle}</p>
      <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.resources.needsFieldHint}</p>
      <div className="flex flex-wrap gap-1.5">
        {NEED_ORDER.map((n) => {
          const on = selected.includes(n);
          return (
            <button
              key={n}
              type="button"
              aria-pressed={on}
              onClick={() => onChange(on ? selected.filter((x) => x !== n) : [...selected, n])}
              className="rounded-full px-3 py-1.5 text-[12.5px] border"
              style={on ? { background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: 'var(--color-surface)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {NEED_META[n].icon} {NEED_META[n].label(t)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
