import { useMemo, useState } from 'react';
import { ArrowLeftToLine, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { parkNotesRepo, slipColor, type ParkNote } from '../parkbox/parkboxRepo';
import { newSlip, slipToPark, slipToWait } from '../parkbox/slipAttach';
import { projectsRepo } from './projectModel';
import { ASSIGN_TARGETS, assignToProject, logBoxSlip, type AssignTarget } from './projectAssign';
import { KIND_COLOR } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import { AddRow } from './ui';
import { SlipScheduler, formatDeliver } from '../parkbox/SlipScheduler';
import { BoxArt } from '../parkbox/BoxArt';
import { setSlipDelivery } from '../parkbox/slipDelivery';
import type { ProjectApi } from './projectApi';

/** Die Zettel-Box dieses Projekts: schnell Zettel hineinlegen, später einem Platz im Projekt zuordnen. */
export function ProjectBox({ api }: { api: ProjectApi }) {
  const { p, L, lang, flush, reload } = api;
  const [tick, setTick] = useState(0);
  const [assign, setAssign] = useState<ParkNote | null>(null);
  const [msg, setMsg] = useState('');
  const [sched, setSched] = useState<ParkNote | null>(null);
  /** Zettel, bei dem gerade gefragt wird, ob er wirklich aus dem Projekt raus soll (Schritt 2 von 2) */
  const [backFor, setBackFor] = useState<string | null>(null);
  const notes = useMemo(() => {
    void tick;
    return parkNotesRepo.getAll().filter((n) => n.projectId === p.id && !n.archived).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [p.id, tick]);
  const bump = () => setTick((t) => t + 1);
  const say = (m: string) => { setMsg(m); window.setTimeout(() => setMsg(''), 2600); };

  const add = (t: string) => {
    parkNotesRepo.save(newSlip(t, 'project', { projectId: p.id }));
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
    if (n.origin === 'wait') {
      slipToWait(n.id);
      say(L('Zurück ins Wartezimmer gelegt (Seite „Parkbox & Wartezimmer“).', 'Put back into the waiting room (page “Park box & waiting room”).'));
    } else {
      slipToPark(n.id);
      say(L('In die allgemeine Parkbox gelegt – die liegt außerhalb dieses Projekts.', 'Put into the general Park box – it lies outside this project.'));
    }
    setBackFor(null);
    bump();
  };

  return (
    <ProjectSubShell api={api} current="zettel" icon="🗒️" title={L('Zettel-Box', 'Slip box')} color={KIND_COLOR.box}>
      <BoxArt tone="project" label={L('Zettel-Box', 'Slip box')} count={notes.length} colors={notes.map((n) => slipColor(n).bg)} testId="pbox-art" width={190} />
      <p className="text-center text-[13px] text-[var(--color-text-muted)] mt-1 mb-3">{L('Hier landen Einfälle zu diesem Projekt. Später legst du sie an den richtigen Platz.', 'Ideas for this project land here. Later you put them in the right place.')}</p>
      <details className="mb-3 text-[12.5px] text-[var(--color-text-muted)]" data-testid="pbox-explain">
        <summary className="cursor-pointer select-none text-[var(--color-text-faint)]">{L('Was ist was?', 'What is what?')}</summary>
        <p className="mt-2 leading-relaxed">{L('🟩 Grüne Zettel gehören nur zu diesem Projekt. ', '🟩 Green slips belong to this project only. ')}<strong>{L('Außerhalb', 'Outside')}</strong>{L(' gibt es die allgemeine Parkbox (gelbe Zettel) und das Wartezimmer (blaue Zettel) – das sind eigene Orte für alles, was zu keinem Projekt gehört. Mit dem Pfeil ← legst du einen Zettel dorthin zurück (du wirst vorher gefragt).', ' there is the general Park box (yellow slips) and the waiting room (blue slips) – separate places for everything that belongs to no project. The arrow ← puts a slip back there (you are asked first).')} <Link to="/parkbox" className="underline text-[var(--color-primary)]" data-testid="pbox-to-park">{L('Zur Parkbox', 'To the Park box')} →</Link></p>
      </details>
      <AddRow placeholder={L('Zettel schreiben …', 'Write a slip …')} onAdd={add} testId="pbox-add" />
      {msg && <p className="text-[13px] mt-2" style={{ color: 'var(--color-primary)' }} role="status">{msg}</p>}
      <div className="grid grid-cols-2 gap-3 mt-4" data-testid="pbox-list">
        {notes.length === 0 && <p className="col-span-2 text-center text-[14px] text-[var(--color-text-faint)] py-6">{L('Die Box ist leer. Das ist gut so.', 'The box is empty. That is fine.')}</p>}
        {notes.map((n, i) => (
          <div key={n.id} className="proj-pop rounded-md p-3 shadow-sm flex flex-col gap-2" style={{ background: slipColor(n).bg, transform: `rotate(${n.tilt}deg)`, animationDelay: `${i * 40}ms`, color: slipColor(n).ink }} data-testid="pbox-note">
            <p className="text-[14px] leading-snug whitespace-pre-line break-words">{n.text}</p>
            {n.deliverAt && <p className="text-[11.5px]" data-testid="pbox-flies">✉️ {formatDeliver(n.deliverAt, lang)}</p>}
            {backFor === n.id ? (
              <div className="rounded-lg bg-white/75 p-2 mt-auto text-[#2f3f2b]" data-testid="pbox-back-confirm" role="group">
                <p className="text-[12.5px] leading-snug mb-1.5">{n.origin === 'wait' ? L('Zurück ins Wartezimmer legen? Der Zettel liegt dann außerhalb dieses Projekts.', 'Put back into the waiting room? The slip will then lie outside this project.') : L('In die allgemeine Parkbox legen? Der Zettel liegt dann außerhalb dieses Projekts.', 'Put into the general Park box? The slip will then lie outside this project.')}</p>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => toMain(n)} className="flex-1 rounded-full py-1.5 text-[12.5px] bg-[#2f3f2b] text-white" data-testid="pbox-back-yes">{L('Ja, raus', 'Yes, move it')}</button>
                  <button type="button" onClick={() => setBackFor(null)} className="flex-1 rounded-full py-1.5 text-[12.5px] bg-white border border-[#2f3f2b33]" data-testid="pbox-back-no">{L('Nein, bleibt', 'No, keep it')}</button>
                </div>
              </div>
            ) : (
            <div className="flex gap-1 mt-auto">
              <button type="button" onClick={() => setAssign(n)} className="flex-1 rounded-full py-1.5 text-[12.5px] bg-white/70" data-testid="pbox-assign">{L('Zuordnen', 'Assign')} →</button>
              <button type="button" onClick={() => setSched(n)} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center text-[14px]" aria-label={L('Zettel losfliegen lassen – wird zur Erinnerung', 'Let the slip fly off – becomes a reminder')} title={L('Losfliegen lassen – wird zur Erinnerung auf der Startseite', 'Let it fly – becomes a reminder on the start page')} data-testid="pbox-fly">✉️</button>
              <button type="button" onClick={() => setBackFor(n.id)} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center" aria-label={n.origin === 'wait' ? L('Zurück ins Wartezimmer (außerhalb des Projekts)', 'Back to the waiting room (outside the project)') : L('Zurück in die allgemeine Parkbox (außerhalb des Projekts)', 'Back to the general Park box (outside the project)')} title={n.origin === 'wait' ? L('Zurück ins Wartezimmer', 'Back to the waiting room') : L('Zurück in die allgemeine Parkbox', 'Back to the general Park box')} data-testid="pbox-back"><ArrowLeftToLine size={14} /></button>
              <button type="button" onClick={() => { parkNotesRepo.remove(n.id); bump(); }} className="w-8 h-8 rounded-full bg-white/60 flex items-center justify-center" aria-label={L('Löschen', 'Delete')}><Trash2 size={14} /></button>
            </div>
            )}
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
