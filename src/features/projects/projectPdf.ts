import { PdfDoc, hexToRgb, type RGB } from '../../services/pdf/pdfBuilder';
import { deliverPdf, safeFilename } from '../../services/pdf/pdfShare';
import { toJpeg } from '../../services/pdf/jpeg';
import { parseBlocks, parseInline } from '../../services/richText';
import { mindmapRepo } from '../mindmap/mindmapModel';
import { mindmapPrintImages } from '../mindmap/mindmapSnapshot';
import { diaryCategoriesStore, DIARY_DEFAULT_CATEGORY_ID, DIARY_DEFAULT_CATEGORY_LABEL } from '../diary/diaryCategories';
import { routinesRepo } from '../routines/routinesRepo';
import { resourcesRepo } from '../resources/resourcesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import {
  budgetSums, formatDate, metaOf, money, personName, statusLabel, votesFor, weightSum,
  type Project, type ProjectBlock,
} from './projectModel';

/** Was ins PDF soll */
export interface PdfSelection {
  header: boolean;
  blocks: Record<string, boolean>;
  mindmaps: Record<string, boolean>;
  notes: boolean;
}

/** Hat der Baustein etwas zu zeigen? Leere Bausteine sind im PDF vorab abgewählt (lassen sich aber zuschalten). */
export function blockHasContent(b: ProjectBlock, p: Project): boolean {
  if (b.note?.trim()) return true;
  switch (b.kind) {
    case 'text': return b.text.trim().length > 0;
    case 'team': return p.people.length > 0 || p.roles.length > 0;
    case 'poll': return b.question.trim().length > 0 || b.options.length > 0;
    case 'proscons': return b.pros.length + b.cons.length > 0 || !!b.verdict?.trim();
    case 'table': return b.rows.some((r) => r.some((c) => c.trim())) || b.cols.some((c) => c.trim());
    case 'links': return b.mindmaps.length + b.categories.length + b.routines.length + b.resources.length + b.people.length + b.places.length + b.projects.length > 0;
    case 'timeline': return b.milestones.length > 0;
    default: return ((b as { items?: unknown[] }).items?.length ?? 0) > 0;
  }
}

export function defaultSelection(p: Project): PdfSelection {
  const blocks: Record<string, boolean> = {};
  const mindmaps: Record<string, boolean> = {};
  p.blocks.forEach((b) => {
    blocks[b.id] = blockHasContent(b, p);
    if (b.kind === 'links') b.mindmaps.forEach((id) => (mindmaps[id] = true));
  });
  return { header: true, blocks, mindmaps, notes: true };
}

export function linkedMindmapIds(p: Project): string[] {
  const ids: string[] = [];
  p.blocks.forEach((b) => { if (b.kind === 'links') b.mindmaps.forEach((id) => { if (!ids.includes(id)) ids.push(id); }); });
  return ids.filter((id) => mindmapRepo.getById(id));
}

const INK: RGB = [38, 35, 31];
const MUTED: RGB = [110, 106, 98];

type Doc = PdfDoc;

function band(doc: Doc, title: string, color: RGB) {
  doc.ensure(44);
  doc.space(10);
  doc.rect(doc.margin, doc.y, doc.contentWidth, 20, { fill: color });
  doc.text(doc.margin + 8, doc.y + 4.5, title, { size: 12, bold: true, color: [255, 255, 255] });
  doc.space(28);
}

function sub(doc: Doc, text: string) {
  doc.paragraph(text, { size: 10, bold: true, color: MUTED, gap: 2 });
}

function plain(doc: Doc, text: string, o: { size?: number; indent?: number; color?: RGB; bold?: boolean; gap?: number } = {}) {
  if (!text.trim()) return;
  doc.paragraph(text, { size: o.size ?? 10.5, indent: o.indent ?? 0, color: o.color ?? INK, bold: o.bold, gap: o.gap ?? 3 });
}

function checkbox(doc: Doc, x: number, yTop: number, checked: boolean, color: RGB) {
  doc.rect(x, yTop + 1, 9, 9, { stroke: color, lineWidth: 1 });
  if (checked) {
    doc.line(x + 2, yTop + 5.5, x + 4, yTop + 8, { color, width: 1.4 });
    doc.line(x + 4, yTop + 8, x + 8, yTop + 2.5, { color, width: 1.4 });
  }
}

