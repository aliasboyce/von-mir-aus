import type { Bridge } from '../../data/types';

interface BridgePrintViewProps {
  bridges: Bridge[];
  categoryLabel: (category: string) => string;
  title?: string;
}

/** Same print-only mechanism as the Safety Plan and Resource PDFs.
 * Takes an array so the same component serves both single-bridge export
 * (an array of one) and export-all/selected from the list page — each
 * bridge gets its own page-break-protected block. */
export function BridgePrintView({ bridges, categoryLabel, title }: BridgePrintViewProps) {
  if (bridges.length === 0) return null;
  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      {title && bridges.length > 1 && <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 28 }}>{title}</h1>}
      {bridges.map((bridge, i) => (
        <div key={bridge.id} style={{ breakInside: 'avoid' }}>
          {bridge.image && (
            <img
              src={bridge.image}
              alt=""
              style={{ width: '100%', maxHeight: 280, objectFit: 'cover', borderRadius: 16, marginBottom: 24, display: 'block' }}
            />
          )}

          <span
            style={{
              display: 'inline-block',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 0.4,
              textTransform: 'uppercase',
              color: '#6b6b6b',
              background: '#f0f0f0',
              borderRadius: 999,
              padding: '4px 12px',
              marginBottom: 12,
            }}
          >
            {categoryLabel(bridge.category)}
          </span>

          <h2 style={{ fontSize: 26, fontWeight: 600, marginBottom: 16, lineHeight: 1.25 }}>{bridge.title}</h2>

          {bridge.description && (
            <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 24, color: '#2a2a2a' }}>{bridge.description}</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
            {bridge.levels.map((level) => (
              <div key={level.level} style={{ borderLeft: '3px solid #d8d8d8', paddingLeft: 14, breakInside: 'avoid' }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 2 }}>
                  Level {level.level} — {level.title}
                </p>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: '#2a2a2a' }}>{level.description}</p>
              </div>
            ))}
          </div>

          {bridge.tip && <p style={{ fontSize: 13, lineHeight: 1.6, color: '#555', fontStyle: 'italic' }}>{bridge.tip}</p>}

          {bridges.length > 1 && i < bridges.length - 1 && (
            <div style={{ borderTop: '1px solid #eee', margin: '28px 0' }} />
          )}
        </div>
      ))}
    </div>
  );
}
