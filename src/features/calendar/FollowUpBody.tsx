import { useState } from 'react';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { markMailRead, type MailItem } from '../../services/mailbox';
import { useSettings } from '../../state/SettingsContext';
import { appointmentsRepo, dayKey, type Appointment } from './calendarRepo';
import { waitItemsRepo } from '../parkbox/parkboxRepo';

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
  const { settings } = useSettings();
  const de = settings.language !== 'en';
  const waitItem = appointment ? waitItemsRepo.getAll().find((w) => w.appointmentId === appointment.id) : undefined;
  const [waitChoice, setWaitChoice] = useState<'next' | 'back' | null>(null);
  const [endTime, setEndTime] = useState(() => {
    if (!appointment?.endTime) return addMinutes(appointment?.time ?? '10:00', 60);
    return addMinutes(appointment.time, minutesBetween(appointment.time, appointment.endTime));
  });

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
   * entered) the next appointment in one go. For a Wartezimmer item the
   * person decides: another period, or back into the waiting room. */
  function finishAll() {
    const nowIso = new Date().toISOString();
    appointmentsRepo.save({
      ...a,
      reflection: reflection.trim() || undefined,
      reflectionAt: reflection.trim() ? nowIso : a.reflectionAt,
      noteForNext: note.trim() || undefined,
      updatedAt: nowIso,
    });
    if (waitItem) {
      if (waitChoice === 'next' && date) {
        const next: Appointment = {
          id: createId('appt'),
          title: a.title,
          date,
          time,
          endTime: endTime > time ? endTime : undefined,
          categoryId: a.categoryId,
          note: a.note,
          reminderMinutes: a.reminderMinutes ?? null,
          previousAppointmentId: a.id,
          createdAt: nowIso,
          updatedAt: nowIso,
        };
        appointmentsRepo.save(next);
        waitItemsRepo.save({ ...waitItem, appointmentId: next.id, updatedAt: nowIso });
      } else if (waitChoice === 'back') {
        const carried = note.trim() ? [waitItem.note, `${de ? 'Vom letzten Mal' : 'From last time'}: ${note.trim()}`].filter(Boolean).join('\n') : waitItem.note;
        waitItemsRepo.save({ ...waitItem, appointmentId: undefined, note: carried, updatedAt: nowIso });
      }
    } else if (date) {
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
        {waitItem ? (
          <div data-testid="wait-followup">
            <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{de ? `Wie soll es mit „${waitItem.title}“ weitergehen?` : `What should happen next with “${waitItem.title}”?`}</p>
            <div className="flex flex-col gap-2">
              {(['next', 'back'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setWaitChoice(waitChoice === k ? null : k)}
                  aria-pressed={waitChoice === k}
                  className="text-left rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13.5px] border"
                  style={waitChoice === k ? { background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', color: 'var(--color-text)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                >
                  {k === 'next'
                    ? de ? '📅 Ich nehme mir noch einmal Zeit dafür – neuen Zeitraum eintragen' : '📅 I want to take more time for it – set a new period'
                    : de ? '🪑 Erst einmal zurück ins Wartezimmer' : '🪑 Back to the waiting room for now'}
                </button>
              ))}
            </div>
            {waitChoice === 'next' && (
              <div className="flex items-center gap-2 flex-wrap mt-2.5">
                <input type="date" className="input" style={{ width: 'auto' }} min={todayKey} value={date} onChange={(e) => setDate(e.target.value)} aria-label={t.calendar.followUp2Date} />
                <input type="time" className="input" style={{ width: 'auto' }} value={time} onChange={(e) => setTime(e.target.value)} aria-label={t.calendar.followUp2Time} />
                <span className="text-[12px] text-[var(--color-text-muted)]">{de ? 'bis' : 'to'}</span>
                <input type="time" className="input" style={{ width: 'auto' }} value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              </div>
            )}
            {waitChoice === 'back' && (
              <p className="text-[12px] text-[var(--color-text-faint)] mt-2 leading-relaxed">
                {de ? 'Es hat dann wieder einen Platz im Wartezimmer und wartet, bis seine Zeit kommt. Nichts geht verloren.' : 'It will have its place in the waiting room again and wait until its time comes. Nothing is lost.'}
              </p>
            )}
          </div>
        ) : (
        <div>
          <p className="text-[12.5px] font-medium text-[var(--color-text)] mb-1.5">{t.calendar.followUpAllNext}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" className="input" style={{ width: 'auto' }} min={todayKey} value={date} onChange={(e) => setDate(e.target.value)} />
            <span className="text-[12px] text-[var(--color-text-muted)]">{t.calendar.followUp2Time}</span>
            <input type="time" className="input" style={{ width: 'auto' }} value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
        </div>
        )}
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

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
}

function minutesBetween(from: string, to: string): number {
  return Math.max(15, toMinutes(to) - toMinutes(from));
}

function addMinutes(hhmm: string, add: number): string {
  const total = Math.min(23 * 60 + 59, toMinutes(hhmm) + add);
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}
