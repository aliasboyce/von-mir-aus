import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { deleteOwnMedia } from '../../services/mediaStore';
import {
  FIXED_SUGGESTIONS, GROUP_LABEL, INCOME_SUGGESTIONS, INTERVAL_LABEL, SUBSCRIPTION_SUGGESTIONS, BILL_SUGGESTIONS, accountsRepo, addDays, billsRepo, entriesRepo, monthName, newId, notifyBudget, nowIso, recurringRepo, ticksRepo, todayStr,
  type Bill, type Dir, type Entry, type Group, type Interval, type Recurring, type Suggest,
} from './budgetModel';
import { tickKey } from './budgetCalc';
import { AmountField, ChipRow, DateField, DeleteButton, EmojiRow, Field, PhotoField, RemindField, TextField, WhereField, ghostBtn, pill, primaryBtn, useBudget } from './budgetUi';

/** Ein Betrag, ein Satz, fertig – für Einzel-Ausgaben und -Einnahmen */
export function QuickAddSheet({ dir, onClose, onSaved, catId: startCat, date: startDate, initial }: { dir: Dir; onClose: () => void; onSaved: (msg: string) => void; catId?: string; date?: string; initial?: Entry }) {
  const { data, L, cur, m } = useBudget();
  const [amount, setAmount] = useState<number | undefined>(initial?.amount);
  const [label, setLabel] = useState(initial?.label ?? '');
  const [catId, setCatId] = useState<string | undefined>(initial?.catId ?? startCat);
  const [more, setMore] = useState(!!initial);
  const [where, setWhere] = useState(initial?.where ?? '');
  const [date, setDate] = useState(initial?.date ?? startDate ?? todayStr());
  const [accountId, setAccountId] = useState<string | undefined>(initial?.accountId);
  const accounts = accountsRepo.getAll();
  const cat = data.cats.find((c) => c.id === catId);
  const out = dir === 'out';
  const save = () => {
    if (!amount || amount <= 0) return;
    entriesRepo.save({ id: initial?.id ?? newId('bent'), date, dir, amount, label: label.trim() || cat?.label || (out ? L('Ausgabe', 'Spending') : L('Einnahme', 'Income')), catId: out ? catId : undefined, accountId, where: where.trim() || undefined, note: initial?.note, createdAt: initial?.createdAt ?? nowIso() });
    notifyBudget();
    onSaved(out ? L(`${m(amount)} aufgeschrieben.`, `${m(amount)} noted.`) : L(`${m(amount)} ist dabei.`, `${m(amount)} added.`));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={out ? L('Etwas ausgegeben', 'Spent something') : L('Etwas bekommen', 'Got something')}>
      <div className="flex flex-col gap-3" data-testid="budget-quick">
        <AmountField big autoFocus value={amount} onChange={setAmount} testId="budget-quick-amount" cur={cur} />
        {out && (
          <div>
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Wofür? (freiwillig)', 'What for? (optional)')}</span>
            <div className="flex gap-1.5 flex-wrap">
              {data.cats.map((c) => (
                <button key={c.id} type="button" onClick={() => setCatId(catId === c.id ? undefined : c.id)} className={pill(catId === c.id)} style={catId === c.id ? { background: c.color } : undefined} data-testid={`budget-quick-cat-${c.id}`}>{c.emoji} {c.label}</button>
              ))}
            </div>
          </div>
        )}
        <TextField value={label} onChange={setLabel} label={out ? L('Wo oder was? (freiwillig)', 'Where or what? (optional)') : L('Von wem oder was? (freiwillig)', 'From whom or what? (optional)')} placeholder={out ? L('z. B. Supermarkt', 'e.g. supermarket') : L('z. B. Geschenk, Verkauf', 'e.g. gift, sale')} testId="budget-quick-label" />
        {!more ? (
          <button type="button" onClick={() => setMore(true)} className="self-start text-[13px] underline underline-offset-2 text-[var(--color-primary)]" data-testid="budget-quick-more">{L('Mehr: Datum, Ort, Konto …', 'More: date, place, account …')}</button>
        ) : (
          <div className="flex flex-col gap-3">
            <DateField value={date} onChange={setDate} label={L('Datum', 'Date')} testId="budget-quick-date" />
            {out && <WhereField value={where} onChange={setWhere} label={L('Wo ist der Beleg oder das Gekaufte jetzt?', 'Where is the receipt or the thing you bought now?')} L={L} testId="budget-quick-where" />}
            {accounts.length > 0 && (
              <Field label={L('Von welchem Konto?', 'From which account?')}>
                <select className="input" value={accountId ?? ''} onChange={(e) => setAccountId(e.target.value || undefined)}>
                  <option value="">{L('egal', 'doesn’t matter')}</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.emoji} {a.name}</option>)}
                </select>
              </Field>
            )}
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center">
          <button type="button" onClick={save} disabled={!amount || amount <= 0} className={primaryBtn} style={{ background: out ? '#d97762' : '#4f9d69' }} data-testid="budget-quick-save">{initial ? L('Speichern', 'Save') : L('Aufschreiben', 'Note it down')}</button>
          {initial && <DeleteButton onDelete={() => { entriesRepo.remove(initial.id); notifyBudget(); onSaved(L('Gelöscht.', 'Deleted.')); onClose(); }} L={L} testId="budget-quick-delete" />}
        </div>
      </div>
    </Modal>
  );
}

