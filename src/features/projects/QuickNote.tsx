import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { parkNotesRepo, PAPER_COLORS } from '../parkbox/parkboxRepo';
import { createId } from '../../services/storage/repository';
import { projectsRepo, type Project } from './projectModel';
import { ASSIGN_TARGETS, assignToProject, logBoxSlip, type AssignTarget } from './projectAssign';
import type { Lfn } from './ui';

/** Schnell etwas festhalten. Landet als Zettel in der Box des Projekts – oder gleich an einem Platz im Projekt. */
export function QuickNote({ project, L, lang, onClose, onSaved }: { project: Project; L: Lfn; lang: 'de' | 'en'; onClose: () => void; onSaved: (msg: string) => void }) {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const now = () => new Date().toISOString();

  const toBox = () => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    const k = Math.floor(Math.random() * PAPER_COLORS.length);
    parkNotesRepo.save({ id: createId('park'), text: t, priority: 2, archived: false, paper: k, tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, projectId: project.id, createdAt: now(), updatedAt: now() });
    logBoxSlip(projectsRepo.getById(project.id) ?? project, t, lang);
    onSaved(L('Zettel liegt in der Box dieses Projekts.', 'The slip lies in this project’s box.'));
  };
  const toPlace = (target: AssignTarget) => {
    const t = text.trim();
    if (!t || busy) return;
    setBusy(true);
    assignToProject(projectsRepo.getById(project.id) ?? project, t, target, lang);
    onSaved(L('Eingetragen.', 'Added.'));
  };

  return (
    <Modal open onClose={onClose} title={L('Schnellnotiz', 'Quick note')} subtitle={L('Erst festhalten, später einsortieren.', 'Catch it now, sort it later.')}>
      <div className="flex flex-col gap-3" data-testid="quicknote-sheet">
        <textarea autoFocus className="input" rows={3} value={text} onChange={(e) => setText(e.target.value)} placeholder={L('Was ist dir eingefallen?', 'What came to your mind?')} data-testid="quicknote-text" />
        <Button fullWidth disabled={!text.trim() || busy} onClick={toBox} data-testid="quicknote-save">🗒️ {L('In die Zettel-Box', 'Into the slip box')}</Button>
        <div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('… oder gleich einsortieren als:', '… or sort it right away as:')}</p>
          <div className="flex flex-wrap gap-1.5">
            {ASSIGN_TARGETS.map((a) => (
              <button key={a.id} type="button" disabled={!text.trim() || busy} onClick={() => toPlace(a.id)} className="px-3 py-1.5 rounded-full text-[13px] border border-[var(--color-border-strong)] text-[var(--color-text)] disabled:opacity-40" data-testid={`quicknote-to-${a.id}`}>{a.icon} {L(a.de, a.en)}</button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}
