import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { parkNotesRepo, PAPER_COLORS, type ParkNote } from './parkboxRepo';
import { projectsRepo } from '../projects/projectModel';
import { slipBackToBox, slipDelete, slipDone } from './slipDelivery';

/** Ein losgeflogener Zettel auf der Startseite: nicht wegklickbar – man entscheidet. */
export function SlipNotice({ note, lang, count }: { note: ParkNote; lang: 'de' | 'en'; count: number }) {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [sure, setSure] = useState(false);
  const proj = note.projectId ? projectsRepo.getById(note.projectId) : undefined;
  const live = parkNotesRepo.getById(note.id);
  if (!live) return null;
  const btn = 'flex-1 min-w-[7rem] rounded-full py-2.5 px-3 text-[13.5px] border';
  return (
    <Card padding="md" className="animate-in pulse-glow" style={{ borderColor: 'var(--color-notice)', borderWidth: 1.5 }} data-testid="due-slip">
      <p className="text-[12px] text-[var(--color-text-muted)] mb-2">✉️ {L('Ein Zettel ist bei dir gelandet', 'A slip has landed with you')}{proj ? ` · ${proj.emoji} ${proj.title}` : ''}{count > 1 ? ` (+${count - 1})` : ''}</p>
      <div className="rounded-md p-3 mb-3 shadow-sm" style={{ background: PAPER_COLORS[note.paper % PAPER_COLORS.length], color: '#3a3226', transform: `rotate(${note.tilt}deg)` }}>
        <p className="text-[15px] leading-snug whitespace-pre-line break-words" data-testid="due-slip-text">{note.text}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => slipBackToBox(note.id)} className={btn} style={{ borderColor: 'var(--color-border-strong)' }} data-testid="slip-back">{L('Zurück in die Box', 'Back into the box')}</button>
        <button type="button" onClick={() => slipDone(note.id)} className={btn} style={{ background: 'var(--color-primary)', color: '#fff', borderColor: 'transparent' }} data-testid="slip-done">✓ {L('Erledigt', 'Done')}</button>
        {sure ? (
          <button type="button" onClick={() => slipDelete(note.id)} className={btn} style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }} data-testid="slip-delete-sure">{L('Wirklich löschen?', 'Really delete?')}</button>
        ) : (
          <button type="button" onClick={() => setSure(true)} className={btn} style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }} data-testid="slip-delete">{L('Löschen', 'Delete')}</button>
        )}
      </div>
    </Card>
  );
}
