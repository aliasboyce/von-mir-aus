import { useState } from 'react';
import { Maximize2, FileDown } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { AROUSAL_BANDS } from '../polyvagal/arousalBands';
import { layoutDayChart } from './reviewChartLayout';
import { reviewSummaryLines } from './reviewStats';
import type { PolyvagalCheckIn, SkillUse } from '../../data/types';

function shortZoneLabel(label: string): string {
  const first = label.split(/[ &(]/)[0];
  return first.length > 11 ? `${first.slice(0, 10)}.` : first;
}

/** The plot itself. Compact (inline in a day card) or expanded (large,
 * in the enlarge dialog) — the same SVG viewBox logic either way, so
 * nothing is stretched or distorted at any size. */
export function ReviewDayChart({ checkIns, expanded = false }: { checkIns: PolyvagalCheckIn[]; expanded?: boolean }) {
  const t = useT();
  const width = expanded ? 900 : 360;
  const height = expanded ? 440 : 230;
  const left = expanded ? 130 : 66;
  const layout = layoutDayChart(checkIns, width, height, left);
  const fs = expanded ? 1.15 : 1;

  return (
    // Compact: scales to the card width. Expanded: drawn at its true
    // 900px width (so text is genuinely larger, not shrunk to fit a
    // phone) inside a horizontally scrollable dialog — see DayCurveBlock.
    <svg viewBox={`0 0 ${width} ${height}`} width={expanded ? width : '100%'} height={expanded ? height : undefined} style={{ display: 'block', height: expanded ? height : 'auto', maxWidth: expanded ? 'none' : '100%' }} role="img" aria-label={t.reviewSummary.chartTitle}>
      {layout.bands.map((b) => (
        <rect key={b.id} x={layout.plotLeft} y={b.y} width={layout.plotRight - layout.plotLeft} height={Math.max(b.h, 1)} fill={b.color} opacity={0.2} />
      ))}
      {layout.bands.map((b) => {
        const label = t.polyvagal.arousalZones[b.labelKey as keyof typeof t.polyvagal.arousalZones].label;
        return (
          <g key={`l-${b.id}`}>
            <line x1={layout.plotLeft} x2={layout.plotRight} y1={b.y} y2={b.y} stroke="var(--color-border)" strokeDasharray="2 4" />
            <text x={4} y={b.y + b.h / 2 + 3} fontSize={9 * fs} fontWeight={600} fill={b.color}>
              {expanded ? label : shortZoneLabel(label)}
            </text>
          </g>
        );
      })}
      {layout.ticks.map((tk, i) => (
        <g key={i}>
          <line x1={tk.x} x2={tk.x} y1={layout.plotTop} y2={layout.plotBottom} stroke="var(--color-border)" strokeWidth={0.6} opacity={0.7} />
          <text x={tk.x} y={layout.height - 7} fontSize={9 * fs} textAnchor="middle" fill="var(--color-text-faint)">
            {tk.label}
          </text>
        </g>
      ))}
      {layout.points.length > 1 && (
        <polyline points={layout.points.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke="var(--color-text-faint)" strokeWidth={1.6} opacity={0.55} strokeLinejoin="round" strokeLinecap="round" />
      )}
      {layout.points.map((p) => (
        <g key={p.id}>
          <circle cx={p.x} cy={p.y} r={(expanded ? 6.5 : 5.5)} fill={p.color} stroke="var(--color-surface)" strokeWidth={1.5} />
          {p.afterSkillTitle && <circle cx={p.x} cy={p.y} r={expanded ? 11 : 9.5} fill="none" stroke={p.color} strokeWidth={1.3} strokeDasharray="2.5 2" />}
          {p.labelAbove ? (
            <>
              <text x={p.x} y={p.y - (expanded ? 22 : 19)} fontSize={8 * fs} textAnchor="middle" fill="var(--color-text-faint)">
                {p.time}
              </text>
              <text x={p.x} y={p.y - (expanded ? 12 : 10.5)} fontSize={9.5 * fs} fontWeight={700} textAnchor="middle" fill={p.color}>
                {p.value}%
              </text>
            </>
          ) : (
            <>
              <text x={p.x} y={p.y + (expanded ? 21 : 18)} fontSize={9.5 * fs} fontWeight={700} textAnchor="middle" fill={p.color}>
                {p.value}%
              </text>
              <text x={p.x} y={p.y + (expanded ? 31 : 27)} fontSize={8 * fs} textAnchor="middle" fill="var(--color-text-faint)">
                {p.time}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  );
}

/** Every value of the day as a plain table: time, value with its color,
 * and the named range — so nothing depends on reading a small label
 * off the chart. */
export function CheckInTable({ checkIns }: { checkIns: PolyvagalCheckIn[] }) {
  const t = useT();
  const layout = layoutDayChart(checkIns, 360, 230, 66);
  if (layout.points.length === 0) return null;
  return (
    <table className="w-full text-[12.5px] mt-2" style={{ borderCollapse: 'collapse' }}>
      <thead>
        <tr className="text-left text-[var(--color-text-faint)]">
          <th className="font-normal py-1 pr-2">{t.reviewSummary.colTime}</th>
          <th className="font-normal py-1 pr-2">{t.reviewSummary.colValue}</th>
          <th className="font-normal py-1">{t.reviewSummary.colZone}</th>
        </tr>
      </thead>
      <tbody>
        {layout.points.map((p) => {
          const band = AROUSAL_BANDS.find((b) => b.id === p.zoneId);
          const zoneLabel = band ? t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones].label : '';
          return (
            <tr key={p.id} style={{ borderTop: '1px solid var(--color-border)' }}>
              <td className="py-1 pr-2 tabular-nums text-[var(--color-text-muted)]">{p.time}</td>
              <td className="py-1 pr-2 tabular-nums font-semibold" style={{ color: p.color }}>
                {p.value} %
              </td>
              <td className="py-1 text-[var(--color-text)]">
                <span className="inline-block w-2 h-2 rounded-full mr-1.5 align-middle" style={{ background: p.color }} />
                {zoneLabel}
                {p.afterSkillTitle && <span className="text-[var(--color-text-faint)]"> · {t.reviewSummary.afterSkill}: {p.afterSkillTitle}</span>}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

/**
 * One day's curve, ready to drop into the Tagesrueckblick: positive
 * summary lines, the chart with a "Vergroessern" button, the value
 * table, and an optional per-day PDF button.
 */
export function DayCurveBlock({ checkIns, skillUses, onPdf }: { checkIns: PolyvagalCheckIn[]; skillUses: SkillUse[]; onPdf?: () => void }) {
  const t = useT();
  const { settings } = useSettings();
  const [enlarged, setEnlarged] = useState(false);
  const lines = reviewSummaryLines(checkIns, skillUses, t);
  if (checkIns.length === 0) return null;
  void settings;

  return (
    <div className="mb-3">
      {lines.length > 0 && (
        <div className="mb-2">
          {lines.map((l, i) => (
            <p key={i} className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">
              {l}
            </p>
          ))}
        </div>
      )}
      <div className="rounded-[var(--radius-md)] p-2" style={{ background: 'var(--color-surface-muted)' }}>
        <ReviewDayChart checkIns={checkIns} />
        {checkIns.some((c) => c.afterSkillTitle) && <p className="text-[10.5px] text-[var(--color-text-faint)] mt-1">{t.reviewSummary.legendAfterSkill}</p>}
      </div>
      <div className="flex items-center gap-4 mt-1.5">
        <button onClick={() => setEnlarged(true)} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)]">
          <Maximize2 size={13} /> {t.reviewSummary.enlarge}
        </button>
        {onPdf && (
          <button onClick={onPdf} className="flex items-center gap-1.5 text-[12.5px] text-[var(--color-primary)]">
            <FileDown size={13} /> {t.reviewSummary.pdfDay}
          </button>
        )}
      </div>
      <CheckInTable checkIns={checkIns} />

      <Modal open={enlarged} onClose={() => setEnlarged(false)} title={t.reviewSummary.chartTitle}>
        <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2">{t.reviewSummary.scrollHint}</p>
        <div className="overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>
          <ReviewDayChart checkIns={checkIns} expanded />
        </div>
        <CheckInTable checkIns={checkIns} />
      </Modal>
    </div>
  );
}
