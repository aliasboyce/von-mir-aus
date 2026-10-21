import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { createId } from '../../services/storage/repository';
import { getOrderedKeys, setOrderedKeys } from '../../services/sectionOrder';
import { GROUNDING_STEPS, type GroundingStepContent } from './groundingContent';
import { OWN_TEXT_SOURCE } from './companionContentManagement';

export interface CustomGroundingStep {
  id: string;
  text: string;
  textEn: string;
  hasInput: boolean;
  source: string;
}

interface GroundingManagementState {
  deactivatedIds: string[];
  customSteps: CustomGroundingStep[];
}

const store = createKeyValueStore<GroundingManagementState>('grounding-management', {
  deactivatedIds: [],
  customSteps: [],
});

function read(): GroundingManagementState {
  return store.get() ?? { deactivatedIds: [], customSteps: [] };
}

export function isGroundingStepActive(id: string): boolean {
  return !read().deactivatedIds.includes(id);
}

export function setGroundingStepActive(id: string, active: boolean): void {
  const state = read();
  const next = active ? state.deactivatedIds.filter((d) => d !== id) : [...new Set([...state.deactivatedIds, id])];
  store.set({ ...state, deactivatedIds: next });
}

export function getCustomGroundingSteps(): CustomGroundingStep[] {
  return read().customSteps;
}

export function addCustomGroundingStep(step: { text: string; textEn: string; hasInput: boolean; source: string }): void {
  const state = read();
  const newStep: CustomGroundingStep = { id: createId('grounding-step'), ...step };
  store.set({ ...state, customSteps: [...state.customSteps, newStep] });
}

export function updateCustomGroundingStep(id: string, updates: Partial<Omit<CustomGroundingStep, 'id'>>): void {
  const state = read();
  store.set({ ...state, customSteps: state.customSteps.map((s) => (s.id === id ? { ...s, ...updates } : s)) });
}

export function removeCustomGroundingStep(id: string): void {
  const state = read();
  store.set({ ...state, customSteps: state.customSteps.filter((s) => s.id !== id) });
}

/** Swaps a custom step with its neighbor — the only reordering that
 * makes sense here (see groundingContent.ts's doc comment on why
 * built-in steps keep their fixed sequence): custom steps are always
 * inserted as a block right before the closing line, and can be moved
 * up/down only relative to each other. */
export function moveCustomGroundingStep(id: string, direction: 'up' | 'down'): void {
  const state = read();
  const idx = state.customSteps.findIndex((s) => s.id === id);
  if (idx === -1) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= state.customSteps.length) return;
  const next = [...state.customSteps];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  store.set({ ...state, customSteps: next });
}

/** Swaps a built-in step with its neighbor within the reorderable
 * middle section (everything except 'intro', which stays first as the
 * arrival moment, and 'closing', which stays last as the deliberate
 * finishing line — reordering those two wouldn't actually be sensible,
 * unlike the sensory steps, which the person may genuinely want in
 * their own preferred order, e.g. sound before sight). */
export function moveBuiltinGroundingStep(id: string, direction: 'up' | 'down'): void {
  const middleIds = GROUNDING_STEPS.filter((s) => s.id !== 'intro' && s.id !== 'closing').map((s) => s.id);
  const order = getOrderedKeys('grounding', middleIds);
  const idx = order.indexOf(id);
  if (idx === -1) return;
  const swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= order.length) return;
  const next = [...order];
  [next[idx], next[swapWith]] = [next[swapWith], next[idx]];
  setOrderedKeys('grounding', next);
}

/** Every built-in step (active AND inactive) in the current display
 * order — used by the management UI, which needs to show deactivated
 * steps too (dimmed), unlike getActiveGroundingSteps() above which the
 * actual exercise uses and which only returns active ones. */
export function getOrderedBuiltinStepsForManagement(): GroundingStepContent[] {
  const intro = GROUNDING_STEPS.find((s) => s.id === 'intro');
  const closing = GROUNDING_STEPS.find((s) => s.id === 'closing');
  const middleIds = GROUNDING_STEPS.filter((s) => s.id !== 'intro' && s.id !== 'closing').map((s) => s.id);
  const middle = getOrderedKeys('grounding', middleIds)
    .map((id) => GROUNDING_STEPS.find((s) => s.id === id))
    .filter((s): s is GroundingStepContent => !!s);
  const result: GroundingStepContent[] = [];
  if (intro) result.push(intro);
  result.push(...middle);
  if (closing) result.push(closing);
  return result;
}

export { OWN_TEXT_SOURCE };

/**
 * The single function GroundingOverlay.tsx actually walks through — the
 * live, active sequence: 'intro' first, then the reorderable middle
 * steps (minus deactivated ones, in the person's own custom order if
 * they've changed it) with any custom steps inserted as a block right
 * before 'closing', which always stays last.
 */
export function getActiveGroundingSteps(): (GroundingStepContent | CustomGroundingStep)[] {
  const deactivated = new Set(read().deactivatedIds);
  const intro = GROUNDING_STEPS.find((s) => s.id === 'intro' && !deactivated.has(s.id));
  const closing = GROUNDING_STEPS.find((s) => s.id === 'closing' && !deactivated.has(s.id));
  const middleIds = GROUNDING_STEPS.filter((s) => s.id !== 'intro' && s.id !== 'closing').map((s) => s.id);
  const orderedMiddleIds = getOrderedKeys('grounding', middleIds).filter((id) => !deactivated.has(id));
  const middle = orderedMiddleIds
    .map((id) => GROUNDING_STEPS.find((s) => s.id === id))
    .filter((s): s is GroundingStepContent => !!s);
  const custom = getCustomGroundingSteps();

  const result: (GroundingStepContent | CustomGroundingStep)[] = [];
  if (intro) result.push(intro);
  result.push(...middle, ...custom);
  if (closing) result.push(closing);
  return result;
}
