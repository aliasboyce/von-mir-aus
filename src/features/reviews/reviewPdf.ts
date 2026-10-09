import { PdfDoc, hexToRgb, type RGB } from '../../services/pdf/pdfBuilder';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import { WEATHER_META } from '../innerWeather/weatherMeta';
import { layoutDayChart, layoutRangeChart, type ChartLayout } from './reviewChartLayout';
import { reviewSummaryLines } from './reviewStats';
import { skillUseLine, skillUseTime, skillUseIsSuccess } from '../resources/skillUseText';
import { networkRepo } from '../safetyNet/networkRepo';
import type { ReviewDay } from './reviewData';
import type { TranslationDictionary } from '../../i18n/de';

/** Blends a color toward white — PDF has no alpha, so the soft band
 * tints the screen draws with opacity are pre-mixed here. */
function tint(hex: string, amount: number): RGB {
  const [r, g, b] = hexToRgb(hex);
  return [Math.round(255 - (255 - r) * amount), Math.round(255 - (255 - g) * amount), Math.round(255 - (255 - b) * amount)];
}

function zoneLabel(zoneId: string, t: TranslationDictionary): string {
  const band = AROUSAL_BANDS.find((b) => b.id === zoneId);
  return band ? t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones].label : '';
}

/** Draws a laid-out chart at (x, y) on the current page. Offsets the
 * layout's own coordinates, which start at 0,0 of the chart box. */
function drawChart(doc: PdfDoc, layout: ChartLayout, x: number, y: number, t: TranslationDictionary, opts: { pointLabels: boolean }) {
  layout.bands.forEach((b) => {
    doc.rect(x + layout.plotLeft, y + b.y, layout.plotRight - layout.plotLeft, Math.max(b.h, 0.6), { fill: tint(b.color, 0.22) });
  });
  layout.bands.forEach((b) => {
    doc.line(x + layout.plotLeft, y + b.y, x + layout.plotRight, y + b.y, { color: [200, 200, 200], width: 0.4, dash: [2, 3] });
    const label = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label;
    const short = label.length > 15 ? `${label.slice(0, 14)}.` : label;
    doc.text(x + 2, y + b.y + b.h / 2 - 3, short, { size: 6.5, bold: true, color: hexToRgb(b.color) });
  });
  layout.ticks.forEach((tk) => {
    doc.line(x + tk.x, y + layout.plotTop, x + tk.x, y + layout.plotBottom, { color: [215, 215, 215], width: 0.4 });
    doc.text(x + tk.x - 9, y + layout.height - 11, tk.label, { size: 6.5, color: [130, 130, 130] });
  });
  if (layout.points.length > 1) {
    doc.polyline(layout.points.map((p) => [x + p.x, y + p.y] as [number, number]), { color: [150, 150, 150], width: 1 });
  }
  layout.points.forEach((p) => {
    doc.circle(x + p.x, y + p.y, 3.4, { fill: hexToRgb(p.color), stroke: [255, 255, 255], lineWidth: 0.8 });
    if (p.afterSkillTitle) doc.circle(x + p.x, y + p.y, 6, { stroke: hexToRgb(p.color), lineWidth: 0.7 });
    if (opts.pointLabels) {
      const ty = p.labelAbove ? y + p.y - 17 : y + p.y + 7;
      doc.text(x + p.x - 8, ty, p.time, { size: 5.5, color: [120, 120, 120] });
      doc.text(x + p.x - 8, ty + (p.labelAbove ? 6.5 : 6.5), `${p.value}%`, { size: 6.5, bold: true, color: hexToRgb(p.color) });
    }
  });
}

