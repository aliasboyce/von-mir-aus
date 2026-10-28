import {
  addDays, addMonths, billsRepo, categoriesRepo, daysIn, entriesRepo, monthRange, pad2, parseDay, parseYm, potsRepo, recurringRepo, ticksRepo, todayStr, ymd, ymOf,
  type Bill, type Category, type Dir, type Entry, type Pot, type Recurring, type Tick,
} from './budgetModel';

/** Alle Geldbewegungen auf einen Blick – eine Quelle für Übersicht, Rückblicke und PDF. */
export interface Flow {
  id: string;
  date: string;
  dir: Dir;
  amount: number;
  label: string;
  emoji: string;
  src: 'rec' | 'bill' | 'entry' | 'save';
  /** Bezugs-Id (Posten, Rechnung, Buchung, Topf) */
  ref: string;
  /** bezahlt / eingegangen / gebucht */
  done: boolean;
  catId?: string;
  where?: string;
  tickId?: string;
}

export interface BudgetData {
  recurring: Recurring[];
  ticks: Tick[];
  bills: Bill[];
  entries: Entry[];
  cats: Category[];
  pots: Pot[];
}

export function loadBudget(): BudgetData {
  return { recurring: recurringRepo.getAll(), ticks: ticksRepo.getAll(), bills: billsRepo.getAll(), entries: entriesRepo.getAll(), cats: categoriesRepo.getAll(), pots: potsRepo.getAll() };
}

/** Tage, an denen ein fester Posten in [from, to] fällig ist */
export function occurrences(r: Recurring, from: string, to: string): string[] {
  if (r.paused) return [];
  const out: string[] = [];
  const lo = r.from && r.from > from ? r.from : from;
  const hi = r.to && r.to < to ? r.to : to;
  if (lo > hi) return out;
  if (r.interval === 'weekly') {
    let d = lo;
    const wd = (parseDay(d).getDay() + 6) % 7 + 1; // 1 = Montag
    d = addDays(d, ((r.day - wd) % 7 + 7) % 7);
    for (; d <= hi; d = addDays(d, 7)) out.push(d);
    return out;
  }
  const step = r.interval === 'monthly' ? 1 : r.interval === 'quarterly' ? 3 : r.interval === 'halfyear' ? 6 : 12;
  const anchor = r.interval === 'monthly' ? 1 : r.month ?? (r.from ? Number(r.from.slice(5, 7)) : 1);
  let ym = ymOf(lo);
  const endYm = ymOf(hi);
  for (; ym <= endYm; ym = addMonths(ym, 1)) {
    const { y, m } = parseYm(ym);
    if (step > 1 && (((m - anchor) % step) + step) % step !== 0) continue;
    const day = Math.min(Math.max(1, r.day), daysIn(y, m));
    const d = `${ym}-${pad2(day)}`;
    if (d >= lo && d <= hi) out.push(d);
  }
  return out;
}

export const tickKey = (rid: string, date: string) => `${rid}|${date}`;

