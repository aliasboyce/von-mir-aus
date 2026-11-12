import { PdfDoc } from '../../services/pdf/pdfBuilder';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { CARD_H, CARD_MM_H, CARD_MM_W, CARD_W, renderCardCanvas } from './cardRender';
import { getPrefs } from './cardStore';
import type { CardModel } from './cardTypes';

const MM = 72 / 25.4;
/** Kartengröße in PDF-Punkten (63,5 × 88 mm) */
const CW = CARD_MM_W * MM;
const CH = CARD_MM_H * MM;
const COLS = 3;
const ROWS = 3;

async function jpegOf(card: CardModel, side: 'front' | 'back', lang: 'de' | 'en'): Promise<{ bytes: Uint8Array; w: number; h: number }> {
  // 1,2 × 635 = 762 px auf 63,5 mm ≈ 305 dpi
  const scale = 1.2;
  const src = await renderCardCanvas(card, { side, lang, scale, flat: false });
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  if (!ctx) throw new Error('canvas');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(src, 0, 0);
  const blob: Blob = await new Promise((res, rej) => out.toBlob((b) => (b ? res(b) : rej(new Error('jpeg'))), 'image/jpeg', 0.92));
  return { bytes: new Uint8Array(await blob.arrayBuffer()), w: out.width, h: out.height };
}

/** So viele Karten wie auf eine A4-Seite passen (3 × 3), in Druckgröße 63,5 × 88 mm, mit kleinen Schneidemarken. */
export async function buildCardsPdf(cards: CardModel[], lang: 'de' | 'en'): Promise<Uint8Array> {
  const doc = new PdfDoc('');
  const left = (doc.width - COLS * CW) / 2;
  const top = (doc.height - ROWS * CH) / 2;
  const withBacks = !!getPrefs().printBacks;
  const perSheet = COLS * ROWS;

  const marks = () => {
    for (let c = 0; c <= COLS; c++) {
      const x = left + c * CW;
      doc.line(x, top - 14, x, top - 4, { color: [150, 150, 150], width: 0.4 });
      doc.line(x, top + ROWS * CH + 4, x, top + ROWS * CH + 14, { color: [150, 150, 150], width: 0.4 });
    }
    for (let r = 0; r <= ROWS; r++) {
      const y = top + r * CH;
      doc.line(left - 14, y, left - 4, y, { color: [150, 150, 150], width: 0.4 });
      doc.line(left + COLS * CW + 4, y, left + COLS * CW + 14, y, { color: [150, 150, 150], width: 0.4 });
    }
  };

  for (let s = 0; s < cards.length; s += perSheet) {
    const group = cards.slice(s, s + perSheet);
    if (s > 0) doc.addPage();
    marks();
    for (let i = 0; i < group.length; i++) {
      const img = await jpegOf(group[i], 'front', lang);
      doc.image(img.bytes, img.w, img.h, left + (i % COLS) * CW, top + Math.floor(i / COLS) * CH, CW, CH);
    }
    if (withBacks) {
      doc.addPage();
      marks();
      for (let i = 0; i < group.length; i++) {
        // Rückseiten gespiegelt, damit sie beim Wenden an der langen Kante hinter der Vorderseite liegen
        const col = COLS - 1 - (i % COLS);
        const img = await jpegOf(group[i], 'back', lang);
        doc.image(img.bytes, img.w, img.h, left + col * CW, top + Math.floor(i / COLS) * CH, CW, CH);
      }
    }
  }
  return doc.toBytes();
}

export async function downloadCardsPdf(cards: CardModel[], lang: 'de' | 'en') {
  const bytes = await buildCardsPdf(cards, lang);
  const title = lang === 'en' ? 'Collection cards' : 'Sammelkarten';
  await deliverPdf(bytes, safeFilename(cards.length === 1 ? cards[0].title : title, 'sammelkarten'), title);
}

export { CARD_W, CARD_H };
