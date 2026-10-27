import { addDays, addMonths, daysIn, monthName, monthRange, pad2, parseYm, weekStart, ymOf, type Lfn } from './budgetModel';
import { catSpend, flowsBetween, summarize, type BudgetData, type Flow, type Summary } from './budgetCalc';

export type ReviewKind = 'week' | 'month' | 'months';

export interface Bucket { key: string; label: string; in: number; out: number; free: number }
export interface CatRow { id: string; label: string; emoji: string; color: string; spent: number }
export interface Review {
  kind: ReviewKind;
  from: string;
  to: string;
  title: string;
  summary: Summary;
  buckets: Bucket[];
  cats: CatRow[];
  top: Flow[];
  /** nur bei „Monate“: Vergleich zum Zeitraum davor */
  prev?: Summary;
  fixedPaid: number;
  fixedOpen: number;
  bills: { count: number; sum: number; open: number };
  saved: number;
}

const bucketOf = (data: BudgetData, from: string, to: string, key: string, label: string): Bucket => {
  const s = summarize(flowsBetween(data, from, to));
  return { key, label, in: s.had, out: s.paid + s.open, free: s.free };
};

/** anchor: ein Tag (Woche, Monat) bzw. ein Monat 'YYYY-MM' (Monate = die n Monate bis einschließlich anchor) */
export function buildReview(data: BudgetData, kind: ReviewKind, anchor: string, lang: 'de' | 'en', L: Lfn, n = 6): Review {
  let from: string, to: string, title: string;
  const buckets: Bucket[] = [];
  if (kind === 'week') {
    from = weekStart(anchor);
    to = addDays(from, 6);
    const fmt = (d: string) => new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short' }).format(new Date(`${d}T12:00:00`));
    title = `${fmt(from)} – ${fmt(to)}`;
    for (let i = 0; i < 7; i++) {
      const d = addDays(from, i);
      const wd = new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'short' }).format(new Date(`${d}T12:00:00`));
      buckets.push(bucketOf(data, d, d, d, wd));
    }
  } else if (kind === 'month') {
    const ym = ymOf(anchor);
    [from, to] = monthRange(ym);
    title = monthName(ym, lang);
    const { y, m } = parseYm(ym);
    const last = daysIn(y, m);
    for (let a = 1, i = 1; a <= last; a += 7, i++) {
      const b = Math.min(last, a + 6);
      buckets.push(bucketOf(data, `${ym}-${pad2(a)}`, `${ym}-${pad2(b)}`, `${ym}-w${i}`, L(`${a}.–${b}.`, `${a}–${b}`)));
    }
  } else {
    const ym = ymOf(anchor);
    const start = addMonths(ym, -(n - 1));
    from = monthRange(start)[0];
    to = monthRange(ym)[1];
    title = `${monthName(start, lang, true)} – ${monthName(ym, lang, true)}`;
    for (let i = 0; i < n; i++) {
      const k = addMonths(start, i);
      const [a, b] = monthRange(k);
      buckets.push(bucketOf(data, a, b, k, monthName(k, lang, true)));
    }
  }
  const flows = flowsBetween(data, from, to);
  const summary = summarize(flows);
  const cs = catSpend(data, flows);
  const cats: CatRow[] = cs.rows.filter((r) => r.spent > 0).map((r) => ({ id: r.cat.id, label: r.cat.label, emoji: r.cat.emoji, color: r.cat.color, spent: r.spent })).sort((a, b) => b.spent - a.spent);
  if (cs.noCat > 0) cats.push({ id: 'none', label: L('Ohne Topf', 'No pot'), emoji: '🧺', color: '#8a8f98', spent: cs.noCat });
  const top = flows.filter((f) => f.dir === 'out' && f.src !== 'save').sort((a, b) => b.amount - a.amount).slice(0, 6);
  const fixedPaid = flows.filter((f) => f.dir === 'out' && (f.src === 'rec' || f.src === 'bill') && f.done).reduce((s, f) => s + f.amount, 0);
  const fixedOpen = flows.filter((f) => f.dir === 'out' && (f.src === 'rec' || f.src === 'bill') && !f.done).reduce((s, f) => s + f.amount, 0);
  const bl = flows.filter((f) => f.src === 'bill');
  let prev: Summary | undefined;
  if (kind === 'months') {
    const pStart = addMonths(ymOf(from), -n);
    prev = summarize(flowsBetween(data, monthRange(pStart)[0], monthRange(addMonths(pStart, n - 1))[1]));
  }
  return { kind, from, to, title, summary, buckets, cats, top, prev, fixedPaid, fixedOpen, bills: { count: bl.length, sum: bl.reduce((s, f) => s + f.amount, 0), open: bl.filter((f) => !f.done).length }, saved: summary.saved };
}

/** Ein Satz, der die Zahlen freundlich einordnet – ohne Wertung */
export function reviewSentence(r: Review, m: (n: number) => string, L: Lfn): string {
  const s = r.summary;
  if (s.had === 0 && s.paid + s.open === 0) return L('In diesem Zeitraum ist nichts eingetragen. Das ist in Ordnung.', 'Nothing was entered in this period. That is okay.');
  if (s.free >= 0) return L(`Am Ende bleiben ${m(s.free)} übrig.`, `In the end ${m(s.free)} is left.`);
  return L(`Es fehlen ${m(-s.free)}. Das ist ein Hinweis, kein Urteil.`, `${m(-s.free)} is missing. That is a hint, not a verdict.`);
}
