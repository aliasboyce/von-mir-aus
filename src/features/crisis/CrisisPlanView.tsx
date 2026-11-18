import { useState } from 'react';
import { useL } from '../projects/useL';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { safetyPlansRepo, normalizePlan, WARNING_TIER_ORDER } from '../safetyPlan/safetyPlansRepo';
import { TIER_LABELS } from '../safetyPlan/tierMeta';
import { personalInfoStore, clinicWishesStore } from '../safetyPlan/personalInfoStore';
import { CLINIC_FIELDS } from '../safetyPlan/ClinicWishesCard';
import { planTexts } from '../safetyPlan/planTexts';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { routinesRepo } from '../routines/routinesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { CrisisItemSheet, type CrisisItemRef } from './CrisisItemSheet';
import type { WarningTier } from '../../data/types';

const lines = (v?: string) => (v ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
/** Stufen im Krisenmodus ohne Farbe lesbar: Symbol + Name */
const TIER_MARK: Record<WarningTier, string> = { gelb: '●', orange: '●●', rot: '●●●' };

function ItemButton({ emoji, label, sub, onClick, testId }: { emoji: string; label: string; sub?: string; onClick: () => void; testId?: string }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 rounded-[12px] border-2 border-black text-left bg-white hover:bg-black/5" data-testid={testId}>
      <span className="text-[22px] flex-shrink-0" aria-hidden="true">{emoji}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-[16px] font-medium leading-snug">{label}</span>
        {sub && <span className="block text-[13px] text-black/65 truncate">{sub}</span>}
      </span>
      <span className="text-[13px] font-medium flex-shrink-0">{'›'}</span>
    </button>
  );
}

/**
 * Der Sicherheitsplan im Krisenmodus – mit allem, was er in der App auch zeigt: alle Pläne, alle drei Stufen
 * (Warnzeichen, freie Hilfen, verknüpfte Skills/Ressourcen, Brücken, Routinen, Kontakte), die vier Abschnitte,
 * persönliche Angaben und Klinikwünsche. Einträge lassen sich hier direkt öffnen und ausführen; „Zurück“ führt wieder in den Plan.
 * Beispiele (vorgeschlagene Texte) werden wie im PDF weggelassen.
 */
