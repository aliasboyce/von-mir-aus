import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, X, Pill, Users } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { recurringMedicationsRepo, doseForDate } from '../mediLog/recurringMedicationsRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { personalInfoStore, type PersonalInfo, type PlanMedication, type PlanEmergencyContact } from './personalInfoStore';
import { planTexts } from './planTexts';

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[12px] text-[var(--color-text-faint)] mb-1">{label}</span>
      {children}
    </label>
  );
}

function MedList({
  title,
  items,
  whenLabel,
  onChange,
  addLabel,
  extra,
  testId,
}: {
  title: string;
  items: PlanMedication[];
  whenLabel: string;
  onChange: (next: PlanMedication[]) => void;
  addLabel: string;
  extra?: React.ReactNode;
  testId: string;
}) {
  const T = planTexts(useSettings().settings.language);
  const patch = (id: string, p: Partial<PlanMedication>) => onChange(items.map((m) => (m.id === id ? { ...m, ...p } : m)));
  return (
    <div data-testid={testId}>
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{title}</p>
      <div className="flex flex-col gap-2 mb-2">
        {items.map((m) => (
          <div key={m.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2.5 flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <input className="input" placeholder={T.medName} value={m.name} onChange={(e) => patch(m.id, { name: e.target.value })} />
              <button type="button" aria-label={T.remove} onClick={() => onChange(items.filter((x) => x.id !== m.id))} className="text-[var(--color-text-faint)] p-1 flex-shrink-0">
                <X size={14} />
              </button>
            </div>
            <div className="flex gap-2">
              <input className="input" placeholder={T.medDose} value={m.dose ?? ''} onChange={(e) => patch(m.id, { dose: e.target.value })} />
              <input className="input" placeholder={whenLabel} value={m.when ?? ''} onChange={(e) => patch(m.id, { when: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => onChange([...items, { id: createId('pmed'), name: '' }])}>
          {addLabel}
        </Button>
        {extra}
      </div>
    </div>
  );
}

/**
 * "Ganz oben beim Plan, freiwillig, ausklappbar": Name, Geburtsdatum, Adresse,
 * Medikamente, Allergien, Vorerkrankungen, Diagnosen, Notfallkontakte,
 * Krankenkasse, Zuzahlungsbefreiung, GdB, Haustiere. Ein Feld reicht, keines
 * ist Pflicht; im PDF erscheint nur, was ausgefüllt ist.
 */
export function PersonalInfoCard() {
  const { settings } = useSettings();
  const T = planTexts(settings.language);
  const [open, setOpen] = useState(false);
  const [info, setInfo] = useState<PersonalInfo>(() => personalInfoStore.get());
  const [msg, setMsg] = useState('');
  const [pickNet, setPickNet] = useState(false);

  function update(p: Partial<PersonalInfo>) {
    const next = { ...info, ...p };
    setInfo(next);
    personalInfoStore.set(next);
  }

  function importRegular() {
    const recurring = recurringMedicationsRepo.getAll().filter((m) => m.active !== false);
    if (recurring.length === 0) {
      setMsg(T.importMedsNone);
      return;
    }
    const have = new Set((info.regularMeds ?? []).map((m) => m.fromRecurringId).filter(Boolean));
    const today = new Date().toISOString().slice(0, 10);
    const added: PlanMedication[] = recurring
      .filter((m) => !have.has(m.id))
      .map((m) => {
        const d = doseForDate(m, today);
        return {
          id: createId('pmed'),
          name: m.name,
          dose: d.doseValue !== undefined ? `${d.doseValue}${d.doseUnit ? ' ' + d.doseUnit : ''}` : undefined,
          when: m.times.join(', '),
          fromRecurringId: m.id,
        };
      });
    update({ regularMeds: [...(info.regularMeds ?? []), ...added] });
    setMsg(T.importMedsDone);
  }

  const contacts = info.contacts ?? [];
  const patchContact = (id: string, p: Partial<PlanEmergencyContact>) => update({ contacts: contacts.map((c) => (c.id === id ? { ...c, ...p } : c)) });
  const networkPeople = networkRepo.getAll().filter((e) => e.category === 'person' && !contacts.some((c) => c.fromNetworkId === e.id));

  return (
    <Card className="mb-5" data-testid="personal-info-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 text-left"
        data-testid="personal-info-toggle"
      >
        <span>
          <span className="block text-[15px] font-medium text-[var(--color-text)]">{T.personalTitle}</span>
          <span className="block text-[12.5px] text-[var(--color-text-faint)] mt-0.5">{T.personalSub}</span>
        </span>
        {open ? <ChevronUp size={18} className="flex-shrink-0 text-[var(--color-text-faint)]" /> : <ChevronDown size={18} className="flex-shrink-0 text-[var(--color-text-faint)]" />}
      </button>

      {open && (
        <div className="flex flex-col gap-4 mt-4 animate-in" data-testid="personal-info-body">
          <Field label={T.name}>
            <input className="input" autoComplete="off" value={info.name ?? ''} onChange={(e) => update({ name: e.target.value })} />
          </Field>
          <Field label={T.birthdate}>
            <input className="input" autoComplete="off" placeholder="TT.MM.JJJJ" value={info.birthdate ?? ''} onChange={(e) => update({ birthdate: e.target.value })} />
          </Field>
          <Field label={T.address}>
            <textarea className="input" rows={2} autoComplete="off" value={info.address ?? ''} onChange={(e) => update({ address: e.target.value })} />
          </Field>

          <MedList
            testId="meds-regular"
            title={T.regularMeds}
            items={info.regularMeds ?? []}
            whenLabel={T.medWhen}
            addLabel={T.addMed}
            onChange={(next) => update({ regularMeds: next })}
            extra={
              <Button type="button" size="sm" variant="secondary" icon={<Pill size={14} />} onClick={importRegular} data-testid="meds-import">
                {T.importMeds}
              </Button>
            }
          />
          {msg && <p className="text-[12.5px] text-[var(--color-text-muted)] -mt-2">{msg}</p>}

          <MedList
            testId="meds-asneeded"
            title={T.asNeededMeds}
            items={info.asNeededMeds ?? []}
            whenLabel={T.medNeed}
            addLabel={T.addMed}
            onChange={(next) => update({ asNeededMeds: next })}
          />

          <Field label={T.allergies}>
            <textarea className="input" rows={2} value={info.allergies ?? ''} onChange={(e) => update({ allergies: e.target.value })} />
          </Field>
          <Field label={T.preconditions}>
            <textarea className="input" rows={2} value={info.preconditions ?? ''} onChange={(e) => update({ preconditions: e.target.value })} />
          </Field>
          <Field label={T.diagnoses}>
            <textarea className="input" rows={2} value={info.diagnoses ?? ''} onChange={(e) => update({ diagnoses: e.target.value })} />
          </Field>

          <div data-testid="contacts-block">
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-2">{T.contacts}</p>
            <div className="flex flex-col gap-2 mb-2">
              {contacts.map((c) => (
                <div key={c.id} className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <input className="input" placeholder={T.contactName} value={c.name} onChange={(e) => patchContact(c.id, { name: e.target.value })} />
                    <button type="button" aria-label={T.remove} onClick={() => update({ contacts: contacts.filter((x) => x.id !== c.id) })} className="text-[var(--color-text-faint)] p-1 flex-shrink-0">
                      <X size={14} />
                    </button>
                  </div>
                  <input className="input" placeholder={T.contactAddress} value={c.address ?? ''} onChange={(e) => patchContact(c.id, { address: e.target.value })} />
                  <div className="flex gap-2">
                    <input className="input" type="tel" placeholder={T.contactPhone} value={c.phone ?? ''} onChange={(e) => patchContact(c.id, { phone: e.target.value })} />
                    <input className="input" type="email" placeholder={T.contactEmail} value={c.email ?? ''} onChange={(e) => patchContact(c.id, { email: e.target.value })} />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" size="sm" variant="ghost" icon={<Plus size={14} />} onClick={() => update({ contacts: [...contacts, { id: createId('pcon'), name: '' }] })} data-testid="contact-add">
                {T.addContact}
              </Button>
              {networkPeople.length > 0 && (
                <Button type="button" size="sm" variant="secondary" icon={<Users size={14} />} onClick={() => setPickNet((v) => !v)}>
                  {T.fromNetwork}
                </Button>
              )}
            </div>
            {pickNet && (
              <div className="flex flex-wrap gap-2 mt-2">
                {networkPeople.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    className="text-[13px] rounded-full px-3 py-1.5 bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-text)]"
                    onClick={() => {
                      update({ contacts: [...contacts, { id: createId('pcon'), name: p.name, phone: p.phone, email: p.email, fromNetworkId: p.id }] });
                      setPickNet(false);
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Field label={T.insurance}>
            <input className="input" value={info.insurance ?? ''} onChange={(e) => update({ insurance: e.target.value })} />
          </Field>
          <Field label={T.insuranceNumber}>
            <input className="input" autoComplete="off" value={info.insuranceNumber ?? ''} onChange={(e) => update({ insuranceNumber: e.target.value })} />
          </Field>
          <Field label={T.copay}>
            <input className="input" placeholder={T.copayPh} value={info.copayExemption ?? ''} onChange={(e) => update({ copayExemption: e.target.value })} />
          </Field>
          <Field label={T.gdb}>
            <input className="input" placeholder={T.gdbPh} value={info.gdb ?? ''} onChange={(e) => update({ gdb: e.target.value })} />
          </Field>
          <Field label={T.pets}>
            <textarea className="input" rows={2} placeholder={T.petsPh} value={info.pets ?? ''} onChange={(e) => update({ pets: e.target.value })} />
          </Field>

          <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{T.storedLocal}</p>
        </div>
      )}
    </Card>
  );
}
