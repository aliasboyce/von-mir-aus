import { PdfDoc, hexToRgb, setEmojiImages, type RGB } from '../../services/pdf/pdfBuilder';
import { prepareEmojis } from '../../services/pdf/emojiImages';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { toJpeg } from '../../services/pdf/jpeg';
import { mindmapRepo } from '../mindmap/mindmapModel';
import { shapeInfo, type Node3D, type Space3D, type Version3D } from './space3dModel';

const INK: RGB = [43, 42, 40];
const MUTED: RGB = [110, 106, 98];
const ACCENT: RGB = [74, 143, 158];

type Lfn = (de: string, en: string) => string;
const when = (iso: string, lang: 'de' | 'en') => {
  try { return new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { dateStyle: 'medium', timeStyle: 'short' }); } catch { return iso; }
};
const tint = (c: RGB, k: number): RGB => [Math.round(c[0] + (255 - c[0]) * k), Math.round(c[1] + (255 - c[1]) * k), Math.round(c[2] + (255 - c[2]) * k)];

function band(doc: PdfDoc, title: string, color: RGB) {
  doc.ensure(48);
  doc.space(8);
  doc.rect(doc.margin, doc.y, doc.contentWidth, 22, { fill: color });
  doc.text(doc.margin + 9, doc.y + 5, title, { size: 12, bold: true, color: [255, 255, 255] });
  doc.space(30);
}

function texts(title: string, sp: Space3D, versions: Version3D[]): string[] {
  const t: string[] = [title];
  sp.nodes.forEach((n) => { t.push(n.text, n.symbol ?? '', n.note ?? ''); });
  sp.layers.forEach((l) => t.push(l.name));
  sp.edges.forEach((e) => t.push(e.label ?? ''));
  sp.shots?.forEach((s) => t.push(s.name));
  versions.forEach((v) => t.push(v.name));
  return t;
}

export interface Pdf3dOptions { overview?: string | null; shots: boolean; versions: boolean; details: boolean }

