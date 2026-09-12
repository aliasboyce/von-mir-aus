import { createRepository, createId } from '../../services/storage/repository';
import type { SafetyPlan, TierLinkedItems, WarningTier } from '../../data/types';

export const safetyPlansRepo = createRepository<SafetyPlan>('safety-plans');

function emptyLinkedByTier(): Record<WarningTier, TierLinkedItems> {
  return {
    gelb: { resourceIds: [], bridgeIds: [], contactIds: [] },
    orange: { resourceIds: [], bridgeIds: [], contactIds: [] },
    rot: { resourceIds: [], bridgeIds: [], contactIds: [] },
  };
}

function seedDefaultPlan(): SafetyPlan {
  const now = new Date().toISOString();
  return {
    id: createId('plan'),
    name: 'Allgemeiner Plan',
    warningSignals: [
      { id: createId('warn'), text: 'Ich spreche schneller oder leiser als sonst.', tier: 'gelb' },
      { id: createId('warn'), text: 'Ich ziehe mich mehr zurück als sonst.', tier: 'orange' },
      { id: createId('warn'), text: 'Ich habe das Gefühl, die Kontrolle zu verlieren.', tier: 'rot' },
    ],
    helpItems: [
      { id: createId('help'), text: 'Kurz an die frische Luft gehen', tier: 'gelb' },
      { id: createId('help'), text: '5-4-3-2-1 Grounding-Technik', tier: 'orange' },
      { id: createId('help'), text: 'Kaltes Wasser ins Gesicht, jemanden anrufen', tier: 'rot' },
    ],
    linkedByTier: emptyLinkedByTier(),
    sections: [
      { key: 'waserschwert', title: '', items: ['Laute Musik in der Nacht'] },
      { key: 'wasbrauche', title: '', items: [] },
      { key: 'wasandere', title: '', items: [] },
      { key: 'wasandereNicht', title: '', items: [] },
    ],
    updatedAt: now,
  };
}

export function seedSafetyPlansIfEmpty() {
  safetyPlansRepo.seedIfEmpty([seedDefaultPlan()]);
}

export function createNewPlan(name: string): SafetyPlan {
  return {
    id: createId('plan'),
    name,
    warningSignals: [],
    helpItems: [],
    linkedByTier: emptyLinkedByTier(),
    sections: [
      { key: 'waserschwert', title: '', items: [] },
      { key: 'wasbrauche', title: '', items: [] },
      { key: 'wasandere', title: '', items: [] },
      { key: 'wasandereNicht', title: '', items: [] },
    ],
    updatedAt: new Date().toISOString(),
  };
}

export const SAFETY_PLAN_SECTION_ORDER = ['waserschwert', 'wasbrauche', 'wasandere', 'wasandereNicht'] as const;

export const WARNING_TIER_ORDER: WarningTier[] = ['gelb', 'orange', 'rot'];

/** Guards against plans saved before linkedByTier (or its predecessor flat
 * fields) existed in the data model — old data should never crash. */
export function normalizePlan(plan: SafetyPlan): SafetyPlan {
  const legacy = plan as SafetyPlan & {
    linkedResourceIds?: string[];
    linkedBridgeIds?: string[];
    linkedContactIds?: string[];
  };

  if (plan.linkedByTier) return plan;

  // Migrate the earlier "one flat list, no tier" shape by placing anything
  // found there under the 'gelb' tier — better than silently dropping data.
  const migrated = emptyLinkedByTier();
  if (legacy.linkedResourceIds) migrated.gelb.resourceIds = legacy.linkedResourceIds.slice(0, 3);
  if (legacy.linkedBridgeIds) migrated.gelb.bridgeIds = legacy.linkedBridgeIds.slice(0, 3);
  if (legacy.linkedContactIds) migrated.gelb.contactIds = legacy.linkedContactIds.slice(0, 3);

  return { ...plan, linkedByTier: migrated };
}
