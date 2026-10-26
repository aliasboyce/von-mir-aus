/**
 * Leichte Formatierung für Tagebuch & Co. Gespeichert wird weiterhin EIN Text (kein HTML), damit alles Bestehende
 * (Suche, Rückblick, PDF, Export, Sicherung) unverändert weiterläuft:
 *   **fett**  *kursiv*  __unterstrichen__
 *   "# Überschrift"
 *   Listen: "- Punkt", "♥ Herz", "★ Stern"; zwei Leerzeichen pro Einrückung = eine Ebene tiefer
 * Alter Text ohne Zeichen bleibt einfach Text.
 */

export type ListMark = 'dot' | 'heart' | 'star';
export const MARK_CHAR: Record<ListMark, string> = { dot: '•', heart: '♥', star: '★' };
const MARK_PREFIX: Record<ListMark, string> = { dot: '- ', heart: '♥ ', star: '★ ' };
export const MAX_LEVEL = 3;

export type RichBlock =
  | { kind: 'p'; text: string }
  | { kind: 'h'; text: string }
  | { kind: 'li'; text: string; mark: ListMark; level: number };

export function parseBlocks(markup: string): RichBlock[] {
  return (markup ?? '').split('\n').map((line): RichBlock => {
    if (/^# /.test(line)) return { kind: 'h', text: line.slice(2) };
    const m = /^((?: {2})*)(- |♥ |★ )(.*)$/.exec(line);
    if (m) {
      const mark: ListMark = m[2] === '♥ ' ? 'heart' : m[2] === '★ ' ? 'star' : 'dot';
      return { kind: 'li', text: m[3], mark, level: Math.min(MAX_LEVEL, m[1].length / 2) };
    }
    return { kind: 'p', text: line };
  });
}

export function blocksToMarkup(blocks: RichBlock[]): string {
  return blocks
    .map((b) => (b.kind === 'h' ? `# ${b.text}` : b.kind === 'li' ? `${'  '.repeat(b.level)}${MARK_PREFIX[b.mark]}${b.text}` : b.text))
    .join('\n');
}

export type InlinePart = { text: string; b?: boolean; i?: boolean; u?: boolean };

/** splits a line into pieces with bold / italic / underline flags */
export function parseInline(text: string): InlinePart[] {
  const out: InlinePart[] = [];
  const walk = (s: string, f: { b?: boolean; i?: boolean; u?: boolean }) => {
    const re = /\*\*(?=\S)(.+?)(?<=\S)\*\*|__(?=\S)(.+?)(?<=\S)__|\*(?=[^\s*])(.+?)(?<=[^\s*])\*/g;
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(s))) {
      if (m.index > last) out.push({ text: s.slice(last, m.index), ...f });
      if (m[1] !== undefined) walk(m[1], { ...f, b: true });
      else if (m[2] !== undefined) walk(m[2], { ...f, u: true });
      else walk(m[3], { ...f, i: true });
      last = m.index + m[0].length;
    }
    if (last < s.length) out.push({ text: s.slice(last), ...f });
  };
  walk(text, {});
  return out;
}

/** the text without any markup – for search, PDF, short previews */
export function richToPlain(markup: string, opts: { bullets?: boolean } = {}): string {
  const bullets = opts.bullets !== false;
  return parseBlocks(markup)
    .map((b) => {
      const txt = parseInline(b.text).map((p) => p.text).join('');
      if (b.kind === 'li') return `${'  '.repeat(b.level)}${bullets ? '• ' : ''}${txt}`;
      return txt;
    })
    .join('\n');
}

/** does this text use any formatting at all? (cheap check so old plain entries stay on the fast path) */
export const hasFormatting = (markup: string) => /(^|\n)(# |(?: {2})*(- |♥ |★ ))|\*\S|__\S/.test(markup ?? '');

/* ───── editor side: DOM <-> markup ───── */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** markup → the HTML the editor shows: one <div> per line, data-l = list level, data-m = marker, data-h = heading */
export function markupToEditorHtml(markup: string): string {
  const html = parseBlocks(markup)
    .map((b) => {
      const inner =
        parseInline(b.text)
          .map((p) => {
            let h = esc(p.text);
            if (p.u) h = `<u>${h}</u>`;
            if (p.i) h = `<i>${h}</i>`;
            if (p.b) h = `<b>${h}</b>`;
            return h;
          })
          .join('') || '<br>';
      if (b.kind === 'h') return `<div data-h="1">${inner}</div>`;
      if (b.kind === 'li') return `<div data-m="${b.mark}" data-l="${b.level}">${inner}</div>`;
      return `<div>${inner}</div>`;
    })
    .join('');
  return html || '<div><br></div>';
}

function inlineFromNode(node: Node): string {
  if (node.nodeType === 3) return node.textContent ?? '';
  if (node.nodeType !== 1) return '';
  const el = node as HTMLElement;
  const tag = el.tagName;
  if (tag === 'BR') return '';
  if (tag === 'DIV' || tag === 'P') return Array.from(el.childNodes).map(inlineFromNode).join('');
  const inner = Array.from(el.childNodes).map(inlineFromNode).join('');
  if (!inner) return '';
  const st = el.style;
  const bold = tag === 'B' || tag === 'STRONG' || st.fontWeight === 'bold' || Number(st.fontWeight) >= 600;
  const ital = tag === 'I' || tag === 'EM' || st.fontStyle === 'italic';
  const und = tag === 'U' || (st.textDecorationLine || st.textDecoration || '').includes('underline');
  // keep the surrounding spaces outside of the markers, otherwise "** x **" would not be bold any more
  const lead = /^\s*/.exec(inner)![0];
  const trail = /\s*$/.exec(inner.slice(lead.length))![0];
  let core = inner.slice(lead.length, inner.length - trail.length);
  if (!core) return inner;
  if (und) core = `__${core}__`;
  if (ital) core = `*${core}*`;
  if (bold) core = `**${core}**`;
  return lead + core + trail;
}

/** the editor's DOM → markup text */
export function editorToMarkup(root: HTMLElement): string {
  const lines: string[] = [];
  const pushLine = (el: HTMLElement | null, nodes?: Node[]) => {
    const text = (el ? Array.from(el.childNodes) : nodes ?? []).map(inlineFromNode).join('').replace(/ /g, ' ').replace(/\n/g, ' ');
    if (el?.dataset.h) lines.push(`# ${text}`);
    else if (el?.dataset.m) {
      const mark = (el.dataset.m as ListMark) in MARK_CHAR ? (el.dataset.m as ListMark) : 'dot';
      const level = Math.max(0, Math.min(MAX_LEVEL, Number(el.dataset.l) || 0));
      lines.push(`${'  '.repeat(level)}${MARK_PREFIX[mark]}${text}`);
    } else lines.push(text);
  };
  let stray: Node[] = [];
  const flush = () => {
    if (stray.length) pushLine(null, stray);
    stray = [];
  };
  root.childNodes.forEach((n) => {
    if (n.nodeType === 1 && (n as HTMLElement).tagName === 'DIV') {
      flush();
      pushLine(n as HTMLElement);
    } else if (n.nodeType === 1 && (n as HTMLElement).tagName === 'BR') flush();
    else stray.push(n);
  });
  flush();
  return lines.join('\n').replace(/\s+$/, '');
}
