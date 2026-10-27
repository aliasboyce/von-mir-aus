import { useEffect, useState } from 'react';
import { Check, RotateCcw, Trash2 } from 'lucide-react';
import { useL } from '../projects/useL';
import { SLIP_CALENDAR_HINT } from './slipTexts';
import { SLIPS_CHANGED } from './slipDelivery';
import { slipColor, type ParkNote, type SlipTarget } from './parkboxRepo';
import { removeSlip, slipToPark, slipToWait, slipsAt, toggleSlipDone } from './slipAttach';

/**
 * Zettel, die an einem Termin, einer Person oder einer Mindmap hängen. Sie stehen dort immer GANZ OBEN,
 * als Zettel (🗒️) in ihrer festen Farbe, und lassen sich abhaken oder zurück in die Parkbox / das Wartezimmer legen.
 */
export function SlipsHere({ kind, id, compact }: { kind: SlipTarget; id: string; compact?: boolean }) {
  const { L } = useL();
  const [list, setList] = useState<ParkNote[]>(() => slipsAt(kind, id));
  const [sure, setSure] = useState<string | null>(null);
  useEffect(() => {
    const on = () => setList(slipsAt(kind, id));
    on();
    window.addEventListener(SLIPS_CHANGED, on);
    return () => window.removeEventListener(SLIPS_CHANGED, on);
  }, [kind, id]);
  if (!list.length) return null;
  const btn = 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11.5px] bg-white/70 text-[#4a4636] border border-[#00000014]';
  return (
    <div className="mb-3" data-testid={`slips-here-${kind}`} aria-label={L('Zettel hier', 'Slips here')}>
      {!compact && <p className="text-[11.5px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">🗒️ {L('Zettel hier', 'Slips here')} · {list.length}</p>}
      <ul className="flex flex-col gap-2">
        {list.map((n) => {
          const c = slipColor(n);
          return (
            <li key={n.id} className="rounded-[6px] px-3 py-2.5 shadow-sm" style={{ background: c.bg, color: c.ink, transform: `rotate(${Math.max(-1.2, Math.min(1.2, n.tilt / 2))}deg)`, opacity: n.done ? 0.72 : 1 }} data-testid="slip-here" data-done={n.done ? '1' : '0'} data-origin={n.origin ?? 'park'}>
              <div className="flex items-start gap-2">
                <button type="button" onClick={() => toggleSlipDone(n.id)} aria-pressed={!!n.done} aria-label={n.done ? L('Wieder öffnen', 'Reopen') : L('Abhaken', 'Tick off')} className="mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0" style={{ borderColor: c.ink, background: n.done ? c.ink : 'transparent', color: c.bg }} data-testid="slip-here-check">
                  {n.done && <Check size={14} strokeWidth={3} />}
                </button>
                <span aria-hidden="true" className="text-[15px] leading-6">🗒️</span>
                <p className={`flex-1 min-w-0 text-[14.5px] leading-snug whitespace-pre-line break-words ${n.done ? 'line-through' : ''}`}>{n.text}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2 pl-8">
                <button type="button" className={btn} onClick={() => slipToPark(n.id)} data-testid="slip-here-park"><RotateCcw size={11} /> {L('Zurück in die Parkbox', 'Back to the Park box')}</button>
                <button type="button" className={btn} onClick={() => slipToWait(n.id)} data-testid="slip-here-wait">🪑 {L('Ins Wartezimmer', 'To the waiting room')}</button>
                {sure === n.id ? (
                  <button type="button" className={`${btn} !text-[var(--color-danger)]`} onClick={() => { removeSlip(n.id); setSure(null); }} data-testid="slip-here-del-sure"><Trash2 size={11} /> {L('Wirklich löschen?', 'Really delete?')}</button>
                ) : (
                  <button type="button" className={btn} onClick={() => setSure(n.id)} aria-label={L('Löschen', 'Delete')} data-testid="slip-here-del"><Trash2 size={11} /></button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      {!compact && <p className="text-[11px] text-[var(--color-text-faint)] mt-1.5">{SLIP_CALENDAR_HINT(L)}</p>}
    </div>
  );
}
