import { useMemo, useState } from 'react';
import { Maximize2, X, Printer } from 'lucide-react';
import { createPortal } from 'react-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { triggerPrint } from '../../services/printSupport';
import { polyvagalRepo, checkInsInLastDays } from './polyvagalRepo';
import { POLYVAGAL_ZONE_META, POLYVAGAL_ZONE_ORDER } from './polyvagalMeta';
import { getDailyNote, saveDailyNote } from './dailyNotesRepo';
import { describeDay } from './describeDay';
import { MiniCurve } from './MiniCurve';
import { PolyvagalDayChart } from './PolyvagalDayChart';
import { ChartPrintView } from './ChartPrintView';
import { DailyReviewsPrintView } from './DailyReviewsPrintView';
import { exportCurvePdf } from '../reviews/curvePdf';
import { bandForValueCalibrated, FALLBACK_TENSION_BY_ZONE } from './arousalBands';
import type { PolyvagalCheckIn } from '../../data/types';

import { groupByDay } from '../../services/groupByDay';

/**
 * "Nicht wie oft man in einer Zone war, sondern wie oft man zurueck-
 * geschwungen ist"-Auftrag — replaces mostFrequentZone(). Dwelling in
 * any one zone more than another was never the meaningful number here
 * (a zone isn't good or bad); the skill that actually grows over time
 * is finding the way back. Counts every transition from a dysregulated
 * reading (outside the person's own calibrated window) to a regulated
 * one, chronologically across the given entries — not a tally of
 * which zone occurred most.
 */
function countRegulationReturns(entries: PolyvagalCheckIn[], boundaries?: [number, number, number, number, number]) {
  const sorted = [...entries].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  let returns = 0;
  let sawDysregulated = false;
  let everDysregulated = false;
  for (const e of sorted) {
    const raw = e.tensionValue ?? FALLBACK_TENSION_BY_ZONE[e.zone];
    const inWindow = bandForValueCalibrated(raw, boundaries).inWindow;
    if (!inWindow) {
      sawDysregulated = true;
      everDysregulated = true;
    } else if (sawDysregulated) {
      returns += 1;
      sawDysregulated = false;
    }
  }
  return { returns, everDysregulated };
}

