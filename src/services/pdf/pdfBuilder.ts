/**
 * "Das PDF erstellen von Skills funktioniert nicht, er sagt er braucht
 * Safari, aber da geht's dann auch nicht"-Fund — every PDF in the app
 * went through window.print(), which iOS blocks entirely in home-
 * screen (standalone) mode, and the "open in Safari" escape hatch
 * isn't reliable either. This is a small, dependency-free PDF writer
 * instead: it builds a real .pdf file (A4, built-in Helvetica with
 * WinAnsi encoding so German umlauts/ß/quotes work, wrapped text,
 * rectangles, lines, circles — enough for text documents AND the
 * tension-curve chart) that can be shared/downloaded as an ordinary
 * file, with no print dialog involved at all.
 *
 * Deliberately no imports: pure TypeScript so it can also be run
 * directly by Node for testing. Coordinates passed to the drawing
 * methods are measured from the TOP-left of the page in points (like
 * screen coordinates); the writer flips them into PDF space.
 */

export type RGB = [number, number, number];

const PAGE_W = 595.28;
const PAGE_H = 841.89;

// Helvetica advance widths (1/1000 em) for ASCII 32..126.
const HELV: number[] = [
  278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556,
  278, 278, 584, 584, 584, 556, 1015,
  667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611,
  278, 278, 278, 469, 556, 333,
  556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500,
  334, 260, 334, 584,
];

const CP1252_EXTRA: Record<number, number> = {
  0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87,
  0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e,
  0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f,
};

const REPLACEMENTS: Record<string, string> = {
  '\u2192': '->', '\u2190': '<-', '\u2265': '>=', '\u2264': '<=', '\u2212': '-', '\u2713': 'x', '\u2714': 'x',
  '\u00a0': ' ', '\u2009': ' ', '\u202f': ' ', '\u2011': '-',
};

/** Unicode string -> array of cp1252 byte values; emoji and anything
 * unsupported is dropped (a PDF with built-in fonts cannot draw it). */
function toCp1252(input: string): number[] {
  const bytes: number[] = [];
  for (const ch of input) {
    const rep = REPLACEMENTS[ch];
    const text = rep ?? ch;
    for (const c of text) {
      const cp = c.codePointAt(0) as number;
      if (cp === 10 || cp === 13 || cp === 9) bytes.push(32);
      else if (cp >= 32 && cp <= 126) bytes.push(cp);
      else if (cp >= 0xa0 && cp <= 0xff) bytes.push(cp);
      else if (CP1252_EXTRA[cp] !== undefined) bytes.push(CP1252_EXTRA[cp]);
      // else: dropped (emoji, symbols, variation selectors, ...)
    }
  }
  return bytes;
}

function charWidth(code: number): number {
  if (code >= 32 && code <= 126) return HELV[code - 32];
  if (code === 0x84 || code === 0x93 || code === 0x94) return 333;
  if (code === 0x91 || code === 0x92) return 222;
  if (code === 0x96) return 556;
  if (code === 0x97 || code === 0x85) return 1000;
  if (code === 0x95) return 350;
  if (code === 0xc4) return 667;
  if (code === 0xd6) return 778;
  if (code === 0xdc) return 722;
  if (code === 0xdf) return 611;
  return 556;
}

export interface TextStyle {
  size?: number;
  bold?: boolean;
  italic?: boolean;
  color?: RGB;
}

export function measureText(text: string, size: number, bold = false): number {
  let w = 0;
  for (const code of toCp1252(text)) w += charWidth(code);
  return (w * size * (bold ? 1.06 : 1)) / 1000;
}

function hexOf(bytes: number[]): string {
  let out = '';
  for (const b of bytes) out += b.toString(16).padStart(2, '0');
  return out;
}

function rgbOps(c: RGB, stroke: boolean): string {
  const [r, g, b] = c.map((v) => (Math.max(0, Math.min(255, v)) / 255).toFixed(3));
  return `${r} ${g} ${b} ${stroke ? 'RG' : 'rg'}`;
}

function fmt(n: number): string {
  return Number(n.toFixed(2)).toString();
}

