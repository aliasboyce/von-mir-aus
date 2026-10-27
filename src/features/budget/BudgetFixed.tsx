import { useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { addMonths, GROUP_LABEL, INTERVAL_LABEL, ticksRepo, todayStr, ymOf, notifyBudget, nowIso, type Dir, type Group, type Recurring, ACCENT } from './budgetModel';
import { monthFlows, occurrences, summarize, tickKey } from './budgetCalc';
import { monthRange } from './budgetModel';
import { Empty, MonthBar, SubPage, card, primaryBtn, useBudget, useToast } from './budgetUi';
import { RecurringSheet, TickSheet } from './BudgetSheets';

/** Einnahmen & feste Kosten – ein Monat, alles zum Abhaken */
export function BudgetFixed() {
  const { data, L, lang, m } = useBudget();
  const [ym, setYm] = useState(ymOf(todayStr()));
  const [toast, say] = useToast();
  const [edit, setEdit] = useState<{ dir: Dir; r?: Recurring } | null>(null);
  const [tickFor, setTickFor] = useState<{ r: Recurring; date: string } | null>(null);
  const [a, b] = monthRange(ym);
  const tickMap = new Map(data.ticks.map((t) => [t.id, t]));
  const ins = data.recurring.filter((r) => r.dir === 'in').sort((x, y) => x.day - y.day);
  const outs = data.recurring.filter((r) => r.dir === 'out');
  const sum = summarize(monthFlows(data, ym).filter((f) => f.src === 'rec'));
  const quick = (r: Recurring, date: string) => {
    const k = tickKey(r.id, date);
    if (tickMap.has(k)) ticksRepo.remove(k);
    else ticksRepo.save({ id: k, rid: r.id, date, doneAt: nowIso() });
    notifyBudget();
    if (!tickMap.has(k)) say(r.dir === 'in' ? L('Schön, das Geld ist da.', 'Nice, the money is here.') : L('Geschafft – abgehakt.', 'Done – ticked off.'));
  };
  const row = (r: Recurring) => {
    const dates = occurrences(r, a, b);
    return (
      <li key={r.id} className={`${card} px-3 py-2.5 ${r.paused ? 'opacity-55' : ''}`} data-testid={`budget-rec-${r.id}`}>
        <button type="button" onClick={() => setEdit({ dir: r.dir, r })} className="w-full flex items-center gap-3 text-left" data-testid={`budget-rec-edit-${r.id}`}>
          <span className="w-10 h-10 rounded-2xl flex items-center justify-center text-[20px] shrink-0" style={{ background: r.dir === 'in' ? '#4f9d6922' : '#d9776222' }} aria-hidden>{r.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-[15px] truncate">{r.label}{r.paused ? ` · ${L('pausiert', 'paused')}` : ''}</span>
            <span className="block text-[12px] text-[var(--color-text-muted)]">{L(INTERVAL_LABEL[r.interval][0], INTERVAL_LABEL[r.interval][1])}{r.interval === 'monthly' ? `, ${L('am', 'on the')} ${r.day}.` : ''}{r.cal ? ' · 📅' : ''}</span>
          </span>
          <span className="text-[15px] shrink-0" style={{ color: r.dir === 'in' ? ACCENT.in : 'var(--color-text)' }}>{r.dir === 'in' ? '+' : ''}{m(r.amount)}</span>
        </button>
        {dates.length > 0 && (
          <div className="flex gap-2 flex-wrap mt-2 pl-[3.25rem]">
            {dates.map((d) => {
              const t = tickMap.get(tickKey(r.id, d));
              return (
                <span key={d} className="inline-flex items-center rounded-full border" style={{ borderColor: t ? (r.dir === 'in' ? ACCENT.in : '#d97762') : 'var(--color-border-strong)', background: t ? (r.dir === 'in' ? '#4f9d6922' : '#d9776222') : 'transparent' }}>
                  <button type="button" onClick={() => quick(r, d)} className="h-9 pl-2.5 pr-2 inline-flex items-center gap-1.5 text-[13px]" aria-pressed={!!t} aria-label={`${r.label} ${d.slice(8)}.`} data-testid={`budget-rec-tick-${r.id}-${d}`}>
                    <span className="w-5 h-5 rounded-full border flex items-center justify-center" style={{ borderColor: t ? (r.dir === 'in' ? ACCENT.in : '#d97762') : 'var(--color-text-faint)', background: t ? (r.dir === 'in' ? ACCENT.in : '#d97762') : 'transparent' }}>{t && <Check size={13} color="#fff" />}</span>
                    {d.slice(8)}.{d.slice(5, 7)}. {t ? (r.dir === 'in' ? L('da', 'in') : L('bezahlt', 'paid')) : (r.dir === 'in' ? L('noch nicht da', 'not yet') : L('offen', 'open'))}
                  </button>
                  <button type="button" onClick={() => setTickFor({ r, date: d })} className="h-9 pr-2.5 pl-1 text-[12px] text-[var(--color-text-muted)] underline underline-offset-2" data-testid={`budget-rec-amt-${r.id}-${d}`}>{t?.amount !== undefined ? m(t.amount) : L('Betrag', 'amount')}</button>
                </span>
              );
            })}
          </div>
        )}
        {dates.length === 0 && !r.paused && <p className="text-[12px] text-[var(--color-text-faint)] mt-1 pl-[3.25rem]">{L('In diesem Monat nicht fällig.', 'Not due this month.')}</p>}
      </li>
    );
  };
  const groups = (Object.keys(GROUP_LABEL) as Group[]).filter((g) => g !== 'income');
  return (
    <SubPage title={L('Einnahmen & feste Kosten', 'Income & fixed costs')} emoji="💶" color="#4f9d69" hint={L('Was jeden Monat kommt und geht. Einmal eintragen, dann nur noch abhaken.', 'What comes and goes regularly. Enter once, then just tick off.')}>
      <MonthBar ym={ym} onChange={setYm} lang={lang} L={L} />
      <div className="grid grid-cols-2 gap-2 text-center" data-testid="budget-fixed-sums">
        <div className="rounded-[var(--radius-md)] py-2.5" style={{ background: '#4f9d6922' }}><p className="text-[11.5px] text-[var(--color-text-muted)]">{L('Kommt rein', 'Comes in')}</p><p className="text-[17px]" data-testid="budget-fixed-in">{m(sum.had)}</p></div>
        <div className="rounded-[var(--radius-md)] py-2.5" style={{ background: '#d9776222' }}><p className="text-[11.5px] text-[var(--color-text-muted)]">{L('Geht raus (fest)', 'Goes out (fixed)')}</p><p className="text-[17px]" data-testid="budget-fixed-out">{m(sum.paid + sum.open)}</p></div>
      </div>

      <section aria-label={L('Einnahmen', 'Income')}>
        <h2 className="text-[16px] mb-2 flex items-center gap-2"><span aria-hidden>💰</span>{L('Einnahmen', 'Income')}</h2>
        {ins.length === 0 && <Empty emoji="🌱" text={L('Hier kommt zum Beispiel Gehalt, Arbeitslosengeld oder Kindergeld hin.', 'Put salary, unemployment benefit or child benefit here, for example.')} />}
        <ul className="flex flex-col gap-2">{ins.map(row)}</ul>
        <button type="button" onClick={() => setEdit({ dir: 'in' })} className={`${primaryBtn} mt-2 w-full`} style={{ background: ACCENT.in }} data-testid="budget-add-income"><Plus size={17} />{L('Feste Einnahme', 'Regular income')}</button>
      </section>

      <section aria-label={L('Feste Kosten', 'Fixed costs')} className="mt-3">
        <h2 className="text-[16px] mb-2 flex items-center gap-2"><span aria-hidden>📌</span>{L('Feste Kosten', 'Fixed costs')}</h2>
        {outs.length === 0 && <Empty emoji="🏠" text={L('Miete, Strom, Handy, Abos … alles, was regelmäßig abgeht.', 'Rent, electricity, phone, subscriptions … everything that leaves regularly.')} />}
        {groups.map((g) => {
          const list = outs.filter((r) => r.group === g).sort((x, y) => x.day - y.day);
          if (list.length === 0) return null;
          return (
            <div key={g} className="mb-3">
              <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5 flex items-center gap-1.5"><span aria-hidden>{GROUP_LABEL[g][2]}</span>{L(GROUP_LABEL[g][0], GROUP_LABEL[g][1])}</p>
              <ul className="flex flex-col gap-2">{list.map(row)}</ul>
            </div>
          );
        })}
        <button type="button" onClick={() => setEdit({ dir: 'out' })} className={`${primaryBtn} mt-1 w-full`} style={{ background: '#d97762' }} data-testid="budget-add-fixed"><Plus size={17} />{L('Fester Posten', 'Fixed cost')}</button>
      </section>
      {edit && <RecurringSheet dir={edit.dir} initial={edit.r} month={ym} onClose={() => setEdit(null)} onSaved={say} />}
      {tickFor && <TickSheet r={tickFor.r} date={tickFor.date} tick={tickMap.get(tickKey(tickFor.r.id, tickFor.date))} onClose={() => setTickFor(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}

export { addMonths };