export function MeineEntwicklungPage() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [all] = useState<PolyvagalCheckIn[]>(() => polyvagalRepo.getAll());
  const [notesVersion, setNotesVersion] = useState(0);
  // "Alles auf die eine Seite 'Meine Entwicklung', nach Tag/Woche/
  // Monat, alles mit PDF"-Auftrag — the chart + its period tabs,
  // exactly the same PolyvagalDayChart/ChartPrintView already proven
  // on /entdecken/tageskurve, embedded here too so this page becomes
  // the one place for both the curve and the day-by-day written
  // review, instead of the two staying on separate pages.
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [fullscreen, setFullscreen] = useState(false);
  const chartCheckIns = chartPeriod === 'day' ? checkInsInLastDays(1) : chartPeriod === 'week' ? checkInsInLastDays(7) : checkInsInLastDays(30);

  const grouped = useMemo(() => groupByDay(all, (e) => e.createdAt), [all]);
  const sortedDays = useMemo(() => [...grouped.keys()].sort().reverse(), [grouped]);

  const last7Days = sortedDays.slice(0, 7).flatMap((d) => grouped.get(d) ?? []);
  const { returns: regulationReturns, everDysregulated } = useMemo(
    () => countRegulationReturns(last7Days, settings.arousalZoneBoundaries),
    [last7Days, settings.arousalZoneBoundaries]
  );

  function updateNote(dateKey: string, value: string) {
    saveDailyNote(dateKey, value);
    setNotesVersion((v) => v + 1);
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="meineEntwicklung" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.polyvagal.developmentTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{t.polyvagal.developmentSubtitle}</p>

        <div className="flex items-center gap-2 mb-3">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setChartPeriod(p)}
              className="px-3 py-1.5 rounded-full text-[13px]"
              style={{
                background: chartPeriod === p ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                color: chartPeriod === p ? 'var(--color-surface)' : 'var(--color-text-muted)',
              }}
            >
              {p === 'day' ? t.polyvagal.periodDay : p === 'week' ? t.polyvagal.periodWeek : t.polyvagal.periodMonth}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setFullscreen(true)}
            aria-label={t.polyvagal.expandChart}
            className="w-9 h-9 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center flex-shrink-0"
          >
            <Maximize2 size={15} />
          </button>
          <button
            onClick={() => void exportCurvePdf(chartPeriod, t, locale)}
            aria-label={t.polyvagal.printChartCta}
            className="w-9 h-9 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center flex-shrink-0"
          >
            <Printer size={15} />
          </button>
        </div>
        <Card className="mb-6" padding="md">
          <PolyvagalDayChart checkIns={chartCheckIns} period={chartPeriod} />
        </Card>

        {fullscreen &&
          createPortal(
            <div className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col animate-in" role="dialog" aria-modal="true">
              <div className="flex items-center justify-between p-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
                <button
                  onClick={() => setFullscreen(false)}
                  aria-label={t.common.close}
                  className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
                >
                  <X size={20} />
                </button>
                <p className="text-[14px] text-[var(--color-text-muted)]">
                  {chartPeriod === 'week' ? t.polyvagal.weekChart : chartPeriod === 'month' ? t.polyvagal.monthChart : t.polyvagal.todayChart}
                </p>
                <button
                  onClick={() => void exportCurvePdf(chartPeriod, t, locale)}
                  aria-label={t.polyvagal.printChartCta}
                  className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
                >
                  <Printer size={18} />
                </button>
              </div>
              <div className="flex-1 flex items-center justify-center px-4">
                <PolyvagalDayChart checkIns={chartCheckIns} expanded period={chartPeriod} />
              </div>
            </div>,
            document.body,
          )}

        <ChartPrintView
          checkIns={chartCheckIns}
          boundaries={settings.arousalZoneBoundaries}
          periodLabel={chartPeriod === 'week' ? t.polyvagal.weekChart : chartPeriod === 'month' ? t.polyvagal.monthChart : t.polyvagal.todayChart}
          formatDateTime={(iso) => new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        />

        {last7Days.length > 0 && (
          <Card className="mb-6 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: everDysregulated ? (regulationReturns > 0 ? '#4a8f6e' : '#c98a3f') : '#4a8f6e' }} />
            <p className="text-[13px] text-[var(--color-text)]">
              {!everDysregulated
                ? t.polyvagal.patternSteady
                : regulationReturns > 0
                  ? t.polyvagal.patternReturns.replace('{n}', String(regulationReturns))
                  : t.polyvagal.patternNoReturnsYet}
            </p>
          </Card>
        )}

        {sortedDays.length === 0 ? (
          <EmptyState title={t.polyvagal.developmentEmpty} />
        ) : (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.polyvagal.dailyReviewsTitle}</p>
              <button
                onClick={() => window.setTimeout(() => triggerPrint(t.common.printStandaloneExplanation, 'daily-reviews'), 50)}
                aria-label={t.polyvagal.printDailyReviewsCta}
                className="w-8 h-8 rounded-full bg-[var(--color-surface-muted)] flex items-center justify-center flex-shrink-0"
              >
                <Printer size={14} />
              </button>
            </div>
            <div className="flex flex-col gap-4">
            {sortedDays.map((day) => {
              const entries = (grouped.get(day) ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
              const counts = POLYVAGAL_ZONE_ORDER.map((zone) => ({
                zone,
                count: entries.filter((e) => e.zone === zone).length,
              }));
              const dateLabel = new Date(day).toLocaleDateString(locale, {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
              });

              return (
                <Card key={`${day}-${notesVersion}`}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[14px] text-[var(--color-text)]">{dateLabel}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {entries.length} {t.polyvagal.entriesSuffix}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="flex-shrink-0 bg-[var(--color-surface-muted)] rounded-[var(--radius-md)] p-1.5">
                      <MiniCurve points={entries} width={110} height={36} />
                    </div>
                    <div className="flex flex-col gap-1">
                      {counts
                        .filter((c) => c.count > 0)
                        .map(({ zone, count }) => (
                          <div key={zone} className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: POLYVAGAL_ZONE_META[zone].color }} />
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {POLYVAGAL_ZONE_META[zone].label(t)} × {count}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">
                    {describeDay(entries, t)}
                  </p>
                  <textarea
                    className="input"
                    rows={2}
                    placeholder={t.polyvagal.notePlaceholder}
                    defaultValue={getDailyNote(day)}
                    onBlur={(e) => updateNote(day, e.target.value)}
                  />
                </Card>
              );
            })}
            </div>
          </>
        )}

        <DailyReviewsPrintView
          sortedDays={sortedDays}
          grouped={grouped}
          locale={locale}
          notesVersion={notesVersion}
        />
      </div>
    </div>
  );
}
