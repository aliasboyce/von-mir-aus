import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { computeInsights, insightsEmpty, type ReviewInsights as Insights, type TopItem } from './insights';

const TXT = {
  de: {
    title: 'Verlauf & Auffälligkeiten',
    sub: 'Wird automatisch aus dem berechnet, was du ohnehin getan hast.',
    tab: (n: number) => `${n} Tage`,
    curve: 'Dein Verlauf',
    curveNote: 'Jeder Strich ist ein Tag (Durchschnitt deiner Check-ins). Leere Tage sind einfach leer.',
    summary: (c: number, d: number, days: number) => `${c} Check-ins an ${d} von ${days} Tagen`,
    calm: 'Ruhigster Tag',
    stress: 'Anstrengendster Tag',
    calmLine: (n: number, w: number) => `${n} Check-in${n === 1 ? '' : 's'}, ${w} davon in deinem Wohlfühlbereich`,
    stressLine: (n: number) => `${n} Check-in${n === 1 ? '' : 's'} – ein schwerer Tag. Du hast ihn trotzdem durchgetragen.`,
    hard: 'Schwierige Momente',
    hardNone: 'In dieser Zeit gab es keine besonders schweren Momente, die du festgehalten hast.',
    hardBack: (m: string) => `danach nach ${m} wieder im Wohlfühlbereich`,
    hardHelped: (s: string) => `geholfen hat: ${s}`,
    hardOpen: 'danach kein Check-in mehr – das ist okay',
    topTitle: 'Am häufigsten genutzt',
    skills: 'Skills',
    helpers: 'Hilfsmittel & Brücken',
    routines: 'Routinen',
    activities: 'Kontakt & Erdung',
    helpedN: (n: number) => `${n}× hat geholfen`,
    none: 'In diesem Zeitraum noch nichts.',
    empty: 'In diesem Zeitraum gibt es noch nichts zu berechnen. Sobald du einchecken oder etwas nutzen magst, taucht es hier auf.',
    minutes: (m: number) => (m < 60 ? `${m} Min.` : m < 1440 ? `${Math.round(m / 60)} Std.` : `${Math.round(m / 1440)} Tg.`),
  },
  en: {
    title: 'Trend & highlights',
    sub: 'Calculated automatically from what you already did.',
    tab: (n: number) => `${n} days`,
    curve: 'Your trend',
    curveNote: 'Each line is one day (average of your check-ins). Empty days are simply empty.',
    summary: (c: number, d: number, days: number) => `${c} check-ins on ${d} of ${days} days`,
    calm: 'Calmest day',
    stress: 'Most strenuous day',
    calmLine: (n: number, w: number) => `${n} check-in${n === 1 ? '' : 's'}, ${w} of them in your comfort range`,
    stressLine: (n: number) => `${n} check-in${n === 1 ? '' : 's'} – a hard day. You carried it anyway.`,
    hard: 'Difficult moments',
    hardNone: 'No especially hard moments were recorded in this period.',
    hardBack: (m: string) => `back in your comfort range after ${m}`,
    hardHelped: (s: string) => `what helped: ${s}`,
    hardOpen: 'no check-in afterwards – that is okay',
    topTitle: 'Used most',
    skills: 'Skills',
    helpers: 'Tools & bridges',
    routines: 'Routines',
    activities: 'Contact & grounding',
    helpedN: (n: number) => `helped ${n}×`,
    none: 'Nothing in this period yet.',
    empty: 'Nothing to calculate in this period yet. As soon as you check in or use something, it shows up here.',
    minutes: (m: number) => (m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`),
  },
};

export function insightLines(i: Insights, lang: 'de' | 'en', locale: string): string[] {
  const x = TXT[lang];
  const fmt = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: 'short', day: '2-digit', month: '2-digit' });
  const out: string[] = [];
  if (i.calmDay) out.push(`${x.calm}: ${fmt(i.calmDay.day)} (${x.calmLine(i.calmDay.count, i.calmDay.inWindowCount)})`);
  if (i.stressDay) out.push(`${x.stress}: ${fmt(i.stressDay.day)} (${x.stressLine(i.stressDay.count)})`);
  const join = (l: TopItem[]) => l.map((e) => `${e.label} ×${e.count}`).join(', ');
  if (i.topSkills.length) out.push(`${x.skills}: ${join(i.topSkills)}`);
  if (i.topHelpers.length) out.push(`${x.helpers}: ${join(i.topHelpers)}`);
  if (i.topRoutines.length) out.push(`${x.routines}: ${join(i.topRoutines)}`);
  if (i.topActivities.length) out.push(`${x.activities}: ${join(i.topActivities)}`);
  return out;
}

function CurveStrip({ data, label }: { data: Insights; label: string }) {
  const n = data.curve.length;
  const W = 300;
  const H = 54;
  const gap = n > 40 ? 0.6 : 1.6;
  const bw = (W - gap * (n - 1)) / n;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={label} style={{ height: 54 }}>
      <line x1="0" x2={W} y1={H - 0.5} y2={H - 0.5} stroke="var(--color-border)" strokeWidth="1" />
      {data.curve.map((c, idx) => {
        const x = idx * (bw + gap);
        if (c.avg == null) return <circle key={c.day} cx={x + bw / 2} cy={H - 3} r={Math.min(1.2, bw / 2)} fill="var(--color-border)" />;
        const h = Math.max(4, (Math.max(0, Math.min(100, c.avg)) / 100) * (H - 4));
        return <rect key={c.day} x={x} y={H - h} width={bw} height={h} rx={Math.min(2, bw / 2)} fill={c.color} opacity={0.9} />;
      })}
    </svg>
  );
}

function TopList({ title, items, x }: { title: string; items: TopItem[]; x: (typeof TXT)['de'] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{title}</p>
      <div className="flex flex-col gap-1">
        {items.map((e, idx) => (
          <p key={e.label} className="text-[13px] text-[var(--color-text)] flex items-baseline gap-2">
            <span className="text-[var(--color-text-faint)] w-4 flex-shrink-0 tabular-nums">{idx + 1}</span>
            <span className="flex-1 min-w-0 truncate">{e.label}</span>
            <span className="text-[12px] text-[var(--color-text-muted)] flex-shrink-0">
              ×{e.count}
              {e.helped > 0 ? ` · ${x.helpedN(e.helped)}` : ''}
            </span>
          </p>
        ))}
      </div>
    </div>
  );
}

/** One calm block for every review page: 7 / 30 / 90 days, all derived. */
export function ReviewInsightsBlock({ initialDays = 7 }: { initialDays?: 7 | 30 | 90 }) {
  const { settings } = useSettings();
  const t = useT();
  void t;
  const lang = settings.language === 'en' ? 'en' : 'de';
  const x = TXT[lang];
  const locale = lang === 'en' ? 'en-US' : 'de-DE';
  const [days, setDays] = useState<7 | 30 | 90>(initialDays);
  const data = useMemo(() => computeInsights(days), [days]);
  const fmtDay = (d: string) => new Date(`${d}T12:00:00`).toLocaleDateString(locale, { weekday: 'long', day: '2-digit', month: '2-digit' });
  const fmtTime = (iso: string) => new Date(iso).toLocaleString(locale, { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

  return (
    <Card data-testid="review-insights" data-print-block="insights">
      <div className="flex items-start justify-between gap-3 mb-1">
        <p className="text-[14px] font-medium text-[var(--color-text)]">{x.title}</p>
      </div>
      <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{x.sub}</p>
      <div className="flex gap-2 mb-4 no-print" role="tablist">
        {([7, 30, 90] as const).map((n) => (
          <button
            key={n}
            role="tab"
            aria-selected={days === n}
            data-testid={`insights-tab-${n}`}
            onClick={() => setDays(n)}
            className="px-3.5 py-1.5 rounded-full text-[13px]"
            style={{
              background: days === n ? 'var(--color-primary)' : 'var(--color-surface-muted)',
              color: days === n ? 'var(--color-surface)' : 'var(--color-text-muted)',
            }}
          >
            {x.tab(n)}
          </button>
        ))}
      </div>

      {insightsEmpty(data) ? (
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed" data-testid="insights-empty">{x.empty}</p>
      ) : (
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{x.curve}</p>
            <CurveStrip data={data} label={`${x.curve}: ${x.summary(data.checkInCount, data.activeDays, days)}`} />
            <div className="flex justify-between text-[11px] text-[var(--color-text-faint)] mt-1">
              <span>{new Date(`${data.from}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}</span>
              <span>{new Date(`${data.to}T12:00:00`).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })}</span>
            </div>
            <p className="text-[12.5px] text-[var(--color-text-muted)] mt-1.5">{x.summary(data.checkInCount, data.activeDays, days)}</p>
            <p className="text-[11.5px] text-[var(--color-text-faint)] mt-0.5">{x.curveNote}</p>
          </div>

          {(data.calmDay || data.stressDay) && (
            <div className="flex flex-col gap-2.5">
              {data.calmDay && (
                <div className="rounded-[var(--radius-md)] p-3" style={{ background: 'var(--color-primary-soft)' }} data-testid="insights-calm">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">🌿 {x.calm}</p>
                  <p className="text-[13.5px] text-[var(--color-text)]">{fmtDay(data.calmDay.day)}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{x.calmLine(data.calmDay.count, data.calmDay.inWindowCount)}</p>
                </div>
              )}
              {data.stressDay && (
                <div className="rounded-[var(--radius-md)] p-3" style={{ background: 'var(--color-surface-muted)' }} data-testid="insights-stress">
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">🌧️ {x.stress}</p>
                  <p className="text-[13.5px] text-[var(--color-text)]">{fmtDay(data.stressDay.day)}</p>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-0.5">{x.stressLine(data.stressDay.count)}</p>
                </div>
              )}
            </div>
          )}

          <div data-testid="insights-hard">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-1.5">{x.hard}</p>
            {data.hardMoments.length === 0 ? (
              <p className="text-[13px] text-[var(--color-text-muted)]">{x.hardNone}</p>
            ) : (
              <div className="flex flex-col gap-2">
                {data.hardMoments.map((h) => (
                  <div key={h.at} className="text-[13px] text-[var(--color-text)]">
                    <p>{fmtTime(h.at)} · {Math.round(h.value)} %</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      {h.backAfterMin != null ? x.hardBack(x.minutes(h.backAfterMin)) : x.hardOpen}
                      {h.helpedBy ? ` · ${x.hardHelped(h.helpedBy)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {(data.topSkills.length > 0 || data.topHelpers.length > 0 || data.topRoutines.length > 0 || data.topActivities.length > 0) && (
            <div className="flex flex-col gap-3.5" data-testid="insights-top">
              <p className="text-[12px] font-medium text-[var(--color-text-muted)] -mb-1.5">{x.topTitle}</p>
              <TopList title={x.skills} items={data.topSkills} x={x} />
              <TopList title={x.helpers} items={data.topHelpers} x={x} />
              <TopList title={x.routines} items={data.topRoutines} x={x} />
              <TopList title={x.activities} items={data.topActivities} x={x} />
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
