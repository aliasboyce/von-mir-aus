import { Check, Network } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { mindmapRepo } from '../mindmap/mindmapModel';

/** pick the mindmaps that belong to a diary entry */
export function MindmapPickerModal({ open, onClose, selected, onChange }: { open: boolean; onClose: () => void; selected: string[]; onChange: (ids: string[]) => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const maps = open ? mindmapRepo.getAll().filter((m) => !m.archived).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
  const T = en
    ? { title: 'Connect a mind map', sub: 'Tap the ones that belong to this entry. From the entry you can open them with one tap and come back with one tap.', none: 'You have no mind map yet. You can create one under Discover → Mind map and connect it here afterwards.', untitled: 'Mind map without a name', done: 'Done' }
    : { title: 'Mindmap verbinden', sub: 'Tippe die an, die zu diesem Eintrag gehören. Im Eintrag öffnest du sie mit einem Tipp und kommst mit einem Tipp zurück.', none: 'Du hast noch keine Mindmap. Unter Entdecken → Mindmap kannst du eine anlegen und sie danach hier verbinden.', untitled: 'Mindmap ohne Namen', done: 'Fertig' };
  return (
    <Modal open={open} onClose={onClose} title={T.title}>
      <div className="flex flex-col gap-2" data-testid="mindmap-picker">
        <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{T.sub}</p>
        {maps.length === 0 && <p className="text-[13.5px] text-[var(--color-text)]" data-testid="mindmap-picker-none">{T.none}</p>}
        {maps.map((m) => {
          const on = selected.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange(on ? selected.filter((x) => x !== m.id) : [...selected, m.id])}
              aria-pressed={on}
              className={`flex items-center gap-3 text-left px-3 py-3 rounded-[var(--radius-md)] border ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`}
              data-testid={`mindmap-pick-${m.id}`}
            >
              <Network size={18} className="text-[var(--color-primary)] flex-shrink-0" />
              <span className="flex-1 text-[14.5px]">{m.title || T.untitled}</span>
              {on && <Check size={18} className="text-[var(--color-primary)]" />}
            </button>
          );
        })}
        <Button fullWidth onClick={onClose} data-testid="mindmap-picker-done">{T.done}</Button>
      </div>
    </Modal>
  );
}
