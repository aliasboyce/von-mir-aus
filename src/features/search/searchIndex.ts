/**
 * Die Lupe – Index: sammelt (1) alle Funktionen der App, (2) die Hilfetexte und (3) alles, was du selbst
 * geschrieben hast. Der Index wird beim Öffnen der Suche frisch aus dem Gerätespeicher gebaut – es wird
 * nichts extra gespeichert und nichts verschickt.
 */
import { storageAdapter } from '../../services/storage/StorageAdapter';
import { OVERVIEW_GROUPS } from '../home/appOverviewData';
import { HELP_CONTENT, type HelpKey } from '../../components/navigation/helpContent';
import { richToPlain } from '../../services/richText';
import { isBookLocked } from '../diary/bookLock';
import { OVERVIEW_KEYWORDS, STATIC_FUNCS } from './searchKeywords';
import { buildDoc, type SearchDoc } from './searchEngine';

export type HitKind = 'func' | 'help' | 'data';

export interface IndexEntry {
  id: string;
  kind: HitKind;
  emoji: string;
  /** Bereich (Schublade), in dem der Treffer liegt */
  group: { de: string; en: string };
  title: { de: string; en: string };
  /** Text zum Anzeigen von Fundstellen (für eigene Texte: dein Text) */
  body: { de: string; en: string };
  /** Seite, die geöffnet wird */
  to?: string;
  action?: 'grounding';
  helpKey?: HelpKey;
  doc: SearchDoc;
}

/* ───────────────────────── eigene Texte ───────────────────────── */

interface DataSource {
  key: string;
  emoji: string;
  de: string;
  en: string;
  to: (item: Record<string, unknown>) => string;
  /** Einträge, die nicht gefunden werden sollen (z. B. gesperrte Tagebücher) */
  skip?: (item: Record<string, unknown>) => boolean;
  /** Text-Aufbereitung für Felder mit Formatierung */
  plainFields?: string[];
}

const id = (item: Record<string, unknown>) => String(item.id ?? '');

