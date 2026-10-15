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
    warningSignals: [],
    helpItems: [],
    linkedByTier: emptyLinkedByTier(),
    sections: [
      { key: 'waserschwert', title: '', items: [] },
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

const EXAMPLES = {
  de: {
    warn: { gelb: 'Ich schlafe schlechter und bin abends unruhig.', orange: 'Ich ziehe mich mehr zurück als sonst.', rot: 'Ich habe das Gefühl, die Kontrolle zu verlieren.' },
    help: { gelb: 'Kurz an die frische Luft gehen.', orange: '5-4-3-2-1: fünf Dinge sehen, vier hören, drei fühlen …', rot: 'Kaltes Wasser ins Gesicht, jemanden anrufen.' },
    sections: {
      waserschwert: 'Laute Musik in der Nacht.',
      wasbrauche: 'Ruhe und dass jemand kurz nachfragt, ohne zu drängen.',
      wasandere: 'Fragen, ob ich reden möchte – und dann einfach da sein.',
      wasandereNicht: 'Mir sagen, ich solle mich zusammenreißen.',
    } as Record<string, string>,
  },
  en: {
    warn: { gelb: 'I sleep worse and feel restless in the evening.', orange: 'I withdraw more than usual.', rot: 'I feel like I am losing control.' },
    help: { gelb: 'Step outside for a moment.', orange: '5-4-3-2-1: see five things, hear four, feel three …', rot: 'Cold water on my face, call someone.' },
    sections: {
      waserschwert: 'Loud music at night.',
      wasbrauche: 'Quiet, and someone checking in briefly without pushing.',
      wasandere: 'Asking whether I want to talk – and then just being there.',
      wasandereNicht: 'Telling me to pull myself together.',
    } as Record<string, string>,
  },
};

/** Texts of the old seeded plan — recognised once and turned into marked examples. */
const OLD_SEED_TEXTS = new Set([
  'Ich spreche schneller oder leiser als sonst.',
  'Ich ziehe mich mehr zurück als sonst.',
  'Ich habe das Gefühl, die Kontrolle zu verlieren.',
  'Kurz an die frische Luft gehen',
  '5-4-3-2-1 Grounding-Technik',
  'Kaltes Wasser ins Gesicht, jemanden anrufen',
]);

/**
 * "Beim allgemeinen Plan soll bei jedem Abschnitt ein Beispiel stehen,
 * als Beispiel markiert und klar zum Löschen." Runs once per plan
 * (examplesVersion): marks the old seeded texts as examples and adds an
 * example wherever a part of the general plan is still empty. Examples are
 * never part of the PDF or the share text.
 */
export function ensureExamples(plan: SafetyPlan, lang: 'de' | 'en'): SafetyPlan {
  if (plan.examplesVersion || plan.name !== 'Allgemeiner Plan') return plan;
  const ex = EXAMPLES[lang];
  const warningSignals = plan.warningSignals.map((w) => (OLD_SEED_TEXTS.has(w.text) ? { ...w, example: true } : w));
  const helpItems = plan.helpItems.map((h) => (OLD_SEED_TEXTS.has(h.text) ? { ...h, example: true } : h));
  for (const tier of WARNING_TIER_ORDER) {
    if (!warningSignals.some((w) => w.tier === tier)) warningSignals.push({ id: createId('warn'), text: ex.warn[tier], tier, example: true });
    if (!helpItems.some((h) => h.tier === tier)) helpItems.push({ id: createId('help'), text: ex.help[tier], tier, example: true });
  }
  const sections = plan.sections.map((sec) => {
    let items = sec.items;
    let examples = sec.examples ?? [];
    if (sec.key === 'waserschwert' && items.includes('Laute Musik in der Nacht')) {
      items = items.filter((i) => i !== 'Laute Musik in der Nacht');
      examples = [...examples, 'Laute Musik in der Nacht.'];
    }
    if (items.length === 0 && examples.length === 0 && ex.sections[sec.key]) examples = [ex.sections[sec.key]];
    return { ...sec, items, examples };
  });
  return { ...plan, warningSignals, helpItems, sections, examplesVersion: 1 };
}
