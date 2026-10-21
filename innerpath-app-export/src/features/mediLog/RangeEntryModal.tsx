import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { mediLogRepo } from './mediLogRepo';
import { doseForDate } from './recurringMedicationsRepo';
import { createId } from '../../services/storage/repository';
import type { SavedMedication, MediLogEntry, RecurringMedication } from '../../data/types';

interface RangeEntryModalProps {
  open: boolean;
  onClose: () => void;
  savedMeds: SavedMedication[];
  recurringMeds: RecurringMedication[];
  onSaved: (createdEntries: MediLogEntry[]) => void;
}

function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const start = new Date(from + 'T00:00:00');
  const end = new Date(to + 'T00:00:00');
  for (let t = start.getTime(); t <= end.getTime(); t += 24 * 60 * 60 * 1000) {
    days.push(new Date(t).toISOString().slice(0, 10));
  }
  return days;
}

/**
 * Creates genuine, individually stored MediLogEntry records, one per
 * day - not a visual shortcut. Every generated day can be edited or
 * deleted afterward exactly like any entry created one at a time.
 */
export function RangeEntryModal({ open, onClose, savedMeds, recurringMeds, onSaved }: RangeEntryModalProps) {
  const t = useT();
  const [medicationId, setMedicationId] = useState<string>('');
  const [recurringId, setRecurringId] = useState<string>('');
  const [freeName, setFreeName] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [doseValue, setDoseValue] = useState<string>('');
  const [doseUnit, setDoseUnit] = useState('mg');
  const [time, setTime] = useState('09:00');

  const selectedMed = savedMeds.find((m) => m.id === medicationId);
  const selectedRecurring = recurringMeds.find((r) => r.id === recurringId);
  const effectiveName = selectedMed?.name ?? selectedRecurring?.name ?? freeName;

  const days = useMemo(() => (from && to && from <= to ? eachDay(from, to) : []), [from, to]);

  function handleMedicationPick(id: string) {
    setMedicationId(id);
    setRecurringId('');
    const med = savedMeds.find((m) => m.id === id);
    if (med) {
      setFreeName('');
      if (med.typicalDoseValue != null) setDoseValue(String(med.typicalDoseValue));
      if (med.typicalDoseUnit) setDoseUnit(med.typicalDoseUnit);
    }
  }

  function handleRecurringPick(id: string) {
    setRecurringId(id);
    setMedicationId('');
    const r = recurringMeds.find((rm) => rm.id === id);
    if (r) {
      setFreeName('');
      if (r.doseValue != null) setDoseValue(String(r.doseValue));
      if (r.doseUnit) setDoseUnit(r.doseUnit);
      if (r.times[0]) setTime(r.times[0]);
    }
  }

  function save() {
    if (!effectiveName.trim() || days.length === 0) return;
    const now = new Date().toISOString();
    const created: MediLogEntry[] = days.map((day) => {
      // A recurring medication's dose can change mid-range (see
      // doseForDate) — each day resolves its own correct dose instead
      // of the whole range flatly using whatever was picked at the top,
      // so a range spanning a dose change comes out correct without the
      // person having to split it into two separate range entries.
      const dailyDose = selectedRecurring ? doseForDate(selectedRecurring, day) : { doseValue: doseValue === '' ? undefined : Number(doseValue), doseUnit: doseUnit || undefined };
      return {
        id: createId('medi'),
        name: effectiveName.trim(),
        medicationId: medicationId || undefined,
        recurringMedicationId: recurringId || undefined,
        doseValue: dailyDose.doseValue,
        doseUnit: dailyDose.doseUnit,
        takenAt: new Date(`${day}T${time || '09:00'}:00`).toISOString(),
        createdAt: now,
        updatedAt: now,
      };
    });
    created.forEach((entry) => mediLogRepo.save(entry));
    setMedicationId('');
    setRecurringId('');
    setFreeName('');
    setFrom('');
    setTo('');
    setDoseValue('');
    onSaved(created);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.mediLog.rangeEntryTitle}>
      <div className="flex flex-col gap-4">
        {savedMeds.length > 0 && (
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">
              {t.mediLog.quickPickLabel}
            </span>
            <div className="flex flex-wrap gap-2">
              {savedMeds.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleMedicationPick(m.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px]"
                  style={{
                    background: medicationId === m.id ? m.color : 'var(--color-surface-muted)',
                    color: medicationId === m.id ? '#fff' : 'var(--color-text)',
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: medicationId === m.id ? '#fff' : m.color }} />
                  {m.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {recurringMeds.length > 0 && (
          <div>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)] mb-1.5 block">
              {t.mediLog.manageRecurring}
            </span>
            <div className="flex flex-wrap gap-2">
              {recurringMeds.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleRecurringPick(r.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px]"
                  style={{
                    background: recurringId === r.id ? (r.color ?? 'var(--color-primary)') : 'var(--color-surface-muted)',
                    color: recurringId === r.id ? '#fff' : 'var(--color-text)',
                  }}
                >
                  {r.color && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: recurringId === r.id ? '#fff' : r.color }} />}
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="flex flex-col gap-1.5">
          <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.nameLabel}</span>
          <input
            className="input"
            value={effectiveName}
            onChange={(e) => {
              setFreeName(e.target.value);
              setMedicationId('');
              setRecurringId('');
            }}
          />
        </label>
        <div className="flex gap-2">
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.fromLabel}</span>
            <input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 flex-1">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.toLabel}</span>
            <input type="date" className="input" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex flex-col gap-1.5 flex-1" style={{ minWidth: 90 }}>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.doseLabel}</span>
            <input
              type="number"
              inputMode="decimal"
              step="any"
              min={0}
              className="input"
              value={doseValue}
              onChange={(e) => setDoseValue(e.target.value)}
              placeholder="2"
            />
          </label>
          <label className="flex flex-col gap-1.5" style={{ width: 90 }}>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.unitLabel}</span>
            <input className="input" value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)} placeholder="mg" />
          </label>
          <label className="flex flex-col gap-1.5" style={{ width: 100 }}>
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.mediLog.timeLabel}</span>
            <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
          </label>
        </div>

        {days.length > 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)] bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3">
            {t.mediLog.rangePreview.replace('{count}', String(days.length)).replace('{from}', from).replace('{to}', to)}
          </p>
        )}

        <Button fullWidth onClick={save} disabled={!effectiveName.trim() || days.length === 0}>
          {t.mediLog.applyToEachDay}
        </Button>
      </div>
    </Modal>
  );
}
