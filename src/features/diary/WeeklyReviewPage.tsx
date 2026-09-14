import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { FileDown, Sparkles } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { activityInLastDays } from '../../services/activityLog';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { POLYVAGAL_ZONE_ORDER, POLYVAGAL_ZONE_META } from '../polyvagal/polyvagalMeta';
import { diaryRepo } from '../diary/diaryRepo';
import { diaryCategoriesStore } from '../diary/diaryCategories';
import { mediLogRepo } from '../mediLog/mediLogRepo';
import { savedMedicationsRepo, MEDICATION_COLOR_PALETTE } from '../mediLog/savedMedicationsRepo';
import { MediLogOverallChart } from '../mediLog/MediLogOverallChart';
import { WeeklyReviewPrintView } from './WeeklyReviewPrintView';
import { weeklyNarrative } from './weeklyReviewNarrative';
import { zugangRepo } from '../zugang/zugangRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { distinctCheckInDays } from '../garden/gardenGrowth';
import type { PolyvagalZone } from '../../data/types';

const PERIOD_DAYS = { week: 7, month: 30 } as const;

/**
 * Deliberately synthesizes existing data (activity log, check-ins, diary)
 * rather than introducing a new tracking system just for this view - the
 * person doesn't have to do anything differently to get a review, it's
 * built entirely from what they were already doing this week.
 *
 * Reworked per the shared brief: lead with a warm companion narrative
 * rather than a numbers dashboard, name *which* resources/bridges were
 * used instead of just counting them, include Zugang and Garten
 * (previously missing entirely), surface one "Moment der Woche" instead
 * of a flat achievement list, and close with an optional, low-pressure
 * forward-looking invitation rather than just stopping after the data.
 */
