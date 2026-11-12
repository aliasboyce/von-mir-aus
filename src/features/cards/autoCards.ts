import { networkRepo } from '../safetyNet/networkRepo';
import { resourcesRepo } from '../resources/resourcesRepo';
import { routinesRepo } from '../routines/routinesRepo';
import { bookmarksRepo } from '../bookmarks/bookmarksRepo';
import { appointmentsRepo } from '../calendar/calendarRepo';
import { gardenRepo } from '../garden/gardenRepo';
import { safetyPlansRepo } from '../safetyPlan/safetyPlansRepo';
import { getLichtwesen } from '../../components/companion/lichtwesen';
import { RESOURCE_CATEGORY_TO_GROUP, resourceCategoryLabel } from '../resources/resourceMeta';
import { richToPlain } from '../../services/richText';
import { isSymbolImage } from '../../components/shared/symbolImage';
import type { TranslationDictionary } from '../../i18n/de';
import type { UserSettings } from '../../data/types';
import { assignNumbers, cardCategoriesRepo, colorForKind, getPrefs, ownCardsRepo, reflexionCardsRepo } from './cardStore';
import { KIND_META, type CardKind, type CardModel } from './cardTypes';

export interface BuildCtx {
  t: TranslationDictionary;
  lang: 'de' | 'en';
  settings: UserSettings;
}

/** Das Symbol, das die App für einen Eintrag ausgewählt hat (steckt im Symbol-Bild), als Emoji. */
function emojiFromSymbolImage(src: string | undefined): string | undefined {
  if (!isSymbolImage(src)) return undefined;
  try {
    const svg = decodeURIComponent((src as string).slice('data:image/svg+xml;utf8,'.length));
    return svg.match(/<text[^>]*>([^<]+)<\/text>/)?.[1]?.trim() || undefined;
  } catch {
    return undefined;
  }
}

const clip = (s: string | undefined, n = 150) => {
  const x = richToPlain(s ?? '').replace(/\s+/g, ' ').trim();
  return x.length > n ? `${x.slice(0, n - 1).trimEnd()}…` : x;
};

