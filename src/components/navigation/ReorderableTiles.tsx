import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, ChevronUp, ChevronDown, ArrowUpDown, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { useT } from '../../i18n';
import { getOrderedKeys, setOrderedKeys, type OrderableSection } from '../../services/sectionOrder';

export interface OrderableTile {
  key: string;
  to: string;
  icon: React.ComponentType<{ size?: number }>;
  title: string;
  subtitle: string;
  /** "Fehler beheben + UX vereinfachen"-Auftrag, Section 16 — optional
   * per-tile accent so someone scanning Entdecken can recognize a tile
   * by its color+shape together, not just by reading the title. Falls
   * back to the existing uniform primary color when omitted, so every
   * other page already using this component (Sicherheit, etc.) is
   * completely unaffected. */
  color?: string;
}

interface ReorderableTilesProps {
  section: OrderableSection;
  tiles: OrderableTile[];
}

/**
 * Up/down buttons instead of a drag gesture - deliberately: reordering
 * via press-and-drag needs careful, separate touch and mouse handling to
 * feel right, and is easy to get subtly wrong on one platform while
 * testing on the other. Buttons work identically and reliably everywhere,
 * are simpler to build correctly, and are just as capable of achieving
 * "move Brücken to the top" as a drag would be.
 */
export function ReorderableTiles({ section, tiles }: ReorderableTilesProps) {
  const t = useT();
  const [editing, setEditing] = useState(false);
  const [order, setOrder] = useState<string[]>(() => getOrderedKeys(section, tiles.map((tl) => tl.key)));

  const ordered = order.map((key) => tiles.find((tl) => tl.key === key)).filter((tl): tl is OrderableTile => !!tl);

  function move(index: number, direction: -1 | 1) {
    const next = [...order];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setOrderedKeys(section, next);
  }

  return (
    <div>
      <div className="flex justify-end mb-2">
        <button onClick={() => setEditing((v) => !v)} className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)]">
          {editing ? <Check size={14} /> : <ArrowUpDown size={14} />}
          {editing ? t.common.done : t.common.reorder}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {ordered.map(({ key, to, icon: Icon, title, subtitle, color }, i) => {
          const content = (
            <Card interactive={!editing} className="flex items-center gap-4">
              <div
                className="w-11 h-11 rounded-[var(--radius-md)] flex items-center justify-center flex-shrink-0"
                style={{ background: color ? `${color}22` : 'var(--color-primary-soft)', color: color ?? 'var(--color-primary)' }}
              >
                <Icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] text-[var(--color-text)]">{title}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] line-clamp-2">{subtitle}</p>
              </div>
              {editing ? (
                <div className="flex flex-col gap-1 flex-shrink-0">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label={t.common.moveUp}
                    className="p-1 rounded-full text-[var(--color-text-muted)] disabled:opacity-25 hover:bg-[var(--color-surface-muted)]"
                  >
                    <ChevronUp size={16} />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === ordered.length - 1}
                    aria-label={t.common.moveDown}
                    className="p-1 rounded-full text-[var(--color-text-muted)] disabled:opacity-25 hover:bg-[var(--color-surface-muted)]"
                  >
                    <ChevronDown size={16} />
                  </button>
                </div>
              ) : (
                <ChevronRight size={17} className="text-[var(--color-text-faint)] flex-shrink-0" />
              )}
            </Card>
          );
          return editing ? (
            <div key={key}>{content}</div>
          ) : (
            <Link key={key} to={to}>
              {content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
