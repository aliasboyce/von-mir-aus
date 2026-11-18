import { useState } from 'react';
import { Plus, Pencil, Trash2, Maximize2 } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Button } from '../../components/ui/Button';
import { useL } from '../projects/useL';
import { StepViewer } from '../crisis/StepViewer';
import { CommCardEditor } from './CommCardEditor';
import { commCardsRepo, ensureCommCards, inkFor, newCommCard, type CommCard } from './commCardsRepo';

/**
 * Kommunikationskarten: schlicht gestaltete Vollbild-Karten zum Zeigen. So viele wie man mag; durchblättern,
 * bearbeiten, löschen, jede mit eigener Hintergrundfarbe. Gehören automatisch zu Sicherheitsplan, Notfallrucksack und Krisenmodus.
 */
export function CommCardsPage() {
  const { L, lang } = useL();
  const [cards, setCards] = useState<CommCard[]>(() => ensureCommCards(lang));
  const [viewAt, setViewAt] = useState<number | null>(null);
  const [editing, setEditing] = useState<CommCard | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const refresh = () => setCards(commCardsRepo.getAll());

  const remove = (id: string) => {
    commCardsRepo.remove(id);
    setConfirmDel(null);
    setViewAt(null);
    refresh();
  };

  return (
    <div className="pb-24">
      <TopBar />
      <div className="px-5">
        <h1 className="text-[24px] font-medium text-[var(--color-text)] mb-1.5">{L('Kommunikationskarten', 'Communication cards')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-4">
          {L('Wenn Sprechen gerade nicht geht: Karte antippen, sie füllt den ganzen Bildschirm – einfach zeigen. Wische für die nächste Karte.', 'When speaking is not possible: tap a card, it fills the whole screen – just show it. Swipe for the next card.')}
        </p>
        <Button fullWidth icon={<Plus size={17} />} onClick={() => setEditing(newCommCard())} className="mb-5" data-testid="comm-new">{L('Neue Karte gestalten', 'Design a new card')}</Button>
        {cards.length === 0 && <p className="text-[14px] text-[var(--color-text-muted)]">{L('Noch keine Karten. Gestalte die erste – ein Satz genügt.', 'No cards yet. Design the first one – one sentence is enough.')}</p>}
        <ul className="flex flex-col gap-3" data-testid="comm-list">
          {cards.map((c, i) => (
            <li key={c.id} className="rounded-2xl overflow-hidden" style={{ background: c.color, color: inkFor(c.color), border: '1px solid rgba(0,0,0,0.12)' }} data-testid="comm-card">
              <button type="button" onClick={() => setViewAt(i)} className="w-full flex items-center gap-4 text-left px-4 py-4 min-h-[72px]" data-testid="comm-open">
                <span className="text-[34px] leading-none flex-shrink-0" aria-hidden="true">{c.emoji}</span>
                <span className="flex-1 min-w-0 text-[17px] font-medium leading-snug">{c.text}</span>
                <Maximize2 size={18} className="flex-shrink-0 opacity-60" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-1 px-2 pb-2" style={{ color: inkFor(c.color) }}>
                {c.isExample && <span className="text-[11px] uppercase tracking-wide opacity-70 px-2">{L('Beispiel', 'Example')}</span>}
                <span className="flex-1" />
                {confirmDel === c.id ? (
                  <>
                    <span className="text-[13px] px-1">{L('Wirklich löschen?', 'Really delete?')}</span>
                    <button onClick={() => remove(c.id)} className="px-3 h-10 rounded-full border text-[13px] font-medium" style={{ borderColor: 'currentColor' }} data-testid="comm-delete-yes">{L('Ja, löschen', 'Yes, delete')}</button>
                    <button onClick={() => setConfirmDel(null)} className="px-3 h-10 rounded-full text-[13px]">{L('Nein', 'No')}</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditing(c)} aria-label={L('Bearbeiten', 'Edit')} className="w-10 h-10 rounded-full flex items-center justify-center" data-testid="comm-edit"><Pencil size={17} /></button>
                    <button onClick={() => setConfirmDel(c.id)} aria-label={L('Löschen', 'Delete')} className="w-10 h-10 rounded-full flex items-center justify-center" data-testid="comm-delete"><Trash2 size={17} /></button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>
      {viewAt != null && cards.length > 0 && (
        <StepViewer
          title={L('Kommunikationskarten', 'Communication cards')}
          steps={cards.map((c) => ({ text: c.text, emoji: c.emoji, color: c.color }))}
          startAt={viewAt}
          nav="swipe"
          onClose={() => setViewAt(null)}
          onEdit={(i) => { setEditing(cards[i]); }}
          onDelete={(i) => { if (cards[i]) setConfirmDel(cards[i].id); setViewAt(null); }}
        />
      )}
      {editing && (
        <CommCardEditor
          card={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
}