/** „12. November 2026“ – das Datum ausgeschrieben. */
export function spelledDate(day: string, lang: 'de' | 'en'): string {
  const d = new Date(`${day.slice(0, 10)}T12:00:00`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

type Draft = Omit<CardModel, 'number' | 'rarity' | 'color'> & { color?: string };

/** Alles, was es in der App schon gibt, als Karten – ohne dort etwas zu verändern. */
export function buildAutoDrafts(ctx: BuildCtx): Draft[] {
  const { t, lang, settings } = ctx;
  const out: Draft[] = [];
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const safe = <T,>(fn: () => T, fallback: T): T => {
    try {
      return fn();
    } catch {
      return fallback;
    }
  };

  // Menschen aus dem Netzwerk → Held:innen
  safe(() => networkRepo.getAll(), []).filter((e) => !e.isExample && e.category === 'person').forEach((e) => {
    out.push({
      key: `person:${e.id}`,
      kind: 'person',
      title: e.name,
      subtitle: e.role,
      text: clip(e.whatHelps ? `${L('Hilft mir:', 'Helps me:')} ${e.whatHelps}` : e.description),
      image: e.photoDataUrl,
      emoji: '🦸',
      createdAt: (e as { createdAt?: string }).createdAt ?? '',
      route: `/sicherheit/netzwerk?open=${e.id}`,
    });
  });

  // Ressourcen → Fähigkeit / Ausrüstung / Ort / Aktion (nach ihrer Gruppe)
  safe(() => resourcesRepo.getAll(), []).filter((r) => r.title?.trim()).forEach((r) => {
    const group = RESOURCE_CATEGORY_TO_GROUP[r.category as keyof typeof RESOURCE_CATEGORY_TO_GROUP];
    const kind: CardKind = group === 'faehigkeiten' ? 'faehigkeit' : group === 'orte_gruppe' ? 'ort' : group === 'aktivitaeten' ? 'aktion' : r.category === 'menschen' ? 'person' : 'ausruestung';
    const stats = r.energyLevel ? [{ label: L('Energie', 'Energy'), value: '⚡'.repeat(r.energyLevel) }] : undefined;
    out.push({
      key: `${kind}:${r.id}`,
      kind,
      title: r.title,
      subtitle: resourceCategoryLabel(t, r.category),
      text: clip(r.description),
      stats,
      image: r.image && !isSymbolImage(r.image) ? r.image : undefined,
      emoji: emojiFromSymbolImage(r.image) ?? KIND_META[kind].emoji,
      createdAt: r.createdAt,
      route: `/entdecken/ressourcen?open=${r.id}`,
    });
  });

  // Routinen und Garten → Training
  safe(() => routinesRepo.getAll(), []).filter((r) => !r.isExample && r.title?.trim()).forEach((r) => {
    out.push({
      key: `training:${r.id}`,
      kind: 'training',
      title: r.title,
      subtitle: L('Routine', 'Routine'),
      lines: r.cards.map((c) => c.text).filter(Boolean).slice(0, 4),
      emoji: r.emoji || '🌱',
      color: r.color,
      createdAt: r.createdAt,
      route: `/entdecken/routinen/${r.id}/start`,
    });
  });
  safe(() => gardenRepo.getAll(), []).forEach((g) => {
    out.push({
      key: `training:garden-${g.id}`,
      kind: 'training',
      title: g.name,
      subtitle: L('Mein Garten', 'My garden'),
      emoji: '🌻',
      createdAt: g.createdAt,
      route: '/entdecken/garten',
    });
  });

  // Gespeicherte Quellen → Wissen
  safe(() => bookmarksRepo.getAll(), []).forEach((b) => {
    let host = '';
    try {
      host = new URL(b.url).hostname.replace(/^www\./, '');
    } catch {
      // keine gültige Adresse
    }
    out.push({
      key: `wissen:${b.id}`,
      kind: 'wissen',
      title: b.title,
      subtitle: host,
      text: clip(b.note),
      emoji: '📖',
      createdAt: b.createdAt,
      route: '/entdecken/lesezeichen',
    });
  });

  // Termine → Ereignis (mit ausgeschriebenem Datum)
  safe(() => appointmentsRepo.getAll(), []).filter((a) => a.title?.trim() && a.date).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 150).forEach((a) => {
    out.push({
      key: `ereignis:${a.id}`,
      kind: 'ereignis',
      title: a.title,
      subtitle: a.time ? `${a.time} ${L('Uhr', '')}`.trim() : undefined,
      text: clip(a.note),
      dateText: spelledDate(a.date, lang),
      emoji: '📅',
      createdAt: a.date,
      route: '/kalender',
    });
  });

  // Begleiter: das gewählte Wesen
  if (settings.companionChosen) {
    const w = safe(() => getLichtwesen(settings.selectedBrainId), null);
    if (w) {
      out.push({
        key: `begleiter:${w.id}`,
        kind: 'begleiter',
        title: w.name,
        subtitle: L('Mein Wesen', 'My companion'),
        text: w.trait,
        emoji: '🌟',
        color: w.color,
        createdAt: '0000',
        route: '/einstellungen/wesen-info',
      });
    }
  }

  // Notfallkarten aus den Sicherheitsplänen
  safe(() => safetyPlansRepo.getAll(), []).forEach((p) => {
    const help = [...p.helpItems].filter((h) => !h.example && h.text?.trim()).sort((a, b) => (a.tier === 'rot' ? 0 : a.tier === 'orange' ? 1 : 2) - (b.tier === 'rot' ? 0 : b.tier === 'orange' ? 1 : 2)).slice(0, 4).map((h) => h.text);
    const contacts = safe(() => networkRepo.getAll(), []).filter((e) => !e.isExample && e.isImportantContact && e.phone).slice(0, 3).map((e) => `${e.name}: ${e.phone}`);
    if (help.length === 0 && contacts.length === 0) return;
    out.push({
      key: `notfall:${p.id}`,
      kind: 'notfall',
      title: p.name || L('Mein Notfallplan', 'My emergency plan'),
      subtitle: L('Das hilft mir – das darf ich tun', 'What helps me – what I may do'),
      lines: [...help, ...contacts],
      emoji: '🛟',
      createdAt: '0001',
      route: '/sicherheit/plan',
    });
  });

  return out;
}

/** Alle Karten: automatische + eigene + Tageskarten, mit Nummer, Farbe und Seltenheit. */
export function buildAllCards(ctx: BuildCtx): CardModel[] {
  const prefs = getPrefs();
  const drafts = buildAutoDrafts(ctx);
  const cats = cardCategoriesRepo.getAll();

  const ownDrafts: Draft[] = ownCardsRepo.getAll().map((c) => {
    const cat = c.kind === 'eigen' ? cats.find((x) => x.id === c.categoryId) : undefined;
    return {
      key: `own:${c.id}`,
      kind: c.kind,
      categoryId: c.categoryId,
      categoryLabel: cat?.label,
      title: c.title,
      text: c.text,
      dateText: c.date ? spelledDate(c.date, ctx.lang) : undefined,
      mediaId: c.mediaId,
      emoji: c.emoji || cat?.emoji || KIND_META[c.kind].emoji,
      color: c.color ?? cat?.color,
      frame: c.frame,
      font: c.font,
      stickers: c.stickers,
      rating: c.rating,
      createdAt: c.createdAt,
      own: true,
      subtitle: c.fromName ? `${ctx.lang === 'en' ? 'from' : 'von'} ${c.fromName}` : undefined,
    };
  });
  const rawOwnRarity: Record<string, CardModel['rarity']> = {};
  ownCardsRepo.getAll().forEach((c) => {
    rawOwnRarity[`own:${c.id}`] = c.rarity;
  });

  const refl: Draft[] = reflexionCardsRepo.getAll().map((r) => ({
    key: `reflexion:${r.id}`,
    kind: 'reflexion',
    title: r.title,
    dateText: spelledDate(r.date, ctx.lang),
    mediaId: r.mediaId,
    emoji: '🌙',
    background: r.background,
    createdAt: r.createdAt,
    own: true,
    sections: reflexionSections(r, ctx.lang),
    stats: [
      ...(r.energy ? [{ label: ctx.lang === 'en' ? 'Energy' : 'Energie', value: '⚡'.repeat(r.energy) }] : []),
      ...(r.comfort ? [{ label: ctx.lang === 'en' ? 'Comfort' : 'Wohlgefühl', value: '★'.repeat(r.comfort) }] : []),
    ],
  }));
  refl.forEach((d) => {
    const id = d.key.slice('reflexion:'.length);
    rawOwnRarity[d.key] = reflexionCardsRepo.getById(id)?.rarity ?? 'normal';
  });

  const all = [...drafts, ...ownDrafts, ...refl];
  const nums = assignNumbers(all.map((d) => ({ key: d.key, createdAt: d.createdAt })));
  return all
    .filter((d) => !prefs.hidden.includes(d.key))
    .map((d) => ({
      ...d,
      color: d.color ?? colorForKind(d.kind, prefs),
      number: nums[d.key] ?? 0,
      rarity: prefs.rarity[d.key] ?? rawOwnRarity[d.key] ?? 'normal',
    }))
    .sort((a, b) => a.number - b.number);
}

export function reflexionSections(r: import('./cardTypes').ReflexionCard, lang: 'de' | 'en'): { label: string; text: string }[] {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const s: { label: string; text: string }[] = [];
  if (r.usedResources.length) s.push({ label: L('Genutzt', 'Used'), text: r.usedResources.join(' · ') });
  if (r.gardenGrew) s.push({ label: L('Mein Garten', 'My garden'), text: L('ist gewachsen 🌱', 'has grown 🌱') });
  if (r.feelings.length) s.push({ label: L('Gefühle', 'Feelings'), text: r.feelings.join(', ') });
  if (r.needs.length) s.push({ label: L('Bedürfnisse', 'Needs'), text: r.needs.join(', ') });
  if (r.values.length) s.push({ label: L('Werte', 'Values'), text: r.values.join(', ') });
  if (r.achieved.length) s.push({ label: L('Heute geschafft', 'Managed today'), text: r.achieved.join(' · ') });
  if (r.grateful?.trim()) s.push({ label: L('Dankbar für', 'Grateful for'), text: r.grateful.trim() });
  if (r.highlight?.trim()) s.push({ label: L('Highlight', 'Highlight'), text: r.highlight.trim() });
  if (r.learned?.trim()) s.push({ label: L('Das hab ich gelernt', 'What I learned'), text: r.learned.trim() });
  if (r.saying?.trim()) s.push({ label: L('Für heute', 'For today'), text: `„${r.saying.trim()}“` });
  return s;
}