const WEEKDAYS: [string, string][] = [['Mo', 'Mon'], ['Di', 'Tue'], ['Mi', 'Wed'], ['Do', 'Thu'], ['Fr', 'Fri'], ['Sa', 'Sat'], ['So', 'Sun']];

/** Feste Einnahme / fester Posten / Vertrag / Abo */
export function RecurringSheet({ dir, initial, contractMode, onClose, onSaved, month }: { dir: Dir; initial?: Recurring; contractMode?: boolean; onClose: () => void; onSaved: (msg: string) => void; month?: string }) {
  const { L, lang, cur, m } = useBudget();
  const isIn = dir === 'in';
  const [label, setLabel] = useState(initial?.label ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? (isIn ? '💰' : '📌'));
  const [group, setGroup] = useState<Group>(initial?.group ?? (isIn ? 'income' : contractMode ? 'subscription' : 'other'));
  const [amount, setAmount] = useState<number | undefined>(initial?.amount);
  const [interval, setInterval] = useState<Interval>(initial?.interval ?? 'monthly');
  const [day, setDay] = useState<number>(initial?.day ?? 1);
  const [mon, setMon] = useState<number>(initial?.month ?? new Date().getMonth() + 1);
  const [from, setFrom] = useState(initial ? initial.from ?? '' : `${month ?? todayStr().slice(0, 7)}-01`);
  const [to, setTo] = useState(initial?.to ?? '');
  const [cal, setCal] = useState(!!initial?.cal);
  const [remind, setRemind] = useState<number | null | undefined>(initial?.remind ?? 1440);
  const [contract, setContract] = useState(!!(initial?.contract ?? contractMode));
  const [info, setInfo] = useState(initial?.info ?? {});
  const [note, setNote] = useState(initial?.note ?? '');
  const [more, setMore] = useState(!!(initial?.from || initial?.to || initial?.note));
  const [scope, setScope] = useState<'from' | 'all'>('from');
  const sugg: Suggest[] = isIn ? INCOME_SUGGESTIONS : contractMode ? [...SUBSCRIPTION_SUGGESTIONS, ...FIXED_SUGGESTIONS.filter((s) => s.contract)] : [...FIXED_SUGGESTIONS, ...SUBSCRIPTION_SUGGESTIONS.slice(0, 4)];
  const pickSugg = (s: Suggest) => {
    setLabel(L(s.label[0], s.label[1]));
    setEmoji(s.emoji);
    setGroup(s.group);
    if (s.interval) setInterval(s.interval);
    if (s.day) setDay(s.day);
    if (s.contract) setContract(true);
  };
  const amountChanged = !!initial && amount !== undefined && Math.abs(amount - initial.amount) > 0.001;
  const canSave = !!label.trim() && (amount !== undefined || (contract && !isIn));
  const save = () => {
    if (!canSave) return;
    const now = nowIso();
    const info2 = contract ? { ...info } : initial?.info;
    const base: Recurring = {
      id: initial?.id ?? newId('brec'), dir, group, label: label.trim(), emoji, amount: amount ?? 0, interval, day: interval === 'weekly' ? Math.min(7, Math.max(1, day)) : Math.min(31, Math.max(1, day)),
      month: interval === 'monthly' || interval === 'weekly' ? undefined : mon, from: from || undefined, to: to || undefined, cal, remind: cal ? remind ?? null : null, paused: initial?.paused,
      info: info2, contract, note: note.trim() || undefined, createdAt: initial?.createdAt ?? now, updatedAt: now,
    };
    if (initial && amountChanged && scope === 'from') {
      // ältere Monate behalten den alten Betrag: der alte Posten endet vor diesem Monat, ein neuer beginnt
      const start = `${month ?? todayStr().slice(0, 7)}-01`;
      if (!initial.from || initial.from < start) {
        recurringRepo.save({ ...initial, to: addDays(start, -1), updatedAt: now });
        recurringRepo.save({ ...base, id: newId('brec'), from: start, createdAt: now });
        notifyBudget();
        onSaved(L('Gespeichert – ältere Monate bleiben wie sie waren.', 'Saved – older months stay as they were.'));
        onClose();
        return;
      }
    }
    recurringRepo.save(base);
    notifyBudget();
    onSaved(L('Gespeichert.', 'Saved.'));
    onClose();
  };
  const remove = () => {
    if (!initial) return;
    recurringRepo.remove(initial.id);
    ticksRepo.getAll().filter((t) => t.rid === initial.id).forEach((t) => ticksRepo.remove(t.id));
    notifyBudget();
    onSaved(L('Gelöscht.', 'Deleted.'));
    onClose();
  };
  const title = initial ? (isIn ? L('Einnahme ändern', 'Change income') : contractMode || initial.contract ? L('Vertrag ändern', 'Change contract') : L('Fester Posten ändern', 'Change fixed cost')) : isIn ? L('Neue feste Einnahme', 'New regular income') : contractMode ? L('Neuer Vertrag oder Abo', 'New contract or subscription') : L('Neuer fester Posten', 'New fixed cost');
  return (
    <Modal open onClose={onClose} title={title}>
      <div className="flex flex-col gap-3" data-testid="budget-rec-sheet">
        {!initial && (
          <div>
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Vorschläge – antippen und anpassen', 'Ideas – tap and adjust')}</span>
            <div className="flex gap-1.5 flex-wrap max-h-[7.5rem] overflow-y-auto">
              {sugg.map((s) => (
                <button key={s.label[0]} type="button" onClick={() => pickSugg(s)} className={pill(label === L(s.label[0], s.label[1]))} style={label === L(s.label[0], s.label[1]) ? { background: 'var(--color-primary)' } : undefined} data-testid={`budget-rec-sug-${s.label[0]}`}>{s.emoji} {L(s.label[0], s.label[1])}</button>
              ))}
            </div>
          </div>
        )}
        <TextField value={label} onChange={setLabel} label={L('Wie heißt es?', 'What is it called?')} placeholder={isIn ? L('z. B. Gehalt', 'e.g. salary') : L('z. B. Miete', 'e.g. rent')} testId="budget-rec-label" />
        <AmountField value={amount} onChange={setAmount} label={contract && !isIn ? L('Betrag (leer lassen, wenn es nichts kostet)', 'Amount (leave empty if free)') : L('Betrag', 'Amount')} testId="budget-rec-amount" cur={cur} />
        {amountChanged && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5 text-[13px]" data-testid="budget-rec-scope">
            <p className="mb-1.5">{L('Der Betrag ist anders als vorher. Wofür gilt er?', 'The amount differs from before. Which months does it apply to?')}</p>
            <ChipRow value={scope} onChange={setScope} options={[{ v: 'from' as const, label: L('Ab diesem Monat', 'From this month') }, { v: 'all' as const, label: L('Auch rückwirkend', 'Also for past months') }]} testId="budget-rec-scope" />
            <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{L(`Vorher: ${m(initial?.amount ?? 0)}`, `Before: ${m(initial?.amount ?? 0)}`)}</p>
          </div>
        )}
        <div>
          <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Wie oft?', 'How often?')}</span>
          <ChipRow value={interval} onChange={setInterval} options={(Object.keys(INTERVAL_LABEL) as Interval[]).map((v) => ({ v, label: L(INTERVAL_LABEL[v][0], INTERVAL_LABEL[v][1]) }))} testId="budget-rec-int" />
        </div>
        {interval === 'weekly' ? (
          <div>
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('An welchem Tag?', 'On which day?')}</span>
            <ChipRow value={Math.min(7, Math.max(1, day))} onChange={setDay} options={WEEKDAYS.map((w, i) => ({ v: i + 1, label: L(w[0], w[1]) }))} testId="budget-rec-wd" />
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="w-28 shrink-0">
              <Field label={L('Am wievielten?', 'On which day?')}>
                <input className="input" type="number" min={1} max={31} value={day} onChange={(e) => setDay(Number(e.target.value) || 1)} data-testid="budget-rec-day" />
              </Field>
            </div>
            {interval !== 'monthly' && (
              <div className="flex-1">
                <Field label={L('In welchem Monat?', 'In which month?')} hint={interval === 'yearly' ? undefined : L('erster Monat des Rhythmus', 'first month of the cycle')}>
                  <select className="input" value={mon} onChange={(e) => setMon(Number(e.target.value))} data-testid="budget-rec-month">
                    {Array.from({ length: 12 }, (_, i) => <option key={i} value={i + 1}>{monthName(`2026-${String(i + 1).padStart(2, '0')}`, lang).replace(/\s*\d{4}$/, '')}</option>)}
                  </select>
                </Field>
              </div>
            )}
          </div>
        )}
        {!isIn && (
          <div>
            <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Zu welcher Gruppe?', 'Which group?')}</span>
            <div className="flex gap-1.5 flex-wrap">
              {(Object.keys(GROUP_LABEL) as Group[]).filter((g) => g !== 'income').map((g) => (
                <button key={g} type="button" onClick={() => setGroup(g)} className={pill(group === g)} style={group === g ? { background: 'var(--color-primary)' } : undefined}>{GROUP_LABEL[g][2]} {L(GROUP_LABEL[g][0], GROUP_LABEL[g][1])}</button>
              ))}
            </div>
          </div>
        )}
        <EmojiRow value={emoji} onChange={setEmoji} L={L} />
        <RemindField value={remind} onChange={setRemind} cal={cal} onCal={setCal} L={L} testId="budget-rec-remind" />
        {!isIn && (
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5">
            <label className="flex items-center gap-2 text-[14px]">
              <input type="checkbox" checked={contract} onChange={(e) => setContract(e.target.checked)} className="w-5 h-5" data-testid="budget-rec-contract" />
              {L('Das ist ein Vertrag oder Abo', 'This is a contract or subscription')}
            </label>
            {contract && (
              <div className="flex flex-col gap-2.5 mt-3" data-testid="budget-rec-info">
                <TextField value={info.provider} onChange={(v) => setInfo({ ...info, provider: v })} label={L('Anbieter / Firma', 'Provider / company')} testId="budget-info-provider" />
                <TextField value={info.customerNo} onChange={(v) => setInfo({ ...info, customerNo: v })} label={L('Kundennummer', 'Customer number')} testId="budget-info-customer" />
                <TextField value={info.contractNo} onChange={(v) => setInfo({ ...info, contractNo: v })} label={L('Vertragsnummer', 'Contract number')} testId="budget-info-contractno" />
                <DateField value={info.start} onChange={(v) => setInfo({ ...info, start: v })} label={L('Läuft seit', 'Running since')} />
                <DateField value={info.cancelUntil} onChange={(v) => setInfo({ ...info, cancelUntil: v })} label={L('Kündbar bis / läuft bis', 'Cancel by / runs until')} testId="budget-info-cancel" />
                {info.cancelUntil && (
                  <label className="flex items-center gap-2 text-[13.5px]">
                    <input type="checkbox" checked={!!info.calCancel} onChange={(e) => { setInfo({ ...info, calCancel: e.target.checked }); if (e.target.checked && remind == null) setRemind(4320); }} className="w-5 h-5" data-testid="budget-info-calcancel" />
                    {L('Vor der Kündigungsfrist im Kalender erinnern', 'Remind me in the calendar before the deadline')}
                  </label>
                )}
                <WhereField value={info.keptAt} onChange={(v) => setInfo({ ...info, keptAt: v })} label={L('Wo liegen die Unterlagen?', 'Where are the papers?')} L={L} testId="budget-info-kept" />
                <TextField value={info.note} onChange={(v) => setInfo({ ...info, note: v })} label={L('Hinweise (keine Passwörter!)', 'Notes (no passwords!)')} testId="budget-info-note" />
              </div>
            )}
          </div>
        )}
        {!more ? (
          <button type="button" onClick={() => setMore(true)} className="self-start text-[13px] underline underline-offset-2 text-[var(--color-primary)]">{L('Mehr: gilt von … bis …, Notiz', 'More: from … to …, note')}</button>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <div className="flex-1"><DateField value={from} onChange={setFrom} label={L('Gilt ab (frühere Monate bleiben leer)', 'Valid from (earlier months stay empty)')} testId="budget-rec-from" /></div>
              <div className="flex-1"><DateField value={to} onChange={setTo} label={L('Gilt bis', 'Valid until')} /></div>
            </div>
            <TextField value={note} onChange={setNote} label={L('Notiz', 'Note')} />
          </div>
        )}
        <div className="flex gap-2 flex-wrap items-center pt-1">
          <button type="button" onClick={save} disabled={!canSave} className={primaryBtn} style={{ background: 'var(--color-primary)' }} data-testid="budget-rec-save">{L('Speichern', 'Save')}</button>
          {initial && (
            <button type="button" onClick={() => { recurringRepo.save({ ...initial, paused: !initial.paused, updatedAt: nowIso() }); notifyBudget(); onSaved(initial.paused ? L('Läuft wieder.', 'Running again.') : L('Pausiert – zählt nicht mehr mit.', 'Paused – no longer counted.')); onClose(); }} className={ghostBtn} data-testid="budget-rec-pause">{initial.paused ? L('Wieder aktivieren', 'Resume') : L('Pausieren', 'Pause')}</button>
          )}
          {initial && <DeleteButton onDelete={remove} L={L} testId="budget-rec-delete" />}
        </div>
      </div>
    </Modal>
  );
}

