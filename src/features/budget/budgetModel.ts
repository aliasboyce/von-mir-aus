import { createRepository, createId } from '../../services/storage/repository';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Budget-Planer: alles Geld an einem Ort, in einfachen Worten.
 *
 *   feste Posten (Einnahmen, Miete, Abos, Verträge …)  → budget-recurring  (+ Abhaken je Monat: budget-ticks)
 *   Rechnungen mit Fälligkeit                           → budget-bills
 *   einzelne Ausgaben / Einnahmen                       → budget-entries
 *   Bereiche mit Monatsbudget („Töpfe“)                 → budget-categories
 *   Konten, Bargeld                                      → budget-accounts
 *   Sparschwein, Rücklagen                               → budget-pots
 */

export type Lfn = (de: string, en: string) => string;
export type Interval = 'weekly' | 'monthly' | 'quarterly' | 'halfyear' | 'yearly';
export type Dir = 'in' | 'out';

/** Gruppen der festen Posten – nur zum Sortieren und für Symbole */
export type Group = 'income' | 'home' | 'utility' | 'insurance' | 'telecom' | 'subscription' | 'credit' | 'other';

export interface ContractInfo {
  provider?: string;
  customerNo?: string;
  contractNo?: string;
  /** Beginn, 'YYYY-MM-DD' */
  start?: string;
  /** läuft bis / kündbar bis, 'YYYY-MM-DD' */
  cancelUntil?: string;
  /** Wo liegen die Unterlagen? */
  keptAt?: string;
  /** Login, Hotline, Hinweise (keine Passwörter!) */
  note?: string;
  /** Erinnerung an die Kündigungsfrist im Kalender */
  calCancel?: boolean;
}

export interface Recurring {
  id: string;
  dir: Dir;
  group: Group;
  label: string;
  emoji: string;
  amount: number;
  interval: Interval;
  /** Tag im Monat (1–31); bei „wöchentlich“ der Wochentag (1 = Montag … 7 = Sonntag) */
  day: number;
  /** erster Monat (1–12) des Rhythmus bei vierteljährlich / halbjährlich / jährlich */
  month?: number;
  /** gilt ab / bis, 'YYYY-MM-DD' */
  from?: string;
  to?: string;
  /** im Kalender zeigen */
  cal?: boolean;
  /** Minuten vorher (0 = zur Zeit); undefined = keine Erinnerung */
  remind?: number | null;
  paused?: boolean;
  /** Vertragsdaten (alles freiwillig) */
  info?: ContractInfo;
  /** „ist ein Vertrag / Abo“: erscheint auf der Seite Verträge & Abos */
  contract?: boolean;
  note?: string;
  createdAt: string;
  updatedAt: string;
}

/** ein Haken: dieser Posten ist in diesem Monat bezahlt / eingegangen */
export interface Tick {
  id: string;
  rid: string;
  /** Datum der Fälligkeit, 'YYYY-MM-DD' */
  date: string;
  /** tatsächlicher Betrag, falls anders */
  amount?: number;
  doneAt: string;
}

