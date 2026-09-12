import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { POLYVAGAL_ZONE_META } from './polyvagalMeta';
import { useT } from '../../i18n';
import { EXTENDED_STATE_GROUPS, SURVIVAL_STATE_META } from '../zugang/zugangContent';
import type { PolyvagalZone, ZugangSurvivalState } from '../../data/types';

interface NervousSystemLadderProps {
  onSelect: (zone: PolyvagalZone, survivalState?: ZugangSurvivalState) => void;
  selected?: PolyvagalZone | null;
  /** "Check-in muss an exakt derselben Stelle fortgesetzt werden"-
   * Auftrag — optional controlled mode. Without these two props the
   * component keeps its own internal state exactly as before (nothing
   * else that uses this component is affected). PolyvagalPage passes
   * these, backed by a URL search param, so which zone is expanded
   * survives navigating away and back (browser back/forward restores
   * the URL, which restores this), instead of silently resetting the
   * way plain component-local state would on remount. */
  expanded?: PolyvagalZone | null;
  onExpandedChange?: (zone: PolyvagalZone | null) => void;
}

// Top to bottom on purpose — dorsal (freeze) reads at the top, ventral
// (connected) at the bottom, matching the "rising tension reads as
// rising on the page" order this app deliberately chose (see also the
// PolyvagalDayChart fix). Kept as its own local order rather than
// touching POLYVAGAL_ZONE_ORDER, which several other places (MiniCurve,
// the weekly review, ...) still depend on for their own layouts.
const TOP_TO_BOTTOM: PolyvagalZone[] = ['dorsal', 'sympathetic', 'ventral'];

/**
 * Replaces the old flat button-row zone picker with a vertical stack a
 * person can both tap to learn about (what does this mean, how might it
 * feel, what might I notice in my body, what feelings/behavior go with
 * it) and tap to log as a check-in — the two purposes share one card so
 * "what is this" and "where am I right now" live in the same place
 * instead of two separate, disconnected pickers.
 *
 * A single small connecting line down the left side hints that these
 * states aren't sealed-off boxes — a person moves between them — without
 * drawing a literal staircase that would suggest a fixed 1→2→3 order.
 */
export function NervousSystemLadder({ onSelect, selected, expanded: controlledExpanded, onExpandedChange }: NervousSystemLadderProps) {
  const t = useT();
  const [internalExpanded, setInternalExpanded] = useState<PolyvagalZone | null>(null);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;
  const setExpanded = (zone: PolyvagalZone | null) => {
    if (isControlled) onExpandedChange?.(zone);
    else setInternalExpanded(zone);
  };

  return (
    <div className="relative">
      <div
        className="absolute left-[19px] top-6 bottom-6 w-[2px] rounded-full"
        style={{ background: 'linear-gradient(to bottom, var(--color-accent-sky), var(--color-accent-sun), var(--color-primary))' }}
        aria-hidden="true"
      />
      <div className="flex flex-col gap-2.5">
        {TOP_TO_BOTTOM.map((zone) => {
          const meta = POLYVAGAL_ZONE_META[zone];
          const isExpanded = expanded === zone;
          const isSelected = selected === zone;
          const detail = t.polyvagal[zone];
          return (
            <div key={zone} className="relative pl-11">
              <button
                onClick={() => setExpanded(isExpanded ? null : zone)}
                aria-expanded={isExpanded}
                className="absolute left-0 top-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{
                  background: meta.color,
                  boxShadow: isSelected ? `0 0 0 3px var(--color-surface), 0 0 0 5px ${meta.color}` : undefined,
                }}
                aria-label={meta.label(t)}
              >
                {isSelected && <Check size={16} color="#fff" />}
              </button>

              <button
                onClick={() => setExpanded(isExpanded ? null : zone)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between text-left rounded-[var(--radius-lg)] px-3 py-2.5"
                style={{ background: isExpanded ? `${meta.color}14` : 'transparent' }}
              >
                <span>
                  <span className="block text-[14px] text-[var(--color-text)]">{meta.label(t)}</span>
                  <span className="block text-[12px] text-[var(--color-text-muted)]">{meta.hint(t)}</span>
                </span>
                <ChevronDown
                  size={16}
                  className="text-[var(--color-text-faint)] flex-shrink-0 transition-transform"
                  style={{ transform: isExpanded ? 'rotate(180deg)' : 'none' }}
                />
              </button>

              {isExpanded && (
                <div className="pl-3 pr-2 pb-3 pt-1 animate-in">
                  <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-2.5">{detail.meaning}</p>
                  <p className="text-[13px] text-[var(--color-text-muted)] italic leading-relaxed mb-3">{detail.feeling}</p>

                  <div className="flex flex-col gap-1.5 mb-3">
                    <DetailRow label={t.polyvagal.detailPhysical} value={detail.physical} />
                    <DetailRow label={t.polyvagal.detailEmotions} value={detail.emotions} />
                    <DetailRow label={t.polyvagal.detailBehavior} value={detail.behavior} />
                  </div>

                  {/* "Alle Fs mit dazu"-Auftrag — specific-state chips
                   * for this zone (including the extended Fine/Flood/
                   * Friend reactions where relevant), so tapping one
                   * both picks the zone AND the specific reaction in
                   * one motion, without losing the existing rich
                   * zone-level detail above. */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {(EXTENDED_STATE_GROUPS.find((g) => g.zone === zone)?.states ?? []).map((s) => {
                      const sMeta = SURVIVAL_STATE_META[s];
                      return (
                        <button
                          key={s}
                          onClick={() => onSelect(zone, s)}
                          className="px-2.5 py-1.5 rounded-full text-[12px] flex items-center gap-1"
                          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                          <span>{sMeta.emoji}</span>
                          <span className="text-[var(--color-text)]">{sMeta.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => onSelect(zone)}
                    className="text-[13px] px-3.5 py-2 rounded-full"
                    style={{ background: meta.color, color: '#fff' }}
                  >
                    {t.polyvagal.selectThisState}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2 text-[12px]">
      <span className="text-[var(--color-text-faint)] flex-shrink-0" style={{ width: 76 }}>
        {label}
      </span>
      <span className="text-[var(--color-text-muted)]">{value}</span>
    </div>
  );
}
