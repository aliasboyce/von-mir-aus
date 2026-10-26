import { Fragment } from 'react';
import { parseBlocks, parseInline } from '../../services/richText';

/** shows a text with the light formatting (see services/richText) – old plain texts look exactly as before */
export function RichText({ text, className = '', style, maxLines, testId }: { text: string; className?: string; style?: React.CSSProperties; maxLines?: number; testId?: string }) {
  const blocks = parseBlocks(text);
  return (
    <div
      className={`rte-lines ${className}`}
      style={{
        ...style,
        overflowWrap: 'anywhere',
        whiteSpace: 'pre-wrap',
        ...(maxLines ? { maxHeight: `calc(${style?.lineHeight ?? 1.6} * 1em * ${maxLines} + 0.2em)`, overflow: 'hidden' } : {}),
      }}
      data-testid={testId}
    >
      {blocks.map((b, i) => (
        <div key={i} {...(b.kind === 'h' ? { 'data-h': '1' } : b.kind === 'li' ? { 'data-m': b.mark, 'data-l': String(b.level) } : {})}>
          {parseInline(b.text).map((p, j) => {
            let n: React.ReactNode = p.text;
            if (p.u) n = <u>{n}</u>;
            if (p.i) n = <em>{n}</em>;
            if (p.b) n = <strong>{n}</strong>;
            return <Fragment key={j}>{n}</Fragment>;
          })}
          {b.text === '' && <br />}
        </div>
      ))}
    </div>
  );
}
