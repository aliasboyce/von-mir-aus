import { useEffect, useRef, useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { dayLabel, newId, notifyBudget, potsRepo, todayStr, budgetSettingsStore, type Deposit, type Pot } from './budgetModel';
import { useSettings } from '../../state/SettingsContext';
import { playSound } from '../../services/sounds';
import { potBalance } from './budgetCalc';
import { AmountField, Bar, SubPage, card, ghostBtn, primaryBtn, useBudget, useToast } from './budgetUi';
import { PotSheet } from './BudgetSheets2';

const COL = '#d98aa0';

type Mood = { key: number; kind: 'in' | 'out' | 'tap' } | null;

/**
 * Das Sparschwein: ruhig gezeichnet, atmet, blinzelt, wackelt mit dem Schwanz. Beim Einwerfen fällt die Münze durch den Schlitz,
 * das Schwein hüpft und ein paar Funken sprühen; beim Herausnehmen springt eine Münze heraus; Antippen = kleines Hüpfen und ein Herz.
 * Bei „Bewegung reduzieren“ steht es still.
 */
function Pig({ mood, coin, still, onTap }: { mood: Mood; coin: { key: number; amount: number } | null; still: boolean; onTap: () => void }) {
  const sparks = [[-34, -34], [-18, -48], [0, -54], [20, -48], [36, -32], [-44, -12], [46, -10]];
  const big = coin && coin.amount >= 5;
  return (
    <div className="relative mx-auto select-none" style={{ width: 240, height: 204 }} data-testid="budget-pig" data-mood={mood?.kind ?? 'idle'}>
      <style>{`
        @keyframes vma-breathe { 0%,100% { transform: scale(1,1); } 50% { transform: scale(1.012,1.028); } }
        @keyframes vma-tail { 0%,100% { transform: rotate(0deg); } 50% { transform: rotate(14deg); } }
        @keyframes vma-ear { 0%,86%,100% { transform: rotate(0deg); } 90% { transform: rotate(-9deg); } 95% { transform: rotate(3deg); } }
        @keyframes vma-blink { 0%,92%,100% { transform: scaleY(1); } 95% { transform: scaleY(0.08); } }
        @keyframes vma-hop { 0% { transform: translateY(0) scale(1,1); } 18% { transform: translateY(2px) scale(1.05,0.93); } 45% { transform: translateY(-14px) scale(0.97,1.05); } 72% { transform: translateY(0) scale(1.03,0.96); } 100% { transform: translateY(0) scale(1,1); } }
        @keyframes vma-coin { 0% { transform: translateY(-14px) scale(1,1); opacity: 0; } 12% { opacity: 1; } 35% { transform: translateY(14px) scale(0.15,1); } 55% { transform: translateY(32px) scale(1,1); } 80% { transform: translateY(52px) scale(0.2,1); opacity: 1; } 100% { transform: translateY(60px) scale(0.2,1); opacity: 0; } }
        @keyframes vma-coin-out { 0% { transform: translateY(54px) scale(0.3,1); opacity: 0; } 25% { opacity: 1; } 60% { transform: translateY(-22px) scale(1,1); } 100% { transform: translateY(-4px) scale(1,1); opacity: 0; } }
        @keyframes vma-spark { 0% { transform: translate(0,0) scale(0.2); opacity: 0; } 25% { opacity: 1; } 100% { transform: translate(var(--dx),var(--dy)) scale(1) rotate(80deg); opacity: 0; } }
        @keyframes vma-heart { 0% { transform: translateY(0) scale(0.4); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-46px) scale(1.1); opacity: 0; } }
        .vma-breathe { transform-box: fill-box; transform-origin: 50% 100%; animation: vma-breathe 3.6s ease-in-out infinite; }
        .vma-tail { transform-box: fill-box; transform-origin: 90% 80%; animation: vma-tail 1.9s ease-in-out infinite; }
        .vma-ear { transform-box: fill-box; transform-origin: 30% 90%; animation: vma-ear 6s ease-in-out infinite; }
        .vma-eye { transform-box: fill-box; transform-origin: 50% 50%; animation: vma-blink 5.2s ease-in-out infinite; }
        .vma-hop { animation: vma-hop .62s ease-out 1; transform-origin: 50% 92%; }
        .vma-coin { transform-box: fill-box; transform-origin: 50% 50%; animation: vma-coin .8s ease-in forwards; }
        .vma-coin-out { transform-box: fill-box; transform-origin: 50% 50%; animation: vma-coin-out .8s ease-out forwards; }
        .vma-spark { transform-box: fill-box; transform-origin: 50% 50%; animation: vma-spark .8s ease-out .38s both; }
        .vma-heart { animation: vma-heart 1.1s ease-out both; }
        .vma-still * { animation: none !important; }
        @media (prefers-reduced-motion: reduce) { .vma-pigwrap * { animation: none !important; } }
      `}</style>
      <button type="button" onClick={onTap} className="absolute inset-0 w-full h-full cursor-pointer" aria-label="Sparschwein streicheln" data-testid="budget-pig-tap" style={{ background: 'none', border: 0, padding: 0 }}>
        <span key={mood?.key ?? 0} className={`block vma-pigwrap ${still ? 'vma-still' : ''} ${mood ? 'vma-hop' : ''}`}>
          <svg viewBox="0 -24 240 204" width="240" height="204" role="img" aria-label="Sparschwein">
            <defs>
              <linearGradient id="vmaBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fbc3d1" /><stop offset="1" stopColor="#f19db4" /></linearGradient>
            </defs>
            <ellipse cx="120" cy="172" rx="76" ry="7" fill="#000" opacity="0.1" />
            {/* Münze: liegt hinter dem Körper – so verschwindet sie im Schlitz */}
            {coin && mood?.kind === 'in' && (
              <g className="vma-coin" key={`c${coin.key}`}>
                {big ? <rect x="97" y="-12" width="44" height="26" rx="5" fill="#9fd3a8" stroke="rgba(0,0,0,.25)" strokeWidth="2" /> : <circle cx="119" cy="0" r="13" fill="#f2c46d" stroke="rgba(0,0,0,.25)" strokeWidth="2" />}
                <text x="119" y={big ? 6 : 5} textAnchor="middle" fontSize="13" fontWeight="600" fill={big ? '#27583a' : '#6b4a05'}>{big ? '€' : coin.amount}</text>
              </g>
            )}
            <g className="vma-breathe">
              {/* hintere Beine */}
              <rect x="62" y="130" width="26" height="36" rx="11" fill="#ec93ac" />
              <rect x="134" y="130" width="26" height="36" rx="11" fill="#ec93ac" />
              {/* Schwanz */}
              <g className="vma-tail"><path d="M48 100 C28 96 22 76 34 72 C45 69 47 82 38 85" fill="none" stroke="#e8869f" strokeWidth="6" strokeLinecap="round" /></g>
              {/* Körper */}
              <ellipse cx="118" cy="100" rx="82" ry="60" fill="url(#vmaBody)" />
              <ellipse cx="98" cy="64" rx="36" ry="9" fill="#fff" opacity="0.3" transform="rotate(-8 98 64)" />
              {/* vordere Beine */}
              <rect x="86" y="134" width="26" height="34" rx="11" fill="#f19db4" />
              <rect x="158" y="130" width="26" height="38" rx="11" fill="#f19db4" />
              <path d="M91 160 h16 M163 160 h16" stroke="#d97b97" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              {/* Ohr */}
              <g className="vma-ear"><path d="M146 52 Q150 24 178 36 Q176 56 156 64 Z" fill="#ee93ac" /><path d="M152 50 Q155 36 170 41 Q168 52 158 57 Z" fill="#f9c6d3" /></g>
              {/* Schnauze */}
              <ellipse cx="204" cy="108" rx="22" ry="17" fill="#f08fa9" />
              <ellipse cx="198" cy="108" rx="3.2" ry="5.6" fill="#b85c7a" />
              <ellipse cx="210" cy="108" rx="3.2" ry="5.6" fill="#b85c7a" />
              {/* Gesicht */}
              <ellipse cx="174" cy="108" rx="10" ry="6" fill="#f27ea0" opacity="0.4" />
              <g className="vma-eye"><circle cx="178" cy="84" r="5.2" fill="#3d2430" /><circle cx="179.8" cy="82.2" r="1.7" fill="#fff" /></g>
              <path d="M180 119 Q190 126 200 119" fill="none" stroke="#b85c7a" strokeWidth="2.4" strokeLinecap="round" opacity="0.75" />
              {/* Schlitz */}
              <rect x="92" y="41" width="56" height="8" rx="4" fill="#9a4863" />
              <rect x="95" y="43" width="50" height="2" rx="1" fill="#000" opacity="0.25" />
            </g>
            {/* Funken beim Einwerfen */}
            {mood?.kind === 'in' && sparks.map(([dx, dy], i) => (
              <path key={i} className="vma-spark" style={{ ['--dx' as string]: `${dx}px`, ['--dy' as string]: `${dy}px` }} d={`M${120 + (i % 3) * 3 - 3} 40 l2 -6 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 z`} fill={i % 2 ? '#ffe28a' : '#fff2b8'} stroke="#e7b94a" strokeWidth="0.6" />
            ))}
            {/* Herausgenommen: Münze springt aus dem Schlitz */}
            {mood?.kind === 'out' && (
              <g className="vma-coin-out"><circle cx="119" cy="-6" r="12" fill="#f2c46d" stroke="rgba(0,0,0,.25)" strokeWidth="2" /></g>
            )}
            {mood?.kind === 'tap' && <text className="vma-heart" x="122" y="20" fontSize="22" textAnchor="middle">💗</text>}
          </svg>
        </span>
      </button>
    </div>
  );
}

function DepositSheet({ pot, mode, onClose, onSaved }: { pot: Pot; mode: 'in' | 'out'; onClose: () => void; onSaved: (m: string, dep: Deposit) => void }) {
  const { L, cur, m } = useBudget();
  const [v, setV] = useState<number | undefined>();
  const [fromBudget, setFromBudget] = useState(true);
  const bal = potBalance(pot);
  const save = () => {
    if (!v || v <= 0) return;
    const amount = mode === 'in' ? v : -Math.min(v, Math.max(0, bal));
    if (amount === 0) return;
    const dep: Deposit = { id: newId('bdep'), d: todayStr(), amount, fromBudget };
    potsRepo.save({ ...pot, deposits: [...pot.deposits, dep] });
    notifyBudget();
    onSaved(mode === 'in' ? L(`${m(v)} liegen jetzt in „${pot.name}“.`, `${m(v)} now in “${pot.name}”.`) : L(`${m(-amount)} herausgenommen.`, `${m(-amount)} taken out.`), dep);
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
  const { settings } = useSettings();
  const [toast, say] = useToast();
  const [coin, setCoin] = useState<{ key: number; amount: number } | null>(null);
  const [mood, setMood] = useState<Mood>(null);
  const [custom, setCustom] = useState<number | undefined>();
  const [fromBudget, setFromBudget] = useState(true);
  const [sheet, setSheet] = useState<{ pot: Pot; mode: 'in' | 'out' } | null>(null);
  const [potEdit, setPotEdit] = useState<{ pot?: Pot } | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const key = useRef(0);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);
  const pig = data.pots.find((p) => p.pig) ?? data.pots[0];
  const others = data.pots.filter((p) => p.id !== pig?.id);
  const pigBal = pig ? potBalance(pig) : 0;

  const animate = (kind: 'in' | 'out' | 'tap', amount = 1) => {
    if (reduceMotion) return;
    key.current += 1;
    setMood({ key: key.current, kind });
    if (kind === 'in') setCoin({ key: key.current, amount });
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => { setMood(null); setCoin(null); }, 1700);
  };

  /** Ein Versehen zurücknehmen: der Eintrag verschwindet ganz – es ist weder „Hatte ich“ noch eine Ausgabe, es war nie passiert. */
  const undo = (potId: string, depId: string) => {
    const pot = potsRepo.getById(potId);
    if (!pot) return;
    potsRepo.save({ ...pot, deposits: pot.deposits.filter((d) => d.id !== depId) });
    notifyBudget();
    playSound('coinOut', settings);
    animate('out');
    say(L('Zurückgenommen – das war ein Versehen, es ist nichts passiert.', 'Taken back – that was a mistake, nothing happened.'));
  };

  const drop = (amount: number) => {
    if (!pig || !(amount > 0)) return;
    budgetSettingsStore.set({ ...budgetSettingsStore.get(), lastCoin: amount });
    const dep: Deposit = { id: newId('bdep'), d: todayStr(), amount, fromBudget };
    potsRepo.save({ ...pig, deposits: [...pig.deposits, dep] });
    animate('in', amount);
    playSound('coin', settings);
    notifyBudget();
    say(
      pig.where ? L(`${m(amount)} im Schwein! Es liegt: ${pig.where}`, `${m(amount)} in the pig! It is kept: ${pig.where}`) : L(`${m(amount)} im Schwein! Leg das Geld wirklich irgendwohin – und schreib unten auf, wohin.`, `${m(amount)} in the pig! Put the money somewhere real – and note below where.`),
      { label: L('Zurück', 'Undo'), run: () => undo(pig.id, dep.id) },
      9000,
    );
    setCustom(undefined);
  };
  const afterSheet = (pot: Pot, mode: 'in' | 'out') => (msg: string, dep: Deposit) => {
    if (mode === 'in') { playSound('coin', settings); if (pot.id === pig?.id) animate('in', dep.amount); } else { playSound('coinOut', settings); if (pot.id === pig?.id) animate('out'); }
    say(msg, { label: L('Zurück', 'Undo'), run: () => undo(pot.id, dep.id) }, 9000);
  };
  return (
    <SubPage title={L('Sparschwein & Rücklagen', 'Piggy bank & savings')} emoji="🐷" color={COL} hint={L('Kleine Beträge sammeln. Tipp eine Münze an – sie fällt hinein.', 'Collect small amounts. Tap a coin – it drops in.')}>
      {pig && (
        <section className={`${card} px-4 py-5 text-center`} style={{ background: `${COL}1a`, borderColor: `${COL}66` }} data-testid="budget-pig-card">
          <Pig mood={mood} coin={coin} still={reduceMotion} onTap={() => { animate('tap'); playSound('click', settings); }} />
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
          {pig.deposits.length > 0 && (
            <details className="mt-3 text-left" data-testid="budget-pig-history">
              <summary className="cursor-pointer select-none text-[13px] text-[var(--color-text-muted)] text-center">{L('Verlauf – Versehen zurücknehmen', 'History – take back a mistake')}</summary>
              <ul className="mt-2 flex flex-col gap-1.5">
                {[...pig.deposits].reverse().slice(0, 8).map((d) => (
                  <li key={d.id} className="flex items-center gap-2 text-[13px]">
                    <span className="flex-1 min-w-0 text-[var(--color-text-muted)] truncate">{dayLabel(d.d, lang)}</span>
                    <span style={{ color: d.amount >= 0 ? '#3f8f9b' : '#c07a10' }}>{m(d.amount, { sign: true })}</span>
                    <button type="button" onClick={() => undo(pig.id, d.id)} className="h-9 px-3 rounded-full border border-[var(--color-border-strong)] text-[12.5px] bg-[var(--color-surface)]" data-testid="budget-pig-undo">↩ {L('Versehen', 'Mistake')}</button>
                  </li>
                ))}
              </ul>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{L('„Versehen“ löscht den Eintrag ganz – er zählt weder als Einnahme noch als Ausgabe.', '“Mistake” deletes the entry completely – it counts neither as income nor as spending.')}</p>
            </details>
          )}
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
      {sheet && <DepositSheet pot={sheet.pot} mode={sheet.mode} onClose={() => setSheet(null)} onSaved={afterSheet(sheet.pot, sheet.mode)} />}
      {potEdit && <PotSheet initial={potEdit.pot} onClose={() => setPotEdit(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}
