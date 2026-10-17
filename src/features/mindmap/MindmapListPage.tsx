import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { PasteSharedButton } from '../../components/shared/PasteSharedModal';
import { useSettings } from '../../state/SettingsContext';
import { MindmapDrawing } from './MindmapScene';
import { mindmapRepo, newMap, type MindMap, type Template } from './mindmapModel';
import { mindmapTexts } from './mindmapTexts';

export function MindmapListPage() {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const T = mindmapTexts(lang);
  const navigate = useNavigate();
  const [maps] = useState<MindMap[]>(() => mindmapRepo.getAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');

  function create(template: Template) {
    const m = newMap(name.trim() || T.untitled, template, lang);
    mindmapRepo.save(m);
    navigate(`/entdecken/mindmap/${m.id}`);
  }
  const date = (iso: string) => new Date(iso).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit' });
  const templates: [Template, string, string][] = [
    ['empty', T.tEmpty, T.tEmptySub],
    ['branches', T.tBranches, T.tBranchesSub],
    ['cluster', T.tCluster, T.tClusterSub],
  ];

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="mindmap" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1" data-testid="mindmap-title">{T.pageTitle}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4" data-hint>{T.listIntro}</p>
        <button type="button" onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-[15px] text-white mb-5" style={{ background: 'var(--color-primary)' }} data-testid="mindmap-new">
          <Plus size={18} /> {T.newMap}
        </button>

        {maps.length === 0 ? (
          <p className="text-[14px] text-[var(--color-text-muted)] text-center py-8" data-testid="mindmap-empty">{T.empty}</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="mindmap-list">
            {maps.map((m) => (
              <button key={m.id} type="button" onClick={() => navigate(`/entdecken/mindmap/${m.id}`)} className="text-left" data-testid={`mindmap-card-${m.id}`}>
                <Card interactive padding="none" className="overflow-hidden">
                  <div style={{ height: 130, background: '#fff' }} aria-hidden="true">
                    {m.nodes.length > 0 ? <MindmapDrawing map={m} maxHeight="130px" /> : <div className="h-full" style={{ background: 'var(--color-surface-muted)' }} />}
                  </div>
                  <div className="p-3">
                    <p className="text-[15px] text-[var(--color-text)] truncate">{m.title || T.untitled}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">
                      {T.elements.replace('{n}', String(m.nodes.length))} · {T.edited.replace('{d}', date(m.updatedAt))}
                    </p>
                  </div>
                </Card>
              </button>
            ))}
          </div>
        )}
        <div className="mt-6">
          <PasteSharedButton />
        </div>
      </div>

      <Modal open={creating} onClose={() => setCreating(false)} title={T.newMap} subtitle={T.templateTitle}>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-[12.5px] text-[var(--color-text-muted)] mb-1" htmlFor="mm-new-name">{T.nameLabel}</label>
            <input id="mm-new-name" value={name} onChange={(e) => setName(e.target.value)} placeholder={T.namePh} data-testid="mindmap-new-name" className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px] outline-none" />
          </div>
          {templates.map(([id, title, sub]) => (
            <button key={id} type="button" onClick={() => create(id)} className="text-left rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] px-4 py-3" data-testid={`mindmap-template-${id}`}>
              <p className="text-[15px] text-[var(--color-text)]">{title}</p>
              <p className="text-[12.5px] text-[var(--color-text-muted)]">{sub}</p>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
