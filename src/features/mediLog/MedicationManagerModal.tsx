import { useState } from 'react';
import { Plus, Pencil, Trash2, Check, Pipette } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { savedMedicationsRepo, MEDICATION_COLOR_PALETTE, nextSuggestedColor } from './savedMedicationsRepo';
import { createId } from '../../services/storage/repository';
import type { SavedMedication } from '../../data/types';

interface MedicationManagerModalProps {
  open: boolean;
  onClose: () => void;
  onChange: () => void;
  onAddAsRecurring?: (medication: SavedMedication) => void;
}

export function MedicationManagerModal({ open, onClose, onChange, onAddAsRecurring }: MedicationManagerModalProps) {
  const t = useT();
  const [medications, setMedications] = useState<SavedMedication[]>(() => savedMedicationsRepo.getAll());
  const [editing, setEditing] = useState<SavedMedication | null>(null);

  function refresh() {
    const list = savedMedicationsRepo.getAll();
    setMedications(list);
    onChange();
  }

  function openNew() {
    setEditing({
      id: createId('med'),
      name: '',
      typicalDoseValue: undefined,
      typicalDoseUnit: 'mg',
      color: nextSuggestedColor(),
      createdAt: new Date().toISOString(),
    });
  }

  function save() {
    if (!editing || !editing.name.trim()) return;
    savedMedicationsRepo.save(editing);
    setEditing(null);
    refresh();
  }

  function remove(id: string) {
    if (!window.confirm(t.mediLog.confirmDeleteMedication)) return;
    savedMedicationsRepo.remove(id);
    refresh();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.mediLog.manageMedications}>
      {editing ? (
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.nameLabel}</span>
            <input
              autoFocus
              className="input"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            />
          </label>
          <div className="flex gap-2">
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.typicalDoseLabel}</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                className="input"
                value={editing.typicalDoseValue ?? ''}
                onChange={(e) =>
                  setEditing({ ...editing, typicalDoseValue: e.target.value === '' ? undefined : Number(e.target.value) })
                }
                placeholder="2"
              />
            </label>
            <label className="flex flex-col gap-1.5" style={{ width: 110 }}>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.unitLabel}</span>
              <input
                className="input"
                list="medi-log-units"
                value={editing.typicalDoseUnit ?? ''}
                onChange={(e) => setEditing({ ...editing, typicalDoseUnit: e.target.value })}
                placeholder="mg"
              />
            </label>
          </div>
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.mediLog.colorLabel}</span>
            <div className="flex flex-wrap gap-2 items-center">
              {MEDICATION_COLOR_PALETTE.map((c) => (
                <button
                  key={c}
                  onClick={() => setEditing({ ...editing, color: c })}
                  aria-label={c}
                  className="w-9 h-9 rounded-full flex items-center justify-center"
                  style={{ background: c, outline: editing.color === c ? '2.5px solid var(--color-text)' : 'none', outlineOffset: 2 }}
                >
                  {editing.color === c && <Check size={15} color="#fff" />}
                </button>
              ))}
              <label
                className="w-9 h-9 rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer"
                style={{
                  background: MEDICATION_COLOR_PALETTE.includes(editing.color) ? 'var(--color-surface-muted)' : editing.color,
                  outline: !MEDICATION_COLOR_PALETTE.includes(editing.color) ? '2.5px solid var(--color-text)' : '1.5px dashed var(--color-border-strong)',
                  outlineOffset: 2,
                }}
                aria-label={t.mediLog.customColorLabel}
              >
                {!MEDICATION_COLOR_PALETTE.includes(editing.color) ? (
                  <Check size={15} color="#fff" />
                ) : (
                  <Pipette size={15} className="text-[var(--color-text-muted)]" />
                )}
                <input
                  type="color"
                  value={editing.color}
                  onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-hidden="true"
                />
              </label>
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)] mt-1.5">{t.mediLog.customColorHint}</p>
          </div>
          {onAddAsRecurring && medications.some((m) => m.id === editing.id) && (
            <button
              onClick={() => onAddAsRecurring(editing)}
              className="text-[13px] text-[var(--color-primary)] text-left"
            >
              {t.mediLog.addAsRecurring}
            </button>
          )}
          <div className="flex gap-2">
            <Button fullWidth onClick={save} disabled={!editing.name.trim()}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              {t.common.cancel}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <Button fullWidth icon={<Plus size={16} />} onClick={openNew}>
            {t.mediLog.addMedication}
          </Button>
          {medications.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.mediLog.noMedicationsSaved}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {medications.map((m) => (
                <div key={m.id} className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3">
                  <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: m.color }} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-text)]">{m.name}</p>
                    {m.typicalDoseValue != null && (
                      <p className="text-[12px] text-[var(--color-text-faint)]">
                        {t.mediLog.typicalDoseHint.replace('{value}', String(m.typicalDoseValue)).replace('{unit}', m.typicalDoseUnit ?? '')}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setEditing(m)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(m.id)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
