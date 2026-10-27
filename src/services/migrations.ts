import { storageAdapter } from './storage/StorageAdapter';
import { createKeyValueStore } from './storage/keyValueStore';
import { resourcesRepo, ensureResourcesReady } from '../features/resources/resourcesRepo';
import { bridgesRepo } from '../features/bridges/bridgesRepo';
import { diaryRepo } from '../features/diary/diaryRepo';
import { effectiveDiaryCategory, DIARY_DEFAULT_CATEGORY_ID } from '../features/diary/diaryCategories';
import { networkRepo } from '../features/safetyNet/networkRepo';
import { networkCategoryFor } from '../features/safetyNet/networkResourceSync';
import { SEED_SKILL_ZONES } from '../content/seedSkillZones';
import { LEGACY_HILFSMITTEL_CATEGORY } from '../content/hilfsmittelCategories';
import { SEED_SKILL_FIT, seedFitFor } from '../content/seedSkillFit';
import { ensureUmstaendeSeeded, type UmstandOption } from '../features/bridges/conditions';
import { DEMO_BRIDGES } from '../data/seed/bridges.seed';
import { DEMO_NETWORK } from '../data/seed/network.seed';
import { STARTER_AKTIVITAETEN, DEMO_RESOURCES, DBT_SKILL_RESOURCES } from '../data/seed/resources.seed';
import { RESOURCE_IMPULSES } from '../data/seed/resourceImpulses.seed';
import { BRIDGE_IMPULSES } from '../data/seed/bridgeImpulses.seed';
import { routinesRepo, exampleRoutines } from '../features/routines/routinesRepo';
import { valuesForLegacyCategory } from '../features/bridges/bridgeValues';

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

const seedFitV2 = createKeyValueStore<boolean>('migration-seed-skill-fit-v2', false);

const LEGACY_INNER: Record<string, string> = { gefuehle: 'fuehlen', erinnerung: 'erinnerung', denken: 'denken' };
const LEGACY_OUTER: Record<string, string> = { menschen: 'beziehung', ort: 'ort_zeit', raum: 'ort_zeit' };

/** "Was geht gerade?": (1) an earlier version stored "inner/outer" needs inside `fit`;
 * those are now the Zugangskanäle, so they are carried over into accessChannels
 * (only where none are set) and removed from `fit`. (2) The starter skills get
 * their starting markings (Energie, Zeit, Aufwand, Zugangskanäle) — once, and only
 * into fields that are still empty, so nothing the person entered is overwritten. */
function migrateSeedSkillFit() {
  if (seedFitV2.get()) return;
  resourcesRepo.getAll().forEach((r) => {
    const raw = (r.fit ?? {}) as { minutes?: number; effort?: 1 | 2 | 3; inner?: string[]; outer?: string[] };
    if (!raw.inner && !raw.outer) return;
    const legacy = [...(raw.inner ?? []).map((n) => LEGACY_INNER[n]), ...(raw.outer ?? []).map((n) => LEGACY_OUTER[n])].filter(Boolean);
    const fit = { ...(raw.minutes !== undefined ? { minutes: raw.minutes } : {}), ...(raw.effort !== undefined ? { effort: raw.effort } : {}) };
    const channels = (r.accessChannels?.length ?? 0) > 0 ? r.accessChannels : (Array.from(new Set(legacy)) as typeof r.accessChannels);
    resourcesRepo.save({ ...r, fit: Object.keys(fit).length > 0 ? fit : undefined, accessChannels: channels });
  });
  Object.keys(SEED_SKILL_FIT).forEach((id) => {
    const r = resourcesRepo.getById(id);
    const seed = seedFitFor(id);
    if (!r || !seed) return;
    resourcesRepo.save({
      ...r,
      energyLevel: r.energyLevel ?? seed.energyLevel,
      fit: r.fit ?? seed.fit,
      accessChannels: (r.accessChannels?.length ?? 0) > 0 ? r.accessChannels : seed.accessChannels,
    });
  });
  seedFitV2.set(true);
}

const umstaendeV2 = createKeyValueStore<boolean>('migration-umstaende-global-v2', false);

/** Umstände are one global saved list now (no longer resources under Orte). The earlier,
 * short-lived Orte → "Umstände & Bedingungen" entries are carried over into that list with
 * the SAME key a bridge stored for them (old condition id, or the resource id), then removed
 * from the Orte so nothing appears twice. */
function migrateUmstaendeToGlobalList() {
  if (umstaendeV2.get()) return;
  const old = resourcesRepo.getAll().filter((r) => r.category === 'orte' && r.subcategory === 'umstaende');
  const extra: UmstandOption[] = old.map((r) => ({
    key: r.id.startsWith('res_umstand_') ? r.id.slice('res_umstand_'.length) : r.id,
    label: r.title,
    emoji: '🧩',
  }));
  ensureUmstaendeSeeded(extra);
  old.forEach((r) => resourcesRepo.remove(r.id));
  umstaendeV2.set(true);
}

const aktivitaetenV1 = createKeyValueStore<boolean>('migration-seed-aktivitaeten-v1', false);

/** Aktivitäten & Beschäftigung is a new kind of resource — a few gentle starters, added once. */
function seedAktivitaeten() {
  if (aktivitaetenV1.get()) return;
  STARTER_AKTIVITAETEN.forEach((a) => {
    if (!resourcesRepo.getById(a.id)) resourcesRepo.save(a);
  });
  aktivitaetenV1.set(true);
}