export interface Bill {
  id: string;
  title: string;
  emoji?: string;
  amount: number;
  due: string;
  paid: boolean;
  paidAt?: string;
  /** Foto der Rechnung (liegt in der eigenen Mediendatei) */
  photo?: string;
  /** Wo liegt die Rechnung / das Original? */
  where?: string;
  note?: string;
  cal?: boolean;
  remind?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Entry {
  id: string;
  date: string;
  dir: Dir;
  amount: number;
  label: string;
  catId?: string;
  accountId?: string;
  /** Wo ist der Beleg / das Gekaufte jetzt? */
  where?: string;
  note?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
  /** Monatsbudget des Topfes */
  limit?: number;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  emoji: string;
  color: string;
  kind: 'bank' | 'cash' | 'other';
  balance: number;
  /** Datum des letzten Stands */
  asOf: string;
  history: { d: string; b: number }[];
  where?: string;
  note?: string;
  createdAt: string;
}

export interface Deposit {
  id: string;
  d: string;
  /** positiv = hineingelegt, negativ = herausgenommen */
  amount: number;
  /** wirkt aufs Monatsgeld (hineingelegt = ausgegeben, herausgenommen = wieder da) */
  fromBudget: boolean;
  note?: string;
}

export interface Pot {
  id: string;
  name: string;
  emoji: string;
  color: string;
  goal?: number;
  /** Wo liegt das Geld wirklich? */
  where?: string;
  deposits: Deposit[];
  /** Das Sparschwein zum Reinwerfen */
  pig?: boolean;
  createdAt: string;
}

export interface BudgetSettings {
  currency: string;
  /** Hinweise zum Anfang einmal gesehen */
  introSeen: boolean;
  /** zuletzt gewählter Betrag fürs Sparschwein */
  lastCoin?: number;
  /** Standard-Bereiche wurden einmal angelegt */
  seeded?: boolean;
}

export const recurringRepo = createRepository<Recurring>('budget-recurring');
export const ticksRepo = createRepository<Tick>('budget-ticks');
export const billsRepo = createRepository<Bill>('budget-bills');
export const entriesRepo = createRepository<Entry>('budget-entries');
export const categoriesRepo = createRepository<Category>('budget-categories');
export const accountsRepo = createRepository<Account>('budget-accounts');
export const potsRepo = createRepository<Pot>('budget-pots');
export const budgetSettingsStore = createKeyValueStore<BudgetSettings>('budget-settings', { currency: '€', introSeen: false });

export const BUDGET_KEYS = ['budget-recurring', 'budget-ticks', 'budget-bills', 'budget-entries', 'budget-categories', 'budget-accounts', 'budget-pots', 'budget-settings'];

// ---------- Ereignis, damit offene Seiten neu lesen ----------
export const BUDGET_CHANGED = 'vma-budget-changed';
export function notifyBudget(): void {
  try { window.dispatchEvent(new Event(BUDGET_CHANGED)); } catch { /* ignore */ }
}

export const newId = (p: string) => createId(p);
export const nowIso = () => new Date().toISOString();

// ---------- Zeit ----------
export const pad2 = (n: number) => String(n).padStart(2, '0');
export const ymd = (d: Date) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
export const todayStr = () => ymd(new Date());
export const ymOf = (d: Date | string) => (typeof d === 'string' ? d.slice(0, 7) : `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`);
export const daysIn = (y: number, m: number) => new Date(y, m, 0).getDate();
export const parseYm = (ym: string) => ({ y: Number(ym.slice(0, 4)), m: Number(ym.slice(5, 7)) });
export const addMonths = (ym: string, n: number) => {
  const { y, m } = parseYm(ym);
  const d = new Date(y, m - 1 + n, 1);
  return ymOf(d);
};
export const monthRange = (ym: string): [string, string] => {
  const { y, m } = parseYm(ym);
  return [`${ym}-01`, `${ym}-${pad2(daysIn(y, m))}`];
};
export const addDays = (s: string, n: number) => {
  const d = new Date(`${s}T12:00:00`);
  d.setDate(d.getDate() + n);
  return ymd(d);
};
/** Montag der Woche von s */
export const weekStart = (s: string) => {
  const d = new Date(`${s}T12:00:00`);
  const wd = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - wd);
  return ymd(d);
};
export const parseDay = (s: string) => new Date(`${s}T12:00:00`);

export function monthName(ym: string, lang: 'de' | 'en', short = false): string {
  const { y, m } = parseYm(ym);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', { month: short ? 'short' : 'long', year: short ? '2-digit' : 'numeric' }).format(new Date(y, m - 1, 1));
}
export function dayLabel(s: string | undefined, lang: 'de' | 'en', withYear = false): string {
  if (!s) return '';
  const d = parseDay(s);
  if (Number.isNaN(d.getTime())) return s;
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'short', day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) }).format(d);
}

// ---------- Geld ----------
export function money(n: number, cur: string, lang: 'de' | 'en', opts: { sign?: boolean; round?: boolean } = {}): string {
  const v = Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;
  const s = new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'de-DE', { minimumFractionDigits: opts.round || Number.isInteger(v) ? 0 : 2, maximumFractionDigits: opts.round ? 0 : 2 }).format(Math.abs(v));
  const sign = v < 0 ? '−' : opts.sign && v > 0 ? '+' : '';
  return `${sign}${s} ${cur}`.trim();
}
export function parseAmount(s: string): number | null {
  const t = s.replace(/\s/g, '').replace(/[€$]/g, '');
  if (!t) return null;
  // „1.234,56“ oder „1234.56“ oder „12,5“
  let norm = t;
  if (t.includes(',') && t.includes('.')) norm = t.lastIndexOf(',') > t.lastIndexOf('.') ? t.replace(/\./g, '').replace(',', '.') : t.replace(/,/g, '');
  else if (t.includes(',')) norm = t.replace(',', '.');
  const v = parseFloat(norm);
  return Number.isFinite(v) ? Math.round(v * 100) / 100 : null;
}

