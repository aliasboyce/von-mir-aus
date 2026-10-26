import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Plus, X } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { mindmapRepo } from '../../mindmap/mindmapModel';
import { diaryCategoriesStore, DIARY_DEFAULT_CATEGORY_ID, DIARY_DEFAULT_CATEGORY_LABEL } from '../../diary/diaryCategories';
import { routinesRepo } from '../../routines/routinesRepo';
import { resourcesRepo } from '../../resources/resourcesRepo';
import { networkRepo } from '../../safetyNet/networkRepo';
import { projectsRepo, type LinksBlock } from '../projectModel';
import { AddRow, Empty, SmallLabel, type BlockProps } from '../ui';

type Kind = 'mindmaps' | 'categories' | 'routines' | 'resources' | 'people' | 'projects';
interface Opt { id: string; label: string; to: string }

/** Verknüpfungen mit Dingen aus der App – ein Tipp öffnet sie */
export function BlockLinks({ block, project, L, onChange }: BlockProps<LinksBlock>) {
  const navigate = useNavigate();
  const [picking, setPicking] = useState<Kind | null>(null);

  const options = (k: Kind): Opt[] => {
    switch (k) {
      case 'mindmaps': return mindmapRepo.getAll().filter((m) => !m.archived).map((m) => ({ id: m.id, label: `${m.kind === '3d' ? '🧊 ' : '🕸️ '}${m.title || L('Mindmap ohne Namen', 'Mind map without a name')}`, to: `/entdecken/mindmap/${m.id}` }));
      case 'categories': return [{ id: DIARY_DEFAULT_CATEGORY_ID, label: `📓 ${DIARY_DEFAULT_CATEGORY_LABEL}`, to: `/sicherheit/tagebuch?cat=${DIARY_DEFAULT_CATEGORY_ID}` }, ...diaryCategoriesStore.getAll().map((c) => ({ id: c.id, label: `📓 ${c.label}`, to: `/sicherheit/tagebuch?cat=${c.id}` }))];
      case 'routines': return routinesRepo.getAll().map((r) => ({ id: r.id, label: `🌱 ${r.title || L('Routine', 'Routine')}`, to: `/entdecken/routinen/${r.id}/bearbeiten` }));
      case 'resources': return resourcesRepo.getAll().map((r) => ({ id: r.id, label: `🧰 ${r.title}`, to: `/entdecken/ressourcen?open=${r.id}` }));
      case 'people': return networkRepo.getAll().map((n) => ({ id: n.id, label: `🤝 ${n.name}`, to: '/sicherheit/netzwerk' }));
      case 'projects': return projectsRepo.getAll().filter((p) => p.id !== project.id && !p.archived).map((p) => ({ id: p.id, label: `${p.emoji} ${p.title}`, to: `/entdecken/projekte/${p.id}` }));
    }
  };
  const titles: Record<Kind, string> = {
    mindmaps: L('Mindmaps', 'Mind maps'), categories: L('Tagebuch-Bücher', 'Diary books'), routines: L('Routinen', 'Routines'),
    resources: L('Ressourcen', 'Resources'), people: L('Menschen', 'People'), projects: L('Andere Projekte', 'Other projects'),
  };
  const kinds: Kind[] = ['mindmaps', 'categories', 'routines', 'resources', 'people', 'projects'];
  const toggle = (k: Kind, id: string) => onChange({ ...block, [k]: block[k].includes(id) ? block[k].filter((x) => x !== id) : [...block[k], id] });
  const total = kinds.reduce((n, k) => n + block[k].length, 0) + block.places.length;

  return (
    <div data-testid="links">
      {total === 0 && <Empty>{L('Hier bündelst du, was zum Projekt gehört. Ein Tipp öffnet es, mit „zurück“ bist du wieder hier.', 'Collect here what belongs to the project. One tap opens it, “back” brings you here.')}</Empty>}
      {kinds.map((k) => {
        const opts = options(k);
        const linked = block[k];
        return (
          <div key={k} className="mb-3" data-testid={`links-${k}`}>
            <SmallLabel>{titles[k]}</SmallLabel>
            <div className="flex flex-wrap gap-1.5 items-center">
              {linked.map((id) => {
                const o = opts.find((x) => x.id === id);
                if (!o) return null;
                return (
                  <span key={id} className="inline-flex items-center rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] text-[13px]">
                    <button type="button" onClick={() => navigate(o.to)} className="pl-3 pr-1 py-1.5" data-testid={`link-open-${k}-${id}`}>{o.label}</button>
                    <button type="button" onClick={() => toggle(k, id)} aria-label={L('Verbindung lösen', 'Remove connection')} className="px-2 py-1.5 opacity-70"><X size={12} /></button>
                  </span>
                );
              })}
              <button type="button" onClick={() => setPicking(k)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid={`links-add-${k}`}><Plus size={13} />{L('Verbinden', 'Connect')}</button>
            </div>
          </div>
        );
      })}
      <div className="mb-1">
        <SmallLabel>{L('Orte', 'Places')}</SmallLabel>
        <div className="flex flex-wrap gap-1.5">
          {block.places.map((p, i) => (
            <span key={`${p}-${i}`} className="inline-flex items-center rounded-full bg-[var(--color-surface-muted)] text-[13px]">
              <span className="pl-3 pr-1 py-1.5">📍 {p}</span>
              <button type="button" onClick={() => onChange({ ...block, places: block.places.filter((_, j) => j !== i) })} aria-label={L('Entfernen', 'Remove')} className="px-2 py-1.5 opacity-70"><X size={12} /></button>
            </span>
          ))}
        </div>
        <AddRow placeholder={L('Ort hinzufügen …', 'Add a place …')} onAdd={(t) => onChange({ ...block, places: [...block.places, t] })} testId="place-new" />
      </div>

      <Modal open={!!picking} onClose={() => setPicking(null)} title={picking ? titles[picking] : ''} subtitle={L('Tippe an, was zum Projekt gehört.', 'Tap what belongs to the project.')}>
        {picking && (
          <div className="flex flex-col gap-2" data-testid="links-picker">
            {options(picking).length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Hier gibt es noch nichts zum Verbinden.', 'Nothing to connect here yet.')}</p>}
            {options(picking).map((o) => {
              const on = block[picking].includes(o.id);
              return (
                <button key={o.id} type="button" onClick={() => toggle(picking, o.id)} aria-pressed={on} className={`flex items-center gap-2 text-left px-3 py-3 rounded-[var(--radius-md)] border ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)] bg-[var(--color-surface)]'}`} data-testid={`link-pick-${picking}-${o.id}`}>
                  <span className="flex-1 text-[14.5px]">{o.label}</span>{on && <Check size={18} className="text-[var(--color-primary)]" />}
                </button>
              );
            })}
            <Button fullWidth onClick={() => setPicking(null)}>{L('Fertig', 'Done')}</Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