/** Alle Bewegungen zwischen zwei Tagen (einschließlich), nach Datum sortiert */
export function flowsBetween(data: BudgetData, from: string, to: string): Flow[] {
  const flows: Flow[] = [];
  const tickMap = new Map(data.ticks.map((t) => [t.id, t]));
  data.recurring.forEach((r) => {
    occurrences(r, from, to).forEach((d) => {
      const t = tickMap.get(tickKey(r.id, d));
      flows.push({ id: `rec:${r.id}:${d}`, date: d, dir: r.dir, amount: t?.amount ?? r.amount, label: r.label, emoji: r.emoji, src: 'rec', ref: r.id, done: !!t, tickId: t?.id });
    });
  });
  data.bills.forEach((b) => {
    if (b.due >= from && b.due <= to) flows.push({ id: `bill:${b.id}`, date: b.due, dir: 'out', amount: b.amount, label: b.title, emoji: b.emoji || '🧾', src: 'bill', ref: b.id, done: b.paid, where: b.where });
  });
  data.entries.forEach((e) => {
    if (e.date >= from && e.date <= to) {
      const cat = e.catId ? data.cats.find((c) => c.id === e.catId) : undefined;
      flows.push({ id: `entry:${e.id}`, date: e.date, dir: e.dir, amount: e.amount, label: e.label, emoji: cat?.emoji ?? (e.dir === 'in' ? '💚' : '🧺'), src: 'entry', ref: e.id, done: true, catId: e.catId, where: e.where });
    }
  });
  data.pots.forEach((p) => {
    p.deposits.forEach((dep) => {
      if (dep.fromBudget && dep.d >= from && dep.d <= to) flows.push({ id: `save:${dep.id}`, date: dep.d, dir: dep.amount >= 0 ? 'out' : 'in', amount: Math.abs(dep.amount), label: dep.amount >= 0 ? p.name : p.name, emoji: p.emoji, src: 'save', ref: p.id, done: true });
    });
  });
  return flows.sort((a, b) => a.date.localeCompare(b.date) || a.label.localeCompare(b.label));
}

export interface Summary {
  /** was ich hatte: alle Einnahmen des Zeitraums (erwartete und schon eingegangene) */
  had: number;
  /** davon schon da */
  hadGot: number;
  /** schon ausgegeben / bezahlt */
  paid: number;
  /** fällig, aber noch nicht abgehakt */
  open: number;
  /** was frei bleibt: had − paid − open */
  free: number;
  /** fest + Rechnungen (bezahlt und offen) */
  fixedTotal: number;
  /** feste Einnahmen des Zeitraums (erwartete und eingegangene) */
  fixedIn: number;
  /** weitere (nicht feste) Einnahmen, einzeln eingetragen */
  extraIn: number;
  /** einzelne Ausgaben */
  spentEntries: number;
  /** ins Sparschwein / in Rücklagen gelegt (abzüglich Entnommenem) */
  saved: number;
  countOpen: number;
}

export function summarize(flows: Flow[]): Summary {
  let had = 0, hadGot = 0, paid = 0, open = 0, fixedTotal = 0, spentEntries = 0, saved = 0, countOpen = 0, fixedIn = 0, extraIn = 0;
  flows.forEach((f) => {
    if (f.dir === 'in') {
      // Einnahmen und Geld, das aus dem Sparschwein wieder ins Monatsgeld kommt
      had += f.amount;
      if (f.done) hadGot += f.amount;
      if (f.src === 'save') saved -= f.amount;
      if (f.src === 'rec') fixedIn += f.amount;
      if (f.src === 'entry') extraIn += f.amount;
      return;
    }
    if (f.done) paid += f.amount;
    else { open += f.amount; countOpen += 1; }
    if (f.src === 'rec' || f.src === 'bill') fixedTotal += f.amount;
    if (f.src === 'entry') spentEntries += f.amount;
    if (f.src === 'save') saved += f.amount;
  });
  return { had, hadGot, paid, open, free: had - paid - open, fixedTotal, fixedIn, extraIn, spentEntries, saved, countOpen };
}

export function monthFlows(data: BudgetData, ym: string): Flow[] {
  const [a, b] = monthRange(ym);
  return flowsBetween(data, a, b);
}

/** Wie viel pro Tag bleibt bis Monatsende (nur im laufenden Monat und wenn etwas frei ist) */
export function perDay(free: number, ym: string): { perDay: number; days: number } | null {
  const today = todayStr();
  if (ymOf(today) !== ym || free <= 0) return null;
  const { y, m } = parseYm(ym);
  const days = daysIn(y, m) - Number(today.slice(8, 10)) + 1;
  if (days <= 0) return null;
  return { perDay: free / days, days };
}

