import { useState } from 'react';
import { shareOrCopy } from '../../services/shareOrCopy';
import { exportPrintBlocksToPdf } from '../../services/pdf/domToPdf';
import { triggerPrint } from '../../services/printSupport';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { SafetyPlanPrintView } from './SafetyPlanPrintView';
import { SharePlanModal, type PdfParts } from './SharePlanModal';
import { personalInfoStore, clinicWishesStore, personalHasContent, clinicHasContent, DEFAULT_PDF_PARTS } from './personalInfoStore';
import { getRucksackList, rucksackStore } from './rucksackStore';
import { safetyPlansRepo, WARNING_TIER_ORDER } from './safetyPlansRepo';
import { TIER_LABELS } from './tierMeta';
import { tierColorsStore } from './tierColorsStore';
import { planTexts } from './planTexts';
import { resourcesRepo } from '../resources/resourcesRepo';
import type { SafetyPlan } from '../../data/types';

/** Der Plan als Text (für Mail, WhatsApp, Nachricht …) – nur die gewählten Teile. */
export function buildPlanText(plan: SafetyPlan, parts: PdfParts, lang: 'de' | 'en', t: ReturnType<typeof useT>): string {
  const T = planTexts(lang);
  const out: string[] = [];
  const P = personalInfoStore.get();
  const C = clinicWishesStore.get();
  const list = getRucksackList();
  const rucksackData = list ? { items: list.items.map((i) => i.text), lastPacked: rucksackStore.get().lastPacked } : null;
  const med = (m: { name: string; dose?: string; when?: string }) => `- ${[m.name, m.dose, m.when].filter((x) => x && x.trim()).join(' · ')}`;
  if (parts.personal && personalHasContent(P)) {
    out.push(T.personalTitle.replace(/ \(.*\)$/, '') + ':');
    const row = (l: string, v?: string) => v && v.trim() && out.push(`${l}: ${v.trim()}`);
    row(T.name, P.name); row(T.birthdate, P.birthdate); row(T.address, P.address);
    const reg = (P.regularMeds ?? []).filter((m) => m.name.trim());
    if (reg.length) out.push(T.regularMeds + ':', ...reg.map(med));
    const need = (P.asNeededMeds ?? []).filter((m) => m.name.trim());
    if (need.length) out.push(T.asNeededMeds + ':', ...need.map(med));
    row(T.allergies, P.allergies); row(T.preconditions, P.preconditions); row(T.diagnoses, P.diagnoses);
    const cons = (P.contacts ?? []).filter((c) => c.name.trim());
    if (cons.length) out.push(T.contacts + ':', ...cons.map((c) => `- ${[c.name, c.address, c.phone, c.email].filter((x) => x && x.trim()).join(' · ')}`));
    row(T.insurance, P.insurance); row(T.insuranceNumber, P.insuranceNumber); row(T.copay, P.copayExemption); row(T.gdb, P.gdb); row(T.pets, P.pets);
    out.push('');
  }
  if (parts.plan) {
    out.push(plan.name, t.safetyPlan.warningSignals + ':');
    out.push(
      ...WARNING_TIER_ORDER.flatMap((tier) =>
        plan.warningSignals.filter((w) => w.tier === tier && !w.example).map((w) => `[${TIER_LABELS[tier]}] ${w.text}${w.resourceId && resourcesRepo.getById(w.resourceId) ? ` → ${resourcesRepo.getById(w.resourceId)!.title}` : ''}`),
      ),
      '',
      t.safetyPlan.helpItems + ':',
      ...WARNING_TIER_ORDER.flatMap((tier) => plan.helpItems.filter((h) => h.tier === tier && !h.example).map((h) => `[${TIER_LABELS[tier]}] ${h.text}`)),
      ...plan.sections.filter((sec) => sec.items.length > 0).flatMap((sec) => ['', `${t.safetyPlan.sections[sec.key as keyof typeof t.safetyPlan.sections]}:`, ...sec.items.map((i) => `- ${i}`)]),
    );
    out.push('');
  }
  if (parts.clinic && clinicHasContent(C)) {
    out.push(T.clinicTitle + ':');
    for (const k of ['treatment', 'placement', 'placementFallback', 'never', 'excludedMeds', 'history', 'additions'] as const) {
      if (C[k] && C[k]!.trim()) out.push(T[k], C[k]!.trim(), '');
    }
  }
  if (parts.rucksack !== false && rucksackData && (rucksackData.items.length > 0 || rucksackData.lastPacked)) {
    out.push('', `${T.rucksackTitle}:`);
    if (rucksackData.lastPacked) {
      out.push(...rucksackData.lastPacked.packed.map((x) => `[x] ${x}`), ...rucksackData.lastPacked.notPacked.map((x) => `[ ] ${x} (${T.rucksackNot})`));
    } else out.push(...rucksackData.items.map((x) => `[ ] ${x}`));
  }
  return out.join('\n').trim();
}

