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
    <div className="print-only" style={{ padding: '36px 32px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <div
        aria-hidden="true"
        data-pdf-stripe={`${tierColors.gelb.color},${tierColors.orange.color},${tierColors.rot.color}`}
        style={{
          height: 8,
          borderRadius: 999,
          marginBottom: 18,
          background: `linear-gradient(90deg, ${tierColors.gelb.color}, ${tierColors.orange.color}, ${tierColors.rot.color})`,
        }}
      />
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 22 }}>{plan.name}</h1>

      {TIER_ORDER.map((tier) => {
        const color = tierColors[tier];
        const tierWarnings = plan.warningSignals.filter((w) => w.tier === tier);
        const tierHelp = plan.helpItems.filter((h) => h.tier === tier);
        const linked = plan.linkedByTier[tier];
        const resourceNames = linked.resourceIds.map((id) => resolveLabel('resource', id)).filter(Boolean) as string[];
        const bridgeNames = linked.bridgeIds.map((id) => resolveLabel('bridge', id)).filter(Boolean) as string[];
        const contactNames = linked.contactIds.map((id) => resolveLabel('contact', id)).filter(Boolean) as string[];
        const allItems = [...tierHelp.map((h) => h.text), ...resourceNames, ...bridgeNames, ...contactNames];
        if (allItems.length === 0 && tierWarnings.length === 0) return null;

        return (
          <section
            key={tier}
            data-pdf-band={color.color}
            style={{
              marginBottom: 18,
              breakInside: 'avoid',
              background: color.soft,
              border: `1.5px solid ${color.color}`,
              borderLeft: `8px solid ${color.color}`,
              borderRadius: 12,
              padding: '14px 18px 12px',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: color.color, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: 999, background: color.color }} />
              {tierLabels[tier]}
            </h2>

            {tierWarnings.length > 0 && (
              <>
                <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
                  {warningSignalsLabel}
                </h3>
                <ul style={{ margin: '0 0 10px', paddingLeft: 20, listStyleType: 'disc' }}>
                  {tierWarnings.map((w) => {
                    const res = w.resourceId ? resourcesRepo.getById(w.resourceId) : undefined;
                    return (
                      <li key={w.id} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a' }}>
                        {w.text}
                        {res && <span style={{ color: color.color, fontWeight: 600 }}> → {res.title}</span>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {allItems.length > 0 && (
              <>
                <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
                  {helpItemsLabel.replace('{tier}', tierLabels[tier])}
                </h3>
                <ol style={{ margin: 0, paddingLeft: 20, listStyleType: 'decimal', listStylePosition: 'outside' }}>
                  {allItems.map((text, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a', marginBottom: 3 }}>
                      {text}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        );
      })}

      {plan.sections
        .filter((s) => s.items.length > 0)
        .map((section) => (
          <section key={section.key} style={{ marginBottom: 16, breakInside: 'avoid', background: '#F6F2E9', borderLeft: '6px solid #8A9A7B', borderRadius: 10, padding: '12px 18px 8px' }}>
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