/** a line with a tick box in front */
function checkLine(doc: Doc, text: string, checked: boolean, color: RGB, meta?: string, indent = 0) {
  const size = 10.5;
  const maxW = doc.contentWidth - indent - 16;
  const lines = doc.wrap(text || '…', size, false, maxW);
  const lineH = size * 1.38;
  doc.ensure(lineH * lines.length + 4);
  checkbox(doc, doc.margin + indent, doc.y, checked, color);
  lines.forEach((ln, i) => {
    doc.text(doc.margin + indent + 16, doc.y + i * lineH, ln, { size, color: checked ? MUTED : INK });
  });
  doc.y += lineH * lines.length;
  if (meta) {
    doc.paragraph(meta, { size: 9, color: MUTED, indent: indent + 16, gap: 3 });
  } else doc.y += 3;
}

/** rich text with headings, lists in three levels (dot / heart / star as small coloured marks) */
function rich(doc: Doc, markup: string, color: RGB, indent = 0) {
  parseBlocks(markup).forEach((b) => {
    const text = parseInline(b.text).map((p) => p.text).join('');
    if (b.kind === 'p') {
      if (!text.trim()) doc.space(4);
      else plain(doc, text, { indent });
    } else if (b.kind === 'h') {
      doc.paragraph(text, { size: 12, bold: true, color, indent, gap: 3 });
    } else {
      const ind = indent + 8 + b.level * 14;
      const size = 10.5;
      const lines = doc.wrap(text || ' ', size, false, doc.contentWidth - ind - 12);
      const lineH = size * 1.38;
      doc.ensure(lineH * lines.length);
      const cy = doc.y + size * 0.55;
      const mark: RGB = b.mark === 'heart' ? [200, 80, 105] : b.mark === 'star' ? [214, 160, 40] : INK;
      if (b.mark === 'dot') doc.circle(doc.margin + ind, cy, 1.8, { fill: mark });
      else if (b.mark === 'heart') doc.circle(doc.margin + ind, cy, 2.4, { fill: mark });
      else doc.rect(doc.margin + ind - 2.4, cy - 2.4, 4.8, 4.8, { fill: mark });
      lines.forEach((ln, i) => doc.text(doc.margin + ind + 8, doc.y + i * lineH, ln, { size, color: INK }));
      doc.y += lineH * lines.length + 2;
    }
  });
}

/** simple grid table with wrapped cells */
function grid(doc: Doc, head: string[], rows: string[][], widths: number[], color: RGB) {
  const size = 9.5;
  const lineH = size * 1.35;
  const total = widths.reduce((s, w) => s + w, 0);
  const W = widths.map((w) => (w / total) * doc.contentWidth);
  const draw = (cells: string[], bold: boolean, fill?: RGB) => {
    const wrapped = cells.map((c, i) => doc.wrap(c ?? '', size, bold, W[i] - 8));
    const rowH = Math.max(1, ...wrapped.map((w) => w.length)) * lineH + 6;
    doc.ensure(rowH);
    let x = doc.margin;
    cells.forEach((_, i) => {
      doc.rect(x, doc.y, W[i], rowH, { stroke: [185, 180, 170], fill, lineWidth: 0.6 });
      wrapped[i].forEach((ln, k) => doc.text(x + 4, doc.y + 3 + k * lineH, ln, { size, bold, color: bold ? [255, 255, 255] : INK }));
      x += W[i];
    });
    doc.y += rowH;
  };
  draw(head, true, color);
  rows.forEach((r) => draw(r, false));
  doc.space(6);
}

function timelineGraphic(doc: Doc, ms: { title: string; date: string; done: boolean }[], start: string | undefined, end: string | undefined, color: RGB, lang: 'de' | 'en') {
  const dated = ms.filter((m) => m.date).sort((a, b) => a.date.localeCompare(b.date));
  const days = (d: string) => Math.round(new Date(`${d}T12:00:00`).getTime() / 86400000);
  const all = [...dated.map((m) => m.date), ...(start ? [start] : []), ...(end ? [end] : [])];
  if (all.length < 2) return;
  const min = Math.min(...all.map(days));
  const max = Math.max(...all.map(days));
  const span = Math.max(1, max - min);
  doc.ensure(86);
  const x0 = doc.margin + 12;
  const x1 = doc.margin + doc.contentWidth - 12;
  const yLine = doc.y + 38;
  doc.line(x0, yLine, x1, yLine, { color: [190, 186, 176], width: 3 });
  const X = (d: string) => x0 + ((days(d) - min) / span) * (x1 - x0);
  dated.forEach((m, i) => {
    const x = X(m.date);
    doc.circle(x, yLine, 5, { fill: m.done ? color : [255, 255, 255], stroke: color, lineWidth: 1.6 });
    const up = i % 2 === 0;
    const label = m.title.length > 22 ? `${m.title.slice(0, 21)}…` : m.title;
    const lw = Math.max(40, label.length * 5);
    const tx = Math.min(Math.max(x - lw / 2, doc.margin), doc.margin + doc.contentWidth - lw);
    doc.text(tx, up ? yLine - 26 : yLine + 10, label, { size: 8.5, color: INK });
    doc.text(tx, up ? yLine - 15 : yLine + 20, formatDate(m.date, lang, false), { size: 8, color: MUTED });
  });
  doc.y = yLine + 36;
}