function valueTable(doc: PdfDoc, layout: ChartLayout, t: TranslationDictionary) {
  if (layout.points.length === 0) return;
  const colTime = doc.margin;
  const colValue = doc.margin + 60;
  const colZone = doc.margin + 120;
  doc.ensure(16);
  doc.text(colTime, doc.y, t.reviewSummary.colTime, { size: 8.5, bold: true, color: [120, 120, 120] });
  doc.text(colValue, doc.y, t.reviewSummary.colValue, { size: 8.5, bold: true, color: [120, 120, 120] });
  doc.text(colZone, doc.y, t.reviewSummary.colZone, { size: 8.5, bold: true, color: [120, 120, 120] });
  doc.space(13);
  layout.points.forEach((p) => {
    doc.ensure(14);
    doc.line(doc.margin, doc.y - 2, doc.width - doc.margin, doc.y - 2, { color: [225, 225, 225], width: 0.4 });
    doc.text(colTime, doc.y, p.time, { size: 9.5, color: [90, 90, 90] });
    doc.text(colValue, doc.y, `${p.value} %`, { size: 9.5, bold: true, color: hexToRgb(p.color) });
    doc.circle(colZone + 3, doc.y + 4.2, 2.6, { fill: hexToRgb(p.color) });
    const extra = p.afterSkillTitle ? `  ·  ${t.reviewSummary.afterSkill}: ${p.afterSkillTitle}` : '';
    doc.text(colZone + 10, doc.y, `${zoneLabel(p.zoneId, t)}${extra}`, { size: 9.5, color: [40, 40, 40] });
    doc.space(13.5);
  });
  doc.space(4);
}

function dayDate(day: string, locale: string, long = true): string {
  return new Date(`${day}T12:00:00`).toLocaleDateString(locale, long ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } : { weekday: 'short', day: '2-digit', month: '2-digit' });
}

function sectionTitle(doc: PdfDoc, title: string) {
  doc.ensure(24);
  doc.space(4);
  doc.paragraph(title, { size: 11, bold: true, color: [70, 90, 75], gap: 2 });
}

