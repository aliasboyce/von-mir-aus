import { PdfDoc, hexToRgb, measureText, setEmojiImages, type RGB } from '../../services/pdf/pdfBuilder';
import { prepareEmojis } from '../../services/pdf/emojiImages';
import { ACCENT } from './budgetModel';
import type { BudgetData } from './budgetCalc';
import { reviewSentence, type Review } from './budgetReview';

const INK: RGB = [38, 35, 31];
const MUTED: RGB = [110, 106, 98];
const TEAL = hexToRgb('#3f8f9b');
const tint = (c: RGB, t: number): RGB => [Math.round(c[0] + (255 - c[0]) * t), Math.round(c[1] + (255 - c[1]) * t), Math.round(c[2] + (255 - c[2]) * t)];

/** PDF-Finanzrückblick: Zahlen, Balken, Linie, Töpfe – alles mit Zeichenbefehlen, ohne Bilder */
export async function buildFinancePdf(_data: BudgetData, rv: Review, lang: 'de' | 'en', m: (n: number, o?: { sign?: boolean; round?: boolean }) => string): Promise<Uint8Array> {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const texts = [rv.title, ...rv.cats.map((c) => `${c.emoji} ${c.label}`), ...rv.top.map((f) => `${f.emoji} ${f.label}`)];
  try { setEmojiImages(await prepareEmojis(texts)); } catch { setEmojiImages(new Map()); }
  try {
    const doc = new PdfDoc(`${L('von mir aus – Finanz-Rückblick', 'von mir aus – finance review')}: ${rv.title}`);
    const x0 = doc.margin;
    const W = doc.contentWidth;
    const right = (xr: number, y: number, s: string, size = 10.5, color: RGB = INK, bold = false) => doc.text(xr - measureText(s, size, bold), y, s, { size, color, bold });

    // Kopf
    doc.rect(x0, doc.y, W, 44, { fill: TEAL });
    doc.text(x0 + 12, doc.y + 8, L('Finanz-Rückblick', 'Finance review'), { size: 11, color: [255, 255, 255] });
    doc.text(x0 + 12, doc.y + 23, rv.title, { size: 17, bold: true, color: [255, 255, 255] });
    doc.space(56);
    const kindLabel = rv.kind === 'week' ? L('Woche', 'Week') : rv.kind === 'month' ? L('Monat', 'Month') : L('Mehrere Monate', 'Several months');
    doc.paragraph(`${kindLabel} · ${rv.from} – ${rv.to}`, { size: 9.5, color: MUTED, gap: 8 });
    doc.paragraph(reviewSentence(rv, (n) => m(n), L), { size: 12, color: INK, gap: 10 });

    // Kennzahlen
    const s = rv.summary;
    const boxes: [string, number, string][] = [
      [L('Hatte', 'Had'), s.had, ACCENT.in],
      [L('Ausgegeben', 'Spent'), s.paid + s.open, ACCENT.out],
      [s.free >= 0 ? L('Übrig', 'Left') : L('Es fehlten', 'Short by'), Math.abs(s.free), ACCENT.free],
      [L('Gespart', 'Saved'), rv.saved, ACCENT.save],
    ];
    doc.ensure(64);
    const bw = (W - 3 * 8) / 4;
    boxes.forEach(([label, v, col], i) => {
      const x = x0 + i * (bw + 8);
      const c = hexToRgb(col);
      doc.rect(x, doc.y, bw, 48, { fill: tint(c, 0.82) });
      doc.rect(x, doc.y, 4, 48, { fill: c });
      doc.text(x + 10, doc.y + 8, label, { size: 9, color: MUTED });
      doc.text(x + 10, doc.y + 24, m(v), { size: 13, bold: true, color: INK });
    });
    doc.space(62);

    // Diagramm
    doc.ensure(190);
    doc.paragraph(rv.kind === 'week' ? L('Tag für Tag', 'Day by day') : rv.kind === 'month' ? L('Woche für Woche', 'Week by week') : L('Monat für Monat', 'Month by month'), { size: 11.5, bold: true, gap: 4 });
    const ch = { x: x0, y: doc.y, w: W, h: 140 };
    const bs = rv.buckets;
    const max = Math.max(1, ...bs.map((b) => Math.max(b.in, b.out, rv.kind === 'months' ? Math.abs(b.free) : 0)));
    const min = rv.kind === 'months' ? Math.min(0, ...bs.map((b) => b.free)) : 0;
    const range = max - min || 1;
    const top = ch.y + 8, bottom = ch.y + ch.h - 20;
    const yv = (v: number) => top + (1 - (v - min) / range) * (bottom - top);
    doc.line(ch.x, yv(0), ch.x + ch.w, yv(0), { color: [200, 196, 188], width: 0.6 });
    const slot = ch.w / bs.length;
    const barW = Math.min(20, slot / 2.6);
    bs.forEach((b, i) => {
      const cx = ch.x + slot * i + slot / 2;
      const yi = yv(b.in), yo = yv(b.out), y0 = yv(0);
      doc.rect(cx - barW - 1, Math.min(yi, y0), barW, Math.max(0.8, Math.abs(y0 - yi)), { fill: hexToRgb(ACCENT.in) });
      doc.rect(cx + 1, Math.min(yo, y0), barW, Math.max(0.8, Math.abs(y0 - yo)), { fill: hexToRgb(ACCENT.out) });
      const lw = measureText(b.label, 8.5);
      doc.text(cx - lw / 2, ch.y + ch.h - 14, b.label, { size: 8.5, color: MUTED });
    });
    if (rv.kind === 'months' && bs.length > 1) {
      doc.polyline(bs.map((b, i) => [ch.x + slot * i + slot / 2, yv(b.free)] as [number, number]), { color: hexToRgb(ACCENT.free), width: 2 });
      bs.forEach((b, i) => doc.circle(ch.x + slot * i + slot / 2, yv(b.free), 2.6, { fill: hexToRgb(ACCENT.free) }));
    }
    doc.space(ch.h + 4);
    // Legende
    const leg: [string, string][] = [[ACCENT.in, L('Einnahmen', 'Income')], [ACCENT.out, L('Ausgaben', 'Spending')], ...(rv.kind === 'months' ? [[ACCENT.free, L('Übrig', 'Left')] as [string, string]] : [])];
    let lx = x0;
    leg.forEach(([c, t]) => { doc.rect(lx, doc.y + 2, 9, 9, { fill: hexToRgb(c) }); doc.text(lx + 13, doc.y + 1.5, t, { size: 9, color: MUTED }); lx += 24 + measureText(t, 9); });
    doc.space(20);

    // Tabelle der Monate
    if (rv.kind === 'months') {
      doc.ensure(24 + bs.length * 16);
      doc.text(x0, doc.y, L('Monat', 'Month'), { size: 9, color: MUTED, bold: true });
      right(x0 + W * 0.5, doc.y, L('Hatte', 'Had'), 9, MUTED, true);
      right(x0 + W * 0.75, doc.y, L('Ausgegeben', 'Spent'), 9, MUTED, true);
      right(x0 + W, doc.y, L('Übrig', 'Left'), 9, MUTED, true);
      doc.space(14);
      bs.forEach((b) => {
        doc.ensure(16);
        doc.line(x0, doc.y - 2, x0 + W, doc.y - 2, { color: [226, 222, 214], width: 0.4 });
        doc.text(x0, doc.y + 1, b.label, { size: 10 });
        right(x0 + W * 0.5, doc.y + 1, m(b.in, { round: true }), 10);
        right(x0 + W * 0.75, doc.y + 1, m(b.out, { round: true }), 10);
        right(x0 + W, doc.y + 1, m(b.free, { round: true }), 10, b.free >= 0 ? [40, 110, 120] : [160, 100, 20], true);
        doc.space(16);
      });
      doc.space(8);
    }

    // Wofür
    if (rv.cats.length) {
      doc.ensure(40);
      doc.paragraph(L('Wofür ging Geld raus?', 'What did money go to?'), { size: 11.5, bold: true, gap: 4 });
      const mx = Math.max(1, ...rv.cats.map((c) => c.spent));
      rv.cats.forEach((c) => {
        doc.ensure(28);
        doc.text(x0, doc.y, `${c.emoji} ${c.label}`, { size: 10 });
        right(x0 + W, doc.y, m(c.spent), 10);
        doc.rect(x0, doc.y + 14, W, 6, { fill: [236, 233, 226] });
        doc.rect(x0, doc.y + 14, Math.max(2, (c.spent / mx) * W), 6, { fill: hexToRgb(c.color) });
        doc.space(26);
      });
    }

    // Fest & Rechnungen
    doc.ensure(70);
    doc.paragraph(L('Feste Kosten & Rechnungen', 'Fixed costs & bills'), { size: 11.5, bold: true, gap: 4 });
    const kv = (a: string, b: string) => { doc.ensure(16); doc.text(x0, doc.y, a, { size: 10, color: MUTED }); right(x0 + W, doc.y, b, 10); doc.space(15); };
    kv(L('bezahlt', 'paid'), m(rv.fixedPaid));
    kv(L('noch offen', 'still open'), m(rv.fixedOpen));
    kv(L('Rechnungen in diesem Zeitraum', 'Bills in this period'), `${rv.bills.count} · ${m(rv.bills.sum)}`);
    doc.space(6);

    // Größte Posten
    if (rv.top.length) {
      doc.ensure(40);
      doc.paragraph(L('Die größten Posten', 'The biggest items'), { size: 11.5, bold: true, gap: 4 });
      rv.top.forEach((f) => kv(`${f.emoji} ${f.label}`, m(f.amount)));
    }
    doc.space(10);
    doc.paragraph(L('Diese Zahlen sind eine Orientierung, keine Bewertung. Manches ist geschätzt oder noch nicht abgehakt.', 'These numbers are an orientation, not a judgement. Some are estimated or not ticked off yet.'), { size: 9, color: MUTED });
    return doc.toBytes();
  } finally {
    setEmojiImages(new Map());
  }
}
