import { useEffect } from 'react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { addMail, mailboxRepo } from '../../services/mailbox';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { notifyHint } from '../../services/hintFeedback';
import { gatherReviewDays } from './reviewData';
import { dayKey } from '../calendar/calendarRepo';

const hintStore = createKeyValueStore<string>('review-soft-hint-last-day', '');

function pad(n: number) {
  return String(n).padStart(2, '0');
}

/**
 * "Der Tagesrueckblick soll automatisch im Postfach angezeigt werden,
 * jeden Tag um 20 Uhr (Uhrzeit in den Einstellungen aenderbar); der
 * Wochenrueckblick kommt sonntags um diese Uhrzeit dazu, der
 * Monatsrueckblick am Ende vom Monat." Mounted once in AppShell.
 * Each message has a fixed id per period, so it arrives exactly once;
 * a review is only delivered when there was something recorded in the
 * period, and a missed one (app closed at that time) is caught up the
 * next time the app is opened (daily: yesterday; weekly: until Tuesday;
 * monthly: for the first three days of the next month).
 */
export function ReviewMailSync() {
  const t = useT();
  const { settings } = useSettings();
  const timeStr = settings.reviewTime ?? '20:00';
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  useEffect(() => {
    function run() {
      const now = new Date();
      const [hh, mm] = timeStr.split(':').map(Number);
      const atTime = (d: Date) => {
        const x = new Date(d);
        x.setHours(hh || 0, mm || 0, 0, 0);
        return x;
      };
      const hasData = (from: string, to: string) => gatherReviewDays(from, to).length > 0;

      // "Sanfter Hinweis ohne Diagnose": when a lot was done on a day while the check-ins
      // were high, the daily review carries one neutral question — never two days in a
      // row, and only if the person has not switched it off.
      const softHintFor = (key: string): boolean => {
        if (settings.reviewBodyHint === false) return false;
        const d = gatherReviewDays(key, key)[0];
        if (!d) return false;
        const high = d.checkIns.filter((c) => (c.tensionValue ?? 0) >= 60).length;
        const done = d.wishes.filter((w) => w.done && w.intent !== 'soll').length + d.achievements.length + d.skillUses.filter((u) => !u.practice).length;
        if (high < 2 || done < 3) return false;
        const last = hintStore.get();
        const y = new Date(`${key}T12:00:00`);
        y.setDate(y.getDate() - 1);
        return last !== dayKey(y);
      };

      // ---- daily: today once the time has passed, yesterday as catch-up
      for (const offset of [0, 1]) {
        const d = new Date(now);
        d.setDate(d.getDate() - offset);
        if (offset === 0 && now < atTime(d)) continue;
        const key = dayKey(d);
        if (!hasData(key, key)) continue;
        const soft = !mailboxRepo.getById(`review-day-${key}`) && softHintFor(key);
        if (addMail({
          id: `review-day-${key}`,
          kind: 'info',
          title: t.reviewMail.dayTitle.replace('{date}', d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })),
          text: '',
          prominent: true,
          createdAt: atTime(d).toISOString(),
          payload: { review: 'day', day: key, ...(soft ? { softHint: '1' } : {}) },
        })) {
          notifyHint(settings.hintMode);
          if (soft) hintStore.set(key);
        }
      }

      // ---- weekly: Sunday at the time (catch-up Monday/Tuesday for the Sunday before)
      for (const back of [0, 1, 2]) {
        const sun = new Date(now);
        sun.setDate(sun.getDate() - back);
        if (sun.getDay() !== 0) continue;
        if (back === 0 && now < atTime(sun)) continue;
        const start = new Date(sun);
        start.setDate(start.getDate() - 6);
        const from = dayKey(start);
        const to = dayKey(sun);
        if (!hasData(from, to)) continue;
        if (addMail({
          id: `review-week-${to}`,
          kind: 'info',
          title: t.reviewMail.weekTitle,
          text: `${start.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })} – ${sun.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}`,
          prominent: true,
          createdAt: atTime(sun).toISOString(),
          payload: { review: 'week', from, to },
        })) notifyHint(settings.hintMode);
      }

      // ---- monthly: last day of the month at the time (catch-up for the first 3 days after)
      for (const back of [0, 1, 2, 3]) {
        const ref = new Date(now);
        ref.setDate(ref.getDate() - back);
        const lastOfMonth = new Date(ref.getFullYear(), ref.getMonth() + 1, 0);
        const isLast = ref.getDate() === lastOfMonth.getDate();
        // for catch-up days: the month that just ended
        const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        const target = back === 0 ? (isLast ? lastOfMonth : null) : now.getDate() <= 3 ? prevEnd : null;
        if (!target || (back === 0 && now < atTime(lastOfMonth))) continue;
        const first = new Date(target.getFullYear(), target.getMonth(), 1);
        const from = dayKey(first);
        const to = dayKey(target);
        if (!hasData(from, to)) continue;
        if (addMail({
          id: `review-month-${target.getFullYear()}-${pad(target.getMonth() + 1)}`,
          kind: 'info',
          title: t.reviewMail.monthTitle.replace('{month}', target.toLocaleDateString(locale, { month: 'long', year: 'numeric' })),
          text: '',
          prominent: true,
          createdAt: atTime(target).toISOString(),
          payload: { review: 'month', from, to },
        })) notifyHint(settings.hintMode);
        break;
      }
    }
    run();
    const iv = window.setInterval(run, 60 * 1000);
    const onVisible = () => document.visibilityState === 'visible' && run();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeStr, settings.language, settings.hintMode]);

  return null;
}
