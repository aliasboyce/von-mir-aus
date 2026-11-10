import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useL } from '../projects/useL';
import { LISTS_CHANGED } from '../lists/listsModel';
import { RucksackIcon } from './RucksackIcon';
import { RucksackPlayButton, RucksackPlayer } from './RucksackPlayer';
import { RUCKSACK_SUGGESTIONS, addRucksackItem, createRucksack, detachRucksack, getRucksackList, rucksackCounts, rucksackStore } from './rucksackStore';

/** Freiwilliger Teil beim Sicherheitsplan: der Notfallrucksack. Nur sichtbar anlegen, wenn man möchte. */
export function RucksackCard() {
  const { L, lang } = useL();
  const [open, setOpen] = useState(false);
  const [, tick] = useState(0);
  const [fresh, setFresh] = useState('');
  const [playing, setPlaying] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  useEffect(() => {
    const f = () => tick((n) => n + 1);
    window.addEventListener(LISTS_CHANGED, f);
    return () => window.removeEventListener(LISTS_CHANGED, f);
  }, []);

  const list = getRucksackList();
  const st = rucksackStore.get();
  const counts = list ? rucksackCounts(list) : null;
  const packedAt = st.lastPacked ? new Date(st.lastPacked.at).toLocaleDateString(lang === 'en' ? 'en-US' : 'de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
  const suggestions = list ? RUCKSACK_SUGGESTIONS.filter((s) => !list.items.some((i) => i.text.toLowerCase() === L(s.de, s.en).toLowerCase())) : [];

  return (
    <Card className="mb-5" data-testid="rucksack-card">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="w-full flex items-center gap-3 text-left" data-testid="rucksack-toggle">
        <span className="shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center text-[var(--color-text)]" style={{ background: 'rgba(217,137,61,0.16)' }}><RucksackIcon size={32} /></span>
        <span className="flex-1 min-w-0">
          <span className="block text-[15px] font-medium text-[var(--color-text)]">{L('Notfallrucksack', 'Emergency backpack')}</span>
          <span className="block text-[12.5px] text-[var(--color-text-faint)] mt-0.5">
            {list && counts ? (counts.total === 0 ? L('Noch leer', 'Empty so far') : L(`${counts.total} Dinge${packedAt ? ` · zuletzt gepackt ${packedAt}` : ''}`, `${counts.total} things${packedAt ? ` · last packed ${packedAt}` : ''}`)) : L('Freiwillig: was du im Notfall einpackst – zum Durchgehen und fürs PDF', 'Optional: what you pack in an emergency – to go through and for the PDF')}
          </span>
        </span>
        {open ? <ChevronUp size={18} className="shrink-0 text-[var(--color-text-faint)]" /> : <ChevronDown size={18} className="shrink-0 text-[var(--color-text-faint)]" />}
      </button>

      {open && (
        <div className="mt-4 flex flex-col gap-3.5 animate-in" data-testid="rucksack-body">
          {!list ? (
            <>
              <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{L('Eine Liste mit allem, was in deinen Notfallrucksack soll. Du gehst sie mit „Durchgehen“ Punkt für Punkt durch, und wenn du fertig gepackt hast, steht der Stand im PDF des Sicherheitsplans. Danach ist sie wieder frei fürs nächste Mal. Es ist ganz freiwillig.', 'A list of everything that should go into your emergency backpack. You go through it point by point with “Go through”, and when you have finished packing, the state appears in the safety plan PDF. Afterwards it is clear again for next time. Entirely optional.')}</p>
              <button type="button" onClick={() => { createRucksack(L('Notfallrucksack', 'Emergency backpack')); }} className="h-12 rounded-full text-white text-[15px] flex items-center justify-center gap-2" style={{ background: 'var(--color-primary)' }} data-testid="rucksack-create">
                <Plus size={17} />{L('Notfallrucksack anlegen', 'Create emergency backpack')}
              </button>
            </>
          ) : (
            <>
              <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); addRucksackItem(fresh); setFresh(''); }}>
                <input className="input flex-1" value={fresh} onChange={(e) => setFresh(e.target.value)} placeholder={L('Was kommt hinein? …', 'What goes in? …')} data-testid="rucksack-add-input" />
                <button type="submit" disabled={!fresh.trim()} className="w-12 h-12 shrink-0 rounded-full flex items-center justify-center text-white disabled:opacity-40" style={{ background: 'var(--color-primary)' }} aria-label={L('Hinzufügen', 'Add')} data-testid="rucksack-add"><Plus size={20} /></button>
              </form>
              {list.items.length > 0 && (
                <ul className="flex flex-col gap-1" data-testid="rucksack-items">
                  {list.items.map((i) => <li key={i.id} className="text-[14px] text-[var(--color-text)] flex gap-2"><span aria-hidden className="text-[var(--color-text-faint)]">•</span>{i.text}</li>)}
                </ul>
              )}
              {suggestions.length > 0 && (
                <details>
                  <summary className="text-[13px] text-[var(--color-primary)] cursor-pointer py-1">{L('Ideen, was hineinkönnte', 'Ideas for what could go in')}</summary>
                  <div className="flex gap-1.5 flex-wrap mt-2">
                    {suggestions.map((s) => <button key={s.de} type="button" onClick={() => addRucksackItem(L(s.de, s.en))} className="px-3 py-1.5 rounded-full text-[12.5px] border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid="rucksack-suggestion">+ {L(s.de, s.en)}</button>)}
                  </div>
                </details>
              )}
              <div className="flex gap-2 flex-wrap items-center">
                <RucksackPlayButton onClick={() => setPlaying(true)} />
                <Link to={`/listen/${list.id}`} className="h-12 px-5 rounded-full border border-[var(--color-border-strong)] inline-flex items-center text-[14.5px] text-[var(--color-text)]" data-testid="rucksack-open-list">{L('Als Liste öffnen', 'Open as list')}</Link>
              </div>
              {st.lastPacked && (
                <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed" data-testid="rucksack-lastpacked">
                  {L(`Zuletzt gepackt am ${packedAt}: ${st.lastPacked.packed.length} eingepackt${st.lastPacked.notPacked.length ? `, ${st.lastPacked.notPacked.length} nicht dabei` : ''}. Das steht im PDF, wenn „Notfallrucksack“ dort angehakt ist.`, `Last packed on ${packedAt}: ${st.lastPacked.packed.length} packed${st.lastPacked.notPacked.length ? `, ${st.lastPacked.notPacked.length} not with me` : ''}. It appears in the PDF when “Emergency backpack” is ticked there.`)}
                </p>
              )}
              {confirmRemove ? (
                <div className="text-[13px] flex flex-wrap gap-3 items-center">
                  <span className="text-[var(--color-text-muted)]">{L('Aus dem Sicherheitsplan nehmen? Die Liste bleibt unter „Meine Listen“.', 'Take it out of the safety plan? The list stays under “My lists”.')}</span>
                  <button type="button" onClick={() => { detachRucksack(); setConfirmRemove(false); }} className="text-[var(--color-danger)] underline underline-offset-2" data-testid="rucksack-detach">{L('Ja, herausnehmen', 'Yes, take out')}</button>
                  <button type="button" onClick={() => setConfirmRemove(false)} className="underline underline-offset-2">{L('Nein', 'No')}</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmRemove(true)} className="self-start text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2">{L('Nicht mehr beim Sicherheitsplan', 'Not part of the safety plan any more')}</button>
              )}
            </>
          )}
        </div>
      )}
      {playing && <RucksackPlayer onClose={() => setPlaying(false)} />}
    </Card>
  );
}
