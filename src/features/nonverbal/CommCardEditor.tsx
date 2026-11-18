import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useL } from '../projects/useL';
import { COMM_COLORS, commCardsRepo, inkFor, type CommCard } from './commCardsRepo';

export const COMM_EMOJIS = ['💧', '🍽️', '🚻', '🪟', '🔇', '🌿', '🤝', '🤐', '🛌', '💊', '📞', '🧸', '🫂', '⏸️', '🚪', '🧡', '🙏', '❓', '✅', '🚫'];

/** schlicht: Satz, Symbol, Farbe – mit sofortiger Vorschau. */
export function CommCardEditor({ card, onClose, onSaved }: { card: CommCard; onClose: () => void; onSaved: (c: CommCard) => void }) {
  const { L } = useL();
  const [c, setC] = useState<CommCard>(card);
  const ink = inkFor(c.color);
  const save = () => {
    if (!c.text.trim()) return;
    const saved = commCardsRepo.save({ ...c, text: c.text.trim(), isExample: card.isExample && c.text === card.text && c.emoji === card.emoji && c.color === card.color ? true : undefined, updatedAt: new Date().toISOString() });
    onSaved(saved);
  };
  return (
    <Modal open onClose={onClose} title={card.text ? L('Karte bearbeiten', 'Edit card') : L('Neue Karte', 'New card')} zIndex={420}>
      <div className="flex flex-col gap-4" data-testid="comm-editor">
        <div className="rounded-[16px] px-5 py-7 text-center flex flex-col items-center gap-2" style={{ background: c.color, color: ink, border: '1px solid rgba(0,0,0,0.12)' }} data-testid="comm-preview">
          <div style={{ fontSize: 52, lineHeight: 1 }} aria-hidden="true">{c.emoji}</div>
          <p className="text-[19px] font-medium leading-snug">{c.text || L('Dein Satz erscheint hier', 'Your sentence appears here')}</p>
        </div>
        <label className="block">
          <span className="block text-[13px] text-[var(--color-text-muted)] mb-1.5">{L('Was soll auf der Karte stehen?', 'What should the card say?')}</span>
          <textarea className="input" rows={2} value={c.text} onChange={(e) => setC({ ...c, text: e.target.value })} placeholder={L('z. B. Ich brauche bitte etwas zu trinken.', 'e.g. I would like something to drink, please.')} data-testid="comm-text" autoFocus />
        </label>
        <div>
          <span className="block text-[13px] text-[var(--color-text-muted)] mb-1.5">{L('Symbol', 'Symbol')}</span>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {COMM_EMOJIS.map((e) => (
              <button key={e} type="button" onClick={() => setC({ ...c, emoji: e })} aria-pressed={c.emoji === e} className="w-11 h-11 rounded-xl text-[22px] flex items-center justify-center" style={{ border: c.emoji === e ? '2px solid var(--color-primary)' : '1px solid var(--color-border)' }}>{e}</button>
            ))}
          </div>
          <input className="input" value={c.emoji} onChange={(e) => setC({ ...c, emoji: Array.from(e.target.value).slice(-2).join('') })} aria-label={L('Eigenes Symbol', 'Own symbol')} style={{ maxWidth: 120 }} />
        </div>
        <div>
          <span className="block text-[13px] text-[var(--color-text-muted)] mb-1.5">{L('Hintergrundfarbe', 'Background colour')}</span>
          <div className="flex flex-wrap gap-2">
            {COMM_COLORS.map((col) => (
              <button key={col} type="button" onClick={() => setC({ ...c, color: col })} aria-label={col} aria-pressed={c.color === col} className="w-11 h-11 rounded-full" style={{ background: col, border: c.color === col ? '3px solid var(--color-primary)' : '1px solid rgba(0,0,0,0.25)' }} />
            ))}
          </div>
        </div>
        <Button fullWidth onClick={save} disabled={!c.text.trim()} data-testid="comm-save">{L('Speichern', 'Save')}</Button>
      </div>
    </Modal>
  );
}
