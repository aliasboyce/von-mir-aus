import { useState } from 'react';
import { useT } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { CONNECTION_ITEMS_DE, manualPriorities, togglePriority } from './wertekompassData';

/**
 * "Weiterarbeit" brief, Section 7/9 — explicitly repeated across two
 * prompts: values should surface one card at a time with three
 * resonance reactions (spricht mich an / vielleicht / gerade nicht),
 * not a flat grid of chips to scan. "Vielleicht" isn't a dead end —
 * it re-queues the card for later in the same browsing session rather
 * than silently disappearing, since "maybe" is a real, complete answer
 * here, not a rejection.
 */
export function ValueDiscoveryCards({ onChanged }: { onChanged: () => void }) {
  const t = useT();
  const [queue, setQueue] = useState<string[]>(() => {
    const priorities = manualPriorities();
    return CONNECTION_ITEMS_DE.filter((v) => !priorities.includes(v));
  });

  const current = queue[0];

  function advance(action: 'yes' | 'maybe' | 'no') {
    if (!current) return;
    const rest = queue.slice(1);
    if (action === 'yes') {
      togglePriority(current);
      onChanged();
      setQueue(rest);
    } else if (action === 'maybe') {
      // re-queue near the end so it can come back around later in this
      // same browsing pass, rather than vanishing
      setQueue([...rest, current]);
    } else {
      setQueue(rest);
    }
  }

  if (!current) {
    return <p className="text-[13px] text-[var(--color-text-faint)] text-center py-4">{t.wertekompass.discoveryDone}</p>;
  }

  return (
    <div>
      <Card className="mb-3 text-center py-6">
        <p className="text-[20px] text-[var(--color-text)]">{current}</p>
      </Card>
      <div className="flex gap-2">
        <button
          onClick={() => advance('no')}
          className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]"
        >
          {t.wertekompass.reactionNo}
        </button>
        <button
          onClick={() => advance('maybe')}
          className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
        >
          {t.wertekompass.reactionMaybe}
        </button>
        <button onClick={() => advance('yes')} className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]">
          {t.wertekompass.reactionYes}
        </button>
      </div>
      <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-3">{t.wertekompass.discoveryRemaining.replace('{n}', String(queue.length))}</p>
    </div>
  );
}
