import type { ResourceCategory } from '../../data/types';
import { SKILL_CATEGORY_ZONE_COLOR, RESOURCE_CATEGORY_TO_GROUP } from '../../features/resources/resourceMeta';
import { BRIDGE_CATEGORY_META } from '../../features/bridges/bridgeMeta';

/** One source for the colours of resources / bridges: skills use the colour of the
 * arousal zone they belong to (Stresstoleranz = Hyperarousal red …), the rest the
 * colour of their group. Used by ItemTile and by the symbol pictures of the examples. */
export const RESOURCE_GROUP_COLOR: Record<string, string> = {
  faehigkeiten: '#c9522f',
  hilfsmittel: '#4a9d8f',
  orte_gruppe: '#4a6fa5',
  aktivitaeten: '#e8a83d',
};
export const BRIDGE_GROUP_COLOR: Record<string, string> = {
  intrapersonell: '#8fae3d',
  interpersonell: '#d17a9a',
  temporal: '#9a7bc4',
  transzendent: '#4a6fa5',
};
export const NEUTRAL_COLOR = '#9a948a';

/** colour of a built-in resource category (custom categories are handled by ItemTile) */
export function builtInResourceColor(category: ResourceCategory | string): string | undefined {
  const skill = SKILL_CATEGORY_ZONE_COLOR[category as ResourceCategory];
  if (skill) return skill;
  const group = RESOURCE_CATEGORY_TO_GROUP[category as ResourceCategory];
  return group ? RESOURCE_GROUP_COLOR[group] : undefined;
}
export function builtInBridgeColor(category: string): string {
  const meta = (BRIDGE_CATEGORY_META as Record<string, { group: string } | undefined>)[category];
  return (meta && BRIDGE_GROUP_COLOR[meta.group]) || '#8fae3d';
}
