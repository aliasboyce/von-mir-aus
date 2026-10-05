import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { createId } from '../../services/storage/repository';
import { networkRepo } from '../safetyNet/networkRepo';
import { PersonAvatar } from './PersonAvatar';
import { appointmentsRepo, calendarCategoriesRepo, pushHintSeenStore, type Appointment } from './calendarRepo';
import { PushHintModal } from './PushHintModal';

interface Props {
  open: boolean;
  /** An existing appointment to edit, or null for a new one. */
  appointment: Appointment | null;
  /** Prefill for a new appointment. */
  defaults?: Partial<Pick<Appointment, 'date' | 'time' | 'personId' | 'categoryId' | 'title' | 'previousAppointmentId' | 'note'>>;
  onClose: () => void;
  onSaved: (a: Appointment) => void;
  onDeleted?: (id: string) => void;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{label}</span>
      {children}
    </label>
  );
}

/**
 * "Termine mit Uhrzeit und Datum eintragen, gleich Erinnerungen
 * erstellen, Termin mit ... (Person aus dem Netzwerk)"-Auftrag.
 * Mounted with key={appointment?.id ?? 'new'} by its callers (same
 * remount-instead-of-reset pattern as SkillFormModal.tsx), so every
 * field is a plain useState initialised from the props.
 */
export function AppointmentFormModal({ open, appointment, defaults, onClose, onSaved, onDeleted }: Props) {
  const t = useT();
  const people = networkRepo.getAll().filter((e) => e.category === 'person');
  const categories = calendarCategoriesRepo.getAll();
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const [title, setTitle] = useState(appointment?.title ?? defaults?.title ?? '');
  const [date, setDate] = useState(appointment?.date ?? defaults?.date ?? todayKey);
  const [time, setTime] = useState(appointment?.time ?? defaults?.time ?? '10:00');
  const [categoryId, setCategoryId] = useState<string | undefined>(appointment?.categoryId ?? defaults?.categoryId);
  const [personId, setPersonId] = useState<string | undefined>(appointment?.personId ?? defaults?.personId);
  const [note, setNote] = useState(appointment?.note ?? defaults?.note ?? '');
  const [reminder, setReminder] = useState<number | null>(appointment ? appointment.reminderMinutes ?? null : 15);
  const [hintOpen, setHintOpen] = useState(false);
  const [pending, setPending] = useState<Appointment | null>(null);

  const person = people.find((p) => p.id === personId);
  const effectiveTitle = title.trim() || (person ? t.calendar.withPerson.replace('{name}', person.name) : '');

  function persist(a: Appointment) {
    appointmentsRepo.save(a);
    onSaved(a);
  }

  function handleSave() {
    if (!effectiveTitle || !date) return;
    const now = new Date().toISOString();
    const base = appointment;
    const timeChanged = base && (base.date !== date || base.time !== time);
    const saved: Appointment = {
      id: base?.id ?? createId('appt'),
      title: effectiveTitle,
      date,
      time,
      categoryId,
      personId,
      note: note.trim() || undefined,
      reminderMinutes: reminder,
      // A moved appointment gets its reminder / follow-up again.
      reminderDeliveredAt: timeChanged ? undefined : base?.reminderDeliveredAt,
      followUpDeliveredAt: timeChanged ? undefined : base?.followUpDeliveredAt,
      reflection: base?.reflection,
      reflectionAt: base?.reflectionAt,
      noteForNext: base?.noteForNext,
      previousAppointmentId: base?.previousAppointmentId ?? defaults?.previousAppointmentId,
      createdAt: base?.createdAt ?? now,
      updatedAt: now,
    };
    // First appointment with a reminder: say once, clearly, that reminders
    // only show inside the app.
    if (!pushHintSeenStore.get()) {
      setPending(saved);
      setHintOpen(true);
      return;
    }
    persist(saved);
  }

  function confirmHint() {
    pushHintSeenStore.set(true);
    setHintOpen(false);
    if (pending) persist(pending);
    setPending(null);
  }

  return (
    <>
      <Modal open={open && !hintOpen} onClose={onClose} title={appointment ? t.calendar.formTitleEdit : t.calendar.formTitleNew}>
        <div className="flex flex-col gap-4 pb-2">
          <Field label={t.calendar.titleLabel}>
            <input autoFocus className="input" placeholder={person ? t.calendar.withPerson.replace('{name}', person.name) : t.calendar.titlePlaceholder} value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label={t.calendar.dateLabel}>
              <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
            <Field label={t.calendar.timeLabel}>
              <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.calendar.categoryLabel}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setCategoryId(undefined)} className="rounded-full px-3 py-1.5 text-[13px] border" style={!categoryId ? { background: 'var(--color-text-muted)', color: 'var(--color-surface)', borderColor: 'var(--color-text-muted)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                {t.calendar.noCategory}
              </button>
              {categories.map((c) => (
                <button key={c.id} type="button" onClick={() => setCategoryId(c.id)} className="rounded-full px-3 py-1.5 text-[13px] border" style={categoryId === c.id ? { background: c.color, borderColor: c.color, color: '#fff' } : { borderColor: c.color, color: c.color }}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {people.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.calendar.personLabel}</span>
              <div className="flex flex-col gap-1.5">
                <button type="button" onClick={() => setPersonId(undefined)} className="text-left rounded-[var(--radius-md)] px-3 py-2 text-[13px] border" style={!personId ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-soft)' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                  {t.calendar.noPerson}
                </button>
                {people.map((p) => (
                  <button key={p.id} type="button" onClick={() => setPersonId(p.id)} className="text-left rounded-[var(--radius-md)] px-3 py-2 border flex items-center gap-2" style={personId === p.id ? { borderColor: 'var(--color-primary)', background: 'var(--color-primary-soft)' } : { borderColor: 'var(--color-border)' }}>
                    <PersonAvatar entry={p} size={30} />
                    <span className="min-w-0">
                      <span className="block text-[13.5px] text-[var(--color-text)] truncate">{p.name}</span>
                      {p.role && <span className="block text-[11.5px] text-[var(--color-text-muted)] truncate">{p.role}</span>}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <Field label={t.calendar.noteLabel}>
            <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
          </Field>

          <Field label={t.calendar.reminderLabel}>
            <select className="input" value={reminder === null ? 'none' : String(reminder)} onChange={(e) => setReminder(e.target.value === 'none' ? null : Number(e.target.value))}>
              <option value="none">{t.calendar.reminderNone}</option>
              <option value="0">{t.calendar.reminderAtTime}</option>
              <option value="15">{t.calendar.reminder15}</option>
              <option value="60">{t.calendar.reminder60}</option>
              <option value="1440">{t.calendar.reminder1440}</option>
            </select>
            <span className="text-[11.5px] text-[var(--color-text-faint)]">{t.calendar.pushHintInline}</span>
          </Field>

          <div className="flex gap-2 mt-1">
            <Button fullWidth onClick={handleSave} disabled={!effectiveTitle || !date}>
              {t.common.save}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              {t.common.cancel}
            </Button>
          </div>
          {appointment && onDeleted && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm(t.calendar.confirmDelete)) {
                  appointmentsRepo.remove(appointment.id);
                  onDeleted(appointment.id);
                }
              }}
              className="text-[13px] text-[var(--color-danger)] text-center py-1"
            >
              {t.calendar.deleteAppointment}
            </button>
          )}
        </div>
      </Modal>
      <PushHintModal open={hintOpen} onConfirm={confirmHint} />
    </>
  );
}
