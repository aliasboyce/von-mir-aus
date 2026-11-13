import type { ResourceCategory } from '../../data/types';
import { RESOURCE_CATEGORY_TO_GROUP } from '../../features/resources/resourceMeta';
import { KIND_COLOR } from '../../features/resources/kindColors';
import { BRIDGE_CATEGORY_META } from '../../features/bridges/bridgeMeta';

/** One source for the colours of resources / bridges: skills use the colour of the
 * arousal zone they belong to (Stresstoleranz = Hyperarousal red …), the rest the
 * colour of their group. Used by ItemTile and by the symbol pictures of the examples. */
export const RESOURCE_GROUP_COLOR: Record<string, string> = {
  faehigkeiten: KIND_COLOR.faehigkeiten,
  hilfsmittel: KIND_COLOR.hilfsmittel,
  orte_gruppe: KIND_COLOR.orte,
  aktivitaeten: KIND_COLOR.aktivitaeten,
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
  // fixed colour per kind (Fähigkeiten, Hilfsmittel, Orte, Aktivitäten, Person) – the same in the network, on the pages and on the cards
  if (category === 'menschen') return KIND_COLOR.person;
  const group = RESOURCE_CATEGORY_TO_GROUP[category as ResourceCategory];
  return group ? RESOURCE_GROUP_COLOR[group] : undefined;
}
export function builtInBridgeColor(category: string): string {
  const meta = (BRIDGE_CATEGORY_META as Record<string, { group: string } | undefined>)[category];
  return (meta && BRIDGE_GROUP_COLOR[meta.group]) || '#8fae3d';
}
