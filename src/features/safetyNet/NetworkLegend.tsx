import { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useT } from '../../i18n';
import { getIcon } from '../../components/icons/networkIcons';
import type { NetworkCategoryConfig } from '../../data/types';

interface NetworkLegendProps {
  categories: NetworkCategoryConfig[];
}

/**
 * Collapsed by default (a small "i" button) so it never competes with the
 * graph itself for attention - only expands into the actual legend list on
 * request. Positioned as a corner overlay on desktop; on narrow/mobile
 * screens it renders as a full-width strip below the graph instead, since
 * a corner overlay there would sit on top of nodes.
 */
export function NetworkLegend({ categories }: NetworkLegendProps) {
  const t = useT();
  const [open, setOpen] = useState(false);

  if (categories.length === 0) return null;

  return (
    <div className="network-legend">
      {!open ? (
        <button
          onClick={() => setOpen(true)}
          aria-label={t.network.legendTitle}
          className="network-legend__toggle"
        >
          <Info size={14} />
        </button>
      ) : (
        <div className="network-legend__panel">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[12px] font-medium text-[var(--color-text)]">{t.network.legendTitle}</p>
            <button onClick={() => setOpen(false)} aria-label={t.common.close} className="text-[var(--color-text-faint)]">
              <X size={14} />
            </button>
          </div>
          <div className="flex flex-col gap-1.5">
            {categories.map((c) => {
              const Icon = getIcon(c.iconKey, c.iconKey);
              return (
                <div key={c.id} className="flex items-center gap-2">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: c.color }}
                  >
                    <Icon size={11} color="#fff" />
                  </span>
                  <span className="text-[12px] text-[var(--color-text-muted)] truncate">{c.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
