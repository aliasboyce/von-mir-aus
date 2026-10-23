import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { clinicWishesStore, type ClinicWishes } from './personalInfoStore';
import { planTexts } from './planTexts';

export const CLINIC_FIELDS: (keyof ClinicWishes)[] = ['treatment', 'placement', 'placementFallback', 'never', 'excludedMeds', 'history', 'additions'];

/** Eigener, ausklappbarer Teil „Klinikaufenthalt & Behandlung“ – unabhängig vom Plan, pro PDF wählbar. */
export function ClinicWishesCard() {
  const { settings } = useSettings();
  const T = planTexts(settings.language);
  const [open, setOpen] = useState(false);
  const [wishes, setWishes] = useState<ClinicWishes>(() => clinicWishesStore.get());

  function update(key: keyof ClinicWishes, value: string) {
    const next = { ...wishes, [key]: value };
    setWishes(next);
    clinicWishesStore.set(next);
  }

  return (
    <Card className="mb-5" data-testid="clinic-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left"
        data-testid="clinic-toggle"
      >
        <span>
          <span className="block text-[15px] font-medium text-[var(--color-text)]">{T.clinicTitle}</span>
          <span className="block text-[12.5px] text-[var(--color-text-faint)] mt-0.5">{T.clinicSub}</span>
        </span>
        {open ? <ChevronUp size={18} className="flex-shrink-0 text-[var(--color-text-faint)]" /> : <ChevronDown size={18} className="flex-shrink-0 text-[var(--color-text-faint)]" />}
      </button>
      {open && (
        <div className="flex flex-col gap-4 mt-4 animate-in" data-testid="clinic-body">
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{T.clinicNote}</p>
          {CLINIC_FIELDS.map((k) => (
            <label key={k} className="block">
              <span className="block text-[13px] text-[var(--color-text)] mb-1.5">{T[k]}</span>
              <textarea className="input" rows={3} value={wishes[k] ?? ''} onChange={(e) => update(k, e.target.value)} data-testid={`clinic-${k}`} />
            </label>
          ))}
        </div>
      )}
    </Card>
  );
}
