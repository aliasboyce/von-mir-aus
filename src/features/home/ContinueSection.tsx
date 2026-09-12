import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, NotebookPen } from 'lucide-react';
import { activityRepo } from '../../services/activityLog';
import { diaryRepo } from '../diary/diaryRepo';
import { useT } from '../../i18n';
import type { ActivityType } from '../../data/types';

interface ContinueItem {
  id: string;
  createdAt: string;
  label: string;
  href: string;
}

function hrefForActivity(type: ActivityType, refId: string): string {
  switch (type) {
    case 'resource':
      return `/entdecken/ressourcen?open=${refId}`;
    case 'bridge':
      return `/bruecken/${refId}`;
    case 'contact':
      return `/sicherheit/netzwerk?open=${refId}`;
    default:
      return '/';
  }
}

/**
 * Deliberately built from real usage, not a fixed static set - reuses the
 * same activity log that powers "Zuletzt genutzt" elsewhere, plus the
 * diary directly (diary entries were never routed through the activity
 * log since every entry already carries its own timestamp). Shows nothing
 * until there's genuinely something to continue.
 */
export function ContinueSection() {
  const t = useT();

  const items = useMemo<ContinueItem[]>(() => {
    const fromActivity: ContinueItem[] = activityRepo
      .getAll()
      .filter((e) => e.refId)
      .map((e) => ({ id: e.id, createdAt: e.createdAt, label: e.label, href: hrefForActivity(e.type, e.refId!) }));

    const lastDiary = diaryRepo.getAll().sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
    const fromDiary: ContinueItem[] = lastDiary
      ? [
          {
            id: lastDiary.id,
            createdAt: lastDiary.createdAt,
            label: t.home.continueDiaryEntry,
            href: '/sicherheit/tagebuch',
          },
        ]
      : [];

    const merged = [...fromActivity, ...fromDiary].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const seen = new Set<string>();
    const deduped: ContinueItem[] = [];
    for (const item of merged) {
      if (seen.has(item.href)) continue;
      seen.add(item.href);
      deduped.push(item);
      if (deduped.length >= 3) break;
    }
    return deduped;
  }, [t]);

  if (items.length === 0) return null;

  return (
    <div className="mb-6">
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
        {t.home.continueTitle}
      </p>
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <Link
            key={item.id}
            to={item.href}
            className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3"
          >
            <NotebookPen size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />
            <span className="text-[14px] text-[var(--color-text)] flex-1 truncate">{item.label}</span>
            <ArrowRight size={15} className="text-[var(--color-text-faint)] flex-shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
