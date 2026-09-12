import { SENSORY_MODALITIES } from '../../data/sensoryModalities';
import { useT } from '../../i18n';

export function SensoryModalityPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.common.sensoryModalitiesLabel}</span>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.common.sensoryModalitiesHint}</p>
      <div className="flex flex-wrap gap-1.5">
        {SENSORY_MODALITIES.map((m) => {
          const isSel = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(isSel ? selected.filter((id) => id !== m.id) : [...selected, m.id])}
              className="px-2.5 py-1.5 rounded-full text-[12px] flex items-center gap-1"
              style={{
                background: isSel ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: isSel ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <span>{m.emoji}</span>
              {m.label}
            </button>
          );
        })}
      </div>
    </label>
  );
}
