import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { useT } from '../../i18n';

/**
 * "Erst selbst wahrnehmen und benennen": a plain input where the person puts
 * their own words first — before any list is offered. What was named shows
 * as removable chips. The lists stay one tap away for when words are missing.
 */
export function NamingInput({ placeholder, terms, onAdd, onRemove }: { placeholder: string; terms: string[]; onAdd: (value: string) => void; onRemove: (value: string) => void }) {
  const t = useT();
  const [value, setValue] = useState('');

  function submit() {
    const v = value.trim();
    if (!v) return;
    if (!terms.includes(v)) onAdd(v);
    setValue('');
  }

  return (
    <div>
      <div className="flex gap-2 mb-3">
        <input
          className="input flex-1"
          value={value}
          placeholder={placeholder}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submit();
            }
          }}
          aria-label={placeholder}
        />
        <button
          type="button"
          onClick={submit}
          disabled={!value.trim()}
          aria-label={t.zugang.namingAdd}
          className="rounded-full px-3.5 flex items-center gap-1 text-[13px] disabled:opacity-40"
          style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
        >
          <Plus size={15} /> {t.zugang.namingAdd}
        </button>
      </div>
      {terms.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {terms.map((term) => (
            <span key={term} className="inline-flex items-center gap-1 rounded-full pl-3 pr-1.5 py-1.5 text-[13px]" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-text)' }}>
              {term}
              <button type="button" onClick={() => onRemove(term)} aria-label={`${term} – ${t.zugang.namingRemove}`} className="p-0.5 rounded-full">
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