// ---------- Vorschläge (frei änderbar) ----------
export interface Suggest { label: [string, string]; emoji: string; group: Group; interval?: Interval; contract?: boolean; day?: number }
export const INCOME_SUGGESTIONS: Suggest[] = [
  { label: ['Gehalt', 'Salary'], emoji: '💼', group: 'income' },
  { label: ['Arbeitslosengeld', 'Unemployment benefit'], emoji: '🧾', group: 'income' },
  { label: ['Bürgergeld / Grundsicherung', 'Citizen’s income / basic support'], emoji: '🏛️', group: 'income' },
  { label: ['Kindergeld', 'Child benefit'], emoji: '🧸', group: 'income' },
  { label: ['Wohngeld', 'Housing benefit'], emoji: '🏠', group: 'income' },
  { label: ['Rente', 'Pension'], emoji: '🌳', group: 'income' },
  { label: ['Erwerbsminderungsrente', 'Disability pension'], emoji: '🪴', group: 'income' },
  { label: ['Krankengeld', 'Sick pay'], emoji: '🩹', group: 'income' },
  { label: ['Elterngeld', 'Parental allowance'], emoji: '🍼', group: 'income' },
  { label: ['BAföG / Stipendium', 'Student aid'], emoji: '🎓', group: 'income' },
  { label: ['Unterhalt', 'Maintenance'], emoji: '🤝', group: 'income' },
  { label: ['Nebenjob', 'Side job'], emoji: '🛠️', group: 'income' },
  { label: ['Taschengeld / Zuschuss', 'Allowance / support'], emoji: '🎁', group: 'income' },
];
export const FIXED_SUGGESTIONS: Suggest[] = [
  { label: ['Miete', 'Rent'], emoji: '🏠', group: 'home', day: 1 },
  { label: ['Nebenkosten', 'Utilities (service charges)'], emoji: '🧯', group: 'utility' },
  { label: ['Strom', 'Electricity'], emoji: '💡', group: 'utility' },
  { label: ['Gas / Heizung', 'Gas / heating'], emoji: '🔥', group: 'utility' },
  { label: ['Wasser', 'Water'], emoji: '🚰', group: 'utility' },
  { label: ['Rundfunkbeitrag', 'Broadcasting fee'], emoji: '📺', group: 'utility', interval: 'quarterly' },
  { label: ['Internet', 'Internet'], emoji: '🌐', group: 'telecom', contract: true },
  { label: ['Handyvertrag', 'Mobile contract'], emoji: '📱', group: 'telecom', contract: true },
  { label: ['Krankenversicherung', 'Health insurance'], emoji: '🩺', group: 'insurance', contract: true },
  { label: ['Haftpflichtversicherung', 'Liability insurance'], emoji: '☂️', group: 'insurance', interval: 'yearly', contract: true },
  { label: ['Hausratversicherung', 'Contents insurance'], emoji: '🛋️', group: 'insurance', interval: 'yearly', contract: true },
  { label: ['Deutschlandticket / Fahrkarte', 'Transit pass'], emoji: '🚆', group: 'other', contract: true },
  { label: ['Kredit / Raten', 'Loan / instalments'], emoji: '🧮', group: 'credit' },
  { label: ['Therapie / Zuzahlung', 'Therapy / co-payment'], emoji: '🌿', group: 'other' },
  { label: ['Kita / Schule', 'Childcare / school'], emoji: '🎒', group: 'other' },
  { label: ['Unterhalt zahlen', 'Pay maintenance'], emoji: '🤝', group: 'other' },
  { label: ['Fitnessstudio / Verein', 'Gym / club'], emoji: '🏋️', group: 'subscription', contract: true },
];
export const SUBSCRIPTION_SUGGESTIONS: Suggest[] = [
  { label: ['Netflix', 'Netflix'], emoji: '🎬', group: 'subscription', contract: true },
  { label: ['Disney+', 'Disney+'], emoji: '🏰', group: 'subscription', contract: true },
  { label: ['Amazon Prime', 'Amazon Prime'], emoji: '📦', group: 'subscription', contract: true },
  { label: ['Spotify', 'Spotify'], emoji: '🎧', group: 'subscription', contract: true },
  { label: ['YouTube Premium', 'YouTube Premium'], emoji: '▶️', group: 'subscription', contract: true },
  { label: ['Apple / iCloud', 'Apple / iCloud'], emoji: '☁️', group: 'subscription', contract: true },
  { label: ['Google One / Cloud', 'Google One / cloud'], emoji: '🗂️', group: 'subscription', contract: true },
  { label: ['Gaming-Abo', 'Gaming subscription'], emoji: '🎮', group: 'subscription', contract: true },
  { label: ['Zeitung / Zeitschrift', 'Newspaper / magazine'], emoji: '📰', group: 'subscription', contract: true },
  { label: ['Hörbücher / Bücher', 'Audio books / books'], emoji: '📚', group: 'subscription', contract: true },
  { label: ['App-Abo', 'App subscription'], emoji: '🧩', group: 'subscription', contract: true },
];
export const BILL_SUGGESTIONS: [string, string, string][] = [
  ['Arztrechnung', 'Doctor’s bill', '🩺'],
  ['Zahnarzt', 'Dentist', '🦷'],
  ['Apotheke', 'Pharmacy', '💊'],
  ['Nachzahlung', 'Back payment', '📬'],
  ['Mahnung', 'Reminder notice', '⚠️'],
  ['Handwerker', 'Tradesperson', '🔧'],
  ['Steuer / Amt', 'Tax / authority', '🏛️'],
  ['Versandhandel', 'Online shop', '📦'],
];
export const WHERE_SUGGESTIONS: [string, string][] = [
  ['Im Ordner', 'In the folder'],
  ['In der Schublade', 'In the drawer'],
  ['Auf dem Schreibtisch', 'On the desk'],
  ['Foto im Handy', 'Photo on my phone'],
  ['Im E-Mail-Postfach', 'In my e-mail'],
  ['Bei einer Vertrauensperson', 'With someone I trust'],
];
export const GROUP_LABEL: Record<Group, [string, string, string]> = {
  income: ['Einnahmen', 'Income', '💰'],
  home: ['Wohnen', 'Home', '🏠'],
  utility: ['Nebenkosten', 'Utilities', '🧯'],
  insurance: ['Versicherungen', 'Insurance', '☂️'],
  telecom: ['Handy & Internet', 'Phone & internet', '📱'],
  subscription: ['Abos & Streaming', 'Subscriptions & streaming', '🎬'],
  credit: ['Kredite & Raten', 'Loans & instalments', '🧮'],
  other: ['Sonstiges Festes', 'Other fixed costs', '📌'],
};
export const INTERVAL_LABEL: Record<Interval, [string, string]> = {
  weekly: ['jede Woche', 'every week'],
  monthly: ['jeden Monat', 'every month'],
  quarterly: ['alle 3 Monate', 'every 3 months'],
  halfyear: ['alle 6 Monate', 'every 6 months'],
  yearly: ['einmal im Jahr', 'once a year'],
};
export const REMIND_OPTIONS: { v: number | null; de: string; en: string }[] = [
  { v: null, de: 'keine', en: 'none' },
  { v: 0, de: 'zur Zeit', en: 'at the time' },
  { v: 1440, de: '1 Tag vorher', en: '1 day before' },
  { v: 4320, de: '3 Tage vorher', en: '3 days before' },
  { v: 10080, de: '1 Woche vorher', en: '1 week before' },
];

