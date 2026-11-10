import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Plus, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { useL } from '../projects/useL';
import { LISTS_CHANGED, attachList, detachList, linksFor, listsRepo, newList, saveList, type ListLinkKind, type UserList } from './listsModel';

/**
 * „Listen dazu“: hängt eine oder mehrere der eigenen Listen an eine Brücke, Ressource, Routine, ein Projekt oder einen Kontakt –
 * z. B. die Packliste zur Brücke „Ausflug“. Die Liste bleibt ganz normal unter „Meine Listen“, hier ist sie nur verknüpft.
 */
export function AttachedLists({ kind, refId, contextTitle }: { kind: ListLinkKind; refId: string; contextTitle?: string }) {
  const { L } = useL();
  const [lists, setLists] = useState<UserList[]>([]);
  const [ids, setIds] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [fresh, setFresh] = useState('');

  useEffect(() => {
    const f = () => {
      const all = listsRepo.getAll();
      setLists(all);
      setIds(linksFor(kind, refId).map((x) => x.listId).filter((id) => all.some((l) => l.id === id)));
    };
    f();
    window.addEventListener(LISTS_CHANGED, f);
    return () => window.removeEventListener(LISTS_CHANGED, f);
  }, [kind, refId]);

  const linked = ids.map((id) => lists.find((l) => l.id === id)).filter((l): l is UserList => !!l);
  const choices = lists.filter((l) => !l.archived && !ids.includes(l.id));

  const createAndAttach = () => {
    if (!fresh.trim()) return;
    const l = saveList(newList({ title: fresh.trim(), emoji: '📝' }));
    attachList(l.id, kind, refId);
    setFresh('');
    setOpen(false);
  };

  return (
    <section className="my-4" data-testid={`attached-lists-${kind}`}>
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <h3 className="text-[13px] text-[var(--color-text-muted)] flex items-center gap-1.5"><ListChecks size={15} />{L('Listen dazu', 'Lists for this')}</h3>
        <button type="button" onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-[13px] text-[var(--color-primary)] py-1" data-testid="attach-list-open">
          <Plus size={14} />{L('Liste dazu', 'Add a list')}
        </button>
      </div>
      {linked.length === 0 ? (
        <p className="text-[12.5px] text-[var(--color-text-faint)]">{L('Keine. Z. B. eine Packliste oder Einkaufsliste dazu – freiwillig.', 'None. E.g. a packing or shopping list – optional.')}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {linked.map((l) => (
            <li key={l.id} className="inline-flex items-center rounded-full border text-[13px]" style={{ borderColor: l.color, background: `${l.color}1c` }}>
              <Link to={`/listen/${l.id}`} className="pl-3 pr-2 py-1.5 text-[var(--color-text)]" data-testid="attached-list-link">
                {l.emoji} {l.title}
                {l.kind === 'check' && l.items.length > 0 && <span className="text-[var(--color-text-faint)]"> · {l.items.filter((i) => i.done).length}/{l.items.length}</span>}
              </Link>
              <button type="button" onClick={() => detachList(l.id, kind, refId)} className="w-8 h-8 flex items-center justify-center text-[var(--color-text-faint)]" aria-label={L('Verknüpfung lösen (die Liste bleibt)', 'Detach (the list stays)')} data-testid="attached-list-detach">
                <X size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && (
        <Modal open onClose={() => setOpen(false)} title={L('Liste dazu', 'Add a list')}>
          <div className="flex flex-col gap-3" data-testid="attach-list-sheet">
            {choices.length > 0 && (
              <ul className="flex flex-col gap-1.5 max-h-[40vh] overflow-y-auto">
                {choices.map((l) => (
                  <li key={l.id}>
                    <button type="button" onClick={() => { attachList(l.id, kind, refId); setOpen(false); }} className="w-full text-left rounded-xl border px-3 py-2.5 text-[14.5px] min-h-[46px]" style={{ borderColor: l.color, background: `${l.color}14` }} data-testid="attach-list-pick">
                      {l.emoji} {l.title}
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={(e) => { e.preventDefault(); createAndAttach(); }} className="flex gap-2">
              <input className="input flex-1" value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder={contextTitle ? L(`Neue Liste für „${contextTitle}“ …`, `New list for “${contextTitle}” …`) : L('Neue Liste …', 'New list …')} data-testid="attach-list-new-input" />
              <button type="submit" disabled={!fresh.trim()} className="px-4 rounded-full text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="attach-list-new">{L('Anlegen', 'Create')}</button>
            </form>
          </div>
        </Modal>
      )}
    </section>
  );
}

