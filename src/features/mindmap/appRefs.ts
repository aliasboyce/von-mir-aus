import { resourcesRepo } from '../resources/resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';
import { resourceColor } from '../../components/shared/ItemTile';
import { createCustomCategoryStore } from '../../services/customCategories';
import { networkRepo } from '../safetyNet/networkRepo';
import { lettersRepo, describeLetter } from '../briefAnMich/lettersRepo';
import { projectsRepo } from '../projects/projectModel';
import { appointmentsRepo, calendarCategoriesRepo } from '../calendar/calendarRepo';
import type { RefKind, RefSnap } from './mindmapBlocks';
import type { MMNode } from './mindmapModel';

/**
 * Cards from the other parts of the app that can be put on a mind map
 * (skill, Hilfsmittel, Ressource, contact, letter, project, appointment).
 * The map keeps a small snapshot of each, so it still looks right when the original is gone.
 */

export const REF_KINDS: { id: RefKind; de: string; en: string; emoji: string }[] = [
  { id: 'skill', de: 'Skill', en: 'Skill', emoji: '🧘' },
  { id: 'tool', de: 'Hilfsmittel', en: 'Aid', emoji: '🧰' },
  { id: 'resource', de: 'Ressource', en: 'Resource', emoji: '🌿' },
  { id: 'contact', de: 'Kontakt', en: 'Contact', emoji: '🫂' },
  { id: 'letter', de: 'Brief', en: 'Letter', emoji: '✉️' },
  { id: 'project', de: 'Projekt', en: 'Project', emoji: '🎯' },
  { id: 'appointment', de: 'Termin', en: 'Appointment', emoji: '📅' },
];

const customCats = createCustomCategoryStore('resource-custom-categories');
const L = (lang: 'de' | 'en', de: string, en: string) => (lang === 'en' ? en : de);
export const refLabel = (kind: RefKind, lang: 'de' | 'en') => {
  const k = REF_KINDS.find((x) => x.id === kind)!;
  return lang === 'en' ? k.en : k.de;
};

