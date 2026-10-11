import { chainSubject, type ChainStepInput, type FitSubject } from '../../content/fitCriteria';
import type { Resource, Skillkette, StepExtras } from '../../data/types';

/** The up to six steps of a chain (3 stages x 2 actions) that actually hold a skill. */
export function chainSteps(kette: Skillkette): { skillId: string; extras?: StepExtras }[] {
  const out: { skillId: string; extras?: StepExtras }[] = [];
  [kette.stufeHoch, kette.stufeMittel, kette.stufeNiedrig].forEach((st) => {
    if (st.aktion1SkillId) out.push({ skillId: st.aktion1SkillId, extras: st.aktion1Extras });
    if (st.aktion2SkillId) out.push({ skillId: st.aktion2SkillId, extras: st.aktion2Extras });
  });
  return out;
}

export function stepHasExtras(e?: StepExtras): boolean {
  return !!e && ((e.hilfsmittelIds?.length ?? 0) + (e.helperIds?.length ?? 0) + (e.bookmarkIds?.length ?? 0) > 0);
}

/** What a Skillkette asks for — computed from its skills and the extras added to its steps. */
export function chainFitSubject(kette: Skillkette, resourceById: Map<string, Resource>): FitSubject {
  const inputs: ChainStepInput[] = chainSteps(kette)
    .map((s) => {
      const skill = resourceById.get(s.skillId);
      if (!skill) return null;
      return {
        energyLevel: skill.energyLevel,
        fit: skill.fit,
        channels: skill.accessChannels,
        hasHelper: (s.extras?.helperIds?.length ?? 0) > 0,
      } as ChainStepInput;
    })
    .filter((x): x is ChainStepInput => x !== null);
  return chainSubject(inputs);
}