export function CrisisPlanView({ planId, onPick }: { planId?: string; onPick?: (id: string) => void }) {
  const { L } = useL();
  const t = useT();
  const { settings } = useSettings();
  const T = planTexts(settings.language);
  const plans = safetyPlansRepo.getAll().map(normalizePlan);
  const [activeId, setActiveId] = useState<string | undefined>(planId ?? plans[0]?.id);
  const [open, setOpen] = useState<CrisisItemRef | null>(null);
  const plan = plans.find((p) => p.id === activeId) ?? plans[0];
  if (!plan) return <p className="text-[15px] text-black/70 leading-relaxed mt-4">{t.crisisMode.noPlanYet}</p>;

  const personal = personalInfoStore.get();
  const clinic = clinicWishesStore.get();
  const medLine = (m: { name: string; dose?: string; when?: string }) => [m.name, m.dose, m.when].filter((x) => x && x.trim()).join(' · ');
  const regular = (personal.regularMeds ?? []).filter((m) => m.name.trim()).map(medLine);
  const asNeeded = (personal.asNeededMeds ?? []).filter((m) => m.name.trim()).map(medLine);
  const pcontacts = (personal.contacts ?? []).filter((c) => c.name.trim());
  const personalRows: [string, string | undefined][] = [
    [T.name, personal.name], [T.birthdate, personal.birthdate], [T.address, personal.address],
    [T.allergies, personal.allergies], [T.preconditions, personal.preconditions], [T.diagnoses, personal.diagnoses],
    [T.insurance, personal.insurance], [T.insuranceNumber, personal.insuranceNumber], [T.copay, personal.copayExemption], [T.gdb, personal.gdb], [T.pets, personal.pets],
  ];
  const personalFilled = personalRows.filter(([, v]) => lines(v).length > 0);
  const hasPersonal = personalFilled.length > 0 || regular.length > 0 || asNeeded.length > 0 || pcontacts.length > 0;
  const clinicFilled = CLINIC_FIELDS.filter((k) => lines(clinic[k]).length > 0);

  const sectionTexts = plan.sections.map((s) => ({ key: s.key, items: s.items.filter((i) => i.trim()) })).filter((s) => s.items.length > 0);
  let anything = hasPersonal || clinicFilled.length > 0 || sectionTexts.length > 0;

  return (
    <div className="mt-2" data-testid="crisis-plan-view">
      {plans.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-4" role="tablist" aria-label={L('Pläne', 'Plans')}>
          {plans.map((p) => (
            <button
              key={p.id}
              role="tab"
              aria-selected={p.id === plan.id}
              onClick={() => { setActiveId(p.id); onPick?.(p.id); }}
              className={`px-4 py-2.5 rounded-full border-2 border-black text-[15px] font-medium ${p.id === plan.id ? 'bg-black text-white' : 'bg-white text-black'}`}
              data-testid="crisis-plan-tab"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}

      {WARNING_TIER_ORDER.map((tier) => {
        const warn = plan.warningSignals.filter((w) => w.tier === tier && !w.example);
        const help = plan.helpItems.filter((h) => h.tier === tier && !h.example);
        const linked = plan.linkedByTier[tier];
        const resources = linked.resourceIds.map((id) => resourcesRepo.getById(id)).filter((x): x is NonNullable<typeof x> => !!x);
        const bridges = linked.bridgeIds.map((id) => bridgesRepo.getById(id)).filter((x): x is NonNullable<typeof x> => !!x);
        const routines = (linked.routineIds ?? []).map((id) => routinesRepo.getById(id)).filter((x): x is NonNullable<typeof x> => !!x);
        const contacts = linked.contactIds.map((id) => networkRepo.getById(id)).filter((x): x is NonNullable<typeof x> => !!x);
        const ifThen = warn.filter((w) => w.resourceId && resourcesRepo.getById(w.resourceId));
        if (warn.length + help.length + resources.length + bridges.length + routines.length + contacts.length === 0) return null;
        anything = true;
        return (
          <section key={tier} className="mb-6 border-l-[6px] border-black pl-4" data-testid={`crisis-tier-${tier}`}>
            <h3 className="text-[16px] font-medium leading-snug mb-3"><span aria-hidden="true" className="mr-1.5 tracking-tighter">{TIER_MARK[tier]}</span>{TIER_LABELS[tier]}</h3>
            {warn.length > 0 && (
              <>
                <p className="text-[12.5px] uppercase tracking-wide text-black/60 mb-1.5">{t.safetyPlan.warningSignals}</p>
                <ul className="mb-3">
                  {warn.map((w) => (
                    <li key={w.id} className="text-[16px] leading-relaxed mb-1">• {w.text}</li>
                  ))}
                </ul>
              </>
            )}
            {ifThen.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {ifThen.map((w) => {
                  const r = resourcesRepo.getById(w.resourceId!)!;
                  return <ItemButton key={w.id} emoji="➜" label={r.title} sub={`${L('Wenn', 'If')}: ${w.text}`} onClick={() => setOpen({ kind: 'resource', id: r.id })} />;
                })}
              </div>
            )}
            {help.length > 0 && (
              <>
                <p className="text-[12.5px] uppercase tracking-wide text-black/60 mb-1.5">{t.safetyPlan.helpItems}</p>
                <ul className="mb-3">
                  {help.map((h) => (
                    <li key={h.id} className="text-[16px] leading-relaxed mb-1">• {h.text}</li>
                  ))}
                </ul>
              </>
            )}
            {resources.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                <p className="text-[12.5px] uppercase tracking-wide text-black/60">{t.safetyPlan.linkedResources}</p>
                {resources.map((r) => <ItemButton key={r.id} emoji={r.skillDetails ? '🧘' : '🧰'} label={r.title} sub={r.skillDetails?.subtitle ?? r.hilfsmittelDetails?.subtitle} onClick={() => setOpen({ kind: 'resource', id: r.id })} testId="crisis-open-resource" />)}
              </div>
            )}
            {bridges.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                <p className="text-[12.5px] uppercase tracking-wide text-black/60">{t.safetyPlan.linkedBridges}</p>
                {bridges.map((b) => <ItemButton key={b.id} emoji="🌉" label={b.title} onClick={() => setOpen({ kind: 'bridge', id: b.id })} testId="crisis-open-bridge" />)}
              </div>
            )}
            {routines.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                <p className="text-[12.5px] uppercase tracking-wide text-black/60">{L('Meine Routinen', 'My routines')}</p>
                {routines.map((r) => <ItemButton key={r.id} emoji={r.emoji || '🔁'} label={r.title} sub={L(`${r.cards.length} kleine Schritte`, `${r.cards.length} small steps`)} onClick={() => setOpen({ kind: 'routine', id: r.id })} testId="crisis-open-routine" />)}
              </div>
            )}
            {contacts.length > 0 && (
              <div className="flex flex-col gap-2 mb-1">
                <p className="text-[12.5px] uppercase tracking-wide text-black/60">{t.safetyPlan.linkedContacts}</p>
                {contacts.map((c) => <ItemButton key={c.id} emoji="📞" label={c.name} sub={c.phone ?? c.role} onClick={() => setOpen({ kind: 'contact', id: c.id })} testId="crisis-open-contact" />)}
              </div>
            )}
          </section>
        );
      })}

      {sectionTexts.length > 0 && (
        <section className="mb-6" data-testid="crisis-sections">
          {sectionTexts.map((s) => (
            <div key={s.key} className="mb-4">
              <h3 className="text-[16px] font-medium mb-1.5">{(t.safetyPlan.sections as Record<string, string>)[s.key] ?? s.key}</h3>
              <ul>{s.items.map((i, n) => <li key={n} className="text-[16px] leading-relaxed mb-1">• {i}</li>)}</ul>
            </div>
          ))}
        </section>
      )}

      {hasPersonal && (
        <section className="mb-6 border-2 border-black/20 rounded-[12px] p-4" data-testid="crisis-personal">
          <h3 className="text-[16px] font-medium mb-2.5">{T.personalTitle.replace(/ \(.*\)$/, '')}</h3>
          {personalFilled.slice(0, 3).map(([l, v]) => <Field key={l} label={l} value={v} />)}
          {regular.length > 0 && <Field label={T.regularMeds} value={regular.join('\n')} />}
          {asNeeded.length > 0 && <Field label={T.asNeededMeds} value={asNeeded.join('\n')} />}
          {personalFilled.slice(3).map(([l, v]) => <Field key={l} label={l} value={v} />)}
          {pcontacts.length > 0 && (
            <div className="mb-2">
              <p className="text-[12.5px] uppercase tracking-wide text-black/60 mb-0.5">{T.contacts}</p>
              {pcontacts.map((c) => (
                <p key={c.id} className="text-[16px] leading-relaxed">
                  {c.name}{c.phone ? <> · <a href={`tel:${c.phone}`} className="underline">{c.phone}</a></> : null}{c.address ? ` · ${c.address}` : ''}
                </p>
              ))}
            </div>
          )}
        </section>
      )}

      {clinicFilled.length > 0 && (
        <section className="mb-6 border-2 border-black/20 rounded-[12px] p-4" data-testid="crisis-clinic">
          <h3 className="text-[16px] font-medium mb-2.5">{T.clinicTitle}</h3>
          {clinicFilled.map((k) => <Field key={k} label={T[k]} value={clinic[k]} />)}
        </section>
      )}

      {!anything && <p className="text-[15px] text-black/70 leading-relaxed">{t.crisisMode.noPlanYet}</p>}
      {open && <CrisisItemSheet item={open} onClose={() => setOpen(null)} />}
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  const ls = lines(value);
  if (ls.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="text-[12.5px] uppercase tracking-wide text-black/60 mb-0.5">{label}</p>
      {ls.map((l, i) => <p key={i} className="text-[16px] leading-relaxed">{l}</p>)}
    </div>
  );
}
