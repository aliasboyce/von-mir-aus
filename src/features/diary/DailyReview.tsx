import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { WEATHER_META, NEED_META } from '../innerWeather/weatherMeta';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { DayCurveBlock } from '../reviews/DayCurveBlock';
import { buildReviewPdf } from '../reviews/reviewPdf';
import { gatherReviewDays } from '../reviews/reviewData';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { TensionDayChart } from '../polyvagal/TensionDayChart';
import { describeTensionDay } from '../polyvagal/describeTensionDay';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { MediLogChart } from '../mediLog/MediLogChart';
import { diaryCategoriesStore } from './diaryCategories';
import { groupByDay } from '../../services/groupByDay';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { appointmentsRepo, wishesRepo, type Appointment, type Wish } from '../calendar/calendarRepo';
import { activityRepo } from '../../services/activityLog';
import { zugangRepo } from '../zugang/zugangRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { distinctCheckInDays } from '../garden/gardenGrowth';
import { lettersRepo } from '../briefAnMich/lettersRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { PersonLine } from '../calendar/PersonAvatar';
import { skillUseLine, skillUseTime, skillUseIsSuccess } from '../resources/skillUseText';
import type { DiaryEntry } from '../../data/types';

interface DailyReviewProps {
  diaryEntries: DiaryEntry[];
}

const ACHIEVEMENT_CATEGORY_LABEL = 'Erfolge';

/**
 * Deliberately reads several existing repositories (weather, polyvagal,
 * medi-log, diary) without writing anything — this is a lens over data
 * that already exists elsewhere, not a fourth place to enter it. Each
 * section (weather/check-ins, Tageskurve, Medi-Log, Erfolge) respects
 * its own independent settings toggle — see Settings and each source
 * feature's own inline toggle, both reading the same stored value.
 */
