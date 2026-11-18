import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Phone, Mail, MessageCircle, Play } from 'lucide-react';
import { useL } from '../projects/useL';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { routinesRepo } from '../routines/routinesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { phoneDigits } from '../nonverbal/statusRepo';
import { StepViewer, type ViewerStep } from './StepViewer';
import type { Resource } from '../../data/types';

export type CrisisItemRef = { kind: 'resource' | 'bridge' | 'routine' | 'contact'; id: string };

const clean = (s?: string) => (s ?? '').trim();

/**
 * Zeigt einen Eintrag aus dem Sicherheitsplan (Skill, Hilfsmittel, Brücke, Routine, Kontakt) im Krisenmodus-Stil
 * über dem Plan – mit allem, was die App sonst auch dazu zeigt, und einem „Schritt für Schritt“-Knopf zum Ausführen.
 * Schließen führt zurück in den Plan, der Krisenmodus wird nie verlassen.
 */
export function CrisisItemSheet({ item, onClose }: { item: CrisisItemRef; onClose: () => void }) {
  const { L } = useL();
  const [run, setRun] = useState<{ title: string; steps: ViewerStep[] } | null>(null);

  let title = '';
  let emoji = '';
  let lead = '';
  let fields: [string, string][] = [];
  let caution = '';
  let steps: ViewerStep[] = [];
  let stepsLabel = L('Schritt für Schritt', 'Step by step');
  let contact: ReturnType<typeof networkRepo.getById>;

  if (item.kind === 'resource') {
    const r = resourcesRepo.getById(item.id);
    if (!r) return null;
    title = r.title;
    lead = r.description ?? '';
    const sd = r.skillDetails;
    const hd = r.hilfsmittelDetails;
    if (sd) {
      fields = [
        [L('Wofür', 'What for'), clean(sd.subtitle)],
        [L('Wirkung', 'Effect'), clean(sd.wirkung)],
        [L('Wirkungsdauer', 'How long it works'), clean(sd.wirkungsdauer)],
        [L('Unterwegs', 'On the go'), clean(sd.unterwegsAlternative)],
        [L('Hilfsmittel dazu', 'Aids for it'), (sd.relatedHilfsmittelIds ?? []).map((id) => resourcesRepo.getById(id)?.title).filter(Boolean).join(', ')],
      ].filter(([, v]) => v) as [string, string][];
      caution = clean(sd.gegenanzeigen);
      steps = (sd.schritte ?? []).filter((s) => clean(s)).map((s) => ({ text: s }));
    } else if (hd) {
      fields = [
        [L('Wofür', 'What for'), clean(hd.subtitle)],
        [L('Beruhigung / Trost', 'Calming / comfort'), clean(hd.beruhigungTrost)],
        [L('Fokus / Ablenkung', 'Focus / distraction'), clean(hd.fokusAblenkung)],
        [L('Ventil für Anspannung', 'Outlet for tension'), clean(hd.ventilAnspannung)],
        [L('So geht es', 'How to'), clean(hd.methode)],
        [L('Dauer', 'Duration'), clean(hd.dauer)],
        [L('Wo es ist (zuhause)', 'Where it is (home)'), clean(hd.platzZuhause)],
        [L('Wo es ist (unterwegs)', 'Where it is (out)'), clean(hd.platzUnterwegs)],
      ].filter(([, v]) => v) as [string, string][];
      caution = clean(hd.ausschlusskriterium);
    }
    if (r.note) fields.push([L('Notiz', 'Note'), clean(r.note)]);
    if (steps.length === 0 && lead) steps = [{ text: lead }];
    stepsLabel = steps.length > 1 ? stepsLabel : L('Groß anzeigen', 'Show large');
    emoji = '🧰';
  } else if (item.kind === 'bridge') {
    const b = bridgesRepo.getById(item.id);
    if (!b) return null;
    title = b.title;
    lead = b.description ?? '';
    emoji = '🌉';
    steps = (b.levels ?? []).map((lv, i) => {
      const extras = lv.extras;
      const names = [...(extras?.skillIds ?? []), ...(extras?.hilfsmittelIds ?? []), ...(extras?.ortIds ?? []), ...(extras?.aktivitaetIds ?? [])]
        .map((id) => resourcesRepo.getById(id)?.title)
        .filter(Boolean)
        .join(', ');
      return { text: lv.title || `${L('Schritt', 'Step')} ${i + 1}`, note: [lv.description, names ? `${L('Dabei hilft', 'Helps')}: ${names}` : ''].filter(Boolean).join('\n'), emoji: undefined } as ViewerStep;
    });
    stepsLabel = L('Schritt für Schritt', 'Step by step');
  } else if (item.kind === 'routine') {
    const r = routinesRepo.getById(item.id);
    if (!r) return null;
    title = r.title;
    emoji = r.emoji || '🔁';
    lead = L(`${r.cards.length} kleine Schritte – immer nur einer auf dem Bildschirm.`, `${r.cards.length} small steps – only one on screen at a time.`);
    steps = r.cards.map((c) => ({ text: c.text, emoji: c.emoji, color: c.color, timerSec: c.timerSec }));
    stepsLabel = L('Routine starten', 'Start routine');
  } else {
    contact = networkRepo.getById(item.id);
    if (!contact) return null;
    title = contact.name;
    emoji = '🤝';
    lead = [contact.role, contact.description].filter(Boolean).join(' · ');
    if (contact.whatHelps) fields.push([L('Das hilft mir von dir', 'What helps me from you'), contact.whatHelps]);
  }

  return createPortal(
    <div className="fixed inset-0 z-[350] bg-white text-black overflow-y-auto" role="dialog" aria-label={title} data-testid="crisis-item-sheet">
      <div className="px-6 py-6 max-w-[520px] mx-auto" style={{ paddingTop: 'max(24px, env(safe-area-inset-top))' }}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <p className="text-[26px] leading-none mb-2" aria-hidden="true">{emoji}</p>
            <h2 className="text-[22px] font-medium leading-snug">{title}</h2>
          </div>
          <button onClick={onClose} aria-label={L('Zurück zum Plan', 'Back to the plan')} className="w-11 h-11 rounded-full border-2 border-black flex items-center justify-center flex-shrink-0" data-testid="crisis-item-close">
            <X size={22} />
          </button>
        </div>
        {lead && <p className="text-[16px] leading-relaxed text-black/85 mb-4 whitespace-pre-line">{lead}</p>}
        {caution && (
          <div className="border-2 border-black rounded-[12px] p-3.5 mb-4" data-testid="crisis-item-caution">
            <p className="text-[13px] uppercase tracking-wide font-medium mb-1">{L('Bitte beachten', 'Please note')}</p>
            <p className="text-[15px] leading-relaxed">{caution}</p>
          </div>
        )}
        {steps.length > 0 && (
          <button
            onClick={() => setRun({ title, steps })}
            className="w-full flex items-center justify-center gap-3 px-5 py-4 rounded-[12px] bg-black text-white text-[17px] font-medium mb-5"
            data-testid="crisis-item-run"
          >
            <Play size={20} /> {stepsLabel}
          </button>
        )}
        {fields.map(([l, v]) => (
          <div key={l} className="mb-3.5">
            <p className="text-[12.5px] uppercase tracking-wide text-black/60 mb-0.5">{l}</p>
            <p className="text-[16px] leading-relaxed whitespace-pre-line">{v}</p>
          </div>
        ))}
        {item.kind === 'resource' && steps.length > 1 && (
          <ol className="mt-2 mb-4 list-decimal pl-5">
            {steps.map((s, i) => <li key={i} className="text-[16px] leading-relaxed mb-1">{s.text}</li>)}
          </ol>
        )}
        {item.kind === 'bridge' && steps.length > 0 && (
          <ol className="mt-2 mb-4 list-decimal pl-5">
            {steps.map((s, i) => (
              <li key={i} className="text-[16px] leading-relaxed mb-1.5">
                <span className="font-medium">{s.text}</span>
                {s.note && <span className="block text-[14.5px] text-black/75 whitespace-pre-line">{s.note}</span>}
              </li>
            ))}
          </ol>
        )}
        {item.kind === 'routine' && (
          <ol className="mt-2 mb-4 list-decimal pl-5">
            {steps.map((s, i) => <li key={i} className="text-[16px] leading-relaxed mb-1">{s.emoji} {s.text}</li>)}
          </ol>
        )}
        {contact && (
          <div className="flex flex-col gap-2.5 mt-2">
            {contact.phone && (
              <a href={`tel:${contact.phone}`} className="flex items-center gap-3 px-5 py-4 rounded-[12px] bg-black text-white text-[17px] font-medium"><Phone size={20} /> {contact.phone}</a>
            )}
            {contact.phone && (
              <a href={`https://wa.me/${phoneDigits(contact.phone)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 px-5 py-4 rounded-[12px] border-2 border-black text-[17px] font-medium"><MessageCircle size={20} /> WhatsApp</a>
            )}
            {contact.email && (
              <a href={`mailto:${contact.email}`} className="flex items-center gap-3 px-5 py-4 rounded-[12px] border-2 border-black text-[17px] font-medium"><Mail size={20} /> {contact.email}</a>
            )}
          </div>
        )}
        <button onClick={onClose} className="w-full mt-6 px-5 py-4 rounded-[12px] border-2 border-black text-[17px] font-medium" data-testid="crisis-item-back">
          {L('Zurück zum Plan', 'Back to the plan')}
        </button>
      </div>
      {run && <StepViewer title={run.title} steps={run.steps} onClose={() => setRun(null)} />}
    </div>,
    document.body,
  );
}

export function resourceKindLabel(r: Resource, L: (de: string, en: string) => string): string {
  if (r.skillDetails) return 'Skill';
  if (r.hilfsmittelDetails) return L('Hilfsmittel', 'Aid');
  return L('Ressource', 'Resource');
}
