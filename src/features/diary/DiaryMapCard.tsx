import { Network, X } from 'lucide-react';
import { MindmapDrawing } from '../mindmap/MindmapScene';
import type { MindMap } from '../mindmap/mindmapModel';

/**
 * Eine mit dem Eintrag verbundene Mindmap – direkt als kleines Bild sichtbar.
 * Antippen öffnet die ganze Mindmap; mit zwei Fingern herauszoomen bringt zurück zum Eintrag.
 */
export function DiaryMapCard({ map, onOpen, onDetach, detachLabel, testId = 'diary-entry-map', openTestId }: {
  map: MindMap;
  onOpen: () => void;
  onDetach?: () => void;
  detachLabel?: string;
  testId?: string;
  openTestId?: string;
}) {
  const empty = map.nodes.length === 0;
  return (
    <div className="relative rounded-[var(--radius-md)] border border-[var(--color-border)] overflow-hidden bg-[var(--color-surface)] w-full max-w-[420px]" data-testid={testId}>
      <button type="button" onClick={(e) => { e.stopPropagation(); onOpen(); }} data-no-tap-feedback className="block w-full text-left" data-testid={openTestId}>
        <div className="flex items-center gap-1.5 px-3 py-2 text-[13px] text-[var(--color-primary)] bg-[var(--color-primary-soft)]">
          <Network size={13} /> <span className="truncate">{map.title || 'Mindmap'}</span>
        </div>
        <div style={{ height: 132 }} className="flex items-center justify-center bg-[var(--color-surface-muted)]">
          {empty ? <span className="text-[12.5px] text-[var(--color-text-faint)]">leer</span> : <MindmapDrawing map={map} maxHeight="132px" pad={18} />}
        </div>
      </button>
      {onDetach && (
        <button type="button" onClick={onDetach} aria-label={detachLabel} className="absolute top-0.5 right-0.5 w-9 h-9 flex items-center justify-center rounded-full text-[var(--color-primary)]">
          <X size={15} />
        </button>
      )}
    </div>
  );
}
