import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Pause, Play, X, Check, Pipette, History } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { recurringMedicationsRepo, ALL_DAYS } from './recurringMedicationsRepo';
import { MEDICATION_COLOR_PALETTE } from './savedMedicationsRepo';
import { createId } from '../../services/storage/repository';
import type { RecurringMedication, RecurringMedicationDay, SavedMedication } from '../../data/types';

interface RecurringMedicationsModalProps {
  open: boolean;
  onClose: () => void;
  savedMeds: SavedMedication[];
  onChange: () => void;
  /** if set, opens straight into "new" pre-filled from this medication —
   * the "Als Regelmedikation hinzufügen" entry point from a saved
   * medication's own detail. */
  prefillFrom?: SavedMedication | null;
}

const DAY_LABELS_DE: Record<RecurringMedicationDay, string> = {
  mo: 'Mo', tu: 'Di', we: 'Mi', th: 'Do', fr: 'Fr', sa: 'Sa', su: 'So',
};
const DAY_LABELS_EN: Record<RecurringMedicationDay, string> = {
  mo: 'Mon', tu: 'Tue', we: 'Wed', th: 'Thu', fr: 'Fri', sa: 'Sat', su: 'Sun',
};

export function RecurringMedicationsModal({ open, onClose, savedMeds, onChange, prefillFrom }: RecurringMedicationsModalProps) {
  const t = useT();
  const { settings } = useSettings();
  const dayLabels = settings.language === 'de' ? DAY_LABELS_DE : DAY_LABELS_EN;
  const [list, setList] = useState<RecurringMedication[]>(() => recurringMedicationsRepo.getAll());
  const [editing, setEditing] = useState<RecurringMedication | null>(null);
  const [changingDose, setChangingDose] = useState(false);
  const [newDoseValue, setNewDoseValue] = useState('');
  const [newDoseUnit, setNewDoseUnit] = useState('mg');
  const [newDoseFrom, setNewDoseFrom] = useState(() => new Date().toISOString().slice(0, 10));

  // Re-triggers the "new, pre-filled" form every time the modal is
  // (re-)opened specifically via the "Als Regelmedikation hinzufügen"
  // entry point — a plain useState initializer would only run once on
  // first mount and miss this on subsequent opens.
  useEffect(() => {
    if (!open) return;
    if (prefillFrom) {
      setEditing({
        id: createId('recur'),
        medicationId: prefillFrom.id,
        name: prefillFrom.name,
        doseValue: prefillFrom.typicalDoseValue,
        doseUnit: prefillFrom.typicalDoseUnit ?? 'mg',
        times: ['08:00'],
        days: [...ALL_DAYS],
        active: true,
        createdAt: new Date().toISOString(),
      });
    } else {
      setEditing(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, prefillFrom]);

  function refresh() {
    setList(recurringMedicationsRepo.getAll());
    onChange();
  }

  function openNew() {
    setEditing({
      id: createId('recur'),
      name: '',
      doseUnit: 'mg',
      times: ['08:00'],
      days: [...ALL_DAYS],
      active: true,
      createdAt: new Date().toISOString(),
    });
  }

  function save() {
    if (!editing || !editing.name.trim() || editing.times.length === 0 || editing.days.length === 0) return;
    recurringMedicationsRepo.save(editing);
    setEditing(null);
    refresh();
  }

  // A dose change is additive history, never a rewrite — past
  // MediLogEntry records already saved with the old dose stay exactly
  // as they were. Only the "current, going forward" dose changes, and
  // that new dose is what future recurring confirmations (see
  // doseForDate in recurringMedicationsRepo.ts) will use once the
  // effective date arrives.
  function applyDoseChange() {
    if (!editing || newDoseValue.trim() === '') return;
    const value = Number(newDoseValue);
    if (Number.isNaN(value)) return;
    const history = [...(editing.doseHistory ?? [])];
    if (history.length === 0 && editing.doseValue != null) {
      // Preserve the dose that was in effect before this change as its
      // own history entry, dated from this medication's creation — so
      // "what was the dose before 15.06.?" stays answerable rather than
      // history only starting from the first-ever explicit change.
      history.push({ effectiveFrom: editing.createdAt.slice(0, 10), doseValue: editing.doseValue, doseUnit: editing.doseUnit });
    }
    history.push({ effectiveFrom: newDoseFrom, doseValue: value, doseUnit: newDoseUnit });
    history.sort((a, b) => a.effectiveFrom.localeCompare(b.effectiveFrom));
    setEditing({ ...editing, doseValue: value, doseUnit: newDoseUnit, doseHistory: history });
    setChangingDose(false);
    setNewDoseValue('');
  }

  function toggleActive(r: RecurringMedication) {
    recurringMedicationsRepo.save({ ...r, active: !r.active });
    refresh();
  }

  function remove(id: string) {
    if (!window.confirm(t.mediLog.confirmDeleteRecurring)) return;
    recurringMedicationsRepo.remove(id);
    refresh();
  }

  function toggleDay(day: RecurringMedicationDay) {
    if (!editing) return;
    const days = editing.days.includes(day) ? editing.days.filter((d) => d !== day) : [...editing.days, day];
    setEditing({ ...editing, days });
  }

  function updateTime(index: number, value: string) {
    if (!editing) return;
    const times = [...editing.times];
    times[index] = value;
    setEditing({ ...editing, times });
  }

  function addTime() {
    if (!editing) return;
    setEditing({ ...editing, times: [...editing.times, '12:00'] });
  }

  function removeTime(index: number) {
    if (!editing) return;
    setEditing({ ...editing, times: editing.times.filter((_, i) => i !== index) });
  }

  return (
    <Modal open={open} onClose={onClose} title={t.mediLog.manageRecurring}>
      {editing ? (
        <div className="flex flex-col gap-4">
          {savedMeds.length > 0 && !editing.medicationId && (
            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.mediLog.quickPickLabel}</span>
              <div className="flex flex-wrap gap-2">
                {savedMeds.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setEditing({
                        ...editing,
                        medicationId: m.id,
                        name: m.name,
                        doseValue: m.typicalDoseValue,
                        doseUnit: m.typicalDoseUnit ?? 'mg',
                      })
                    }
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px]"
                    style={{ background: m.color, color: '#fff' }}
                  >
                    {m.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.nameLabel}</span>
            <input
              className="input"
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value, medicationId: undefined })}
            />
          </label>

          <div className="flex gap-2">
            <label className="flex flex-col gap-1.5 flex-1">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.doseLabel}</span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min={0}
                className="input"
                value={editing.doseValue ?? ''}
                onChange={(e) => setEditing({ ...editing, doseValue: e.target.value === '' ? undefined : Number(e.target.value) })}
                placeholder="2"
              />
            </label>
            <label className="flex flex-col gap-1.5" style={{ width: 90 }}>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.unitLabel}</span>
              <input className="input" value={editing.doseUnit ?? ''} onChange={(e) => setEditing({ ...editing, doseUnit: e.target.value })} placeholder="mg" />
            </label>
          </div>

          {editing.id && recurringMedicationsRepo.getById(editing.id) && (
            <div>
              {!changingDose ? (
                <button
                  type="button"
                  onClick={() => {
                    setNewDoseValue('');
                    setNewDoseUnit(editing.doseUnit ?? 'mg');
                    setNewDoseFrom(new Date().toISOString().slice(0, 10));
                    setChangingDose(true);
                  }}
                  className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]"
                >
                  <History size={14} /> {t.mediLog.changeDoseCta}
                </button>
              ) : (
                <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] p-3 flex flex-col gap-2.5">
                  <p className="text-[13px] font-medium text-[var(--color-text)]">{t.mediLog.changeDoseCta}</p>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      inputMode="decimal"
                      step="any"
                      min={0}
                      className="input flex-1"
                      placeholder={t.mediLog.newDoseLabel}
                      value={newDoseValue}
                      onChange={(e) => setNewDoseValue(e.target.value)}
                    />
                    <input className="input" style={{ width: 80 }} value={newDoseUnit} onChange={(e) => setNewDoseUnit(e.target.value)} />
                  </div>
                  <label className="flex items-center justify-between">
                    <span className="text-[13px] text-[var(--color-text-muted)]">{t.mediLog.effectiveFromLabel}</span>
                    <input type="date" className="input" style={{ width: 150 }} value={newDoseFrom} onChange={(e) => setNewDoseFrom(e.target.value)} />
                  </label>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={applyDoseChange} disabled={newDoseValue.trim() === ''}>
                      {t.common.save}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setChangingDose(false)}>
                      {t.common.cancel}
                    </Button>
                  </div>
                </div>
              )}
              {editing.doseHistory && editing.doseHistory.length > 0 && (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-[11px] text-[var(--color-text-faint)]">{t.mediLog.doseHistoryTitle}</p>
                  {editing.doseHistory.map((h, i) => {
                    const next = editing.doseHistory![i + 1];
                    return (
                      <p key={i} className="text-[12px] text-[var(--color-text-muted)]">
                        {t.mediLog.doseHistoryFrom.replace('{date}', new Date(h.effectiveFrom).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }))}
                        {next ? ` – ${new Date(next.effectiveFrom).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit' })}` : ''}
                        {': '}
                        {h.doseValue} {h.doseUnit}
                      </p>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!editing.medicationId && (
            <div>
              <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.mediLog.colorLabel}</span>
              <div className="flex flex-wrap gap-2 items-center">
                {MEDICATION_COLOR_PALETTE.slice(0, 8).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setEditing({ ...editing, color: c })}
                    aria-label={c}
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ background: c, outline: editing.color === c ? '2.5px solid var(--color-text)' : 'none', outlineOffset: 2 }}
                  >
                    {editing.color === c && <Check size={13} color="#fff" />}
                  </button>
                ))}
                <label
                  className="w-8 h-8 rounded-full cursor-pointer relative overflow-hidden flex items-center justify-center"
                  style={{
                    background: editing.color && !MEDICATION_COLOR_PALETTE.includes(editing.color) ? editing.color : 'var(--color-surface)',
                    outline: '1.5px dashed var(--color-border-strong)',
                    outlineOffset: 2,
                  }}
                >
                  <Pipette size={13} className="text-[var(--color-text-muted)]" />
                  <input
                    type="color"
                    value={editing.color ?? '#5C7ACB'}
                    onChange={(e) => setEditing({ ...editing, color: e.target.value })}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label={t.mediLog.customColorLabel}
                  />
                </label>
              </div>
              <p className="text-[11px] text-[var(--color-text-faint)] mt-1">{t.mediLog.recurringColorHint}</p>
            </div>
          )}

          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.mediLog.timesLabel}</span>
            <div className="flex flex-col gap-2">
              {editing.times.map((time, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input type="time" className="input" value={time} onChange={(e) => updateTime(i, e.target.value)} />
                  {editing.times.length > 1 && (
                    <button onClick={() => removeTime(i)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={addTime} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] w-fit">
                <Plus size={13} /> {t.mediLog.addTime}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">{t.mediLog.daysLabel}</span>
            <div className="flex flex-wrap gap-1.5">
              {ALL_DAYS.map((d) => (
                <button
                  key={d}
                  onClick={() => toggleDay(d)}
                  className="px-2.5 py-1.5 rounded-full text-[12px]"
                  style={{
                    background: editing.days.includes(d) ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                    color: editing.days.includes(d) ? '#fff' : 'var(--color-text)',
                  }}
                >
                  {dayLabels[d]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <Button fullWidth onClick={save} disabled={!editing.name.trim() || editing.times.length === 0 || editing.days.length === 0}>
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
            {t.mediLog.addRecurring}
          </Button>
          {list.length === 0 ? (
            <p className="text-[13px] text-[var(--color-text-faint)]">{t.mediLog.noRecurringSaved}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {list.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] p-3"
                  style={{ opacity: r.active ? 1 : 0.55 }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] text-[var(--color-text)]">
                      {r.name} {r.doseValue != null && `— ${r.doseValue} ${r.doseUnit ?? ''}`}
                    </p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {r.times.join(', ')} · {r.days.length === 7 ? t.mediLog.daily : r.days.map((d) => dayLabels[d]).join(', ')}
                    </p>
                  </div>
                  <button onClick={() => toggleActive(r)} aria-label={r.active ? t.mediLog.pauseRecurring : t.mediLog.resumeRecurring} className="p-1.5 text-[var(--color-text-muted)]">
                    {r.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button onClick={() => setEditing(r)} aria-label={t.common.edit} className="p-1.5 text-[var(--color-text-muted)]">
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => remove(r.id)} aria-label={t.common.delete} className="p-1.5 text-[var(--color-danger)]">
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
