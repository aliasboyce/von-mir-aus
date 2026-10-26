import { PdfDoc, hexToRgb, measureText, setEmojiImages, type RGB } from '../../services/pdf/pdfBuilder';
import { prepareEmojis } from '../../services/pdf/emojiImages';
import { parkNotesRepo, PAPER_COLORS } from '../parkbox/parkboxRepo';
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
  BLOCK_META, LOG_ICON, budgetSums, formatDate, metaOf, milestoneStats, money, personName, stamp, statusLabel, stepStats, taskStats, votesFor, weightSum,
  type Project, type ProjectBlock,
} from './projectModel';

/** Was ins PDF soll */
export interface PdfSelection {
  header: boolean;
  /** nächste Schritte */
  steps: boolean;
  /** Protokoll */
  log: boolean;
  /** Zettel-Box des Projekts */
  box: boolean;
  blocks: Record<string, boolean>;
  mindmaps: Record<string, boolean>;
  notes: boolean;
  /** jeder Teil beginnt auf einer neuen Seite */
  pageBreaks: boolean;
}

export function projectSlips(p: Project) {
  return parkNotesRepo.getAll().filter((n) => n.projectId === p.id && !n.archived).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
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
  return { header: true, steps: (p.steps ?? []).length > 0, log: (p.log ?? []).length > 0, box: projectSlips(p).length > 0, blocks, mindmaps, notes: true, pageBreaks: false };
}

export function linkedMindmapIds(p: Project): string[] {
  const ids: string[] = [];
  p.blocks.forEach((b) => { if (b.kind === 'links') b.mindmaps.forEach((id) => { if (!ids.includes(id)) ids.push(id); }); });
  return ids.filter((id) => mindmapRepo.getById(id));
}

const INK: RGB = [38, 35, 31];
const MUTED: RGB = [110, 106, 98];
const GREEN: RGB = [86, 160, 98];
const AMBER: RGB = [226, 160, 52];
const RED: RGB = [200, 82, 62];

type Doc = PdfDoc;
type Lfn = (de: string, en: string) => string;

const tint = (c: RGB, k: number): RGB => [Math.round(c[0] + (255 - c[0]) * k), Math.round(c[1] + (255 - c[1]) * k), Math.round(c[2] + (255 - c[2]) * k)];

/** farbiges Band mit Symbol (Emoji als Bild) und Titel */
function band(doc: Doc, title: string, color: RGB, icon?: string) {
  doc.ensure(48);
  doc.space(10);
  doc.rect(doc.margin, doc.y, doc.contentWidth, 22, { fill: color });
  let x = doc.margin + 8;
  if (icon) {
    doc.rect(doc.margin + 4, doc.y + 2, 18, 18, { fill: tint(color, 0.82) });
    doc.text(doc.margin + 6.5, doc.y + 4.5, icon, { size: 12 });
    x = doc.margin + 28;
  }
  doc.text(x, doc.y + 5, title, { size: 12, bold: true, color: [255, 255, 255] });
  doc.space(30);
}

function sub(doc: Doc, text: string, color: RGB = MUTED) {
  doc.paragraph(text, { size: 10, bold: true, color, gap: 2 });
}

function plain(doc: Doc, text: string, o: { size?: number; indent?: number; color?: RGB; bold?: boolean; gap?: number } = {}) {
  if (!text.trim()) return;
  doc.paragraph(text, { size: o.size ?? 10.5, indent: o.indent ?? 0, color: o.color ?? INK, bold: o.bold, gap: o.gap ?? 3 });
}

