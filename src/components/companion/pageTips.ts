import { getLines, pickLine, pickLineAvoidingRepeats } from './companionRegistry';
import type { CompanionCategory } from './companionRegistry';

/**
 * Used by CompanionDock on every route change. Mostly shows a page-specific
 * line (erstes_oeffnen on first visit this session, leerlauf on repeat
 * visits — CompanionDock itself decides which via its own "seen pages"
 * tracking), but sometimes surfaces a global unprompted aside instead, so
 * the companion feels alive rather than reciting the same page blurb.
 * `preferredCategories` (the current being's personality) tilts which line
 * gets picked when there's a choice — see companionRegistry.ts pickLine().
 */
export function pickTip(pathname: string, firstVisit: boolean, preferredCategories?: CompanionCategory[]): string | null {
  if (Math.random() < 0.22) {
    const aside = pickLine({ page: '*', trigger: 'leerlauf', preferredCategories });
    if (aside) return aside;
  }

  const trigger = firstVisit ? 'erstes_oeffnen' : 'leerlauf';
  const primary = pickLine({ page: pathname, trigger, preferredCategories });
  if (primary) return primary;

  // Fall back to any line tagged for this page, regardless of trigger —
  // better to say something relevant than nothing at all.
  const anyForPage = getLines({ page: pathname });
  if (anyForPage.length > 0) {
    return pickLineAvoidingRepeats(anyForPage);
  }
  return null;
}