export function hexToRgb(hex: string): RGB {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full.slice(0, 6), 16);
  if (Number.isNaN(n)) return [0, 0, 0];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export class PdfDoc {
  readonly width = PAGE_W;
  readonly height = PAGE_H;
  readonly margin = 48;
  /** Current writing position, measured from the top of the page. */
  y = 48;
  private pages: string[] = [];
  private footerText = '';

  constructor(footerText = '') {
    this.footerText = footerText;
    this.addPage();
  }

  get contentWidth(): number {
    return PAGE_W - this.margin * 2;
  }

  addPage() {
    this.pages.push('');
    this.y = this.margin;
  }

  private cur(): number {
    return this.pages.length - 1;
  }

  private emit(op: string) {
    this.pages[this.cur()] += op + '\n';
  }

  /** Starts a new page if fewer than `h` points remain. */
  ensure(h: number) {
    if (this.y + h > PAGE_H - this.margin - 14) this.addPage();
  }

  space(h: number) {
    this.y += h;
  }

  /** Draws one line of text at an absolute position (no wrapping). */
  text(x: number, yTop: number, str: string, style: TextStyle = {}) {
    const size = style.size ?? 11;
    const font = style.bold ? 'F2' : style.italic ? 'F3' : 'F1';
    const color = style.color ?? [30, 30, 30];
    const bytes = toCp1252(str);
    if (bytes.length === 0) return;
    this.emit(`BT ${rgbOps(color, false)} /${font} ${fmt(size)} Tf ${fmt(x)} ${fmt(PAGE_H - yTop - size * 0.8)} Td <${hexOf(bytes)}> Tj ET`);
  }

  /** Wraps `str` to maxWidth and returns the lines (no drawing). */
  wrap(str: string, size: number, bold: boolean, maxWidth: number): string[] {
    const lines: string[] = [];
    const paragraphs = str.split(/\n/);
    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean);
      if (words.length === 0) {
        lines.push('');
        continue;
      }
      let line = '';
      for (const word of words) {
        const trial = line ? `${line} ${word}` : word;
        if (measureText(trial, size, bold) <= maxWidth) {
          line = trial;
        } else {
          if (line) lines.push(line);
          // a single very long word: hard-break it
          let rest = word;
          while (measureText(rest, size, bold) > maxWidth && rest.length > 1) {
            let cut = rest.length - 1;
            while (cut > 1 && measureText(rest.slice(0, cut), size, bold) > maxWidth) cut--;
            lines.push(rest.slice(0, cut));
            rest = rest.slice(cut);
          }
          line = rest;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  }

  /** Flowing paragraph with wrapping and automatic page breaks. */
  paragraph(str: string, style: TextStyle & { indent?: number; gap?: number; maxWidth?: number } = {}) {
    const size = style.size ?? 11;
    const indent = style.indent ?? 0;
    const lineH = size * 1.38;
    const maxWidth = (style.maxWidth ?? this.contentWidth) - indent;
    const lines = this.wrap(str, size, !!style.bold, maxWidth);
    for (const line of lines) {
      this.ensure(lineH);
      if (line) this.text(this.margin + indent, this.y, line, style);
      this.y += lineH;
    }
    this.y += style.gap ?? 4;
  }

  heading(str: string, level: 1 | 2 | 3 = 1, color: RGB = [40, 60, 45]) {
    const size = level === 1 ? 20 : level === 2 ? 14 : 12;
    this.ensure(size * 2.2);
    if (level > 1) this.y += level === 2 ? 8 : 4;
    this.paragraph(str, { size, bold: true, color, gap: level === 1 ? 6 : 3 });
  }

  rect(x: number, yTop: number, w: number, h: number, opts: { fill?: RGB; stroke?: RGB; lineWidth?: number } = {}) {
    const parts: string[] = [];
    if (opts.fill) parts.push(rgbOps(opts.fill, false));
    if (opts.stroke) parts.push(rgbOps(opts.stroke, true), `${fmt(opts.lineWidth ?? 0.8)} w`);
    const paint = opts.fill && opts.stroke ? 'B' : opts.fill ? 'f' : 'S';
    this.emit(`${parts.join(' ')} ${fmt(x)} ${fmt(PAGE_H - yTop - h)} ${fmt(w)} ${fmt(h)} re ${paint}`);
  }

  line(x1: number, y1: number, x2: number, y2: number, opts: { color?: RGB; width?: number; dash?: [number, number] } = {}) {
    const dash = opts.dash ? `[${opts.dash[0]} ${opts.dash[1]}] 0 d` : '[] 0 d';
    this.emit(`${rgbOps(opts.color ?? [120, 120, 120], true)} ${fmt(opts.width ?? 0.8)} w ${dash} ${fmt(x1)} ${fmt(PAGE_H - y1)} m ${fmt(x2)} ${fmt(PAGE_H - y2)} l S`);
  }

  polyline(points: [number, number][], opts: { color?: RGB; width?: number } = {}) {
    if (points.length < 2) return;
    const [first, ...rest] = points;
    const path = `${fmt(first[0])} ${fmt(PAGE_H - first[1])} m ` + rest.map((p) => `${fmt(p[0])} ${fmt(PAGE_H - p[1])} l`).join(' ');
    this.emit(`${rgbOps(opts.color ?? [90, 90, 90], true)} ${fmt(opts.width ?? 1.2)} w [] 0 d 1 j 1 J ${path} S`);
  }

  circle(cx: number, cy: number, r: number, opts: { fill?: RGB; stroke?: RGB; lineWidth?: number } = {}) {
    const k = 0.5523 * r;
    const y = PAGE_H - cy;
    const path =
      `${fmt(cx + r)} ${fmt(y)} m ` +
      `${fmt(cx + r)} ${fmt(y + k)} ${fmt(cx + k)} ${fmt(y + r)} ${fmt(cx)} ${fmt(y + r)} c ` +
      `${fmt(cx - k)} ${fmt(y + r)} ${fmt(cx - r)} ${fmt(y + k)} ${fmt(cx - r)} ${fmt(y)} c ` +
      `${fmt(cx - r)} ${fmt(y - k)} ${fmt(cx - k)} ${fmt(y - r)} ${fmt(cx)} ${fmt(y - r)} c ` +
      `${fmt(cx + k)} ${fmt(y - r)} ${fmt(cx + r)} ${fmt(y - k)} ${fmt(cx + r)} ${fmt(y)} c h`;
    const parts: string[] = [];
    if (opts.fill) parts.push(rgbOps(opts.fill, false));
    if (opts.stroke) parts.push(rgbOps(opts.stroke, true), `${fmt(opts.lineWidth ?? 0.8)} w`);
    const paint = opts.fill && opts.stroke ? 'B' : opts.fill ? 'f' : 'S';
    this.emit(`${parts.join(' ')} ${path} ${paint}`);
  }

  /** Serialises the document to PDF bytes. */
  toBytes(): Uint8Array {
    const total = this.pages.length;
    const objects: string[] = [];
    // 1 catalog, 2 pages, 3-5 fonts, then (page, content) pairs
    const pageObjStart = 6;
    const kids = this.pages.map((_, i) => `${pageObjStart + i * 2} 0 R`).join(' ');
    objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
    objects[2] = `<< /Type /Pages /Kids [${kids}] /Count ${total} >>`;
    objects[3] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
    objects[4] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';
    objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Oblique /Encoding /WinAnsiEncoding >>';
    this.pages.forEach((content, i) => {
      let stream = content;
      if (this.footerText) {
        const footer = `${this.footerText} — ${i + 1}/${total}`;
        const bytes = toCp1252(footer);
        stream += `BT ${rgbOps([130, 130, 130], false)} /F1 8 Tf ${fmt(this.margin)} 28 Td <${hexOf(bytes)}> Tj ET\n`;
      }
      const pageNo = pageObjStart + i * 2;
      objects[pageNo] =
        `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${fmt(PAGE_W)} ${fmt(PAGE_H)}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R /F3 5 0 R >> >> /Contents ${pageNo + 1} 0 R >>`;
      objects[pageNo + 1] = `<< /Length ${stream.length} >>\nstream\n${stream}endstream`;
    });

    let pdf = '%PDF-1.4\n';
    const offsets: number[] = [];
    for (let n = 1; n < objects.length; n++) {
      offsets[n] = pdf.length;
      pdf += `${n} 0 obj\n${objects[n]}\nendobj\n`;
    }
    const xrefStart = pdf.length;
    pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
    for (let n = 1; n < objects.length; n++) pdf += `${String(offsets[n]).padStart(10, '0')} 00000 n \n`;
    pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    // The whole file is plain ASCII (text is written as hex strings), so
    // character count equals byte count.
    const out = new Uint8Array(pdf.length);
    for (let i = 0; i < pdf.length; i++) out[i] = pdf.charCodeAt(i) & 255;
    return out;
  }
}
