import { useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { dayLabel, newId, notifyBudget, potsRepo, todayStr, budgetSettingsStore, type Pot } from './budgetModel';
import { potBalance } from './budgetCalc';
import { AmountField, Bar, SubPage, card, ghostBtn, primaryBtn, useBudget, useToast } from './budgetUi';
import { PotSheet } from './BudgetSheets2';

const COL = '#d98aa0';

function Pig({ wiggle, coin }: { wiggle: boolean; coin: { key: number; amount: number } | null }) {
  return (
    <div className="relative mx-auto" style={{ width: 230, height: 170 }} data-testid="budget-pig">
      <style>{`
        @keyframes vma-drop { 0% { transform: translateY(-46px) rotate(0deg); opacity: 0; } 15% { opacity: 1; } 70% { transform: translateY(32px) rotate(220deg); opacity: 1; } 100% { transform: translateY(46px) rotate(260deg); opacity: 0; } }
        @keyframes vma-wiggle { 0%,100% { transform: rotate(0deg) scale(1); } 20% { transform: rotate(-3deg) scale(1.03); } 45% { transform: rotate(2.5deg) scale(0.99); } 70% { transform: rotate(-1.2deg); } }
      `}</style>
      <svg viewBox="0 0 230 170" width="230" height="170" style={{ animation: wiggle ? 'vma-wiggle .7s ease 0.45s 1' : undefined, transformOrigin: '50% 80%' }} role="img" aria-label="Sparschwein">
        <ellipse cx="115" cy="160" rx="70" ry="7" fill="#00000012" />
        <rect x="70" y="124" width="22" height="30" rx="9" fill="#e59ab0" />
        <rect x="138" y="124" width="22" height="30" rx="9" fill="#e59ab0" />
        <path d="M184 86 C204 70 214 84 202 94 C196 99 206 104 194 108" fill="none" stroke="#e59ab0" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="112" cy="94" rx="76" ry="56" fill="#f4b2c4" />
        <ellipse cx="112" cy="70" rx="40" ry="14" fill="#ffffff" opacity="0.22" />
        <path d="M52 52 L66 28 L84 54 Z" fill="#e59ab0" />
        <ellipse cx="38" cy="98" rx="22" ry="19" fill="#e9a0b6" />
        <ellipse cx="32" cy="98" rx="3.4" ry="5.5" fill="#b7607c" />
        <ellipse cx="44" cy="98" rx="3.4" ry="5.5" fill="#b7607c" />
        <circle cx="66" cy="80" r="4.8" fill="#4a2a36" />
        <circle cx="67.4" cy="78.4" r="1.5" fill="#fff" />
        <path d="M82 104 Q94 112 106 104" fill="none" stroke="#b7607c" strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
        <ellipse cx="62" cy="96" rx="9" ry="5" fill="#f08aa6" opacity="0.5" />
        <rect x="92" y="44" width="46" height="7" rx="3.5" fill="#8f4a60" />
      </svg>
      {coin && (
        <div key={coin.key} className="absolute left-1/2 -ml-[17px] top-1 pointer-events-none flex items-center justify-center text-[13px] text-[#6b4a05]" style={{ width: coin.amount >= 5 ? 44 : 34, height: coin.amount >= 5 ? 26 : 34, marginLeft: coin.amount >= 5 ? -22 : -17, borderRadius: coin.amount >= 5 ? 6 : 999, background: coin.amount >= 5 ? '#9fd3a8' : '#f2c46d', border: '2px solid rgba(0,0,0,.18)', animation: 'vma-drop .75s ease-in forwards', fontWeight: 600 }} aria-hidden>
          {coin.amount >= 5 ? '€' : coin.amount}
        </div>
      )}
    </div>
  );
}

function DepositSheet({ pot, mode, onClose, onSaved }: { pot: Pot; mode: 'in' | 'out'; onClose: () => void; onSaved: (m: string) => void }) {
  const { L, cur, m } = useBudget();
  const [v, setV] = useState<number | undefined>();
  const [fromBudget, setFromBudget] = useState(true);
  const bal = potBalance(pot);
  const save = () => {
    if (!v || v <= 0) return;
    const amount = mode === 'in' ? v : -Math.min(v, Math.max(0, bal));
    if (amount === 0) return;
    potsRepo.save({ ...pot, deposits: [...pot.deposits, { id: newId('bdep'), d: todayStr(), amount, fromBudget }] });
    notifyBudget();
    onSaved(mode === 'in' ? L(`${m(v)} liegen jetzt in „${pot.name}“.`, `${m(v)} now in “${pot.name}”.`) : L(`${m(-amount)} herausgenommen.`, `${m(-amount)} taken out.`));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`${pot.emoji} ${pot.name}`}>
      <div className="flex flex-col gap-3" data-testid="budget-deposit-sheet">
        <p className="text-[13px] text-[var(--color-text-muted)]">{mode === 'in' ? L('Wie viel legst du hinein?', 'How much are you putting in?') : L(`Wie viel nimmst du heraus? (Drin sind ${m(bal)})`, `How much are you taking out? (${m(bal)} inside)`)}</p>
        <AmountField big autoFocus value={v} onChange={setV} testId="budget-deposit-amount" cur={cur} />
        <label className="flex items-start gap-2 text-[14px]">
          <input type="checkbox" checked={fromBudget} onChange={(e) => setFromBudget(e.target.checked)} className="w-5 h-5 mt-0.5" data-testid="budget-deposit-from" />
          <span>{mode === 'in' ? L('Das Geld kommt aus meinem Monatsgeld (es zählt dann als ausgegeben)', 'The money comes from my monthly money (it then counts as spent)') : L('Das Geld geht zurück in mein Monatsgeld', 'The money goes back into my monthly money')}</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={save} disabled={!v || v <= 0} className={primaryBtn} style={{ background: COL }} data-testid="budget-deposit-save">{mode === 'in' ? L('Hineinlegen', 'Put in') : L('Herausnehmen', 'Take out')}</button>
        </div>
      </div>
    </Modal>
  );
}

