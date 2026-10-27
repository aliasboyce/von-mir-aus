import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { POT_COLORS, accountsRepo, categoriesRepo, entriesRepo, newId, notifyBudget, nowIso, potsRepo, todayStr, type Account, type Category, type Pot } from './budgetModel';
import { AmountField, ChipRow, DeleteButton, EmojiRow, TextField, WhereField, ghostBtn, primaryBtn, useBudget } from './budgetUi';

const SWATCHES = ['#7fb069', '#6aa8c9', '#d9778a', '#e8a83d', '#9a7bc4', '#f08a5d', '#4a8f9e', '#8a8f98', ...POT_COLORS];

function ColorRow({ value, onChange, L }: { value: string; onChange: (c: string) => void; L: (de: string, en: string) => string }) {
  return (
    <div>
      <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Farbe', 'Colour')}</span>
      <div className="flex gap-2 flex-wrap">
        {SWATCHES.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} className="w-9 h-9 rounded-full" style={{ background: c, border: '1.5px solid rgba(0,0,0,0.15)', outline: value === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={c} />
        ))}
        <label className="relative w-9 h-9 rounded-full overflow-hidden cursor-pointer" style={{ background: 'conic-gradient(#e8a83d,#7fb069,#6aa8c9,#9a7bc4,#d9778a,#e8a83d)' }} title={L('Eigene Farbe', 'Own colour')}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#6aa8c9'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={L('Eigene Farbe', 'Own colour')} />
        </label>
      </div>
    </div>
  );
}

