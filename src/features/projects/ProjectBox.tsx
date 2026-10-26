import { useMemo, useState } from 'react';
import { ArrowLeftToLine, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { parkNotesRepo, PAPER_COLORS, type ParkNote } from '../parkbox/parkboxRepo';
import { createId } from '../../services/storage/repository';
import { projectsRepo } from './projectModel';
import { ASSIGN_TARGETS, assignToProject, logBoxSlip, type AssignTarget } from './projectAssign';
import { KIND_COLOR } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import { AddRow } from './ui';
import { SlipScheduler, formatDeliver } from '../parkbox/SlipScheduler';
import { setSlipDelivery } from '../parkbox/slipDelivery';
import type { ProjectApi } from './projectApi';

/** Die Zettel-Box dieses Projekts: schnell Zettel hineinlegen, später einem Platz im Projekt zuordnen. */
export function ProjectBox({ api }: { api: ProjectApi }) {
  const { p, L, lang, flush, reload } = api;
  const [tick, setTick] = useState(0);
  const [assign, setAssign] = useState<ParkNote | null>(null);
  const [msg, setMsg] = useState('');
  const [sched, setSched] = useState<ParkNote | null>(null);
  const notes = useMemo(() => {
    void tick;
    return parkNotesRepo.getAll().filter((n) => n.projectId === p.id && !n.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [p.id, tick]);
  const bump = () => setTick((t) => t + 1);
  const say = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 2600); };

  const add = (t: string) => {
    const now = new Date().toISOString();
    parkNotesRepo.save({ id: createId('park'), text: t, priority: 2, archived: false, paper: Math.floor(Math.random() * PAPER_COLORS.length), tilt: Math.round((Math.random() * 6 - 3) * 10) / 10, projectId: p.id, createdAt: now, updatedAt: now });
    flush();
    logBoxSlip(projectsRepo.getById(p.id) ?? p, t, lang);
    reload();
    bump();
  };
  const doAssign = (n: ParkNote, target: AssignTarget) => {
    flush();
    assignToProject(projectsRepo.getById(p.id) ?? p, n.text, target, lang);
    parkNotesRepo.remove(n.id);
    reload();
    setAssign(null);
    bump();
    say(L('Zugeordnet – der Zettel ist jetzt Teil des Projekts.', 'Assigned – the slip is now part of the project.'));
  };
  const toMain = (n: ParkNote) => {
    parkNotesRepo.save({ ...n, projectId: undefined, updatedAt: new Date().toISOString() });
    bump();
    say(L('Zurück in die Haupt-Box gelegt.', 'Put back into the main box.'));
  };

  return (
    <ProjectSubShell api={api} current="zettel" icon="🗒️" title={L('Zettel-Box', 'Slip box')} color={KIND_COLOR.box}>
      <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{L('Hier landen Einfälle zu diesem Projekt. Später legst du sie an den richtigen Platz.', 'Ideas for this project land here. Later you put them in the right place.')}</p>
      <AddRow placeholder={L('Zettel schreiben …', 'Write a slip …')} onAdd={add} testId="pbox-add" />
      {msg && <p className="text-[13px] mt-2" style={{ color: 'var(--color-primary)' }} role="status">{msg}</p>}
      <div className="grid grid-cols-2 gap-3 mt-4" data-testid="pbox-list">
        {notes.length === 0 && <p className="col-span-2 text-center text-[14px] text-[var(--color-text-faint)] py-6">{L('Die Box ist leer. Das ist gut so.', 'The box is empty. That is fine.')}</p>}
        {notes.map((n, i) => (
          <div key={n.id} className="proj-pop rounded-md p-3 shadow-sm flex flex-col gap-2" style={{ background: PAPER_COLORS[n.paper % PAPER_COLORS.length], transform: `rotate(${n.tilt}deg)`, animationDelay: `${i * 40}ms`, color: '#3a3226' }} data-testid="pbox-note">
            <p className="text-[14px] leading-snug whitespace-pre-line break-words">{n.text}</p>
            {n.deliverAt && <p className="text-[11.5px]" data-testid="pbox-flies">✉️ {formatDeliver(n.deliverAt, lang)}</p>}
            <div className="flex gap-1 mt-auto">
              <button type="button" onClick={() => setAssign(n)} className="flex-1 rounded-full py-1.5 text-[12.5px] bg-white/70" data-testid="pbox-assign">{L('Zuordnen', 'Assign')} →</button>
              <button type="button" onClick={() => setSched(n)} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-[14px]" aria-label={L('Zettel losfliegen lassen', 'Let the slip fly off')} title={L('Losfliegen lassen', 'Let it fly')} data-testid="pbox-fly">✉️</button>
              <button type="button" onClick={() => toMain(n)} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center" aria-label={L('Zurück in die Haupt-Box', 'Back to main box')} title={L('Zurück in die Haupt-Box', 'Back to main box')}><ArrowLeftToLine size={14} /></button>
              <button type="button" onClick={() => { parkNotesRepo.remove(n.id); bump(); }} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center" aria-label={L('Löschen', 'Delete')}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
      {sched && <SlipScheduler lang={lang} text={sched.text} initial={sched.deliverAt} onClose={() => setSched(null)} onSave={(at) => { setSlipDelivery(sched.id, at); setSched(null); bump(); say(L('Der Zettel fliegt zur gewählten Zeit auf deine Startseite.', 'The slip will fly onto your start page at the chosen time.')); }} />}
      <Modal open={!!assign} onClose={() => setAssign(null)} title={L('Wohin damit?', 'Where does it go?')} subtitle={assign?.text}>
        <div className="grid grid-cols-2 gap-2" data-testid="pbox-targets">
          {ASSIGN_TARGETS.map((a) => (
            <button key={a.id} type="button" onClick={() => assign && doAssign(assign, a.id)} className="rounded-xl border border-[var(--color-border-strong)] px-3 py-3 text-[14px] text-left" data-testid={`pbox-to-${a.id}`}>{a.icon} {L(a.de, a.en)}</button>
          ))}
        </div>
      </Modal>
    </ProjectSubShell>
  );
}
