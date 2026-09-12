import { useState } from 'react';
import { Info, ChevronDown, ExternalLink } from 'lucide-react';
import { useT } from '../../i18n';
import { APP_SOURCES } from '../../data/sourcesLibrary';

/**
 * Section 12 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief —
 * every factual page already had a source note, but each one was just
 * plain small text at the bottom, styled slightly differently page to
 * page. This gives all of them the same small, calm, recognizable
 * "Quelle & Hintergrund" disclosure instead — collapsed by default so
 * it doesn't compete with the actual content, consistent everywhere.
 *
 * "Materialien"-Auftrag, Section 20 — now optionally takes sourceIds
 * pointing into the global sources library (sourcesLibrary.ts), so the
 * existing free-text explanation is followed by real, clickable
 * "Ansatz: X — Quelle öffnen" links straight to the original source,
 * instead of the text just naming an approach with nothing to click.
 * Pages without a matching seeded source simply omit sourceIds and
 * keep their plain text note exactly as before — nothing forced.
 */
export function SourceNoteCard({ text, sourceIds }: { text: string; sourceIds?: string[] }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const sources = (sourceIds ?? []).map((id) => APP_SOURCES.find((s) => s.id === id)).filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--color-border)]">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-[12px] text-[var(--color-text-muted)]">
          <Info size={13} className="flex-shrink-0" />
          {t.common.sourceAndBackground}
        </span>
        <ChevronDown size={14} className="text-[var(--color-text-faint)] flex-shrink-0" style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{text}</p>
          {sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex flex-col gap-2">
              {sources.map((s) => (
                <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[12px] text-[var(--color-primary)]">
                  <ExternalLink size={12} className="flex-shrink-0" />
                  {s.approach} — {s.title}
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
