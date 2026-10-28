import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Archive, ArchiveRestore, Check, Copy, Eye, EyeOff, Pencil, Pin, PinOff, Plus, RotateCcw, StickyNote } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { MoreMenu } from '../../components/ui/MoreMenu';
import { deleteOwnMedia } from '../../services/mediaStore';
import { useToast } from '../budget/budgetUi';
import { useL } from '../projects/useL';
import { CopySheet, ItemSheet, ListEditSheet } from './ListSheets';
import { ListPhoto } from './ListPhoto';
import { LISTS_CHANGED, copyItemTo, listsRepo, newItem, newList, progress, removeList, saveList, type ListItem, type UserList } from './listsModel';

export function ListDetailPage() {
  const { id = '' } = useParams();
  const { L } = useL();
  const navigate = useNavigate();
  const [list, setList] = useState<UserList | undefined>(() => listsRepo.getById(id));
  const [fresh, setFresh] = useState('');
  const [edit, setEdit] = useState(false);
  const [itemId, setItemId] = useState<string | null>(null);
  const [copyId, setCopyId] = useState<string | null>(null);
  const [toast, say] = useToast();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const f = () => setList(listsRepo.getById(id));
    window.addEventListener(LISTS_CHANGED, f);
    return () => window.removeEventListener(LISTS_CHANGED, f);
  }, [id]);

  if (!list) {
    return (
      <div className="animate-in">
        <TopBar />
        <div className="px-5 py-10 text-center text-[var(--color-text-muted)]" data-testid="list-missing">
          <p className="mb-4">{L('Diese Liste gibt es nicht (mehr).', 'This list does not exist (any more).')}</p>
          <button type="button" onClick={() => navigate('/listen')} className="h-11 px-5 rounded-full border border-[var(--color-border-strong)]">{L('Zu meinen Listen', 'To my lists')}</button>
        </div>
      </div>
    );
  }

  const check = list.kind === 'check';
  const put = (next: UserList) => setList(saveList(next));
  const setItems = (items: ListItem[]) => put({ ...list, items });
  const patch = (iid: string, f: (i: ListItem) => ListItem) => setItems(list.items.map((i) => (i.id === iid ? f(i) : i)));
  const add = () => {
    if (!fresh.trim()) return;
    setItems([...list.items, newItem(fresh)]);
    setFresh('');
    input.current?.focus();
  };
  const toggle = (i: ListItem) => patch(i.id, (x) => ({ ...x, done: !x.done }));
  const toggleSub = (i: ListItem, sid: string) => patch(i.id, (x) => ({ ...x, sub: x.sub.map((s) => (s.id === sid ? { ...s, done: !s.done } : s)) }));

  const p = progress(list);
  const shown = list.hideDone ? list.items.filter((i) => !i.done) : list.items;
  const hidden = list.items.length - shown.length;
  const itemOpen = list.items.find((i) => i.id === itemId);
  const itemCopy = list.items.find((i) => i.id === copyId);

  const doCopy = (target: UserList, move: boolean, it: ListItem) => {
    const { list: next, result } = copyItemTo(it, target);
    if (result !== 'exists') listsRepo.save({ ...next, updatedAt: new Date().toISOString() });
    if (move && result !== 'exists') put({ ...list, items: list.items.filter((x) => x.id !== it.id) });
    else window.dispatchEvent(new Event(LISTS_CHANGED));
    setCopyId(null);
    say(
      result === 'exists' ? L(`„${it.text}“ steht auf „${target.title}“ schon.`, `“${it.text}” is already on “${target.title}”.`)
        : result === 'reopened' ? L(`„${it.text}“ ist auf „${target.title}“ wieder offen.`, `“${it.text}” is open again on “${target.title}”.`)
          : move ? L(`„${it.text}“ ist jetzt auf „${target.title}“.`, `“${it.text}” is now on “${target.title}”.`)
            : L(`„${it.text}“ ist jetzt auch auf „${target.title}“.`, `“${it.text}” is now also on “${target.title}”.`),
    );
  };

  return (
    <div className="animate-in" data-testid="list-detail">
      <TopBar action={
        <div className="flex items-center gap-1">
          <HelpButton helpKey="listen" />
          <MoreMenu testId="list-menu" items={[
            { id: 'edit', label: L('Titel, Farbe, Symbol, Foto …', 'Title, colour, symbol, photo …'), icon: <Pencil size={17} />, onClick: () => setEdit(true) },
            { id: 'pin', label: list.pinned ? L('Nicht mehr oben anheften', 'Unpin') : L('Oben anheften', 'Pin to top'), icon: list.pinned ? <PinOff size={17} /> : <Pin size={17} />, onClick: () => put({ ...list, pinned: !list.pinned }) },
            ...(check ? [
              { id: 'hide', label: L('Erledigtes ausblenden', 'Hide done items'), icon: list.hideDone ? <Eye size={17} /> : <EyeOff size={17} />, checked: !!list.hideDone, onClick: () => put({ ...list, hideDone: !list.hideDone }) },
              { id: 'reset', label: L('Alle Haken entfernen', 'Clear all ticks'), hint: L('Die Liste bleibt, nur die Haken gehen – gut für Wiederkehrendes', 'The list stays, only the ticks go – good for repeating things'), icon: <RotateCcw size={17} />, onClick: () => { const before = list; put({ ...list, items: list.items.map((i) => ({ ...i, done: false, sub: i.sub.map((s) => ({ ...s, done: false })) })) }); say(L('Alle Haken entfernt.', 'All ticks cleared.'), { label: L('Zurück', 'Undo'), run: () => put(before) }); } },
            ] : []),
            { id: 'dup', label: L('Liste doppeln', 'Duplicate list'), icon: <Copy size={17} />, onClick: () => { const c = newList({ ...list, title: `${list.title} ${L('(Kopie)', '(copy)')}`, pinned: false, archived: false, photo: undefined, items: list.items.map((i) => newItem(i.text, { note: i.note, sub: i.sub.map((s) => ({ ...s, id: `${s.id}_c${Math.random().toString(36).slice(2, 5)}`, done: false })) })) }); saveList(c); say(L('Kopie angelegt.', 'Copy created.'), { label: L('Öffnen', 'Open'), run: () => navigate(`/listen/${c.id}`) }); } },
            { id: 'archive', label: list.archived ? L('Aus dem Archiv holen', 'Restore from archive') : L('Archivieren', 'Archive'), hint: list.archived ? undefined : L('Verschwindet von der Übersicht, nichts geht verloren', 'Leaves the overview, nothing is lost'), icon: list.archived ? <ArchiveRestore size={17} /> : <Archive size={17} />, divider: true, onClick: () => { put({ ...list, archived: !list.archived, pinned: list.archived ? list.pinned : false }); if (!list.archived) navigate('/listen'); } },
          ]} />
        </div>
      } />
      <div className="px-5 pb-28">
        {list.photo && <ListPhoto id={list.photo} className="w-full h-32 rounded-2xl mb-3" />}
        <div className="flex items-center gap-3 mb-1">
          <span className="w-11 h-11 rounded-xl flex items-center justify-center text-[24px] shrink-0" style={{ background: `${list.color}40`, border: `1.5px solid ${list.color}` }} aria-hidden>{list.emoji}</span>
          <div className="min-w-0 flex-1">
            <h1 className="text-[22px] leading-tight break-words" data-testid="list-heading">{list.title}</h1>
            <p className="text-[12.5px] text-[var(--color-text-muted)]" data-testid="list-progress">
              {list.archived ? L('Archiviert · ', 'Archived · ') : ''}
              {list.items.length === 0 ? L('Noch leer', 'Empty so far') : check ? L(`${p.done} von ${p.total} erledigt`, `${p.done} of ${p.total} done`) : L(`${p.total} Punkte`, `${p.total} items`)}
            </p>
          </div>
        </div>
        {list.note && <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-wrap my-3 flex gap-2"><StickyNote size={15} className="shrink-0 mt-1" />{list.note}</p>}

        <form className="flex gap-2 my-4" onSubmit={(e) => { e.preventDefault(); add(); }}>
          <input ref={input} className="input flex-1" value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder={L('Neuer Punkt …', 'New item …')} enterKeyHint="done" data-testid="list-add-input" />
          <button type="submit" disabled={!fresh.trim()} className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} aria-label={L('Hinzufügen', 'Add')} data-testid="list-add">
            <Plus size={22} />
          </button>
        </form>

        <ul className="flex flex-col gap-1.5" data-testid="list-items">
          {shown.map((i) => (
            <li key={i.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" data-testid="list-item" data-done={i.done ? '1' : '0'}>
              <div className="flex items-start">
                {check ? (
                  <button type="button" onClick={() => toggle(i)} className="w-12 min-h-[48px] shrink-0 flex items-center justify-center" aria-label={i.done ? L('Wieder öffnen', 'Reopen') : L('Abhaken', 'Tick off')} aria-pressed={i.done} data-testid="list-check">
                    <span className="w-[26px] h-[26px] rounded-lg border-2 flex items-center justify-center transition-colors" style={{ borderColor: i.done ? list.color : 'var(--color-border-strong)', background: i.done ? list.color : 'transparent' }}>{i.done && <Check size={16} color="#fff" strokeWidth={3} />}</span>
                  </button>
                ) : (
                  <span className="w-9 min-h-[48px] shrink-0 flex items-center justify-end pr-1 text-[22px] leading-none" style={{ color: list.color }} aria-hidden>•</span>
                )}
                <button type="button" onClick={() => setItemId(i.id)} className="flex-1 min-w-0 text-left py-3 pr-1" data-testid="list-item-open">
                  <span className="block text-[15.5px] leading-snug break-words" style={{ color: i.done ? 'var(--color-text-faint)' : 'var(--color-text)', textDecoration: i.done ? 'line-through' : 'none' }}>{i.text}</span>
                  {i.note && <span className="block text-[12.5px] text-[var(--color-text-muted)] mt-0.5 whitespace-pre-wrap" style={i.done ? { opacity: 0.6 } : undefined}>{i.note}</span>}
                </button>
                <button type="button" onClick={() => setCopyId(i.id)} className="w-11 h-12 shrink-0 flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('In eine andere Liste legen', 'Put on another list')} title={L('Auch auf eine andere Liste', 'Also on another list')} data-testid="list-item-to-other">
                  <Copy size={17} />
                </button>
              </div>
              {i.sub.length > 0 && (
                <ul className="pb-2 pl-12 pr-3 flex flex-col">
                  {i.sub.map((s) => (
                    <li key={s.id} className="flex items-center" data-testid="list-sub" data-done={s.done ? '1' : '0'}>
                      {check ? (
                        <button type="button" onClick={() => toggleSub(i, s.id)} className="w-10 h-10 shrink-0 flex items-center justify-center -ml-2" aria-label={s.done ? L('Wieder öffnen', 'Reopen') : L('Abhaken', 'Tick off')} aria-pressed={s.done} data-testid="list-sub-check">
                          <span className="w-[20px] h-[20px] rounded-md border-2 flex items-center justify-center" style={{ borderColor: s.done ? list.color : 'var(--color-border-strong)', background: s.done ? list.color : 'transparent' }}>{s.done && <Check size={13} color="#fff" strokeWidth={3} />}</span>
                        </button>
                      ) : <span className="w-4 shrink-0" style={{ color: list.color }} aria-hidden>–</span>}
                      <span className="text-[14px] leading-snug py-1.5" style={{ color: s.done ? 'var(--color-text-faint)' : 'var(--color-text-muted)', textDecoration: s.done ? 'line-through' : 'none' }}>{s.text}</span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
        {hidden > 0 && (
          <button type="button" onClick={() => put({ ...list, hideDone: false })} className="mt-3 text-[13px] text-[var(--color-text-muted)] underline underline-offset-2" data-testid="list-hidden-info">
            {L(`${hidden} erledigte ausgeblendet – zeigen`, `${hidden} done hidden – show`)}
          </button>
        )}
        {list.items.length === 0 && <p className="text-center text-[14px] text-[var(--color-text-muted)] py-8" data-testid="list-empty">{L('Noch nichts drauf. Schreib oben den ersten Punkt hin.', 'Nothing on it yet. Write the first item above.')}</p>}
      </div>

      {edit && (
        <ListEditSheet
          initial={list}
          onClose={() => setEdit(false)}
          onSave={(l) => { if (list.photo && list.photo !== l.photo) void deleteOwnMedia(list.photo); put(l); setEdit(false); }}
          onDelete={() => { if (list.photo) void deleteOwnMedia(list.photo); removeList(list); navigate('/listen', { replace: true }); }}
        />
      )}
      {itemOpen && (
        <ItemSheet
          key={itemOpen.id}
          item={itemOpen}
          kind={list.kind}
          canUp={list.items[0]?.id !== itemOpen.id}
          canDown={list.items[list.items.length - 1]?.id !== itemOpen.id}
          onSave={(n) => { patch(n.id, () => n); setItemId(null); }}
          onDelete={() => { const gone = itemOpen; const before = list; setItems(list.items.filter((x) => x.id !== gone.id)); setItemId(null); say(L('Punkt gelöscht.', 'Item deleted.'), { label: L('Zurück', 'Undo'), run: () => put(before) }); }}
          onMove={(d) => {
            const idx = list.items.findIndex((x) => x.id === itemOpen.id);
            const to = idx + d;
            if (to < 0 || to >= list.items.length) return;
            const arr = [...list.items];
            [arr[idx], arr[to]] = [arr[to], arr[idx]];
            setItems(arr);
          }}
          onCopy={() => { setCopyId(itemOpen.id); setItemId(null); }}
        />
      )}
      {itemCopy && (
        <CopySheet
          item={itemCopy}
          lists={listsRepo.getAll()}
          fromId={list.id}
          onClose={() => setCopyId(null)}
          onPick={(t, move) => doCopy(t, move, itemCopy)}
          onNew={(title, move) => { const t = saveList(newList({ title, kind: list.kind, color: list.color })); doCopy(t, move, itemCopy); }}
        />
      )}
      {toast}
    </div>
  );
}
