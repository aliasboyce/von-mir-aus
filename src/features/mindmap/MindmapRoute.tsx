import { lazy, Suspense, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { mindmapRepo } from './mindmapModel';
import { MindmapEditorPage } from './MindmapEditorPage';

// three.js steckt nur in diesem Teil – wer keine 3D-Mindmap öffnet, lädt ihn nie
const Mindmap3DPage = lazy(() => import('../mindmap3d/Mindmap3DPage'));

/** Wählt den Editor: Fläche (gewohnt) oder 3D-Raum. */
export function MindmapRoute() {
  const { id } = useParams();
  const map = useMemo(() => (id ? mindmapRepo.getById(id) : undefined), [id]);
  if (map?.kind === '3d') {
    return (
      <Suspense fallback={<div className="fixed inset-0 z-[150] flex items-center justify-center text-[14px] text-[var(--color-text-muted)]" style={{ background: 'var(--color-bg)' }}>…</div>}>
        <Mindmap3DPage key={map.id} initial={map} />
      </Suspense>
    );
  }
  return <MindmapEditorPage />;
}
