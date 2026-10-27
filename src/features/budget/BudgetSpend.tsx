import { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { ACCENT, addMonths, dayLabel, entriesRepo, newId, notifyBudget, nowIso, todayStr, ymOf, monthRange, type Category, type Entry } from './budgetModel';
import { catSpend, monthFlows, potsPlan, summarize } from './budgetCalc';
import { Bar, Empty, MonthBar, SubPage, card, ghostBtn, primaryBtn, useBudget, useToast } from './budgetUi';
import { QuickAddSheet } from './BudgetSheets';
import { CategorySheet } from './BudgetSheets2';

const COL = '#e0a030';

/** Ausgaben & Töpfe: wie viel Geld habe ich wofür – und was ist schon weg */
export function BudgetSpend() {
  const { data, L, lang, m } = useBudget();
  const [ym, setYm] = useState(ymOf(todayStr()));
  const [toast, say] = useToast();
  const [quick, setQuick] = useState<{ dir: 'in' | 'out'; catId?: string; initial?: Entry } | null>(null);
  const [catEdit, setCatEdit] = useState<{ cat?: Category } | null>(null);
  const [filter, setFilter] = useState<string | 'none' | null>(null);
  const flows = useMemo(() => monthFlows(data, ym), [data, ym]);
  const s = summarize(flows);
  const cs = catSpend(data, flows);
  const plan = potsPlan(cs.rows);
  const entries = flows.filter((f) => f.src === 'entry' && (filter === null || (filter === 'none' ? !f.catId : f.catId === filter))).sort((a, b) => b.date.localeCompare(a.date));
  const [from] = monthRange(ym);
  const prevYm = addMonths(ym, -1);
  const prev = summarize(monthFlows(data, prevYm));
  const carryDone = data.entries.some((e) => e.note === `carry:${prevYm}`);
  const canCarry = prev.free > 0 && !carryDone && ym <= ymOf(todayStr());
  const carry = () => {
    entriesRepo.save({ id: newId('bent'), date: from, dir: 'in', amount: Math.round(prev.free * 100) / 100, label: L('Rest vom Vormonat', 'Left over from last month'), note: `carry:${prevYm}`, createdAt: nowIso() });
    notifyBudget();
    say(L('Der Rest ist übernommen.', 'The rest was carried over.'));
  };
  const unplanned = s.free - plan.stillToSpend;
  return (
    <SubPage title={L('Ausgaben & Töpfe', 'Spending & pots')} emoji="🛍️" color={COL} hint={L('Töpfe sind Bereiche mit einem Monatsbudget. Du siehst, wie viel noch drin ist.', 'Pots are areas with a monthly budget. You see how much is still in them.')}>
      <MonthBar ym={ym} onChange={setYm} lang={lang} L={L} />
      <div className="grid grid-cols-2 gap-3">
        <button type="button" onClick={() => setQuick({ dir: 'out' })} className="h-14 rounded-2xl text-white text-[15.5px] inline-flex items-center justify-center gap-2" style={{ background: '#d97762' }} data-testid="budget-spend-out"><Minus size={18} />{L('Ausgabe', 'Spending')}</button>
        <button type="button" onClick={() => setQuick({ dir: 'in' })} className="h-14 rounded-2xl text-white text-[15.5px] inline-flex items-center justify-center gap-2" style={{ background: '#4f9d69' }} data-testid="budget-spend-in"><Plus size={18} />{L('Einnahme', 'Income')}</button>
      </div>

      <section aria-label={L('Töpfe', 'Pots')}>
        <h2 className="text-[16px] mb-2">{L('Töpfe', 'Pots')}</h2>
        <div className="grid grid-cols-2 gap-3" data-testid="budget-pots">
          {cs.rows.map(({ cat, spent, left }) => (
            <div key={cat.id} className="rounded-[20px] px-3 py-3 flex flex-col gap-1.5 text-left" style={{ background: `${cat.color}1f`, border: `1.5px solid ${cat.color}66`, outline: filter === cat.id ? `3px solid ${cat.color}` : 'none', outlineOffset: 1 }} data-testid={`budget-pot-${cat.id}`}>
              <button type="button" onClick={() => setFilter(filter === cat.id ? null : cat.id)} className="text-left flex flex-col gap-1" aria-pressed={filter === cat.id} aria-label={`${cat.label}: ${L('Ausgaben zeigen', 'show spending')}`}>
                <span className="flex items-center gap-2"><span className="text-[22px]" aria-hidden>{cat.emoji}</span><span className="text-[14px] leading-tight">{cat.label}</span></span>
                <span className="text-[17px]" data-testid={`budget-pot-spent-${cat.id}`}>{m(spent)}</span>
              </button>
              {cat.limit ? <><Bar value={spent} max={cat.limit} color={left !== null && left < 0 ? '#c07a10' : cat.color} h={8} /><span className="text-[11.5px] text-[var(--color-text-muted)]">{left !== null && left >= 0 ? L(`noch ${m(left)} von ${m(cat.limit)}`, `${m(left)} of ${m(cat.limit)} left`) : L(`${m(-(left ?? 0))} über dem Topf`, `${m(-(left ?? 0))} over the pot`)}</span></> : <span className="text-[11.5px] text-[var(--color-text-faint)]">{L('kein Monatsbudget', 'no monthly budget')}</span>}
              <span className="flex gap-3 text-[12px]">
                <button type="button" onClick={() => setQuick({ dir: 'out', catId: cat.id })} className="underline underline-offset-2 text-[var(--color-text-muted)] min-h-[32px]" data-testid={`budget-pot-add-${cat.id}`}>{L('+ Ausgabe', '+ spending')}</button>
                <button type="button" onClick={() => setCatEdit({ cat })} className="underline underline-offset-2 text-[var(--color-text-muted)] min-h-[32px]" data-testid={`budget-pot-edit-${cat.id}`}>{L('Ändern', 'Edit')}</button>
              </span>
            </div>
          ))}
          {cs.noCat > 0 && (
            <button type="button" onClick={() => setFilter(filter === 'none' ? null : 'none')} className="rounded-[20px] px-3 py-3 text-left" style={{ background: 'var(--color-surface-muted)', border: '1.5px dashed var(--color-border-strong)', outline: filter === 'none' ? '3px solid var(--color-text-faint)' : 'none' }}>
              <span className="block text-[14px]">{L('Ohne Topf', 'No pot')}</span><span className="block text-[17px]">{m(cs.noCat)}</span>
            </button>
          )}
        </div>
        <button type="button" onClick={() => setCatEdit({})} className={`${ghostBtn} mt-3 w-full`} data-testid="budget-add-pot"><Plus size={16} />{L('Neuer Topf', 'New pot')}</button>
        {plan.planned > 0 && (
          <p className="text-[12.5px] text-[var(--color-text-muted)] mt-2" data-testid="budget-pots-plan">
            {L(`In Töpfen verplant: ${m(plan.planned)}. Davon ist noch nicht ausgegeben: ${m(plan.stillToSpend)}. `, `Planned in pots: ${m(plan.planned)}. Not spent yet: ${m(plan.stillToSpend)}. `)}
            {unplanned >= 0 ? L(`Nach allen Töpfen bleiben ${m(unplanned)} unverplant.`, `After all pots ${m(unplanned)} remain unplanned.`) : L(`Die Töpfe sind ${m(-unplanned)} größer als das, was übrig ist – ein Hinweis, kein Urteil.`, `The pots are ${m(-unplanned)} more than what is left – a hint, not a verdict.`)}
          </p>
        )}
      </section>

      {canCarry && (
        <button type="button" onClick={carry} className={`${ghostBtn} w-full`} data-testid="budget-carry">{L(`Rest vom Vormonat übernehmen (${m(prev.free)})`, `Carry over last month’s rest (${m(prev.free)})`)}</button>
      )}

      <section aria-label={L('Aufgeschrieben', 'Noted')}>
        <h2 className="text-[16px] mb-2 flex items-center justify-between">{L('Aufgeschrieben', 'Noted')}{filter !== null && <button type="button" onClick={() => setFilter(null)} className="text-[12.5px] underline underline-offset-2 font-[var(--font-body)] text-[var(--color-text-muted)]">{L('Alle zeigen', 'Show all')}</button>}</h2>
        {entries.length === 0 && <Empty emoji="📝" text={L('Noch nichts aufgeschrieben. Mit „Ausgabe“ oder „Einnahme“ geht es in wenigen Sekunden.', 'Nothing noted yet. “Spending” or “Income” takes a few seconds.')} />}
        <ul className="flex flex-col gap-2" data-testid="budget-entries">
          {entries.map((f) => {
            const e = data.entries.find((x) => x.id === f.ref);
            const cat = data.cats.find((c) => c.id === f.catId);
            return (
              <li key={f.id}>
                <button type="button" onClick={() => e && setQuick({ dir: e.dir, initial: e })} className={`${card} w-full px-3 py-2.5 flex items-center gap-3 text-left`} data-testid={`budget-entry-${f.ref}`}>
                  <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[19px] shrink-0" style={{ background: `${cat?.color ?? (f.dir === 'in' ? ACCENT.in : '#8a8f98')}26` }} aria-hidden>{f.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] truncate">{f.label}</span>
                    <span className="block text-[12px] text-[var(--color-text-muted)]">{dayLabel(f.date, lang)}{cat ? ` · ${cat.label}` : ''}{f.where ? ` · 📍 ${f.where}` : ''}</span>
                  </span>
                  <span className="text-[15px] shrink-0" style={{ color: f.dir === 'in' ? ACCENT.in : 'var(--color-text)' }}>{f.dir === 'in' ? '+' : '−'}{m(f.amount)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
      {quick && <QuickAddSheet dir={quick.dir} catId={quick.catId} initial={quick.initial} onClose={() => setQuick(null)} onSaved={say} />}
      {catEdit && <CategorySheet initial={catEdit.cat} onClose={() => setCatEdit(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}

export { primaryBtn };