async function mindmapPages(doc: Doc, id: string, color: RGB, L: (de: string, en: string) => string) {
  const m = mindmapRepo.getById(id);
  if (!m) return;
  doc.addPage();
  band(doc, `${L('Mindmap', 'Mind map')}: ${m.title || L('ohne Namen', 'untitled')}`, color);
  if (m.kind === '3d' && m.space) {
    if (m.thumb) {
      const j = await toJpeg(m.thumb, 1400);
      if (j) doc.imageFlow(j.bytes, j.w, j.h, doc.contentWidth, 400);
    }
    sub(doc, L('Ebenen und Dinge', 'Layers and things'));
    [...m.space.layers].sort((a, b) => b.y - a.y).forEach((ly) => {
      doc.paragraph(ly.name || '…', { size: 10.5, bold: true, color: INK, gap: 1 });
      const nodes = m.space?.nodes.filter((n) => n.layerId === ly.id) ?? [];
      nodes.forEach((n) => plain(doc, `- ${n.text || '…'}`, { indent: 10, gap: 1 }));
    });
    const loose = m.space.nodes.filter((n) => !n.layerId || !m.space?.layers.some((l) => l.id === n.layerId));
    if (loose.length) {
      doc.paragraph(L('Ohne Ebene', 'No layer'), { size: 10.5, bold: true, color: INK, gap: 1 });
      loose.forEach((n) => plain(doc, `- ${n.text || '…'}`, { indent: 10, gap: 1 }));
    }
    return;
  }
  try {
    const imgs = await mindmapPrintImages(m);
    const list = [imgs.overview, ...imgs.tiles].filter(Boolean) as string[];
    for (let i = 0; i < list.length; i++) {
      const j = await toJpeg(list[i], 2000);
      if (!j) continue;
      if (i > 0) {
        doc.addPage();
        sub(doc, `${m.title || ''} · ${L('Ausschnitt', 'Detail')} ${i}`);
      }
      doc.imageFlow(j.bytes, j.w, j.h, doc.contentWidth, i === 0 ? 560 : 640);
    }
  } catch {
    plain(doc, L('(Das Bild der Mindmap ließ sich hier nicht erstellen. Die Texte stehen darunter.)', '(The picture of the mind map could not be made here. The texts follow below.)'), { color: MUTED });
  }
  // every text on its own line, so nothing is lost
  doc.addPage();
  sub(doc, `${m.title || ''} · ${L('Alle Elemente', 'All elements')}`);
  const name = (nid: string) => m.nodes.find((n) => n.id === nid)?.text?.trim() || '…';
  m.nodes.filter((n) => n.text?.trim()).forEach((n) => plain(doc, `- ${n.text.trim()}`, { gap: 1 }));
  if (m.edges.length) {
    doc.space(6);
    sub(doc, L('Verbindungen', 'Connections'));
    m.edges.forEach((e) => plain(doc, `${name(e.from)} ${e.arrow === 'both' ? '<->' : e.arrow === 'end' ? '->' : '-'}${e.label ? ` ${e.label} ${e.arrow === 'both' ? '<->' : e.arrow === 'end' ? '->' : '-'}` : ''} ${name(e.to)}`, { gap: 1 }));
  }
}

