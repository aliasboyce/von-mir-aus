import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { mediLogRepo } from './mediLogRepo';
import { doseForDate } from './recurringMedicationsRepo';
import { createId } from '../../services/storage/repository';
import { useL } from '../projects/useL';
import { ArrowDownToLine, Ban } from 'lucide-react';
import type { SavedMedication, MediLogEntry, RecurringMedication } from '../../data/types';

interface RangeEntryModalProps {
  open: boolean;
  onClose: () => void;
  savedMeds: SavedMedication[];
  recurringMeds: RecurringMedication[];
  /** schon vorhandene Einträge – damit nichts doppelt angelegt wird */
  existing?: MediLogEntry[];
  onSaved: (createdEntries: MediLogEntry[]) => void;
}

function localIso(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/** Alle Kalendertage von..bis (lokal, ohne Zeitzonen-/Sommerzeit-Verschiebung). Höchstens 366. */
function eachDay(from: string, to: string): string[] {
  const days: string[] = [];
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const cur = new Date(fy, fm - 1, fd, 12, 0, 0);
  const end = new Date(ty, tm - 1, td, 12, 0, 0);
  while (cur.getTime() <= end.getTime() && days.length < 366) {
    days.push(localIso(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

/**
 * Creates genuine, individually stored MediLogEntry records, one per
 * day - not a visual shortcut. Every generated day can be edited or
 * deleted afterward exactly like any entry created one at a time.
 */
export function RangeEntryModal({ open, onClose, savedMeds, recurringMeds, existing = [], onSaved }: RangeEntryModalProps) {
  const t = useT();
  const { L, lang } = useL();
  const [perDay, setPerDay] = useState(false);
  /** Tagesdosen, die von der Grunddosis abweichen */
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  /** bewusst ausgelassene Tage (oder trotz vorhandenem Eintrag angelegte) */
  const [toggled, setToggled] = useState<Record<string, boolean>>({});
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

  const nameKey = effectiveName.trim().toLowerCase();
  const existingDays = useMemo(() => {
    const set = new Set<string>();
    existing.forEach((e) => {
      if (e.name.trim().toLowerCase() === nameKey) {
        const d = new Date(e.takenAt);
        set.add(localIso(d));
      }
    });
    return set;
  }, [existing, nameKey]);

  /** Grunddosis eines Tages (bei Dauermedikation mit Dosiswechsel passend zum Tag) */
  function baseDose(day: string): string {
    if (selectedRecurring) {
      const d = doseForDate(selectedRecurring, day);
      return d.doseValue == null ? '' : String(d.doseValue);
    }
    return doseValue;
  }
  const doseText = (day: string) => (perDay && overrides[day] !== undefined ? overrides[day] : baseDose(day));
  /** wird dieser Tag angelegt? Vorhandene Tage standardmäßig nicht, außer bewusst umgeschaltet. */
  const included = (day: string) => (existingDays.has(day) ? !!toggled[day] : !toggled[day]);
  const toCreate = perDay ? days.filter(included) : days;

  function setDay(day: string, v: string) { setOverrides((o) => ({ ...o, [day]: v })); }
  function copyDown(fromDay: string) {
    const v = doseText(fromDay);
    const idx = days.indexOf(fromDay);
    setOverrides((o) => { const n = { ...o }; days.slice(idx + 1).forEach((d) => { n[d] = v; }); return n; });
  }
  function weekday(day: string): string {
    const [y, m, d] = day.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'short', day: '2-digit', month: '2-digit' });
  }

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
    if (!effectiveName.trim() || toCreate.length === 0) return;
    const now = new Date().toISOString();
    const created: MediLogEntry[] = toCreate.map((day) => {
      // A recurring medication's dose can change mid-range (see
      // doseForDate) — each day resolves its own correct dose instead
      // of the whole range flatly using whatever was picked at the top,
      // so a range spanning a dose change comes out correct without the
      // person having to split it into two separate range entries.
      const dailyDose = perDay ? { doseValue: doseText(day) === '' ? undefined : Number(doseText(day).replace(',', '.')), doseUnit: doseUnit || undefined } : selectedRecurring ? doseForDate(selectedRecurring, day) : { doseValue: doseValue === '' ? undefined : Number(doseValue), doseUnit: doseUnit || undefined };
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
    setOverrides({});
    setToggled({});
    setPerDay(false);
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] hit44"
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
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] hit44"
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

        {days.length > 1 && (
          <label className="flex items-start gap-2.5 rounded-[var(--radius-md)] p-3 bg-[var(--color-surface-muted)] text-[14px]" data-testid="range-perday-toggle">
            <input type="checkbox" className="mt-1" checked={perDay} onChange={(e) => setPerDay(e.target.checked)} />
            <span>
              <span className="font-medium">{L('Dosis ist nicht jeden Tag gleich', 'Dose is not the same every day')}</span>
              <span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Du siehst alle Tage in einer Liste. Mit ⤓ übernimmst du eine Dosis für alle folgenden Tage – so änderst du sie nur dort, wo sie sich ändert. Mit 🚫 lässt du einen Tag aus (nicht genommen).', 'You see all days in a list. Use ⤓ to carry a dose down to all following days – so you only change it where it changes. Use 🚫 to skip a day (not taken).')}</span>
            </span>
          </label>
        )}

        {perDay && days.length > 0 && (
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] max-h-[44vh] overflow-y-auto" data-testid="range-day-list">
            {days.map((day) => {
              const has = existingDays.has(day);
              const on = included(day);
              return (
                <div key={day} className="flex items-center gap-2 px-3 py-1.5 border-b border-[var(--color-border)] last:border-b-0" style={{ opacity: on ? 1 : 0.5 }} data-testid={`range-row-${day}`}>
                  <span className="text-[13px] w-[66px] flex-shrink-0 text-[var(--color-text-muted)]">{weekday(day)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="input !py-1.5 !px-2 w-[72px] text-[14px]"
                    value={doseText(day)}
                    disabled={!on}
                    onChange={(e) => setDay(day, e.target.value)}
                    aria-label={`${L('Dosis am', 'Dose on')} ${weekday(day)}`}
                    data-testid={`range-dose-${day}`}
                  />
                  <span className="text-[12.5px] text-[var(--color-text-faint)] w-8">{doseUnit}</span>
                  <button type="button" onClick={() => copyDown(day)} disabled={!on} className="w-11 h-11 rounded-full flex items-center justify-center text-[var(--color-primary)]" aria-label={L('Diese Dosis für alle folgenden Tage übernehmen', 'Carry this dose to all following days')} data-testid={`range-copy-${day}`}>
                    <ArrowDownToLine size={16} />
                  </button>
                  <button type="button" onClick={() => setToggled((o) => ({ ...o, [day]: !o[day] }))} className="ml-auto text-[12px] px-2.5 py-2 rounded-full flex items-center gap-1 whitespace-nowrap hit44" style={{ background: 'var(--color-surface-muted)', color: 'var(--color-text-muted)' }} aria-pressed={!on} data-testid={`range-skip-${day}`}>
                    {has ? (on ? L('trotzdem', 'anyway') : L('schon da', 'exists')) : (on ? <Ban size={14} aria-label={L('An diesem Tag nicht genommen', 'Not taken on this day')} /> : L('ausgelassen', 'skipped'))}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {days.length > 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)] bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-3" data-testid="range-summary">
            {perDay
              ? L(`${toCreate.length} von ${days.length} Tagen werden eingetragen (${from} bis ${to}).${days.length - toCreate.length > 0 ? ` ${days.length - toCreate.length} ausgelassen oder schon vorhanden.` : ''}`, `${toCreate.length} of ${days.length} days will be entered (${from} to ${to}).${days.length - toCreate.length > 0 ? ` ${days.length - toCreate.length} skipped or already there.` : ''}`)
              : t.mediLog.rangePreview.replace('{count}', String(days.length)).replace('{from}', from).replace('{to}', to)}
            {!perDay && existingDays.size > 0 && days.some((d) => existingDays.has(d)) && (
              <span className="block mt-1 text-[12.5px]">{L('Hinweis: An manchen Tagen gibt es für dieses Medikament schon einen Eintrag – wähle „Dosis ist nicht jeden Tag gleich“, um sie auszulassen.', 'Note: on some days there is already an entry for this medication – choose “Dose is not the same every day” to skip them.')}</span>
            )}
          </p>
        )}

        <Button fullWidth onClick={save} disabled={!effectiveName.trim() || toCreate.length === 0} data-testid="range-save">
          {t.mediLog.applyToEachDay}
        </Button>
      </div>
    </Modal>
  );
}