interface Props {
  plan: SafetyPlan;
  open: boolean;
  onClose: () => void;
  /** wird nach Änderung der Auswahl aufgerufen (Plan wird dort gespeichert) */
  onPlanChange?: (next: SafetyPlan) => void;
}

/**
 * Alles, was zum Verschicken eines Plans gehört: versteckte Druckansicht,
 * Auswahl der Teile, PDF / Drucken / Text (System-Teilen: Mail, WhatsApp, AirDrop …).
 * Wird im Plan und im Krisenmodus gleich benutzt.
 */
export function PlanShareSheet({ plan: planProp, open, onClose, onPlanChange }: Props) {
  const t = useT();
  const { settings } = useSettings();
  const lang: 'de' | 'en' = settings.language === 'en' ? 'en' : 'de';
  const [localParts, setLocalParts] = useState<PdfParts | undefined>(planProp.pdfParts);
  const parts: PdfParts = localParts ?? DEFAULT_PDF_PARTS;
  const plan: SafetyPlan = { ...planProp, pdfParts: parts };
  const personal = personalInfoStore.get();
  const clinic = clinicWishesStore.get();
  const list = getRucksackList();
  const rucksack = list ? { title: list.title, items: list.items.map((i) => i.text), lastPacked: rucksackStore.get().lastPacked } : null;
  const tierColors = tierColorsStore.getAll();

  function setParts(next: PdfParts) {
    setLocalParts(next);
    const updated = { ...planProp, pdfParts: next };
    if (onPlanChange) onPlanChange(updated);
    else safetyPlansRepo.save(updated);
  }

  return (
    <>
      <SafetyPlanPrintView
        plan={plan}
        tierLabels={TIER_LABELS}
        tierColors={tierColors}
        warningSignalsLabel={t.safetyPlan.warningSignals}
        helpItemsLabel={t.safetyPlan.helpItemsForTier}
        sectionTitles={t.safetyPlan.sections}
        parts={parts}
        personal={personal}
        clinic={clinic}
        rucksack={rucksack}
        lang={lang}
      />
      <SharePlanModal
        open={open}
        onClose={onClose}
        planName={plan.name}
        parts={parts}
        onPartsChange={setParts}
        hasPersonal={personalHasContent(personal)}
        hasClinic={clinicHasContent(clinic)}
        hasRucksack={!!rucksack && (rucksack.items.length > 0 || !!rucksack.lastPacked)}
        onPdf={() => exportPrintBlocksToPdf(plan.name || 'sicherheitsplan', 'safety-plan')}
        onPrint={() => {
          onClose();
          window.setTimeout(() => triggerPrint(t.common.printStandaloneExplanation, 'safety-plan'), 250);
        }}
        onText={() => { void shareOrCopy({ title: plan.name, text: buildPlanText(plan, parts, lang, t) }, t.resources.shareCopied); }}
      />
    </>
  );
}
