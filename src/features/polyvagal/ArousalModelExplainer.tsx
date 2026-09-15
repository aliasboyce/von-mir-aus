import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useT } from '../../i18n';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';

/**
 * "Neuer Formulierungstext, ausklappbar ueber der Funktion"-Auftrag —
 * the person's own carefully-worded explanation of the 6-zone model,
 * placed collapsed by default above the ladder slider in Zugang, the
 * daily check-in, and the Tageskurve page, so it doesn't add clutter
 * for people who already know the model but is right there for
 * anyone who wants the full picture first.
 */
export function ArousalModelExplainer() {
  const t = useT();
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] mb-4">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left">
        <span className="text-[13px] font-medium text-[var(--color-text)]">{t.polyvagal.arousalExplainerTitle}</span>
        <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <div className="px-4 pb-4 animate-in">
          {t.polyvagal.arousalExplainerIntro.split('\n\n').map((para, i) => (
            <p key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
              {para}
            </p>
          ))}

          <p className="text-[13px] font-medium text-[var(--color-text)] mt-4 mb-2">{t.polyvagal.arousalExplainerWindowTitle}</p>
          <ul className="flex flex-col gap-2 mb-4">
            {t.polyvagal.arousalExplainerWindowItems.map((item) => (
              <li key={item} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                {item}
              </li>
            ))}
          </ul>

          <p className="text-[13px] font-medium text-[var(--color-text)] mt-4 mb-2">{t.polyvagal.arousalExplainerDysregTitle}</p>
          <ul className="flex flex-col gap-2">
            {t.polyvagal.arousalExplainerDysregItems.map((item) => (
              <li key={item} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                {item}
              </li>
            ))}
          </ul>

          <SourceNoteCard
            text={t.polyvagal.arousalSourcesTitle}
            sourceIds={[
              'welltory-window-of-tolerance',
              'durhamtherapy-window-of-tolerance',
              'treehouse-polyvagal-window',
              'boon-arousal-worksheet',
              'praxis-psychologie-berlin-window',
              'positivepsychology-toleranzfenster',
              'siegel-window-of-tolerance',
            ]}
          />
        </div>
      )}
    </div>
  );
}
