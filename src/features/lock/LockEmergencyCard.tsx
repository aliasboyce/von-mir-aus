import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { getLockEmergency, setLockEmergency, type LockEmergencyConfig, type LockInfoKey } from '../../services/lockEmergency';
import { safetyPlansRepo } from '../safetyPlan/safetyPlansRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { personalInfoStore } from '../safetyPlan/personalInfoStore';

/** Einstellungen für den Notfall-Zugang auf dem Sperrbildschirm: Die Person bestimmt, was fremde Helfende sehen dürfen. */
export function LockEmergencyCard() {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [cfg, setCfg] = useState<LockEmergencyConfig>(getLockEmergency());
  const plans = safetyPlansRepo.getAll();
  const people = networkRepo.getAll().filter((c) => c.category === 'person' && !c.isExample);
  const P = personalInfoStore.get();

  function save(next: LockEmergencyConfig) {
    setCfg(next);
    setLockEmergency(next);
  }
  const L = en
    ? { title: 'Emergency access on the lock screen', intro: 'When the app is locked, a button “Emergency help” stays reachable – for someone who wants to help while holding your phone. It always shows the general places to turn to (112, telephone counselling …). Everything personal only appears if you allow it here.', on: 'Show the “Emergency help” button', plan: 'Safety plan that may be shown', none: 'None', contacts: 'People that may be shown (phone / e-mail)', noContacts: 'No people in your safe network yet.', info: 'Information that may be shown', name: 'Name', allergies: 'Allergies', meds: 'Medication', preconditions: 'Pre-existing conditions', diagnoses: 'Diagnoses', icontacts: 'Emergency contacts', hint: 'Anyone who picks up the phone can read what you allow here. Allow only what you would be fine with a helper seeing. The information comes from “My details” in the safety plan.', empty: '(not filled in yet)' }
    : { title: 'Notfall-Zugang im gesperrten Modus', intro: 'Wenn die App gesperrt ist, bleibt ein Knopf „Notfall-Hilfe“ erreichbar – für jemanden, der dir helfen will und dein Handy in der Hand hat. Er zeigt immer die allgemeinen Anlaufstellen (112, Telefonseelsorge …). Alles Persönliche erscheint nur, wenn du es hier erlaubst.', on: 'Knopf „Notfall-Hilfe“ auf dem Sperrbildschirm zeigen', plan: 'Sicherheitsplan, der angezeigt werden darf', none: 'Keiner', contacts: 'Menschen, die angezeigt werden dürfen (Telefon / E-Mail)', noContacts: 'Im Sicheren Netz sind noch keine Menschen eingetragen.', info: 'Angaben, die angezeigt werden dürfen', name: 'Name', allergies: 'Allergien', meds: 'Medikamente', preconditions: 'Vorerkrankungen', diagnoses: 'Diagnosen', icontacts: 'Notfallkontakte', hint: 'Wer das Handy in die Hand nimmt, kann lesen, was du hier erlaubst. Erlaube nur, was eine helfende Person sehen darf. Die Angaben kommen aus „Meine Angaben“ im Sicherheitsplan.', empty: '(noch nicht ausgefüllt)' };
  const infoOpts: { key: LockInfoKey; label: string; filled: boolean }[] = [
    { key: 'name', label: L.name, filled: !!P.name?.trim() },
    { key: 'allergies', label: L.allergies, filled: !!P.allergies?.trim() },
    { key: 'meds', label: L.meds, filled: [...(P.regularMeds ?? []), ...(P.asNeededMeds ?? [])].some((m) => m.name.trim()) },
    { key: 'preconditions', label: L.preconditions, filled: !!P.preconditions?.trim() },
    { key: 'diagnoses', label: L.diagnoses, filled: !!P.diagnoses?.trim() },
    { key: 'contacts', label: L.icontacts, filled: (P.contacts ?? []).some((c) => c.name.trim()) },
  ];
  const box = 'w-5 h-5 flex-shrink-0 mt-0.5';
  return (
    <Card padding="md" className="mb-3" data-testid="lock-emergency-card">
      <p className="text-[14px] font-medium text-[var(--color-text)] flex items-center gap-2 mb-1"><LifeBuoy size={15} /> {L.title}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{L.intro}</p>
      <label className="flex items-start gap-2.5 mt-3 cursor-pointer">
        <input type="checkbox" className={box} checked={cfg.enabled} onChange={(e) => save({ ...cfg, enabled: e.target.checked })} data-testid="lock-em-enabled" />
        <span className="text-[14px] text-[var(--color-text)]">{L.on}</span>
      </label>
      {cfg.enabled && (
        <div className="mt-3 flex flex-col gap-3.5">
          <label className="text-[13px] text-[var(--color-text-muted)]">{L.plan}
            <select className="block w-full mt-1 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] text-[14px]" value={cfg.planId} onChange={(e) => save({ ...cfg, planId: e.target.value })} data-testid="lock-em-plan-select">
              <option value="">{L.none}</option>
              {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </label>
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-1.5">{L.contacts}</p>
            {people.length === 0 ? <p className="text-[12.5px] text-[var(--color-text-faint)]">{L.noContacts}</p> : (
              <div className="flex flex-col gap-1.5">
                {people.map((c) => (
                  <label key={c.id} className="flex items-start gap-2.5 cursor-pointer">
                    <input type="checkbox" className={box} checked={cfg.contactIds.includes(c.id)} onChange={(e) => save({ ...cfg, contactIds: e.target.checked ? [...cfg.contactIds, c.id] : cfg.contactIds.filter((x) => x !== c.id) })} data-testid={`lock-em-contact-${c.id}`} />
                    <span className="text-[14px] text-[var(--color-text)]">{c.name}{c.role ? <span className="text-[12.5px] text-[var(--color-text-faint)]"> · {c.role}</span> : null}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-1.5">{L.info}</p>
            <div className="flex flex-col gap-1.5">
              {infoOpts.map((o) => (
                <label key={o.key} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="checkbox" className={box} checked={cfg.info.includes(o.key)} onChange={(e) => save({ ...cfg, info: e.target.checked ? [...cfg.info, o.key] : cfg.info.filter((x) => x !== o.key) })} data-testid={`lock-em-info-${o.key}`} />
                  <span className="text-[14px] text-[var(--color-text)]">{o.label}{!o.filled && <span className="text-[12px] text-[var(--color-text-faint)]"> {L.empty}</span>}</span>
                </label>
              ))}
            </div>
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{L.hint}</p>
        </div>
      )}
    </Card>
  );
}
