import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { resizeImageKeepAlpha } from '../../../services/imageResize';
import { dayKey } from '../../calendar/calendarRepo';
import { newId, weightSum, type DecisionsBlock, type ImagesBlock, type ProsConsBlock, type RemindersBlock, type RisksBlock, type TableBlock, type WeightedText } from '../projectModel';
import { AddRow, DelBtn, Empty, RemindSelect, SmallLabel, chipCls, chipOn, type BlockProps } from '../ui';

export function BlockRisks({ block, L, onChange }: BlockProps<RisksBlock>) {
  const patch = (id: string, p: Partial<RisksBlock['items'][number]>) => onChange({ ...block, items: block.items.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const lv = (n: 1 | 2 | 3) => (n === 1 ? L('eher unwahrscheinlich', 'rather unlikely') : n === 2 ? L('möglich', 'possible') : L('wahrscheinlich', 'likely'));
  return (
    <div>
      {block.items.length === 0 && <Empty>{L('Was könnte schiefgehen? Und was wäre dann dein Plan B?', 'What could go wrong? And what would be your plan B?')}</Empty>}
      <ul className="flex flex-col gap-2">
        {block.items.map((r) => (
          <li key={r.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-2" data-testid={`risk-${r.id}`}>
            <div className="flex items-center gap-1.5">
              <button type="button" onClick={() => patch(r.id, { solved: !r.solved })} aria-pressed={!!r.solved} aria-label={L('Erledigt', 'Settled')} className="w-6 h-6 shrink-0 rounded-md border-2 flex items-center justify-center text-[13px] text-white" style={{ borderColor: 'var(--color-primary)', background: r.solved ? 'var(--color-primary)' : 'transparent' }}>{r.solved ? '✓' : ''}</button>
              <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1" style={{ opacity: r.solved ? 0.6 : 1 }} value={r.text} onChange={(e) => patch(r.id, { text: e.target.value })} aria-label={L('Risiko', 'Risk')} />
              <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== r.id) })} L={L} />
            </div>
            <div className="flex gap-1.5 my-1 flex-wrap">
              {([1, 2, 3] as const).map((n) => <button key={n} type="button" onClick={() => patch(r.id, { level: n })} aria-pressed={r.level === n} className={chipCls(r.level === n)} style={r.level === n ? chipOn : undefined}>{lv(n)}</button>)}
            </div>
            <input className="input !h-9 text-[13px]" value={r.planB ?? ''} placeholder={L('Plan B …', 'Plan B …')} onChange={(e) => patch(r.id, { planB: e.target.value })} data-testid={`risk-planb-${r.id}`} />
          </li>
        ))}
      </ul>
      <AddRow placeholder={L('Was könnte schiefgehen …', 'What could go wrong …')} onAdd={(text) => onChange({ ...block, items: [...block.items, { id: newId('r'), text, level: 2 }] })} testId="risk-new" />
    </div>
  );
}

export function BlockDecisions({ block, L, onChange }: BlockProps<DecisionsBlock>) {
  const patch = (id: string, p: Partial<DecisionsBlock['items'][number]>) => onChange({ ...block, items: block.items.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  return (
    <div>
      {block.items.length === 0 && <Empty>{L('Wichtige Beschlüsse kurz festhalten, z. B. „Wir nehmen Location A“ oder „Budget max. 200 €“.', 'Note important decisions briefly, e.g. "We take location A" or "Budget max. 200 €".')}</Empty>}
      <ul className="flex flex-col gap-2">
        {block.items.map((d) => (
          <li key={d.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-2" data-testid={`dec-${d.id}`}>
            <div className="flex items-center gap-1.5">
              <span aria-hidden="true">📌</span>
              <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1" style={{ fontWeight: 600 }} value={d.text} onChange={(e) => patch(d.id, { text: e.target.value })} aria-label={L('Entscheidung', 'Decision')} />
              <input type="date" className="input !h-8 !py-0 !w-[7.8rem] text-[12px]" value={d.date} onChange={(e) => patch(d.id, { date: e.target.value })} aria-label={L('Datum', 'Date')} />
              <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== d.id) })} L={L} />
            </div>
            <input className="input !h-9 text-[13px] mt-1" value={d.note ?? ''} placeholder={L('Warum / was gilt jetzt?', 'Why / what applies now?')} onChange={(e) => patch(d.id, { note: e.target.value })} />
          </li>
        ))}
      </ul>
      <AddRow placeholder={L('Neue Entscheidung …', 'New decision …')} onAdd={(text) => onChange({ ...block, items: [...block.items, { id: newId('d'), text, date: dayKey(new Date()) }] })} testId="dec-new" />
    </div>
  );
}

