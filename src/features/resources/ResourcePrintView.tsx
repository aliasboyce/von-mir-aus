import type { Resource, ResourceCategory } from '../../data/types';

interface ResourcePrintViewProps {
  resource: Resource | null;
  categoryLabel: (cat: ResourceCategory) => string;
}

/**
 * Reuses the exact .print-only / print CSS mechanism already built for
 * the safety plan PDF export - hidden in normal view, becomes visible
 * only inside @media print (see index.css), which is what
 * window.print() actually renders. No new PDF library needed.
 *
 * Deliberately styled as an actual card someone would want to keep or
 * pass along - image, clear hierarchy, generous spacing - not a plain
 * text dump of the data.
 */
export function ResourcePrintView({ resource, categoryLabel }: ResourcePrintViewProps) {
  if (!resource) return null;
  return (
    <div className="print-only" style={{ padding: '40px 36px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      {resource.image && (
        <img
          src={resource.image}
          alt=""
          style={{
            width: '100%',
            maxHeight: 280,
            objectFit: 'cover',
            borderRadius: 16,
            marginBottom: 24,
            display: 'block',
          }}
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
        {categoryLabel(resource.category)}
      </span>

      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 16, lineHeight: 1.25 }}>{resource.title}</h1>

      {resource.description && (
        <p style={{ fontSize: 15, lineHeight: 1.7, marginBottom: 20, color: '#2a2a2a' }}>{resource.description}</p>
      )}

      {resource.note && (
        <div style={{ borderLeft: '3px solid #d8d8d8', paddingLeft: 14, marginBottom: 20 }}>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#555', fontStyle: 'italic' }}>{resource.note}</p>
        </div>
      )}

      {resource.tags.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          {resource.tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: 'inline-block',
                fontSize: 12,
                color: '#555',
                border: '1px solid #ddd',
                borderRadius: 999,
                padding: '3px 10px',
                marginRight: 6,
                marginBottom: 6,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {resource.link && (
        <p style={{ fontSize: 13, color: '#3a5fc4', wordBreak: 'break-all', marginTop: 8 }}>{resource.link}</p>
      )}
    </div>
  );
}
