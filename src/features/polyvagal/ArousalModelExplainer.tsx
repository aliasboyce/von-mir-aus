import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useT } from '../../i18n';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';
import { MarkdownLite } from '../../components/shared/MarkdownLite';
import { AROUSAL_EXPLAINER_TEXT } from '../../content/arousalExplainerContent';
import { AROUSAL_BANDS } from './arousalBands';

/**
 * "Das hier ist die komplette, neue Beschreibung... nur noch eine
 * einzige Beschreibung, Wort für Wort"-Auftrag — replaces the old
 * three-depth-level system (simple/standard/clinical tabs) entirely
 * with the person's own single, complete DBT+Polyvagal text, rendered
 * via MarkdownLite for paragraphs, bold and italic emphasis, and
 * lists. Each zone's own ### heading is tinted with that zone's color from
 * AROUSAL_BANDS (headingColorFor below), the same colors the ladder
 * and chart use — "anschaulich... in Farben darstellen" without
 * inventing a second color scheme.
 */
function headingColorForZone(headingText: string, t: ReturnType<typeof useT>): string | undefined {
  const match = AROUSAL_BANDS.find((b) => {
    const label = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label;
    return headingText.startsWith(label);
  });
  return match?.color;
}

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
          <MarkdownLite text={AROUSAL_EXPLAINER_TEXT} headingColorFor={(h) => headingColorForZone(h, t)} />

          <div className="mt-4">
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
        </div>
      )}
    </div>
  );
}
