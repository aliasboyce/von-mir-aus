import type { Appointment, CalendarCategory } from '../features/calendar/calendarRepo';
import { startOf, carryNotesFor } from '../features/calendar/calendarRepo';

/**
 * "Echte Erinnerungen auch bei geschlossener App": without a server the app
 * cannot push anything, but the phone's own calendar can. This writes a
 * standard .ics file — appointments with their alarm, and (separately) the
 * daily check-in reminders as recurring events with an alarm — that the
 * person opens once to put them into the system calendar, which then rings
 * with the app closed.
 *
 * IMPORTANT, and shown next to every export button: the file is a snapshot.
 * Changing an appointment in the app later does not change what is already
 * in the phone's calendar — the file has to be exported again.
 *
 * Times are written as "floating" local times (no zone), so an 08:00
 * reminder stays 08:00 wherever the person is.
 */
const CRLF = '\r\n';

function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/** Lines longer than 75 octets must be folded (RFC 5545) — counted in UTF-8 bytes. */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let cur = '';
  let bytes = 0;
  for (const ch of line) {
    const b = enc.encode(ch).length;
    if (bytes + b > (parts.length === 0 ? 75 : 74)) {
      parts.push(cur);
      cur = '';
      bytes = 0;
    }
    cur += ch;
    bytes += b;
  }
  parts.push(cur);
  return parts.join(CRLF + ' ');
}

const p2 = (n: number) => String(n).padStart(2, '0');
const local = (d: Date) => `${d.getFullYear()}${p2(d.getMonth() + 1)}${p2(d.getDate())}T${p2(d.getHours())}${p2(d.getMinutes())}00`;
const utcStamp = (d: Date) => `${d.getUTCFullYear()}${p2(d.getUTCMonth() + 1)}${p2(d.getUTCDate())}T${p2(d.getUTCHours())}${p2(d.getUTCMinutes())}${p2(d.getUTCSeconds())}Z`;

function wrap(events: string[][], name: string): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//von mir aus//Kalender//DE', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', `X-WR-CALNAME:${esc(name)}`, ...events.flat(), 'END:VCALENDAR'];
  return lines.map(fold).join(CRLF) + CRLF;
}

function alarm(minutesBefore: number, text: string): string[] {
  return ['BEGIN:VALARM', `TRIGGER:${minutesBefore === 0 ? 'PT0M' : `-PT${minutesBefore}M`}`, 'ACTION:DISPLAY', `DESCRIPTION:${esc(text)}`, 'END:VALARM'];
}

export function buildAppointmentsIcs(appointments: Appointment[], categories: CalendarCategory[], personName: (id?: string) => string | undefined, calName: string): string {
  const now = new Date();
  const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const stamp = utcStamp(now);
  const events = appointments
    .filter((a) => startOf(a).getTime() >= dayStart)
    .map((a) => {
      const start = startOf(a);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const who = personName(a.personId);
      const cat = categories.find((c) => c.id === a.categoryId);
      const desc = [a.note, ...carryNotesFor(a)].filter(Boolean).join('\n');
      return [
        'BEGIN:VEVENT',
        `UID:appt-${a.id}@von-mir-aus`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${local(start)}`,
        `DTEND:${local(end)}`,
        `SUMMARY:${esc(who && !a.title.includes(who) ? `${a.title} · ${who}` : a.title)}`,
        ...(desc ? [`DESCRIPTION:${esc(desc)}`] : []),
        ...(cat ? [`CATEGORIES:${esc(cat.label)}`] : []),
        ...(a.reminderMinutes != null ? alarm(a.reminderMinutes, a.title) : []),
        'END:VEVENT',
      ];
    });
  return wrap(events, calName);
}

export function buildDailyRemindersIcs(slots: { hour: number; minute: number; title: string }[], calName: string): string {
  const now = new Date();
  const stamp = utcStamp(now);
  const events = slots.map((s, i) => {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), s.hour, s.minute, 0);
    const end = new Date(start.getTime() + 5 * 60 * 1000);
    return [
      'BEGIN:VEVENT',
      `UID:daily-${i}-${s.hour}${p2(s.minute)}@von-mir-aus`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${local(start)}`,
      `DTEND:${local(end)}`,
      'RRULE:FREQ=DAILY',
      `SUMMARY:${esc(s.title)}`,
      ...alarm(0, s.title),
      'END:VEVENT',
    ];
  });
  return wrap(events, calName);
}
