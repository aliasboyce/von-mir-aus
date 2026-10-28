import { useState } from 'react';
import { ArrowDown, ArrowUp, Check, Copy, MoveRight, Plus, X } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { PhotoField, DeleteButton, ghostBtn, primaryBtn, pill } from '../budget/budgetUi';
import { useL } from '../projects/useL';
import { LIST_COLORS, LIST_EMOJIS, itemId, newList, type ListItem, type ListKind, type UserList } from './listsModel';

const lbl = 'block text-[12.5px] text-[var(--color-text-muted)] mb-1';

const STARTERS: { de: string; en: string; emoji: string; kind: ListKind }[] = [
  { de: 'Einkauf', en: 'Shopping', emoji: '🛒', kind: 'check' },
  { de: 'Packliste', en: 'Packing list', emoji: '🎒', kind: 'check' },
  { de: 'Ideen', en: 'Ideas', emoji: '💡', kind: 'bullets' },
  { de: 'Merken', en: 'To remember', emoji: '📌', kind: 'bullets' },
];

/** Neue Liste / Liste ändern: Titel, Art, Symbol, Farbe, Foto, Notiz */
export function ListEditSheet({ initial, onClose, onSave, onDelete }: { initial?: UserList; onClose: () => void; onSave: (l: UserList) => void; onDelete?: () => void }) {
  const { L } = useL();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [kind, setKind] = useState<ListKind>(initial?.kind ?? 'check');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '📝');
  const [color, setColor] = useState(initial?.color ?? LIST_COLORS[1]);
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [note, setNote] = useState(initial?.note ?? '');
  const save = () => {
    if (!title.trim()) return;
    const base = initial ?? newList({ title: title.trim() });
    onSave({ ...base, title: title.trim(), kind, emoji: emoji || '📝', color, photo, note: note.trim() || undefined });
  };
  return (
    <Modal open onClose={onClose} title={initial ? L('Liste ändern', 'Change list') : L('Neue Liste', 'New list')}>
      <div className="flex flex-col gap-3.5" data-testid="list-edit-sheet">
        {!initial && (
          <div className="flex gap-1.5 flex-wrap" data-testid="list-starters">
            {STARTERS.map((s) => (
              <button key={s.de} type="button" onClick={() => { setTitle(L(s.de, s.en)); setEmoji(s.emoji); setKind(s.kind); }} className={pill(false)}>{s.emoji} {L(s.de, s.en)}</button>
            ))}
          </div>
        )}
        <label className="block">
          <span className={lbl}>{L('Wie heißt die Liste?', 'What is the list called?')}</span>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={L('z. B. Einkauf', 'e.g. Shopping')} data-testid="list-title-input" autoFocus />
        </label>
        <div>
          <span className={lbl}>{L('Art', 'Type')}</span>
          <div className="flex gap-1.5 flex-wrap">
            <button type="button" onClick={() => setKind('check')} className={pill(kind === 'check')} style={kind === 'check' ? { background: 'var(--color-primary)' } : undefined} data-testid="list-kind-check">☑ {L('Zum Abhaken', 'To tick off')}</button>
            <button type="button" onClick={() => setKind('bullets')} className={pill(kind === 'bullets')} style={kind === 'bullets' ? { background: 'var(--color-primary)' } : undefined} data-testid="list-kind-bullets">• {L('Nur Aufzählung', 'Just bullets')}</button>
          </div>
        </div>
        <div>
          <span className={lbl}>{L('Symbol', 'Symbol')}</span>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {LIST_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setEmoji(e)} className="w-10 h-10 shrink-0 rounded-xl text-[20px] flex items-center justify-center" style={{ background: emoji === e ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', outline: emoji === e ? '2px solid var(--color-primary)' : 'none' }} aria-label={e}>{e}</button>
            ))}
          </div>
          <input className="input mt-1.5" value={LIST_EMOJIS.includes(emoji) ? '' : emoji} onChange={(e) => setEmoji(Array.from(e.target.value).slice(-2).join('') || '📝')} placeholder={L('… oder ein eigenes Symbol tippen', '… or type your own symbol')} aria-label={L('Eigenes Symbol', 'Own symbol')} data-testid="list-emoji-own" />
        </div>
        <div>
          <span className={lbl}>{L('Farbe', 'Colour')}</span>
          <div className="flex gap-2 flex-wrap">
            {LIST_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className="w-9 h-9 rounded-full" style={{ background: c, border: '1.5px solid rgba(0,0,0,0.15)', outline: color === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={c} data-testid={`list-color-${c.slice(1)}`} />
            ))}
            <label className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(#e8a83d,#7fb069,#6aa8c9,#9a7bc4,#d9778a,#e8a83d)' }} title={L('Eigene Farbe', 'Own colour')}>
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(color) ? color : '#6aa8c9'} onChange={(e) => setColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={L('Eigene Farbe', 'Own colour')} />
            </label>
          </div>
        </div>
        <PhotoField id={photo} onChange={setPhoto} L={L} label={L('Foto (freiwillig, bleibt auf diesem Gerät)', 'Photo (optional, stays on this device)')} testId="list-photo" />
        <label className="block">
          <span className={lbl}>{L('Notiz zur Liste (freiwillig)', 'Note for the list (optional)')}</span>
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} data-testid="list-note-input" />
        </label>
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} disabled={!title.trim()} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="list-save">{L('Speichern', 'Save')}</button>
          {initial && onDelete && <DeleteButton onDelete={onDelete} L={L} label={L('Liste löschen', 'Delete list')} testId="list-delete" />}
        </div>
      </div>
    </Modal>
  );
}

