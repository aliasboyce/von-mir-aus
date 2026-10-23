import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Move3d, Camera } from 'lucide-react';
import { NetworkGraph } from './NetworkGraph';
import { NetworkLegend } from './NetworkLegend';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useSettings } from '../../state/SettingsContext';
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
  onLinkTap?: (aId: string, bId: string) => void;
  linksVersion?: number;
  /** photo button: saves the net as it is right now as a picture */
  onSnapshot?: () => Promise<'shared' | 'downloaded' | 'cancelled' | 'failed'>;
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
  onLinkTap,
  linksVersion,
  onSnapshot,
}: NetworkGraphFullscreenProps) {
  const t = useT();
  const { settings } = useSettings();
  useRegisterModalOpen(true);
  const en = settings.language === 'en';
  const [snap, setSnap] = useState<'idle' | 'busy' | 'shared' | 'downloaded' | 'failed'>('idle');

  async function takeSnapshot() {
    if (!onSnapshot || snap === 'busy') return;
    setSnap('busy');
    try {
      const r = await onSnapshot();
      setSnap(r === 'cancelled' ? 'idle' : r);
    } catch {
      setSnap('failed');
    }
    setTimeout(() => setSnap('idle'), 3500);
  }
  const snapMsg =
    snap === 'shared' ? (en ? 'Picture ready – save it from the share menu.' : 'Bild ist bereit – im Teilen-Menü sichern.')
    : snap === 'downloaded' ? (en ? 'Picture saved to your downloads.' : 'Bild wurde in deinen Downloads gespeichert.')
    : snap === 'failed' ? (en ? 'The picture could not be made on this device.' : 'Das Bild ließ sich auf diesem Gerät nicht erstellen.')
    : null;

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
        {onSnapshot && (
          <button
            type="button"
            onClick={() => void takeSnapshot()}
            aria-label={en ? 'Save snapshot' : 'Momentaufnahme speichern'}
            title={en ? 'Save snapshot' : 'Momentaufnahme speichern'}
            className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center text-[var(--color-text)]"
            style={{ opacity: snap === 'busy' ? 0.5 : 1 }}
            data-testid="fs-snapshot"
          >
            <Camera size={19} />
          </button>
        )}
        <span className="flex items-center gap-1.5 text-[12px] text-[var(--color-text-faint)]">
          <Move3d size={14} />
          {settings.language === 'en' ? 'Drag to move · pinch or scroll to zoom – as far as you like' : 'Ziehen zum Verschieben · Pinch/Scrollen zum Zoomen – so weit du magst'}
        </span>
      </div>
      {snapMsg && (
        <div className="mx-4 mb-2 rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] px-4 py-2.5 text-[13px] text-[var(--color-text)]" role="status" data-testid="fs-snapshot-msg">{snapMsg}</div>
      )}
      {connectingFromId && (
        <div className="mx-4 mb-2 flex items-center justify-between gap-3 rounded-[var(--radius-lg)] bg-[var(--color-primary-soft)] px-4 py-2.5" data-testid="fs-connecting-hint">
          <p className="text-[13px] text-[var(--color-text)]">{t.network.connectingHint}</p>
          <button type="button" onClick={onCancelConnecting} className="text-[13px] text-[var(--color-primary)] flex-shrink-0">{t.common.cancel}</button>
        </div>
      )}
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
          onLinkTap={onLinkTap}
          linksVersion={linksVersion}
        />
        <NetworkLegend categories={categories} />
      </div>
    </div>,
    document.body,
  );
}
