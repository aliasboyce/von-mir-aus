import { Link } from 'react-router-dom';
import { History } from 'lucide-react';
import { recentActivity } from '../../services/activityLog';
import { useT } from '../../i18n';
import type { ActivityType } from '../../data/types';

interface RecentlyUsedRowProps {
  type: ActivityType;
  hrefFor: (refId: string) => string;
}

/** Renders nothing until there's at least one real activity event — never
 * shows a placeholder or example, per the "never decorative" data principle
 * already established for the day-curve previews. */
export function RecentlyUsedRow({ type, hrefFor }: RecentlyUsedRowProps) {
  const t = useT();
  const items = recentActivity(type, 5).filter((e) => e.refId);

  if (items.length === 0) return null;

  return (
    <div className="mb-5">
      <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
        <History size={12} />
        {t.common.recentlyUsed}
      </p>
      <div className="chip-row no-scrollbar -mx-5 px-5">
        {items.map((event) => (
          <Link
            key={event.id}
            to={hrefFor(event.refId!)}
            className="flex-shrink-0 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-3.5 py-2 text-[13px] text-[var(--color-text)] whitespace-nowrap"
          >
            {event.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
