import { useState } from 'react';
import { Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { shareOrCopy } from '../../services/shareOrCopy';
import { richToPlain } from '../../services/richText';
import { mindmapRepo } from '../mindmap/mindmapModel';
import { defaultSelection, linkedMindmapIds, projectSlips, shareProjectPdf, type PdfSelection } from './projectPdf';
import { formatDate, metaOf, statusLabel, type Project } from './projectModel';
import { useL } from './useL';

function projectText(p: Project, lang: 'de' | 'en'): string {
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const out: string[] = [`${p.emoji} ${p.title}`, statusLabel(p.status, L)];
  if (p.summary.trim()) out.push('', p.summary.trim());
  if (p.start || p.end) out.push('', [p.start ? `${L('Start', 'Start')}: ${formatDate(p.start, lang)}` : '', p.end ? `${L('Ziel', 'Target')}: ${formatDate(p.end, lang)}` : ''].filter(Boolean).join('  '));
  p.blocks.forEach((b) => {
    if (b.kind === 'text' && b.text.trim()) out.push('', `${b.title}:`, richToPlain(b.text, { bullets: true }));
    if (b.kind === 'tasks' && b.items.length) out.push('', `${b.title}:`, ...b.items.map((t) => `${t.status === 'done' ? '✓' : '☐'} ${t.text}${t.due ? ` (${formatDate(t.due, lang, false)})` : ''}`));
    if (b.kind === 'timeline' && b.milestones.length) out.push('', `${b.title}:`, ...b.milestones.map((m) => `${m.done ? '✓' : '○'} ${m.title}${m.date ? ` – ${formatDate(m.date, lang)}` : ''}`));
    if (b.kind === 'decisions' && b.items.length) out.push('', `${b.title}:`, ...b.items.map((d) => `📌 ${d.text}`));
  });
  return out.join('\n');
}

/** Was soll mit? Dann PDF (mehrere A4-Seiten, gut druckbar) oder Kurztext. */
export function ProjectShareModal({ project, onClose }: { project: Project; onClose: () => void; today: string }) {
  const { L, lang } = useL();
  const [sel, setSel] = useState<PdfSelection>(() => defaultSelection(project));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const maps = linkedMindmapIds(project);
  const toggleBlock = (id: string) => setSel((s) => ({ ...s, blocks: { ...s.blocks, [id]: !s.blocks[id] } }));
  const toggleMap = (id: string) => setSel((s) => ({ ...s, mindmaps: { ...s.mindmaps, [id]: !s.mindmaps[id] } }));
  const allOn = () => setSel(defaultSelection(project));
  const row = (on: boolean, label: string, onClick: () => void, tid: string) => (
    <button type="button" onClick={onClick} aria-pressed={on} className={`flex items-center gap-3 text-left px-3 py-2.5 rounded-[var(--radius-md)] border ${on ? 'border-[var(--color-primary)] bg-[var(--color-primary-soft)]' : 'border-[var(--color-border)]'}`} data-testid={tid}>
      <span className="w-5 h-5 rounded border-2 flex items-center justify-center shrink-0" style={{ borderColor: 'var(--color-primary)', background: on ? 'var(--color-primary)' : 'transparent' }}>{on && <Check size={13} color="#fff" />}</span>
      <span className="text-[14px]">{label}</span>
    </button>
  );
  const anySelected = sel.header || sel.steps || sel.log || sel.box || Object.values(sel.blocks).some(Boolean) || Object.values(sel.mindmaps).some(Boolean);

  async function makePdf() {
    setBusy(true);
    setMsg('');
    try {
      const r = await shareProjectPdf(project, sel, lang);
      setMsg(r === 'shared' ? L('Das PDF ist bereit – im Teilen-Menü sichern, drucken oder verschicken.', 'The PDF is ready – save, print or send it from the share menu.') : r === 'downloaded' ? L('Das PDF wurde in deine Downloads gespeichert.', 'The PDF was saved to your downloads.') : r === 'cancelled' ? '' : L('Das PDF ließ sich hier nicht erstellen.', 'The PDF could not be made here.'));
    } catch {
      setMsg(L('Das PDF ließ sich hier nicht erstellen.', 'The PDF could not be made here.'));
    }
    setBusy(false);
  }

  return (
    <Modal open onClose={onClose} title={L('Projekt teilen', 'Share project')} subtitle={L('Was soll mit aufs PDF? Es darf auf mehrere DIN-A4-Seiten.', 'What goes on the PDF? It may run over several A4 pages.')}>
      <div className="flex flex-col gap-2" data-testid="project-share-sheet">
        {row(sel.header, L('Titel, Beschreibung, Daten', 'Title, description, dates'), () => setSel((s) => ({ ...s, header: !s.header })), 'share-header')}
        {(project.steps ?? []).length > 0 && row(sel.steps, `➡️ ${L('Nächste Schritte', 'Next steps')}`, () => setSel((s) => ({ ...s, steps: !s.steps })), 'share-steps')}
        {project.blocks.map((b, i) => row(!!sel.blocks[b.id], `${metaOf(b.kind).icon} ${b.title}`, () => toggleBlock(b.id), `share-block-${i}`))}
        {maps.map((id) => row(!!sel.mindmaps[id], `🕸️ ${L('Mindmap', 'Mind map')}: ${mindmapRepo.getById(id)?.title || '…'}`, () => toggleMap(id), `share-map-${id}`))}
        {projectSlips(project).length > 0 && row(sel.box, `🗒️ ${L('Zettel-Box', 'Slip box')}`, () => setSel((s) => ({ ...s, box: !s.box })), 'share-box')}
        {(project.log ?? []).length > 0 && row(sel.log, `📖 ${L('Protokoll', 'Log')}`, () => setSel((s) => ({ ...s, log: !s.log })), 'share-log')}
        {row(sel.notes, L('Notizen der Seiten', 'Notes of the pages'), () => setSel((s) => ({ ...s, notes: !s.notes })), 'share-notes')}
        {row(sel.pageBreaks, L('Jeder Teil auf einer eigenen Seite', 'Every part on its own page'), () => setSel((s) => ({ ...s, pageBreaks: !s.pageBreaks })), 'share-pagebreaks')}
        <button type="button" onClick={allOn} className="text-[13px] text-[var(--color-text-muted)] underline self-start py-1">{L('Alles auswählen', 'Select everything')}</button>
        <Button fullWidth disabled={busy || !anySelected} onClick={() => void makePdf()} data-testid="share-pdf">{busy ? L('PDF wird erstellt …', 'Making the PDF …') : L('PDF erstellen und teilen', 'Make PDF and share')}</Button>
        <Button fullWidth variant="secondary" onClick={() => void shareOrCopy({ title: project.title, text: projectText(project, lang) }, L('Der Text ist kopiert.', 'The text is copied.'))} data-testid="share-text">{L('Kurzfassung als Text', 'Short version as text')}</Button>
        {msg && <p className="text-[13px] text-[var(--color-text-muted)]" role="status" data-testid="share-msg">{msg}</p>}
        <p className="text-[11.5px] text-[var(--color-text-faint)]">{L('Das PDF liegt danach als Datei bei dir: Du kannst es in „Dateien“ sichern, ausdrucken oder verschicken. Farben, Emojis, Bilder und Grafiken sind mit drauf – so wie du sie beim Bearbeiten siehst.', 'The PDF is then a file on your device: save it to “Files”, print or send it. Colours, emojis, pictures and graphics are on it – just as you see them while editing.')}</p>
      </div>
    </Modal>
  );
}
