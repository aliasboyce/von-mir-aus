import { createKeyValueStore } from './storage/keyValueStore';
import { resourcesRepo, ensureResourcesReady } from '../features/resources/resourcesRepo';
import { bridgesRepo } from '../features/bridges/bridgesRepo';
import { diaryRepo } from '../features/diary/diaryRepo';
import { effectiveDiaryCategory, DIARY_DEFAULT_CATEGORY_ID } from '../features/diary/diaryCategories';
import { networkRepo } from '../features/safetyNet/networkRepo';
import { networkCategoryFor } from '../features/safetyNet/networkResourceSync';
import { SEED_SKILL_ZONES } from '../content/seedSkillZones';
import { LEGACY_HILFSMITTEL_CATEGORY } from '../content/hilfsmittelCategories';

/**
 * One-time data migrations that must run once at app start, whatever
 * page the person opens first. Each one is guarded by its own flag, so
 * running them again is a no-op. Add new ones below and call them from
 * runStartupMigrations().
 */
const energyV2 = createKeyValueStore<boolean>('migration-energy-4-levels', false);

/** "4 statt 3 Energielevel": the old scale was 1 = sehr wenig, 2 = etwas,
 * 3 = geht gerade. The new one is 1 fast nichts, 2 wenig, 3 mittel,
 * 4 viel. 1 and 2 keep their number, the old top level becomes the new
 * top level (3 -> 4), so nothing saved as "geht gerade" turns into a
 * middle-of-the-road item. */
function migrateEnergyScale() {
  if (energyV2.get()) return;
  const bump = <T extends { energyLevel?: number }>(x: T): T => (x.energyLevel === 3 ? { ...x, energyLevel: 4 } : x);
  resourcesRepo.getAll().forEach((r) => {
    if (r.energyLevel === 3) resourcesRepo.save(bump(r));
  });
  bridgesRepo.getAll().forEach((b) => {
    if (b.levels?.some((l) => l.energyLevel === 3)) bridgesRepo.save({ ...b, levels: b.levels.map(bump) });
  });
  energyV2.set(true);
}

const hilfsmittelV2 = createKeyValueStore<boolean>('migration-hilfsmittel-categories-v2', false);

/** Acute breathing / body exercises that had been filed under "Achtsamkeit"
 * (colour: Fokus & Flow, i.e. calm everyday presence) although they are
 * used when tension is already up — they belong to Stresstoleranz (colour:
 * Hyperarousal), just like 5-4-3-2-1 was moved earlier. */
const MOVE_TO_STRESSTOLERANZ = ['res_skill_478_atmung', 'res_skill_36_bauchatmung', 'res_skill_gaehn_impuls', 'res_skill_grounding_54321', 'res_skill_peripheres_sehen', 'res_skill_box_atmung'];

/** "Hilfsmittel nur noch diese Kategorien" + "Skills gehoeren nicht zu
 * Hilfsmittel" + "Skills in die richtigen Fenster/Farben": (1) the six
 * acute exercises move to Stresstoleranz with the zones where they are
 * used (Fruehwarnbereich and Hyperarousal); (2) a leftover generic
 * 'uebungen' item is an exercise, so it goes to the Skills (Achtsamkeit)
 * instead of showing under Hilfsmittel; (3) the old standalone media /
 * nature / misc categories are filed under their new category. */
function migrateHilfsmittelAndSkills() {
  if (hilfsmittelV2.get()) return;
  resourcesRepo.getAll().forEach((r) => {
    if (MOVE_TO_STRESSTOLERANZ.includes(r.id) && r.category === 'achtsamkeit') {
      const zoneIds = r.skillDetails?.zoneIds;
      const untouched = !zoneIds || (zoneIds.length === 1 && zoneIds[0] === 'zone3');
      resourcesRepo.save({ ...r, category: 'stresstoleranz', skillDetails: { ...r.skillDetails, zoneIds: untouched ? ['zone4', 'zone5'] : zoneIds } });
      return;
    }
    if (r.category === 'uebungen') {
      resourcesRepo.save({ ...r, category: 'achtsamkeit' });
      return;
    }
    const legacy = LEGACY_HILFSMITTEL_CATEGORY[r.category];
    if (legacy) resourcesRepo.save({ ...r, category: legacy.category, subcategory: legacy.sub ?? r.subcategory });
  });
  hilfsmittelV2.set(true);
}

const diaryReviewV1 = createKeyValueStore<boolean>('migration-diary-in-review-v1', false);

/** Until now every general diary entry showed up in the reviews
 * automatically. With the new per-entry switch, entries that were already
 * visible there keep that (flag set once); from now on it is the
 * person's choice for each new entry. */
