import type { PolyvagalCheckIn } from '../../data/types';
import { bandForValueCalibrated } from './arousalBands';
import { useT } from '../../i18n';

interface ChartPrintViewProps {
  checkIns: PolyvagalCheckIn[];
  boundaries?: [number, number, number, number, number];
  periodLabel: string;
  formatDateTime: (iso: string) => string;
}

/**
 * "Die Verlaufskurven soll man auch als PDF laden können"-Auftrag —
 * same print-only mechanism as WindowProgressPrintView.tsx (and every
 * other export in the app): a plain, chronological table is more
 * useful on paper than trying to force the SVG chart itself onto a
 * static page, especially once a month's worth of points made even
 * the on-screen chart crowded. Reuses the exact same calibrated-band
 * lookup as the chart and the feedback text, so the zone name printed
 * next to each entry always matches what the person would see on
 * screen for that same value.
 */
export function ChartPrintView({ checkIns, boundaries, periodLabel, formatDateTime }: ChartPrintViewProps) {
  const t = useT();
  const sorted = [...checkIns].sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>{t.polyvagal.developmentTitle}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 24 }}>
        {periodLabel} · {t.network.exportedOn} {formatDateTime(new Date().toISOString())}
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #333' }}>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{t.polyvagal.printDateColumn}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{t.polyvagal.ladderStatusLabel}</th>
            <th style={{ textAlign: 'left', padding: '8px 4px' }}>{t.polyvagal.printZoneColumn}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((c, i) => {
            const raw = c.tensionValue ?? { ventral: 83, sympathetic: 50, dorsal: 17 }[c.zone];
            const band = bandForValueCalibrated(raw, boundaries);
            const zoneT = t.polyvagal.arousalZones[band.labelKey as keyof typeof t.polyvagal.arousalZones];
            return (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee', background: i % 2 === 1 ? '#fafafa' : undefined }}>
                <td style={{ padding: '8px 4px' }}>{formatDateTime(c.createdAt)}</td>
                <td style={{ padding: '8px 4px', fontWeight: 600 }}>{raw}%</td>
                <td style={{ padding: '8px 4px', color: band.color, fontWeight: 600 }}>{zoneT.label}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && <p style={{ fontSize: 13, color: '#777', marginTop: 16 }}>{t.polyvagal.emptyChart}</p>}
    </div>
  );
}