export async function buildMindmap3dPdf(mapId: string, title: string, sp: Space3D, versions: Version3D[], opts: Pdf3dOptions, lang: 'de' | 'en'): Promise<Uint8Array> {
  const L: Lfn = (de, en) => (lang === 'en' ? en : de);
  try { setEmojiImages(await prepareEmojis(texts(title, sp, versions))); } catch { setEmojiImages(new Map()); }
  try {
    const doc = new PdfDoc(`${L('von mir aus – 3D-Mindmap', 'von mir aus – 3D mind map')}: ${title}`);
    doc.rect(doc.margin, doc.y, doc.contentWidth, 7, { fill: ACCENT });
    doc.space(20);
    doc.paragraph(title || L('3D-Mindmap', '3D mind map'), { size: 24, bold: true, color: INK, gap: 2 });
    doc.paragraph(`${sp.nodes.length} ${L('Dinge', 'things')} · ${sp.layers.length} ${L('Ebenen', 'layers')} · ${sp.edges.length} ${L('Verbindungen', 'links')}`, { size: 10, color: MUTED, gap: 8 });
    if (opts.overview) {
      const j = await toJpeg(opts.overview, 1600);
      if (j) doc.imageFlow(j.bytes, j.w, j.h, doc.contentWidth, 400);
    }

    if (opts.shots && sp.shots?.length) {
      band(doc, L('Fotos aus verschiedenen Blickwinkeln', 'Pictures from different angles'), ACCENT);
      const colW = (doc.contentWidth - 12) / 2;
      const shots = sp.shots;
      for (let i = 0; i < shots.length; i += 2) {
        const row = shots.slice(i, i + 2);
        const loaded = await Promise.all(row.map((s) => toJpeg(s.img, 900)));
        const h = Math.max(...loaded.map((j) => (j ? Math.min(colW / j.w, 200 / j.h) * j.h : 0)), 40) + 28;
        doc.ensure(h);
        const y0 = doc.y;
        loaded.forEach((j, k) => {
          if (!j) return;
          const kk = Math.min(colW / j.w, 200 / j.h);
          doc.image(j.bytes, j.w, j.h, doc.margin + k * (colW + 12), y0, j.w * kk, j.h * kk);
          doc.text(doc.margin + k * (colW + 12), y0 + j.h * kk + 4, row[k].name, { size: 9, bold: true, color: INK });
          doc.text(doc.margin + k * (colW + 12), y0 + j.h * kk + 15, when(row[k].at, lang), { size: 8, color: MUTED });
        });
        doc.y = y0 + h;
      }
    }

    if (opts.details) {
      band(doc, L('Ebenen und Dinge', 'Layers and things'), ACCENT);
      const line = (n: Node3D) => {
        const parts = [`${n.symbol ? n.symbol + ' ' : ''}${n.text || '…'}`, `(${L(shapeInfo(n.shape).de, shapeInfo(n.shape).en)})`];
        doc.paragraph(`• ${parts.join(' ')}`, { size: 10.5, color: INK, indent: 10, gap: 1 });
        if (n.note) doc.paragraph(n.note, { size: 9.5, color: MUTED, indent: 22, gap: 2 });
        if (n.link) {
          const m = mindmapRepo.getById(n.link);
          if (m) doc.paragraph(`↗ ${m.title || L('Mindmap', 'Mind map')}`, { size: 9.5, color: MUTED, indent: 22, gap: 2 });
        }
      };
      [...sp.layers].sort((a, b) => b.y - a.y).forEach((ly) => {
        doc.ensure(30);
        const c = hexToRgb(ly.color);
        doc.rect(doc.margin, doc.y + 2, 8, 8, { fill: c });
        doc.paragraph(`${ly.name || '…'}  ·  ${L('Höhe', 'height')} ${ly.y}`, { size: 11, bold: true, color: INK, indent: 14, gap: 2 });
        sp.nodes.filter((n) => n.layerId === ly.id).forEach(line);
      });
      const loose = sp.nodes.filter((n) => !n.layerId || !sp.layers.some((l) => l.id === n.layerId));
      if (loose.length) {
        doc.paragraph(L('Ohne Ebene', 'No layer'), { size: 11, bold: true, color: INK, gap: 2 });
        loose.forEach(line);
      }
      const photos = sp.nodes.filter((n) => n.image);
      if (photos.length) {
        band(doc, L('Fotos in der Karte', 'Photos in the map'), ACCENT);
        for (const n of photos) {
          const j = await toJpeg(n.image!, 700);
          if (!j) continue;
          const k = Math.min(180 / j.w, 140 / j.h);
          doc.ensure(j.h * k + 22);
          doc.image(j.bytes, j.w, j.h, doc.margin, doc.y, j.w * k, j.h * k);
          doc.text(doc.margin + j.w * k + 10, doc.y + 4, n.text || '…', { size: 10, bold: true, color: INK });
          doc.y += j.h * k + 10;
        }
      }
      if (sp.edges.length) {
        band(doc, L('Verbindungen', 'Links'), ACCENT);
        sp.edges.forEach((e) => {
          const a = sp.nodes.find((n) => n.id === e.from);
          const b = sp.nodes.find((n) => n.id === e.to);
          if (!a || !b) return;
          doc.paragraph(`${a.text || '…'}  ${e.arrow ? '→' : '—'}  ${b.text || '…'}${e.label ? `   (${e.label})` : ''}`, { size: 10.5, color: INK, indent: 10, gap: 1 });
        });
      }
    }

    if (opts.versions && versions.length) {
      band(doc, L('Festgehaltene Stände', 'Saved states'), ACCENT);
      for (const v of [...versions].sort((a, b) => a.at.localeCompare(b.at))) {
        const j = v.thumb ? await toJpeg(v.thumb, 500) : null;
        const hh = j ? Math.min(150 / j.w, 90 / j.h) * j.h : 14;
        doc.ensure(hh + 18);
        const y0 = doc.y;
        if (j) {
          const k = Math.min(150 / j.w, 90 / j.h);
          doc.image(j.bytes, j.w, j.h, doc.margin, y0, j.w * k, j.h * k);
        }
        const tx = doc.margin + (j ? 160 : 0);
        doc.text(tx, y0 + 4, v.name || L('Stand', 'State'), { size: 11, bold: true, color: INK });
        doc.text(tx, y0 + 19, when(v.at, lang), { size: 9, color: MUTED });
        doc.text(tx, y0 + 31, `${v.space.nodes.length} ${L('Dinge', 'things')} · ${v.space.layers.length} ${L('Ebenen', 'layers')}`, { size: 9, color: tint(MUTED, 0.1) });
        doc.y = y0 + Math.max(hh, 44) + 8;
      }
    }
    void mapId;
    return doc.toBytes();
  } finally {
    setEmojiImages(new Map());
  }
}

export async function shareMindmap3dPdf(mapId: string, title: string, sp: Space3D, versions: Version3D[], opts: Pdf3dOptions, lang: 'de' | 'en') {
  const bytes = await buildMindmap3dPdf(mapId, title, sp, versions, opts, lang);
  return deliverPdf(bytes, safeFilename(title, '3d-mindmap'), title);
}
