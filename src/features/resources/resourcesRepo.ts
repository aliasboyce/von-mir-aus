import { createRepository } from '../../services/storage/repository';
import { SEED_SKILL_ZONES } from '../../content/seedSkillZones';
import type { Resource } from '../../data/types';
import { DEMO_RESOURCES, DBT_SKILL_RESOURCES, STARTER_AKTIVITAETEN } from '../../data/seed/resources.seed';
import { RESOURCES_EN } from '../../data/seed/resources.en';
import { getUiLanguage } from '../../services/uiLanguage';
import { migrateAccessChannelValues } from '../zugangskanaele/accessChannels';

const baseRepo = createRepository<Resource>('resources');

/**
 * The starter library is stored in German. In English mode the unchanged starter texts are SHOWN in English;
 * whatever the person edited stays exactly as written, and nothing English is ever written back over the German
 * original (save() swaps unchanged English texts back before storing).
 */
const SEED_DE = new Map<string, { title: string; description?: string }>();
[...DBT_SKILL_RESOURCES, ...DEMO_RESOURCES, ...STARTER_AKTIVITAETEN].forEach((r) => SEED_DE.set(r.id, { title: r.title, description: r.description }));

function showResource(r: Resource): Resource {
  if (getUiLanguage() !== 'en') return r;
  const de = SEED_DE.get(r.id);
  const en = RESOURCES_EN[r.id];
  if (!de || !en) return r;
  const title = r.title === de.title ? en.title : r.title;
  const description = r.description === de.description ? en.description : r.description;
  return title === r.title && description === r.description ? r : { ...r, title, description };
}

function storeResource(r: Resource): Resource {
  const de = SEED_DE.get(r.id);
  const en = RESOURCES_EN[r.id];
  if (!de || !en) return r;
  const title = r.title === en.title ? de.title : r.title;
  const description = r.description === en.description ? de.description : r.description;
  return title === r.title && description === r.description ? r : { ...r, title, description };
}

export const resourcesRepo = {
  ...baseRepo,
  getAll: () => baseRepo.getAll().map(showResource),
  getById: (id: string) => {
    const r = baseRepo.getById(id);
    return r ? showResource(r) : undefined;
  },
  save: (r: Resource) => showResource(baseRepo.save(storeResource(r))),
  trySave: (r: Resource) => baseRepo.trySave(storeResource(r)),
  replaceAll: (items: Resource[]) => baseRepo.replaceAll(items.map(storeResource)),
};

let resourcesReady = false;
/**
 * The starter resources used to be created only when the Resources page's
 * chunk was first loaded. Anything else that reads them before that — the
 * safety plan's skill picker, the roadmap, the network's linking, the
 * calendar — saw an EMPTY list on a fresh install. Called once at app
 * start (services/migrations.ts) so every page sees the same data.
 */
export function ensureResourcesReady() {
  if (resourcesReady) return;
  resourcesReady = true;
  seedResourcesIfEmpty();
  migrateResourceAccessChannelsIfNeeded();
  addMissingDbtSkills();
  patchKnownSkillCategoryIssues();
  assignDefaultZoneIdsToSkills();
}

export function seedResourcesIfEmpty() {
  resourcesRepo.seedIfEmpty(DEMO_RESOURCES);
}

/**
 * "Die 4 klassischen Basis-Module"-Auftrag — seedResourcesIfEmpty()
 * only ever runs on a completely empty store, so it alone wouldn't
 * reach anyone who already has resources saved (which, after this
 * many sessions, is everyone). Same addMissingDemoBridges() pattern
 * from bridgesRepo.ts: adds each new DBT skill by its fixed id only
 * if not already present, safe to call on every app start, and never
 * touches anything the person customised or deleted themselves — if
 * someone deliberately removes one of these, it was theirs to remove.
 */
export function addMissingDbtSkills() {
  const existingIds = new Set(resourcesRepo.getAll().map((r) => r.id));
  DBT_SKILL_RESOURCES.filter((r) => !existingIds.has(r.id)).forEach((r) => resourcesRepo.save(r));
}