/** One day's content block (chart + table + skills + the rest). */
function dayBlock(doc: PdfDoc, d: ReviewDay, t: TranslationDictionary, locale: string, opts: { chart: boolean; headingLevel: 1 | 2 }) {
  doc.heading(dayDate(d.day, locale), opts.headingLevel);
  const lines = reviewSummaryLines(d.checkIns, d.skillUses, t);
  lines.forEach((l) => doc.paragraph(l, { size: 10.5, color: [70, 70, 70], gap: 1 }));
  doc.space(4);

  if (d.checkIns.length > 0) {
    const w = doc.contentWidth;
    const h = opts.chart ? 190 : 0;
    if (opts.chart) {
      doc.ensure(h + 8);
      const layout = layoutDayChart(d.checkIns, w, h, 74);
      drawChart(doc, layout, doc.margin, doc.y, t, { pointLabels: true });
      doc.space(h + 6);
      if (d.checkIns.some((c) => c.afterSkillTitle)) doc.paragraph(t.reviewSummary.legendAfterSkill, { size: 8, color: [130, 130, 130], gap: 4 });
      valueTable(doc, layout, t);
    } else {
      valueTable(doc, layoutDayChart(d.checkIns, w, 100, 74), t);
    }
  }

  if (d.skillUses.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfSkillsTitle);
    d.skillUses.forEach((u) => {
      doc.paragraph(`${skillUseTime(u, locale)}  ${skillUseLine(u, t)}${skillUseIsSuccess(u) ? '  (ok)' : ''}`, { size: 10, indent: 8, gap: 1 });
      if (u.note) doc.paragraph(`"${u.note}"`, { size: 9.5, italic: true, color: [100, 100, 100], indent: 22, gap: 2 });
    });
  }
  if (d.appointments.length > 0) {
    sectionTitle(doc, t.calendar.reviewAppointments);
    const people = networkRepo.getAll();
    d.appointments.forEach((a) => {
      const person = a.personId ? people.find((p) => p.id === a.personId) : undefined;
      doc.paragraph(`${a.time}  ${a.title}${person ? ` - ${person.name}${person.role ? ` (${person.role})` : ''}` : ''}`, { size: 10, bold: true, indent: 8, gap: 1 });
      if (a.note) doc.paragraph(a.note, { size: 9.5, indent: 22, color: [90, 90, 90], gap: 1 });
      if (a.reflection) doc.paragraph(`${t.calendar.reflectionTitle}: ${a.reflection}`, { size: 9.5, italic: true, indent: 22, color: [80, 80, 80], gap: 1 });
      if (a.noteForNext) doc.paragraph(`${t.calendar.followUp2NoteLabel}: ${a.noteForNext}`, { size: 9.5, indent: 22, color: [80, 80, 80], gap: 2 });
    });
  }
  if (d.activities.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfUsedTitle);
    d.activities.forEach((a) => doc.paragraph(`- ${a.label}`, { size: 10, indent: 8, gap: 1 }));
  }
  if (d.zugangCount > 0) doc.paragraph(`${t.reviewSummary.pdfZugangTitle}: ${t.reviewSummary.pdfZugangCount.replace('{n}', String(d.zugangCount))}`, { size: 10, gap: 3 });
  if (d.garden.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfGardenTitle);
    d.garden.forEach((g) => doc.paragraph(`- ${g}`, { size: 10, indent: 8, gap: 1 }));
  }
  if (d.letters.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfLettersTitle);
    d.letters.forEach((l) => doc.paragraph(`"${l.text}"`, { size: 10, indent: 8, gap: 3 }));
  }
  if (d.wishes.length > 0) {
    sectionTitle(doc, t.calendar.reviewWishes);
    d.wishes.forEach((w) => doc.paragraph(`${w.done ? (w.intent === 'soll' ? '[-]' : '[x]') : '[ ]'}  ${w.text}${w.intent === 'soll' ? ` (${t.calendar.intentSoll})` : ''}`, { size: 10, indent: 8, color: w.done ? [120, 120, 120] : [40, 40, 40], gap: 1 }));
  }
  if (d.weather.length > 0) {
    doc.paragraph(d.weather.map((w) => WEATHER_META[w.condition].label(t)).join(', '), { size: 10, color: [80, 80, 80], gap: 3 });
  }
  if (d.mediLog.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfMedsTitle);
    d.mediLog.forEach((m) => doc.paragraph(`${m.name}${m.doseValue != null ? ` · ${m.doseValue} ${m.doseUnit ?? ''}` : ''}`, { size: 10, indent: 8, gap: 1 }));
  }
  if (d.achievements.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfAchievementsTitle);
    d.achievements.forEach((a) => doc.paragraph(`- ${a.content}`, { size: 10, indent: 8, gap: 1 }));
  }
  if (d.diary.length > 0) {
    sectionTitle(doc, t.reviewSummary.pdfDiaryTitle);
    d.diary.forEach((e) => doc.paragraph(`"${e.content}"`, { size: 10, indent: 8, gap: 3 }));
  }
  if (d.checkIns.length + d.skillUses.length + d.weather.length + d.mediLog.length + d.achievements.length + d.diary.length + d.appointments.length + d.wishes.length + d.activities.length + d.zugangCount + d.garden.length + d.letters.length === 0) {
    doc.paragraph(t.reviewSummary.pdfNothing, { size: 10, color: [130, 130, 130] });
  }
}

export type ReviewPeriodKind = 'day' | 'week' | 'month' | 'range';

export interface ReviewPdfInput {
  kind: ReviewPeriodKind;
  title: string;
  fromDay: string;
  toDay: string;
  days: ReviewDay[];
  t: TranslationDictionary;
  locale: string;
  /** Extra summary paragraphs printed under the title (e.g. the weekly narrative). */
  extraLines?: string[];
}

