import { PdfDoc, type RGB } from './pdfBuilder';
import { deliverPdf, safeFilename } from './pdfShare';

/**
 * "Das PDF funktioniert nicht, er sagt er braucht Safari" — fuer ALLE
 * Druckansichten der App. Every print view (Medi-Log, Bruecken,
 * Lesezeichen, Netzwerk, Quellen, Sicherheitsplan, Meine Entwicklung,
 * ...) is a `.print-only` block that already holds the document's text.
 * iOS blocks window.print() in home-screen mode, so instead of one PDF
 * builder per page this walks that block's DOM and writes the same
 * content as a real PDF: headings, paragraphs, list items, table rows
 * (cells joined with " | "), with the inline size / weight / color
 * where the view set them. Charts (SVG) and images cannot be carried
 * over and are left out — pages where the chart matters (the tension
 * curve) have their own chart PDF.
 */
const BLOCK = new Set(['DIV', 'P', 'H1', 'H2', 'H3', 'H4', 'UL', 'OL', 'TABLE', 'SECTION', 'ARTICLE', 'HEADER', 'FOOTER', 'BLOCKQUOTE', 'PRE', 'LI', 'TR', 'THEAD', 'TBODY']);

function clean(s: string | null): string {
  return (s ?? '').replace(/\s+/g, ' ').trim();
}

function parseColor(value: string): RGB | undefined {
  const m = value.trim().match(/^#([0-9a-f]{6})$/i) || value.trim().match(/^#([0-9a-f]{3})$/i);
  if (!m) return undefined;
  const h = m[1].length === 3 ? m[1].split('').map((c) => c + c).join('') : m[1];
  const n = parseInt(h, 16);
  const rgb: RGB = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  // pure white text would vanish on the white page
  return rgb[0] > 235 && rgb[1] > 235 && rgb[2] > 235 ? undefined : rgb;
}

function styleOf(el: HTMLElement, base: { size: number; bold: boolean; color?: RGB }) {
  const px = parseFloat(el.style.fontSize || '');
  const size = Number.isFinite(px) ? Math.max(8, Math.min(20, Math.round(px * 0.78 * 10) / 10)) : base.size;
  const weight = el.style.fontWeight;
  const bold = base.bold || el.tagName === 'B' || el.tagName === 'STRONG' || weight === 'bold' || Number(weight) >= 600;
  const color = el.style.color ? parseColor(el.style.color) ?? base.color : base.color;
  return { size, bold, color };
}

function hasBlockChild(el: HTMLElement): boolean {
  return [...el.children].some((c) => BLOCK.has(c.tagName) || c.tagName === 'SVG' || c.tagName === 'svg');
}

function walk(doc: PdfDoc, el: HTMLElement, base: { size: number; bold: boolean; color?: RGB }, indent: number) {
  const tag = el.tagName;
  if (tag === 'SVG' || tag === 'svg' || tag === 'IMG' || tag === 'SCRIPT' || tag === 'STYLE') return;
  const st = styleOf(el, base);

  if (/^H[1-4]$/.test(tag)) {
    const text = clean(el.textContent);
    if (text) doc.heading(text, tag === 'H1' ? 1 : tag === 'H2' ? 2 : 3);
    return;
  }
  if (tag === 'TABLE') {
    el.querySelectorAll('tr').forEach((tr) => {
      const cells = [...tr.children].map((c) => clean(c.textContent)).filter(Boolean);
      if (cells.length === 0) return;
      const isHead = tr.querySelector('th') !== null;
      doc.paragraph(cells.join('   |   '), { size: Math.min(st.size, 10), bold: isHead, color: isHead ? [110, 110, 110] : st.color, indent, gap: 2 });
    });
    doc.space(4);
    return;
  }
  if (tag === 'UL' || tag === 'OL') {
    [...el.children].forEach((li, i) => {
      const text = clean(li.textContent);
      if (text) doc.paragraph(`${tag === 'OL' ? `${i + 1}.` : '-'}  ${text}`, { size: st.size, bold: st.bold, color: st.color, indent: indent + 8, gap: 2 });
    });
    doc.space(2);
    return;
  }
  if (!hasBlockChild(el)) {
    // a run of inline content: one paragraph
    const text = clean(el.textContent);
    if (text) doc.paragraph(text, { size: st.size, bold: st.bold, color: st.color, indent, gap: tag === 'LI' || tag === 'TR' ? 2 : 4 });
    return;
  }
  // mixed block: loose text nodes between block children count as paragraphs too
  el.childNodes.forEach((n) => {
    if (n.nodeType === Node.TEXT_NODE) {
      const text = clean(n.textContent);
      if (text) doc.paragraph(text, { size: st.size, bold: st.bold, color: st.color, indent, gap: 3 });
    } else if (n.nodeType === Node.ELEMENT_NODE) {
      walk(doc, n as HTMLElement, st, indent);
    }
  });
}

/** Builds the PDF from every `.print-only` block currently in the
 * document. Returns false when there is nothing to print. */
export async function exportPrintBlocksToPdf(fallbackTitle = 'dokument', only?: string): Promise<boolean> {
  const roots = [...document.querySelectorAll<HTMLElement>('.print-only')].filter((e) => !only || e.dataset.printId === only);
  if (roots.length === 0) return false;
  const doc = new PdfDoc('von mir aus');
  roots.forEach((root, i) => {
    if (i > 0) doc.addPage();
    walk(doc, root, { size: 10.5, bold: false }, 0);
  });
  const title = clean(roots[0].querySelector('h1, h2')?.textContent ?? null) || fallbackTitle;
  const result = await deliverPdf(doc.toBytes(), safeFilename(title, fallbackTitle), title);
  return result !== 'failed';
}