function WList({ list, setList, L, tid, placeholder }: { list: WeightedText[]; setList: (l: WeightedText[]) => void; L: BlockProps['L']; tid: string; placeholder: string }) {
  const patch = (id: string, p: Partial<WeightedText>) => setList(list.map((x) => (x.id === id ? { ...x, ...p } : x)));
  return (
    <div>
      <ul className="flex flex-col gap-1.5">
        {list.map((x) => (
          <li key={x.id} className="flex items-center gap-1 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2 py-1">
            <input className="flex-1 min-w-0 bg-transparent outline-none text-[14px] py-1.5" value={x.text} onChange={(e) => patch(x.id, { text: e.target.value })} aria-label={placeholder} />
            <button type="button" onClick={() => patch(x.id, { w: (x.w === 3 ? 1 : x.w + 1) as 1 | 2 | 3 })} className="text-[13px] tracking-tighter px-1" aria-label={L('Gewicht', 'Weight')} title={L('Tippen: wie wichtig?', 'Tap: how important?')} data-testid={`${tid}-w-${x.id}`}>{'●'.repeat(x.w)}<span style={{ opacity: 0.25 }}>{'●'.repeat(3 - x.w)}</span></button>
            <DelBtn onClick={() => setList(list.filter((y) => y.id !== x.id))} L={L} />
          </li>
        ))}
      </ul>
      <AddRow placeholder={placeholder} onAdd={(text) => setList([...list, { id: newId('w'), text, w: 2 }])} testId={tid} />
    </div>
  );
}

export function BlockProsCons({ block, L, onChange }: BlockProps<ProsConsBlock>) {
  const pw = weightSum(block.pros);
  const cw = weightSum(block.cons);
  return (
    <div data-testid="proscons">
      <div className="grid sm:grid-cols-2 gap-3">
        <div><p className="text-[13px] font-medium mb-1" style={{ color: '#3d8b52' }}>＋ {L('Dafür', 'Pro')} ({pw})</p><WList list={block.pros} setList={(pros) => onChange({ ...block, pros })} L={L} tid="pro-new" placeholder={L('Das spricht dafür …', 'This speaks for it …')} /></div>
        <div><p className="text-[13px] font-medium mb-1" style={{ color: '#c9522f' }}>－ {L('Dagegen', 'Con')} ({cw})</p><WList list={block.cons} setList={(cons) => onChange({ ...block, cons })} L={L} tid="con-new" placeholder={L('Das spricht dagegen …', 'This speaks against it …')} /></div>
      </div>
      {(pw > 0 || cw > 0) && <p className="text-[12px] text-[var(--color-text-muted)] mt-2" data-testid="proscons-sum">{pw === cw ? L('Gleich viel Gewicht auf beiden Seiten. Dein Bauchgefühl darf mitentscheiden.', 'Equal weight on both sides. Your gut feeling may help decide.') : pw > cw ? L('Mehr Gewicht liegt auf „dafür“.', 'More weight is on "pro".') : L('Mehr Gewicht liegt auf „dagegen“.', 'More weight is on "con".')} {L('(Das ist eine Hilfe, keine Rechnung, die entscheidet.)', '(This is an aid, not a sum that decides.)')}</p>}
      <label className="block mt-2"><SmallLabel>{L('Meine Entscheidung', 'My decision')}</SmallLabel><input className="input" value={block.verdict ?? ''} onChange={(e) => onChange({ ...block, verdict: e.target.value })} data-testid="proscons-verdict" /></label>
    </div>
  );
}

export function BlockTable({ block, L, onChange }: BlockProps<TableBlock>) {
  const setCell = (r: number, c: number, v: string) => onChange({ ...block, rows: block.rows.map((row, i) => (i === r ? row.map((x, j) => (j === c ? v : x)) : row)) });
  return (
    <div>
      <div className="overflow-x-auto" data-testid="table-scroll">
        <table className="text-[13.5px] border-collapse min-w-full">
          <thead>
            <tr>
              {block.cols.map((c, j) => (
                <th key={j} className="p-0.5 min-w-[7rem]">
                  <input className="input !h-9 text-[13px]" style={{ fontWeight: 600 }} value={c} placeholder={L(`Spalte ${j + 1}`, `Column ${j + 1}`)} onChange={(e) => onChange({ ...block, cols: block.cols.map((x, k) => (k === j ? e.target.value : x)) })} data-testid={`table-col-${j}`} />
                </th>
              ))}
              <th className="w-9" />
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {block.cols.map((_, j) => (
                  <td key={j} className="p-0.5"><input className="input !h-9 text-[13px]" value={row[j] ?? ''} onChange={(e) => setCell(i, j, e.target.value)} data-testid={`table-cell-${i}-${j}`} /></td>
                ))}
                <td><DelBtn onClick={() => onChange({ ...block, rows: block.rows.filter((_, k) => k !== i) })} L={L} testId={`table-row-del-${i}`} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2 mt-2 flex-wrap">
        <button type="button" onClick={() => onChange({ ...block, rows: [...block.rows, block.cols.map(() => '')] })} className={chipCls(false)} data-testid="table-add-row">＋ {L('Zeile', 'Row')}</button>
        <button type="button" onClick={() => onChange({ ...block, cols: [...block.cols, ''], rows: block.rows.map((r) => [...r, '']) })} className={chipCls(false)} data-testid="table-add-col">＋ {L('Spalte', 'Column')}</button>
        {block.cols.length > 1 && <button type="button" onClick={() => onChange({ ...block, cols: block.cols.slice(0, -1), rows: block.rows.map((r) => r.slice(0, -1)) })} className={chipCls(false)} data-testid="table-del-col">－ {L('letzte Spalte', 'last column')}</button>}
      </div>
    </div>
  );
}