export function DailyReview({ diaryEntries }: DailyReviewProps) {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';

  async function exportDayPdf(day: string) {
    const title = t.reviewSummary.pdfDayHeading;
    const bytes = buildReviewPdf({ kind: 'day', title, fromDay: day, toDay: day, days: gatherReviewDays(day, day), t, locale });
    await deliverPdf(bytes, safeFilename(`rueckblick-${day}`, 'rueckblick'), title);
  }
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const showWeather = settings.dailyReviewShowWeather !== false;
  const showPolyvagal = settings.dailyReviewShowPolyvagal !== false;
  const showTension = settings.dailyReviewShowTension !== false;
  const showMediLog = settings.dailyReviewShowMediLog !== false;
  const showAchievements = settings.dailyReviewShowAchievements !== false;

  const achievementCategoryId = useMemo(
    () => diaryCategoriesStore.getAll().find((c) => c.label === ACHIEVEMENT_CATEGORY_LABEL)?.id,
    [],
  );

  // Only "Allgemeines" entries (plain diary writing) feed the "diary"
  // section below — a custom category like "Poesie" is meant to stay a
  // separate space. "Erfolge" is handled as its own dedicated section
  // instead, with heart bullets matching the Home page, not folded in
  // here as plain text.
  const generalEntries = useMemo(
    () => diaryEntries.filter((d) => d.inReview === true),
    [diaryEntries],
  );
  const achievementEntries = useMemo(
    () => (achievementCategoryId ? diaryEntries.filter((d) => d.categoryId === achievementCategoryId) : []),
    [diaryEntries, achievementCategoryId],
  );

  const days = useMemo(() => {
    const weather = showWeather ? weatherRepo.getAll() : [];
    const polyvagal = showPolyvagal ? polyvagalRepo.getAll() : [];
    const tension = showTension ? tensionRepo.getAll() : [];
    const mediLog = showMediLog ? mediLogRepo.getAll().filter((e) => e.status !== 'skipped') : [];
    const achievements = showAchievements ? achievementEntries : [];

    // Priority: long-term usage — the previous version filtered every
    // one of the six full arrays once per displayed day (up to 30
    // times each), so cost grew as (days shown) × (total entries ever
    // recorded), getting slower the longer someone had used the app.
    // Grouping each array by day once, up front, makes this a single
    // pass over each array (O(n)) plus a cheap key lookup per day,
    // regardless of how many months or years of history exist.
    const weatherByDay = groupByDay(weather, (w) => w.createdAt);
    const polyvagalByDay = groupByDay(polyvagal, (p) => p.createdAt);
    const tensionByDay = groupByDay(tension, (e) => e.createdAt);
    const diaryByDay = groupByDay(generalEntries, (d) => d.createdAt);
    const mediLogByDay = groupByDay(mediLog, (m) => m.takenAt);
    const achievementsByDay = groupByDay(achievements, (a) => a.createdAt);
    const skillUsesByDay = groupByDay(skillUsesRepo.getAll(), (u) => u.endedAt);
    const apByDay = new Map<string, Appointment[]>();
    appointmentsRepo.getAll().forEach((a) => apByDay.set(a.date, [...(apByDay.get(a.date) ?? []), a]));
    const actByDay = groupByDay(activityRepo.getAll().filter((e) => e.type !== 'checkin'), (e) => e.createdAt);
    const zugByDay = groupByDay(zugangRepo.getAll(), (z) => z.createdAt);
    const letByDay = groupByDay(lettersRepo.getAll().filter((l) => l.inReview === true), (l) => l.createdAt);
    const gardenByDay = new Map<string, string[]>();
    gardenRepo.getAll().forEach((g) => distinctCheckInDays(g).forEach((d) => gardenByDay.set(d, [...(gardenByDay.get(d) ?? []), g.name])));
    const wiByDay = new Map<string, Wish[]>();
    wishesRepo.getAll().forEach((w) => wiByDay.set(w.day, [...(wiByDay.get(w.day) ?? []), w]));

    const dayKeys = new Set<string>([
      ...weatherByDay.keys(), ...polyvagalByDay.keys(), ...tensionByDay.keys(),
      ...diaryByDay.keys(), ...mediLogByDay.keys(), ...achievementsByDay.keys(), ...skillUsesByDay.keys(),
      ...apByDay.keys(), ...wiByDay.keys(), ...actByDay.keys(), ...zugByDay.keys(), ...letByDay.keys(), ...gardenByDay.keys(),
    ]);

    return Array.from(dayKeys)
      .sort((a, b) => b.localeCompare(a))
      .slice(0, 30)
      .map((day) => ({
        day,
        weather: weatherByDay.get(day) ?? [],
        polyvagal: polyvagalByDay.get(day) ?? [],
        tension: tensionByDay.get(day) ?? [],
        diary: diaryByDay.get(day) ?? [],
        mediLog: mediLogByDay.get(day) ?? [],
        achievements: achievementsByDay.get(day) ?? [],
        skillUses: skillUsesByDay.get(day) ?? [],
        appointments: (apByDay.get(day) ?? []).sort((a, b) => a.time.localeCompare(b.time)),
        wishes: wiByDay.get(day) ?? [],
        activities: actByDay.get(day) ?? [],
        zugangCount: (zugByDay.get(day) ?? []).length,
        letters: letByDay.get(day) ?? [],
        garden: gardenByDay.get(day) ?? [],
      }));
  }, [generalEntries, achievementEntries, showWeather, showPolyvagal, showTension, showMediLog, showAchievements]);

  if (days.length === 0) {
    return <EmptyState title={t.diary.reviewEmpty} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map(({ day, weather, polyvagal, tension, diary, mediLog, achievements, skillUses, appointments, wishes, activities, zugangCount, letters, garden }) => (
        <Card key={day}>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">
            {new Date(`${day}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>

          {weather.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {weather.map((w) => (
                <span
                  key={w.id}
                  className="inline-flex items-center gap-1.5 text-[12px] bg-[var(--color-surface-muted)] rounded-full px-2.5 py-1"
                >
                  <span>{WEATHER_META[w.condition].emoji}</span>
                  {WEATHER_META[w.condition].label(t)}
                  {w.need && (
                    <span className="text-[var(--color-text-faint)]">· {NEED_META[w.need].label(t)}</span>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* "Im Tagesrueckblick soll die klare Kurve der Anspannung mit den
           * Farbbereichen angezeigt werden — jeder Wert, jede Farbe, jede
           * Uhrzeit, vergroesserbar, als PDF" — replaces the tiny sketch
           * curve and the evaluative one-sentence day description. */}
          {polyvagal.length > 0 && <DayCurveBlock checkIns={polyvagal} skillUses={skillUses} onPdf={() => exportDayPdf(day)} />}

          {tension.length > 0 && polyvagal.length === 0 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-1.5" style={{ width: 100 }}>
                <TensionDayChart entries={tension} />
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] flex-1">{describeTensionDay(tension, t)}</p>
            </div>
          )}

          {mediLog.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.diary.reviewMediLogLabel}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {mediLog.map((m) => (
                  <span key={m.id} className="text-[12px] bg-[var(--color-surface-muted)] rounded-full px-2.5 py-1">
                    {m.name}
                    {m.doseValue != null && ` · ${m.doseValue} ${m.doseUnit ?? ''}`}
                  </span>
                ))}
              </div>
              <MediLogChart entries={mediLog} height={70} />
            </div>
          )}

          {/* "Skill genutzt bei der und der Anspannung — im Rueckblick
           * gespeichert"-Auftrag: every finished Skill run of the day. */}
          {skillUses.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.skillRun.usedIn}</p>
              <div className="flex flex-col gap-1">
                {skillUses.map((u) => (
                  <p key={u.id} className="text-[13px] text-[var(--color-text)] flex items-start gap-1.5">
                    <span className="text-[var(--color-text-faint)] flex-shrink-0 tabular-nums">{skillUseTime(u, locale)}</span>
                    <span>
                      {skillUseLine(u, t)}
                      {skillUseIsSuccess(u) && <span className="text-[var(--color-primary)]"> ✓</span>}
                      {u.note && <span className="block text-[12px] text-[var(--color-text-muted)] italic">„{u.note}“</span>}
                    </span>
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* "Jede Funktion, die man in der App anwendet, soll in den Rueckblick" —
           * used resources/bridges/contacts, Zugang, garden and chosen letters */}
          {(activities.length > 0 || zugangCount > 0 || garden.length > 0) && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.reviewSummary.pdfUsedTitle}</p>
              {activities.map((a) => (
                <p key={a.id} className="text-[13px] text-[var(--color-text)]">• {a.label}</p>
              ))}
              {zugangCount > 0 && <p className="text-[13px] text-[var(--color-text)]">• {t.reviewSummary.pdfZugangTitle}: {t.reviewSummary.pdfZugangCount.replace('{n}', String(zugangCount))}</p>}
              {garden.map((g) => (
                <p key={g} className="text-[13px] text-[var(--color-text)]">• {t.reviewSummary.pdfGardenTitle}: {g}</p>
              ))}
            </div>
          )}

          {letters.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.reviewSummary.pdfLettersTitle}</p>
              {letters.map((l) => (
                <p key={l.id} className="text-[13px] text-[var(--color-text-muted)] italic whitespace-pre-line">„{l.text}“</p>
              ))}
            </div>
          )}

          {appointments.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.calendar.reviewAppointments}</p>
              <div className="flex flex-col gap-2">
                {appointments.map((a) => {
                  const person = a.personId ? networkRepo.getAll().find((p) => p.id === a.personId) : undefined;
                  return (
                    <div key={a.id} className="rounded-[var(--radius-md)] p-2.5" style={{ background: 'var(--color-surface-muted)' }}>
                      <p className="text-[13px] text-[var(--color-text)]">
                        <span className="tabular-nums text-[var(--color-text-faint)]">{a.time}</span> {a.title}
                      </p>
                      {person && (
                        <div className="mt-1">
                          <PersonLine entry={person} size={24} />
                        </div>
                      )}
                      {a.reflection && <p className="text-[12.5px] text-[var(--color-text-muted)] italic mt-1.5 whitespace-pre-line">„{a.reflection}“</p>}
                      {a.noteForNext && <p className="text-[12px] text-[var(--color-text-muted)] mt-1 whitespace-pre-line">→ {a.noteForNext}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {wishes.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{t.calendar.reviewWishes}</p>
              {wishes.map((w) => (
                <p key={w.id} className="text-[13px] flex items-start gap-1.5" style={{ color: w.done ? 'var(--color-text-faint)' : 'var(--color-text)' }}>
                  <span aria-hidden="true">{w.done ? (w.intent === 'soll' ? '·' : '✓') : '○'}</span>
                  <span style={{ textDecoration: w.done ? 'line-through' : 'none' }}>{w.text}{w.intent === 'soll' && <span className="text-[11px] text-[var(--color-text-faint)]"> · {t.calendar.intentSoll}</span>}</span>
                </p>
              ))}
            </div>
          )}

          {achievements.length > 0 && (
            <div className="flex flex-col gap-1 mb-3">
              {achievements.map((a) => (
                <p key={a.id} className="text-[13px] text-[var(--color-text)] flex items-start gap-1.5">
                  <span className="text-[var(--color-accent-clay)] flex-shrink-0" aria-hidden="true">
                    ♡
                  </span>
                  {a.content}
                </p>
              ))}
            </div>
          )}

          {diary.length > 0 && (
            <div className="flex flex-col gap-1.5">
              {diary.map((entry) => (
                <div key={entry.id}>
                  <p
                    className={expandedIds.has(entry.id) ? 'text-[13px] text-[var(--color-text)]' : 'text-[13px] text-[var(--color-text)] line-clamp-2'}
                  >
                    „{entry.content}"
                  </p>
                  {entry.content.length > 90 && (
                    <button
                      onClick={() =>
                        setExpandedIds((prev) => {
                          const next = new Set(prev);
                          if (next.has(entry.id)) next.delete(entry.id);
                          else next.add(entry.id);
                          return next;
                        })
                      }
                      className="text-[11px] text-[var(--color-primary)]"
                    >
                      {expandedIds.has(entry.id) ? t.diary.showLess : t.diary.showMore}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {weather.length === 0 &&
            polyvagal.length === 0 &&
            tension.length === 0 &&
            diary.length === 0 &&
            mediLog.length === 0 &&
            achievements.length === 0 &&
            skillUses.length === 0 &&
            appointments.length === 0 &&
            wishes.length === 0 &&
            activities.length === 0 &&
            zugangCount === 0 &&
            letters.length === 0 &&
            garden.length === 0 && (
              <p className="text-[13px] text-[var(--color-text-faint)]">{t.diary.reviewNothingThisDay}</p>
            )}
        </Card>
      ))}
      <Link
        to="/entdecken/tageskurve/entwicklung"
        className="text-[13px] text-[var(--color-primary)] text-center underline underline-offset-2"
      >
        {t.diary.reviewSeeMore}
      </Link>
      <Link
        to="/wochenrueckblick"
        className="text-[13px] text-[var(--color-primary)] text-center underline underline-offset-2"
      >
        {t.weeklyReview.title}
      </Link>
    </div>
  );
}