const SOURCES: DataSource[] = [
  { key: 'mindmaps', emoji: '🗺️', de: 'Mindmap', en: 'Mind map', to: (i) => `/entdecken/mindmap/${id(i)}` },
  { key: 'projects', emoji: '🧩', de: 'Projekt', en: 'Project', to: (i) => `/entdecken/projekte/${id(i)}` },
  {
    key: 'diary-entries',
    emoji: '📓',
    de: 'Tagebuch',
    en: 'Diary',
    to: () => '/sicherheit/tagebuch',
    skip: (i) => isBookLocked(i.categoryId as string | undefined),
    plainFields: ['content'],
  },
  { key: 'user-lists', emoji: '📝', de: 'Liste', en: 'List', to: (i) => `/listen/${id(i)}` },
  { key: 'budget-bills', emoji: '🧾', de: 'Rechnung', en: 'Bill', to: () => '/budget/rechnungen' },
  { key: 'budget-recurring', emoji: '💶', de: 'Fester Posten', en: 'Fixed item', to: (i) => (i.contract ? '/budget/vertraege' : '/budget/fest') },
  { key: 'budget-entries', emoji: '🛍️', de: 'Ausgabe / Einnahme', en: 'Spending / income', to: () => '/budget/ausgaben' },
  { key: 'budget-accounts', emoji: '🏦', de: 'Konto', en: 'Account', to: () => '/budget/konten' },
  { key: 'budget-pots', emoji: '🐷', de: 'Sparschwein / Rücklage', en: 'Piggy bank / savings', to: () => '/budget/sparschwein' },
  { key: 'park-notes', emoji: '🗒️', de: 'Zettel (Parkbox)', en: 'Slip (Park box)', to: () => '/parkbox' },
  { key: 'waiting-room', emoji: '🪑', de: 'Wartezimmer', en: 'Waiting room', to: () => '/parkbox' },
  {
    key: 'letters-to-self',
    emoji: '✉️',
    de: 'Brief an mich',
    en: 'Letter to myself',
    to: () => '/entdecken/brief-an-mich',
    // ungeöffnete Briefe bleiben eine Überraschung
    skip: (i) => !i.opened && i.copyOfTo === undefined,
  },
  { key: 'glaubenssaetze', emoji: '🧠', de: 'Denkmaschine', en: 'Thought machine', to: () => '/entdecken/denkmaschine' },
  { key: 'sorgenfresser-worries', emoji: '🫧', de: 'Loslassen', en: 'Letting go', to: () => '/entdecken/loslassen' },
  { key: 'bridges', emoji: '🌉', de: 'Brücke', en: 'Bridge', to: (i) => `/bruecken/${id(i)}` },
  { key: 'resources', emoji: '🧰', de: 'Ressource', en: 'Resource', to: () => '/entdecken/ressourcen' },
  { key: 'skillketten', emoji: '⛓️', de: 'Skillkette', en: 'Skill chain', to: (i) => `/entdecken/ressourcen/skillketten/${id(i)}` },
  { key: 'network-entries', emoji: '🤝', de: 'Netzwerk', en: 'Network', to: () => '/sicherheit/netzwerk' },
  { key: 'calendar-appointments', emoji: '📅', de: 'Termin', en: 'Appointment', to: () => '/kalender' },
  { key: 'calendar-wishes', emoji: '🎁', de: 'Wunsch (Kalender)', en: 'Wish (calendar)', to: () => '/kalender' },
  { key: 'routines', emoji: '🌱', de: 'Routine', en: 'Routine', to: (i) => `/entdecken/routinen/${id(i)}/bearbeiten` },
  { key: 'garden-entries', emoji: '🌻', de: 'Garten', en: 'Garden', to: () => '/entdecken/garten' },
  { key: 'bookmarks', emoji: '🔖', de: 'Lesezeichen', en: 'Bookmark', to: () => '/entdecken/lesezeichen' },
  { key: 'medi-log-entries', emoji: '💊', de: 'Medi-Log', en: 'Medication log', to: () => '/entdecken/medi-log' },
  { key: 'saved-medications', emoji: '💊', de: 'Medikament', en: 'Medication', to: () => '/entdecken/medi-log' },
  { key: 'medication-packages', emoji: '💊', de: 'Packung', en: 'Package', to: () => '/entdecken/medi-log/packungen' },
  { key: 'polyvagal-daily-notes', emoji: '📈', de: 'Tageskurve-Notiz', en: 'Daily-curve note', to: () => '/entdecken/tageskurve' },
  { key: 'polyvagal-checkins', emoji: '📈', de: 'Check-in', en: 'Check-in', to: () => '/entdecken/tageskurve' },
  { key: 'weather-checkins', emoji: '⛅', de: 'Inneres Wetter', en: 'Inner weather', to: () => '/inneres-wetter' },
  { key: 'safety-plans', emoji: '📋', de: 'Sicherheitsplan', en: 'Safety plan', to: () => '/sicherheit/plan' },
  { key: 'zugang-entries', emoji: '🔑', de: 'Zugang', en: 'Access', to: () => '/zugang/rueckblick' },
  { key: 'access-gap-entries', emoji: '🔑', de: 'Zugang (Lücke)', en: 'Access (gap)', to: () => '/zugang/rueckblick' },
  { key: 'wertekompass-value-cards', emoji: '🧭', de: 'Wertekompass', en: 'Value compass', to: () => '/entdecken/wertekompass' },
  { key: 'tension-entries', emoji: '📈', de: 'Spannung', en: 'Tension', to: () => '/entdecken/tageskurve' },
  { key: 'custom-reminders', emoji: '🔔', de: 'Erinnerung', en: 'Reminder', to: () => '/einstellungen' },
  { key: 'vocab-cards', emoji: '🔤', de: 'Vokabel', en: 'Vocabulary', to: () => '/' },
  { key: 'diary-templates', emoji: '📓', de: 'Tagebuch-Vorlage', en: 'Diary template', to: () => '/sicherheit/tagebuch' },
  { key: 'mailbox', emoji: '📬', de: 'Postfach', en: 'Postfach', to: () => '/' },
];

/** Feldnamen, die nie durchsucht werden (technisch oder nur Aussehen) */
const SKIP_FIELD = /^(id|.*Id|.*Ids|.*Color|.*Colors|color|bg|bgTone|bgImage|createdAt|updatedAt|.*At|date|day|time|start|end|due|kind|type|shape|font|look|tail|mode|align|zone|status|size|layout|variant|style|tone|mood|category|subcategory|categoryGroup|linkedNeeds|umstaende|zoneIds|iconKey|icon|emoji|symbol|key|paper|tilt|priority|folder|img|image|images|photo|thumb|view|cam|token|salt|hash|url|src|href)$/;

const ID_LIKE = /^[a-z]{1,6}_[a-z0-9_]{4,}$/;
const COLOR_LIKE = /^#[0-9a-f]{3,8}$/i;
const DATE_LIKE = /^\d{4}-\d{2}-\d{2}([T ].*)?$/;

