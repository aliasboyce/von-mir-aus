import { Link } from 'react-router-dom';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { gatherReviewDays } from '../reviews/reviewData';
import { dayKey } from '../calendar/calendarRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { formatClock } from '../reviews/reviewChartLayout';

/**
 * "Heute bisher" — one slim line on the Home page, no new screen:
 * "Dienstag, 6. Oktober · 15:20 · 08:10 eingecheckt · 11:05 TIPP · Dr. Weber
 * um 16:00". Built from what the app already knows (check-ins, skill runs,
 * appointments), in time order, so after a gap — a dissociative stretch, a
 * lost afternoon — the person can see at a glance which day it is, what
 * they did and who is coming. A tap opens today's Tagesrueckblick.
 */
export function TodaySoFar() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const now = new Date();
  const key = dayKey(now);
  const day = gatherReviewDays(key, key)[0];

  type Ev = { at: string; text: string };
  const events: Ev[] = [];
  if (day) {
    day.checkIns.forEach((c) => events.push({ at: formatClock(c.createdAt), text: `${formatClock(c.createdAt)} ${t.todaySoFar.checkedIn}` }));
    day.skillUses.forEach((u) => events.push({ at: formatClock(u.endedAt), text: `${formatClock(u.endedAt)} ${u.skillTitle.replace(/^[^:]+: /, '')}` }));
    const people = networkRepo.getAll();
    day.appointments.forEach((a) => {
      const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
      events.push({ at: a.time, text: `${person?.name ?? a.title} ${t.todaySoFar.at} ${a.time}` });
    });
  }
  // keep the line short: first check-in is enough, then the most recent things
  const sorted = events.sort((a, b) => a.at.localeCompare(b.at));
  const checkIns = sorted.filter((e) => e.text.endsWith(t.todaySoFar.checkedIn));
  const others = sorted.filter((e) => !e.text.endsWith(t.todaySoFar.checkedIn));
  const shown = [...(checkIns.length > 0 ? [checkIns[checkIns.length - 1]] : []), ...others].sort((a, b) => a.at.localeCompare(b.at)).slice(-5);

  const date = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' });
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  return (
    <Link to="/sicherheit/tagebuch?tab=review" className="block mb-4 text-[12.5px] leading-relaxed text-[var(--color-text-muted)]" aria-label={t.todaySoFar.open}>
      <span className="text-[var(--color-text)]">{date}</span> · {time}
      {shown.length > 0 && <> · {shown.map((e) => e.text).join(' · ')}</>}
    </Link>
  );
}
