import { useState } from 'react';
import { X, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { useT } from '../../i18n';
import { createDismissibleListManager } from '../../services/dismissibleListManager';

export function DismissibleCustomList({
  listKey,
  builtins,
  onTapBuiltin,
  isMarked,
}: {
  listKey: string;
  builtins: string[];
  /** Called when a built-in or custom chip's main label is tapped
   * (e.g. to open a reflection, or to toggle "applies to me"). */
  onTapBuiltin?: (text: string) => void;
  /** Optional — lets the caller show a chip as visually "selected". */
  isMarked?: (text: string) => boolean;
}) {
  const t = useT();
  const [manager] = useState(() => createDismissibleListManager(listKey));
  const [, bump] = useState(0);
  const [showAdd, setShowAdd] = useState(false);
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showDismissed, setShowDismissed] = useState(false);

  const visible = manager.visibleBuiltins(builtins);
  const dismissed = manager.dismissedItems();
  const custom = manager.customItems();

  function refresh() {
    bump((n) => n + 1);
  }

  function chipStyle(marked: boolean) {
    return {
      background: marked ? 'var(--color-primary)' : 'var(--color-surface-muted)',
      color: marked ? 'var(--color-surface)' : 'var(--color-text)',
    };
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {visible.map((item) => {
          const marked = isMarked?.(item) ?? false;
          return (
            <div key={item} className="flex items-center rounded-full overflow-hidden" style={chipStyle(marked)}>
              <button onClick={() => onTapBuiltin?.(item)} className="pl-3 pr-1.5 py-2 text-[13px]">
                {item}
              </button>
              <button
                onClick={() => {
                  manager.dismiss(item);
                  refresh();
                }}
                aria-label={t.protectionRef.notApplicableCta}
                className="pr-2.5 pl-1 py-2 opacity-60"
              >
                <X size={13} />
              </button>
            </div>
          );
        })}

        {custom.map((item) => {
          const marked = isMarked?.(item.text) ?? false;
          return (
            <div key={item.id} className="flex items-center rounded-full overflow-hidden" style={chipStyle(marked)}>
              <button onClick={() => onTapBuiltin?.(item.text)} className="pl-3 pr-1.5 py-2 text-[13px]">
                {item.text}
              </button>
              <button
                onClick={() => {
                  setEditingId(item.id);
                  setEditText(item.text);
                }}
                aria-label={t.common.edit}
                className="p-1.5 opacity-60"
              >
                <Pencil size={12} />
              </button>
              <button
                onClick={() => {
                  manager.deleteCustom(item.id);
                  refresh();
                }}
                aria-label={t.common.delete}
                className="pr-2.5 pl-1 py-2 opacity-60"
              >
                <Trash2 size={13} />
              </button>
            </div>
          );
        })}

        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1 px-3 py-2 rounded-full text-[13px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]"
        >
          <Plus size={13} /> {t.protectionRef.addOwnCta}
        </button>
      </div>

      {showAdd && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            className="input flex-1"
            placeholder={t.protectionRef.addOwnPlaceholder}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && newText.trim()) {
                manager.addCustom(newText.trim());
                setNewText('');
                setShowAdd(false);
                refresh();
              }
            }}
          />
          <button
            onClick={() => {
              if (newText.trim()) manager.addCustom(newText.trim());
              setNewText('');
              setShowAdd(false);
              refresh();
            }}
            className="px-3 py-2 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]"
          >
            {t.common.save}
          </button>
        </div>
      )}

      {editingId && (
        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            className="input flex-1"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && editText.trim()) {
                manager.editCustom(editingId, editText.trim());
                setEditingId(null);
                refresh();
              }
            }}
          />
          <button
            onClick={() => {
              if (editText.trim()) manager.editCustom(editingId, editText.trim());
              setEditingId(null);
              refresh();
            }}
            className="px-3 py-2 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]"
          >
            {t.common.save}
          </button>
        </div>
      )}

      {dismissed.length > 0 && (
        <button onClick={() => setShowDismissed((v) => !v)} className="text-[12px] text-[var(--color-text-faint)] mb-2">
          {showDismissed ? t.protectionRef.hideDismissedCta : t.protectionRef.showDismissedCta.replace('{count}', String(dismissed.length))}
        </button>
      )}
      {showDismissed && (
        <div className="flex flex-wrap gap-2 mb-2">
          {dismissed.map((item) => (
            <button
              key={item}
              onClick={() => {
                manager.restore(item);
                refresh();
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text-faint)]"
            >
              <RotateCcw size={11} /> {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
