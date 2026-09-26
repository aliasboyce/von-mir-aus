import type { ReactNode } from 'react';

/**
 * "# ist Ueberschrift, ** ist fett, schoen unterteilen"-Auftrag — a
 * deliberately minimal markdown-lite renderer rather than pulling in
 * a full markdown library: this only ever needs to handle what the
 * two long-form texts (AboutVonMirAus, BridgesInfoText) actually use
 * — #/##/### headings, **bold**, --- as a section divider, and plain
 * paragraphs, with blank lines separating blocks. Bullet lines
 * starting with "•" or "-" render as a simple list.
 */
function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownLite({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/);
  return (
    <div className="flex flex-col gap-3">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (trimmed === '---') {
          return <hr key={i} className="border-t my-2" style={{ borderColor: 'var(--color-border)' }} />;
        }
        if (trimmed.startsWith('### ')) {
          return (
            <h3 key={i} className="text-[15px] font-semibold text-[var(--color-text)] mt-2">
              {renderInline(trimmed.slice(4))}
            </h3>
          );
        }
        if (trimmed.startsWith('## ')) {
          return (
            <h2 key={i} className="text-[17px] font-semibold text-[var(--color-text)] mt-3">
              {renderInline(trimmed.slice(3))}
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
        const isList = lines.every((l) => /^[•-]\s/.test(l.trim()));
        if (isList) {
          return (
            <ul key={i} className="flex flex-col gap-1 pl-1">
              {lines.map((l, j) => (
                <li key={j} className="text-[14px] text-[var(--color-text)] leading-relaxed flex gap-2">
                  <span className="text-[var(--color-text-faint)]">•</span>
                  <span>{renderInline(l.trim().replace(/^[•-]\s/, ''))}</span>
                </li>
              ))}
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
