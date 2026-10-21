import { ResourceTile } from '../../components/shared/ItemTile';
import { useMemo, useState } from 'react';
import { shareOrCopy } from '../../services/shareOrCopy';
import { exportPrintBlocksToPdf } from '../../services/pdf/domToPdf';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { useNavigate } from 'react-router-dom';
import { Phone, Plus, X, Share2, Palette, ChevronDown, ChevronUp, MessageCircleHeart, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Chip } from '../../components/ui/Chip';
import { Button } from '../../components/ui/Button';
import { QuickHelpModal } from './QuickHelpModal';
import { SafetyPlanPrintView } from './SafetyPlanPrintView';
import { TopBar } from '../../components/navigation/TopBar';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { pickLimitExplanation } from '../../components/companion/companionLines';
import { pickLine } from '../../components/companion/companionRegistry';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useSettings } from '../../state/SettingsContext';
import { LinkedItemsPicker } from './LinkedItemsPicker';
import { TierColorEditor } from './TierColorEditor';
import { PersonalInfoCard } from './PersonalInfoCard';
import { ClinicWishesCard } from './ClinicWishesCard';
import { SharePlanModal, type PdfParts } from './SharePlanModal';
import { personalInfoStore, clinicWishesStore, personalHasContent, clinicHasContent, DEFAULT_PDF_PARTS } from './personalInfoStore';
import { planTexts } from './planTexts';
import { useT } from '../../i18n';
import {
  safetyPlansRepo,
  seedSafetyPlansIfEmpty,
  createNewPlan,
  normalizePlan,
  ensureExamples,
  SAFETY_PLAN_SECTION_ORDER,
  WARNING_TIER_ORDER,
} from './safetyPlansRepo';
import { TIER_LABELS } from './tierMeta';
import { tierColorsStore } from './tierColorsStore';
import { OFFICIAL_CRISIS_CONTACTS, ADDITIONAL_CRISIS_CONTACTS } from '../../data/types';
import { createId } from '../../services/storage/repository';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import type { SafetyPlan, WarningTier } from '../../data/types';

seedSafetyPlansIfEmpty();

function ExampleRow({ text, onKeep, onDelete, T }: { text: string; onKeep: () => void; onDelete: () => void; T: ReturnType<typeof planTexts> }) {
  return (
    <li
      data-testid="plan-example"
      className="rounded-[var(--radius-md)] px-2.5 py-2 text-[13px] text-[var(--color-text-muted)]"
      style={{ border: '1.5px dashed var(--color-border-strong)', background: 'var(--color-surface-muted)' }}
    >
      <div className="flex items-start gap-2">
        <span className="text-[10.5px] uppercase tracking-wide rounded-full px-2 py-0.5 flex-shrink-0 mt-0.5" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-soft-text)' }}>
          {T.example}
        </span>
        <span className="flex-1 italic">{text}</span>
      </div>
      <div className="flex gap-4 mt-1.5 ml-0.5">
        <button type="button" onClick={onKeep} className="flex items-center gap-1 text-[12px] text-[var(--color-primary)] underline underline-offset-2" data-testid="example-keep">
          <Check size={12} /> {T.exampleKeep}
        </button>
        <button type="button" onClick={onDelete} className="flex items-center gap-1 text-[12px] text-[var(--color-danger)] underline underline-offset-2" data-testid="example-delete">
          <X size={12} /> {T.exampleDelete}
        </button>
      </div>
    </li>
  );
}

