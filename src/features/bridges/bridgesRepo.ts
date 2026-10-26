import { createRepository } from '../../services/storage/repository';
import type { Bridge } from '../../data/types';
import { DEMO_BRIDGES } from '../../data/seed/bridges.seed';
import { BRIDGES_EN } from '../../data/seed/bridges.en';
import { getUiLanguage } from '../../services/uiLanguage';
import { LEGACY_CATEGORY_MIGRATION } from './bridgeMeta';
import { migrateAccessChannelValues } from '../zugangskanaele/accessChannels';

const baseRepo = createRepository<Bridge>('bridges');

/** the example bridges are stored in German; unchanged texts are SHOWN in English in English mode and never stored as English (see resourcesRepo) */
const SEED_DE = new Map(DEMO_BRIDGES.map((b) => [b.id, b]));

function swap(b: Bridge, to: 'en' | 'de'): Bridge {
  const de = SEED_DE.get(b.id);
  const en = BRIDGES_EN[b.id];
  if (!de || !en) return b;
  const from = to === 'en' ? de : en;
  const dest = to === 'en' ? en : de;
  const pick = (cur: string | undefined, a: string | undefined, z: string | undefined) => (cur === a ? z ?? cur : cur);
  const levels = b.levels.map((l, i) => {
    const fl = (from.levels as { title: string; description?: string }[])[i];
    const dl = (dest.levels as { title: string; description?: string }[])[i];
    if (!fl || !dl) return l;
    return { ...l, title: pick(l.title, fl.title, dl.title) as string, description: pick(l.description, fl.description, dl.description) as string };
  });
  return {
    ...b,
    title: pick(b.title, from.title, dest.title) as string,
    description: pick(b.description, from.description, dest.description) as string,
    tip: pick(b.tip, from.tip, dest.tip),
    levels,
  };
}
const showBridge = (b: Bridge) => (getUiLanguage() === 'en' ? swap(b, 'en') : b);

export const bridgesRepo = {
  ...baseRepo,
  getAll: () => baseRepo.getAll().map(showBridge),
  getById: (id: string) => {
    const b = baseRepo.getById(id);
    return b ? showBridge(b) : undefined;
  },
  save: (b: Bridge) => showBridge(baseRepo.save(swap(b, 'de'))),
  trySave: (b: Bridge) => baseRepo.trySave(swap(b, 'de')),
  replaceAll: (items: Bridge[]) => baseRepo.replaceAll(items.map((b) => swap(b, 'de'))),
};

/** Called once on app start so a first-time user sees real example content. */
export function seedBridgesIfEmpty() {
  bridgesRepo.seedIfEmpty(DEMO_BRIDGES);
}

/**
 * "Bruecken-Weiterleitung geht immer noch nicht"-Auftrag — the real
 * cause: seedBridgesIfEmpty() only ever runs on a completely empty
 * repository, so anyone with an existing installation (like this
 * one) never received the 18 new exercise bridges added later —
 * clicking their "Soforthilfe" suggestion correctly named the
 * exercise, but no matching bridge actually existed in THIS
 * person's own data, hence "Brücke nicht gefunden". Same pattern as
 * patchKnownDemoContentIssues() below: runs on every app start,
 * only ADDS whichever specific demo bridge ids are missing from the
 * person's existing data, never touches or duplicates anything else
 * (including a same-id bridge the person may have customized).
 */
export function addMissingDemoBridges() {
  const existingIds = new Set(bridgesRepo.getAll().map((b) => b.id));
  DEMO_BRIDGES.filter((b) => !existingIds.has(b.id)).forEach((b) => bridgesRepo.save(b));
}

/**
 * "Bruecken-Kategorien komplett neu ordnen"-Auftrag — critical
 * migration step. Without this, every EXISTING bridge (both demo
 * content and anything the person created themselves) would keep its
 * old category value (zu_mir/zum_koerper/zu_anderen/nach_aussen),
 * which no longer exists as a tab in the new eleven-category UI —
 * the bridge wouldn't be deleted, but it would become invisible in
 * every category view, which is exactly the kind of silent data loss
 * the person has repeatedly and explicitly asked never to happen
 * again. Runs once per bridge (checks LEGACY_CATEGORY_MIGRATION has
 * an entry for the stored value), safe to call on every app start —
 * bridges already migrated simply have no matching legacy key and are
 * left untouched.
 */
export function migrateBridgeCategoriesIfNeeded() {
  const all = bridgesRepo.getAll();
  all.forEach((bridge) => {
    const migrated = LEGACY_CATEGORY_MIGRATION[bridge.category];
    if (migrated) {
      bridgesRepo.save({ ...bridge, category: migrated });
    }
  });
}

/**
 * "Zugangskanäle & Zugänglichkeit, Schritt 2"-Fund — the type-level
 * rename from sensoryModalities to accessChannels leaves any
 * ALREADY-STORED bridge with its old data sitting under a field name
 * the app no longer reads — not lost, just invisible, which looks
 * exactly like data loss to the person who tagged it. Runs once per
 * bridge; reads the raw stored value (untyped, since the field no
 * longer exists on Bridge) rather than assuming every stored record
 * matches the current type shape.
 */
export function migrateBridgeAccessChannelsIfNeeded() {
  const all = bridgesRepo.getAll();
  all.forEach((bridge) => {
    const raw = bridge as unknown as { sensoryModalities?: string[] };
    if (raw.sensoryModalities && raw.sensoryModalities.length > 0 && (!bridge.accessChannels || bridge.accessChannels.length === 0)) {
      const { sensoryModalities: _old, ...rest } = raw as { sensoryModalities?: string[] } & Bridge;
      void _old;
      bridgesRepo.save({ ...rest, accessChannels: migrateAccessChannelValues(raw.sensoryModalities) });
    }
  });
}

/**
 * Targeted, one-time content fix for people who already had the demo
 * bridges saved before a copy correction: "Atem anhalten" mislabeled a
 * breathing exercise as breath-holding, and two demo bridges were missing
 * their tip entirely. seedIfEmpty() alone wouldn't reach existing installs,
 * so this patches those specific known-bad values by id if still present —
 * it never touches anything the person customized themselves.
 */
export function patchKnownDemoContentIssues() {
  const all = bridgesRepo.getAll();
  const demoById = new Map(DEMO_BRIDGES.map((b) => [b.id, b]));

  all.forEach((bridge) => {
    const demo = demoById.get(bridge.id);
    if (!demo || bridge.isCustom) return;

    const needsTitleFix = bridge.id === 'bridge_atem' && bridge.title === 'Atem anhalten';
    const needsTipFix = !bridge.tip && demo.tip;

    if (needsTitleFix || needsTipFix) {
      bridgesRepo.save({
        ...bridge,
        title: needsTitleFix ? demo.title : bridge.title,
        tip: needsTipFix ? demo.tip : bridge.tip,
      });
    }
  });
}
