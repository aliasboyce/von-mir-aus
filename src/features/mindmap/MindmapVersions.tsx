import { useMemo, useState } from 'react';
import { Copy, History, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { MindmapDrawing } from './MindmapScene';
import { deleteVersion, versionsOf, type MapVersion } from './mindmapVersions';

const fmtAt = (iso: string, lang: 'de' | 'en') => new Date(iso).toLocaleString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/** earlier states of this map: look at them, bring one back, open one as a copy, or keep the current state */
export function VersionsModal({
  open,
  onClose,
  mapId,
  lang,
  onSave,
  onRestore,
  onCopy,
}: {
  open: boolean;
  onClose: () => void;
  mapId: string;
  lang: 'de' | 'en';
  onSave: (name: string) => boolean;
  onRestore: (v: MapVersion) => void;
  onCopy: (v: MapVersion) => void;
}) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [tick, setTick] = useState(0);
  const [pick, setPick] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const list = useMemo(() => (open ? versionsOf(mapId) : []), [open, mapId, tick]);
  const cur = list.find((v) => v.id === pick);
  return (
    <Modal open={open} onClose={() => { setPick(null); setMsg(''); onClose(); }} title={L('Frühere Zustände', 'Earlier states')}>
      <div className="flex flex-col gap-3" data-testid="mm-versions">
        <p className="text-[12.5px] text-[var(--color-text-muted)]">{L('Die Mindmap hält beim Verlassen automatisch einen Zustand fest. Du kannst jederzeit auch selbst einen festhalten – zum Beispiel bevor du etwas Großes änderst. Zurückholen geht nie verloren: der jetzige Stand wird vorher gesichert.', 'The map keeps a state automatically when you leave it. You can also keep one yourself any time – e.g. before a big change. Bringing one back never loses anything: the current state is saved first.')}</p>
        <div className="flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder={L('Name (optional), z. B. „vor dem Umbau“', 'Name (optional), e.g. “before the rebuild”')} className="flex-1 min-w-0 h-11 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[14px]" data-testid="mm-version-name" />
          <button type="button" onClick={() => { const ok = onSave(name.trim()); setName(''); setTick((t) => t + 1); setMsg(ok ? L('Festgehalten.', 'Kept.') : L('Das ging nicht – der Speicher ist voll.', 'That did not work – storage is full.')); }} className="px-4 h-11 rounded-full text-[14px] text-white inline-flex items-center gap-1.5 shrink-0" style={{ background: 'var(--color-primary)' }} data-testid="mm-version-save"><Save size={15} /> {L('Festhalten', 'Keep')}</button>
        </div>
        {msg && <p className="text-[13px]" style={{ color: 'var(--color-primary)' }} role="status" data-testid="mm-version-msg">{msg}</p>}

        {list.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]" data-testid="mm-version-none">{L('Noch kein früherer Zustand festgehalten.', 'No earlier state kept yet.')}</p>}
        <div className="flex flex-col gap-1.5 max-h-[34vh] overflow-y-auto">
          {list.map((v) => (
            <button key={v.id} type="button" onClick={() => setPick(v.id === pick ? null : v.id)} className={`flex items-center gap-3 text-left rounded-[var(--radius-md)] px-3 py-2 border ${v.id === pick ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'}`} data-testid="mm-version-row">
              <History size={16} className="text-[var(--color-text-faint)] shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] text-[var(--color-text)] truncate">{v.name || fmtAt(v.at, lang)}</span>
                <span className="block text-[11.5px] text-[var(--color-text-faint)]">{fmtAt(v.at, lang)} · {v.kind === 'manual' ? L('von dir', 'by you') : L('automatisch', 'automatic')} · {v.map.nodes.length} {L('Elemente', 'elements')}</span>
              </span>
            </button>
          ))}
        </div>

        {cur && (
          <div className="flex flex-col gap-2" data-testid="mm-version-view">
            <div className="rounded-[var(--radius-md)] overflow-hidden border border-[var(--color-border)]" style={{ maxHeight: '30vh' }}>
              {cur.map.nodes.length ? <MindmapDrawing map={cur.map} maxHeight="30vh" testId="mm-version-preview" /> : <p className="p-6 text-center text-[13px] text-[var(--color-text-faint)]">{L('Leer', 'Empty')}</p>}
            </div>
            <div className="flex gap-2 flex-wrap">
              <button type="button" onClick={() => { onRestore(cur); setPick(null); setTick((t) => t + 1); onClose(); }} className="px-4 py-2.5 rounded-full text-[14px] text-white inline-flex items-center gap-1.5" style={{ background: 'var(--color-primary)' }} data-testid="mm-version-restore"><RotateCcw size={15} /> {L('Diesen Zustand zurückholen', 'Bring this state back')}</button>
              <button type="button" onClick={() => { onCopy(cur); }} className="px-4 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)] inline-flex items-center gap-1.5" data-testid="mm-version-copy"><Copy size={15} /> {L('Als Kopie öffnen', 'Open as a copy')}</button>
              <button type="button" onClick={() => { deleteVersion(cur.id); setPick(null); setTick((t) => t + 1); }} className="px-4 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-danger)] inline-flex items-center gap-1.5" data-testid="mm-version-delete"><Trash2 size={15} /> {L('Löschen', 'Delete')}</button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
