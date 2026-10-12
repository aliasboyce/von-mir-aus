import { useState } from 'react';
import { Plus } from 'lucide-react';
import { loadUmstaende, addUmstand } from './conditions';
import { useT } from '../../i18n';

/**
 * "Umstände" — pick from the one global list or type a new one. Used in every
 * create/edit form (Skills, Hilfsmittel, Orte, Aktivitäten, Brücken). A typed
 * Umstand is saved to the list immediately and stays selectable everywhere.
 */
export function ConditionsPicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();
  const [options, setOptions] = useState(() => loadUmstaende());
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');

  function addOwn() {
    const label = name.trim();
    if (!label) {
      setAdding(false);
      return;
    }
    const created = addUmstand(label);
    setOptions(loadUmstaende());
    if (!selected.includes(created.key)) onChange([...selected, created.key]);
    setName('');
    setAdding(false);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.bridges.conditionsLabel}</span>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{t.bridges.conditionsHint}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((c) => {
          const isSel = selected.includes(c.key);
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={isSel}
              onClick={() => onChange(isSel ? selected.filter((id) => id !== c.key) : [...selected, c.key])}
              className="px-3 py-2 rounded-full text-[13px] flex items-center gap-1.5"
              style={{
                background: isSel ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: isSel ? 'var(--color-surface)' : 'var(--color-text)',
              }}
            >
              <span aria-hidden="true">{c.emoji}</span>
              {c.label}
            </button>
          );
        })}
        {adding ? (
          <input
            autoFocus
            className="input"
            style={{ width: 200, padding: '6px 10px', fontSize: 13 }}
            value={name}
            placeholder={t.bridges.conditionsOwnPlaceholder}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addOwn();
              }
            }}
            onBlur={addOwn}
          />
        ) : (
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]">
            <Plus size={12} /> {t.bridges.conditionsOwnCta}
          </button>
        )}
      </div>
    </div>
  );
}
