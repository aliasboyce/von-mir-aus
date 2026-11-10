import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Archive, FolderCog, ListChecks, Pin, PinOff, Plus } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { MoreMenu } from '../../components/ui/MoreMenu';
import { useL } from '../projects/useL';
import { CategoryManagerSheet, ListEditSheet } from './ListSheets';
import { ListPhoto } from './ListPhoto';
import { RucksackIcon } from '../safetyPlan/RucksackIcon';
import { LISTS_CHANGED, byPinThenNewest, listCategoriesStore, listsRepo, progress, saveList, type ListCategory, type UserList } from './listsModel';

export function ListsPage() {
  const { L } = useL();
  const navigate = useNavigate();
  const [lists, setLists] = useState<UserList[]>(() => listsRepo.getAll());
  const [creating, setCreating] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [cats, setCats] = useState<ListCategory[]>(() => listCategoriesStore.get());
  const [catFilter, setCatFilter] = useState<string>('all');
  const [manage, setManage] = useState(false);
  useEffect(() => {
    const f = () => { setLists(listsRepo.getAll()); setCats(listCategoriesStore.get()); };
    window.addEventListener(LISTS_CHANGED, f);
    return () => window.removeEventListener(LISTS_CHANGED, f);
  }, []);

  const activeFilter = catFilter === 'all' || catFilter === 'none' || cats.some((c) => c.id === catFilter) ? catFilter : 'all';
  const matches = (l: UserList) => activeFilter === 'all' || (activeFilter === 'none' ? !l.categoryId || !cats.some((c) => c.id === l.categoryId) : l.categoryId === activeFilter);
  const live = lists.filter((l) => !l.archived && matches(l)).sort(byPinThenNewest);
  const pinned = live.filter((l) => l.pinned);
  const rest = live.filter((l) => !l.pinned);
  const archived = lists.filter((l) => l.archived).sort(byPinThenNewest);

  const card = (l: UserList) => {
    const p = progress(l);
    const check = l.kind === 'check';
    return (
      <li key={l.id} className="flex items-stretch rounded-2xl overflow-hidden border" style={{ borderColor: l.color, background: `${l.color}1c` }} data-testid="list-card">
        <button type="button" onClick={() => navigate(`/listen/${l.id}`)} className="flex-1 min-w-0 flex items-center gap-3 text-left py-3 pl-3 min-h-[64px]" data-testid={`list-open-${l.id}`}>
          <span className="w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-[24px]" style={{ background: `${l.color}40` }} aria-hidden>
            {l.photo ? <ListPhoto id={l.photo} className="w-full h-full" /> : l.role === 'rucksack' ? <RucksackIcon size={30} accent={l.color} /> : l.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[16px] text-[var(--color-text)] truncate">{l.title}</span>
            <span className="block text-[12.5px] text-[var(--color-text-muted)]">
              {l.items.length === 0 ? L('Noch leer', 'Empty so far') : check ? L(`${p.done} von ${p.total} erledigt`, `${p.done} of ${p.total} done`) : L(`${p.total} Punkte`, `${p.total} items`)}
            </span>
            {check && p.total > 0 && (
              <span className="block h-1.5 rounded-full mt-1.5 overflow-hidden" style={{ background: 'var(--color-surface-muted)' }} aria-hidden>
                <span className="block h-full rounded-full" style={{ width: `${(p.done / p.total) * 100}%`, background: l.color }} />
              </span>
            )}
          </span>
        </button>
        <button type="button" onClick={() => saveList({ ...l, pinned: !l.pinned })} aria-label={l.pinned ? L('Nicht mehr oben anheften', 'Unpin') : L('Oben anheften', 'Pin to top')} aria-pressed={!!l.pinned} className="w-12 shrink-0 flex items-center justify-center text-[var(--color-text-muted)]" data-testid={`list-pin-${l.id}`}>
          {l.pinned ? <Pin size={18} fill="currentColor" /> : <PinOff size={18} />}
        </button>
      </li>
    );
  };

  return (
    <div className="animate-in" data-testid="lists-page">
      <TopBar action={
        <div className="flex items-center gap-1">
          <HelpButton helpKey="listen" />
          <MoreMenu testId="lists-menu" items={[
            { id: 'archive', label: showArchive ? L('Archiv ausblenden', 'Hide archive') : L('Archiv zeigen', 'Show archive'), hint: L(`${archived.length} archivierte Listen`, `${archived.length} archived lists`), icon: <Archive size={17} />, onClick: () => setShowArchive((v) => !v), checked: showArchive },
          ]} />
        </div>
      } />
      <div className="px-5 pb-10">
        <h1 className="text-[24px] mb-1" data-testid="lists-title">{L('Meine Listen', 'My lists')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4" data-hint>{L('Einkauf, Packliste, Ideen – einfach aufschreiben und abhaken.', 'Shopping, packing, ideas – just write it down and tick it off.')}</p>
        <button type="button" onClick={() => setCreating(true)} className="w-full flex items-center justify-center gap-2 rounded-full py-3 text-[15px] text-white mb-5" style={{ background: 'var(--color-primary)' }} data-testid="list-new">
          <Plus size={18} /> {L('Neue Liste', 'New list')}
        </button>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3" data-testid="lists-categories">
          {cats.length > 0 && (
            <>
              <button type="button" onClick={() => setCatFilter('all')} aria-pressed={activeFilter === 'all'} className="shrink-0 px-3 py-1.5 rounded-full text-[13px] border" style={activeFilter === 'all' ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : { borderColor: 'var(--color-border-strong)' }}>{L('Alle', 'All')}</button>
              {cats.map((c) => (
                <button key={c.id} type="button" onClick={() => setCatFilter(c.id)} aria-pressed={activeFilter === c.id} className="shrink-0 px-3 py-1.5 rounded-full text-[13px] border" style={activeFilter === c.id ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : { borderColor: 'var(--color-border-strong)' }} data-testid="lists-cat-chip">{c.emoji} {c.name}</button>
              ))}
              <button type="button" onClick={() => setCatFilter('none')} aria-pressed={activeFilter === 'none'} className="shrink-0 px-3 py-1.5 rounded-full text-[13px] border" style={activeFilter === 'none' ? { background: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-primary)' } : { borderColor: 'var(--color-border-strong)' }}>{L('Ohne', 'None')}</button>
            </>
          )}
          <button type="button" onClick={() => setManage(true)} className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[13px] text-[var(--color-primary)]" data-testid="lists-manage-cats"><FolderCog size={15} />{cats.length === 0 ? L('Kategorien anlegen', 'Add categories') : L('Kategorien', 'Categories')}</button>
        </div>

        {live.length === 0 && (
          <div className="text-center text-[14px] text-[var(--color-text-muted)] py-8" data-testid="lists-empty">
            <ListChecks size={34} className="mx-auto mb-2 opacity-60" />
            <p>{L('Noch keine Liste. Eine einzige reicht zum Anfangen.', 'No list yet. A single one is enough to begin.')}</p>
          </div>
        )}
        {pinned.length > 0 && (
          <section className="mb-4" data-testid="lists-pinned">
            <h2 className="text-[13px] text-[var(--color-text-muted)] mb-2">{L('Oben angeheftet', 'Pinned')}</h2>
            <ul className="flex flex-col gap-2.5">{pinned.map(card)}</ul>
          </section>
        )}
        {activeFilter === 'all' && cats.length > 0 ? (
          <>
            {[...cats.map((c) => ({ key: c.id, title: `${c.emoji} ${c.name}`, items: rest.filter((l) => l.categoryId === c.id) })), { key: 'none', title: L('Ohne Kategorie', 'No category'), items: rest.filter((l) => !l.categoryId || !cats.some((c) => c.id === l.categoryId)) }]
              .filter((g) => g.items.length > 0)
              .map((g) => (
                <section key={g.key} className="mb-4" data-testid={`lists-cat-${g.key}`}>
                  <h2 className="text-[13px] text-[var(--color-text-muted)] mb-2">{g.title}</h2>
                  <ul className="flex flex-col gap-2.5">{g.items.map(card)}</ul>
                </section>
              ))}
          </>
        ) : rest.length > 0 && (
          <section className="mb-4">
            {pinned.length > 0 && <h2 className="text-[13px] text-[var(--color-text-muted)] mb-2">{L('Weitere Listen', 'More lists')}</h2>}
            <ul className="flex flex-col gap-2.5">{rest.map(card)}</ul>
          </section>
        )}
        {showArchive && (
          <section className="mt-2" data-testid="lists-archive">
            <h2 className="text-[13px] text-[var(--color-text-muted)] mb-2">{L('Archiv', 'Archive')}</h2>
            {archived.length === 0 ? <p className="text-[14px] text-[var(--color-text-muted)]">{L('Nichts im Archiv.', 'Nothing in the archive.')}</p> : <ul className="flex flex-col gap-2.5 opacity-80">{archived.map(card)}</ul>}
          </section>
        )}
      </div>
      {manage && <CategoryManagerSheet onClose={() => setManage(false)} />}
      {creating && <ListEditSheet onClose={() => setCreating(false)} onSave={(l) => { const s = saveList(l); setCreating(false); navigate(`/listen/${s.id}`); }} />}
    </div>
  );
}
