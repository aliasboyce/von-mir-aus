import { createPortal } from 'react-dom';
import { X, Move3d } from 'lucide-react';
import { NetworkGraph } from './NetworkGraph';
import { NetworkLegend } from './NetworkLegend';
import { useT } from '../../i18n';
import type { CenterNodeConfig } from './networkCategories';
import type { NetworkCategoryConfig, NetworkEntry } from '../../data/types';

interface NetworkGraphFullscreenProps {
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  centerNode?: CenterNodeConfig;
  onSelect: (entry: NetworkEntry) => void;
  onSelectCenter?: () => void;
  onMove: (entry: NetworkEntry, position: { x: number; y: number }) => void;
  onClose: () => void;
  connectingFromId?: string | null;
  onCompleteConnection?: (target: NetworkEntry) => void;
  onCancelConnecting?: () => void;
  onRemoveConnection?: (fromId: string, toId: string) => void;
}

export function NetworkGraphFullscreen({
  entries,
  categories,
  centerNode,
  onSelect,
  onSelectCenter,
  onMove,
  onClose,
  connectingFromId,
  onCompleteConnection,
  onCancelConnecting,
  onRemoveConnection,
}: NetworkGraphFullscreenProps) {
  const t = useT();

  return createPortal(
    <div className="network-fullscreen animate-in" role="dialog" aria-modal="true" aria-label={t.network.title}>
      <div className="network-fullscreen__bar">
        <button
          onClick={onClose}
          aria-label={t.network.exitExpand}
          className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text)]"
        >
          <X size={20} />
        </button>
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-faint)]">
          <Move3d size={14} />
          Ziehen zum Verschieben · Pinch/Scrollen zum Zoomen
        </span>
      </div>
      <div className="network-fullscreen__canvas">
        <NetworkGraph
          entries={entries}
          categories={categories}
          onSelect={onSelect}
          onMove={onMove}
          centerNode={centerNode}
          onSelectCenter={onSelectCenter}
          expanded
          connectingFromId={connectingFromId}
          onCompleteConnection={onCompleteConnection}
          onCancelConnecting={onCancelConnecting}
          onRemoveConnection={onRemoveConnection}
        />
        <NetworkLegend categories={categories} />
      </div>
    </div>,
    document.body,
  );
}