export function BlockReminders({ block, L, onChange }: BlockProps<RemindersBlock>) {
  const patch = (id: string, p: Partial<RemindersBlock['items'][number]>) => onChange({ ...block, items: block.items.map((r) => (r.id === id ? { ...r, ...p } : r)) });
  const [text, setText] = useState('');
  const [date, setDate] = useState(dayKey(new Date()));
  const [time, setTime] = useState('09:00');
  return (
    <div>
      <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{L('Die Erinnerung kommt in dein Postfach und steht im Kalender.', 'The reminder arrives in your mailbox and is in the calendar.')}</p>
      {block.items.length === 0 && <Empty>{L('Noch keine Erinnerung.', 'No reminder yet.')}</Empty>}
      <ul className="flex flex-col gap-1.5">
        {block.items.map((r) => (
          <li key={r.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-2.5 py-1.5" data-testid={`rem-${r.id}`}>
            <div className="flex items-center gap-1.5">
              <span aria-hidden="true">🔔</span>
              <input className="flex-1 min-w-0 bg-transparent outline-none text-[14.5px] py-1.5" value={r.text} onChange={(e) => patch(r.id, { text: e.target.value })} aria-label={L('Erinnerung', 'Reminder')} />
              <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== r.id) })} L={L} />
            </div>
            <div className="flex gap-2 flex-wrap pl-7 pb-1">
              <input type="date" className="input !h-9 !py-0 !w-[8.6rem] text-[13px]" value={r.date} onChange={(e) => patch(r.id, { date: e.target.value })} />
              <input type="time" className="input !h-9 !py-0 !w-[6.6rem] text-[13px]" value={r.time} onChange={(e) => patch(r.id, { time: e.target.value })} />
              <RemindSelect value={r.remind ?? 0} onChange={(v) => patch(r.id, { remind: v ?? 0 })} L={L} />
            </div>
          </li>
        ))}
      </ul>
      <div className="flex gap-2 mt-2 flex-wrap items-center">
        <input className="input flex-1 min-w-[10rem]" value={text} placeholder={L('Woran soll ich dich erinnern …', 'What should I remind you of …')} onChange={(e) => setText(e.target.value)} data-testid="rem-new-input" />
        <input type="date" className="input !w-[8.6rem]" value={date} onChange={(e) => setDate(e.target.value)} data-testid="rem-new-date" />
        <input type="time" className="input !w-[6.6rem]" value={time} onChange={(e) => setTime(e.target.value)} data-testid="rem-new-time" />
        <button type="button" disabled={!text.trim() || !date} onClick={() => { onChange({ ...block, items: [...block.items, { id: newId('rm'), text: text.trim(), date, time: time || '09:00', remind: 0 }] }); setText(''); }} className="h-11 px-3.5 rounded-full text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} data-testid="rem-new-add">+</button>
      </div>
    </div>
  );
}

export function BlockImages({ block, L, onChange }: BlockProps<ImagesBlock>) {
  const ref = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState('');
  async function add(files: FileList | null) {
    if (!files) return;
    const items = [...block.items];
    for (const f of Array.from(files)) {
      try {
        const r = await resizeImageKeepAlpha(f, 900, 0.72);
        items.push({ id: newId('im'), src: r.url });
      } catch {
        setMsg(L('Ein Bild ließ sich nicht lesen.', 'One picture could not be read.'));
      }
    }
    onChange({ ...block, items });
  }
  return (
    <div>
      {block.items.length === 0 && <Empty>{L('Fotos, Skizzen oder Screenshots – sie bleiben auf diesem Gerät.', 'Photos, sketches or screenshots – they stay on this device.')}</Empty>}
      <div className="grid grid-cols-2 gap-2" data-testid="images-grid">
        {block.items.map((im) => (
          <div key={im.id} className="rounded-[var(--radius-md)] overflow-hidden bg-[var(--color-surface-muted)]">
            <img src={im.src} alt={im.caption || ''} className="w-full max-h-[200px] object-contain bg-white" />
            <div className="flex items-center gap-1 px-1.5 py-1">
              <input className="flex-1 min-w-0 bg-transparent outline-none text-[12.5px]" value={im.caption ?? ''} placeholder={L('Beschriftung', 'Caption')} onChange={(e) => onChange({ ...block, items: block.items.map((x) => (x.id === im.id ? { ...x, caption: e.target.value } : x)) })} />
              <DelBtn onClick={() => onChange({ ...block, items: block.items.filter((x) => x.id !== im.id) })} L={L} />
            </div>
          </div>
        ))}
      </div>
      <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { void add(e.target.files); e.target.value = ''; }} data-testid="images-file" />
      <button type="button" onClick={() => ref.current?.click()} className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[var(--color-border-strong)] text-[14px]" data-testid="images-add"><ImagePlus size={16} />{L('Bild hinzufügen', 'Add picture')}</button>
      {msg && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-1" role="status">{msg}</p>}
    </div>
  );
}