function migrateDiaryReviewFlag() {
  if (diaryReviewV1.get()) return;
  diaryRepo.getAll().forEach((d) => {
    if (d.inReview === undefined && effectiveDiaryCategory(d.categoryId) === DIARY_DEFAULT_CATEGORY_ID) diaryRepo.save({ ...d, inReview: true });
  });
  diaryReviewV1.set(true);
}

const networkRolesV1 = createKeyValueStore<boolean>('migration-network-roles-v1', false);

/** Network roles are now Person, Ressource, Hilfsmittel, Ort: the stored
 * category list swaps 'aktivitaet' for 'hilfsmittel', old 'aktivitaet'
 * nodes become 'ressource', and nodes created from a favorite resource
 * get the role that matches the resource they are linked to. */
function migrateNetworkRoles() {
  if (networkRolesV1.get()) return;
  const catStore = createKeyValueStore<{ id: string; label: string; color: string; iconKey?: string; isCustom?: boolean }[]>('network-categories', []);
  const cats = catStore.get() ?? [];
  if (cats.length > 0) {
    let next = cats.filter((c) => c.id !== 'aktivitaet');
    if (!next.some((c) => c.id === 'hilfsmittel')) next = [...next.slice(0, 2), { id: 'hilfsmittel', label: 'Hilfsmittel', color: '#E8C27E', iconKey: 'sparkles', isCustom: false }, ...next.slice(2)];
    catStore.set(next);
  }
  networkRepo.getAll().forEach((e) => {
    const linked = e.linkedResourceId ? resourcesRepo.getById(e.linkedResourceId) : undefined;
    if (linked && (e.category === 'ressource' || e.category === 'aktivitaet')) networkRepo.save({ ...e, category: networkCategoryFor(linked) });
    else if (e.category === 'aktivitaet') networkRepo.save({ ...e, category: 'ressource' });
  });
  networkRolesV1.set(true);
}

const seedSkillsV3 = createKeyValueStore<boolean>('migration-seed-items-are-skills-v3', false);

/** The four starter items (Sanftes Piano, Atem holen, Waldspaziergang,
 * Waermequelle) are skills, not Hilfsmittel — each is a thing you DO to
 * regulate (listen, breathe, walk, warm yourself), so they belong to the
 * DBT module whose zone they are used in. Moved regardless of where the
 * earlier category clean-up had put them, with their zone tags; a zone
 * list the person already edited is left alone. */
const SEED_SKILL_HOME: Record<string, { category: string; zones: string[] }> = {
  res_waldspaziergang: { category: 'emotionsregulation', zones: ['zone4'] },
  res_klavier: { category: 'stresstoleranz', zones: ['zone4', 'zone5'] },
  res_atemzitat: { category: 'achtsamkeit', zones: ['zone3'] },
  res_waermequelle: { category: 'stresstoleranz', zones: ['zone4', 'zone5', 'zone6'] },
};
function migrateSeedItemsToSkills() {
  if (seedSkillsV3.get()) return;
  Object.entries(SEED_SKILL_HOME).forEach(([id, home]) => {
    const r = resourcesRepo.getById(id);
    if (!r) return;
    resourcesRepo.save({ ...r, category: home.category, subcategory: undefined, skillDetails: { ...r.skillDetails, zoneIds: r.skillDetails?.zoneIds ?? home.zones } });
    // a network node made from it follows: skills are 'Ressource' there
    networkRepo.getAll().filter((e) => e.linkedResourceId === id).forEach((e) => networkRepo.save({ ...e, category: 'ressource' }));
  });
  seedSkillsV3.set(true);
}

const seedZonesV4 = createKeyValueStore<boolean>('migration-seed-skill-zones-v4', false);

/** Gives the starter skills their zone-6 (Rueckzug) tags, but only where the
 * zones still equal what the app assigned automatically. */
function migrateSeedSkillZones() {
  if (seedZonesV4.get()) return;
  const sameAs = (a: string[] | undefined, b: string[]) => !!a && a.length === b.length && a.every((z) => b.includes(z));
  Object.entries(SEED_SKILL_ZONES).forEach(([id, zones]) => {
    const r = resourcesRepo.getById(id);
    if (!r) return;
    const cur = r.skillDetails?.zoneIds;
    const untouched = !cur || sameAs(cur, ['zone5']) || sameAs(cur, ['zone4', 'zone5']) || sameAs(cur, ['zone4', 'zone5', 'zone6']);
    if (untouched) resourcesRepo.save({ ...r, skillDetails: { ...r.skillDetails, zoneIds: zones } });
  });
  seedZonesV4.set(true);
}

export function runStartupMigrations() {
  ensureResourcesReady();
  migrateEnergyScale();
  migrateHilfsmittelAndSkills();
  migrateDiaryReviewFlag();
  migrateNetworkRoles();
  migrateSeedItemsToSkills();
  migrateSeedSkillZones();
}
