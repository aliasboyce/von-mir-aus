import { createDismissibleListManager } from '../../services/dismissibleListManager';
import { NEW_PROTECTION_STRATEGIES_DE, OBSTACLES_DE } from '../zugang/zugangContent';
import { gardenRepo } from '../garden/gardenRepo';
import { routinesRepo } from '../routines/routinesRepo';

/**
 * One strategy = one entry. A new protection strategy lives on the Schutzstrategien page, can have its own plant in the garden
 * and can be (or be part of) a routine – these are all the same thing seen from different places, never copies.
 * Gardens and routines point at it by name (`newStrategy`), the old strategy they replace by `alternativeFor`,
 * the obstacle they help with by `forObstacle`.
 */

/** make sure a new strategy shows up in the Schutzstrategien list (no duplicates, ready-made names stay as they are) */
export function registerNewStrategy(name: string): void {
  const n = name.trim();
  if (!n) return;
  if (NEW_PROTECTION_STRATEGIES_DE.includes(n)) return;
  const m = createDismissibleListManager('neue-schutzstrategien');
  if (m.customItems().some((c) => c.text === n)) return;
  m.addCustom(n);
}

/** all obstacles the person sees (ready-made not dismissed + their own) */
export function allObstacles(): string[] {
  const m = createDismissibleListManager('hindernisse');
  return [...m.visibleBuiltins(OBSTACLES_DE), ...m.customItems().map((c) => c.text)];
}

export interface StrategyLinks {
  alternativeFor?: string;
  newStrategy?: string;
  forObstacle?: string;
}

/** everything in the garden and the routines that points at a given old strategy, new strategy or obstacle */
export function linkedItems(by: { old?: string; neu?: string; obstacle?: string }): { gardens: { id: string; name: string }[]; routines: { id: string; title: string }[] } {
  const gardens = gardenRepo
    .getAll()
    .filter((g) => (by.old && g.alternativeFor === by.old) || (by.neu && g.newStrategy === by.neu) || (by.obstacle && g.forObstacle === by.obstacle))
    .map((g) => ({ id: g.id, name: g.name }));
  const routines = routinesRepo
    .getAll()
    .filter((r) => (by.old && r.alternativeFor === by.old) || (by.neu && r.newStrategy === by.neu) || (by.obstacle && r.forObstacle === by.obstacle))
    .map((r) => ({ id: r.id, title: r.title }));
  return { gardens, routines };
}
