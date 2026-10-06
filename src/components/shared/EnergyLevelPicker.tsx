import { ENERGY_LEVELS, type EnergyLevel } from '../../content/energyLevels';
import { useSettings } from '../../state/SettingsContext';

/**
 * The four energy levels as a vertical list, each with its icon, name
 * and the concrete "how it feels" description — for the forms where
 * someone states how much energy something needs (Hilfsmittel, Skills,
 * resources, bridge levels). Tapping the selected level again clears
 * it ("nicht angegeben").
 */
export function EnergyLevelPicker({ value, onChange }: { value?: EnergyLevel; onChange: (v: EnergyLevel | undefined) => void }) {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  return (
    <div className="flex flex-col gap-1.5">
      {ENERGY_LEVELS.map((e) => {
        const info = lang === 'en' ? e.en : e.de;
        const active = value === e.level;
        return (
          <button
            key={e.level}
            type="button"
            onClick={() => onChange(active ? undefined : e.level)}
            aria-pressed={active}
            className="text-left rounded-[var(--radius-md)] border px-3 py-2.5"
            style={{ borderColor: active ? 'var(--color-primary)' : 'var(--color-border)', background: active ? 'var(--color-primary-soft)' : 'var(--color-surface)' }}
          >
            <span className="flex items-center gap-2">
              <span className="text-[13px]" aria-hidden="true">{e.icon}</span>
              <span className="text-[13.5px] font-medium text-[var(--color-text)]">{info.label}</span>
            </span>
            <span className="block text-[12px] text-[var(--color-text-muted)] leading-relaxed mt-1">{info.feel}</span>
          </button>
        );
      })}
    </div>
  );
}