export const DEFAULT_CATEGORIES: { id: string; de: string; en: string; emoji: string; color: string }[] = [
  { id: 'cat_food', de: 'Essen & Trinken', en: 'Food & drink', emoji: '🥕', color: '#7fb069' },
  { id: 'cat_house', de: 'Haushalt & Drogerie', en: 'Household & drugstore', emoji: '🧴', color: '#6aa8c9' },
  { id: 'cat_health', de: 'Gesundheit', en: 'Health', emoji: '💊', color: '#d9778a' },
  { id: 'cat_move', de: 'Unterwegs', en: 'Getting around', emoji: '🚌', color: '#e8a83d' },
  { id: 'cat_clothes', de: 'Kleidung', en: 'Clothes', emoji: '🧥', color: '#9a7bc4' },
  { id: 'cat_fun', de: 'Freizeit & Genuss', en: 'Leisure & treats', emoji: '🎈', color: '#f08a5d' },
  { id: 'cat_gift', de: 'Geschenke & andere', en: 'Gifts & others', emoji: '🎁', color: '#4a8f9e' },
  { id: 'cat_other', de: 'Sonstiges', en: 'Other', emoji: '🧺', color: '#8a8f98' },
];

export const POT_COLORS = ['#e8a8b8', '#f2c46d', '#8fc1e3', '#9fd3a8', '#c9b3e6', '#f2a98a', '#7fc4c4', '#b8b8c8'];
export const ACCENT = {
  in: '#4f9d69',
  out: '#d97762',
  open: '#e0a030',
  free: '#3f8f9b',
  save: '#d98aa0',
};

/** legt die Standard-Bereiche und das Sparschwein einmalig an (nur wenn noch nichts da ist) */
export function seedBudget(lang: 'de' | 'en'): void {
  const st = budgetSettingsStore.get();
  if (!st.seeded) {
    if (categoriesRepo.getAll().length === 0) {
      const now = nowIso();
      DEFAULT_CATEGORIES.forEach((c) => categoriesRepo.save({ id: c.id, label: lang === 'en' ? c.en : c.de, emoji: c.emoji, color: c.color, createdAt: now }));
    }
    budgetSettingsStore.set({ ...st, seeded: true });
  }
  // das Sparschwein gibt es immer
  if (!potsRepo.getAll().some((p) => p.pig)) {
    potsRepo.save({ id: 'pot_pig', name: lang === 'en' ? 'Piggy bank' : 'Sparschwein', emoji: '🐷', color: POT_COLORS[0], deposits: [], pig: true, createdAt: nowIso() });
  }
}