function collectStrings(value: unknown, field: string, out: string[], depth: number, plain: Set<string>): void {
  if (depth > 8 || out.length > 400) return;
  if (typeof value === 'string') {
    if (field && SKIP_FIELD.test(field)) return;
    let s = value.trim();
    if (s.length < 2) return;
    if (s.startsWith('data:') || s.startsWith('blob:') || s.startsWith('http')) {
      return;
    }
    if (ID_LIKE.test(s) || COLOR_LIKE.test(s) || DATE_LIKE.test(s) || /^[\d\s.,:+-]+$/.test(s)) return;
    if (plain.has(field)) s = richToPlain(s);
    out.push(s);
  } else if (Array.isArray(value)) {
    for (const v of value) collectStrings(v, field, out, depth + 1, plain);
  } else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) collectStrings(v, k, out, depth + 1, plain);
  }
}

const TITLE_FIELDS = ['title', 'name', 'label', 'text', 'content', 'situation', 'topic', 'summary', 'note', 'description'];

function titleOf(item: Record<string, unknown>, strings: string[], plain: Set<string>): string {
  for (const f of TITLE_FIELDS) {
    const v = item[f];
    if (typeof v === 'string' && v.trim().length >= 2) {
      const t = plain.has(f) ? richToPlain(v) : v;
      return t.replace(/\s+/g, ' ').trim();
    }
  }
  return strings[0]?.replace(/\s+/g, ' ').trim() ?? '';
}

const short = (s: string, n = 70) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);

/** Alles, was du selbst geschrieben hast */
export function collectUserData(): IndexEntry[] {
  const entries: IndexEntry[] = [];
  for (const src of SOURCES) {
    let raw: unknown;
    try {
      raw = storageAdapter.getItem<unknown>(src.key);
    } catch {
      continue;
    }
    if (!Array.isArray(raw)) continue;
    const plain = new Set(src.plainFields ?? []);
    for (const item of raw as Record<string, unknown>[]) {
      if (!item || typeof item !== 'object') continue;
      try {
        if (src.skip?.(item)) continue;
        const strings: string[] = [];
        collectStrings(item, '', strings, 0, plain);
        if (!strings.length) continue;
        const title = short(titleOf(item, strings, plain));
        if (!title) continue;
        const body = strings.join(' · ');
        const eid = `${src.key}:${id(item) || entries.length}`;
        entries.push({
          id: eid,
          kind: 'data',
          emoji: src.emoji,
          group: { de: src.de, en: src.en },
          title: { de: title, en: title },
          body: { de: body, en: body },
          to: src.to(item),
          doc: buildDoc(eid, title, body),
        });
      } catch {
        /* ein kaputter Eintrag darf die Suche nicht stoppen */
      }
    }
  }
  return entries;
}

/** Funktionen der App (Übersicht + weitere) */
export function collectFunctions(): IndexEntry[] {
  const out: IndexEntry[] = [];
  for (const g of OVERVIEW_GROUPS) {
    for (const e of g.entries) {
      const kw = `${OVERVIEW_KEYWORDS[e.id] ?? ''} ${g.de.title} ${g.en.title}`;
      const eid = `fn:${g.id}:${e.id}`;
      out.push({
        id: eid,
        kind: 'func',
        emoji: e.emoji,
        group: { de: g.de.title, en: g.en.title },
        title: { de: e.de.title, en: e.en.title },
        body: { de: e.de.text, en: e.en.text },
        to: e.to,
        action: e.action,
        doc: buildDoc(eid, `${e.de.title} ${e.en.title}`, `${e.de.text} ${e.en.text}`, kw),
      });
    }
  }
  for (const f of STATIC_FUNCS) {
    const eid = `fn:${f.id}`;
    out.push({
      id: eid,
      kind: 'func',
      emoji: f.emoji,
      group: { de: 'Weitere Funktionen', en: 'More functions' },
      title: { de: f.de[0], en: f.en[0] },
      body: { de: f.de[1], en: f.en[1] },
      to: f.to,
      doc: buildDoc(eid, `${f.de[0]} ${f.en[0]}`, `${f.de[1]} ${f.en[1]}`, f.kw),
    });
  }
  return out;
}

/** Hilfetexte („?“ auf jeder Seite) */
export function collectHelp(): IndexEntry[] {
  const out: IndexEntry[] = [];
  for (const key of Object.keys(HELP_CONTENT) as HelpKey[]) {
    const h = HELP_CONTENT[key];
    const eid = `help:${key}`;
    const strip = (s: string) => s.replace(/[#*_>`]/g, ' ');
    out.push({
      id: eid,
      kind: 'help',
      emoji: '❓',
      group: { de: 'Anleitung', en: 'Guide' },
      title: { de: h.title, en: h.titleEn },
      body: { de: strip(h.body), en: strip(h.bodyEn) },
      helpKey: key,
      doc: buildDoc(eid, `${h.title} ${h.titleEn}`, `${strip(h.body)} ${strip(h.bodyEn)}`),
    });
  }
  return out;
}

export function buildSearchIndex(): IndexEntry[] {
  return [...collectFunctions(), ...collectUserData(), ...collectHelp()];
}
