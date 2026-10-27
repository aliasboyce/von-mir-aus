import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, Minus, Plus } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { ACCENT, accountsRepo, addMonths, budgetSettingsStore, dayLabel, monthRange, notifyBudget, nowIso, ticksRepo, billsRepo, todayStr, ymOf, type Dir } from './budgetModel';
import { catSpend, monthFlows, perDay, potBalance, summarize, tickKey, upcoming, potsPlan, type Flow } from './budgetCalc';
import { MonthBar, card, useBudget, useToast } from './budgetUi';
import { QuickAddSheet } from './BudgetSheets';
import { BudgetFixed } from './BudgetFixed';
import { BudgetBills } from './BudgetBills';
import { BudgetSpend } from './BudgetSpend';
import { BudgetAccounts } from './BudgetAccounts';
import { BudgetPiggy } from './BudgetPiggy';
import { BudgetContracts } from './BudgetContracts';
import { BudgetReview } from './BudgetReview';

const FOLDERS = [
  { key: 'fest', emoji: '💶', color: '#4f9d69' },
  { key: 'rechnungen', emoji: '🧾', color: '#d97762' },
  { key: 'ausgaben', emoji: '🛍️', color: '#e0a030' },
  { key: 'konten', emoji: '🏦', color: '#4a7fb0' },
  { key: 'sparschwein', emoji: '🐷', color: '#d98aa0' },
  { key: 'vertraege', emoji: '📑', color: '#8a6fb8' },
  { key: 'rueckblick', emoji: '📊', color: '#3f8f9b' },
] as const;

export function BudgetPage() {
  const { sub } = useParams();
  if (sub === 'fest') return <BudgetFixed />;
  if (sub === 'rechnungen') return <BudgetBills />;
  if (sub === 'ausgaben') return <BudgetSpend />;
  if (sub === 'konten') return <BudgetAccounts />;
  if (sub === 'sparschwein') return <BudgetPiggy />;
  if (sub === 'vertraege') return <BudgetContracts />;
  if (sub === 'rueckblick') return <BudgetReview />;
  return <BudgetHub />;
}

/** Ein Ordner: Reiter oben links, eigene Farbe, eine Zahl als Vorschau */
function FolderTile({ color, emoji, title, meta, onOpen, testId }: { color: string; emoji: string; title: string; meta: string; onOpen: () => void; testId: string }) {
  return (
    <div className="relative pt-3">
      <div className="absolute top-0 left-3 h-4 w-14 rounded-t-xl" style={{ background: color }} aria-hidden />
      <button type="button" onClick={onOpen} className="w-full min-h-[104px] rounded-[18px] rounded-tl-[6px] px-3.5 py-3 text-left flex flex-col gap-1 active:scale-[0.98] transition-transform" style={{ background: `${color}22`, border: `1.5px solid ${color}66` }} data-testid={testId}>
        <span className="text-[26px] leading-none" aria-hidden>{emoji}</span>
        <span className="text-[15px] leading-tight font-[var(--font-display)]">{title}</span>
        <span className="text-[12px] text-[var(--color-text-muted)] leading-snug">{meta}</span>
      </button>
    </div>
  );
}