/** Sparschwein zum Reinwerfen + weitere Rücklagen mit Ziel */
export function BudgetPiggy() {
  const { data, L, lang, m, reduceMotion } = useBudget();
  const [toast, say] = useToast();
  const [coin, setCoin] = useState<{ key: number; amount: number } | null>(null);
  const [wiggle, setWiggle] = useState(false);
  const [custom, setCustom] = useState<number | undefined>();
  const [fromBudget, setFromBudget] = useState(true);
  const [sheet, setSheet] = useState<{ pot: Pot; mode: 'in' | 'out' } | null>(null);
  const [potEdit, setPotEdit] = useState<{ pot?: Pot } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const key = useRef(0);
  const pig = data.pots.find((p) => p.pig) ?? data.pots[0];
  const others = data.pots.filter((p) => p.id !== pig?.id);
  const pigBal = pig ? potBalance(pig) : 0;
  const drop = (amount: number) => {
    if (!pig || !(amount > 0)) return;
    budgetSettingsStore.set({ ...budgetSettingsStore.get(), lastCoin: amount });
    potsRepo.save({ ...pig, deposits: [...pig.deposits, { id: newId('bdep'), d: todayStr(), amount, fromBudget }] });
    if (!reduceMotion) {
      key.current += 1;
      setCoin({ key: key.current, amount });
      setWiggle(true);
      window.setTimeout(() => { setCoin(null); setWiggle(false); }, 1500);
    }
    // das Geld muss wirklich irgendwo hin: nachfragen, wenn noch kein Ort steht
    notifyBudget();
    say(pig.where ? L(`${m(amount)} im Schwein! Es liegt: ${pig.where}`, `${m(amount)} in the pig! It is kept: ${pig.where}`) : L(`${m(amount)} im Schwein! Leg das Geld wirklich irgendwohin – und schreib unten auf, wohin.`, `${m(amount)} in the pig! Put the money somewhere real – and note below where.`));
    setCustom(undefined);
  };
  return (
    <SubPage title={L('Sparschwein & Rücklagen', 'Piggy bank & savings')} emoji="🐷" color={COL} hint={L('Kleine Beträge sammeln. Tipp eine Münze an – sie fällt hinein.', 'Collect small amounts. Tap a coin – it drops in.')}>
      {pig && (
        <section className={`${card} px-4 py-5 text-center`} style={{ background: `${COL}1a`, borderColor: `${COL}66` }} data-testid="budget-pig-card">
          <Pig wiggle={wiggle} coin={coin} />
          <p className="text-[12.5px] text-[var(--color-text-muted)] mt-1">{L('Im Sparschwein', 'In the piggy bank')}</p>
          <p className="text-[32px] font-[var(--font-display)] leading-tight" data-testid="budget-pig-balance">{m(pigBal)}</p>
          <button type="button" onClick={() => setPotEdit({ pot: pig })} className="mt-1 text-[13px] underline underline-offset-2 text-[var(--color-text-muted)]" data-testid="budget-pig-where">
            {pig.where ? `📍 ${L('Das Geld liegt', 'The money is kept')}: ${pig.where}` : L('📍 Wo liegt das Geld wirklich? Hier aufschreiben', '📍 Where is the money really? Note it here')}
          </button>
          <div className="flex justify-center gap-3 mt-4" role="group" aria-label={L('Geld einwerfen', 'Drop money in')}>
            {[1, 2, 5].map((a) => (
              <button key={a} type="button" onClick={() => drop(a)} className="flex flex-col items-center gap-1 min-w-[72px] py-2 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] active:scale-95 transition-transform" data-testid={`budget-coin-${a}`} aria-label={`${a} ${budgetSettingsStore.get().currency}`}>
                {a >= 5 ? <span className="w-12 h-7 rounded-md flex items-center justify-center text-[14px] text-[#27583a]" style={{ background: '#9fd3a8', border: '2px solid rgba(0,0,0,.15)' }}>{a}</span> : <span className="w-9 h-9 rounded-full flex items-center justify-center text-[15px] text-[#6b4a05]" style={{ background: '#f2c46d', border: '2px solid rgba(0,0,0,.15)' }}>{a}</span>}
                <span className="text-[12px] text-[var(--color-text-muted)]">{a} {budgetSettingsStore.get().currency}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-end mt-4 text-left">
            <div className="flex-1"><AmountField value={custom} onChange={setCustom} label={L('Anderer Betrag', 'Another amount')} testId="budget-pig-custom" cur={budgetSettingsStore.get().currency} /></div>
            <button type="button" onClick={() => custom && drop(custom)} disabled={!custom || custom <= 0} className={primaryBtn} style={{ background: COL }} data-testid="budget-pig-custom-go">{L('Rein', 'Drop in')}</button>
          </div>
          <label className="flex items-start gap-2 text-[13px] text-left mt-3">
            <input type="checkbox" checked={fromBudget} onChange={(e) => setFromBudget(e.target.checked)} className="w-5 h-5 mt-0.5" data-testid="budget-pig-frombudget" />
            <span>{L('Kommt aus meinem Monatsgeld (zählt als ausgegeben)', 'Comes from my monthly money (counts as spent)')}</span>
          </label>
          <button type="button" onClick={() => setSheet({ pot: pig, mode: 'out' })} disabled={pigBal <= 0} className={`${ghostBtn} mt-3 disabled:opacity-40`} data-testid="budget-pig-out">{L('Etwas herausnehmen', 'Take something out')}</button>
        </section>
      )}

      <section aria-label={L('Rücklagen', 'Savings')}>
        <h2 className="text-[16px] mb-2">{L('Rücklagen mit Ziel', 'Savings with a goal')}</h2>
        {others.length === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)] mb-2">{L('Zum Beispiel für Urlaub, Notgroschen oder etwas Größeres. Das Geld muss nicht hier sein – du schreibst auf, wo es liegt.', 'For example a holiday, an emergency fund or something bigger. The money does not have to be here – you note where it is.')}</p>}
        <ul className="flex flex-col gap-3">
          {others.map((p) => {
            const bal = potBalance(p);
            return (
              <li key={p.id} className={`${card} px-3.5 py-3`} style={{ borderLeft: `6px solid ${p.color}` }} data-testid={`budget-pot-card-${p.id}`}>
                <div className="flex items-center gap-3">
                  <span className="text-[24px]" aria-hidden>{p.emoji}</span>
                  <button type="button" onClick={() => setPotEdit({ pot: p })} className="flex-1 min-w-0 text-left" data-testid={`budget-pot-card-edit-${p.id}`}>
                    <span className="block text-[15px] truncate">{p.name}</span>
                    <span className="block text-[12px] text-[var(--color-text-muted)]">{p.where ? `📍 ${p.where}` : L('Wo liegt es? Tippen zum Aufschreiben', 'Where is it? Tap to note')}</span>
                  </button>
                  <span className="text-[17px] font-[var(--font-display)]" data-testid={`budget-pot-bal-${p.id}`}>{m(bal)}</span>
                </div>
                {p.goal && <div className="mt-2"><Bar value={bal} max={p.goal} color={p.color} h={9} /><p className="text-[11.5px] text-[var(--color-text-muted)] mt-1">{bal >= p.goal ? L('Ziel erreicht – das ist geschafft! 🎉', 'Goal reached – that is done! 🎉') : L(`Noch ${m(p.goal - bal)} bis ${m(p.goal)}`, `${m(p.goal - bal)} to go until ${m(p.goal)}`)}</p></div>}
                <div className="flex gap-2 mt-2 flex-wrap">
                  <button type="button" onClick={() => setSheet({ pot: p, mode: 'in' })} className={ghostBtn} data-testid={`budget-pot-in-${p.id}`}>{L('Hineinlegen', 'Put in')}</button>
                  <button type="button" onClick={() => setSheet({ pot: p, mode: 'out' })} disabled={bal <= 0} className={`${ghostBtn} disabled:opacity-40`}>{L('Herausnehmen', 'Take out')}</button>
                  {p.deposits.length > 0 && <button type="button" onClick={() => setOpen(open === p.id ? null : p.id)} className="text-[13px] underline underline-offset-2 text-[var(--color-text-muted)] px-2">{open === p.id ? L('Verlauf zu', 'Hide history') : L('Verlauf', 'History')}</button>}
                </div>
                {open === p.id && (
                  <ul className="mt-2 text-[13px] flex flex-col gap-1">
                    {[...p.deposits].reverse().slice(0, 30).map((d) => <li key={d.id} className="flex justify-between"><span className="text-[var(--color-text-muted)]">{dayLabel(d.d, lang)}{d.note ? ` · ${d.note}` : ''}</span><span style={{ color: d.amount >= 0 ? '#3f8f9b' : '#c07a10' }}>{m(d.amount, { sign: true })}</span></li>)}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
        <button type="button" onClick={() => setPotEdit({})} className={`${primaryBtn} w-full mt-3`} style={{ background: COL }} data-testid="budget-add-pot-savings"><Plus size={17} />{L('Neue Rücklage', 'New savings pot')}</button>
      </section>
      {sheet && <DepositSheet pot={sheet.pot} mode={sheet.mode} onClose={() => setSheet(null)} onSaved={say} />}
      {potEdit && <PotSheet initial={potEdit.pot} onClose={() => setPotEdit(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}