const bridgeValuesV1 = createKeyValueStore<boolean>('migration-bridge-values-v1', false);

/** Bridges lead toward values / Lebensrichtungen now (the category tabs are gone). Older bridges that
 * only know a category get the values that category most likely stood for; the starter bridges get
 * their own values and the resources on their steps. Anything already set is left alone. */
function migrateBridgeValues() {
  if (bridgeValuesV1.get()) return;
  const demo = new Map(DEMO_BRIDGES.map((b) => [b.id, b]));
  bridgesRepo.getAll().forEach((b) => {
    const d = demo.get(b.id);
    let next = b;
    if (!b.connectionTags || b.connectionTags.length === 0) {
      const tags = d?.connectionTags ?? valuesForLegacyCategory(b.category);
      next = { ...next, connectionTags: tags, category: d && !b.isCustom ? d.category : next.category };
    }
    if (d && !b.isCustom) {
      next = { ...next, levels: next.levels.map((l, i) => (l.extras || !d.levels[i]?.extras ? l : { ...l, extras: d.levels[i].extras })) };
    }
    if (next !== b) bridgesRepo.save(next);
  });
  bridgeValuesV1.set(true);
}

const symbolImagesV1 = createKeyValueStore<boolean>('migration-seed-symbol-images-v1', false);

/** The ready-made skills, activities, bridges and adopted impulses used random stock photos that
 * did not match their subject. They now get a drawn picture with a fitting symbol in the colour of
 * their category. Only items that still carry such a stock photo are touched - own photos stay. */
function migrateSeedSymbolImages() {
  if (symbolImagesV1.get()) return;
  const isStock = (src?: string) => !!src && src.startsWith('https://picsum.photos/');
  const resById = new Map([...DEMO_RESOURCES, ...DBT_SKILL_RESOURCES, ...STARTER_AKTIVITAETEN].map((r) => [r.id, r.image]));
  const resByTitle = new Map(RESOURCE_IMPULSES.map((i) => [i.title, i.image]));
  resourcesRepo.getAll().forEach((r) => {
    const target = resById.get(r.id) ?? resByTitle.get(r.title);
    if (target && isStock(r.image)) resourcesRepo.save({ ...r, image: target });
  });
  const bridgeById = new Map(DEMO_BRIDGES.map((b) => [b.id, b.image]));
  const bridgeByTitle = new Map(BRIDGE_IMPULSES.map((i) => [i.title, i.image]));
  bridgesRepo.getAll().forEach((b) => {
    const target = bridgeById.get(b.id) ?? bridgeByTitle.get(b.title);
    if (target && isStock(b.image)) bridgesRepo.save({ ...b, image: target });
  });
  symbolImagesV1.set(true);
}

const networkExamplesV1 = createKeyValueStore<boolean>('migration-network-examples-v1', false);

/** The ready-made entries of the safety network are marked as examples now. Only those the person has not
 * changed (same name, role and category, no phone or e-mail) get the mark. */
function migrateNetworkExamples() {
  if (networkExamplesV1.get()) return;
  const demo = new Map(DEMO_NETWORK.map((e) => [e.id, e]));
  networkRepo.getAll().forEach((e) => {
    const d = demo.get(e.id);
    if (d && !e.isExample && e.name === d.name && e.role === d.role && e.category === d.category && !e.phone && !e.email && !e.description) {
      networkRepo.save({ ...e, isExample: true });
    }
  });
  networkExamplesV1.set(true);
}

const routineExamplesFlag = createKeyValueStore<boolean>('migration-routine-examples', false);

/** Two example routines (marked "Beispiel") so the new page is not empty on first look. */
function migrateRoutineExamples() {
  if (routineExamplesFlag.get()) return;
  const have = new Set(routinesRepo.getAll().map((r) => r.id));
  exampleRoutines().forEach((r) => {
    if (!have.has(r.id)) routinesRepo.save(r);
  });
  routineExamplesFlag.set(true);
}

const legacy3dFlag = createKeyValueStore<boolean>('migration-legacy-3d-v1', false);

/** Die 3D-Mindmap gibt es nicht mehr. Schon angelegte 3D-Karten verschwinden aus der Mindmap-Liste, werden aber nicht
 * gelöscht: Sie liegen unverändert in einem eigenen Speicherplatz (und in jeder Sicherung). */
function migrateLegacy3dMaps() {
  if (legacy3dFlag.get()) return;
  const all = storageAdapter.getItem<Record<string, unknown>[]>('mindmaps') ?? [];
  const old = all.filter((m) => m && (m as { kind?: string }).kind === '3d');
  if (old.length) {
    const kept = storageAdapter.getItem<unknown[]>('legacy-3d-maps') ?? [];
    if (storageAdapter.setItem('legacy-3d-maps', [...kept, ...old])) storageAdapter.setItem('mindmaps', all.filter((m) => !old.includes(m)));
    else return; // Speicher voll: beim nächsten Start noch einmal versuchen
  }
  legacy3dFlag.set(true);
}

export function runStartupMigrations() {
  migrateLegacy3dMaps();
  ensureResourcesReady();
  migrateEnergyScale();
  migrateHilfsmittelAndSkills();
  migrateDiaryReviewFlag();
  migrateNetworkRoles();
  migrateSeedItemsToSkills();
  migrateSeedSkillZones();
  migrateSeedSkillFit();
  migrateUmstaendeToGlobalList();
  seedAktivitaeten();
  migrateBridgeValues();
  migrateSeedSymbolImages();
  migrateNetworkExamples();
  migrateRoutineExamples();
}
