import { COMPANION_LINES, pickLine } from './companionRegistry';

/** The one line explaining what sets Ressourcen and Brücken apart —
 * shown on first visit to the resources page (see companionRegistry.ts id 'res-1'). */
export const RESOURCES_BRIDGES_LINES = {
  distinction: COMPANION_LINES.find((l) => l.id === 'res-1')!.text,
};

/** One of several phrasings explaining the safety plan's 3-per-tier cap —
 * picked pseudo-randomly so it doesn't feel identical every visit. */
export function pickLimitExplanation(): string {
  return pickLine({ page: '/sicherheit/plan', trigger: 'sicherheitsplan_limit' }) ?? '';
}
