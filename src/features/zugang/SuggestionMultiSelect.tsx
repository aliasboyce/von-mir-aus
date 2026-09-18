import { useState } from 'react';
import { Plus, X, Pencil, Check } from 'lucide-react';
import { useT } from '../../i18n';

interface SuggestionMultiSelectProps {
  suggestions: string[];
  customSuggestions: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAddCustom: (value: string) => void;
  onEditCustom: (oldValue: string, newValue: string) => void;
  onDeleteCustom: (value: string) => void;
  /** "Farbige Einfaerbung nach Zone"-Auftrag — optional, only passed
   * for the body-sensation step. Undefined for every other step
   * (Schutzstrategie, Bedürfnis, Hindernis, Verbindung), which keep
   * their plain neutral styling exactly as before. */
  getColor?: (value: string) => string | undefined;
}

/**
 * The one shared interaction used across most Zugang steps (Körper,
 * Schutzstrategie, Bedürfnis, Hindernis, Verbindung): tap to select,
 * multiple at once, add your own, and — because a person's own
 * additions are meant to become a real, lasting personal vocabulary,
 * not a one-off note — edit or remove ones that no longer fit. Built
 * once here rather than five times slightly differently.
 */
export function SuggestionMultiSelect({
  suggestions,
  customSuggestions,
  selected,
  onToggle,
  onAddCustom,
  onEditCustom,
  onDeleteCustom,
  getColor,
}: SuggestionMultiSelectProps) {
  const t = useT();
  const [adding, setAdding] = useState(false);
  const [newText, setNewText] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState('');

  function submitNew() {
    if (newText.trim()) onAddCustom(newText.trim());
    setNewText('');
    setAdding(false);
  }

  function submitEdit() {
    if (editing && editText.trim()) onEditCustom(editing, editText.trim());
    setEditing(null);
    setEditText('');
  }

  return (
    <div className="flex flex-wrap gap-2">
      {suggestions.map((s) => {
        const color = getColor?.(s);
        const isSelected = selected.includes(s);
        return (
          <button
            key={s}
            onClick={() => onToggle(s)}
            className="px-3.5 py-2 rounded-full text-[14px]"
            style={
              color
                ? {
                    background: isSelected ? color : `${color}18`,
                    color: isSelected ? '#fff' : color,
                    border: `1.5px solid ${color}`,
                  }
                : {
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: isSelected ? 'var(--color-surface)' : 'var(--color-text)',
                  }
            }
          >
            {s}
          </button>
        );
      })}

      {customSuggestions.map((s) =>
        editing === s ? (
          <div key={s} className="flex items-center gap-1">
            <input
              autoFocus
              className="input"
              style={{ width: 140, padding: '6px 10px', fontSize: 14 }}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitEdit()}
            />
            <button onClick={submitEdit} aria-label={t.common.save} className="p-1.5 text-[var(--color-primary)]">
              <Check size={15} />
            </button>
          </div>
        ) : (
          <div
            key={s}
            className="flex items-center gap-1 pl-3.5 pr-1.5 py-1 rounded-full text-[14px]"
            style={{
              background: selected.includes(s) ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: selected.includes(s) ? 'var(--color-surface)' : 'var(--color-text)',
            }}
          >
            <button onClick={() => onToggle(s)}>{s}</button>
            <button
              onClick={() => {
                setEditing(s);
                setEditText(s);
              }}
              aria-label={t.common.edit}
              className="p-1 opacity-70"
            >
              <Pencil size={11} />
            </button>
            <button onClick={() => onDeleteCustom(s)} aria-label={t.common.delete} className="p-1 opacity-70">
              <X size={12} />
            </button>
          </div>
        ),
      )}

      {adding ? (
        <div className="flex items-center gap-1">
          <input
            autoFocus
            className="input"
            style={{ width: 140, padding: '6px 10px', fontSize: 14 }}
            placeholder={t.zugang.ownSuggestionPlaceholder}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submitNew()}
            onBlur={submitNew}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 px-3.5 py-2 rounded-full text-[14px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]"
        >
          <Plus size={13} /> {t.zugang.ownSuggestionCta}
        </button>
      )}
    </div>
  );
}