/** Topf / Bereich: Name, Symbol, Farbe, Monatsbudget */
export function CategorySheet({ initial, onClose, onSaved }: { initial?: Category; onClose: () => void; onSaved: (m: string) => void }) {
  const { L, cur } = useBudget();
  const [label, setLabel] = useState(initial?.label ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🧺');
  const [color, setColor] = useState(initial?.color ?? SWATCHES[1]);
  const [limit, setLimit] = useState<number | undefined>(initial?.limit);
  const save = () => {
    if (!label.trim()) return;
    categoriesRepo.save({ id: initial?.id ?? newId('bcat'), label: label.trim(), emoji, color, limit: limit && limit > 0 ? limit : undefined, createdAt: initial?.createdAt ?? nowIso() });
    notifyBudget();
    onSaved(L('Gespeichert.', 'Saved.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? L('Topf ändern', 'Change pot') : L('Neuer Topf', 'New pot')}>
      <div className="flex flex-col gap-3" data-testid="budget-cat-sheet">
        <TextField value={label} onChange={setLabel} label={L('Wie heißt der Topf?', 'What is the pot called?')} placeholder={L('z. B. Essen & Trinken', 'e.g. food & drink')} testId="budget-cat-label" />
        <AmountField value={limit} onChange={setLimit} label={L('Wie viel Geld hast du pro Monat dafür? (freiwillig)', 'How much money do you have for it per month? (optional)')} testId="budget-cat-limit" cur={cur} />
        <EmojiRow value={emoji} onChange={setEmoji} L={L} />
        <ColorRow value={color} onChange={setColor} L={L} />
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} disabled={!label.trim()} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="budget-cat-save">{L('Speichern', 'Save')}</button>
          {initial && <DeleteButton onDelete={() => { entriesRepo.getAll().filter((e) => e.catId === initial.id).forEach((e) => entriesRepo.save({ ...e, catId: undefined })); categoriesRepo.remove(initial.id); notifyBudget(); onSaved(L('Gelöscht – die Ausgaben bleiben.', 'Deleted – the spending stays.')); onClose(); }} L={L} testId="budget-cat-delete" />}
        </div>
      </div>
    </Modal>
  );
}

/** Konto oder Bargeld */
export function AccountSheet({ initial, onClose, onSaved }: { initial?: Account; onClose: () => void; onSaved: (m: string) => void }) {
  const { L, cur } = useBudget();
  const [name, setName] = useState(initial?.name ?? '');
  const [kind, setKind] = useState<Account['kind']>(initial?.kind ?? 'bank');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🏦');
  const [color, setColor] = useState(initial?.color ?? '#4a7fb0');
  const [balance, setBalance] = useState<number | undefined>(initial?.balance);
  const [where, setWhere] = useState(initial?.where ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const kinds: { v: Account['kind']; label: string; emoji: string }[] = [
    { v: 'bank', label: L('Konto', 'Account'), emoji: '🏦' },
    { v: 'cash', label: L('Bargeld', 'Cash'), emoji: '💶' },
    { v: 'other', label: L('Anderes', 'Other'), emoji: '💳' },
  ];
  const save = () => {
    if (!name.trim() || balance === undefined) return;
    const today = todayStr();
    const history = [...(initial?.history ?? [])];
    if (!initial || initial.balance !== balance) history.push({ d: today, b: balance });
    accountsRepo.save({ id: initial?.id ?? newId('bacc'), name: name.trim(), kind, emoji, color, balance, asOf: !initial || initial.balance !== balance ? today : initial.asOf, history: history.slice(-60), where: where.trim() || undefined, note: note.trim() || undefined, createdAt: initial?.createdAt ?? nowIso() });
    notifyBudget();
    onSaved(L('Gespeichert.', 'Saved.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? L('Konto ändern', 'Change account') : L('Neues Konto oder Bargeld', 'New account or cash')}>
      <div className="flex flex-col gap-3" data-testid="budget-acc-sheet">
        <ChipRow value={kind} onChange={(v) => { setKind(v); setEmoji(kinds.find((k) => k.v === v)!.emoji); }} options={kinds.map((k) => ({ v: k.v, label: `${k.emoji} ${k.label}` }))} testId="budget-acc-kind" />
        <TextField value={name} onChange={setName} label={L('Name', 'Name')} placeholder={kind === 'cash' ? L('z. B. Portemonnaie, Dose', 'e.g. wallet, tin') : L('z. B. Girokonto', 'e.g. current account')} testId="budget-acc-name" />
        <AmountField value={balance} onChange={setBalance} label={L('Wie viel ist gerade drauf?', 'How much is on it right now?')} testId="budget-acc-balance" cur={cur} />
        {kind === 'cash' && <WhereField value={where} onChange={setWhere} label={L('Wo liegt das Bargeld?', 'Where is the cash?')} L={L} testId="budget-acc-where" />}
        <EmojiRow value={emoji} onChange={setEmoji} L={L} />
        <ColorRow value={color} onChange={setColor} L={L} />
        <TextField value={note} onChange={setNote} label={L('Notiz (keine Zugangsdaten!)', 'Note (no login data!)')} testId="budget-acc-note" />
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} disabled={!name.trim() || balance === undefined} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="budget-acc-save">{L('Speichern', 'Save')}</button>
          {initial && <DeleteButton onDelete={() => { accountsRepo.remove(initial.id); notifyBudget(); onSaved(L('Gelöscht.', 'Deleted.')); onClose(); }} L={L} testId="budget-acc-delete" />}
        </div>
      </div>
    </Modal>
  );
}

/** Rücklage (außer dem Sparschwein): Name, Ziel, wo das Geld liegt */
export function PotSheet({ initial, onClose, onSaved }: { initial?: Pot; onClose: () => void; onSaved: (m: string) => void }) {
  const { L, cur } = useBudget();
  const [name, setName] = useState(initial?.name ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🌱');
  const [color, setColor] = useState(initial?.color ?? POT_COLORS[1]);
  const [goal, setGoal] = useState<number | undefined>(initial?.goal);
  const [where, setWhere] = useState(initial?.where ?? '');
  const save = () => {
    if (!name.trim()) return;
    potsRepo.save({ id: initial?.id ?? newId('bpot'), name: name.trim(), emoji, color, goal: goal && goal > 0 ? goal : undefined, where: where.trim() || undefined, deposits: initial?.deposits ?? [], pig: initial?.pig, createdAt: initial?.createdAt ?? nowIso() });
    notifyBudget();
    onSaved(L('Gespeichert.', 'Saved.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? L('Rücklage ändern', 'Change savings pot') : L('Neue Rücklage', 'New savings pot')}>
      <div className="flex flex-col gap-3" data-testid="budget-pot-sheet">
        <TextField value={name} onChange={setName} label={L('Wofür sparst du?', 'What are you saving for?')} placeholder={L('z. B. Urlaub, Notgroschen, Waschmaschine', 'e.g. holiday, emergency fund, washing machine')} testId="budget-pot-name" />
        <AmountField value={goal} onChange={setGoal} label={L('Ziel (freiwillig)', 'Goal (optional)')} testId="budget-pot-goal" cur={cur} />
        <WhereField value={where} onChange={setWhere} label={L('Wo liegt das Geld wirklich?', 'Where is the money really?')} L={L} testId="budget-pot-where" />
        <EmojiRow value={emoji} onChange={setEmoji} L={L} />
        <ColorRow value={color} onChange={setColor} L={L} />
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} disabled={!name.trim()} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="budget-pot-save">{L('Speichern', 'Save')}</button>
          {initial && !initial.pig && <DeleteButton onDelete={() => { potsRepo.remove(initial.id); notifyBudget(); onSaved(L('Gelöscht.', 'Deleted.')); onClose(); }} L={L} testId="budget-pot-delete" />}
          {initial?.pig && <button type="button" onClick={onClose} className={ghostBtn}>{L('Schließen', 'Close')}</button>}
        </div>
      </div>
    </Modal>
  );
}
