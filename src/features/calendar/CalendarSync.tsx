import { useEffect } from 'react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { addMail } from '../../services/mailbox';
import { networkRepo } from '../safetyNet/networkRepo';
import { appointmentsRepo, carryNotesFor, dayKey, startOf, type Appointment } from './calendarRepo';

const MIN = 60 * 1000;
const CHECK_EVERY_MS = 30 * 1000;

/**
 * "Erinnerungen landen zur Zeit auf dem Startbildschirm; eine Stunde
 * nach dem Termin automatisch im Postfach: 1 'Wie war dein Termin?',
 * 2 'Willst du den naechsten Termin eintragen oder dir etwas
 * notieren?'"-Auftrag. Mounted once in AppShell, renders nothing.
 * Every message has a fixed id per appointment+time, so a check that
 * runs twice (or the app being reopened) never produces a duplicate;
 * moving an appointment gives it a new time and therefore new mails.
 *
 * Without a server there are no real push notifications: this only
 * runs while the app is open, and catches up the moment it is opened
 * again (a missed reminder is skipped silently if its time is long
 * past, a missed follow-up still comes for up to a week).
 */
export function CalendarSync() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  useEffect(() => {
    function run() {
      const now = Date.now();
      const todayKey = dayKey(new Date(now));
      const tomorrowKey = dayKey(new Date(now + 24 * 60 * MIN));
      const people = networkRepo.getAll();

      appointmentsRepo.getAll().forEach((a: Appointment) => {
        const start = startOf(a).getTime();
        if (Number.isNaN(start)) return;
        const tag = `${a.id}-${a.date}-${a.time}`;
        const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
        let changed: Partial<Appointment> = {};

        // --- reminder -------------------------------------------------
        if (a.reminderMinutes != null && !a.reminderDeliveredAt) {
          const due = start - a.reminderMinutes * MIN;
          if (now >= due) {
            if (now < start + 3 * 60 * MIN) {
              const when =
                a.date === todayKey
                  ? t.calendar.todayAt.replace('{time}', a.time)
                  : a.date === tomorrowKey
                    ? t.calendar.tomorrowAt.replace('{time}', a.time)
                    : t.calendar.onDateAt.replace('{date}', new Date(`${a.date}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' })).replace('{time}', a.time);
              const lines = [when + (person ? ` · ${person.name}` : '')];
              if (a.note) lines.push(a.note);
              carryNotesFor(a).forEach((n) => lines.push(`${t.calendar.carryNoteTitle}: ${n}`));
              addMail({
                id: `appt-reminder-${tag}`,
                kind: 'reminder',
                title: t.calendar.reminderMailTitle.replace('{title}', a.title),
                text: lines.join('\n'),
                prominent: true,
                payload: { appointmentId: a.id },
              });
            }
            changed = { ...changed, reminderDeliveredAt: new Date(now).toISOString() };
          }
        }

        // --- follow-up: one hour after the start ------------------------
        if (!a.followUpDeliveredAt && now >= start + 60 * MIN) {
          if (now < start + 7 * 24 * 60 * MIN) {
            const who = person ? ` ${settings.language === 'de' ? 'mit' : 'with'} ${person.name}` : '';
            const base = new Date(now).getTime();
            // The "how was it" card sorts above the "next appointment" card.
            addMail({
              id: `appt-fu2-${tag}`,
              kind: 'followup',
              title: t.calendar.followUp2Title,
              text: '',
              prominent: true,
              createdAt: new Date(base).toISOString(),
              payload: { appointmentId: a.id, step: '2' },
            });
            addMail({
              id: `appt-fu1-${tag}`,
              kind: 'followup',
              title: t.calendar.followUp1Title,
              text: t.calendar.followUp1Text.replace('{title}', a.title).replace('{person}', who),
              prominent: true,
              createdAt: new Date(base + 1000).toISOString(),
              payload: { appointmentId: a.id, step: '1' },
            });
          }
          changed = { ...changed, followUpDeliveredAt: new Date(now).toISOString() };
        }

        if (Object.keys(changed).length > 0) appointmentsRepo.save({ ...a, ...changed });
      });
    }

    run();
    const iv = window.setInterval(run, CHECK_EVERY_MS);
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.language]);

  return null;
}
