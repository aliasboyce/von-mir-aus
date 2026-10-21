import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import type { SafetyPlan, WarningTier } from '../../data/types';
import type { TierColorSet } from './tierColorsStore';
import type { PersonalInfo, ClinicWishes } from './personalInfoStore';
import { planTexts } from './planTexts';
import { CLINIC_FIELDS } from './ClinicWishesCard';

interface SafetyPlanPrintViewProps {
  plan: SafetyPlan | null;
  tierLabels: Record<WarningTier, string>;
  tierColors: Record<WarningTier, TierColorSet>;
  warningSignalsLabel: string;
  helpItemsLabel: string;
  /** localized section titles by key (plan.sections[].title is empty) */
  sectionTitles: Record<string, string>;
  parts: { personal: boolean; plan: boolean; clinic: boolean };
  personal: PersonalInfo;
  clinic: ClinicWishes;
  lang: string;
}

const lines = (v?: string) => (v ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

function Value({ text }: { text: string }) {
  const ls = lines(text);
  if (ls.length <= 1) return <p style={{ fontSize: 13, lineHeight: 1.7, margin: '0 0 8px', color: '#2a2a2a' }}>{ls[0] ?? ''}</p>;
  return (
    <ul style={{ margin: '0 0 8px', paddingLeft: 20, listStyleType: 'disc' }}>
      {ls.map((l, i) => (
        <li key={i} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a' }}>{l}</li>
      ))}
    </ul>
  );
}

function Labeled({ label, value }: { label: string; value?: string }) {
  if (lines(value).length === 0) return null;
  return (
    <div>
      <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#555', marginBottom: 3 }}>{label}</h3>
      <Value text={value ?? ''} />
    </div>
  );
}

const box = { marginBottom: 16, breakInside: 'avoid' as const, background: '#F6F2E9', borderLeft: '6px solid #8A9A7B', borderRadius: 10, padding: '12px 18px 8px' };

const TIER_ORDER: WarningTier[] = ['gelb', 'orange', 'rot'];

/**
 * A genuinely separate document layout, not the live screen with buttons
 * hidden - laid out the way a printed page should read: heading, grouped
 * sections, numbered lists. Always white background regardless of the
 * on-screen black/white toggle (a printed page needs to be readable on
 * paper, not match a screen preference). Deliberately excludes the fixed
 * emergency numbers and "Schnell Hilfe holen" - this document is about
 * the person's own, individual plan, not the general numbers that are
 * the same for everyone.
 */
export function SafetyPlanPrintView({ plan, tierLabels, tierColors, warningSignalsLabel, helpItemsLabel, sectionTitles, parts, personal, clinic, lang }: SafetyPlanPrintViewProps) {
  if (!plan) return null;
  const T = planTexts(lang);
  const medLine = (m: { name: string; dose?: string; when?: string }) => [m.name, m.dose, m.when].filter((x) => x && x.trim()).join(' · ');
  const regular = (personal.regularMeds ?? []).filter((m) => m.name.trim()).map(medLine);
  const asNeeded = (personal.asNeededMeds ?? []).filter((m) => m.name.trim()).map(medLine);
  const contacts = (personal.contacts ?? []).filter((c) => c.name.trim());
  const personalRows: [string, string | undefined][] = [
    [T.name, personal.name], [T.birthdate, personal.birthdate], [T.address, personal.address],
    [T.allergies, personal.allergies], [T.preconditions, personal.preconditions], [T.diagnoses, personal.diagnoses],
    [T.insurance, personal.insurance], [T.insuranceNumber, personal.insuranceNumber], [T.copay, personal.copayExemption], [T.gdb, personal.gdb], [T.pets, personal.pets],
  ];
  const hasPersonal = personalRows.some(([, v]) => lines(v).length > 0) || regular.length > 0 || asNeeded.length > 0 || contacts.length > 0;
  const showPersonal = parts.personal && hasPersonal;
  const showClinic = parts.clinic && CLINIC_FIELDS.some((k) => lines(clinic[k]).length > 0);
  const showPlan = parts.plan;
  const heading = showPlan ? plan.name : showPersonal ? T.personalTitle.replace(/ \(.*\)$/, '') : T.clinicTitle;

  function resolveLabel(kind: 'resource' | 'bridge' | 'contact', id: string): string | null {
    if (kind === 'resource') return resourcesRepo.getById(id)?.title ?? null;
    if (kind === 'bridge') return bridgesRepo.getById(id)?.title ?? null;
    return networkRepo.getById(id)?.name ?? null;
  }

  return (
    <div className="print-only" data-print-id="safety-plan" style={{ padding: '36px 32px', color: '#1a1a1a', background: '#ffffff', fontFamily: 'system-ui, sans-serif' }}>
      {showPlan && <div
        aria-hidden="true"
        data-pdf-stripe={`${tierColors.gelb.color},${tierColors.orange.color},${tierColors.rot.color}`}
        style={{
          height: 8,
          borderRadius: 999,
          marginBottom: 18,
          background: `linear-gradient(90deg, ${tierColors.gelb.color}, ${tierColors.orange.color}, ${tierColors.rot.color})`,
        }}
      />}
      <h1 style={{ fontSize: 26, fontWeight: 600, marginBottom: 22 }}>{heading}</h1>

      {showPersonal && (
        <section data-testid="print-personal" style={box}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#333' }}>{T.personalTitle.replace(/ \(.*\)$/, '')}</h2>
          {personalRows.slice(0, 3).map(([l, v]) => <Labeled key={l} label={l} value={v} />)}
          {regular.length > 0 && <Labeled label={T.regularMeds} value={regular.join('\n')} />}
          {asNeeded.length > 0 && <Labeled label={T.asNeededMeds} value={asNeeded.join('\n')} />}
          {personalRows.slice(3, 6).map(([l, v]) => <Labeled key={l} label={l} value={v} />)}
          {contacts.length > 0 && (
            <Labeled
              label={T.contacts}
              value={contacts
                .map((c) => [c.name, c.address, c.phone, c.email].filter((x) => x && x.trim()).join(' · '))
                .join('\n')}
            />
          )}
          {personalRows.slice(6).map(([l, v]) => <Labeled key={l} label={l} value={v} />)}
        </section>
      )}

      {showPlan && TIER_ORDER.map((tier) => {
        const color = tierColors[tier];
        const tierWarnings = plan.warningSignals.filter((w) => w.tier === tier && !w.example);
        const tierHelp = plan.helpItems.filter((h) => h.tier === tier && !h.example);
        const linked = plan.linkedByTier[tier];
        const resourceNames = linked.resourceIds.map((id) => resolveLabel('resource', id)).filter(Boolean) as string[];
        const bridgeNames = linked.bridgeIds.map((id) => resolveLabel('bridge', id)).filter(Boolean) as string[];
        const contactNames = linked.contactIds.map((id) => resolveLabel('contact', id)).filter(Boolean) as string[];
        const allItems = [...tierHelp.map((h) => h.text), ...resourceNames, ...bridgeNames, ...contactNames];
        if (allItems.length === 0 && tierWarnings.length === 0) return null;

        return (
          <section
            key={tier}
            data-pdf-band={color.color}
            style={{
              marginBottom: 18,
              breakInside: 'avoid',
              background: color.soft,
              border: `1.5px solid ${color.color}`,
              borderLeft: `8px solid ${color.color}`,
              borderRadius: 12,
              padding: '14px 18px 12px',
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 10, color: color.color, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 11, height: 11, borderRadius: 999, background: color.color }} />
              {tierLabels[tier]}
            </h2>

            {tierWarnings.length > 0 && (
              <>
                <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
                  {warningSignalsLabel}
                </h3>
                <ul style={{ margin: '0 0 10px', paddingLeft: 20, listStyleType: 'disc' }}>
                  {tierWarnings.map((w) => {
                    const res = w.resourceId ? resourcesRepo.getById(w.resourceId) : undefined;
                    return (
                      <li key={w.id} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a' }}>
                        {w.text}
                        {res && <span style={{ color: color.color, fontWeight: 600 }}> → {res.title}</span>}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {allItems.length > 0 && (
              <>
                <h3 style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
                  {helpItemsLabel.replace('{tier}', tierLabels[tier])}
                </h3>
                <ol style={{ margin: 0, paddingLeft: 20, listStyleType: 'decimal', listStylePosition: 'outside' }}>
                  {allItems.map((text, i) => (
                    <li key={i} style={{ fontSize: 13, lineHeight: 1.7, color: '#2a2a2a', marginBottom: 3 }}>
                      {text}
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        );
      })}

      {showPlan &&
        plan.sections
          .filter((s) => s.items.length > 0)
          .map((section) => (
            <section key={section.key} style={box}>
              <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#333' }}>{sectionTitles[section.key] ?? section.title}</h2>
              <ul style={{ margin: 0, paddingLeft: 20, listStyleType: 'disc', listStylePosition: 'outside' }}>
                {section.items.map((item, i) => (
                  <li key={i} style={{ fontSize: 13, lineHeight: 1.8, color: '#2a2a2a', marginBottom: 4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ))}

      {showClinic && (
        <section data-testid="print-clinic" style={box}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10, color: '#333' }}>{T.clinicTitle}</h2>
          {CLINIC_FIELDS.map((k) => (
            <Labeled key={k} label={T[k]} value={clinic[k]} />
          ))}
        </section>
      )}
    </div>
  );
}
