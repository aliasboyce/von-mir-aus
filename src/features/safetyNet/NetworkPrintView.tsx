import { seededRandom } from '../../hooks/seededRandom';
import type { NetworkEntry, NetworkCategoryConfig } from '../../data/types';
import type { CenterNodeConfig } from './networkCategories';

interface NetworkPrintViewProps {
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  centerNode: CenterNodeConfig;
  labels: {
    title: string;
    subtitle: string;
    legendTitle: string;
    exportedOn: string;
  };
  formatDate: (iso: string) => string;
}

// Same auto-layout math as the live NetworkGraph (features/safetyNet/
// NetworkGraph.tsx) — an entry without a manually-dragged position gets
// exactly the same deterministic circular placement here, so the PDF
// genuinely matches what the person sees on screen, not a different
// layout invented just for print.
function autoPosition(entry: NetworkEntry, index: number, total: number): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / Math.max(total, 1) - Math.PI / 2;
  const radius = 0.36;
  const jitter = (seededRandom(entry.id, 'r') - 0.5) * 0.06;
  const x = 0.5 + Math.cos(angle) * (radius + jitter);
  const y = 0.5 + Math.sin(angle) * (radius + jitter);
  return { x: Math.min(0.92, Math.max(0.08, x)), y: Math.min(0.92, Math.max(0.08, y)) };
}

/**
 * A genuine visual network diagram for print — real positioned nodes and
 * connecting lines built from the actual data, not a screenshot of the
 * on-screen canvas. Landscape orientation (see the dynamically injected
 * @page rule below) since a network reads far more naturally wide than
 * tall; the rule is added only while this view is mounted and removed
 * on unmount, so it never affects any other, portrait-oriented export.
 * Node size and label length scale down automatically as the network
 * grows, so a larger network shrinks to still fit one legible page
 * instead of nodes drifting off the edge or overlapping.
 */
export function NetworkPrintView({ entries, categories, centerNode, labels, formatDate }: NetworkPrintViewProps) {
  const width = 900;
  const height = 560;
  const cx = width / 2;
  const cy = height / 2 + 10;
  const canvasR = Math.min(width, height) / 2 - 70;

  const total = entries.length;
  const density = total > 18 ? 0.72 : total > 10 ? 0.85 : 1;
  const nodeR = 16 * density;
  const fontSize = 11 * Math.max(density, 0.75);

  const categoryColor = (catId: string) => categories.find((c) => c.id === catId)?.color ?? '#8A8A8A';
  const categoryLabel = (catId: string) => categories.find((c) => c.id === catId)?.label ?? catId;

  const positions = new Map<string, { x: number; y: number }>();
  entries.forEach((e, i) => {
    const norm = e.position ?? autoPosition(e, i, total);
    positions.set(e.id, { x: cx + (norm.x - 0.5) * 2 * canvasR, y: cy + (norm.y - 0.5) * 2 * canvasR });
  });

  const usedCategories = Array.from(new Set(entries.map((e) => e.category)));

  return (
    <div className="print-only print-landscape" style={{ padding: '30px 34px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      <style>{'@page network-print { size: landscape; } .print-landscape { page: network-print; }'}</style>
      <h1 style={{ fontSize: 22, fontWeight: 600, marginBottom: 2 }}>{labels.title}</h1>
      <p style={{ fontSize: 12, color: '#777', marginBottom: 16 }}>
        {labels.subtitle} · {labels.exportedOn} {formatDate(new Date().toISOString())}
      </p>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: 'block', marginBottom: 18 }}>
        {/* connection + structural link lines, drawn first so nodes sit on top */}
        {entries.map((e) => {
          const from = positions.get(e.id);
          if (!from) return null;
          return [...(e.connections ?? []), ...(e.linkedTo ?? [])].map((targetId) => {
            const to = positions.get(targetId);
            if (!to) return null;
            const isStructural = e.linkedTo?.includes(targetId);
            return (
              <line
                key={`${e.id}-${targetId}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke={isStructural ? '#B7AFA3' : '#8FA88C'}
                strokeWidth={1.3}
                strokeDasharray={isStructural ? '3 3' : undefined}
                opacity={0.7}
              />
            );
          });
        })}

        {/* lines from every node to the center "you" node */}
        {entries.map((e) => {
          const p = positions.get(e.id);
          if (!p) return null;
          return <line key={`center-${e.id}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E4DFD5" strokeWidth={0.8} />;
        })}

        {/* center "you" node */}
        <circle cx={cx} cy={cy} r={nodeR * 1.15} fill={centerNode.color} />
        <text x={cx} y={cy + 3} fontSize={fontSize} fill="#fff" textAnchor="middle" fontWeight={600}>
          {centerNode.label}
        </text>

        {/* every entry node */}
        {entries.map((e) => {
          const p = positions.get(e.id);
          if (!p) return null;
          const color = categoryColor(e.category);
          return (
            <g key={e.id}>
              <circle cx={p.x} cy={p.y} r={nodeR} fill={color} opacity={0.9} />
              <text
                x={p.x}
                y={p.y + nodeR + fontSize + 2}
                fontSize={fontSize}
                fill="#2a2520"
                textAnchor="middle"
                style={{ maxWidth: 80 }}
              >
                {e.name.length > 16 ? `${e.name.slice(0, 15)}…` : e.name}
              </text>
            </g>
          );
        })}
      </svg>

      <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>{labels.legendTitle}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 22px' }}>
        {usedCategories.map((catId) => (
          <div key={catId} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: 999, background: categoryColor(catId), display: 'inline-block' }} />
            <span style={{ fontSize: 12 }}>{categoryLabel(catId)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
