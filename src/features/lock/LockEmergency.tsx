import { useState } from 'react';
import { ChevronLeft, ChevronDown, Phone, Mail, ShieldCheck } from 'lucide-react';
import { EmergencyCard } from '../home/EmergencyCard';
import { getLockEmergency, type LockInfoKey } from '../../services/lockEmergency';
import { safetyPlansRepo, WARNING_TIER_ORDER } from '../safetyPlan/safetyPlansRepo';
import { personalInfoStore } from '../safetyPlan/personalInfoStore';
import { networkRepo } from '../safetyNet/networkRepo';
import { TIER_SHORT_LABELS } from '../safetyPlan/tierMeta';

/**
 * Begrenzte Notfall-Ansicht auf dem Sperrbildschirm – für Menschen, die helfen wollen, während das
 * Handy gesperrt ist. Nur die Anlaufstellen sind immer da; alles Persönliche nur, wenn die Person
 * es vorher in den Einstellungen freigegeben hat.
 */
export function LockEmergency({ en, onBack }: { en: boolean; onBack: () => void }) {
  const cfg = getLockEmergency();
  const L = en
    ? { title: 'Emergency help', intro: 'This phone is locked. Here is what the owner has allowed to be shown, and who to call.', back: 'Back', plan: 'Safety plan', warn: 'Early signs', help: 'What helps', info: 'Information for helpers', contacts: 'People to call', open: 'Show', close: 'Hide', noPersonal: 'The owner has not released any personal information here.', name: 'Name', allergies: 'Allergies', meds: 'Medication', preconditions: 'Pre-existing conditions', diagnoses: 'Diagnoses', icontacts: 'Emergency contacts', tip: 'If someone is in acute danger: call 112.' }
    : { title: 'Notfall-Hilfe', intro: 'Dieses Handy ist gesperrt. Hier steht, was die Besitzer:in zum Anzeigen freigegeben hat – und wen man anrufen kann.', back: 'Zurück', plan: 'Sicherheitsplan', warn: 'Frühe Anzeichen', help: 'Was hilft', info: 'Angaben für Helfende', contacts: 'Menschen zum Anrufen', open: 'Anzeigen', close: 'Verbergen', noPersonal: 'Die Besitzer:in hat hier keine persönlichen Angaben freigegeben.', name: 'Name', allergies: 'Allergien', meds: 'Medikamente', preconditions: 'Vorerkrankungen', diagnoses: 'Diagnosen', icontacts: 'Notfallkontakte', tip: 'Bei akuter Gefahr: Notruf 112.' };

  const plan = cfg.planId ? safetyPlansRepo.getAll().find((p) => p.id === cfg.planId) : undefined;
  const warn = plan ? plan.warningSignals.filter((w) => !w.example) : [];
  const help = plan ? plan.helpItems.filter((h) => !h.example) : [];
  const people = networkRepo.getAll().filter((c) => cfg.contactIds.includes(c.id));
  const P = personalInfoStore.get();
  const has = (k: LockInfoKey) => cfg.info.includes(k);
  const medLine = (m: { name: string; dose?: string; when?: string }) => [m.name, m.dose, m.when].filter((x) => x && x.trim()).join(' · ');
  const infoRows: [string, string][] = [];
  if (has('name') && P.name?.trim()) infoRows.push([L.name, P.name.trim()]);
  if (has('allergies') && P.allergies?.trim()) infoRows.push([L.allergies, P.allergies.trim()]);
  if (has('meds')) {
    const all = [...(P.regularMeds ?? []), ...(P.asNeededMeds ?? [])].filter((m) => m.name.trim()).map(medLine);
    if (all.length) infoRows.push([L.meds, all.join('\n')]);
  }
  if (has('preconditions') && P.preconditions?.trim()) infoRows.push([L.preconditions, P.preconditions.trim()]);
  if (has('diagnoses') && P.diagnoses?.trim()) infoRows.push([L.diagnoses, P.diagnoses.trim()]);
  if (has('contacts')) {
    const cs = (P.contacts ?? []).filter((c) => c.name.trim());
    if (cs.length) infoRows.push([L.icontacts, cs.map((c) => [c.name, c.phone, c.email].filter((x) => x && x.trim()).join(' · ')).join('\n')]);
  }
  const anyPersonal = !!plan || people.length > 0 || infoRows.length > 0;

  return (
    <div className="fixed inset-0 z-[10002] overflow-y-auto bg-white" style={{ color: '#111' }} data-testid="lock-emergency" role="dialog" aria-modal="true" aria-label={L.title}>
      <div className="max-w-[420px] mx-auto px-6 py-6 min-h-full flex flex-col">
        <button type="button" onClick={onBack} className="flex items-center gap-1 self-start -ml-2 px-2 py-2 text-[15px]" data-testid="lock-emergency-back">
          <ChevronLeft size={20} /> {L.back}
        </button>
        <h1 className="text-[24px] font-medium mt-2 mb-1">{L.title}</h1>
        <p className="text-[14px] leading-relaxed mb-1" style={{ color: '#444' }}>{L.intro}</p>
        <a href="tel:112" className="flex items-center gap-3 px-4 py-4 rounded-[14px] text-white text-[19px] font-medium mt-4" style={{ background: '#111' }} data-testid="lock-em-112">
          <Phone size={24} /> {en ? 'Emergency 112' : 'Notruf 112'}
        </a>
        <div className="mt-3">
          <Fold title={en ? 'Places to turn to' : 'Anlaufstellen'} icon={<Phone size={18} />} L={L} testid="lock-em-help">
            <EmergencyCard en={en} />
          </Fold>
        </div>

        <div className="mt-6 flex flex-col gap-3" data-testid="lock-emergency-personal">
          {plan && (
            <Fold title={`${L.plan}: ${plan.name}`} icon={<ShieldCheck size={18} />} L={L} testid="lock-em-plan">
              {warn.length > 0 && (
                <>
                  <p className="text-[12.5px] uppercase tracking-wide mb-1" style={{ color: '#555' }}>{L.warn}</p>
                  <ul className="mb-4">{WARNING_TIER_ORDER.flatMap((tier) => warn.filter((w) => w.tier === tier).map((w) => <li key={w.id} className="text-[15.5px] leading-relaxed mb-1">• <span style={{ color: '#555' }}>[{TIER_SHORT_LABELS[tier]}]</span> {w.text}</li>))}</ul>
                </>
              )}
              {help.length > 0 && (
                <>
                  <p className="text-[12.5px] uppercase tracking-wide mb-1" style={{ color: '#555' }}>{L.help}</p>
                  <ul>{WARNING_TIER_ORDER.flatMap((tier) => help.filter((h) => h.tier === tier).map((h) => <li key={h.id} className="text-[15.5px] leading-relaxed mb-1">• <span style={{ color: '#555' }}>[{TIER_SHORT_LABELS[tier]}]</span> {h.text}</li>))}</ul>
                </>
              )}
            </Fold>
          )}
          {infoRows.length > 0 && (
            <Fold title={L.info} L={L} testid="lock-em-info">
              {infoRows.map(([k, v]) => (
                <div key={k} className="mb-3">
                  <p className="text-[12.5px] uppercase tracking-wide" style={{ color: '#555' }}>{k}</p>
                  <p className="text-[15.5px] leading-relaxed whitespace-pre-line">{v}</p>
                </div>
              ))}
            </Fold>
          )}
          {people.length > 0 && (
            <Fold title={L.contacts} L={L} testid="lock-em-contacts">
              <div className="flex flex-col gap-2.5">
                {people.map((c) => (
                  <div key={c.id} className="border-2 rounded-[12px] p-3.5" style={{ borderColor: '#ddd' }}>
                    <p className="text-[16px] font-medium">{c.name}</p>
                    {c.role && <p className="text-[13px]" style={{ color: '#555' }}>{c.role}</p>}
                    {c.phone && <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-[15px] mt-1.5 underline"><Phone size={15} /> {c.phone}</a>}
                    {c.email && <a href={`mailto:${c.email}`} className="flex items-center gap-2 text-[15px] mt-1 underline"><Mail size={15} /> {c.email}</a>}
                  </div>
                ))}
              </div>
            </Fold>
          )}
          {!anyPersonal && <p className="text-[13.5px] leading-relaxed" style={{ color: '#555' }} data-testid="lock-em-none">{L.noPersonal}</p>}
        </div>
        <p className="text-[13px] mt-6 pb-6" style={{ color: '#555' }}>{L.tip}</p>
      </div>
    </div>
  );
}

function Fold({ title, icon, children, L, testid }: { title: string; icon?: React.ReactNode; children: React.ReactNode; L: { open: string; close: string }; testid: string }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-[14px] border-2" style={{ borderColor: '#111' }} data-testid={testid}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="w-full flex items-center gap-3 px-4 py-3.5 text-left" style={{ background: "transparent" }} data-testid={`${testid}-toggle`}>
        {icon}
        <span className="flex-1 text-[16.5px] font-medium">{title}</span>
        <span className="text-[13px] underline">{open ? L.close : L.open}</span>
        <ChevronDown size={18} style={{ transform: open ? 'rotate(180deg)' : undefined }} />
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </section>
  );
}