/**
 * "Jeder Tages-/Wochen-/Monatsrueckblick soll als PDF erstellbar sein,
 * zum Ausdrucken und zur Therapie mitnehmen"-Auftrag. Day: the full
 * curve + table + everything of that day. Week: an overview curve and
 * one section per day (each with its own curve). Month: an overview
 * curve and, per day, the compact value table (no per-day chart — a
 * month would be 30 pages of charts).
 */
export function buildReviewPdf(input: ReviewPdfInput): Uint8Array {
  const { kind, title, fromDay, toDay, days, t, locale, extraLines = [] } = input;
  const doc = new PdfDoc('von mir aus');
  const exported = new Date().toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });

  doc.heading(title, 1);
  const range = kind === 'day' ? dayDate(fromDay, locale) : `${dayDate(fromDay, locale, false)} – ${dayDate(toDay, locale, false)}`;
  doc.paragraph(`${range}  ·  ${t.reviewSummary.pdfExportedOn} ${exported}`, { size: 9.5, color: [120, 120, 120], gap: 8 });

  const allCheckIns = days.flatMap((d) => d.checkIns);
  const allUses = days.flatMap((d) => d.skillUses);

  if (kind === 'day') {
    if (days[0]) dayBlock(doc, days[0], t, locale, { chart: true, headingLevel: 2 });
    else doc.paragraph(t.reviewSummary.pdfNothing, { size: 10 });
    return doc.toBytes();
  }

  doc.heading(t.reviewSummary.pdfOverview, 2);
  extraLines.forEach((l) => doc.paragraph(l, { size: 10.5, color: [70, 70, 70], gap: 2 }));
  reviewSummaryLines(allCheckIns, allUses, t).forEach((l) => doc.paragraph(l, { size: 10.5, color: [70, 70, 70], gap: 1 }));
  doc.space(6);

  if (allCheckIns.length > 0) {
    const h = 200;
    doc.ensure(h + 8);
    const fromMs = new Date(`${fromDay}T00:00:00`).getTime();
    const toMs = new Date(`${toDay}T23:59:59`).getTime();
    const tickEvery = kind === 'week' ? 1 : 3;
    drawChart(doc, layoutRangeChart(allCheckIns, fromMs, toMs, tickEvery, doc.contentWidth, h, 74, locale), doc.margin, doc.y, t, { pointLabels: false });
    doc.space(h + 8);
  }

  days.forEach((d) => {
    doc.ensure(60);
    doc.space(6);
    dayBlock(doc, d, t, locale, { chart: kind === 'week' || kind === 'range', headingLevel: 2 });
  });
  return doc.toBytes();
}

/**
 * "Tagebuch exportieren" as a real PDF (instead of window.print, which
 * iOS blocks in home-screen mode): the chosen entries, oldest first,
 * each with its date/time and category.
 */
export function buildDiaryEntriesPdf(opts: {
  title: string;
  fromDay: string;
  toDay: string;
  entries: { createdAt: string; content: string; categoryLabel: string }[];
  locale: string;
  exportedOn: string;
}): Uint8Array {
  const doc = new PdfDoc('von mir aus');
  const range = `${new Date(`${opts.fromDay}T12:00:00`).toLocaleDateString(opts.locale)} – ${new Date(`${opts.toDay}T12:00:00`).toLocaleDateString(opts.locale)}`;
  doc.heading(opts.title, 1);
  doc.paragraph(`${range}  ·  ${opts.exportedOn} ${new Date().toLocaleDateString(opts.locale)}`, { size: 9.5, color: [120, 120, 120], gap: 8 });
  [...opts.entries]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .forEach((e) => {
      doc.ensure(40);
      const when = new Date(e.createdAt).toLocaleString(opts.locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      doc.paragraph(`${when}  ·  ${e.categoryLabel}`, { size: 9, bold: true, color: [100, 120, 105], gap: 1 });
      doc.paragraph(e.content, { size: 11, gap: 10 });
    });
  return doc.toBytes();
}
