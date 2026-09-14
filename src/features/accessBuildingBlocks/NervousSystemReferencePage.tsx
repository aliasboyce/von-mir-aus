import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ChevronDown, ChevronUp } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { SURVIVAL_STATE_ORDER, SURVIVAL_STATE_META } from '../zugang/zugangContent';
import { POLYVAGAL_ZONE_META } from '../polyvagal/polyvagalMeta';
import { SURVIVAL_TO_POLYVAGAL_ZONE } from '../zugang/zugangRepo';
import { ActivationWave } from './ActivationWave';
import { PolyvagalLadderIllustration } from '../polyvagal/PolyvagalLadderIllustration';
import { AutonomicOrgansIllustration } from '../polyvagal/AutonomicOrgansIllustration';
import { ArousalBranchIllustration } from '../polyvagal/ArousalBranchIllustration';
import { WindowOfToleranceIllustration } from '../polyvagal/WindowOfToleranceIllustration';
import type { PolyvagalZone } from '../../data/types';
import { SourceNoteCard } from '../../components/shared/SourceNoteCard';

/**
 * "Nervensystem komplett sauber neu strukturieren"-Auftrag — a full
 * reordering into the exact requested learning-journey sequence:
 * Grundlagen -> Polyvagaltheorie -> Neurozeption -> die drei
 * Hauptzustände (one single, central, merged explanation instead of
 * three overlapping ones) -> vereinfachter Ablauf -> erweiterte
 * Stressreaktionen (grouped by zone) -> interaktives Erkunden (3
 * scenarios) -> "Was kann mir helfen?" (now last). No content deleted:
 * every string that existed before this restructuring still exists
 * and is shown somewhere on this page, just reordered and de-
 * duplicated. The three previously separate places that each
 * explained the states (the "three states" toggle, the plain zone
 * ladder grid, and the flat list of 7 individually-explained states)
 * are now ONE section: the ladder illustration + zone cards, with the
 * seven specific states nested as tappable chips inside their zone.
 */
/**
 * Reusable single-open-at-a-time collapsible item for the "Grundlagen"
 * sequence — replaces the old plain-text-only renderer since several
 * of the new items need bullet lists, nested sub-bullets, or a small
 * table rather than a single paragraph.
 */
function BasicsItem({
  id,
  title,
  openId,
  setOpenId,
  children,
}: {
  id: string;
  title: string;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  children: React.ReactNode;
}) {
  const isOpen = openId === id;
  return (
    <Card padding="none">
      <button onClick={() => setOpenId(isOpen ? null : id)} className="w-full flex items-center justify-between text-left p-3.5">
        <span className="text-[13px] font-medium text-[var(--color-text)]">{title}</span>
        {isOpen ? <ChevronUp size={15} className="text-[var(--color-text-faint)] flex-shrink-0 ml-2" /> : <ChevronDown size={15} className="text-[var(--color-text-faint)] flex-shrink-0 ml-2" />}
      </button>
      {isOpen && <div className="px-3.5 pb-3.5 animate-in">{children}</div>}
    </Card>
  );
}