function BudgetHub() {
  const { data, L, lang, m } = useBudget();
  const navigate = useNavigate();
  const [ym, setYm] = useState(ymOf(todayStr()));
  const [quick, setQuick] = useState<Dir | null>(null);
  const [toast, say] = useToast();
  const [intro, setIntro] = useState(() => !budgetSettingsStore.get().introSeen);

  const flows = useMemo(() => monthFlows(data, ym), [data, ym]);
  const s = useMemo(() => summarize(flows), [flows]);
  const cs = useMemo(() => catSpend(data, flows), [data, flows]);
  const plan = potsPlan(cs.rows);
  const pd = perDay(s.free, ym);
  const next = useMemo(() => upcoming(data).slice(0, 4), [data]);
  const empty = data.recurring.length + data.bills.length + data.entries.length === 0;
  const [, last] = monthRange(ym);
  const total = Math.max(s.had, s.paid + s.open, 1);
  const potTotal = data.pots.reduce((x, p) => x + potBalance(p), 0);
  const accountList = accountsRepo.getAll();

  const tick = (f: Flow) => {
    if (f.src === 'bill') {
      const b = data.bills.find((x) => x.id === f.ref);
      if (b) { billsRepo.save({ ...b, paid: true, paidAt: nowIso(), updatedAt: nowIso() }); notifyBudget(); say(L('Geschafft – bezahlt. 🌿', 'Done – paid. 🌿')); }
    } else if (f.src === 'rec') {
      ticksRepo.save({ id: tickKey(f.ref, f.date), rid: f.ref, date: f.date, doneAt: nowIso() });
      notifyBudget();
      say(L('Geschafft – abgehakt. 🌿', 'Done – ticked off. 🌿'));
    }
  };
  const meta: Record<(typeof FOLDERS)[number]['key'], string> = {
    fest: L(`${data.recurring.filter((r) => r.dir === 'in').length} Einnahmen · ${data.recurring.filter((r) => r.dir === 'out').length} feste Kosten`, `${data.recurring.filter((r) => r.dir === 'in').length} income · ${data.recurring.filter((r) => r.dir === 'out').length} fixed costs`),
    rechnungen: data.bills.filter((b) => !b.paid).length ? L(`${data.bills.filter((b) => !b.paid).length} offen`, `${data.bills.filter((b) => !b.paid).length} open`) : L('nichts offen', 'nothing open'),
    ausgaben: L(`${m(s.spentEntries)} diesen Monat`, `${m(s.spentEntries)} this month`),
    konten: accountList.length ? L(`${accountList.length} · zusammen ${m(accountList.reduce((x, a) => x + a.balance, 0))}`, `${accountList.length} · together ${m(accountList.reduce((x, a) => x + a.balance, 0))}`) : L('Kontostand, Bargeld', 'balance, cash'),
    sparschwein: L(`${m(potTotal)} gespart`, `${m(potTotal)} saved`),
    vertraege: L(`${data.recurring.filter((r) => r.contract).length} Verträge & Abos`, `${data.recurring.filter((r) => r.contract).length} contracts & subscriptions`),
    rueckblick: L('Woche · Monat · Monate', 'week · month · months'),
  };
  const titles: Record<(typeof FOLDERS)[number]['key'], string> = {
    fest: L('Einnahmen & feste Kosten', 'Income & fixed costs'),
    rechnungen: L('Rechnungen', 'Bills'),
    ausgaben: L('Ausgaben & Töpfe', 'Spending & pots'),
    konten: L('Konten & Bargeld', 'Accounts & cash'),
    sparschwein: L('Sparschwein & Rücklagen', 'Piggy bank & savings'),
    vertraege: L('Verträge & Abos', 'Contracts & subscriptions'),
    rueckblick: L('Rückblicke', 'Reviews'),
  };
  const free = s.free;
  return (
    <div className="pb-28" data-testid="budget-hub">
      <TopBar action={<HelpButton helpKey="budget" />} />
      <div className="px-4 flex flex-col gap-4">
        <div>
          <h1 className="text-[26px]">{L('Budget-Planer', 'Budget planner')}</h1>
          <p className="text-[13.5px] text-[var(--color-text-muted)]">{L('Dein Geld an einem ruhigen Ort. Alles ist freiwillig.', 'Your money in one calm place. Everything is optional.')}</p>
        </div>
        {intro && (
          <div className="rounded-[var(--radius-lg)] px-4 py-3 text-[13.5px] flex gap-3 items-start" style={{ background: 'var(--color-primary-soft)' }} data-testid="budget-intro">
            <p className="flex-1">{L('Du musst nicht alles ausfüllen. Eine einzige Zahl reicht für den Anfang – zum Beispiel, was diesen Monat reinkommt. Die App rechnet den Rest.', 'You do not have to fill everything in. A single number is enough to begin – for example what comes in this month. The app does the rest.')}</p>
            <button type="button" onClick={() => { budgetSettingsStore.set({ ...budgetSettingsStore.get(), introSeen: true }); setIntro(false); }} className="shrink-0 h-10 px-3 rounded-full text-[13px] border border-[var(--color-border-strong)] bg-[var(--color-surface)]" data-testid="budget-intro-ok">{L('Alles klar', 'Got it')}</button>
          </div>
        )}
        <MonthBar ym={ym} onChange={setYm} lang={lang} L={L} />

        <section className={`${card} px-4 py-4`} aria-label={L('Dieser Monat', 'This month')} data-testid="budget-summary">
          <p className="text-[12.5px] text-[var(--color-text-muted)]">{free >= 0 ? L('Übrig', 'Left') : L('Es fehlen', 'Short by')}</p>
          <p className="text-[34px] leading-tight font-[var(--font-display)]" style={{ color: free >= 0 ? ACCENT.free : '#c07a10' }} data-testid="budget-free">{m(Math.abs(free))}</p>
          <div className="flex h-4 rounded-full overflow-hidden my-3 bg-[var(--color-surface-muted)]" role="img" aria-label={L('Verteilung: bezahlt, offen, übrig', 'Split: paid, open, left')} data-testid="budget-stack">
            <div style={{ width: `${(s.paid / total) * 100}%`, background: ACCENT.out }} />
            <div style={{ width: `${(s.open / total) * 100}%`, background: ACCENT.open }} />
            <div style={{ width: `${(Math.max(0, free) / total) * 100}%`, background: ACCENT.free }} />
          </div>
          <dl className="grid grid-cols-3 gap-2 text-[12.5px]">
            <div><dt className="flex items-center gap-1 text-[var(--color-text-muted)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.in }} />{L('Hatte ich', 'Had')}</dt><dd className="text-[16px]" data-testid="budget-had">{m(s.had)}</dd></div>
            <div><dt className="flex items-center gap-1 text-[var(--color-text-muted)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.out }} />{L('Schon bezahlt', 'Paid')}</dt><dd className="text-[16px]" data-testid="budget-paid">{m(s.paid)}</dd></div>
            <div><dt className="flex items-center gap-1 text-[var(--color-text-muted)]"><span className="w-2.5 h-2.5 rounded-full" style={{ background: ACCENT.open }} />{L('Noch offen', 'Open')}</dt><dd className="text-[16px]" data-testid="budget-open">{m(s.open)}</dd></div>
          </dl>
          {s.had > 0 && s.hadGot < s.had && <p className="text-[12px] text-[var(--color-text-faint)] mt-2">{L(`Davon schon da: ${m(s.hadGot)}`, `Already here: ${m(s.hadGot)}`)}</p>}
          {free < 0 && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-2" data-testid="budget-short-note">{L('Das ist ein Hinweis, kein Urteil. Schau, was noch offen ist – manches lässt sich verschieben.', 'This is a hint, not a verdict. Look at what is still open – some of it can be moved.')}</p>}
          {pd && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-2" data-testid="budget-perday">{L(`Bis ${dayLabel(last, lang)} sind das etwa ${m(pd.perDay)} pro Tag.`, `Until ${dayLabel(last, lang)} that is about ${m(pd.perDay)} per day.`)}</p>}
          {plan.planned > 0 && <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{L(`In Töpfen verplant: ${m(plan.planned)} (noch nicht ausgegeben: ${m(plan.stillToSpend)})`, `Planned in pots: ${m(plan.planned)} (not spent yet: ${m(plan.stillToSpend)})`)}</p>}
          {empty && <p className="text-[13px] text-[var(--color-text-muted)] mt-3" data-testid="budget-empty-hint">{L('Fang mit einer Zahl an: Was kommt diesen Monat rein?', 'Start with one number: what comes in this month?')}</p>}
        </section>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" onClick={() => setQuick('out')} className="h-14 rounded-2xl text-white text-[15.5px] inline-flex items-center justify-center gap-2" style={{ background: '#d97762' }} data-testid="budget-quick-out"><Minus size={18} />{L('Ausgabe', 'Spending')}</button>
          <button type="button" onClick={() => setQuick('in')} className="h-14 rounded-2xl text-white text-[15.5px] inline-flex items-center justify-center gap-2" style={{ background: '#4f9d69' }} data-testid="budget-quick-in"><Plus size={18} />{L('Einnahme', 'Income')}</button>
        </div>

        {next.length > 0 && (
          <section aria-label={L('Als Nächstes fällig', 'Due next')} data-testid="budget-next">
            <h2 className="text-[16px] mb-2">{L('Als Nächstes fällig', 'Due next')}</h2>
            <ul className="flex flex-col gap-2">
              {next.map((f) => {
                const late = f.date < todayStr();
                return (
                  <li key={f.id} className={`${card} px-3 py-2 flex items-center gap-3`} style={late ? { borderColor: '#e0a030' } : undefined} data-testid="budget-next-item">
                    <button type="button" onClick={() => tick(f)} className="w-11 h-11 rounded-full border-2 border-[var(--color-text-faint)] shrink-0 flex items-center justify-center" aria-label={L('Abhaken', 'Tick off')} data-testid="budget-next-tick"><Check size={18} className="opacity-30" /></button>
                    <button type="button" onClick={() => navigate(f.src === 'bill' ? '/budget/rechnungen' : '/budget/fest')} className="flex-1 min-w-0 text-left">
                      <span className="block text-[14.5px] truncate">{f.emoji} {f.label}</span>
                      <span className="block text-[12px] text-[var(--color-text-muted)]">{late ? L('schon fällig', 'already due') : dayLabel(f.date, lang)}{f.where ? ` · 📍 ${f.where}` : ''}</span>
                    </button>
                    <span className="text-[14.5px] shrink-0">{m(f.amount)}</span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section aria-label={L('Ordner', 'Folders')}>
          <h2 className="text-[16px] mb-1">{L('Ordner', 'Folders')}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            {FOLDERS.map((f) => <FolderTile key={f.key} color={f.color} emoji={f.emoji} title={titles[f.key]} meta={meta[f.key]} onOpen={() => navigate(`/budget/${f.key}`)} testId={`budget-folder-${f.key}`} />)}
          </div>
        </section>
        <p className="text-[11.5px] text-[var(--color-text-faint)] text-center">{L('Alles bleibt auf diesem Gerät. Passwörter gehören nicht hierher.', 'Everything stays on this device. Passwords do not belong here.')}</p>
      </div>
      {quick && <QuickAddSheet dir={quick} onClose={() => setQuick(null)} onSaved={say} />}
      {toast}
    </div>
  );
}

export { addMonths };
