import { useState } from 'react';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { markMailRead, type MailItem } from '../../services/mailbox';
import { appointmentsRepo, dayKey, type Appointment } from './calendarRepo';

/** True for the two appointment follow-up messages the calendar adds. */
export function isFollowUpMail(m: MailItem): boolean {
  return m.kind === 'followup' && !!m.payload?.appointmentId;
}

/**
 * The inline body of the two follow-up messages — a real text field IN
 * the message, as asked ("da dann ein Textfeld fuer die Reflexion"):
 *  step 1  "Wie war dein Termin?"  -> reflection, saved on the appointment
 *          (and so shown in the calendar, Tages- and Wochenrueckblick);
 *  step 2  "Naechsten Termin eintragen oder etwas notieren?" -> a note
 *          shown at the NEXT appointment, and/or the next appointment
 *          itself, created right here with the same person and category
 *          and saved straight into the calendar.
 */
export function FollowUpBody({ mail }: { mail: MailItem }) {
  const t = useT();
  const appointment = appointmentsRepo.getById(mail.payload?.appointmentId ?? '');
  const step = mail.payload?.step === 'all' ? 3 : mail.payload?.step === '2' ? 2 : 1;
  const [reflection, setReflection] = useState(appointment?.reflection ?? '');
  const [note, setNote] = useState(appointment?.noteForNext ?? '');
  const [date, setDate] = useState('');
  const [time, setTime] = useState(appointment?.time ?? '10:00');
  const [done, setDone] = useState<string | null>(null);

  if (!appointment) return <p className="text-[12.5px] text-[var(--color-text-faint)]">{t.calendar.followUpMissing}</p>;
  const a = appointment;

  function saveReflection() {
    appointmentsRepo.save({ ...a, reflection: reflection.trim() || undefined, reflectionAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    setDone(t.calendar.followUpSaved);
    markMailRead(mail.id);
  }

  function saveNote() {
    appointmentsRepo.save({ ...a, noteForNext: note.trim() || undefined, updatedAt: new Date().toISOString() });
    setDone(t.calendar.followUpSaved);
    markMailRead(mail.id);
  }

  function createNext() {
    if (!date) return;
    const nowIso = new Date().toISOString();
    // note first, so the link below finds it
    appointmentsRepo.save({ ...a, noteForNext: note.trim() || undefined, updatedAt: nowIso });
    const next: Appointment = {
      id: createId('appt'),
      title: a.title,
      date,
      time,
      categoryId: a.categoryId,
      personId: a.personId,
      reminderMinutes: a.reminderMinutes ?? 15,
      previousAppointmentId: a.id,
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    appointmentsRepo.save(next);
    setDone(t.calendar.followUpNextSaved);
    markMailRead(mail.id);
  }

  /** "Fertig": saves reflection, note for next time and (if a date was
   * entered) the next appointment in one go. */
  function finishAll() {
    const nowIso = new Date().toISOString();
    appointmentsRepo.save({
      ...a,
      reflection: reflection.trim() || undefined,
      reflectionAt: reflection.trim() ? nowIso : a.reflectionAt,
      noteForNext: note.trim() || undefined,
      updatedAt: nowIso,
    });
    if (date) {
      appointmentsRepo.save({
        id: createId('appt'),
        title: a.title,
        date,
        time,
        categoryId: a.categoryId,
        personId: a.personId,
        reminderMinutes: a.reminderMinutes ?? 15,
        previousAppointmentId: a.id,
        createdAt: nowIso,
        updatedAt: nowIso,
      });
    }
    setDone(t.calendar.followUpAllSaved);
    markMailRead(mail.id);
  }

  const todayKey = dayKey(new Date());

  if (step === 3) {
    return (
      <div className="mt-2 flex flex-col gap-4">
        <div>
          <textarea className="input w-full" rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={t.calendar.followUp1Placeholder} />
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{t.calendar.followUpAllNext}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="input" style={{ width: 'auto' }} min={todayKey} value={date} onChange={(e) => setDate(e.target.value)} />
            <span className="text-[12px] text-[var(--color-text-muted)]">{t.calendar.followUp2Time}</span>
            <input type="time" className="input" style={{ width: 'auto' }} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        <div>
          <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{t.calendar.followUpAllNote}</p>
          <textarea className="input w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="flex items-center gap-3">
          <button onClick={finishAll} className="rounded-full px-6 py-2 text-[14px] text-[var(--color-surface)]" style={{ background: 'var(--color-primary)' }}>
            {t.calendar.followUpDoneCta}
          </button>
          {done && <span className="text-[12.5px] text-[var(--color-primary)]">{done}</span>}
        </div>
      </div>
    );
  }

  if (step === 1) {
    return (
      <div className="mt-1.5">
        <textarea className="input w-full" rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} placeholder={t.calendar.followUp1Placeholder} />
        <div className="flex items-center gap-3 mt-2">
          <button onClick={saveReflection} disabled={!reflection.trim()} className="rounded-full px-4 py-1.5 text-[13px] text-[var(--color-surface)] disabled:opacity-40" style={{ background: 'var(--color-primary)' }}>
            {t.calendar.followUpSave}
          </button>
          {done && <span className="text-[12.5px] text-[var(--color-primary)]">{done}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-1.5">
      <label className="block text-[12px] text-[var(--color-text-muted)] mb-1">{t.calendar.followUp2NoteLabel}</label>
      <textarea className="input w-full" rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className="text-[12px] text-[var(--color-text-muted)]">{t.calendar.followUp2Date}</span>
        <input type="date" className="input" style={{ width: 'auto' }} min={todayKey} value={date} onChange={(e) => setDate(e.target.value)} />
        <span className="text-[12px] text-[var(--color-text-muted)]">{t.calendar.followUp2Time}</span>
        <input type="time" className="input" style={{ width: 'auto' }} value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
        <button onClick={createNext} disabled={!date} className="rounded-full px-4 py-1.5 text-[13px] text-[var(--color-surface)] disabled:opacity-40" style={{ background: 'var(--color-primary)' }}>
          {t.calendar.followUp2Create}
        </button>
        <button onClick={saveNote} disabled={!note.trim()} className="rounded-full px-4 py-1.5 text-[13px] border disabled:opacity-40" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          {t.calendar.followUp2NoteSave}
        </button>
      </div>
      {done && <p className="text-[12.5px] text-[var(--color-primary)] mt-2">{done}</p>}
    </div>
  );
}