function checkbox(doc: Doc, x: number, yTop: number, checked: boolean, color: RGB) {
  if (checked) doc.rect(x, yTop + 1, 9, 9, { fill: color, stroke: color, lineWidth: 1 });
  else doc.rect(x, yTop + 1, 9, 9, { stroke: color, lineWidth: 1 });
  if (checked) {
    doc.line(x + 2, yTop + 5.5, x + 4, yTop + 8, { color: [255, 255, 255], width: 1.5 });
    doc.line(x + 4, yTop + 8, x + 8, yTop + 2.5, { color: [255, 255, 255], width: 1.5 });
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

interface Run { text: string; b?: boolean; i?: boolean; u?: boolean; color?: RGB }

/** Fließtext aus Stücken mit fett / kursiv / unterstrichen, mit Zeilenumbruch */
function flowRuns(doc: Doc, parts: Run[], o: { size?: number; indent?: number; color?: RGB; gap?: number; firstIndent?: number } = {}) {
  const size = o.size ?? 10.5;
  const indent = o.indent ?? 0;
  const maxW = doc.contentWidth - indent;
  const lineH = size * 1.38;
  type Tok = Run & { w: number; space: boolean };
  const toks: Tok[] = [];
  parts.forEach((r) => r.text.split(/(\s+)/).filter((t) => t !== '').forEach((t) => toks.push({ ...r, text: t, w: measureText(t, size, !!r.b), space: /^\s+$/.test(t) })));
  const lines: Tok[][] = [];
  let cur: Tok[] = [];
  let w = 0;
  for (const t of toks) {
    if (t.space && cur.length === 0) continue;
    if (!t.space && w + t.w > maxW && cur.length) {
      while (cur.length && cur[cur.length - 1].space) cur.pop();
      lines.push(cur);
      cur = [];
      w = 0;
    }
    cur.push(t);
    w += t.w;
  }
  while (cur.length && cur[cur.length - 1].space) cur.pop();
  if (cur.length) lines.push(cur);
  if (lines.length === 0) lines.push([]);
  lines.forEach((ln) => {
    doc.ensure(lineH);
    let x = doc.margin + indent;
    ln.forEach((t) => {
      doc.text(x, doc.y, t.text, { size, bold: t.b, italic: t.i, color: t.color ?? o.color ?? INK });
      if (t.u && !t.space) doc.line(x, doc.y + size * 0.98, x + t.w, doc.y + size * 0.98, { color: t.color ?? o.color ?? INK, width: 0.6 });
      x += t.w;
    });
    doc.y += lineH;
  });
  doc.y += o.gap ?? 2;
}

/** rich text with bold/italic/underline, headings, lists in three levels (dot / heart / star as small coloured marks) */
function rich(doc: Doc, markup: string, color: RGB, indent = 0) {
  parseBlocks(markup).forEach((b) => {
    const parts: Run[] = parseInline(b.text).map((p) => ({ text: p.text, b: p.b, i: p.i, u: p.u }));
    const text = parts.map((p) => p.text).join('');
    if (b.kind === 'p') {
      if (!text.trim()) doc.space(4);
      else flowRuns(doc, parts, { indent });
    } else if (b.kind === 'h') {
      flowRuns(doc, parts.map((p) => ({ ...p, b: true, color })), { size: 12.5, indent, gap: 3 });
    } else {
      const ind = indent + 8 + b.level * 14;
      doc.ensure(14);
      const cy = doc.y + 10.5 * 0.55;
      const mark: RGB = b.mark === 'heart' ? [200, 80, 105] : b.mark === 'star' ? [214, 160, 40] : INK;
      if (b.mark === 'dot') doc.circle(doc.margin + ind, cy, 1.8, { fill: mark });
      else if (b.mark === 'heart') doc.circle(doc.margin + ind, cy, 2.4, { fill: mark });
      else doc.rect(doc.margin + ind - 2.4, cy - 2.4, 4.8, 4.8, { fill: mark });
      flowRuns(doc, parts, { indent: ind + 8, gap: 2 });
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
  rows.forEach((r, i) => draw(r, false, i % 2 === 1 ? tint(color, 0.92) : undefined));
  doc.space(6);
}

/** horizontaler Balken */
function bar(doc: Doc, x: number, w: number, v: number, t: number, color: RGB, h = 7) {
  doc.rect(x, doc.y, w, h, { fill: [232, 229, 222] });
  if (t > 0 && v > 0) doc.rect(x, doc.y, Math.max(2, (w * Math.min(v, t)) / t), h, { fill: color });
}

/** Chip: Text in einem getönten Kästchen */
function chip(doc: Doc, x: number, yTop: number, text: string, color: RGB, size = 9.5): number {
  const w = measureText(text, size, false) + 14;
  doc.rect(x, yTop, w, size + 8, { fill: tint(color, 0.85), stroke: color, lineWidth: 0.8 });
  doc.text(x + 7, yTop + 4, text, { size, color: [color[0] * 0.7, color[1] * 0.7, color[2] * 0.7] });
  return w;
}

function timelineGraphic(doc: Doc, ms: { title: string; date: string; done: boolean }[], smalls: { date: string; done: boolean }[], start: string | undefined, end: string | undefined, color: RGB, lang: 'de' | 'en', today: string, L: Lfn) {
  const dated = ms.filter((m) => m.date).sort((a, b) => a.date.localeCompare(b.date));
  const days = (d: string) => Math.round(new Date(`${d}T12:00:00`).getTime() / 86400000);
  const all = [...dated.map((m) => m.date), ...smalls.map((x) => x.date), ...(start ? [start] : []), ...(end ? [end] : [])];
  if (all.length < 2) return;
  const min = Math.min(...all.map(days));
  const max = Math.max(...all.map(days));
  const span = Math.max(1, max - min);
  doc.ensure(96);
  const x0 = doc.margin + 12;
  const x1 = doc.margin + doc.contentWidth - 12;
  const yLine = doc.y + 42;
  doc.line(x0, yLine, x1, yLine, { color: [205, 201, 192], width: 4 });
  const X = (d: string) => x0 + ((days(d) - min) / span) * (x1 - x0);
  if (days(today) >= min && days(today) <= max) {
    const tx = X(today);
    doc.line(x0, yLine, tx, yLine, { color: tint(color, 0.45), width: 4 });
    doc.line(tx, yLine - 14, tx, yLine + 14, { color, width: 1.2, dash: [2, 2] });
    doc.text(tx - 10, yLine + 17, L('heute', 'today'), { size: 7.5, color });
  }
  smalls.forEach((sm) => doc.circle(X(sm.date), yLine, 3.2, { fill: sm.done ? color : [255, 255, 255], stroke: color, lineWidth: 1.2 }));
  dated.forEach((m, i) => {
    const x = X(m.date);
    doc.circle(x, yLine, 6.5, { fill: m.done ? color : [255, 255, 255], stroke: color, lineWidth: 2 });
    if (m.done) { doc.line(x - 3, yLine, x - 1, yLine + 2.5, { color: [255, 255, 255], width: 1.4 }); doc.line(x - 1, yLine + 2.5, x + 3.2, yLine - 2.6, { color: [255, 255, 255], width: 1.4 }); }
    const up = i % 2 === 0;
    const label = m.title.length > 22 ? `${m.title.slice(0, 21)}…` : m.title;
    const lw = Math.max(40, measureText(label, 8.5));
    const tx = Math.min(Math.max(x - lw / 2, doc.margin), doc.margin + doc.contentWidth - lw);
    doc.text(tx, up ? yLine - 30 : yLine + 12, label, { size: 8.5, bold: true, color: INK });
    doc.text(tx, up ? yLine - 19 : yLine + 23, formatDate(m.date, lang, false), { size: 8, color: MUTED });
  });
  doc.y = yLine + 40;
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

async function blockContent(doc: Doc, p: Project, b: ProjectBlock, color: RGB, L: Lfn, lang: 'de' | 'en', sel: PdfSelection, today: string) {
  const me = L('Ich', 'Me');
  switch (b.kind) {
    case 'text':
      if (b.text.trim()) rich(doc, b.text, color);
      break;
    case 'tasks':
      b.items.forEach((t) => {
        const meta = [t.who ? `👤 ${personName(p, t.who, me)}` : '', t.due ? `📅 ${formatDate(t.due, lang)}${t.time ? ` ${t.time}` : ''}` : '', t.status === 'doing' ? `⏳ ${L('in Arbeit', 'in progress')}` : '', t.note ?? ''].filter(Boolean).join('   ');
        checkLine(doc, t.text, t.status === 'done', t.status === 'doing' ? AMBER : color, meta || undefined);
      });
      if (b.items.length === 0) plain(doc, L('(keine Aufgaben)', '(no tasks)'), { color: MUTED });
      break;
    case 'checklist':
      b.items.forEach((t) => checkLine(doc, t.text, t.done, color, t.who ? `👤 ${personName(p, t.who, me)}` : undefined));
      break;
    case 'timeline': {
      timelineGraphic(doc, b.milestones.map((m) => ({ title: m.title, date: m.date ?? '', done: m.done })), [...b.milestones.flatMap((m) => m.steps.filter((x) => x.date).map((x) => ({ date: x.date as string, done: x.done }))), ...(p.steps ?? []).filter((x) => x.date).map((x) => ({ date: x.date as string, done: x.done }))], p.start, p.end, color, lang, today, L);
      [...b.milestones].sort((a, c) => (a.date ? 0 : 1) - (c.date ? 0 : 1) || (a.date ?? '').localeCompare(c.date ?? '')).forEach((m) => {
        checkLine(doc, `🏁 ${m.title}`, m.done, color, [m.date ? `📅 ${formatDate(m.date, lang)}${m.time ? ` ${m.time}` : ''}` : '', m.note ?? ''].filter(Boolean).join('   ') || undefined);
        m.steps.forEach((s) => checkLine(doc, s.text, s.done, tint(color, 0.15), s.date ? `📅 ${formatDate(s.date, lang)}${s.time ? ` ${s.time}` : ''}` : undefined, 18));
      });
      break;
    }
    case 'team': {
      if (p.people.length) {
        grid(doc, [L('Name', 'Name'), L('Zeit', 'Availability'), L('Kontakt', 'Contact')], p.people.map((x) => [`👤 ${x.name}`, x.availability ?? '', x.contact ?? '']), [3, 4, 3], color);
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
      plain(doc, `💸 ${L('Kosten', 'Costs')}: ${m(s.cost)}    💶 ${L('Einnahmen', 'Income')}: ${m(s.income)}    ${s.balance >= 0 ? '✅' : '⚠️'} ${L('Bleibt übrig', 'Left over')}: ${m(s.balance)}${b.limit ? `    🎯 ${L('Rahmen', 'Limit')}: ${m(b.limit)}` : ''}`, { bold: true });
      const maxV = Math.max(s.cost, s.income, b.limit ?? 0, 1);
      doc.ensure(34);
      doc.text(doc.margin, doc.y, L('Kosten', 'Costs'), { size: 8.5, color: MUTED });
      doc.y += 11; bar(doc, doc.margin, doc.contentWidth, s.cost, maxV, s.balance >= 0 ? color : RED); doc.y += 11;
      doc.text(doc.margin, doc.y, L('Einnahmen', 'Income'), { size: 8.5, color: MUTED });
      doc.y += 11; bar(doc, doc.margin, doc.contentWidth, s.income, maxV, GREEN); doc.y += 12;
      if (b.items.length) grid(doc, [L('Posten', 'Item'), L('Art', 'Type'), L('Wer', 'Who'), L('Betrag', 'Amount'), L('Stand', 'Status')], b.items.map((i) => [i.label, i.type === 'cost' ? L('Kosten', 'Cost') : L('Einnahme', 'Income'), personName(p, i.who, me), m(i.amount), i.type === 'cost' ? (i.paid ? `✅ ${L('bezahlt', 'paid')}` : `⏳ ${L('offen', 'open')}`) : ''] ), [4, 2, 2, 2, 2], color);
      if (s.cost > 0) {
        sub(doc, L('Wer zahlt was', 'Who pays what'));
        [...s.perPerson.entries()].forEach(([who, amt]) => plain(doc, `${who === '' ? L('noch offen', 'not yet decided') : `👤 ${personName(p, who, me)}`}: ${m(amt)}`, { gap: 1 }));
      }
      break;
    }
    case 'risks':
      b.items.forEach((r) => {
        const c = r.level === 1 ? GREEN : r.level === 2 ? AMBER : RED;
        checkLine(doc, r.text, !!r.solved, c, [r.level === 1 ? `🟢 ${L('eher unwahrscheinlich', 'rather unlikely')}` : r.level === 2 ? `🟠 ${L('möglich', 'possible')}` : `🔴 ${L('wahrscheinlich', 'likely')}`, r.planB ? `🛟 ${L('Plan B', 'Plan B')}: ${r.planB}` : ''].filter(Boolean).join('   '));
      });
      break;
    case 'decisions':
      b.items.forEach((d) => {
        doc.paragraph(`🗣️ ${formatDate(d.date, lang)}  ${d.text}`, { size: 10.5, bold: true, color: INK, gap: 1 });
        if (d.note) plain(doc, d.note, { indent: 10, color: MUTED });
      });
      break;
    case 'poll': {
      if (b.question) plain(doc, `🗳️ ${b.question}`, { bold: true });
      const counts = b.options.map((o) => votesFor(b, o.id).length);
      const maxC = Math.max(1, ...counts);
      b.options.forEach((o, i) => {
        const vs = votesFor(b, o.id).map((id) => personName(p, id, me)).filter(Boolean);
        checkLine(doc, `${i + 1}) ${o.text}`, b.decided === o.id, color, `${vs.length} ${L('Stimmen', 'votes')}${vs.length ? ` (${vs.join(', ')})` : ''}${b.decided === o.id ? ` · 🏆 ${L('entschieden', 'decided')}` : ''}`);
        doc.y -= 2;
        bar(doc, doc.margin + 16, doc.contentWidth - 16, counts[i], maxC, color, 5);
        doc.y += 9;
      });
      break;
    }
    case 'proscons': {
      sub(doc, `👍 ${L('Dafür', 'Pro')} (${weightSum(b.pros)})`, GREEN);
      const row = (x: { text: string; w: number }, c: RGB, mark: string) => {
        const lines = doc.wrap(x.text, 10.5, false, doc.contentWidth - 80);
        doc.ensure(lines.length * 14.5 + 3);
        doc.text(doc.margin + 4, doc.y, mark, { size: 11, bold: true, color: c });
        lines.forEach((ln, i) => doc.text(doc.margin + 18, doc.y + i * 14.5, ln, { size: 10.5, color: INK }));
        for (let k = 0; k < 3; k++) doc.circle(doc.margin + doc.contentWidth - 46 + k * 11, doc.y + 6, 3.4, k < x.w ? { fill: c } : { stroke: tint(c, 0.4), lineWidth: 0.8 });
        doc.y += lines.length * 14.5 + 3;
      };
      b.pros.forEach((x) => row(x, GREEN, '+'));
      sub(doc, `👎 ${L('Dagegen', 'Con')} (${weightSum(b.cons)})`, RED);
      b.cons.forEach((x) => row(x, RED, '-'));
      if (b.verdict) plain(doc, `⚖️ ${L('Meine Entscheidung', 'My decision')}: ${b.verdict}`, { bold: true });
      break;
    }
    case 'table':
      grid(doc, b.cols.map((c, i) => c || `${i + 1}`), b.rows, b.cols.map(() => 1), color);
      break;
    case 'links': {
      const names = (list: string[], f: (id: string) => string | undefined) => list.map(f).filter(Boolean).join(', ');
      const rows: [string, string][] = [
        ['🕸️ ' + L('Mindmaps', 'Mind maps'), names(b.mindmaps, (id) => mindmapRepo.getById(id)?.title || undefined)],
        ['📔 ' + L('Tagebuch-Bücher', 'Diary books'), names(b.categories, (id) => (id === DIARY_DEFAULT_CATEGORY_ID ? DIARY_DEFAULT_CATEGORY_LABEL : diaryCategoriesStore.getAll().find((c) => c.id === id)?.label))],
        ['🔁 ' + L('Routinen', 'Routines'), names(b.routines, (id) => routinesRepo.getById(id)?.title)],
        ['🧰 ' + L('Ressourcen', 'Resources'), names(b.resources, (id) => resourcesRepo.getById(id)?.title)],
        ['👥 ' + L('Menschen', 'People'), names(b.people, (id) => networkRepo.getById(id)?.name)],
        ['📍 ' + L('Orte', 'Places'), b.places.join(', ')],
      ];
      rows.filter(([, v]) => v).forEach(([k, v]) => plain(doc, `${k}: ${v}`, { gap: 2 }));
      break;
    }
    case 'reminders':
      b.items.forEach((r) => checkLine(doc, r.text, !!r.done, color, `🔔 ${formatDate(r.date, lang)} ${r.time}`));
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
    sub(doc, `📝 ${L('Notiz', 'Note')}`);
    rich(doc, b.note, color, 6);
  }
}

function hexOfPaper(i: number): RGB {
  return hexToRgb(PAPER_COLORS[i % PAPER_COLORS.length]);
}

/** alle Texte des Projekts (für die Emoji-Bilder) */
function projectTexts(p: Project): string[] {
  const slim = JSON.stringify(p, (k, v) => (k === 'src' || k === 'thumb' ? undefined : v));
  return [slim, projectSlips(p).map((n) => n.text).join(' '), BLOCK_META.map((m) => m.icon).join(' '), Object.values(LOG_ICON).join(' '), '➡️ 📅 👤 ⏳ 🏁 🔔 🗒️ 📖 📝 🗣️ 🗳️ 👍 👎 ⚖️ 💸 💶 ✅ ⚠️ 🎯 🟢 🟠 🔴 🛟 🕸️ 📔 🔁 🧰 👥 📍 🏆 🎉 ✨'];
}

/** baut das PDF; mehrere A4-Seiten – so, wie es auch beim Bearbeiten aussieht: Farben, Symbole, Bilder, Grafiken */
export async function buildProjectPdf(p: Project, sel: PdfSelection, lang: 'de' | 'en'): Promise<Uint8Array> {
  const L: Lfn = (de, en) => (lang === 'en' ? en : de);
  const color = hexToRgb(p.color);
  const t = new Date();
  const today = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  try { setEmojiImages(await prepareEmojis(projectTexts(p))); } catch { setEmojiImages(new Map()); }
  try {
    const doc = new PdfDoc(`${L('von mir aus – Projekt', 'von mir aus – project')}: ${p.title}`);
    let first = true;
    const section = (title: string, icon: string, col: RGB = color) => {
      if (sel.pageBreaks && !first) doc.addPage();
      first = false;
      band(doc, title, col, icon);
    };
    if (sel.header) {
      first = false;
      doc.rect(doc.margin, doc.y, doc.contentWidth, 7, { fill: color });
      doc.space(20);
      const y0 = doc.y;
      doc.rect(doc.margin, y0 - 2, 36, 36, { fill: tint(color, 0.8), stroke: color, lineWidth: 1.5 });
      doc.text(doc.margin + 5, y0 + 2, p.emoji, { size: 24 });
      doc.paragraph(p.title || L('Projekt', 'Project'), { size: 24, bold: true, color: INK, gap: 2, indent: 48 });
      doc.y = Math.max(doc.y, y0 + 40);
      const cy = doc.y;
      let cx = doc.margin;
      cx += chip(doc, cx, cy, statusLabel(p.status, L), color) + 6;
      if (p.start) cx += chip(doc, cx, cy, `📅 ${L('Start', 'Start')} ${formatDate(p.start, lang)}`, [120, 120, 120]) + 6;
      if (p.end) chip(doc, cx, cy, `🎯 ${L('Ziel', 'Target')} ${formatDate(p.end, lang)}`, [120, 120, 120]);
      doc.space(26);
      if (p.summary.trim()) plain(doc, p.summary, { size: 11.5, gap: 6 });
      const ss = stepStats(p);
      const ts = taskStats(p);
      const ms = milestoneStats(p);
      const bars: [string, number, number][] = ([[L('Schritte', 'Steps'), ss.done, ss.total], [L('Aufgaben', 'Tasks'), ts.done, ts.total], [L('Meilensteine', 'Milestones'), ms.done, ms.total]] as [string, number, number][]).filter((x) => x[2] > 0);
      if (bars.length) {
        doc.ensure(34);
        const w = (doc.contentWidth - (bars.length - 1) * 14) / bars.length;
        bars.forEach(([lab, v, tt], i) => {
          const x = doc.margin + i * (w + 14);
          doc.text(x, doc.y, `${lab}  ${v}/${tt}`, { size: 9, color: MUTED });
          const keep = doc.y;
          doc.y += 13;
          bar(doc, x, w, v, tt, color, 8);
          doc.y = keep;
        });
        doc.y += 28;
      }
      const cur = (p.steps ?? []).find((s) => !s.done);
      if (cur) {
        const lines = doc.wrap(cur.text, 11, true, doc.contentWidth - 24);
        const h = lines.length * 15 + 22;
        doc.ensure(h + 6);
        doc.rect(doc.margin, doc.y, doc.contentWidth, h, { fill: tint(hexToRgb('#e8a83d'), 0.82), stroke: hexToRgb('#e8a83d'), lineWidth: 1.2 });
        doc.text(doc.margin + 10, doc.y + 5, `➡️ ${L('Jetzt dran', 'Up now')}${cur.date ? `   📅 ${formatDate(cur.date, lang)} ${cur.time ?? ''}` : ''}`, { size: 8.5, color: MUTED });
        lines.forEach((ln, i) => doc.text(doc.margin + 12, doc.y + 17 + i * 15, ln, { size: 11, bold: true, color: INK }));
        doc.y += h + 6;
      }
      doc.space(2);
    }
    if (sel.steps && (p.steps ?? []).length) {
      section(L('Nächste Schritte', 'Next steps'), '➡️', hexToRgb('#e8a83d'));
      const open = (p.steps ?? []).filter((s) => !s.done);
      const done = (p.steps ?? []).filter((s) => s.done);
      [...open, ...done].forEach((s) => checkLine(doc, s.text, s.done, hexToRgb('#e8a83d'), [s.date ? `📅 ${formatDate(s.date, lang)}${s.time ? ` ${s.time}` : ''}` : '', s.done && s.doneAt ? `✅ ${stamp(s.doneAt, lang)}` : `🕓 ${stamp(s.createdAt, lang)}`].filter(Boolean).join('   ')));
    }
    for (const b of p.blocks) {
      if (!sel.blocks[b.id]) continue;
      section(b.title || metaOf(b.kind)[lang], metaOf(b.kind).icon, color);
      await blockContent(doc, p, b, color, L, lang, sel, today);
    }
    const slips = projectSlips(p);
    if (sel.box && slips.length) {
      section(L('Zettel-Box', 'Slip box'), '🗒️', hexToRgb('#c98f5a'));
      const colW = (doc.contentWidth - 12) / 2;
      for (let i = 0; i < slips.length; i += 2) {
        const pair = slips.slice(i, i + 2);
        const wr = pair.map((n) => doc.wrap(n.text, 10, false, colW - 16));
        const h = Math.max(...wr.map((w) => w.length)) * 13.8 + 16;
        doc.ensure(h + 8);
        pair.forEach((n, k) => {
          const x = doc.margin + k * (colW + 12);
          doc.rect(x, doc.y, colW, h, { fill: hexOfPaper(n.paper), stroke: [200, 190, 160], lineWidth: 0.7 });
          wr[k].forEach((ln, j) => doc.text(x + 8, doc.y + 8 + j * 13.8, ln, { size: 10, color: [58, 50, 38] }));
        });
        doc.y += h + 8;
      }
    }
    if (sel.log && (p.log ?? []).length) {
      section(L('Protokoll', 'Log'), '📖', hexToRgb('#6b7fb5'));
      const entries = [...(p.log ?? [])].sort((a, b) => a.at.localeCompare(b.at));
      let lastDay = '';
      entries.forEach((e) => {
        const d = new Date(e.at);
        const day = d.toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        if (day !== lastDay) {
          lastDay = day;
          doc.ensure(34);
          doc.space(4);
          sub(doc, day, color);
        }
        const time = d.toLocaleTimeString(lang === 'en' ? 'en-US' : 'de-DE', { hour: '2-digit', minute: '2-digit' });
        doc.ensure(16);
        doc.circle(doc.margin + 4, doc.y + 6, 2.6, { fill: color });
        doc.text(doc.margin + 12, doc.y, time, { size: 9, color: MUTED });
        doc.paragraph(`${LOG_ICON[e.kind]} ${e.text}`, { size: 10.5, indent: 46, gap: 2 });
      });
    }
    for (const id of Object.keys(sel.mindmaps)) {
      if (sel.mindmaps[id]) {
        if (sel.pageBreaks) first = false;
        await mindmapPages(doc, id, color, L);
      }
    }
    return doc.toBytes();
  } finally {
    setEmojiImages(new Map());
  }
}

export async function shareProjectPdf(p: Project, sel: PdfSelection, lang: 'de' | 'en') {
  const bytes = await buildProjectPdf(p, sel, lang);
  return deliverPdf(bytes, safeFilename(p.title, 'projekt'), p.title);
}
