import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import type { SafetyPlan, WarningTier } from '../../data/types';
import type { TierColorSet } from './tierColorsStore';

interface SafetyPlanPrintViewProps {
  plan: SafetyPlan | null;
  tierLabels: Record<WarningTier, string>;
  tierColors: Record<WarningTier, TierColorSet>;
  warningSignalsLabel: string;
  helpItemsLabel: string;
}

const TIER_ORDER: WarningTier[] = ['gelb', 'orange', 'rot'];

/**
 * A genuinely separate document layout, not the live screen with buttons
 * hidden - laid out the way a printed page should read: heading, grouped
 * sections, numbered lists. Always white background regardless of the
 * on-screen black/white toggle (a printed page needs to be readable on
 * paper, not match a screen preference). Deliberately excludes the fixed
 * emergency numbers and "Schnell Hilfe holen" - this document is about
 * the person's own, individual plan, not the general numbers that are
 * the same for everyone.
 */
export function SafetyPlanPrintView({ plan, tierLabels, tierColors, warningSignalsLabel, helpItemsLabel }: SafetyPlanPrintViewProps) {
  if (!plan) return null;

  function resolveLabel(kind: 'resource' | 'bridge' | 'contact', id: string): string | null {
    if (kind === 'resource') return resourcesRepo.getById(id)?.title ?? null;
    if (kind === 'bridge') return bridgesRepo.getById(id)?.title ?? null;
    return networkRepo.getById(id)?.name ?? null;
  }

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 28 }}>{plan.name}</h1>

      {plan.warningSignals.length > 0 && (
        <section style={{ marginBottom: 28, breakInside: 'avoid' }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#333' }}>{warningSignalsLabel}</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {plan.warningSignals.map((w) => (
              <li key={w.id} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a' }}>
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: 999,
                    background: tierColors[w.tier].color,
                    marginRight: 6,
                  }}
                />
                {w.text}
              </li>
            ))}
          </ul>
        </section>
      )}

      {TIER_ORDER.map((tier) => {
        const tierHelp = plan.helpItems.filter((h) => h.tier === tier);
        const linked = plan.linkedByTier[tier];
        const resourceNames = linked.resourceIds.map((id) => resolveLabel('resource', id)).filter(Boolean) as string[];
        const bridgeNames = linked.bridgeIds.map((id) => resolveLabel('bridge', id)).filter(Boolean) as string[];
        const contactNames = linked.contactIds.map((id) => resolveLabel('contact', id)).filter(Boolean) as string[];
        const allItems = [...tierHelp.map((h) => h.text), ...resourceNames, ...bridgeNames, ...contactNames];
        if (allItems.length === 0) return null;

        return (
          <section key={tier} style={{ marginBottom: 24, breakInside: 'avoid' }}>
            <h2
              style={{
                fontSize: 15,
                fontWeight: 600,
                marginBottom: 10,
                paddingLeft: 10,
                borderLeft: `4px solid ${tierColors[tier].color}`,
              }}
            >
              {helpItemsLabel.replace('{tier}', tierLabels[tier])}
            </h2>
            <ol style={{ margin: 0, paddingLeft: 20, listStyleType: 'decimal', listStylePosition: 'outside' }}>
              {allItems.map((text, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#2a2a2a', marginBottom: 4 }}>
                  {text}
                </li>
              ))}
            </ol>
          </section>
        );
      })}

      {plan.sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <section key={section.key} style={{ marginBottom: 24, breakInside: 'avoid' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#333' }}>{section.title}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, listStyleType: 'disc', listStylePosition: 'outside' }}>
              {section.items.map((item, i) => (
                <li key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#2a2a2a', marginBottom: 4 }}>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        ))}
    </div>
  );
}
