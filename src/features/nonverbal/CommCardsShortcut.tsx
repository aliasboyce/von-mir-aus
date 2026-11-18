import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useL } from '../projects/useL';
import { StepViewer } from '../crisis/StepViewer';
import { commCardsRepo, ensureCommCards } from './commCardsRepo';

/**
 * Ein Tipp: die Kommunikationskarten öffnen sich direkt im Vollbild – ohne die aktuelle Seite zu verlassen
 * (Sicherheitsplan, Notfallrucksack, Krisenmodus). `crisis` = Schwarz-Weiß-Stil des Krisenmodus.
 */
export function CommCardsShortcut({ crisis = false, withEditLink = true }: { crisis?: boolean; withEditLink?: boolean }) {
  const { L, lang } = useL();
  const [open, setOpen] = useState(false);
  const cards = open ? commCardsRepo.getAll() : ensureCommCards(lang);
  const cls = crisis
    ? 'w-full flex items-center gap-3 px-5 py-4 rounded-[12px] border-2 border-black text-black text-[17px] font-medium text-left hover:bg-black/5'
    : 'w-full flex items-center gap-3 px-4 py-3.5 rounded-[var(--radius-lg)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] text-[15px] text-left';
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)} disabled={cards.length === 0} className={cls} data-testid="comm-shortcut">
        <span className="text-[24px]" aria-hidden="true">🪧</span>
        <span className="flex-1 min-w-0">
          <span className="block font-medium">{L('Kommunikationskarten zeigen', 'Show communication cards')}</span>
          <span className={`block text-[13px] font-normal ${crisis ? 'text-black/65' : 'text-[var(--color-text-muted)]'}`}>
            {cards.length === 0 ? L('Noch keine Karten.', 'No cards yet.') : L(`${cards.length} Karten – füllen den ganzen Bildschirm.`, `${cards.length} cards – fill the whole screen.`)}
          </span>
        </span>
      </button>
      {withEditLink && !crisis && (
        <Link to="/sicherheit/nonverbal/karten" className="inline-block text-[12.5px] text-[var(--color-primary)] underline underline-offset-2 mt-1.5 hit44">{L('Karten gestalten', 'Design cards')}</Link>
      )}
      {open && cards.length > 0 && (
        <StepViewer title={L('Kommunikationskarten', 'Communication cards')} steps={cards.map((c) => ({ text: c.text, emoji: c.emoji, color: c.color }))} nav="swipe" onClose={() => setOpen(false)} />
      )}
    </div>
  );
}
