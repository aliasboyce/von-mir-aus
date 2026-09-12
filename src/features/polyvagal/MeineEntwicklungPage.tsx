import { useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { polyvagalRepo } from './polyvagalRepo';
import { POLYVAGAL_ZONE_META, POLYVAGAL_ZONE_ORDER } from './polyvagalMeta';
import { getDailyNote, saveDailyNote } from './dailyNotesRepo';
import { describeDay } from './describeDay';
import { MiniCurve } from './MiniCurve';
import type { PolyvagalCheckIn, PolyvagalZone } from '../../data/types';

import { groupByDay } from '../../services/groupByDay';

function mostFrequentZone(entries: PolyvagalCheckIn[]): PolyvagalZone | null {
  if (entries.length === 0) return null;
  const counts: Record<string, number> = {};
  entries.forEach((e) => {
    counts[e.zone] = (counts[e.zone] ?? 0) + 1;
  });
  return (Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0] as PolyvagalZone) ?? null;
}

export function MeineEntwicklungPage() {
  const t = useT();
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [all] = useState<PolyvagalCheckIn[]>(() => polyvagalRepo.getAll());
  const [notesVersion, setNotesVersion] = useState(0);

  const grouped = useMemo(() => groupByDay(all, (e) => e.createdAt), [all]);
  const sortedDays = useMemo(() => [...grouped.keys()].sort().reverse(), [grouped]);

  const last7Days = sortedDays.slice(0, 7).flatMap((d) => grouped.get(d) ?? []);
  const patternZone = mostFrequentZone(last7Days);

  function updateNote(dateKey: string, value: string) {
    saveDailyNote(dateKey, value);
    setNotesVersion((v) => v + 1);
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="meineEntwicklung" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.polyvagal.developmentTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.polyvagal.developmentSubtitle}</p>

        {patternZone && (
          <Card className="mb-6 flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ background: POLYVAGAL_ZONE_META[patternZone].color }}
            />
            <p className="text-[13px] text-[var(--color-text)]">
              {t.polyvagal.patternPrefix} <strong>{POLYVAGAL_ZONE_META[patternZone].label(t)}</strong>.
            </p>
          </Card>
        )}

        {sortedDays.length === 0 ? (
          <EmptyState title={t.polyvagal.developmentEmpty} />
        ) : (
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
        )}
      </div>
    </div>
  );
}
