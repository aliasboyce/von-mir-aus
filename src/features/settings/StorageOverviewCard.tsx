import { useMemo } from 'react';
import { HardDrive } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { computeStorageUsage, formatBytes } from '../../services/storageUsage';

/**
 * Audit follow-up, Langzeitproblem 2 / "Idee einer Übersicht des eigenen
 * gespeicherten Datenvolumens" — computed live from actual localStorage
 * contents, not an estimate. Kept calm and plain-language (a simple
 * bar + a short list) rather than a technical dashboard — the goal is
 * "roughly how much am I carrying around", not precise diagnostics.
 */
export function StorageOverviewCard() {
  const t = useT();
  const usage = useMemo(() => computeStorageUsage(), []);
  const percent = Math.min(100, (usage.totalBytes / usage.approxQuotaBytes) * 100);

  return (
    <Card padding="md" className="mb-3">
      <div className="flex items-center gap-2 mb-3">
        <HardDrive size={16} className="text-[var(--color-text-muted)]" />
        <p className="text-[13px] font-medium text-[var(--color-text)]">{t.settings.storageOverviewTitle}</p>
      </div>

      <div className="flex items-baseline justify-between mb-1.5">
        <span className="text-[20px] text-[var(--color-text)]">{formatBytes(usage.totalBytes)}</span>
        <span className="text-[11px] text-[var(--color-text-faint)]">{t.settings.storageOverviewApprox}</span>
      </div>
      <div className="w-full h-1.5 rounded-full bg-[var(--color-surface-muted)] overflow-hidden mb-4">
        <div className="h-full rounded-full" style={{ width: `${percent}%`, background: percent > 80 ? 'var(--color-accent-clay)' : 'var(--color-primary)' }} />
      </div>

      {usage.categories.length > 0 && (
        <div className="flex flex-col gap-1.5 mb-1">
          {usage.categories.slice(0, 6).map((c) => (
            <div key={c.label} className="flex items-center justify-between">
              <span className="text-[12px] text-[var(--color-text-muted)]">{c.label}</span>
              <span className="text-[12px] text-[var(--color-text-faint)]">{formatBytes(c.bytes)}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
