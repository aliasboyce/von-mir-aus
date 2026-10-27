import { budgetSums, money, newId, type BudgetBlock, type BudgetItem } from '../projectModel';
import { DelBtn, Empty, PersonSelect, SmallLabel, chipCls, chipOn, type BlockProps } from '../ui';
import { useState } from 'react';
import { Link } from 'react-router-dom';

/** Finanzplan: Kosten und Einnahmen, wer zahlt was, Budgetrahmen */
export function BlockBudget({ block, project, L, lang, onChange }: BlockProps<BudgetBlock>) {
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'cost' | 'income'>('cost');
  const sums = budgetSums(block);
  const patch = (id: string, p: Partial<BudgetItem>) => onChange({ ...block, items: block.items.map((i) => (i.id === id ? { ...i, ...p } : i)) });
  const m = (n: number) => money(n, block.currency, lang);
  const add = () => {
    const a = parseFloat(amount.replace(',', '.'));
    if (!label.trim() || !Number.isFinite(a)) return;
    onChange({ ...block, items: [...block.items, { id: newId('b'), label: label.trim(), amount: a, type, paid: false }] });
    setLabel('');
    setAmount('');
  };
  const limit = block.limit && block.limit > 0 ? block.limit : undefined;
  const pct = limit ? Math.min(100, Math.round((sums.cost / limit) * 100)) : 0;
  const over = limit ? sums.cost > limit : false;
  return (
    <div data-testid="budget">
      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] py-2"><p className="text-[11px] text-[var(--color-text-faint)]">{L('Kosten', 'Costs')}</p><p className="text-[14.5px]" data-testid="budget-cost">{m(sums.cost)}</p></div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] py-2"><p className="text-[11px] text-[var(--color-text-faint)]">{L('Einnahmen', 'Income')}</p><p className="text-[14.5px]" data-testid="budget-income">{m(sums.income)}</p></div>
        <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] py-2"><p className="text-[11px] text-[var(--color-text-faint)]">{L('Bleibt übrig', 'Left over')}</p><p className="text-[14.5px]" data-testid="budget-balance">{m(sums.balance)}</p></div>
      </div>
      <div className="flex items-end gap-2 mb-2 flex-wrap">
        <label className="flex-1 min-w-[8rem]"><SmallLabel>{L('Budgetrahmen (optional)', 'Budget limit (optional)')}</SmallLabel>
          <input className="input !h-9 text-[13px]" inputMode="decimal" value={block.limit ?? ''} placeholder="0" onChange={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); onChange({ ...block, limit: Number.isFinite(v) ? v : undefined }); }} data-testid="budget-limit" />
        </label>
        <label className="w-20"><SmallLabel>{L('Währung', 'Currency')}</SmallLabel><input className="input !h-9 text-[13px]" value={block.currency} onChange={(e) => onChange({ ...block, currency: e.target.value.slice(0, 4) })} /></label>
      </div>
      {limit && (
        <div className="mb-3" data-testid="budget-bar">
          <div className="h-2.5 rounded-full overflow-hidden bg-[var(--color-surface-muted)]"><div className="h-full" style={{ width: `${pct}%`, background: over ? 'var(--color-danger)' : 'var(--color-primary)' }} /></div>
          <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{over ? L(`Über dem Rahmen um ${m(sums.cost - limit)}. Das ist ein Hinweis, kein Urteil – du kannst anpassen.`, `${m(sums.cost - limit)} over the limit. This is a hint, not a verdict – you can adjust.`) : L(`${pct} % vom Rahmen. Ein kleiner Puffer ist gut, denn Dinge laufen selten genau nach Plan.`, `${pct}% of the limit. A small buffer is good because things rarely go exactly to plan.`)}</p>
        </div>
      )}
      {block.items.length === 0 && <Empty>{L('Noch keine Posten.', 'No items yet.')}</Empty>}
      <ul className="flex flex-col gap-1.5">
        {block.items.map((i) => (
          <li key={i.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-1.5" data-testid={`bud-${i.id}`}>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => patch(i.id, { type: i.type === 'cost' ? 'income' : 'cost' })} className="text-[15px] w-7 shrink-0" aria-label={L('Kosten oder Einnahme', 'Cost or income')} title={L('Tippen zum Wechseln', 'Tap to switch')}>{i.type === 'cost' ? '➖' : '➕'}</button>
              <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1.5" value={i.label} onChange={(e) => patch(i.id, { label: e.target.value })} aria-label={L('Posten', 'Item')} />
              <input className="bg-transparent outline-none text-[14.5px] w-20 text-right" inputMode="decimal" defaultValue={String(i.amount)} onBlur={(e) => { const v = parseFloat(e.target.value.replace(',', '.')); patch(i.id, { amount: Number.isFinite(v) ? v : 0 }); }} aria-label={L('Betrag', 'Amount')} data-testid={`bud-amount-${i.id}`} />
              <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== i.id) })} L={L} />
            </div>
            <div className="flex items-center gap-2 pl-8 pb-0.5">
              <PersonSelect project={project} value={i.who} onChange={(v) => patch(i.id, { who: v })} L={L} withMe label={i.type === 'cost' ? L('Wer zahlt?', 'Who pays?') : L('Von wem?', 'From whom?')} />
              {i.type === 'cost' && <button type="button" onClick={() => patch(i.id, { paid: !i.paid })} aria-pressed={i.paid} className={chipCls(i.paid)} style={i.paid ? chipOn : undefined}>{i.paid ? L('bezahlt', 'paid') : L('offen', 'open')}</button>}
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2 items-center">
        <button type="button" onClick={() => setType(type === 'cost' ? 'income' : 'cost')} className="text-[15px] w-8 shrink-0" aria-label={L('Kosten oder Einnahme', 'Cost or income')}>{type === 'cost' ? '➖' : '➕'}</button>
        <input className="input flex-1 min-w-0" value={label} placeholder={type === 'cost' ? L('Was kostet etwas …', 'What costs something …') : L('Was kommt rein …', 'What comes in …')} onChange={(e) => setLabel(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} data-testid="bud-new-input" />
        <input className="input !w-20" inputMode="decimal" value={amount} placeholder="0" onChange={(e) => setAmount(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} data-testid="bud-new-amount" />
        <button type="button" onClick={add} disabled={!label.trim() || !amount.trim()} className="h-11 px-3.5 rounded-full text-white disabled:opacity-40 text-[14px]" style={{ background: 'var(--color-primary)' }} data-testid="bud-new-add">+</button>
      </div>
      <p className="text-[12px] text-[var(--color-text-faint)] mt-3" data-testid="budget-planner-note">{L('Das ist nur der Finanzplan dieses Projekts. Dein Geld im Alltag: ', 'This is only this project’s finance plan. Your everyday money: ')}<Link to="/budget" className="underline underline-offset-2 text-[var(--color-primary)]">{L('Budget-Planer', 'Budget planner')}</Link></p>
      {sums.cost > 0 && (
        <div className="mt-4" data-testid="budget-share">
          <SmallLabel>{L('Wer zahlt was', 'Who pays what')}</SmallLabel>
          <ul className="text-[13.5px] flex flex-col gap-0.5">
            {[...sums.perPerson.entries()].map(([who, amt]) => (
              <li key={who || 'none'} className="flex justify-between"><span>{who === '' ? L('noch offen', 'not yet decided') : who === 'me' ? L('Ich', 'Me') : project.people.find((p) => p.id === who)?.name ?? '…'}</span><span>{m(amt)}</span></li>
            ))}
          </ul>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{L('Bezahlt bisher', 'Paid so far')}: {m(sums.paidCost)}</p>
        </div>
      )}
    </div>
  );
}
