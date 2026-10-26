import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { mindmapRepo, type MindMap } from '../mindmap/mindmapModel';
import { useL } from '../projects/useL';
import { convertTo3d, type ConvertMode } from './convertTo3d';

/** „In 3D umwandeln“: legt eine Kopie als 3D-Raum an, das Original bleibt unberührt. */
export function ConvertTo3dModal({ map, onClose, beforeNavigate }: { map: MindMap | null; onClose(): void; beforeNavigate?: () => void }) {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const go = (mode: ConvertMode) => {
    if (!map) return;
    const { map: copy, skipped } = convertTo3d(map, mode, lang);
    if (!mindmapRepo.trySave(copy)) {
      window.alert(L('Die Kopie ließ sich nicht speichern – der Speicher dieses Geräts ist voll.', 'The copy could not be saved – this device’s storage is full.'));
      return;
    }
    beforeNavigate?.();
    onClose();
    navigate(`/entdecken/mindmap/${copy.id}`, { state: skipped ? { converted: skipped } : undefined });
  };
  const card = 'text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[var(--color-text)]';
  return (
    <Modal open={!!map} onClose={onClose} title={L('In 3D umwandeln', 'Turn into 3D')} subtitle={map?.title || undefined}>
      <div className="flex flex-col gap-2" data-testid="convert3d-sheet">
        <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Es entsteht eine Kopie als 3D-Raum. Deine Mindmap auf der Fläche bleibt genau, wie sie ist.', 'A copy is made as a 3D space. Your flat mind map stays exactly as it is.')}</p>
        <button type="button" className={card} onClick={() => go('levels')} data-testid="convert3d-levels">
          <span className="block text-[14.5px]">🧊 {L('Auf Ebenen verteilen', 'Spread over layers')}</span>
          <span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Das Hauptthema unten, jede weitere Stufe eine Ebene höher.', 'The main topic at the bottom, every further step one layer higher.')}</span>
        </button>
        <button type="button" className={card} onClick={() => go('flat')} data-testid="convert3d-flat">
          <span className="block text-[14.5px]">▭ {L('Alles auf einer Ebene', 'Everything on one layer')}</span>
          <span className="block text-[12.5px] text-[var(--color-text-muted)]">{L('Genau wie auf der Fläche, nur als Raum – später lässt sich alles verschieben.', 'Just like the flat map, but as a space – you can move things around later.')}</span>
        </button>
        <button type="button" className="text-[13.5px] text-[var(--color-text-muted)] py-2" onClick={onClose}>{L('Abbrechen', 'Cancel')}</button>
      </div>
    </Modal>
  );
}
