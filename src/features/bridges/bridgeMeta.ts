import type { BridgeCategory } from '../../data/types';
import type { TranslationDictionary } from '../../i18n/de';
import { Heart, Wind, BookOpen, Baby, Users, UsersRound, Trees, Clock3, History, Sparkles, Infinity as InfinityIcon } from 'lucide-react';

/**
 * "Bruecken-Kategorien komplett neu ordnen"-Auftrag — replaces the
 * flat four-category system (zu_mir/zum_koerper/zu_anderen/
 * nach_aussen) with the person's four-group, eleven-category
 * structure: connection inward (intrapersonal), connection outward
 * (interpersonal/systemic), connection through time (temporal), and
 * connection to something larger (transcendent). BridgeCategory's
 * type already permits arbitrary string values (`| string`), so this
 * is additive at the type level — existing stored bridges get their
 * old category value migrated to a matching new one (see
 * migrateBridgeCategoriesIfNeeded in bridgesRepo.ts), never silently
 * left in a category that no longer exists in the UI.
 */
export type BridgeCategoryGroupId = 'intrapersonell' | 'interpersonell' | 'temporal' | 'transzendent';

export const BRIDGE_CATEGORY_GROUP_META: Record<BridgeCategoryGroupId, { label: (t: TranslationDictionary) => string; hint: (t: TranslationDictionary) => string }> = {
  intrapersonell: { label: (t) => t.bridges.groupIntra, hint: (t) => t.bridges.groupIntraHint },
  interpersonell: { label: (t) => t.bridges.groupInter, hint: (t) => t.bridges.groupInterHint },
  temporal: { label: (t) => t.bridges.groupTemporal, hint: (t) => t.bridges.groupTemporalHint },
  transzendent: { label: (t) => t.bridges.groupTranszendent, hint: (t) => t.bridges.groupTranszendentHint },
};

export const BRIDGE_CATEGORY_META: Record<
  BridgeCategory,
  { label: (t: TranslationDictionary) => string; icon: typeof Heart; group: BridgeCategoryGroupId }
> = {
  koerper_intra: { label: (t) => t.bridges.categories.koerper_intra, icon: Wind, group: 'intrapersonell' },
  gefuehle_intra: { label: (t) => t.bridges.categories.gefuehle_intra, icon: Heart, group: 'intrapersonell' },
  gedanken_werte_intra: { label: (t) => t.bridges.categories.gedanken_werte_intra, icon: BookOpen, group: 'intrapersonell' },
  inneres_kind_intra: { label: (t) => t.bridges.categories.inneres_kind_intra, icon: Baby, group: 'intrapersonell' },
  menschen_inter: { label: (t) => t.bridges.categories.menschen_inter, icon: Users, group: 'interpersonell' },
  gemeinschaft_inter: { label: (t) => t.bridges.categories.gemeinschaft_inter, icon: UsersRound, group: 'interpersonell' },
  natur_inter: { label: (t) => t.bridges.categories.natur_inter, icon: Trees, group: 'interpersonell' },
  praesenz_inter: { label: (t) => t.bridges.categories.praesenz_inter, icon: Clock3, group: 'interpersonell' },
  vergangenheit_temporal: { label: (t) => t.bridges.categories.vergangenheit_temporal, icon: History, group: 'temporal' },
  zukunft_temporal: { label: (t) => t.bridges.categories.zukunft_temporal, icon: Sparkles, group: 'temporal' },
  transzendent: { label: (t) => t.bridges.categories.transzendent, icon: InfinityIcon, group: 'transzendent' },
};

export const BRIDGE_CATEGORY_ORDER: BridgeCategory[] = [
  'koerper_intra',
  'gefuehle_intra',
  'gedanken_werte_intra',
  'inneres_kind_intra',
  'menschen_inter',
  'gemeinschaft_inter',
  'natur_inter',
  'praesenz_inter',
  'vergangenheit_temporal',
  'zukunft_temporal',
  'transzendent',
];

export const BRIDGE_CATEGORY_GROUP_ORDER: BridgeCategoryGroupId = 'intrapersonell';
export const BRIDGE_CATEGORY_GROUPS_ORDER: BridgeCategoryGroupId[] = ['intrapersonell', 'interpersonell', 'temporal', 'transzendent'];

/** Old -> new category migration map. Chosen as the closest-fit new
 * sub-category for each old broad one, preserving the person's
 * existing categorization intent as closely as possible rather than
 * defaulting everything to one bucket. */
export const LEGACY_CATEGORY_MIGRATION: Record<string, BridgeCategory> = {
  zu_mir: 'gedanken_werte_intra',
  zum_koerper: 'koerper_intra',
  zu_anderen: 'menschen_inter',
  nach_aussen: 'natur_inter',
};