export interface CatSpend { cat: Category; spent: number; left: number | null }
/** Ausgaben je Bereich im Zeitraum (nur Einzel-Ausgaben mit Bereich) */
export function catSpend(data: BudgetData, flows: Flow[]): { rows: CatSpend[]; noCat: number } {
  const rows = data.cats.map((cat) => {
    const spent = flows.filter((f) => f.src === 'entry' && f.dir === 'out' && f.catId === cat.id).reduce((s, f) => s + f.amount, 0);
    return { cat, spent, left: cat.limit && cat.limit > 0 ? cat.limit - spent : null };
  });
  const noCat = flows.filter((f) => f.src === 'entry' && f.dir === 'out' && !f.catId).reduce((s, f) => s + f.amount, 0);
  return { rows, noCat };
}

/** Töpfe: wie viel ist verplant, wie viel davon noch nicht ausgegeben */
export function potsPlan(rows: CatSpend[]): { planned: number; stillToSpend: number } {
  let planned = 0, stillToSpend = 0;
  rows.forEach((r) => {
    if (r.cat.limit && r.cat.limit > 0) {
      planned += r.cat.limit;
      stillToSpend += Math.max(0, r.cat.limit - r.spent);
    }
  });
  return { planned, stillToSpend };
}

export interface Forecast {
  /** feste Einnahmen − feste Kosten und Rechnungen (so viel bleibt wahrscheinlich, wenn nichts Weiteres passiert) */
  fixedOnly: number;
  fixedIn: number;
  fixedOut: number;
  /** weitere Einnahmen, Einzelausgaben und Sparschwein-Bewegungen bisher */
  extraIn: number;
  spentEntries: number;
  savedNet: number;
  /** mit allem, was eingetragen ist */
  current: number;
  /** noch nicht ausgegebenes Monatsbudget aller Töpfe mit Betrag */
  potsLeft: number;
  potsPlanned: number;
  /** nachdem das Topf-Geld zurückgelegt ist */
  afterPots: number;
  hasPots: boolean;
  rows: CatSpend[];
}

/**
 * Was bleibt wahrscheinlich übrig? Drei Stufen, jede baut auf der vorigen auf:
 *  1) nur fest:   feste Einnahmen − feste Kosten − Rechnungen
 *  2) aktuell:    + weitere Einnahmen − Einzelausgaben − Sparschwein (alles, was eingetragen ist)
 *  3) mit Töpfen: − das, was in den Töpfen noch eingeplant, aber nicht ausgegeben ist
 */
export function forecast(s: Summary, cs: { rows: CatSpend[] }): Forecast {
  const plan = potsPlan(cs.rows);
  const fixedOnly = s.fixedIn - s.fixedTotal;
  const current = s.free;
  return {
    fixedOnly, fixedIn: s.fixedIn, fixedOut: s.fixedTotal, extraIn: s.extraIn, spentEntries: s.spentEntries, savedNet: s.saved,
    current, potsLeft: plan.stillToSpend, potsPlanned: plan.planned, afterPots: current - plan.stillToSpend, hasPots: plan.planned > 0, rows: cs.rows,
  };
}

export const potBalance = (p: Pot) => Math.round(p.deposits.reduce((s, d) => s + d.amount, 0) * 100) / 100;

/** Monatsreihe für Diagramme: letzte n Monate bis ym */
export function monthSeries(data: BudgetData, ym: string, n: number): { ym: string; s: Summary }[] {
  const out: { ym: string; s: Summary }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const k = addMonths(ym, -i);
    out.push({ ym: k, s: summarize(monthFlows(data, k)) });
  }
  return out;
}

/** nächste Fälligkeiten (offene Posten und Rechnungen) ab heute, aufsteigend */
export function upcoming(data: BudgetData, days = 35): Flow[] {
  const t = todayStr();
  const fl = flowsBetween(data, `${t.slice(0, 7)}-01`, addDays(t, days));
  return fl.filter((f) => !f.done && f.dir === 'out' && f.src !== 'entry' && f.src !== 'save');
}

export { ymd };