/** Einen Punkt bearbeiten: Text, Notiz, Unterpunkte, Reihenfolge, löschen */
export function ItemSheet({ item, kind, canUp, canDown, onSave, onDelete, onMove, onCopy }: {
  item: ListItem; kind: ListKind; canUp: boolean; canDown: boolean;
  onSave: (i: ListItem) => void; onDelete: () => void; onMove: (d: -1 | 1) => void; onCopy: () => void;
}) {
  const { L } = useL();
  const [text, setText] = useState(item.text);
  const [note, setNote] = useState(item.note ?? '');
  const [sub, setSub] = useState(item.sub);
  const [fresh, setFresh] = useState('');
  const addSub = () => {
    if (!fresh.trim()) return;
    setSub((s) => [...s, { id: itemId(), text: fresh.trim(), done: false }]);
    setFresh('');
  };
  const done = () => {
    const pending = fresh.trim() ? [...sub, { id: itemId(), text: fresh.trim(), done: false }] : sub;
    onSave({ ...item, text: text.trim() || item.text, note: note.trim() || undefined, sub: pending.filter((s) => s.text.trim()) });
  };
  const check = kind === 'check';
  return (
    <Modal open onClose={done} title={L('Punkt ändern', 'Change item')}>
      <div className="flex flex-col gap-3.5" data-testid="list-item-sheet">
        <label className="block">
          <span className={lbl}>{L('Text', 'Text')}</span>
          <input className="input" value={text} onChange={(e) => setText(e.target.value)} data-testid="list-item-text" />
        </label>
        <label className="block">
          <span className={lbl}>{L('Notiz dazu (freiwillig)', 'Note (optional)')}</span>
          <textarea className="input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder={L('z. B. die mit wenig Zucker', 'e.g. the low-sugar one')} data-testid="list-item-note" />
        </label>
        <div>
          <span className={lbl}>{L('Unterpunkte (freiwillig)', 'Sub-items (optional)')}</span>
          <ul className="flex flex-col gap-1.5">
            {sub.map((s) => (
              <li key={s.id} className="flex items-center gap-1.5">
                {check && (
                  <button type="button" onClick={() => setSub((a) => a.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)))} className="w-10 h-10 shrink-0 flex items-center justify-center" aria-label={s.done ? L('Wieder öffnen', 'Reopen') : L('Abhaken', 'Tick off')}>
                    <span className="w-[22px] h-[22px] rounded-md border-2 flex items-center justify-center" style={{ borderColor: 'var(--color-border-strong)', background: s.done ? 'var(--color-primary)' : 'transparent' }}>{s.done && <Check size={14} color="#fff" />}</span>
                  </button>
                )}
                <input className="input flex-1" value={s.text} onChange={(e) => setSub((a) => a.map((x) => (x.id === s.id ? { ...x, text: e.target.value } : x)))} data-testid="list-sub-text" />
                <button type="button" onClick={() => setSub((a) => a.filter((x) => x.id !== s.id))} className="w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Unterpunkt entfernen', 'Remove sub-item')}><X size={17} /></button>
              </li>
            ))}
          </ul>
          <div className="flex gap-1.5 mt-1.5">
            <input className="input flex-1" value={fresh} onChange={(e) => setFresh(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSub(); } }} placeholder={L('Unterpunkt hinzufügen …', 'Add a sub-item …')} data-testid="list-sub-new" />
            <button type="button" onClick={addSub} className="w-11 h-11 shrink-0 rounded-full flex items-center justify-center text-white" style={{ background: 'var(--color-primary)' }} aria-label={L('Hinzufügen', 'Add')} data-testid="list-sub-add"><Plus size={19} /></button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => { done(); onCopy(); }} className={ghostBtn} data-testid="list-item-copy"><Copy size={15} /> {L('In andere Liste', 'To another list')}</button>
          <button type="button" disabled={!canUp} onClick={() => onMove(-1)} className={`${ghostBtn} disabled:opacity-40`} aria-label={L('Nach oben', 'Move up')} data-testid="list-item-up"><ArrowUp size={15} /></button>
          <button type="button" disabled={!canDown} onClick={() => onMove(1)} className={`${ghostBtn} disabled:opacity-40`} aria-label={L('Nach unten', 'Move down')} data-testid="list-item-down"><ArrowDown size={15} /></button>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={done} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="list-item-save">{L('Fertig', 'Done')}</button>
          <DeleteButton onDelete={onDelete} L={L} label={L('Punkt löschen', 'Delete item')} testId="list-item-delete" />
        </div>
      </div>
    </Modal>
  );
}

