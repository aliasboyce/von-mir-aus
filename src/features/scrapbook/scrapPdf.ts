import { createElement } from 'react';
import { PdfDoc } from '../../services/pdf/pdfBuilder';
import { toJpeg } from '../../services/pdf/jpeg';
import { svgToPngBlob } from '../../services/snapshot';
import { ScrapPageView } from './ScrapPageView';
import type { MindMap } from '../mindmap/mindmapModel';

/** Eine Seite als PNG (A4-Verhältnis, volle Seite). null = der Browser kann es nicht. */
export async function scrapPagePng(page: MindMap, maxSide = 2000): Promise<Blob | null> {
  try {
    const { renderToStaticMarkup } = await import('react-dom/server');
    const html = renderToStaticMarkup(createElement(ScrapPageView, { page }));
    const m = /<svg\b[\s\S]*<\/svg>/.exec(html);
    if (!m) return null;
    return await svgToPngBlob(m[0], { maxSide, background: '#ffffff' });
  } catch {
    return null;
  }
}

/** Jede Seite = eine A4-Seite im PDF, Papier bis zum Rand. */
export async function buildScrapPdf(pages: MindMap[], onProgress?: (done: number, total: number) => void): Promise<{ bytes: Uint8Array; failed: number }> {
  const doc = new PdfDoc('');
  let failed = 0;
  let first = true;
  for (let i = 0; i < pages.length; i++) {
    onProgress?.(i, pages.length);
    const blob = await scrapPagePng(pages[i]);
    const jpg = blob ? await toJpeg(blob, 2000, 0.88) : null;
    if (!first) doc.addPage();
    first = false;
    if (jpg) doc.image(jpg.bytes, jpg.w, jpg.h, 0, 0, doc.width, doc.height);
    else {
      failed++;
      doc.text(48, 60, `Seite ${i + 1} konnte nicht gezeichnet werden.`, { size: 12 });
    }
  }
  onProgress?.(pages.length, pages.length);
  return { bytes: doc.toBytes(), failed };
}
