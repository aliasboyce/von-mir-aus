import { AROUSAL_BANDS, bandForValue, visualPositionForValue, visualExtentForBand, FALLBACK_TENSION_BY_ZONE } from '../polyvagal/arousalBands';
import type { PolyvagalCheckIn } from '../../data/types';

/**
 * "Im Tagesrueckblick soll die klare Kurve der Anspannung mit den
 * Farbbereichen angezeigt werden: jeder Wert, jede Farbe, jede Uhrzeit,
 * vergroessern, nichts verzogen, als PDF druckbar"-Auftrag — ONE
 * layout calculation used by both the on-screen SVG (ReviewDayChart)
 * and the PDF drawing (reviewPdf.ts), so the two can never drift apart.
 * Pure math, no React, no imports of the PDF writer.
 *
 * x axis: the time of day, from a rounded-down start hour to a
 * rounded-up end hour around the actual check-ins (at least 6 hours
 * wide, so one or two points never fill the whole width). y axis: the
 * same wrapped ladder positions as the slider, so a value sits at the
 * same height everywhere in the app.
 */
export interface ChartPoint {
  id: string;
  x: number;
  y: number;
  value: number;
  color: string;
  time: string; // "08:15"
  zoneId: string;
  afterSkillTitle?: string;
  /** Put the % label above or below the dot so close neighbours do not collide. */
  labelAbove: boolean;
}

export interface ChartBand {
  id: string;
  color: string;
  y: number;
  h: number;
  labelKey: string;
}

export interface ChartTick {
  x: number;
  label: string;
}

export interface ChartLayout {
  width: number;
  height: number;
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  bands: ChartBand[];
  ticks: ChartTick[];
  points: ChartPoint[];
}

function minutesOfDay(iso: string): number {
  const d = new Date(iso);
  return d.getHours() * 60 + d.getMinutes();
}

export function formatClock(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function valueOf(c: PolyvagalCheckIn): number {
  return c.tensionValue ?? FALLBACK_TENSION_BY_ZONE[c.zone];
}

export function layoutDayChart(checkIns: PolyvagalCheckIn[], width: number, height: number, leftLabelWidth: number): ChartLayout {
  const plotLeft = leftLabelWidth;
  const plotRight = width - 10;
  const plotTop = 12;
  const plotBottom = height - 24; // room for the hour labels
  const plotH = plotBottom - plotTop;
  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  let startMin = 6 * 60;
  let endMin = 23 * 60;
  if (sorted.length > 0) {
    const mins = sorted.map((c) => minutesOfDay(c.createdAt));
    startMin = Math.floor((Math.min(...mins) - 45) / 60) * 60;
    endMin = Math.ceil((Math.max(...mins) + 45) / 60) * 60;
    if (endMin - startMin < 6 * 60) {
      const mid = (startMin + endMin) / 2;
      startMin = Math.floor((mid - 3 * 60) / 60) * 60;
      endMin = startMin + 6 * 60;
    }
    startMin = Math.max(0, startMin);
    endMin = Math.min(24 * 60, Math.max(endMin, startMin + 6 * 60));
  }
  const xFor = (min: number) => plotLeft + ((min - startMin) / (endMin - startMin)) * (plotRight - plotLeft);
  const yForValue = (v: number) => plotTop + (visualPositionForValue(v) / 100) * plotH;

  const bands: ChartBand[] = AROUSAL_BANDS.map((b) => {
    const { top, height: h } = visualExtentForBand(b);
    return { id: b.id, color: b.color, y: plotTop + (top / 100) * plotH, h: (h / 100) * plotH, labelKey: b.labelKey };
  });

  const spanH = (endMin - startMin) / 60;
  const step = spanH <= 8 ? 1 : spanH <= 14 ? 2 : 3;
  const ticks: ChartTick[] = [];
  for (let m = Math.ceil(startMin / 60) * 60; m <= endMin; m += step * 60) {
    ticks.push({ x: xFor(m), label: `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:00` });
  }

  let lastX = -Infinity;
  let lastAbove = false;
  const points: ChartPoint[] = sorted.map((c) => {
    const v = valueOf(c);
    const x = xFor(minutesOfDay(c.createdAt));
    // Neighbours closer than 34px alternate above/below their dot.
    const close = x - lastX < 34;
    const labelAbove = close ? !lastAbove : true;
    lastX = x;
    lastAbove = labelAbove;
    return { id: c.id, x, y: yForValue(v), value: v, color: bandForValue(v).color, time: formatClock(c.createdAt), zoneId: bandForValue(v).id, afterSkillTitle: c.afterSkillTitle, labelAbove };
  });

  return { width, height, plotLeft, plotRight, plotTop, plotBottom, bands, ticks, points };
}

/**
 * Same plot as layoutDayChart but for several days (week / month
 * overview in the PDF): the x axis is real time between `fromMs` and
 * `toMs`, with a tick label at each `tickEveryDays` day boundary.
 */
export function layoutRangeChart(
  checkIns: PolyvagalCheckIn[],
  fromMs: number,
  toMs: number,
  tickEveryDays: number,
  width: number,
  height: number,
  leftLabelWidth: number,
  locale: string,
): ChartLayout {
  const plotLeft = leftLabelWidth;
  const plotRight = width - 10;
  const plotTop = 12;
  const plotBottom = height - 24;
  const plotH = plotBottom - plotTop;
  const span = Math.max(toMs - fromMs, 3600 * 1000);
  const xFor = (ms: number) => plotLeft + ((ms - fromMs) / span) * (plotRight - plotLeft);
  const yForValue = (v: number) => plotTop + (visualPositionForValue(v) / 100) * plotH;
  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const bands: ChartBand[] = AROUSAL_BANDS.map((b) => {
    const { top, height: h } = visualExtentForBand(b);
    return { id: b.id, color: b.color, y: plotTop + (top / 100) * plotH, h: (h / 100) * plotH, labelKey: b.labelKey };
  });

  const ticks: ChartTick[] = [];
  const dayStart = new Date(fromMs);
  dayStart.setHours(0, 0, 0, 0);
  for (let d = dayStart.getTime(), i = 0; d <= toMs; d += 24 * 3600 * 1000, i++) {
    if (d < fromMs || i % tickEveryDays !== 0) continue;
    ticks.push({ x: xFor(d), label: new Date(d).toLocaleDateString(locale, { day: '2-digit', month: '2-digit' }) });
  }

  const points: ChartPoint[] = sorted.map((c) => {
    const v = valueOf(c);
    const ms = new Date(c.createdAt).getTime();
    return { id: c.id, x: xFor(ms), y: yForValue(v), value: v, color: bandForValue(v).color, time: formatClock(c.createdAt), zoneId: bandForValue(v).id, afterSkillTitle: c.afterSkillTitle, labelAbove: true };
  });
  return { width, height, plotLeft, plotRight, plotTop, plotBottom, bands, ticks, points };
}
