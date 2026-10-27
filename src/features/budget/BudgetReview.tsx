import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FileDown } from 'lucide-react';
import { ACCENT, addDays, addMonths, todayStr, weekStart, ymOf } from './budgetModel';
import { buildReview, reviewSentence, type Bucket, type ReviewKind } from './budgetReview';
import { Bar, SubPage, card, ghostBtn, pill, primaryBtn, useBudget, useToast } from './budgetUi';
import { buildFinancePdf } from './budgetPdf';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';

const COL = '#3f8f9b';

export function BarsChart({ buckets, showFree, L }: { buckets: Bucket[]; showFree?: boolean; L: (de: string, en: string) => string }) {
  const W = 330, H = 170, padB = 26, padT = 10, padX = 8;
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.in, b.out, showFree ? Math.abs(b.free) : 0)));
  const min = showFree ? Math.min(0, ...buckets.map((b) => b.free)) : 0;
  const range = max - min || 1;
  const y = (v: number) => padT + (1 - (v - min) / range) * (H - padT - padB);
  const slot = (W - padX * 2) / buckets.length;
  const bw = Math.min(22, slot / 2.6);
  const pts = buckets.map((b, i) => `${padX + slot * i + slot / 2},${y(b.free)}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={L('Diagramm: Einnahmen und Ausgaben', 'Chart: income and spending')} data-testid="budget-chart">
      <line x1={padX} x2={W - padX} y1={y(0)} y2={y(0)} stroke="#00000022" />
      {buckets.map((b, i) => {
        const cx = padX + slot * i + slot / 2;
        return (
          <g key={b.key}>
            <rect x={cx - bw - 1} y={y(b.in)} width={bw} height={Math.max(1, y(0) - y(b.in))} rx="4" fill={ACCENT.in} />
            <rect x={cx + 1} y={y(b.out)} width={bw} height={Math.max(1, y(0) - y(b.out))} rx="4" fill={ACCENT.out} />
            <text x={cx} y={H - 8} textAnchor="middle" fontSize="10.5" fill="currentColor" opacity="0.7">{b.label}</text>
          </g>
        );
      })}
      {showFree && buckets.length > 1 && (
        <>
          <polyline points={pts} fill="none" stroke={ACCENT.free} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
          {buckets.map((b, i) => <circle key={b.key} cx={padX + slot * i + slot / 2} cy={y(b.free)} r="3.6" fill={ACCENT.free} stroke="#fff" strokeWidth="1.2" />)}
        </>
      )}
    </svg>
  );
}

/** Finanz-Rückblicke: Woche, Monat, Monate – getrennt vom allgemeinen Rückblick */
export function BudgetReview() {
  const { data, L, lang, m } = useBudget();
  const [toast, say] = useToast();
  const [kind, setKind] = useState<ReviewKind>('month');
  const [anchor, setAnchor] = useState(todayStr());
  const [n, setN] = useState(6);
  const [busy, setBusy] = useState(false);
  const rv = useMemo(() => buildReview(data, kind, kind === 'months' ? ymOf(anchor) : anchor, lang, L, n), [data, kind, anchor, lang, n]); // eslint-disable-line react-hooks/exhaustive-deps
  const step = (d: number) => setAnchor((a) => (kind === 'week' ? addDays(a, 7 * d) : kind === 'month' ? `${addMonths(ymOf(a), d)}-01` : `${addMonths(ymOf(a), d * n)}-01`));
  const s = rv.summary;
  const maxCat = Math.max(1, ...rv.cats.map((c) => c.spent));
  const total = Math.max(1, s.had, s.paid + s.open);
  const pdf = async () => {
    setBusy(true);
    try {
      const bytes = await buildFinancePdf(data, rv, lang, m);
      const r = await deliverPdf(bytes, safeFilename(`${L('Finanzrueckblick', 'finance-review')}-${rv.title}`, 'finanzen'), `${L('Finanz-Rückblick', 'Finance review')} ${rv.title}`);
      if (r === 'failed') say(L('Das PDF ging nicht. Versuch es noch einmal.', 'The PDF did not work. Please try again.'));
    } catch { say(L('Das PDF ging nicht. Versuch es noch einmal.', 'The PDF did not work. Please try again.')); }
    setBusy(false);
  };
  const tabs: { v: ReviewKind; de: string; en: string }[] = [{ v: 'week', de: 'Woche', en: 'Week' }, { v: 'month', de: 'Monat', en: 'Month' }, { v: 'months', de: 'Monate', en: 'Months' }];
  return (
    <SubPage title={L('Rückblicke', 'Reviews')} emoji="📊" color={COL} hint={L('Nur ums Geld – getrennt vom allgemeinen Rückblick. Zum Anschauen und als PDF.', 'Money only – separate from the general review. To look at and as a PDF.')}>
      <div className="flex gap-2" role="tablist" aria-label={L('Zeitraum', 'Period')}>
        {tabs.map((t) => <button key={t.v} type="button" role="tab" aria-selected={kind === t.v} onClick={() => { setKind(t.v); setAnchor(todayStr()); }} className={`${pill(kind === t.v)} flex-1 h-11`} style={kind === t.v ? { background: COL } : undefined} data-testid={`budget-rv-${t.v}`}>{L(t.de, t.en)}</button>)}
      </div>
      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => step(-1)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)]" aria-label={L('Davor', 'Earlier')} data-testid="budget-rv-prev"><ChevronLeft size={20} /></button>
        <p className="text-[16px] font-[var(--font-display)] text-center capitalize" data-testid="budget-rv-title">{rv.title}</p>
        <button type="button" onClick={() => step(1)} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)]" aria-label={L('Danach', 'Later')} data-testid="budget-rv-next"><ChevronRight size={20} /></button>
      </div>
      {kind === 'months' && (
        <div className="flex gap-1.5 justify-center">
          {[3, 6, 12].map((k) => <button key={k} type="button" onClick={() => setN(k)} className={pill(n === k)} style={n === k ? { background: COL } : undefined} data-testid={`budget-rv-n-${k}`}>{L(`${k} Monate`, `${k} months`)}</button>)}
        </div>
      )}

      <section className={`${card} px-4 py-4`} data-testid="budget-rv-summary">
        <p className="text-[14px] text-[var(--color-text-muted)]">{reviewSentence(rv, m, L)}</p>
        <div className="flex h-4 rounded-full overflow-hidden my-3 bg-[var(--color-surface-muted)]">
          <div style={{ width: `${(s.paid / total) * 100}%`, background: ACCENT.out }} />
          <div style={{ width: `${(s.open / total) * 100}%`, background: ACCENT.open }} />
          <div style={{ width: `${(Math.max(0, s.free) / total) * 100}%`, background: ACCENT.free }} />
        </div>
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-[13px]">
          <div><dt className="text-[var(--color-text-muted)] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.in }} />{L('Hatte', 'Had')}</dt><dd className="text-[17px]" data-testid="budget-rv-had">{m(s.had)}</dd></div>
          <div><dt className="text-[var(--color-text-muted)] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.out }} />{L('Ausgegeben', 'Spent')}</dt><dd className="text-[17px]" data-testid="budget-rv-out">{m(s.paid + s.open)}</dd></div>
          <div><dt className="text-[var(--color-text-muted)] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.free }} />{s.free >= 0 ? L('Übrig', 'Left') : L('Es fehlten', 'Short by')}</dt><dd className="text-[17px]" data-testid="budget-rv-free">{m(Math.abs(s.free))}</dd></div>
          <div><dt className="text-[var(--color-text-muted)] flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.save }} />{L('Gespart', 'Saved')}</dt><dd className="text-[17px]" data-testid="budget-rv-saved">{m(rv.saved)}</dd></div>
        </dl>
        {rv.prev && <p className="text-[12px] text-[var(--color-text-faint)] mt-2">{L(`Zeitraum davor: übrig ${m(rv.prev.free)}`, `Period before: left ${m(rv.prev.free)}`)}</p>}
      </section>

      <section className={`${card} px-3 py-3`} aria-label={L('Verlauf', 'Course')}>
        <h2 className="text-[15px] mb-1 px-1">{kind === 'week' ? L('Tag für Tag', 'Day by day') : kind === 'month' ? L('Woche für Woche', 'Week by week') : L('Monat für Monat', 'Month by month')}</h2>
        <BarsChart buckets={rv.buckets} showFree={kind === 'months'} L={L} />
        <div className="flex gap-4 text-[12px] text-[var(--color-text-muted)] px-1 flex-wrap">
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: ACCENT.in }} />{L('Einnahmen', 'Income')}</span>
          <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ background: ACCENT.out }} />{L('Ausgaben', 'Spending')}</span>
          {kind === 'months' && <span className="inline-flex items-center gap-1"><span className="w-3 h-1 rounded" style={{ background: ACCENT.free }} />{L('Übrig', 'Left')}</span>}
        </div>
        {kind === 'months' && (
          <table className="w-full text-[12.5px] mt-3" data-testid="budget-rv-table">
            <thead><tr className="text-left text-[var(--color-text-faint)]"><th className="font-normal py-1">{L('Monat', 'Month')}</th><th className="font-normal text-right">{L('Hatte', 'Had')}</th><th className="font-normal text-right">{L('Aus', 'Out')}</th><th className="font-normal text-right">{L('Übrig', 'Left')}</th></tr></thead>
            <tbody>{rv.buckets.map((b) => <tr key={b.key} className="border-t border-[var(--color-border)]"><td className="py-1.5 capitalize">{b.label}</td><td className="text-right">{m(b.in, { round: true })}</td><td className="text-right">{m(b.out, { round: true })}</td><td className="text-right" style={{ color: b.free >= 0 ? ACCENT.free : '#c07a10' }}>{m(b.free, { round: true })}</td></tr>)}</tbody>
          </table>
        )}
      </section>

      {rv.cats.length > 0 && (
        <section className={`${card} px-4 py-3`} aria-label={L('Wofür', 'What for')} data-testid="budget-rv-cats">
          <h2 className="text-[15px] mb-2">{L('Wofür ging Geld raus?', 'What did money go to?')}</h2>
          <ul className="flex flex-col gap-2.5">{rv.cats.map((c) => (
            <li key={c.id}><div className="flex justify-between text-[13.5px] mb-1"><span>{c.emoji} {c.label}</span><span>{m(c.spent)}</span></div><Bar value={c.spent} max={maxCat} color={c.color} h={9} /></li>
          ))}</ul>
        </section>
      )}

      <section className={`${card} px-4 py-3 text-[13.5px]`} aria-label={L('Fest und Rechnungen', 'Fixed and bills')}>
        <h2 className="text-[15px] mb-2">{L('Feste Kosten & Rechnungen', 'Fixed costs & bills')}</h2>
        <p className="flex justify-between"><span className="text-[var(--color-text-muted)]">{L('bezahlt', 'paid')}</span><span>{m(rv.fixedPaid)}</span></p>
        <p className="flex justify-between"><span className="text-[var(--color-text-muted)]">{L('noch offen', 'still open')}</span><span>{m(rv.fixedOpen)}</span></p>
        <p className="flex justify-between"><span className="text-[var(--color-text-muted)]">{L('Rechnungen in diesem Zeitraum', 'Bills in this period')}</span><span>{rv.bills.count} · {m(rv.bills.sum)}</span></p>
      </section>

      {rv.top.length > 0 && (
        <section className={`${card} px-4 py-3`} aria-label={L('Größte Posten', 'Biggest items')}>
          <h2 className="text-[15px] mb-2">{L('Die größten Posten', 'The biggest items')}</h2>
          <ul className="flex flex-col gap-1.5 text-[13.5px]">{rv.top.map((f) => <li key={f.id} className="flex justify-between gap-2"><span className="truncate">{f.emoji} {f.label}</span><span className="shrink-0">{m(f.amount)}</span></li>)}</ul>
        </section>
      )}

      <button type="button" onClick={() => void pdf()} disabled={busy} className={`${primaryBtn} w-full`} style={{ background: COL }} data-testid="budget-rv-pdf"><FileDown size={17} />{busy ? L('Einen Moment …', 'One moment …') : L('Als PDF teilen', 'Share as PDF')}</button>
      <button type="button" onClick={() => { setAnchor(todayStr()); setKind('month'); }} className={ghostBtn} data-testid="budget-rv-today">{L('Zurück zu diesem Monat', 'Back to this month')}</button>
      {toast}
    </SubPage>
  );
}

export { weekStart };