export function WeeklyReviewPage() {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [printingWeekly, setPrintingWeekly] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');
  const DAYS = PERIOD_DAYS[period];

  useEffect(() => {
    const clear = () => setPrintingWeekly(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  const stats = useMemo(() => {
    const cutoff = Date.now() - DAYS * 24 * 60 * 60 * 1000;

    const checkIns = polyvagalRepo.getAll().filter((c) => new Date(c.createdAt).getTime() >= cutoff);
    const zoneCounts: Record<PolyvagalZone, number> = { ventral: 0, sympathetic: 0, dorsal: 0 };
    checkIns.forEach((c) => {
      zoneCounts[c.zone] += 1;
    });

    const activity = activityInLastDays(DAYS);
    const resourceUses = activity.filter((a) => a.type === 'resource').length;
    const bridgeUses = activity.filter((a) => a.type === 'bridge').length;
    const helpfulYes = activity.filter((a) => a.helpfulness === 'ja').length;

    // "Which" instead of just "how many" — grouped by label so a
    // resource used three times shows once with a ×3, not three
    // separate anonymous units.
    function groupByLabel(type: 'resource' | 'bridge'): { label: string; count: number }[] {
      const counts = new Map<string, number>();
      activity
        .filter((a) => a.type === type)
        .forEach((a) => counts.set(a.label, (counts.get(a.label) ?? 0) + 1));
      return Array.from(counts.entries())
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    }
    const resourceNames = groupByLabel('resource');
    const bridgeNames = groupByLabel('bridge');

    const diaryEntries = diaryRepo.getAll().filter((e) => new Date(e.createdAt).getTime() >= cutoff);
    const achievementCategoryId = diaryCategoriesStore.getAll().find((c) => c.label === 'Erfolge')?.id;
    const achievements = achievementCategoryId
      ? diaryEntries.filter((e) => e.categoryId === achievementCategoryId)
      : [];

    // Moment der Woche — prefer a genuine achievement (already a
    // deliberately marked positive moment); otherwise fall back to the
    // most recent diary entry with real content, so there's usually
    // something warm to highlight without inventing anything.
    const momentOfWeek =
      achievements.length > 0
        ? { content: achievements[achievements.length - 1].content, isAchievement: true }
        : diaryEntries.length > 0
          ? { content: diaryEntries[diaryEntries.length - 1].content, isAchievement: false }
          : null;

    const savedMeds = savedMedicationsRepo.getAll();
    const mediLogEntries = settings.dailyReviewShowMediLog === false
      ? []
      : mediLogRepo.getAll().filter((e) => e.status !== 'skipped' && new Date(e.takenAt).getTime() >= cutoff);
    const byMedName = new Map<string, typeof mediLogEntries>();
    mediLogEntries.forEach((e) => {
      const key = e.name.trim().toLowerCase();
      if (!byMedName.has(key)) byMedName.set(key, []);
      byMedName.get(key)!.push(e);
    });
    const mediLogWeekly = Array.from(byMedName.entries()).map(([key, list], i) => ({
      key,
      displayName: list[0].name,
      color:
        savedMeds.find((sm) => sm.id === list.find((e) => e.medicationId)?.medicationId)?.color ??
        MEDICATION_COLOR_PALETTE[i % MEDICATION_COLOR_PALETTE.length],
      entries: list,
    }));

    // Zugang and Garten were entirely missing from the review before,
    // even though they're often where the more meaningful moments of a
    // week live.
    const zugangCount = zugangRepo.getAll().filter((z) => new Date(z.createdAt).getTime() >= cutoff).length;
    const gardenActive = gardenRepo.getAll().filter((g) => g.status === 'active');
    const gardenThisWeek = gardenActive
      .map((g) => {
        const daysThisWeek = [...distinctCheckInDays(g)].filter((d) => new Date(d).getTime() >= cutoff).length;
        return { name: g.name, daysThisWeek };
      })
      .filter((g) => g.daysThisWeek > 0)
      .sort((a, b) => b.daysThisWeek - a.daysThisWeek);

    const totalActivity = checkIns.length + resourceUses + bridgeUses + diaryEntries.length + mediLogEntries.length + zugangCount + gardenThisWeek.length;

    return {
      checkIns, zoneCounts, resourceUses, bridgeUses, resourceNames, bridgeNames, helpfulYes,
      diaryEntries, achievements, momentOfWeek, mediLogWeekly, zugangCount, gardenThisWeek, totalActivity,
    };
  }, [settings.dailyReviewShowMediLog, DAYS]);

  const maxZoneCount = Math.max(...POLYVAGAL_ZONE_ORDER.map((z) => stats.zoneCounts[z]), 1);
  const narrative = useMemo(
    () => weeklyNarrative(stats.zoneCounts, isEn, period === 'month' ? { de: 'diesen Monat', en: 'this month' } : undefined),
    [stats.zoneCounts, isEn, period],
  );

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar
        action={
          <div className="flex items-center gap-1">
            <HelpButton helpKey="wochenrueckblick" />
            {stats.totalActivity > 0 && (
              <button
                onClick={() => {
                  setPrintingWeekly(true);
                  setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
                }}
                aria-label={t.weeklyReview.exportPdf}
                className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
              >
                <FileDown size={17} />
              </button>
            )}
          </div>
        }
      />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{period === 'month' ? t.weeklyReview.titleMonthly : t.weeklyReview.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{period === 'month' ? t.weeklyReview.subtitleMonthly : t.weeklyReview.subtitle}</p>

        <div className="flex gap-2 mb-6 no-print">
          <button
            onClick={() => setPeriod('week')}
            className="px-4 py-2 rounded-full text-[13px]"
            style={{
              background: period === 'week' ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: period === 'week' ? 'var(--color-surface)' : 'var(--color-text-muted)',
            }}
          >
            {t.weeklyReview.periodToggleWeek}
          </button>
          <button
            onClick={() => setPeriod('month')}
            className="px-4 py-2 rounded-full text-[13px]"
            style={{
              background: period === 'month' ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: period === 'month' ? 'var(--color-surface)' : 'var(--color-text-muted)',
            }}
          >
            {t.weeklyReview.periodToggleMonth}
          </button>
        </div>

        {stats.totalActivity === 0 ? (
          <EmptyState title={t.weeklyReview.empty} />
        ) : (
          <div className="flex flex-col gap-5">
            {/* 1 — Wesen-geführte Erzählung statt Zahlen zuerst */}
            <div className="flex items-start gap-3">
              <InlineCompanionNote />
              <p className="text-[15px] text-[var(--color-text)] leading-relaxed flex-1">{narrative}</p>
            </div>

            {/* 4 — Moment der Woche, statt einer flachen Liste */}
            {stats.momentOfWeek && (
              <Card style={{ borderColor: 'var(--color-accent-clay)', borderWidth: 1 }}>
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2 flex items-center gap-1.5">
                  <Sparkles size={12} className="text-[var(--color-accent-clay)]" />
                  {t.weeklyReview.momentOfWeek}
                </p>
                <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{stats.momentOfWeek.content}</p>
              </Card>
            )}

            {/* 2 — "was" statt nur "wie viel" */}
            {(stats.resourceNames.length > 0 || stats.bridgeNames.length > 0) && (
              <Card>
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.weeklyReview.whatYouUsed}</p>
                <div className="flex flex-wrap gap-2">
                  {stats.resourceNames.map((r) => (
                    <span key={r.label} className="px-3 py-1.5 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                      {r.label}
                      {r.count > 1 && <span className="text-[var(--color-text-faint)]"> ×{r.count}</span>}
                    </span>
                  ))}
                  {stats.bridgeNames.map((b) => (
                    <span key={b.label} className="px-3 py-1.5 rounded-full text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                      🌉 {b.label}
                      {b.count > 1 && <span className="opacity-70"> ×{b.count}</span>}
                    </span>
                  ))}
                </div>
              </Card>
            )}

            {/* 3 — Zugang und Garten, vorher komplett gefehlt */}
            {(stats.zugangCount > 0 || stats.gardenThisWeek.length > 0) && (
              <Card>
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.weeklyReview.zugangGartenTitle}</p>
                <div className="flex flex-col gap-2">
                  {stats.zugangCount > 0 && (
                    <p className="text-[13px] text-[var(--color-text-muted)]">
                      {t.weeklyReview.zugangCount.replace('{count}', String(stats.zugangCount))}
                    </p>
                  )}
                  {stats.gardenThisWeek.map((g) => (
                    <p key={g.name} className="text-[13px] text-[var(--color-text-muted)]">
                      🌱 {g.name} — {t.weeklyReview.gardenDays.replace('{count}', String(g.daysThisWeek))}
                    </p>
                  ))}
                </div>
              </Card>
            )}

            {stats.checkIns.length > 0 && (
              <Card>
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">
                  {(period === 'month' ? t.weeklyReview.checkInsCountMonthly : t.weeklyReview.checkInsCount).replace('{count}', String(stats.checkIns.length))}
                </p>
                <div className="flex flex-col gap-2">
                  {POLYVAGAL_ZONE_ORDER.map((zone) => {
                    const count = stats.zoneCounts[zone];
                    if (count === 0) return null;
                    return (
                      <div key={zone} className="flex items-center gap-2">
                        <span className="text-[12px] text-[var(--color-text-muted)] w-24 flex-shrink-0 truncate">
                          {POLYVAGAL_ZONE_META[zone].label(t)}
                        </span>
                        <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-muted)] overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(count / maxZoneCount) * 100}%`, background: POLYVAGAL_ZONE_META[zone].color }}
                          />
                        </div>
                        <span className="text-[12px] text-[var(--color-text-faint)] w-5 text-right">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {stats.mediLogWeekly.length > 0 && (
              <Card>
                <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.weeklyReview.mediLogTitle}</p>
                <MediLogOverallChart medications={stats.mediLogWeekly} width={280} height={130} />
              </Card>
            )}

            {stats.helpfulYes > 0 && (
              <p className="text-[12px] text-[var(--color-text-faint)]">
                {t.weeklyReview.helpfulNote.replace('{count}', String(stats.helpfulYes))}
              </p>
            )}

            {/* 5 — sanfter, freiwilliger Ausblick statt einfach aufzuhören */}
            <Card className="no-print">
              <div className="flex items-start gap-3">
                <InlineCompanionNote />
                <div className="flex-1">
                  <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-3">{t.weeklyReview.lookAheadPrompt}</p>
                  <div className="flex gap-2 flex-wrap">
                    <Link to="/zugang">
                      <Button size="sm" variant="secondary">
                        {t.zugang.title}
                      </Button>
                    </Link>
                    <Link to="/entdecken/garten">
                      <Button size="sm" variant="secondary">
                        {t.garden.title}
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
      </div>

      {printingWeekly && (
        <WeeklyReviewPrintView
          t={t}
          zoneCounts={stats.zoneCounts}
          checkInsCount={stats.checkIns.length}
          resourceUses={stats.resourceUses}
          bridgeUses={stats.bridgeUses}
          helpfulYes={stats.helpfulYes}
          diaryEntries={stats.diaryEntries}
          achievements={stats.achievements}
          mediLogWeekly={stats.mediLogWeekly}
          labels={{
            title: period === 'month' ? t.weeklyReview.titleMonthly : t.weeklyReview.title,
            subtitle: period === 'month' ? t.weeklyReview.subtitleMonthly : t.weeklyReview.subtitle,
            exportedOn: t.network.exportedOn,
          }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
        />
      )}
    </div>
  );
}
