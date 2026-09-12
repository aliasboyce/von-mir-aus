import { useMemo, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { useNavigate } from 'react-router-dom';
import { Phone, Plus, X, FileDown, Share2, Palette, SunMoon, ChevronDown, ChevronUp, MessageCircleHeart } from 'lucide-react';
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
import { useT } from '../../i18n';
import {
  safetyPlansRepo,
  seedSafetyPlansIfEmpty,
  createNewPlan,
  normalizePlan,
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

/**
 * Deliberately reduced to only black or white — see design decision:
 * warning-tier colors stay the sole source of color, the background stays
 * calm instead of adding a second color system to sort through. Applied
 * as inline CSS variable overrides on this page's own wrapper only (the
 * same pattern the app already uses for per-page palettes), so nothing
 * outside this page is affected.
 */
const REIZARM_VARS: Record<'weiss' | 'schwarz', Record<string, string>> = {
  weiss: {
    '--color-bg': '#FFFFFF',
    '--color-bg-soft': '#F7F7F7',
    '--color-surface': '#FFFFFF',
    '--color-surface-muted': '#F2F2F2',
    '--color-text': '#111111',
    '--color-text-muted': '#3D3D3D',
    '--color-text-faint': '#6B6B6B',
    '--color-border': '#DDDDDD',
    '--color-border-strong': '#BBBBBB',
  },
  schwarz: {
    '--color-bg': '#0A0A0A',
    '--color-bg-soft': '#111111',
    '--color-surface': '#0A0A0A',
    '--color-surface-muted': '#161616',
    '--color-text': '#F5F5F5',
    '--color-text-muted': '#C7C7C7',
    '--color-text-faint': '#8F8F8F',
    '--color-border': '#333333',
    '--color-border-strong': '#4D4D4D',
  },
};

export function SafetyPlanPage() {
  const t = useT();
  const say = useCompanionSay();
  const navigate = useNavigate();
  const { settings, updateSettings } = useSettings();
  const reizarmMode = settings.safetyPlanBackground ?? 'weiss';
  const [showMoreContacts, setShowMoreContacts] = useState(false);
  const [openContactNumber, setOpenContactNumber] = useState<string | null>(null);
  const [quickHelpOpen, setQuickHelpOpen] = useState(false);
  const [plans, setPlans] = useState<SafetyPlan[]>(() => safetyPlansRepo.getAll().map(normalizePlan));
  const [activeId, setActiveId] = useState<string>(() => safetyPlansRepo.getAll()[0]?.id ?? '');
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [addingPlan, setAddingPlan] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [tierColorEditorOpen, setTierColorEditorOpen] = useState(false);
  const [tierColors, setTierColors] = useState(() => tierColorsStore.getAll());
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
    setPlans(safetyPlansRepo.getAll().map(normalizePlan));
  }

  function addPlan() {
    const name = newPlanName.trim();
    if (!name) return;
    const created = createNewPlan(name);
    safetyPlansRepo.save(created);
    setPlans(safetyPlansRepo.getAll().map(normalizePlan));
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

  async function sharePlan() {
    if (!plan) return;
    const text = [
      plan.name,
      t.safetyPlan.warningSignals + ':',
      ...WARNING_TIER_ORDER.flatMap((tier) =>
        plan.warningSignals.filter((w) => w.tier === tier).map((w) => `[${TIER_LABELS[tier]}] ${w.text}`),
      ),
      '',
      t.safetyPlan.helpItems + ':',
      ...WARNING_TIER_ORDER.flatMap((tier) =>
        plan.helpItems.filter((h) => h.tier === tier).map((h) => `[${TIER_LABELS[tier]}] ${h.text}`),
      ),
      ...plan.sections.flatMap((s) => [
        '',
        `${t.safetyPlan.sections[s.key as keyof typeof t.safetyPlan.sections]}:`,
        ...s.items.map((i) => `- ${i}`),
      ]),
    ].join('\n');
    if (navigator.share) {
      try {
        await navigator.share({ title: plan.name, text });
      } catch {
        // cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(text);
        alert(t.resources.shareCopied);
      } catch {
        // clipboard unavailable
      }
    }
  }

  if (!plan) return null;

  return (
    <div className="animate-in safety-plan-root" style={REIZARM_VARS[reizarmMode]}>
      <TopBar
        action={
          <div className="flex items-center gap-1 no-print">
            <HelpButton helpKey="sicherheitsplan" />
            <button
              className="p-2"
              onClick={() => updateSettings({ safetyPlanBackground: reizarmMode === 'weiss' ? 'schwarz' : 'weiss' })}
              aria-label={t.safetyPlan.toggleBackground}
            >
              <SunMoon size={16} />
            </button>
            <button className="p-2" onClick={() => setTierColorEditorOpen(true)} aria-label={t.safetyPlan.tierColorsTitle}>
              <Palette size={16} />
            </button>
            <button className="p-2" onClick={sharePlan} aria-label={t.resources.share}>
              <Share2 size={16} />
            </button>
            <button className="p-2" onClick={() => triggerPrint(t.common.printStandaloneExplanation)} aria-label={t.safetyPlan.pdfExport}>
              <FileDown size={16} />
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
          const warnItems = plan.warningSignals.filter((w) => w.tier === tier);
          const helpItems = plan.helpItems.filter((h) => h.tier === tier);
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
                  {warnItems.map((w) => (
                    <li key={w.id} className="flex items-start justify-between gap-2 text-[13px] text-[var(--color-text-muted)]">
                      <span className="flex items-start gap-1.5">
                        <span aria-hidden="true" className="text-[var(--color-text-faint)]">•</span>
                        <span>{w.text}</span>
                      </span>
                      <button onClick={() => removeWarning(w.id)} className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] no-print flex-shrink-0">
                        <X size={13} />
                      </button>
                    </li>
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
                  allItems={allResources.map((r) => ({ id: r.id, title: r.title, subtitle: r.description }))}
                  onChange={(ids) => updateLinked(tier, 'resourceIds', ids)}
                  onOpenItem={(id) => navigate(`/entdecken/ressourcen?open=${id}`)}
                  emptyHint={t.safetyPlan.linkedResourcesEmpty}
                />
                <LinkedItemsPicker
                  title={t.safetyPlan.linkedBridges}
                  linkedIds={linked.bridgeIds}
                  allItems={allBridges.map((b) => ({ id: b.id, title: b.title, subtitle: b.description }))}
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
      </div>

      <SafetyPlanPrintView
        plan={plan}
        tierLabels={TIER_LABELS}
        tierColors={tierColors}
        warningSignalsLabel={t.safetyPlan.warningSignals}
        helpItemsLabel={t.safetyPlan.helpItemsForTier}
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