/** skill = practised skills; resource = places & activities; tool = every other aid */
function resourceKind(r: { category: string }): RefKind {
  const group = RESOURCE_CATEGORY_TO_GROUP[r.category] ?? customCats.getAll().find((c) => c.id === r.category)?.group;
  if (group === 'faehigkeiten') return 'skill';
  if (r.category === 'orte' || r.category === 'aktivitaeten' || group === 'orte_gruppe' || group === 'aktivitaeten') return 'resource';
  return 'tool';
}
function resourceRoute(r: { category: string }): string {
  const group = RESOURCE_CATEGORY_TO_GROUP[r.category] ?? customCats.getAll().find((c) => c.id === r.category)?.group;
  if (group === 'faehigkeiten') return 'skills';
  if (r.category === 'orte' || group === 'orte_gruppe') return 'orte';
  if (r.category === 'aktivitaeten' || group === 'aktivitaeten') return 'aktivitaeten';
  return 'hilfsmittel';
}
const short = (s: string | undefined, n = 70) => {
  const t = (s ?? '').replace(/\s+/g, ' ').trim();
  return t.length > n ? `${t.slice(0, n - 1).trimEnd()}…` : t;
};
const dateText = (iso: string, lang: 'de' | 'en') => {
  const d = new Date(iso.length <= 10 ? `${iso}T12:00:00` : iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short', year: 'numeric' });
};

export interface RefItem {
  id: string;
  snap: RefSnap;
}

/** what is on offer for one kind of card */
export function listRefs(kind: RefKind, lang: 'de' | 'en'): RefItem[] {
  const label = refLabel(kind, lang);
  const emoji = REF_KINDS.find((x) => x.id === kind)!.emoji;
  switch (kind) {
    case 'skill':
    case 'tool':
    case 'resource':
      return resourcesRepo
        .getAll()
        .filter((r) => resourceKind(r) === kind)
        .map((r) => ({ id: r.id, snap: { title: r.title, sub: short(r.description), emoji, color: resourceColor(r.category), label } }));
    case 'contact':
      return networkRepo.getAll().map((c) => ({ id: c.id, snap: { title: c.name, sub: short(c.role || c.description), emoji, color: '#d17a9a', label } }));
    case 'letter':
      return lettersRepo
        .getAll()
        .slice()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .map((l) => ({ id: l.id, snap: letterSnap(l, lang) }));
    case 'project':
      return projectsRepo.getAll().filter((p) => !p.archived).map((p) => ({ id: p.id, snap: projectSnap(p, lang) }));
    case 'appointment':
      return appointmentsRepo
        .getAll()
        .slice()
        .sort((a, b) => `${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))
        .map((a) => ({ id: a.id, snap: apptSnap(a, lang) }));
  }
}

function letterSnap(l: ReturnType<typeof lettersRepo.getAll>[number], lang: 'de' | 'en'): RefSnap {
  const label = refLabel('letter', lang);
  const sealed = !l.opened && new Date(l.scheduledFor).getTime() > Date.now();
  const color = '#c98a4b';
  // a letter that is still closed stays closed – its words are not copied onto the map
  if (sealed) return { title: L(lang, 'Brief – noch verschlossen', 'Letter – still sealed'), sub: dateText(l.scheduledFor, lang), emoji: '✉️', color, label };
  const { body } = describeLetter(l);
  return { title: short(body.split('\n')[0], 60) || label, sub: dateText(l.createdAt, lang), emoji: '✉️', color, label };
}
function projectSnap(p: ReturnType<typeof projectsRepo.getAll>[number], lang: 'de' | 'en'): RefSnap {
  return { title: p.title, sub: short(p.summary), emoji: p.emoji || '🎯', color: p.color || '#4a8f9e', label: refLabel('project', lang) };
}
function apptSnap(a: ReturnType<typeof appointmentsRepo.getAll>[number], lang: 'de' | 'en'): RefSnap {
  const cat = a.categoryId ? calendarCategoriesRepo.getById(a.categoryId) : undefined;
  return { title: a.title, sub: `${dateText(a.date, lang)}${a.time ? ` · ${a.time}` : ''}`, emoji: '📅', color: cat?.color || '#4a6fa5', label: refLabel('appointment', lang) };
}

/** the current look of one card, or undefined when the original is gone */
export function currentSnap(kind: RefKind, id: string, lang: 'de' | 'en'): RefSnap | undefined {
  switch (kind) {
    case 'skill':
    case 'tool':
    case 'resource': {
      const r = resourcesRepo.getById(id);
      return r ? { title: r.title, sub: short(r.description), emoji: REF_KINDS.find((x) => x.id === kind)!.emoji, color: resourceColor(r.category), label: refLabel(kind, lang) } : undefined;
    }
    case 'contact': {
      const c = networkRepo.getById(id);
      return c ? { title: c.name, sub: short(c.role || c.description), emoji: '🫂', color: '#d17a9a', label: refLabel(kind, lang) } : undefined;
    }
    case 'letter': {
      const l = lettersRepo.getById(id);
      return l ? letterSnap(l, lang) : undefined;
    }
    case 'project': {
      const p = projectsRepo.getById(id);
      return p ? projectSnap(p, lang) : undefined;
    }
    case 'appointment': {
      const a = appointmentsRepo.getById(id);
      return a ? apptSnap(a, lang) : undefined;
    }
  }
}

/** where the original lives (undefined when it is gone) */
export function routeOfRef(kind: RefKind, id: string): string | undefined {
  switch (kind) {
    case 'skill':
    case 'tool':
    case 'resource': {
      const r = resourcesRepo.getById(id);
      return r ? `/entdecken/ressourcen/${resourceRoute(r)}?open=${id}` : undefined;
    }
    case 'contact':
      return networkRepo.getById(id) ? `/sicherheit/netzwerk?open=${id}` : undefined;
    case 'letter':
      return lettersRepo.getById(id) ? '/entdecken/brief-an-mich' : undefined;
    case 'project':
      return projectsRepo.getById(id) ? `/entdecken/projekte/${id}` : undefined;
    case 'appointment':
      return appointmentsRepo.getById(id) ? `/kalender/uebersicht?open=${id}` : undefined;
  }
}

const same = (a?: RefSnap, b?: RefSnap) => !!a && !!b && a.title === b.title && a.sub === b.sub && a.emoji === b.emoji && a.color === b.color && a.label === b.label;

/** when the map opens: cards whose original changed show the new state (gone originals stay as they were). Returns null when nothing changed. */
export function refreshSnaps(nodes: MMNode[], lang: 'de' | 'en'): MMNode[] | null {
  let changed = false;
  const out = nodes.map((n) => {
    if (n.shape !== 'appcard' || !n.ref) return n;
    const cur = currentSnap(n.ref.kind, n.ref.id, lang);
    if (!cur || same(cur, n.snap)) return n;
    changed = true;
    return { ...n, snap: cur };
  });
  return changed ? out : null;
}
