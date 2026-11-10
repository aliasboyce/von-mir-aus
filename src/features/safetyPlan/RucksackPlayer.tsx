import { useEffect, useState } from 'react';
import { Check, ChevronLeft, Minus, Play, RotateCcw, X } from 'lucide-react';
import { useL } from '../projects/useL';
import { LISTS_CHANGED, saveList, type UserList } from '../lists/listsModel';
import { RucksackIcon } from './RucksackIcon';
import { finishPacking, getRucksackList, rucksackCounts } from './rucksackStore';

/**
 * „Durchgehen“: ein Punkt nach dem anderen, groß. Ein Klick = eingepackt (Haken), ein Klick = nicht dabei (durchgestrichen),
 * oder „Später“. Alles wird sofort gespeichert; „Fertig gepackt“ übernimmt den Stand ins PDF und setzt die Liste zurück.
 */
export function RucksackPlayer({ onClose, onFinished }: { onClose: () => void; onFinished?: () => void }) {
  const { L } = useL();
  const [list, setList] = useState<UserList | undefined>(() => getRucksackList());
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const f = () => setList(getRucksackList());
    window.addEventListener(LISTS_CHANGED, f);
    return () => window.removeEventListener(LISTS_CHANGED, f);
  }, []);

  if (!list) return null;
  const items = list.items;
  const item = items[idx];
  const c = rucksackCounts(list);

  const setState = (state: 'packed' | 'skipped' | 'open') => {
    if (!item) return;
    const next = { ...list, items: items.map((i) => (i.id === item.id ? { ...i, done: state === 'packed', skipped: state === 'skipped' } : i)) };
    setList(saveList(next));
  };
  const advance = () => { if (idx + 1 >= items.length) setDone(true); else setIdx(idx + 1); };
  const answer = (state: 'packed' | 'skipped') => { setState(state); advance(); };

  const finish = () => {
    finishPacking();
    onFinished?.();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex flex-col" style={{ background: 'var(--color-bg)' }} role="dialog" aria-modal="true" aria-label={L('Notfallrucksack packen', 'Pack the emergency backpack')} data-testid="rucksack-player">
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button type="button" onClick={() => (done || idx === 0 ? onClose() : setIdx(idx - 1))} className="flex items-center gap-1 text-[14px] text-[var(--color-text-muted)] py-2" aria-label={L('Zurück', 'Back')} data-testid="rucksack-back">
          <ChevronLeft size={18} />{done || idx === 0 ? L('Schließen', 'Close') : L('Zurück', 'Back')}
        </button>
        <span className="text-[13px] text-[var(--color-text-muted)]">{items.length > 0 && !done ? `${idx + 1} / ${items.length}` : ''}</span>
        <button type="button" onClick={onClose} className="w-10 h-10 flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Beenden (Stand bleibt gespeichert)', 'Stop (progress stays saved)')}><X size={20} /></button>
      </div>
      <div className="mx-5 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-surface-muted)' }} aria-hidden>
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${items.length ? ((done ? items.length : idx) / items.length) * 100 : 0}%`, background: 'var(--color-primary)' }} />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6 overflow-y-auto py-6">
        {items.length === 0 ? (
          <>
            <RucksackIcon size={72} />
            <p className="text-[16px] text-[var(--color-text-muted)]">{L('Im Rucksack liegt noch nichts. Schreib erst auf, was hinein soll.', 'Nothing in the backpack yet. Write down first what should go in.')}</p>
            <button type="button" onClick={onClose} className="h-12 px-6 rounded-full text-white" style={{ background: 'var(--color-primary)' }}>{L('Zur Liste', 'To the list')}</button>
          </>
        ) : done ? (
          <div data-testid="rucksack-summary" className="flex flex-col items-center gap-4 animate-in">
            <RucksackIcon size={80} />
            <h2 className="text-[22px]">{L('Einmal durch.', 'Gone through once.')}</h2>
            <p className="text-[15px] text-[var(--color-text-muted)] leading-relaxed">
              {L(`${c.packed} eingepackt`, `${c.packed} packed`)}{c.skipped > 0 ? L(` · ${c.skipped} nicht dabei`, ` · ${c.skipped} not with me`) : ''}{c.open > 0 ? L(` · ${c.open} offen`, ` · ${c.open} open`) : ''}
            </p>
            <ul className="text-left text-[14.5px] max-w-[320px] w-full flex flex-col gap-1">
              {items.map((i) => (
                <li key={i.id} className="flex items-start gap-2" style={{ color: i.skipped ? 'var(--color-text-faint)' : 'var(--color-text)', textDecoration: i.skipped ? 'line-through' : 'none' }}>
                  <span className="shrink-0 w-5">{i.done && !i.skipped ? '✓' : i.skipped ? '✕' : '○'}</span><span>{i.text}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={finish} className="h-14 px-8 rounded-full text-white text-[16px] mt-2" style={{ background: 'var(--color-primary)' }} data-testid="rucksack-finish">
              {L('Fertig gepackt', 'Finished packing')}
            </button>
            <p className="text-[12.5px] text-[var(--color-text-faint)] max-w-[300px] leading-relaxed">{L('Der Stand kommt ins PDF des Sicherheitsplans. Danach ist die Liste wieder frei zum Abhaken.', 'This state goes into the safety plan PDF. Afterwards the list is clear to tick off again.')}</p>
            <button type="button" onClick={() => { setIdx(0); setDone(false); }} className="flex items-center gap-1.5 text-[13.5px] text-[var(--color-text-muted)] underline underline-offset-2 py-2"><RotateCcw size={14} />{L('Nochmal von vorn', 'Again from the start')}</button>
          </div>
        ) : (
          <>
            <div className="w-full max-w-[360px] rounded-3xl px-6 py-10 border animate-in" key={item.id} style={{ background: `${list.color}18`, borderColor: list.color }} data-testid="rucksack-card">
              <p className="text-[24px] leading-snug break-words" style={{ textDecoration: item.skipped ? 'line-through' : 'none' }}>{item.text}</p>
              {item.note && <p className="text-[14px] text-[var(--color-text-muted)] mt-3 whitespace-pre-wrap">{item.note}</p>}
              {(item.done || item.skipped) && (
                <p className="text-[13px] mt-4" style={{ color: list.color }}>{item.skipped ? L('✕ nicht dabei', '✕ not with me') : L('✓ schon eingepackt', '✓ already packed')}</p>
              )}
            </div>
            <div className="w-full max-w-[360px] grid grid-cols-2 gap-3">
              <button type="button" onClick={() => answer('packed')} className="h-16 rounded-2xl text-white text-[16px] flex items-center justify-center gap-2 active:scale-[0.97] transition-transform" style={{ background: 'var(--color-primary)' }} data-testid="rucksack-pack">
                <Check size={22} strokeWidth={3} />{L('Eingepackt', 'Packed')}
              </button>
              <button type="button" onClick={() => answer('skipped')} className="h-16 rounded-2xl text-[16px] flex items-center justify-center gap-2 border-2 active:scale-[0.97] transition-transform" style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text)' }} data-testid="rucksack-skip">
                <Minus size={22} strokeWidth={3} />{L('Nicht dabei', 'Not with me')}
              </button>
            </div>
            <button type="button" onClick={() => { setState('open'); advance(); }} className="text-[14px] text-[var(--color-text-muted)] underline underline-offset-2 py-2" data-testid="rucksack-later">{L('Später / weiß ich nicht', 'Later / not sure')}</button>
          </>
        )}
      </div>
      {!done && items.length > 0 && (
        <div className="px-6 pb-6 text-center">
          <button type="button" onClick={() => setDone(true)} className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 py-2" data-testid="rucksack-to-end">{L('Zum Abschluss springen', 'Jump to the end')}</button>
        </div>
      )}
    </div>
  );
}

export function RucksackPlayButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { L } = useL();
  return (
    <button type="button" onClick={onClick} className={className ?? 'inline-flex items-center gap-2 h-12 px-5 rounded-full text-white text-[15px]'} style={{ background: 'var(--color-primary)' }} data-testid="rucksack-play">
      <Play size={17} fill="currentColor" />{L('Durchgehen', 'Go through')}
    </button>
  );
}