async function blockContent(doc: Doc, p: Project, b: ProjectBlock, color: RGB, L: (de: string, en: string) => string, lang: 'de' | 'en', sel: PdfSelection) {
  const me = L('Ich', 'Me');
  switch (b.kind) {
    case 'text':
      if (b.text.trim()) rich(doc, b.text, color);
      break;
    case 'tasks':
      b.items.forEach((t) => {
        const meta = [personName(p, t.who, me), t.due ? `${L('bis', 'due')} ${formatDate(t.due, lang)}${t.time ? ` ${t.time}` : ''}` : '', t.status === 'doing' ? L('in Arbeit', 'in progress') : '', t.note ?? ''].filter(Boolean).join(' · ');
        checkLine(doc, t.text, t.status === 'done', color, meta || undefined);
      });
      if (b.items.length === 0) plain(doc, L('(keine Aufgaben)', '(no tasks)'), { color: MUTED });
      break;
    case 'checklist':
      b.items.forEach((t) => checkLine(doc, t.text, t.done, color, t.who ? personName(p, t.who, me) : undefined));
      break;
    case 'timeline': {
      timelineGraphic(doc, b.milestones.map((m) => ({ title: m.title, date: m.date ?? '', done: m.done })), p.start, p.end, color, lang);
      [...b.milestones].sort((a, c) => (a.date ? 0 : 1) - (c.date ? 0 : 1) || (a.date ?? '').localeCompare(c.date ?? '')).forEach((m) => {
        checkLine(doc, m.title, m.done, color, [m.date ? formatDate(m.date, lang) + (m.time ? ` ${m.time}` : '') : '', m.note ?? ''].filter(Boolean).join(' · ') || undefined);
        m.steps.forEach((s) => checkLine(doc, s.text, s.done, color, s.date ? formatDate(s.date, lang) : undefined, 18));
      });
      break;
    }
    case 'team': {
      if (p.people.length) {
        grid(doc, [L('Name', 'Name'), L('Zeit', 'Availability'), L('Kontakt', 'Contact')], p.people.map((x) => [x.name, x.availability ?? '', x.contact ?? '']), [3, 4, 3], color);
      }
      if (p.roles.length) {
        sub(doc, L('Rollen', 'Roles'));
        grid(doc, [L('Rolle', 'Role'), L('Wer', 'Who'), L('Übernimmt', 'Takes care of')], p.roles.map((r) => [r.title, r.personIds.map((id) => personName(p, id, me)).filter(Boolean).join(', '), r.does ?? '']), [3, 3, 4], color);
      }
      break;
    }
    case 'budget': {
      const s = budgetSums(b);
      const m = (n: number) => money(n, b.currency, lang);
      plain(doc, `${L('Kosten', 'Costs')}: ${m(s.cost)}   ${L('Einnahmen', 'Income')}: ${m(s.income)}   ${L('Bleibt übrig', 'Left over')}: ${m(s.balance)}${b.limit ? `   ${L('Rahmen', 'Limit')}: ${m(b.limit)}` : ''}`, { bold: true });
      if (b.items.length) grid(doc, [L('Posten', 'Item'), L('Art', 'Type'), L('Wer', 'Who'), L('Betrag', 'Amount'), L('Stand', 'Status')], b.items.map((i) => [i.label, i.type === 'cost' ? L('Kosten', 'Cost') : L('Einnahme', 'Income'), personName(p, i.who, me), m(i.amount), i.type === 'cost' ? (i.paid ? L('bezahlt', 'paid') : L('offen', 'open')) : ''] ), [4, 2, 2, 2, 2], color);
      if (s.cost > 0) {
        sub(doc, L('Wer zahlt was', 'Who pays what'));
        [...s.perPerson.entries()].forEach(([who, amt]) => plain(doc, `${who === '' ? L('noch offen', 'not yet decided') : personName(p, who, me)}: ${m(amt)}`, { gap: 1 }));
      }
      break;
    }
    case 'risks':
      b.items.forEach((r) => {
        checkLine(doc, r.text, !!r.solved, color, [r.level === 1 ? L('eher unwahrscheinlich', 'rather unlikely') : r.level === 2 ? L('möglich', 'possible') : L('wahrscheinlich', 'likely'), r.planB ? `${L('Plan B', 'Plan B')}: ${r.planB}` : ''].filter(Boolean).join(' · '));
      });
      break;
    case 'decisions':
      b.items.forEach((d) => {
        doc.paragraph(`${formatDate(d.date, lang)}  ${d.text}`, { size: 10.5, bold: true, color: INK, gap: 1 });
        if (d.note) plain(doc, d.note, { indent: 10, color: MUTED });
      });
      break;
    case 'poll': {
      if (b.question) plain(doc, b.question, { bold: true });
      b.options.forEach((o, i) => {
        const vs = votesFor(b, o.id).map((id) => personName(p, id, me)).filter(Boolean);
        checkLine(doc, `${i + 1}) ${o.text}`, b.decided === o.id, color, `${vs.length} ${L('Stimmen', 'votes')}${vs.length ? ` (${vs.join(', ')})` : ''}${b.decided === o.id ? ` · ${L('entschieden', 'decided')}` : ''}`);
      });
      break;
    }
    case 'proscons': {
      sub(doc, `${L('Dafür', 'Pro')} (${weightSum(b.pros)})`);
      b.pros.forEach((x) => plain(doc, `+ ${x.text}  ${'*'.repeat(x.w)}`, { indent: 6, gap: 1 }));
      sub(doc, `${L('Dagegen', 'Con')} (${weightSum(b.cons)})`);
      b.cons.forEach((x) => plain(doc, `- ${x.text}  ${'*'.repeat(x.w)}`, { indent: 6, gap: 1 }));
      if (b.verdict) plain(doc, `${L('Meine Entscheidung', 'My decision')}: ${b.verdict}`, { bold: true });
      break;
    }
    case 'table':
      grid(doc, b.cols.map((c, i) => c || `${i + 1}`), b.rows, b.cols.map(() => 1), color);
      break;
    case 'links': {
      const names = (list: string[], f: (id: string) => string | undefined) => list.map(f).filter(Boolean).join(', ');
      const rows: [string, string][] = [
        [L('Mindmaps', 'Mind maps'), names(b.mindmaps, (id) => mindmapRepo.getById(id)?.title || undefined)],
        [L('Tagebuch-Bücher', 'Diary books'), names(b.categories, (id) => (id === DIARY_DEFAULT_CATEGORY_ID ? DIARY_DEFAULT_CATEGORY_LABEL : diaryCategoriesStore.getAll().find((c) => c.id === id)?.label))],
        [L('Routinen', 'Routines'), names(b.routines, (id) => routinesRepo.getById(id)?.title)],
        [L('Ressourcen', 'Resources'), names(b.resources, (id) => resourcesRepo.getById(id)?.title)],
        [L('Menschen', 'People'), names(b.people, (id) => networkRepo.getById(id)?.name)],
        [L('Orte', 'Places'), b.places.join(', ')],
        [L('Andere Projekte', 'Other projects'), ''],
      ];
      rows.filter(([, v]) => v).forEach(([k, v]) => plain(doc, `${k}: ${v}`, { gap: 2 }));
      break;
    }
    case 'reminders':
      b.items.forEach((r) => plain(doc, `${formatDate(r.date, lang)} ${r.time}  ${r.text}`, { gap: 2 }));
      break;
    case 'images':
      for (const im of b.items) {
        const j = await toJpeg(im.src, 1400);
        if (!j) continue;
        doc.imageFlow(j.bytes, j.w, j.h, doc.contentWidth, 330);
        if (im.caption) plain(doc, im.caption, { size: 9, color: MUTED });
      }
      break;
  }
  if (sel.notes && b.note?.trim()) {
    doc.space(2);
    sub(doc, L('Notiz', 'Note'));
    rich(doc, b.note, color, 6);
  }
}