/** Rechnung mit Fälligkeit, Foto und Ablageort */
export function BillSheet({ initial, onClose, onSaved }: { initial?: Bill; onClose: () => void; onSaved: (msg: string) => void }) {
  const { L, cur } = useBudget();
  const [title, setTitle] = useState(initial?.title ?? '');
  const [emoji, setEmoji] = useState(initial?.emoji ?? '🧾');
  const [amount, setAmount] = useState<number | undefined>(initial?.amount);
  const [due, setDue] = useState(initial?.due ?? addDays(todayStr(), 14));
  const [photo, setPhoto] = useState<string | undefined>(initial?.photo);
  const [where, setWhere] = useState(initial?.where ?? '');
  const [note, setNote] = useState(initial?.note ?? '');
  const [cal, setCal] = useState(initial ? !!initial.cal : true);
  const [remind, setRemind] = useState<number | null | undefined>(initial?.remind ?? 1440);
  const canSave = !!title.trim() && amount !== undefined && !!due;
  const save = () => {
    if (!canSave || amount === undefined) return;
    const now = nowIso();
    billsRepo.save({ id: initial?.id ?? newId('bbill'), title: title.trim(), emoji, amount, due, paid: initial?.paid ?? false, paidAt: initial?.paidAt, photo, where: where.trim() || undefined, note: note.trim() || undefined, cal, remind: cal ? remind ?? null : null, createdAt: initial?.createdAt ?? now, updatedAt: now });
    notifyBudget();
    onSaved(L('Rechnung gespeichert.', 'Bill saved.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={initial ? L('Rechnung ändern', 'Change bill') : L('Neue Rechnung', 'New bill')}>
      <div className="flex flex-col gap-3" data-testid="budget-bill-sheet">
        {!initial && (
          <div className="flex gap-1.5 flex-wrap">
            {BILL_SUGGESTIONS.map(([de, en, e]) => (
              <button key={de} type="button" onClick={() => { setTitle(L(de, en)); setEmoji(e); }} className={pill(title === L(de, en))} style={title === L(de, en) ? { background: 'var(--color-primary)' } : undefined}>{e} {L(de, en)}</button>
            ))}
          </div>
        )}
        <TextField value={title} onChange={setTitle} label={L('Von wem ist die Rechnung?', 'Who is the bill from?')} placeholder={L('z. B. Stadtwerke', 'e.g. electricity company')} testId="budget-bill-title" />
        <AmountField value={amount} onChange={setAmount} label={L('Betrag', 'Amount')} testId="budget-bill-amount" cur={cur} />
        <DateField value={due} onChange={setDue} label={L('Bis wann zahlen?', 'Pay by')} testId="budget-bill-due" />
        <PhotoField id={photo} onChange={setPhoto} L={L} label={L('Foto der Rechnung (freiwillig)', 'Photo of the bill (optional)')} testId="budget-bill-photo" />
        <WhereField value={where} onChange={setWhere} label={L('Wo liegt die Rechnung?', 'Where is the bill kept?')} L={L} testId="budget-bill-where" />
        <TextField value={note} onChange={setNote} label={L('Notiz', 'Note')} testId="budget-bill-note" />
        <RemindField value={remind} onChange={setRemind} cal={cal} onCal={setCal} L={L} testId="budget-bill-remind" />
        <div className="flex gap-2 flex-wrap items-center pt-1">
          <button type="button" onClick={save} disabled={!canSave} className={primaryBtn} style={{ background: '#d97762' }} data-testid="budget-bill-save">{L('Speichern', 'Save')}</button>
          {initial && <DeleteButton onDelete={() => { if (initial.photo) void deleteOwnMedia(initial.photo); billsRepo.remove(initial.id); notifyBudget(); onSaved(L('Gelöscht.', 'Deleted.')); onClose(); }} L={L} testId="budget-bill-delete" />}
        </div>
      </div>
    </Modal>
  );
}

/** Betrag nur für diesen Monat anpassen oder den Haken setzen */
export function TickSheet({ r, date, tick, onClose, onSaved }: { r: Recurring; date: string; tick?: { id: string; amount?: number }; onClose: () => void; onSaved: (msg: string) => void }) {
  const { L, cur, lang } = useBudget();
  const [amount, setAmount] = useState<number | undefined>(tick?.amount ?? r.amount);
  const isIn = r.dir === 'in';
  const done = () => {
    ticksRepo.save({ id: tickKey(r.id, date), rid: r.id, date, amount: amount !== undefined && Math.abs(amount - r.amount) > 0.001 ? amount : undefined, doneAt: nowIso() });
    notifyBudget();
    onSaved(isIn ? L('Schön, das Geld ist da.', 'Nice, the money is here.') : L('Geschafft – abgehakt.', 'Done – ticked off.'));
    onClose();
  };
  return (
    <Modal open onClose={onClose} title={`${r.emoji} ${r.label}`}>
      <div className="flex flex-col gap-3" data-testid="budget-tick-sheet">
        <p className="text-[13px] text-[var(--color-text-muted)]">{new Date(`${date}T12:00:00`).toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { day: 'numeric', month: 'long' })} · {L('Dieser Monat – nur hier ändern, sonst bleibt alles wie geplant.', 'This month only – everything else stays as planned.')}</p>
        <AmountField big value={amount} onChange={setAmount} testId="budget-tick-amount" cur={cur} />
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={done} className={primaryBtn} style={{ background: isIn ? '#4f9d69' : '#d97762' }} data-testid="budget-tick-done">{isIn ? L('Ist da ✓', 'Arrived ✓') : L('Bezahlt ✓', 'Paid ✓')}</button>
          {tick && <button type="button" onClick={() => { ticksRepo.remove(tick.id); notifyBudget(); onSaved(L('Haken entfernt.', 'Tick removed.')); onClose(); }} className={ghostBtn} data-testid="budget-tick-undo">{L('Haken wieder entfernen', 'Remove the tick')}</button>}
        </div>
      </div>
    </Modal>
  );
}