export function NervousSystemReferencePage() {
  const t = useT();
  const navigate = useNavigate();
  const [showBasics, setShowBasics] = useState(false);
  const [openBasicsItem, setOpenBasicsItem] = useState<string | null>(null);
  const [showRegulation, setShowRegulation] = useState(false);
  const [showExtendedResponses, setShowExtendedResponses] = useState(false);
  const [openState, setOpenState] = useState<string | null>(null);

  const zoneOrder: PolyvagalZone[] = ['ventral', 'sympathetic', 'dorsal'];
  // "Kollaps und Fawn gehoeren zu den erweiterten"-Korrektur — Angepasst
  // (Fawn) and Kollaps (Collapse) are pulled OUT of the three-zone
  // breakdown below and shown instead alongside Fine/Flood/Friend in
  // the extended-responses section, since both are themselves
  // extensions beyond the classic fight/flight/freeze picture. Only
  // the DISPLAY on this page changes — Zugang's own state model
  // (SURVIVAL_STATE_ORDER) is untouched, so nothing about how Zugang
  // itself works is affected.
  const CORE_ZONE_STATES = new Set(['verbunden', 'mobilisiert', 'flucht', 'kampf', 'erstarren']);
  const statesByZone = zoneOrder.map((zone) => ({
    zone,
    states: SURVIVAL_STATE_ORDER.filter((s) => SURVIVAL_TO_POLYVAGAL_ZONE[s] === zone && CORE_ZONE_STATES.has(s)),
  }));
  type ExtendedItem = { zone: PolyvagalZone; emoji: string; name: string; meaning: string; mechanism: string };
  const movedCoreStates: ExtendedItem[] = (['angepasst', 'kollaps'] as const).map((s) => {
    const meta = SURVIVAL_STATE_META[s];
    const zone = SURVIVAL_TO_POLYVAGAL_ZONE[s];
    return {
      zone,
      emoji: meta.emoji,
      name: `${meta.label} (${meta.labelEn})`,
      meaning: t.nervousSystemRef.movedStateNote,
      mechanism: t.zugang.survivalExplainers[meta.explanationKey as keyof typeof t.zugang.survivalExplainers],
    };
  });
  const allExtended: ExtendedItem[] = [...(t.nervousSystemRef.extendedResponses as ExtendedItem[]), ...movedCoreStates];
  // "Fine/Flood/Friend gehoeren ins Toleranzfenster"-Korrektur — these
  // are now correctly tagged 'ventral' (see zugangContent.ts), so this
  // section now covers all three zones, not just sympathetic/dorsal.
  const extendedByZone = (['ventral', 'sympathetic', 'dorsal'] as const).map((zone) => ({
    zone,
    items: allExtended.filter((r) => r.zone === zone),
  }));

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="nervensystem" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.nervousSystemRef.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5 leading-relaxed">{t.nervousSystemRef.subtitle}</p>

        {/* 1. GRUNDLAGEN — abholen, wer noch nie davon gehört hat */}
        <button
          onClick={() => setShowBasics((v) => !v)}
          className="w-full flex items-center justify-between text-left mb-6 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
        >
          <span className="text-[14px] text-[var(--color-text)]">{t.nervousSystemRef.basicsTitle}</span>
          {showBasics ? <ChevronUp size={16} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" />}
        </button>
        {showBasics && (
          <div className="animate-in mb-6 -mt-3">
            <p className="text-[12px] text-[var(--color-text-faint)] mb-3 leading-relaxed">{t.nervousSystemRef.basicsIntro}</p>
            <div className="flex flex-col gap-2">
              <BasicsItem id="ns1Title" title={t.nervousSystemRef.ns1Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.ns1Text}</p>
              </BasicsItem>

              <BasicsItem id="ns2Title" title={t.nervousSystemRef.ns2Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.ns2Text}</p>
              </BasicsItem>

              <BasicsItem id="ns3Title" title={t.nervousSystemRef.ns3Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.nervousSystemRef.ns3Intro}</p>
                <ul className="flex flex-col gap-2">
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.ns3Cns}</li>
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.ns3Pns}</li>
                </ul>
              </BasicsItem>

              <BasicsItem id="ns4Title" title={t.nervousSystemRef.ns4Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.nervousSystemRef.ns4Intro}</p>
                <ul className="flex flex-col gap-2 mb-3">
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.ns4Somatic}</li>
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.ns4Autonomic}</li>
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed pl-3">◦ {t.nervousSystemRef.ns4Sympathetic}</li>
                  <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed pl-3">◦ {t.nervousSystemRef.ns4Parasympathetic}</li>
                </ul>
                <AutonomicOrgansIllustration />
              </BasicsItem>

              <BasicsItem id="ns5Title" title={t.nervousSystemRef.ns5Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.ns5Text}</p>
                <SourceNoteCard
                  text={t.nervousSystemRef.ns5SourcesTitle}
                  sourceIds={['gesundheitsinformation-nervensystem', 'msd-nervensystem', 'neurologennetz-nervensystem', 'doccheck-nervensystem', 'kenhub-nervensystem']}
                />
              </BasicsItem>

              <BasicsItem id="pv1Title" title={t.nervousSystemRef.pv1Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.pv1Text}</p>
              </BasicsItem>

              <BasicsItem id="pv2Title" title={t.nervousSystemRef.pv2Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.pv2Intro}</p>
                <div className="flex flex-col gap-2">
                  {([
                    ['pv2Row1State', 'pv2Row1Nerve', 'pv2Row1Behavior', 'var(--color-primary)'],
                    ['pv2Row2State', 'pv2Row2Nerve', 'pv2Row2Behavior', 'var(--color-accent-sun)'],
                    ['pv2Row3State', 'pv2Row3Nerve', 'pv2Row3Behavior', 'var(--color-accent-sky)'],
                  ] as const).map(([stateKey, nerveKey, behaviorKey, color]) => (
                    <div key={stateKey} className="rounded-[var(--radius-md)] p-3" style={{ borderLeft: `3px solid ${color}`, background: 'var(--color-surface-muted)' }}>
                      <p className="text-[12px] font-semibold text-[var(--color-text)] mb-1">{t.nervousSystemRef[stateKey]}</p>
                      <p className="text-[11px] italic text-[var(--color-text-faint)] mb-1.5">{t.nervousSystemRef[nerveKey]}</p>
                      <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef[behaviorKey]}</p>
                    </div>
                  ))}
                </div>
              </BasicsItem>

              <BasicsItem id="pv3Title" title={t.nervousSystemRef.pv3Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.pv3Text}</p>
              </BasicsItem>

              <BasicsItem id="pv4Title" title={t.nervousSystemRef.pv4Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.pv4Text}</p>
              </BasicsItem>

              <BasicsItem id="pv5Title" title={t.nervousSystemRef.pv5Title} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
                {t.nervousSystemRef.pv5Text.split('\n\n').map((para, i) => (
                  <p key={i} className={`text-[13px] text-[var(--color-text-muted)] leading-relaxed ${i === 0 ? 'mb-2' : 'font-medium text-[var(--color-text)]'}`}>{para}</p>
                ))}
                <div className="mt-3">
                  <SourceNoteCard
                    text={t.nervousSystemRef.pv5SourcesTitle}
                    sourceIds={['simplypsychology-polyvagal', 'blackroll-polyvagal', 'polyvagal-institute', 'psychologytoday-polyvagal-critique']}
                  />
                </div>
              </BasicsItem>
            </div>
          </div>
        )}

        {/* 3. NEUROZEPTION */}
        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.nervousSystemRef.neuroceptionTitle}</p>
          <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.nervousSystemRef.neuroceptionText}</p>
          <ArousalBranchIllustration />
        </Card>

        {/* 3b. STRESSTOLERANZFENSTER — neu ergaenzt: das Fenster selbst,
         * woher es kommt, wie es sich veraendert, und das "Fake-
         * Fenster"-Konzept fuer chronisch verschobene Zustaende. */}
        <p className="text-[19px] mb-1">{t.nervousSystemRef.wotTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.wotIntro}</p>
        <Card className="mb-3">
          <WindowOfToleranceIllustration />
        </Card>
        <div className="flex flex-col gap-2 mb-4">
          <BasicsItem id="wotOrigin" title={t.nervousSystemRef.wotOriginTitle} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.wotOriginText}</p>
            <SourceNoteCard text={t.nervousSystemRef.wotOriginSourcesTitle} sourceIds={['psychologytools-window-of-tolerance', 'siegel-window-of-tolerance']} />
          </BasicsItem>
          <BasicsItem id="wotChange" title={t.nervousSystemRef.wotChangeTitle} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
            <ul className="flex flex-col gap-2 mb-3">
              <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.wotNarrowing}</li>
              <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.wotWidening}</li>
            </ul>
            <SourceNoteCard text={t.nervousSystemRef.wotChangeSourcesTitle} sourceIds={['suesens-stresstoleranz', 'khiron-polyvagal-ladder']} />
          </BasicsItem>
          <BasicsItem id="wotFake" title={t.nervousSystemRef.wotFakeTitle} openId={openBasicsItem} setOpenId={setOpenBasicsItem}>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.nervousSystemRef.wotFakeIntro}</p>
            <ul className="flex flex-col gap-2 mb-3">
              <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.wotFakeHyper}</li>
              <li className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {t.nervousSystemRef.wotFakeHypo}</li>
            </ul>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.wotFakeNote}</p>
            <SourceNoteCard text={t.nervousSystemRef.wotFakeSourcesTitle} sourceIds={['dis-sos-verschobenes-fenster']} />
          </BasicsItem>
        </div>

        {/* 4. DIE DREI HAUPTZUSTÄNDE — die EINE zentrale, ausführliche
         * Stelle. Leiter-Illustration mit beiden Richtungen, dann pro
         * Zone: Erklärung + die zugehörigen konkreten Zustände als
         * antippbare Chips (ersetzt die vorher separate Zustandsliste
         * und das separate Leiter-Raster). */}
        <p className="text-[19px] mb-1">{t.nervousSystemRef.threeStatesTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.threeStatesIntro}</p>
        <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{t.nervousSystemRef.ladderTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.nervousSystemRef.ladderIntro}</p>
        <Card className="mb-3">
          <PolyvagalLadderIllustration />
        </Card>
        <div className="flex flex-col gap-1 mb-4">
          <p className="text-[12px] text-[var(--color-text-muted)]">{t.nervousSystemRef.ladderDownNote}</p>
          <p className="text-[12px] text-[var(--color-text-muted)]">{t.nervousSystemRef.ladderUpNote}</p>
          <p className="text-[11px] text-[var(--color-text-faint)] mt-1 italic">{t.nervousSystemRef.ladderVariesNote}</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {statesByZone.map(({ zone, states }) => (
            <Card key={zone} style={{ borderLeft: `4px solid ${POLYVAGAL_ZONE_META[zone].color}` }}>
              <p className="text-[13px] font-medium mb-1" style={{ color: POLYVAGAL_ZONE_META[zone].color }}>
                {t.nervousSystemRef.threeStatesDetail[zone].title}
              </p>
              <ul className="flex flex-col gap-1 mb-3">
                {t.nervousSystemRef.threeStatesDetail[zone].points.map((p) => (
                  <li key={p} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">• {p}</li>
                ))}
              </ul>
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.nervousSystemRef.ladderStatesLabel}</p>
              <div className="flex flex-col gap-2">
                {states.map((s) => {
                  const meta = SURVIVAL_STATE_META[s];
                  const open = openState === s;
                  return (
                    <div key={s}>
                      <button
                        onClick={() => setOpenState(open ? null : s)}
                        className="w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-full bg-[var(--color-surface-muted)]"
                      >
                        <span className="text-[15px]" aria-hidden="true">{meta.emoji}</span>
                        <span className="text-[13px] text-[var(--color-text)]">{meta.label}</span>
                        {open ? <ChevronUp size={13} className="text-[var(--color-text-faint)] ml-auto flex-shrink-0" /> : <ChevronDown size={13} className="text-[var(--color-text-faint)] ml-auto flex-shrink-0" />}
                      </button>
                      {open && (
                        <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mt-1.5 px-2.5 animate-in">
                          {t.zugang.survivalExplainers[meta.explanationKey as keyof typeof t.zugang.survivalExplainers]}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
          <SourceNoteCard text={t.nervousSystemRef.threeStatesSource} sourceIds={['birkmayer-drei-zustaende', 'aok-sympathikus-parasympathikus', 'dana-polyvagal']} />
        </div>

        {/* 5. VEREINFACHTER ABLAUF */}
        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-3 text-center">{t.nervousSystemRef.flowTitle}</p>
          <div className="flex items-center justify-center flex-wrap gap-1.5">
            {t.nervousSystemRef.flowSteps.map((step, i) => (
              <div key={step} className="flex items-center gap-1.5">
                <span className="px-2.5 py-1.5 rounded-full text-[11px] text-center bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                  {step}
                </span>
                {i < t.nervousSystemRef.flowSteps.length - 1 && (
                  <span className="text-[var(--color-text-faint)] text-[12px]">→</span>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-[var(--color-text-faint)] mt-3 text-center leading-relaxed">{t.nervousSystemRef.flowHint}</p>
        </Card>

        {/* 6. ERWEITERTE STRESSREAKTIONEN — nach Zone gruppiert */}
        <button
          onClick={() => setShowExtendedResponses((v) => !v)}
          className="w-full flex items-center justify-between text-left mb-4 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
        >
          <span className="text-[14px] text-[var(--color-text)]">{t.nervousSystemRef.extendedTitle}</span>
          {showExtendedResponses ? <ChevronUp size={16} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" />}
        </button>
        {showExtendedResponses && (
          <div className="animate-in mb-6">
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.nervousSystemRef.extendedIntro}</p>
            <p className="text-[11px] text-[var(--color-text-faint)] italic leading-relaxed mb-4">{t.nervousSystemRef.extendedZoneHedge}</p>
            {extendedByZone.map(({ zone, items }) => (
              <div key={zone} className="mb-4">
                <p className="text-[12px] uppercase tracking-wide mb-2" style={{ color: POLYVAGAL_ZONE_META[zone].color }}>
                  {POLYVAGAL_ZONE_META[zone].label(t)}
                </p>
                {items.map((r) => (
                  <Card key={r.name} className="mb-2" style={{ borderLeft: `3px solid ${POLYVAGAL_ZONE_META[zone].color}` }}>
                    <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{r.emoji} {r.name}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)] mb-2 italic">{r.meaning}</p>
                    <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{r.mechanism}</p>
                  </Card>
                ))}
              </div>
            ))}
            <SourceNoteCard
              text={t.nervousSystemRef.extendedSource}
              sourceIds={['attachmentproject-trauma-responses', 'ninds-syncope', 'webmd-fight-flight-freeze-fawn']}
            />
          </div>
        )}

        {/* 7. INTERAKTIVES ERKUNDEN — 3 Alltagsszenarien */}
        <Card className="mb-6">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-3 text-center">{t.nervousSystemRef.waveTitle}</p>
          <ActivationWave />
        </Card>

        {/* 8. WAS KANN MIR HELFEN — jetzt am Ende, als Handlungsebene
         * nach der Verstehens-/Orientierungsebene oben. */}
        <button
          onClick={() => setShowRegulation((v) => !v)}
          className="w-full flex items-center justify-between text-left mb-6 p-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)]"
        >
          <span className="text-[14px] text-[var(--color-text)]">{t.nervousSystemRef.regulationTitle}</span>
          {showRegulation ? <ChevronUp size={16} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" />}
        </button>
        {showRegulation && (
          <Card className="mb-6 -mt-4 animate-in">
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.nervousSystemRef.regulationOrderTitle}</p>
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {t.nervousSystemRef.regulationOrderSteps.map((step, i) => (
                <div key={step} className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-full text-[11px] bg-[var(--color-primary-soft)] text-[var(--color-primary)]">{step}</span>
                  {i < t.nervousSystemRef.regulationOrderSteps.length - 1 && <span className="text-[var(--color-text-faint)] text-[11px]">→</span>}
                </div>
              ))}
            </div>
            <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mb-4">{t.nervousSystemRef.regulationOrderHint}</p>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.nervousSystemRef.regulationHint}</p>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {t.nervousSystemRef.regulationItems.map((item) => (
                <span key={item} className="px-2.5 py-1.5 rounded-full text-[12px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                  {item}
                </span>
              ))}
            </div>
            <div className="rounded-[var(--radius-lg)] p-3" style={{ background: 'var(--color-primary-soft)' }}>
              <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.nervousSystemRef.titrationTitle}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.nervousSystemRef.titrationText}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.nervousSystemRef.pendulationText}</p>
            </div>
            <div className="mt-3">
              <SourceNoteCard text={t.nervousSystemRef.titrationSourcesTitle} sourceIds={['levine-titration-pendulation']} />
            </div>
          </Card>
        )}

        <Link to="/inneres-wetter" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-6">
          <Activity size={14} /> {t.nervousSystemRef.tageskurveLink}
        </Link>

        <SourceNoteCard text={t.nervousSystemRef.sourceNote} sourceIds={['dana-polyvagal']} />
      </div>
    </div>
  );
}
