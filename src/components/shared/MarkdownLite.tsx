import type { ReactNode } from 'react';

/**
 * "# ist Ueberschrift, ** ist fett, schoen unterteilen"-Auftrag — a
 * deliberately minimal markdown-lite renderer rather than pulling in
 * a full markdown library: this only ever needs to handle what the
 * long-form texts (AboutVonMirAus, BridgesInfoText, the new arousal
 * scale explainer) actually use — #/##/### headings, **bold**, *italic*,
 * --- as a section divider, and plain paragraphs, with blank lines
 * separating blocks. Bullet lines starting with "•" or "-" render as
 * a simple list; a leading "  " (two spaces) before the bullet marks
 * a nested, second-level list item.
 *
 * "Anschaulich in Farben darstellen"-Auftrag — a heading whose text
 * starts with a zone name can be tinted with that zone's own color:
 * pass headingColorFor(text) to MarkdownLite and any ### heading is
 * colored with whatever it returns (undefined = default text color).
 * Keeps this component generic — the color lookup itself lives with
 * the caller, not hardcoded here.
 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 1) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownLite({ text, headingColorFor }: { text: string; headingColorFor?: (headingText: string) => string | undefined }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed === '---') {
          return <hr key={i} className="border-t my-2" style={{ borderColor: 'var(--color-border)' }} />;
        }
        if (trimmed.startsWith('### ')) {
          const headingText = trimmed.slice(4);
          return (
            <h3 key={i} className="text-[15px] font-semibold mt-2" style={{ color: headingColorFor?.(headingText) ?? 'var(--color-text)' }}>
              {renderInline(headingText)}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          const headingText = trimmed.slice(3);
          return (
            <h2 key={i} className="text-[17px] font-semibold mt-3" style={{ color: headingColorFor?.(headingText) ?? 'var(--color-text)' }}>
              {renderInline(headingText)}
            </h2>
          );
        }
        if (trimmed.startsWith('# ')) {
          return (
            <h1 key={i} className="text-[20px] font-semibold text-[var(--color-text)]">
              {renderInline(trimmed.slice(2))}
            </h1>
          );
        }
        const lines = trimmed.split('\n');
        const isList = lines.every((l) => /^\s*[•-]\s/.test(l));
        if (isList) {
          return (
            <ul key={i} className="flex flex-col gap-1 pl-1">
              {lines.map((l, j) => {
                const nested = /^\s{2,}[•-]\s/.test(l);
                return (
                  <li key={j} className="text-[14px] text-[var(--color-text)] leading-relaxed flex gap-2" style={{ marginLeft: nested ? 18 : 0 }}>
                    <span className="text-[var(--color-text-faint)]">•</span>
                    <span>{renderInline(l.trim().replace(/^[•-]\s/, ''))}</span>
                  </li>
                );
              })}
            </ul>
          );
        }
        return (
          <p key={i} className="text-[14px] text-[var(--color-text)] leading-relaxed whitespace-pre-line">
            {lines.map((l, j) => (
              <span key={j}>
                {renderInline(l)}
                {j < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