/**
 * "Die 5-4-3-2-1-Methode gehoert nicht in Innere Achtsamkeit"-Fund —
 * addMissingDbtSkills() only ever adds a skill once by id, so a
 * category correction to the seed data alone would never reach
 * anyone who already has the old category saved. Targeted, idempotent
 * fix for this one known-wrong category, same spirit as
 * patchKnownDemoContentIssues() in bridgesRepo.ts — only touches the
 * one resource if its category is still the old, wrong value, leaves
 * anything the person customised on it (title, description, own
 * notes) untouched.
 */
export function patchKnownSkillCategoryIssues() {
  const r = resourcesRepo.getById('res_skill_54321');
  if (r && r.category === 'achtsamkeit') {
    resourcesRepo.save({ ...r, category: 'stresstoleranz' });
  }
}

/**
 * "Soll auch genau bei denen fuer diesen Bereich landen"-Auftrag —
 * the zone link (NervousSystemLadderSlider.tsx) now filters by
 * skillDetails.zoneIds, but every skill saved before this feature
 * existed (all 40 from the seed data) has no zoneIds at all. The
 * filter itself is inclusive toward untagged items (see ResourcesPage
 * .tsx's inTypeScope), so nothing becomes invisible — but without this
 * migration the filter would do nothing for existing content. Assigns
 * a sensible default zone per category, the same mapping already used
 * for SKILL_CATEGORY_ZONE_COLOR in resourceMeta.ts (Stresstoleranz ->
 * Hyperarousal, Emotionsregulation -> Fruehwarnbereich, etc.) so a
 * skill's default zone tag always matches its own chip color. Only
 * touches skills with NO zoneIds yet — anything the person already
 * tagged themselves, including by explicitly clearing it, is left
 * alone.
 */
const DEFAULT_ZONE_BY_SKILL_CATEGORY: Record<string, string> = {
  achtsamkeit: 'zone3',
  zwischenmenschlich: 'zone2',
  emotionsregulation: 'zone4',
  stresstoleranz: 'zone5',
  mittelweg: 'zone1',
};

const ACUTE_EXERCISE_IDS = ['res_skill_478_atmung', 'res_skill_36_bauchatmung', 'res_skill_gaehn_impuls', 'res_skill_grounding_54321', 'res_skill_peripheres_sehen', 'res_skill_box_atmung'];

export function assignDefaultZoneIdsToSkills() {
  resourcesRepo.getAll().forEach((r) => {
    if (r.skillDetails?.zoneIds) return;
    const defaultZone = DEFAULT_ZONE_BY_SKILL_CATEGORY[r.category];
    if (!defaultZone) return;
    // acute breathing/body exercises are used from the Fruehwarnbereich on
    const zoneIds = SEED_SKILL_ZONES[r.id] ?? (ACUTE_EXERCISE_IDS.includes(r.id) ? ['zone4', 'zone5'] : [defaultZone]);
    resourcesRepo.save({ ...r, skillDetails: { ...r.skillDetails, zoneIds } });
  });
}

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 2"-Fund — same gap as
 * migrateBridgeAccessChannelsIfNeeded in bridgesRepo.ts: a resource
 * tagged under the old, narrower sensoryModalities field would have
 * its tags silently stop showing once the app only reads
 * accessChannels, unless this runs once to carry them over.
 */
export function migrateResourceAccessChannelsIfNeeded() {
  const all = resourcesRepo.getAll();
  all.forEach((resource) => {
    const raw = resource as unknown as { sensoryModalities?: string[] };
    if (raw.sensoryModalities && raw.sensoryModalities.length > 0 && (!resource.accessChannels || resource.accessChannels.length === 0)) {
      const { sensoryModalities: _old, ...rest } = raw as { sensoryModalities?: string[] } & Resource;
      void _old;
      resourcesRepo.save({ ...rest, accessChannels: migrateAccessChannelValues(raw.sensoryModalities) });
    }
  });
}