/** Punkt in eine andere Liste legen – kopieren (bleibt hier) oder verschieben */
export function CopySheet({ item, lists, fromId, onClose, onPick, onNew }: {
  item: ListItem; lists: UserList[]; fromId: string; onClose: () => void;
  onPick: (target: UserList, move: boolean) => void; onNew: (title: string, move: boolean) => void;
}) {
  const { L } = useL();
  const [move, setMove] = useState(false);
  const [name, setName] = useState('');
  const others = lists.filter((l) => l.id !== fromId && !l.archived);
  return (
    <Modal open onClose={onClose} title={L('In eine andere Liste', 'To another list')} subtitle={item.text}>
      <div className="flex flex-col gap-3" data-testid="list-copy-sheet">
        <div className="flex gap-1.5 flex-wrap">
          <button type="button" onClick={() => setMove(false)} className={pill(!move)} style={!move ? { background: 'var(--color-primary)' } : undefined} data-testid="list-copy-mode-copy"><Copy size={13} className="inline -mt-0.5" /> {L('Kopieren – bleibt auch hier', 'Copy – stays here too')}</button>
          <button type="button" onClick={() => setMove(true)} className={pill(move)} style={move ? { background: 'var(--color-primary)' } : undefined} data-testid="list-copy-mode-move"><MoveRight size={13} className="inline -mt-0.5" /> {L('Verschieben', 'Move')}</button>
        </div>
        {others.length === 0 && <p className="text-[14px] text-[var(--color-text-muted)]">{L('Du hast noch keine andere Liste – leg unten eine an.', 'You have no other list yet – create one below.')}</p>}
        <ul className="flex flex-col gap-2">
          {others.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => onPick(l, move)} className="w-full flex items-center gap-3 text-left rounded-2xl px-3.5 py-3 min-h-[52px] border" style={{ borderColor: l.color, background: `${l.color}1f` }} data-testid={`list-copy-to-${l.id}`}>
                <span className="text-[22px]" aria-hidden>{l.emoji}</span>
                <span className="flex-1 text-[15px] text-[var(--color-text)]">{l.title}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex gap-1.5">
          <input className="input flex-1" value={name} onChange={(e) => setName(e.target.value)} placeholder={L('Neue Liste …', 'New list …')} data-testid="list-copy-new-name" />
          <button type="button" disabled={!name.trim()} onClick={() => onNew(name.trim(), move)} className="h-11 px-4 rounded-full text-white text-[14px] disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="list-copy-new"><Plus size={16} className="inline -mt-0.5" /> {L('Anlegen', 'Create')}</button>
        </div>
      </div>
    </Modal>
  );
}
