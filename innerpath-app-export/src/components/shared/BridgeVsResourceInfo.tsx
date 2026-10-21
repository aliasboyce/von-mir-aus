import { useT } from '../../i18n';

/** The explanation behind "Was unterscheidet Brücken von Ressourcen?" — shown on the
 * Brücken page and on the Ressourcen pages, so both say exactly the same. */
export function BridgeVsResourceInfo() {
  const t = useT();
  const b = t.bridges;
  return (
    <div className="flex flex-col gap-5">
      <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{b.diffIntro}</p>
      <div>
        <h3 className="text-[16px] text-[var(--color-text)] mb-1.5">{b.diffResTitle}</h3>
        <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{b.diffResBody}</p>
      </div>
      <div>
        <h3 className="text-[16px] text-[var(--color-text)] mb-1.5">{b.diffBridgeTitle}</h3>
        <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{b.diffBridgeBody}</p>
      </div>
      <div className="rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-4 py-3.5">
        <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-primary)] mb-1.5">{b.diffExampleTitle}</p>
        <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed">{b.diffExampleBody}</p>
      </div>
      <p className="text-[14px] font-medium text-[var(--color-text)] leading-relaxed">{b.diffSummary}</p>
    </div>
  );
}