/** baut das PDF; mehrere A4-Seiten, Mindmaps als Bild + alle Texte */
export async function buildProjectPdf(p: Project, sel: PdfSelection, lang: 'de' | 'en'): Promise<Uint8Array> {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const color = hexToRgb(p.color);
  const doc = new PdfDoc(`${L('von mir aus – Projekt', 'von mir aus – project')}: ${p.title}`);
  if (sel.header) {
    doc.rect(doc.margin, doc.y, doc.contentWidth, 6, { fill: color });
    doc.space(18);
    doc.paragraph(p.title || L('Projekt', 'Project'), { size: 22, bold: true, color: INK, gap: 4 });
    plain(doc, [statusLabel(p.status, L), p.start ? `${L('Start', 'Start')}: ${formatDate(p.start, lang)}` : '', p.end ? `${L('Ende', 'End')}: ${formatDate(p.end, lang)}` : ''].filter(Boolean).join('  ·  '), { color: MUTED });
    if (p.summary.trim()) plain(doc, p.summary, { size: 11.5, gap: 6 });
    if (p.nextStep?.trim()) plain(doc, `${L('Kleinster nächster Schritt', 'Smallest next step')}: ${p.nextStep}`, { bold: true });
    doc.space(4);
  }
  for (const b of p.blocks) {
    if (!sel.blocks[b.id]) continue;
    band(doc, b.title || metaOf(b.kind)[lang], color);
    await blockContent(doc, p, b, color, L, lang, sel);
  }
  for (const id of Object.keys(sel.mindmaps)) {
    if (sel.mindmaps[id]) await mindmapPages(doc, id, color, L);
  }
  return doc.toBytes();
}

export async function shareProjectPdf(p: Project, sel: PdfSelection, lang: 'de' | 'en') {
  const bytes = await buildProjectPdf(p, sel, lang);
  return deliverPdf(bytes, safeFilename(p.title, 'projekt'), p.title);
}
