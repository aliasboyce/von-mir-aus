import { useL } from '../../features/projects/useL';
import { cautionFor } from '../../services/skillCaution';
import type { Resource } from '../../data/types';

type R = Pick<Resource, 'id' | 'skillDetails'> | undefined;

/** Kleine Markierung für Karten und Listen */
export function CautionBadge({ resource }: { resource: R }) {
  const { L, lang } = useL();
  const c = cautionFor(resource, lang);
  if (!c) return null;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] rounded-full px-2 py-0.5 mb-1 align-middle" style={{ background: 'var(--color-notice-soft, var(--color-surface-muted))', color: 'var(--color-text)', border: '1px solid var(--color-border-strong)' }} data-testid="caution-badge" title={c.text}>
      <span aria-hidden="true">⚠️</span>{L('Vorsicht', 'Caution')}
    </span>
  );
}

/** Ruhiger Hinweis „Nicht bei …“ am Anfang eines Skills */
export function CautionNote({ resource }: { resource: R }) {
  const { L, lang } = useL();
  const c = cautionFor(resource, lang);
  if (!c) return null;
  return (
    <div className="rounded-[var(--radius-lg)] p-3.5 mb-3 border" style={{ borderColor: 'var(--color-border-strong)', background: 'var(--color-surface-muted)' }} role="note" data-testid="caution-note">
      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-1"><span aria-hidden="true">⚠️ </span>{L('Vorsicht – nicht für jede Situation', 'Caution – not for every situation')}</p>
      <p className="text-[13px] text-[var(--color-text)] leading-relaxed">{c.text}</p>
      <p className="text-[12px] text-[var(--color-text-faint)] mt-1.5">{L('Wenn es sich nicht gut anfühlt: aufhören ist immer okay. „Das hilft gerade nicht“ zählt.', 'If it does not feel right: stopping is always okay. “This does not help right now” counts.')}</p>
    </div>
  );
}
