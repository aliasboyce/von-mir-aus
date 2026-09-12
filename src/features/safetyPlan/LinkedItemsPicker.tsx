import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';

const MAX_LINKED = 3;

interface LinkableItem {
  id: string;
  title: string;
  subtitle?: string;
}

interface LinkedItemsPickerProps {
  title: string;
  linkedIds: string[];
  allItems: LinkableItem[];
  onChange: (ids: string[]) => void;
  onOpenItem: (id: string) => void;
  emptyHint: string;
}

export function LinkedItemsPicker({
  title,
  linkedIds,
  allItems,
  onChange,
  onOpenItem,
  emptyHint,
}: LinkedItemsPickerProps) {
  const t = useT();
  const [pickerOpen, setPickerOpen] = useState(false);

  const linkedItems = linkedIds
    .map((id) => allItems.find((i) => i.id === id))
    .filter((i): i is LinkableItem => !!i);

  const atLimit = linkedItems.length >= MAX_LINKED;

  function toggle(id: string) {
    if (linkedIds.includes(id)) {
      onChange(linkedIds.filter((i) => i !== id));
    } else if (!atLimit) {
      onChange([...linkedIds, id]);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <h3 className="text-[14px] font-medium text-[var(--color-text)]">{title}</h3>
        <span className="text-[12px] text-[var(--color-text-faint)]">{linkedItems.length}/{MAX_LINKED}</span>
      </div>

      {linkedItems.length === 0 ? (
        <p className="text-[13px] text-[var(--color-text-muted)] mb-2.5">{emptyHint}</p>
      ) : (
        <div className="flex flex-col gap-2 mb-2.5">
          {linkedItems.map((item) => (
            <Card key={item.id} interactive padding="none" className="flex items-center justify-between gap-2 p-3">
              <button onClick={() => onOpenItem(item.id)} className="flex-1 min-w-0 text-left">
                <p className="text-[13px] text-[var(--color-text)] truncate">{item.title}</p>
                {item.subtitle && <p className="text-[12px] text-[var(--color-text-muted)] truncate">{item.subtitle}</p>}
              </button>
              <button
                onClick={() => toggle(item.id)}
                aria-label={t.common.delete}
                className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-danger)] flex-shrink-0 no-print"
              >
                <X size={14} />
              </button>
            </Card>
          ))}
        </div>
      )}

      {!atLimit && (
        <button
          onClick={() => setPickerOpen(true)}
          className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] no-print"
        >
          <Plus size={15} /> {t.common.add}
        </button>
      )}

      <Modal open={pickerOpen} onClose={() => setPickerOpen(false)} title={title}>
        {allItems.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)]">{emptyHint}</p>
        ) : (
          <div className="flex flex-col gap-2">
            {allItems.map((item) => {
              const isLinked = linkedIds.includes(item.id);
              const disabled = !isLinked && atLimit;
              return (
                <button
                  key={item.id}
                  onClick={() => !disabled && toggle(item.id)}
                  disabled={disabled}
                  className={[
                    'flex items-center justify-between gap-2 rounded-[var(--radius-md)] border p-3 text-left',
                    isLinked ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]',
                    disabled ? 'opacity-40' : '',
                  ].join(' ')}
                >
                  <span className="min-w-0">
                    <span className="block text-[13px] text-[var(--color-text)] truncate">{item.title}</span>
                    {item.subtitle && (
                      <span className="block text-[12px] text-[var(--color-text-muted)] truncate">{item.subtitle}</span>
                    )}
                  </span>
                  {isLinked && <span className="text-[var(--color-primary)] flex-shrink-0 text-[12px]">✓</span>}
                </button>
              );
            })}
          </div>
        )}
      </Modal>
    </div>
  );
}
