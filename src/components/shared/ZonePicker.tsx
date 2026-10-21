import { AROUSAL_BANDS } from '../../features/polyvagal/arousalBands';
import { useT } from '../../i18n';

/**
 * "Verbinde so, dass man angibt, in welchem Anspannungsbereich es
 * hilft"-Auftrag — a small multi-select of the six arousal-ladder
 * zones (same ids/colors/labels AROUSAL_BANDS and the ladder slider
 * already use), for tagging a skill or Hilfsmittel with where it
 * actually helps. Free text ("Anspannungsbereich: z. B. 60-80%") stays
 * in the form as a human-readable note, but THIS is the structured
 * field the zone-to-skill link (NervousSystemLadderSlider.tsx) can
 * actually filter by — see ZONE_TO_SKILL_CATEGORY there and how the
 * Skills/Hilfsmittel pages now read ?zone=zoneX from the URL.
 */
export function ZonePicker({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) {
  const t = useT();

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((z) => z !== id) : [...selected, id]);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{t.resources.zonePickerLabel}</span>
      <div className="flex flex-wrap gap-2">
        {AROUSAL_BANDS.map((b) => {
          const isSelected = selected.includes(b.id);
          const zoneT = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones];
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => toggle(b.id)}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-full)] px-3 py-1.5 text-[13px] font-medium transition-colors duration-200 border"
              style={isSelected ? { background: b.color, borderColor: b.color, color: '#fff' } : { borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              {zoneT.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