export function SafetyPlanPage() {
  const t = useT();
  const say = useCompanionSay();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const lang: 'de' | 'en' = settings.language === 'en' ? 'en' : 'de';
  const T = planTexts(lang);
  const [showMoreContacts, setShowMoreContacts] = useState(false);
  const [openContactNumber, setOpenContactNumber] = useState<string | null>(null);
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const [plans, setPlans] = useState<SafetyPlan[]>(() =>
    safetyPlansRepo.getAll().map(normalizePlan).map((p) => {
      const withExamples = ensureExamples(p, lang);
      // save once, so crisis mode & co. read the marked examples as examples
      if (withExamples !== p) safetyPlansRepo.save(withExamples);
      return withExamples;
    }),
  );
  const [activeId, setActiveId] = useState<string>(() => safetyPlansRepo.getAll()[0]?.id ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [tierColorEditorOpen, setTierColorEditorOpen] = useState(false);
  const [tierColors, setTierColors] = useState(() => tierColorsStore.getAll());
  const [shareOpen, setShareOpen] = useState(false);
  const [limitExplanation] = useState(() => pickLimitExplanation());

  const plan = plans.find((p) => p.id === activeId) ?? plans[0];

  // Read once per mount, not on every render (this page re-renders on every
  // keystroke while typing a warning signal or help item) — these lists
  // only change via actions on the Resources/Bridges/Netzwerk pages, never
  // from anything on this page itself.
  const allResources = useMemo(() => resourcesRepo.getAll(), []);
  const allBridges = useMemo(() => bridgesRepo.getAll(), []);
  const allContacts = useMemo(() => networkRepo.getAll().filter((e) => e.category === 'person'), []);

  function persist(next: SafetyPlan) {
    safetyPlansRepo.save(next);
    setPlans(safetyPlansRepo.getAll().map(normalizePlan).map((p) => ensureExamples(p, lang)));
  }

  function addPlan() {
    const name = newPlanName.trim();
    if (!name) return;
    const created = createNewPlan(name);
    safetyPlansRepo.save(created);
    setPlans(safetyPlansRepo.getAll().map(normalizePlan).map((p) => ensureExamples(p, lang)));
    setActiveId(created.id);
    setNewPlanName('');
    setAddingPlan(false);
  }

  function addWarning(tier: WarningTier, key: string) {
    if (!plan) return;
    const text = (drafts[key] ?? '').trim();
    if (!text) return;
    persist({ ...plan, warningSignals: [...plan.warningSignals, { id: createId('warn'), text, tier }] });
    setDrafts((d) => ({ ...d, [key]: '' }));
    say(pickLine({ page: '/sicherheit/plan', trigger: 'speichern' }));
  }

  /** "Warnsignale lassen sich mit einem Skill oder Hilfsmittel verknuepfen" */
  function setWarningResource(id: string, resourceId: string | undefined) {
    if (!plan) return;
    persist({ ...plan, warningSignals: plan.warningSignals.map((w) => (w.id === id ? { ...w, resourceId } : w)) });
  }

  function removeWarning(id: string) {
    if (!plan) return;
    persist({ ...plan, warningSignals: plan.warningSignals.filter((w) => w.id !== id) });
  }

  function addHelp(tier: WarningTier, key: string) {
    if (!plan) return;
    const text = (drafts[key] ?? '').trim();
    if (!text) return;
    persist({ ...plan, helpItems: [...plan.helpItems, { id: createId('help'), text, tier }] });
    setDrafts((d) => ({ ...d, [key]: '' }));
    say(pickLine({ page: '/sicherheit/plan', trigger: 'speichern' }));
  }

  function removeHelp(id: string) {
    if (!plan) return;
    persist({ ...plan, helpItems: plan.helpItems.filter((h) => h.id !== id) });
  }

  function updateLinked(tier: WarningTier, kind: 'resourceIds' | 'bridgeIds' | 'contactIds', ids: string[]) {
    if (!plan) return;
    persist({
      ...plan,
      linkedByTier: {
        ...plan.linkedByTier,
        [tier]: { ...plan.linkedByTier[tier], [kind]: ids },
      },
    });
  }

  function addSectionItem(sectionKey: string) {
    if (!plan) return;
    const text = (drafts[sectionKey] ?? '').trim();
    if (!text) return;
    persist({
      ...plan,
      sections: plan.sections.map((s) => (s.key === sectionKey ? { ...s, items: [...s.items, text] } : s)),
    });
    setDrafts((d) => ({ ...d, [sectionKey]: '' }));
  }

  function removeSectionItem(sectionKey: string, index: number) {
    if (!plan) return;
    persist({
      ...plan,
      sections: plan.sections.map((s) =>
        s.key === sectionKey ? { ...s, items: s.items.filter((_, i) => i !== index) } : s,
      ),
    });
  }

  function removeExampleSection(sectionKey: string, index: number, keep: boolean) {
    if (!plan) return;
    persist({
      ...plan,
      sections: plan.sections.map((sec) => {
        if (sec.key !== sectionKey) return sec;
        const ex = sec.examples ?? [];
        return { ...sec, examples: ex.filter((_, i) => i !== index), items: keep ? [...sec.items, ex[index]] : sec.items };
      }),
    });
  }

  function exampleWarning(id: string, keep: boolean) {
    if (!plan) return;
    persist({
      ...plan,
      warningSignals: keep
        ? plan.warningSignals.map((w) => (w.id === id ? { ...w, example: false } : w))
        : plan.warningSignals.filter((w) => w.id !== id),
    });
  }

  function exampleHelp(id: string, keep: boolean) {
    if (!plan) return;
    persist({
      ...plan,
      helpItems: keep ? plan.helpItems.map((h) => (h.id === id ? { ...h, example: false } : h)) : plan.helpItems.filter((h) => h.id !== id),
    });
  }

  function deleteAllExamples() {
    if (!plan) return;
    persist({
      ...plan,
      warningSignals: plan.warningSignals.filter((w) => !w.example),
      helpItems: plan.helpItems.filter((h) => !h.example),
      sections: plan.sections.map((sec) => ({ ...sec, examples: [] })),
    });
  }

  const hasExamples = !!plan && (plan.warningSignals.some((w) => w.example) || plan.helpItems.some((h) => h.example) || plan.sections.some((sec) => (sec.examples ?? []).length > 0));
  const parts: PdfParts = plan?.pdfParts ?? DEFAULT_PDF_PARTS;
  const personalData = personalInfoStore.get();
  const clinicData = clinicWishesStore.get();

  function setParts(next: PdfParts) {
    if (!plan) return;
    persist({ ...plan, pdfParts: next });
  }

  function planText(): string {
    if (!plan) return '';
    const out: string[] = [];
    const P = personalInfoStore.get();
    const C = clinicWishesStore.get();
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
    return out.join('\n').trim();
  }

  async function sharePlan() {
    if (!plan) return;
    await shareOrCopy({ title: plan.name, text: planText() }, t.resources.shareCopied);
  }

  async function sharePdf(): Promise<boolean> {
    return exportPrintBlocksToPdf(plan?.name ?? 'sicherheitsplan', 'safety-plan');
  }

  function printNow() {
    setShareOpen(false);
    window.setTimeout(() => triggerPrint(t.common.printStandaloneExplanation, 'safety-plan'), 250);
  }

  if (!plan) return null;

  return (
    <div className="animate-in safety-plan-root">
      <TopBar
        action={
          <div className="flex items-center gap-1 no-print">
            <HelpButton helpKey="sicherheitsplan" />
            <button className="p-2" onClick={() => setTierColorEditorOpen(true)} aria-label={t.safetyPlan.tierColorsTitle}>
              <Palette size={16} />
            </button>
            <button className="p-2" onClick={() => setShareOpen(true)} aria-label={T.openCta} data-testid="share-plan-open">
              <Share2 size={16} />
            </button>
          </div>
        }
      />
      <div className="px-5 pb-6 no-print">
        <h1 className="text-[24px] mb-1">{t.safetyPlan.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4">{t.safetyPlan.subtitle}</p>

        <div className="chip-row no-scrollbar mb-6 -mx-5 px-5">
          {plans.map((p) => (
            <Chip key={p.id} selected={p.id === activeId} onClick={() => setActiveId(p.id)}>
              {p.name}
            </Chip>
          ))}
          {!addingPlan ? (
            <Chip onClick={() => setAddingPlan(true)} icon={<Plus size={14} />}>
              {t.safetyPlan.newPlan}
            </Chip>
          ) : (
            <div className="flex items-center gap-1.5">
              <input
                autoFocus
                className="input"
                style={{ width: 160 }}
                placeholder={t.safetyPlan.newPlanPlaceholder}
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlan()}
              />
              <button onClick={addPlan} className="p-2 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
                <Plus size={15} />
              </button>
            </div>
          )}
        </div>

        <PersonalInfoCard />
        <ClinicWishesCard />

        {hasExamples && (
          <div className="rounded-[var(--radius-md)] px-3.5 py-3 mb-5 flex flex-col gap-2" style={{ border: '1.5px dashed var(--color-border-strong)' }} data-testid="examples-hint">
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{T.exampleHint}</p>
            <button type="button" onClick={deleteAllExamples} className="self-start text-[12.5px] text-[var(--color-danger)] underline underline-offset-2" data-testid="examples-delete-all">
              {T.exampleDeleteAll}
            </button>
          </div>
        )}

        <Button
          fullWidth
          variant="secondary"
          icon={<MessageCircleHeart size={17} />}
          onClick={() => setQuickHelpOpen(true)}
          className="mb-6"
        >
          {t.safetyPlan.quickHelpTitle}
        </Button>

        <div className="mb-6">
          <button
            onClick={() => setShowMoreContacts((v) => !v)}
            className="flex items-center gap-1.5 text-[14px] font-medium text-[var(--color-text)] px-1 pb-2 w-full"
          >
            {showMoreContacts ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {t.safetyPlan.callContacts}
          </button>

          <div className={`crisis-contacts-collapsible flex flex-col gap-2 ${showMoreContacts ? 'animate-in' : 'hidden'}`}>
            {[...OFFICIAL_CRISIS_CONTACTS, ...ADDITIONAL_CRISIS_CONTACTS].map((c) => {
              const isOpen = openContactNumber === c.number;
              return (
                <div
                  key={c.number}
                  className="rounded-[var(--radius-lg)] overflow-hidden"
                  style={{
                    background: 'var(--color-surface)',
                    border: '1.5px solid var(--color-border-strong)',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                  }}
                >
                  <button
                    onClick={() => setOpenContactNumber(isOpen ? null : c.number)}
                    aria-expanded={isOpen}
                    className="flex items-center gap-3 p-3.5 w-full text-left"
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
                    >
                      <Phone size={16} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[13px] font-semibold text-[var(--color-text)]">{c.label}</span>
                      <span className="block text-[12px] text-[var(--color-text-muted)]">{c.hint}</span>
                    </span>
                    {isOpen ? <ChevronUp size={16} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" />}
                  </button>
                  {isOpen && (
                    <div className="px-3.5 pb-3.5 pt-0.5 animate-in">
                      <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">{c.number}</p>
                      <a
                        href={`tel:${c.number}`}
                        className="flex items-center justify-center gap-2 rounded-full py-2.5 text-[13px] font-medium"
                        style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }}
                      >
                        <Phone size={14} />
                        {t.safetyPlan.callNow}
                      </a>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {WARNING_TIER_ORDER.map((tier) => {
          const warnKey = `warn-${tier}`;
          const helpKey = `help-${tier}`;
          const warnAll = plan.warningSignals.filter((w) => w.tier === tier);
          const warnItems = warnAll.filter((w) => !w.example);
          const warnExamples = warnAll.filter((w) => w.example);
          const helpAll = plan.helpItems.filter((h) => h.tier === tier);
          const helpItems = helpAll.filter((h) => !h.example);
          const helpExamples = helpAll.filter((h) => h.example);
          const linked = plan.linkedByTier[tier];
          const tierColor = tierColors[tier];

          return (
            <Card key={tier} className="mb-5" style={{ borderColor: tierColor.color, borderWidth: 1.5 }}>
              <div className="flex items-center gap-2 mb-3.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: tierColor.color }} />
                <h2 className="text-[15px] font-medium" style={{ color: tierColor.color }}>
                  {TIER_LABELS[tier]}
                </h2>
              </div>

              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                {t.safetyPlan.warningSignals}
              </p>
              {warnItems.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2.5">
                  {warnItems.map((w) => {
                    const linkedRes = w.resourceId ? resourcesRepo.getById(w.resourceId) : undefined;
                    return (
                      <li key={w.id} className="text-[13px] text-[var(--color-text-muted)]">
                        <div className="flex items-start justify-between gap-2">
                          <span className="flex items-start gap-1.5">
                            <span aria-hidden="true" className="text-[var(--color-text-faint)]">•</span>
                            <span>{w.text}</span>
                          </span>
                          <button onClick={() => removeWarning(w.id)} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] no-print flex-shrink-0">
                            <X size={13} />
                          </button>
                        </div>
                        {/* the "dann" of the if-then plan */}
                        {linkedRes ? (
                          <div className="ml-4 mt-1 flex items-center gap-1.5">
                            <span aria-hidden="true" style={{ color: tierColor.color }}>→</span>
                            <div className="flex-1 min-w-0"><ResourceTile resource={linkedRes} compact /></div>
                            <button onClick={() => setWarningResource(w.id, undefined)} aria-label={t.common.remove} className="text-[var(--color-text-faint)] no-print p-1">
                              <X size={12} />
                            </button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              )}
              {warnExamples.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2.5">
                  {warnExamples.map((w) => (
                    <ExampleRow key={w.id} text={w.text} T={T} onKeep={() => exampleWarning(w.id, true)} onDelete={() => exampleWarning(w.id, false)} />
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 mb-4 no-print">
                <input
                  className="input"
                  placeholder={t.safetyPlan.itemPlaceholder}
                  value={drafts[warnKey] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [warnKey]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addWarning(tier, warnKey)}
                />
                <button
                  onClick={() => addWarning(tier, warnKey)}
                  className="p-2 rounded-full flex-shrink-0"
                  style={{ background: tierColor.soft, color: tierColor.color }}
                >
                  <Plus size={15} />
                </button>
              </div>

              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                {t.safetyPlan.helpItems} ({t.safetyPlan.freeNotes})
              </p>
              {helpItems.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2.5">
                  {helpItems.map((h) => (
                    <li key={h.id} className="flex items-start justify-between gap-2 text-[13px] text-[var(--color-text-muted)]">
                      <span className="flex items-start gap-1.5">
                        <span aria-hidden="true" className="text-[var(--color-text-faint)]">•</span>
                        <span>{h.text}</span>
                      </span>
                      <button onClick={() => removeHelp(h.id)} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] no-print flex-shrink-0">
                        <X size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {helpExamples.length > 0 && (
                <ul className="flex flex-col gap-1.5 mb-2.5">
                  {helpExamples.map((h) => (
                    <ExampleRow key={h.id} text={h.text} T={T} onKeep={() => exampleHelp(h.id, true)} onDelete={() => exampleHelp(h.id, false)} />
                  ))}
                </ul>
              )}
              <div className="flex items-center gap-2 mb-5 no-print">
                <input
                  className="input"
                  placeholder={t.safetyPlan.itemPlaceholder}
                  value={drafts[helpKey] ?? ''}
                  onChange={(e) => setDrafts((d) => ({ ...d, [helpKey]: e.target.value }))}
                  onKeyDown={(e) => e.key === 'Enter' && addHelp(tier, helpKey)}
                />
                <button
                  onClick={() => addHelp(tier, helpKey)}
                  className="p-2 rounded-full flex-shrink-0"
                  style={{ background: tierColor.soft, color: tierColor.color }}
                >
                  <Plus size={15} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <LinkedItemsPicker
                  title={t.safetyPlan.linkedResources}
                  linkedIds={linked.resourceIds}
                  allItems={allResources.map((r) => ({ id: r.id, title: r.title, subtitle: r.description, kind: 'resource' as const, category: r.category, image: r.image }))}
                  onChange={(ids) => updateLinked(tier, 'resourceIds', ids)}
                  onOpenItem={(id) => navigate(`/entdecken/ressourcen?open=${id}`)}
                  emptyHint={t.safetyPlan.linkedResourcesEmpty}
                />
                <LinkedItemsPicker
                  title={t.safetyPlan.linkedBridges}
                  linkedIds={linked.bridgeIds}
                  allItems={allBridges.map((b) => ({ id: b.id, title: b.title, subtitle: b.description, kind: 'bridge' as const, category: b.category, image: b.image }))}
                  onChange={(ids) => updateLinked(tier, 'bridgeIds', ids)}
                  onOpenItem={(id) => navigate(`/bruecken/${id}`)}
                  emptyHint={t.safetyPlan.linkedBridgesEmpty}
                />
                <LinkedItemsPicker
                  title={t.safetyPlan.linkedContacts}
                  linkedIds={linked.contactIds}
                  allItems={allContacts.map((c) => ({ id: c.id, title: c.name, subtitle: c.role }))}
                  onChange={(ids) => updateLinked(tier, 'contactIds', ids)}
                  onOpenItem={(id) => navigate(`/sicherheit/netzwerk?open=${id}`)}
                  emptyHint={t.safetyPlan.linkedContactsEmpty}
                />
              </div>
            </Card>
          );
        })}

        <div className="flex items-start gap-3 mb-6 no-print">
          <InlineCompanionNote />
          <div className="flex-1 bg-[var(--color-surface-muted)] rounded-[var(--radius-lg)] p-3.5">
            <p className="text-[13px] text-[var(--color-text)]">{limitExplanation}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          {SAFETY_PLAN_SECTION_ORDER.map((key) => {
            const section = plan.sections.find((s) => s.key === key);
            if (!section) return null;
            return (
              <Card key={key}>
                <h2 className="text-[14px] font-medium text-[var(--color-text)] mb-2.5">
                  {t.safetyPlan.sections[key]}
                </h2>
                {section.items.length > 0 && (
                  <ul className="flex flex-col gap-1.5 mb-2.5">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start justify-between gap-2 text-[13px] text-[var(--color-text-muted)]">
                        <span className="flex items-start gap-1.5">
                          <span aria-hidden="true" className="text-[var(--color-text-faint)]">•</span>
                          <span>{item}</span>
                        </span>
                        <button onClick={() => removeSectionItem(key, i)} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] no-print flex-shrink-0">
                          <X size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {(section.examples ?? []).length > 0 && (
                  <ul className="flex flex-col gap-1.5 mb-2.5">
                    {(section.examples ?? []).map((ex, i) => (
                      <ExampleRow key={i} text={ex} T={T} onKeep={() => removeExampleSection(key, i, true)} onDelete={() => removeExampleSection(key, i, false)} />
                    ))}
                  </ul>
                )}
                <div className="flex items-center gap-2 no-print">
                  <input
                    className="input"
                    placeholder={t.safetyPlan.itemPlaceholder}
                    value={drafts[key] ?? ''}
                    onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && addSectionItem(key)}
                  />
                  <button
                    onClick={() => addSectionItem(key)}
                    className="p-2.5 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex-shrink-0"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>

        <Button fullWidth icon={<Share2 size={16} />} onClick={() => setShareOpen(true)} className="mt-6" data-testid="share-plan-open-bottom">
          {T.openCta}
        </Button>
        <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-1.5">{T.openHint}</p>
      </div>

      <SafetyPlanPrintView
        plan={plan}
        tierLabels={TIER_LABELS}
        tierColors={tierColors}
        warningSignalsLabel={t.safetyPlan.warningSignals}
        helpItemsLabel={t.safetyPlan.helpItemsForTier}
        sectionTitles={t.safetyPlan.sections}
        parts={parts}
        personal={personalData}
        clinic={clinicData}
        lang={lang}
      />

      <SharePlanModal
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        planName={plan.name}
        parts={parts}
        onPartsChange={setParts}
        hasPersonal={personalHasContent(personalData)}
        hasClinic={clinicHasContent(clinicData)}
        onPdf={sharePdf}
        onPrint={printNow}
        onText={sharePlan}
      />

      <TierColorEditor
        open={tierColorEditorOpen}
        onClose={() => setTierColorEditorOpen(false)}
        onChange={() => setTierColors(tierColorsStore.getAll())}
      />

      <QuickHelpModal open={quickHelpOpen} onClose={() => setQuickHelpOpen(false)} />
    </div>
  );
}
