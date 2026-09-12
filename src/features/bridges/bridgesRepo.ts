import { createRepository } from '../../services/storage/repository';
import type { Bridge } from '../../data/types';
import { DEMO_BRIDGES } from '../../data/seed/bridges.seed';
import { LEGACY_CATEGORY_MIGRATION } from './bridgeMeta';

export const bridgesRepo = createRepository<Bridge>('bridges');

/** Called once on app start so a first-time user sees real example content. */
export function seedBridgesIfEmpty() {
  bridgesRepo.seedIfEmpty(DEMO_BRIDGES);
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
