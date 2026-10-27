import { useEffect, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { billsRepo, dayLabel, notifyBudget, nowIso, todayStr, type Bill } from './budgetModel';
import { ownMediaUrl } from '../../services/mediaStore';
import { Empty, SubPage, card, primaryBtn, useBudget, useToast } from './budgetUi';
import { BillSheet } from './BudgetSheets';

const COL = '#d97762';

function Thumb({ id }: { id: string }) {
  const [u, setU] = useState<string | null>(null);
  useEffect(() => { let a = true; void ownMediaUrl(id).then((x) => a && setU(x)); return () => { a = false; }; }, [id]);
  return u ? <img src={u} alt="" className="w-10 h-10 rounded-lg object-cover border border-[var(--color-border)] shrink-0" /> : null;
}

/** Rechnungen: bis wann, bezahlt oder offen, wo sie liegt */
export function BudgetBills() {
  const { data, L, lang, m } = useBudget();
  const [toast, say] = useToast();
  const [edit, setEdit] = useState<{ bill?: Bill } | null>(null);
  const [showPaid, setShowPaid] = useState(false);
  const today = todayStr();
  const open = data.bills.filter((b) => !b.paid).sort((a, b) => a.due.localeCompare(b.due));
  const paid = data.bills.filter((b) => b.paid).sort((a, b) => (b.paidAt ?? b.due).localeCompare(a.paidAt ?? a.due));
  const openSum = open.reduce((s, b) => s + b.amount, 0);
  const toggle = (b: Bill) => {
    billsRepo.save({ ...b, paid: !b.paid, paidAt: !b.paid ? nowIso() : undefined, updatedAt: nowIso() });
    notifyBudget();
    if (!b.paid) say(L('Geschafft – bezahlt. 🌿', 'Done – paid. 🌿'));
  };
  const row = (b: Bill) => {
    const late = !b.paid && b.due < today;
    return (
      <li key={b.id} className={`${card} px-3 py-2.5 flex items-center gap-3`} style={late ? { borderColor: '#e0a030', background: '#e0a03012' } : undefined} data-testid={`budget-bill-${b.id}`}>
        <button type="button" onClick={() => toggle(b)} className="w-11 h-11 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: b.paid ? COL : 'var(--color-text-faint)', background: b.paid ? COL : 'transparent' }} aria-pressed={b.paid} aria-label={b.paid ? L('Wieder auf offen', 'Mark open again') : L('Als bezahlt abhaken', 'Tick off as paid')} data-testid={`budget-bill-tick-${b.id}`}>
          {b.paid && <Check size={20} color="#fff" />}
        </button>
        <button type="button" onClick={() => setEdit({ bill: b })} className="flex-1 min-w-0 text-left flex items-center gap-2.5" data-testid={`budget-bill-edit-${b.id}`}>
          {b.photo && <Thumb id={b.photo} />}
          <span className="min-w-0 flex-1">
            <span className={`block text-[15px] truncate ${b.paid ? 'line-through text-[var(--color-text-muted)]' : ''}`}>{b.emoji ?? '🧾'} {b.title}</span>
            <span className="block text-[12px] text-[var(--color-text-muted)]">
              {b.paid ? L('bezahlt', 'paid') : late ? L(`seit ${dayLabel(b.due, lang)} offen – das kommt vor`, `open since ${dayLabel(b.due, lang)} – it happens`) : L(`bis ${dayLabel(b.due, lang)}`, `by ${dayLabel(b.due, lang)}`)}
              {b.where ? ` · 📍 ${b.where}` : ''}{b.cal && !b.paid ? ' · 📅' : ''}
            </span>
          </span>
        </button>
        <span className="text-[15px] shrink-0">{m(b.amount)}</span>
      </li>
    );
  };
  return (
    <SubPage title={L('Rechnungen', 'Bills')} emoji="🧾" color={COL} hint={L('Alles, was noch bezahlt werden muss – mit Foto und dem Ort, wo sie liegt.', 'Everything still to be paid – with a photo and where it is kept.')}>
      <div className="rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-between" style={{ background: `${COL}18` }} data-testid="budget-bills-sum">
        <span className="text-[13px] text-[var(--color-text-muted)]">{L('Noch offen', 'Still open')} · {open.length}</span>
        <span className="text-[22px] font-[var(--font-display)]" data-testid="budget-bills-open">{m(openSum)}</span>
      </div>
      <button type="button" onClick={() => setEdit({})} className={`${primaryBtn} w-full`} style={{ background: COL }} data-testid="budget-add-bill"><Plus size={17} />{L('Neue Rechnung', 'New bill')}</button>
      {open.length === 0 && <Empty emoji="🌿" text={L('Nichts offen. Neue Rechnungen trägst du oben ein – am besten gleich, wenn sie da sind.', 'Nothing open. Add new bills above – ideally right when they arrive.')} />}
      <ul className="flex flex-col gap-2">{open.map(row)}</ul>
      {paid.length > 0 && (
        <div>
          <button type="button" onClick={() => setShowPaid((v) => !v)} className="text-[13.5px] underline underline-offset-2 text-[var(--color-text-muted)]" data-testid="budget-bills-paid-toggle">{showPaid ? L('Bezahlte ausblenden', 'Hide paid') : L(`Bezahlte zeigen (${paid.length})`, `Show paid (${paid.length})`)}</button>
          {showPaid && <ul className="flex flex-col gap-2 mt-2">{paid.map(row)}</ul>}
        </div>
      )}
      {edit && <BillSheet initial={edit.bill} onClose={() => setEdit(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}
