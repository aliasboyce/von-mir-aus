import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { accountsRepo, dayLabel, notifyBudget, todayStr, type Account } from './budgetModel';
import { AmountField, Empty, SubPage, card, ghostBtn, primaryBtn, useBudget, useToast } from './budgetUi';
import { AccountSheet } from './BudgetSheets2';

const COL = '#4a7fb0';

function Spark({ pts, color }: { pts: number[]; color: string }) {
  if (pts.length < 2) return null;
  const w = 120, h = 34;
  const min = Math.min(...pts), max = Math.max(...pts);
  const span = max - min || 1;
  const d = pts.map((v, i) => `${(i / (pts.length - 1)) * (w - 4) + 2},${h - 4 - ((v - min) / span) * (h - 8)}`).join(' ');
  return <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden><polyline points={d} fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function BalanceSheet({ acc, onClose, onSaved }: { acc: Account; onClose: () => void; onSaved: (m: string) => void }) {
  const { L, cur, m } = useBudget();
  const [v, setV] = useState<number | undefined>(acc.balance);
  const save = () => {
    if (v === undefined) return;
    const today = todayStr();
    const history = [...acc.history.filter((h) => h.d !== today), { d: today, b: v }].slice(-60);
    accountsRepo.save({ ...acc, balance: v, asOf: today, history });
    notifyBudget();
    onSaved(L('Neuer Stand gespeichert.', 'New balance saved.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`${acc.emoji} ${acc.name}`}>
      <div className="flex flex-col gap-3" data-testid="budget-balance-sheet">
        <p className="text-[13px] text-[var(--color-text-muted)]">{L(`Bisher: ${m(acc.balance)}. Schau in die Banking-App oder zähl nach und trag ein, was jetzt da ist.`, `Before: ${m(acc.balance)}. Check your banking app or count, and enter what is there now.`)}</p>
        <AmountField big autoFocus value={v} onChange={setV} testId="budget-balance-input" cur={cur} />
        <button type="button" onClick={save} disabled={v === undefined} className={primaryBtn} style={{ background: COL }} data-testid="budget-balance-save">{L('Stand festhalten', 'Keep this balance')}</button>
      </div>
    </Modal>
  );
}

/** Konten & Bargeld: der letzte bekannte Stand, kein Zwang zur Genauigkeit */
export function BudgetAccounts() {
  const { data: _d, L, lang, m } = useBudget();
  void _d;
  const [toast, say] = useToast();
  const [edit, setEdit] = useState<{ acc?: Account } | null>(null);
  const [bal, setBal] = useState<Account | null>(null);
  const accounts = accountsRepo.getAll();
  const total = accounts.reduce((s, a) => s + a.balance, 0);
  const today = todayStr();
  const ageDays = (d: string) => Math.round((new Date(`${today}T12:00:00`).getTime() - new Date(`${d}T12:00:00`).getTime()) / 86400000);
  return (
    <SubPage title={L('Konten & Bargeld', 'Accounts & cash')} emoji="🏦" color={COL} hint={L('Schreib auf, was ungefähr auf dem Konto oder im Portemonnaie ist. Es muss nicht auf den Cent stimmen.', 'Note roughly what is on the account or in the wallet. It does not have to be exact.')}>
      <div className="rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-between" style={{ background: `${COL}18` }} data-testid="budget-acc-total-card">
        <span className="text-[13px] text-[var(--color-text-muted)]">{L('Zusammen', 'Together')}</span>
        <span className="text-[24px] font-[var(--font-display)]" data-testid="budget-acc-total">{m(total)}</span>
      </div>
      {accounts.length === 0 && <Empty emoji="🏦" text={L('Noch kein Konto. Du kannst auch nur Bargeld eintragen.', 'No account yet. You can also just enter cash.')} />}
      <ul className="flex flex-col gap-3">
        {accounts.map((a) => {
          const old = ageDays(a.asOf);
          const prev = a.history.length > 1 ? a.history[a.history.length - 2].b : undefined;
          return (
            <li key={a.id} className={`${card} px-3.5 py-3`} style={{ borderLeft: `6px solid ${a.color}` }} data-testid={`budget-acc-${a.id}`}>
              <div className="flex items-center gap-3">
                <span className="text-[26px]" aria-hidden>{a.emoji}</span>
                <button type="button" onClick={() => setEdit({ acc: a })} className="min-w-0 flex-1 text-left" data-testid={`budget-acc-edit-${a.id}`}>
                  <span className="block text-[15.5px] truncate">{a.name}</span>
                  <span className="block text-[12px] text-[var(--color-text-muted)]">{L('Stand', 'As of')} {dayLabel(a.asOf, lang)}{a.where ? ` · 📍 ${a.where}` : ''}</span>
                </button>
                <span className="text-[19px] font-[var(--font-display)]" data-testid={`budget-acc-bal-${a.id}`}>{m(a.balance)}</span>
              </div>
              <div className="flex items-center justify-between mt-2 gap-2">
                <Spark pts={a.history.map((h) => h.b)} color={a.color} />
                <div className="text-right">
                  {prev !== undefined && <p className="text-[12px] text-[var(--color-text-muted)]">{m(a.balance - prev, { sign: true })} {L('seit dem Stand davor', 'since the previous balance')}</p>}
                  {old > 14 && <p className="text-[12px]" style={{ color: '#a9740f' }}>{L(`Der Stand ist ${old} Tage alt.`, `This balance is ${old} days old.`)}</p>}
                </div>
              </div>
              <button type="button" onClick={() => setBal(a)} className={`${ghostBtn} mt-2 w-full`} data-testid={`budget-acc-update-${a.id}`}>{L('Neuen Stand eintragen', 'Enter new balance')}</button>
            </li>
          );
        })}
      </ul>
      <button type="button" onClick={() => setEdit({})} className={`${primaryBtn} w-full`} style={{ background: COL }} data-testid="budget-add-account"><Plus size={17} />{L('Konto oder Bargeld', 'Account or cash')}</button>
      {edit && <AccountSheet initial={edit.acc} onClose={() => setEdit(null)} onSaved={say} />}
      {bal && <BalanceSheet acc={bal} onClose={() => setBal(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}
