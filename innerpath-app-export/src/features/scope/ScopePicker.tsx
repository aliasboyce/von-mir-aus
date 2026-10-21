import { Check } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { scopeOf, type Scope } from '../../services/scope';

const TXT = {
  de: {
    core: ['Nur das Nötigste', 'Wesen, Kurz-Check-in, Krisenmodus und dein Sicherheitsplan. Sonst nichts.'],
    plan: ['Mit Sicherheitsplan', 'Dazu das Sicherheitsnetz, „Verstehen“ und „Handeln“ und Medikamente.'],
    all: ['Alles', 'Die ganze App mit allem, was sie kann.'],
    simple: 'Einfach-Darstellung',
    simpleSub: 'Größere Flächen, weniger Auswahl, weniger kleine Hinweise.',
    note: 'Nichts geht verloren: Was du ausblendest, ist nur versteckt und kommt mit „Alles“ zurück.',
  },
  en: {
    core: ['Just the essentials', 'Companion, quick check-in, crisis mode and your safety plan. Nothing else.'],
    plan: ['With safety plan', 'Plus the safety network, “Understand” and “Act”, and medication.'],
    all: ['Everything', 'The whole app with everything it can do.'],
    simple: 'Simple view',
    simpleSub: 'Bigger surfaces, fewer choices, fewer small hints.',
    note: 'Nothing is lost: what you hide is only hidden and comes back with “Everything”.',
  },
};

/** Choose how much of the app is shown (and the simple look). Used in the settings, the first start and "show more". */
export function ScopePicker({ value, simple, onChange, onSimple }: { value?: Scope; simple: boolean; onChange: (s: Scope) => void; onSimple: (v: boolean) => void }) {
  const { settings } = useSettings();
  const L = settings.language === 'en' ? TXT.en : TXT.de;
  const current = value ?? scopeOf(settings);
  const opts: Scope[] = ['core', 'plan', 'all'];
  return (
    <div data-testid="scope-picker">
      <div className="flex flex-col gap-2">
        {opts.map((o) => {
          const sel = current === o;
          return (
            <button
              key={o}
              type="button"
              aria-pressed={sel}
              onClick={() => onChange(o)}
              data-testid={`scope-${o}`}
              className="text-left rounded-[var(--radius-md)] px-4 py-3 flex items-start gap-3 border-2"
              style={{ borderColor: sel ? 'var(--color-primary)' : 'var(--color-border)', background: sel ? 'var(--color-primary-soft)' : 'var(--color-surface)' }}
            >
              <span className="mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0" style={{ borderColor: sel ? 'var(--color-primary)' : 'var(--color-border-strong)', background: sel ? 'var(--color-primary)' : 'transparent', color: 'var(--color-surface)' }}>
                {sel && <Check size={12} />}
              </span>
              <span>
                <span className="block text-[15px] text-[var(--color-text)]">{L[o][0]}</span>
                <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug">{L[o][1]}</span>
              </span>
            </button>
          );
        })}
      </div>
      <label className="flex items-start gap-2.5 mt-4 cursor-pointer">
        <input type="checkbox" className="mt-1" checked={simple} onChange={(e) => onSimple(e.target.checked)} data-testid="scope-simple" />
        <span>
          <span className="block text-[14px] text-[var(--color-text)]">{L.simple}</span>
          <span className="block text-[12px] text-[var(--color-text-faint)] leading-relaxed">{L.simpleSub}</span>
        </span>
      </label>
      <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-3" data-hint>{L.note}</p>
    </div>
  );
}
