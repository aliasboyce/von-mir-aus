import { CONDITIONS } from './conditions';
import { useT } from '../../i18n';

export function ConditionsPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.conditionsLabel}</span>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.conditionsHint}</p>
      <div className="flex flex-wrap gap-1.5">
        {CONDITIONS.map((c) => {
          const isSel = selected.includes(c.id);
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onChange(isSel ? selected.filter((id) => id !== c.id) : [...selected, c.id])}
              className="px-2.5 py-1.5 rounded-full text-[12px] flex items-center gap-1"
              style={{
                background: isSel ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: isSel ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <span>{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
      </div>
    </label>
  );
}
