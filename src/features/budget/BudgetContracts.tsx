import { useState } from 'react';
import { Copy, Plus } from 'lucide-react';
import { GROUP_LABEL, INTERVAL_LABEL, dayLabel, todayStr, type Interval, type Recurring } from './budgetModel';
import { Empty, SubPage, card, primaryBtn, useBudget, useToast } from './budgetUi';
import { RecurringSheet } from './BudgetSheets';

const COL = '#8a6fb8';
export const perMonth = (amount: number, i: Interval) => (i === 'weekly' ? (amount * 52) / 12 : i === 'monthly' ? amount : i === 'quarterly' ? amount / 3 : i === 'halfyear' ? amount / 6 : amount / 12);

/** Verträge & Abos: alles an einem Ort, mit Nummern zum Kopieren und Kündigungsfrist */
export function BudgetContracts() {
  const { data, L, lang, m } = useBudget();
  const [toast, say] = useToast();
  const [edit, setEdit] = useState<{ r?: Recurring } | null>(null);
  const list = data.recurring.filter((r) => r.contract && r.dir === 'out').sort((a, b) => (a.info?.cancelUntil ?? '9999').localeCompare(b.info?.cancelUntil ?? '9999') || a.label.localeCompare(b.label));
  const today = todayStr();
  const monthly = list.filter((r) => !r.paused).reduce((s, r) => s + perMonth(r.amount, r.interval), 0);
  const daysTo = (d: string) => Math.round((new Date(`${d}T12:00:00`).getTime() - new Date(`${today}T12:00:00`).getTime()) / 86400000);
  const soon = list.filter((r) => r.info?.cancelUntil && daysTo(r.info.cancelUntil) >= 0 && daysTo(r.info.cancelUntil) <= 60);
  const copy = async (txt: string) => {
    try { await navigator.clipboard.writeText(txt); say(L('Kopiert.', 'Copied.')); } catch { say(L('Kopieren ging nicht – du kannst die Nummer markieren.', 'Copying did not work – you can select the number.')); }
  };
  const numRow = (label: string, v: string | undefined, id: string) => v ? (
    <div className="flex items-center justify-between gap-2 text-[13px]">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="inline-flex items-center gap-1.5"><span className="select-all" data-testid={id}>{v}</span><button type="button" onClick={() => void copy(v)} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={`${label} ${L('kopieren', 'copy')}`}><Copy size={15} /></button></span>
    </div>
  ) : null;
  return (
    <SubPage title={L('Verträge & Abos', 'Contracts & subscriptions')} emoji="📑" color={COL} hint={L('Handy, Internet, Versicherungen, Streaming … mit Kundennummer und Kündigungsfrist. Nummern kannst du mit einem Tipp kopieren.', 'Phone, internet, insurance, streaming … with customer number and cancellation deadline. Copy numbers with one tap.')}>
      <div className="rounded-[var(--radius-lg)] px-4 py-3 flex items-center justify-between" style={{ background: `${COL}18` }} data-testid="budget-contracts-sum">
        <span className="text-[13px] text-[var(--color-text-muted)]">{L('Das kostet zusammen etwa pro Monat', 'Together about per month')}</span>
        <span className="text-[22px] font-[var(--font-display)]" data-testid="budget-contracts-monthly">{m(monthly)}</span>
      </div>
      {soon.length > 0 && (
        <div className="rounded-[var(--radius-lg)] px-4 py-3 text-[13.5px]" style={{ background: '#e0a03022', border: '1.5px solid #e0a03088' }} data-testid="budget-contracts-soon">
          <p className="mb-1">✂️ {L('Bald kündbar – falls du etwas nicht mehr brauchst:', 'Cancellable soon – in case you no longer need something:')}</p>
          <ul>{soon.map((r) => <li key={r.id}>{r.emoji} {r.label} – {L('bis', 'by')} {dayLabel(r.info?.cancelUntil, lang)} ({L(`in ${daysTo(r.info!.cancelUntil!)} Tagen`, `in ${daysTo(r.info!.cancelUntil!)} days`)})</li>)}</ul>
        </div>
      )}
      <button type="button" onClick={() => setEdit({})} className={`${primaryBtn} w-full`} style={{ background: COL }} data-testid="budget-add-contract"><Plus size={17} />{L('Vertrag oder Abo', 'Contract or subscription')}</button>
      {list.length === 0 && <Empty emoji="📑" text={L('Noch nichts eingetragen. Fang mit einem Abo an, das dir einfällt – zum Beispiel Streaming oder dein Handy.', 'Nothing yet. Start with one subscription that comes to mind – streaming or your phone, for example.')} />}
      <ul className="flex flex-col gap-3">
        {list.map((r) => (
          <li key={r.id} className={`${card} px-3.5 py-3 ${r.paused ? 'opacity-55' : ''}`} style={{ borderTop: `5px solid ${COL}` }} data-testid={`budget-contract-${r.id}`}>
            <button type="button" onClick={() => setEdit({ r })} className="w-full flex items-center gap-3 text-left" data-testid={`budget-contract-edit-${r.id}`}>
              <span className="text-[26px]" aria-hidden>{r.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15.5px] truncate">{r.label}{r.paused ? ` · ${L('pausiert', 'paused')}` : ''}</span>
                <span className="block text-[12px] text-[var(--color-text-muted)]">{GROUP_LABEL[r.group][2]} {r.info?.provider ? `${r.info.provider} · ` : ''}{L(INTERVAL_LABEL[r.interval][0], INTERVAL_LABEL[r.interval][1])}</span>
              </span>
              <span className="text-[16px]">{r.amount > 0 ? m(r.amount) : L('frei', 'free')}</span>
            </button>
            <div className="flex flex-col gap-0.5 mt-2">
              {numRow(L('Kundennummer', 'Customer no.'), r.info?.customerNo, `budget-contract-cust-${r.id}`)}
              {numRow(L('Vertragsnummer', 'Contract no.'), r.info?.contractNo, `budget-contract-no-${r.id}`)}
              {r.info?.cancelUntil && <p className="text-[13px] text-[var(--color-text-muted)]">✂️ {L('Kündbar bis', 'Cancel by')} {dayLabel(r.info.cancelUntil, lang, true)}</p>}
              {r.info?.keptAt && <p className="text-[13px] text-[var(--color-text-muted)]">📍 {L('Unterlagen', 'Papers')}: {r.info.keptAt}</p>}
              {r.info?.note && <p className="text-[13px] text-[var(--color-text-muted)]">📝 {r.info.note}</p>}
            </div>
          </li>
        ))}
      </ul>
      {edit && <RecurringSheet dir="out" initial={edit.r} contractMode onClose={() => setEdit(null)} onSaved={say} />}
      {toast}
    </SubPage>
  );
}
