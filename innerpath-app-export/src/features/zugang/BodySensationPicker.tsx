import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useT } from '../../i18n';
import { SuggestionMultiSelect } from './SuggestionMultiSelect';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import { colorForSensation } from './sensationZones';

interface BodySensationPickerProps {
  suggestions: string[];
  customSuggestions: string[];
  selected: string[];
  onToggle: (value: string) => void;
  onAddCustom: (value: string) => void;
  onEditCustom: (oldValue: string, newValue: string) => void;
  onDeleteCustom: (value: string) => void;
}

/**
 * "Wieder mehrfach aufgeteilt in ausklappbar, farbige Einfaerbung nach
 * Zone"-Auftrag — the flat body-sensation list grew to ~58 terms
 * after merging in the person's detailed clinical marker list, which
 * would overwhelm as one single tag cloud. Grouped here into six
 * collapsible, zone-colored sections instead — same underlying
 * BODY_SENSATIONS_DE data and the same SuggestionMultiSelect
 * interaction per group, just organized. A zone starts open only if
 * it already has a selected term in it, so re-opening this step
 * doesn't hide what was already picked.
 */
export function BodySensationPicker({ suggestions, customSuggestions, selected, onToggle, onAddCustom, onEditCustom, onDeleteCustom }: BodySensationPickerProps) {
  const t = useT();
  const grouped = AROUSAL_BANDS.map((b) => ({
    band: b,
    terms: suggestions.filter((s) => colorForSensation(s) === b.color),
  })).filter((g) => g.terms.length > 0);

  const [openZones, setOpenZones] = useState<Set<string>>(() => new Set(grouped.filter((g) => g.terms.some((s) => selected.includes(s))).map((g) => g.band.id)));

  function toggleZone(id: string) {
    setOpenZones((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <div className="flex flex-col gap-2">
      {grouped.map(({ band, terms }) => {
        const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];
        const open = openZones.has(band.id);
        return (
          <div key={band.id} className="rounded-[var(--radius-lg)] border" style={{ borderColor: `${band.color}55` }}>
            <button onClick={() => toggleZone(band.id)} className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-left">
              <span className="text-[13px] font-medium" style={{ color: band.color }}>
                {zoneT.label}
              </span>
              <ChevronDown size={15} style={{ color: band.color, transform: open ? 'rotate(180deg)' : undefined }} />
            </button>
            {open && (
              <div className="px-3.5 pb-3.5 animate-in">
                <SuggestionMultiSelect
                  suggestions={terms}
                  customSuggestions={[]}
                  selected={selected}
                  onToggle={onToggle}
                  onAddCustom={() => {}}
                  onEditCustom={() => {}}
                  onDeleteCustom={() => {}}
                  getColor={colorForSensation}
                  hideAddCustom
                />
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-1">
        <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.zugang.ownSuggestionCta}</p>
        <SuggestionMultiSelect
          suggestions={[]}
          customSuggestions={customSuggestions}
          selected={selected}
          onToggle={onToggle}
          onAddCustom={onAddCustom}
          onEditCustom={onEditCustom}
          onDeleteCustom={onDeleteCustom}
        />
      </div>
    </div>
  );
}
