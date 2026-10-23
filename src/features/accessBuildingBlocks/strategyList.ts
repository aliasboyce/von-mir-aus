import { PROTECTION_STRATEGIES_DE, PROTECTION_POSITIVE_DE } from '../zugang/zugangContent';
import { createDismissibleListManager } from '../../services/dismissibleListManager';

/** The old protection strategies as the person sees them on the Schutzstrategien page
 * (ready-made ones not marked "trifft nicht zu" + their own), for "Alternative für …" pickers. */
export function oldProtectionStrategies(): string[] {
  const m = createDismissibleListManager('schutzstrategien');
  const builtins = m.visibleBuiltins(PROTECTION_STRATEGIES_DE.filter((s) => !PROTECTION_POSITIVE_DE.includes(s)));
  return [...builtins, ...m.customItems().map((c) => c.text)];
}
