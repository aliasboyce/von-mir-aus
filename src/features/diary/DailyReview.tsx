import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { WEATHER_META, NEED_META } from '../innerWeather/weatherMeta';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { MiniCurve } from '../polyvagal/MiniCurve';
import { describeDay } from '../polyvagal/describeDay';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { TensionDayChart } from '../polyvagal/TensionDayChart';
import { describeTensionDay } from '../polyvagal/describeTensionDay';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { MediLogChart } from '../mediLog/MediLogChart';
import { effectiveDiaryCategory, DIARY_DEFAULT_CATEGORY_ID, diaryCategoriesStore } from './diaryCategories';
import { groupByDay } from '../../services/groupByDay';
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
    () => diaryEntries.filter((d) => effectiveDiaryCategory(d.categoryId) === DIARY_DEFAULT_CATEGORY_ID),
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

    const dayKeys = new Set<string>([
      ...weatherByDay.keys(), ...polyvagalByDay.keys(), ...tensionByDay.keys(),
      ...diaryByDay.keys(), ...mediLogByDay.keys(), ...achievementsByDay.keys(),
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
      }));
  }, [generalEntries, achievementEntries, showWeather, showPolyvagal, showTension, showMediLog, showAchievements]);

  if (days.length === 0) {
    return <EmptyState title={t.diary.reviewEmpty} />;
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map(({ day, weather, polyvagal, tension, diary, mediLog, achievements }) => (
        <Card key={day}>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">
            {new Date(day).toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
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

          {polyvagal.length > 0 && (
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-shrink-0 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-1.5">
                <MiniCurve points={polyvagal} width={100} height={32} />
              </div>
              <p className="text-[12px] text-[var(--color-text-muted)] flex-1">{describeDay(polyvagal, t)}</p>
            </div>
          )}

          {tension.length > 0 && (
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
                <p key={entry.id} className="text-[13px] text-[var(--color-text)] line-clamp-2">
                  „{entry.content}"
                </p>
              ))}
            </div>
          )}

          {weather.length === 0 &&
            polyvagal.length === 0 &&
            tension.length === 0 &&
            diary.length === 0 &&
            mediLog.length === 0 &&
            achievements.length === 0 && (
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
