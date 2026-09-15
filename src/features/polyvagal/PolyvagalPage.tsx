import { useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Maximize2, X, LineChart, ChevronDown, NotebookPen, Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ReminderControl } from '../../components/shared/ReminderControl';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useSettings } from '../../state/SettingsContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { polyvagalRepo, todaysCheckIns } from './polyvagalRepo';
import { NervousSystemLadder } from './NervousSystemLadder';
import { NervousSystemLadderSlider } from './NervousSystemLadderSlider';
import { ArousalModelExplainer } from './ArousalModelExplainer';
import { PolyvagalDayChart } from './PolyvagalDayChart';
import { describeDay } from './describeDay';
import { tensionRepo } from './tensionRepo';
import { diaryRepo } from '../diary/diaryRepo';
import { createId } from '../../services/storage/repository';
import type { PolyvagalCheckIn, PolyvagalZone, ZugangSurvivalState } from '../../data/types';

type ExplainerSection =
  | 'nervousSystem'
  | 'what'
  | 'colors'
  | 'neuroception'
  | 'notChoice'
  | 'coRegulation'
  | 'notGoodBad'
  | 'swings'
  | 'framework'
  | 'practical';

const EXPLAINER_SECTIONS: ExplainerSection[] = [
  'nervousSystem',
  'what',
  'colors',
  'neuroception',
  'notChoice',
  'coRegulation',
  'notGoodBad',
  'swings',
  'framework',
  'practical',
];

type ExplainerTitleKey =
  | 'explainerNervousSystemTitle'
  | 'explainerWhatTitle'
  | 'explainerColorsTitle'
  | 'explainerNeuroceptionTitle'
  | 'explainerNotChoiceTitle'
  | 'explainerCoRegulationTitle'
  | 'explainerNotGoodBadTitle'
  | 'explainerSwingsTitle'
  | 'explainerFrameworkTitle'
  | 'explainerPracticalTitle';
type ExplainerBodyKey =
  | 'explainerNervousSystem'
  | 'explainerWhat'
  | 'explainerColors'
  | 'explainerNeuroception'
  | 'explainerNotChoice'
  | 'explainerCoRegulation'
  | 'explainerNotGoodBad'
  | 'explainerSwings'
  | 'explainerFramework'
  | 'explainerPractical';

const EXPLAINER_TITLE_KEY: Record<ExplainerSection, ExplainerTitleKey> = {
  nervousSystem: 'explainerNervousSystemTitle',
  what: 'explainerWhatTitle',
  colors: 'explainerColorsTitle',
  neuroception: 'explainerNeuroceptionTitle',
  notChoice: 'explainerNotChoiceTitle',
  coRegulation: 'explainerCoRegulationTitle',
  notGoodBad: 'explainerNotGoodBadTitle',
  swings: 'explainerSwingsTitle',
  framework: 'explainerFrameworkTitle',
  practical: 'explainerPracticalTitle',
};
const EXPLAINER_BODY_KEY: Record<ExplainerSection, ExplainerBodyKey> = {
  nervousSystem: 'explainerNervousSystem',
  what: 'explainerWhat',
  colors: 'explainerColors',
  neuroception: 'explainerNeuroception',
  notChoice: 'explainerNotChoice',
  coRegulation: 'explainerCoRegulation',
  notGoodBad: 'explainerNotGoodBad',
  swings: 'explainerSwings',
  framework: 'explainerFramework',
  practical: 'explainerPractical',
};

export function PolyvagalPage() {
  const t = useT();
  const say = useCompanionSay();
  const { settings, updateSettings } = useSettings();
  const [searchParams, setSearchParams] = useSearchParams();
  const expandedZoneParam = (searchParams.get('zone') as PolyvagalZone | null) ?? null;
  const setExpandedZoneParam = (zone: PolyvagalZone | null) => {
    const next = new URLSearchParams(searchParams);
    if (zone) next.set('zone', zone);
    else next.delete('zone');
    setSearchParams(next, { replace: true });
  };
  const [checkIns, setCheckIns] = useState<PolyvagalCheckIn[]>(() => todaysCheckIns());
  const [tensionValue, setTensionValue] = useState(50);
  const [showLadderDetail, setShowLadderDetail] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [savedToDiary, setSavedToDiary] = useState(false);
  const [openSection, setOpenSection] = useState<ExplainerSection | null>(null);

  const dayDescription = describeDay(checkIns, t);

  function logZone(zone: PolyvagalZone, survivalState?: ZugangSurvivalState) {
    const now = new Date().toISOString();
    polyvagalRepo.save({ id: createId('pv'), createdAt: now, zone, survivalState, tensionValue });
    // "Status-Niveau/Anspannung vereinen"-Auftrag — the separate "Meine
    // Spannung" section (its own add-entry flow + two extra charts) is
    // gone, but DailyReview still reads tensionRepo for its own daily
    // summary — this keeps that fed from the one unified slider
    // instead of a second, now-removed manual entry point.
    tensionRepo.save({ id: createId('tension'), createdAt: now, value: tensionValue, survivalState });
    setCheckIns(todaysCheckIns());
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
    say(pickLine({ page: '/entdecken/tageskurve', trigger: 'tageskurve' }), { joy: true });
  }

  function saveCurveToDiary() {
    const now = new Date().toISOString();
    diaryRepo.save({
      id: createId('diary'),
      createdAt: now,
      updatedAt: now,
      content: `${t.polyvagal.todayChart}\n${dayDescription}`,
      polyvagalSnapshot: checkIns.map((c) => ({ zone: c.zone, createdAt: c.createdAt })),
    });
    setSavedToDiary(true);
    setTimeout(() => setSavedToDiary(false), 1800);
  }

  return (
    <div className="animate-in">
      <div className="no-print">
      <TopBar action={<HelpButton helpKey="tageskurve" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.polyvagal.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.polyvagal.subtitle}</p>

        {/* ================= Interactive state ladder + check-in ================= */}
        <Card padding="lg" className="mb-3">
          <p className="text-[14px] text-[var(--color-text)] mt-1 mb-4 text-center">{t.polyvagal.quickPrompt}</p>

          {/* "Status-Niveau/Anspannung vereinen"-Auftrag — the ladder's
           * own raw 0-100 value now IS tensionValue directly (passed
           * in/out below), instead of asking a separate "how tense are
           * you" question with its own independent number right above
           * this. One slider, one number, everywhere it's asked. */}
          <ArousalModelExplainer />
          <NervousSystemLadderSlider
            onSelect={logZone}
            selectedState={checkIns[checkIns.length - 1]?.survivalState}
            value={tensionValue}
            onValueChange={setTensionValue}
          />

          {justSaved && (
            <p className="text-[12px] text-[var(--color-primary)] text-center mt-4 animate-in">{t.polyvagal.saved}</p>
          )}

          <button
            onClick={() => setShowLadderDetail((v) => !v)}
            className="text-[12px] text-[var(--color-primary)] mt-4 mx-auto block"
          >
            {showLadderDetail ? t.polyvagal.hideLadderDetailCta : t.polyvagal.showLadderDetailCta}
          </button>
          {showLadderDetail && (
            <div className="mt-3 animate-in">
              <NervousSystemLadder onSelect={logZone} selected={checkIns[checkIns.length - 1]?.zone} expanded={expandedZoneParam} onExpandedChange={setExpandedZoneParam} />
            </div>
          )}
        </Card>

        <Link to="/entdecken/nervensystem" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-6">
          🧠 {t.polyvagal.nervensystemPageLink}
        </Link>

        <Card padding="md" className="mb-6">
          <ReminderControl compact />
        </Card>

        <Card padding="md" className="mb-6 flex items-center justify-between">
          <span className="text-[13px] text-[var(--color-text)]">{t.settings.dailyReviewPolyvagal}</span>
          <button
            role="switch"
            aria-checked={settings.dailyReviewShowPolyvagal !== false}
            onClick={() => updateSettings({ dailyReviewShowPolyvagal: !(settings.dailyReviewShowPolyvagal !== false) })}
            className="w-10 h-6 rounded-full relative flex-shrink-0"
            style={{ background: settings.dailyReviewShowPolyvagal !== false ? 'var(--color-primary)' : 'var(--color-border)' }}
          >
            <span
              className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
              style={{ left: settings.dailyReviewShowPolyvagal !== false ? 18 : 2 }}
            />
          </button>
        </Card>

        <div className="flex items-center justify-between mb-3">
          <p className="text-[13px] uppercase tracking-wide text-[var(--color-text-faint)]">
            {t.polyvagal.todayChart}
          </p>
          <button
            onClick={() => setFullscreen(true)}
            aria-label={t.polyvagal.expandChart}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <Maximize2 size={15} />
          </button>
        </div>
        <Card padding="lg" className="mb-3">
          <PolyvagalDayChart checkIns={checkIns} />
        </Card>

        <Card className="mb-6">
          <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{dayDescription}</p>
        </Card>

        <Button
          fullWidth
          variant="secondary"
          icon={savedToDiary ? <Check size={16} /> : <NotebookPen size={16} />}
          onClick={saveCurveToDiary}
          className="mb-6"
        >
          {savedToDiary ? t.polyvagal.savedCurveToDiary : t.polyvagal.saveToDiary}
        </Button>

        <p className="text-[12px] text-[var(--color-text-faint)] mb-6 text-center">{t.polyvagal.sensitiveNote}</p>

        <Link to="/entdecken/tageskurve/entwicklung" className="mb-8 block">
          <Card interactive className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center flex-shrink-0">
              <LineChart size={18} />
            </div>
            <div>
              <p className="text-[14px] text-[var(--color-text)]">{t.polyvagal.developmentTitle}</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">{t.polyvagal.developmentSubtitle}</p>
            </div>
          </Card>
        </Link>

      </div>
      </div>

      {fullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col animate-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setFullscreen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <p className="text-[14px] text-[var(--color-text-muted)]">{t.polyvagal.todayChart}</p>
              <div style={{ width: 40 }} />
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <PolyvagalDayChart checkIns={checkIns} expanded />
            </div>
          </div>,
          document.body,
        )}

        {/* ================= Deeper explanation, accordion style — moved
         * to the end of the page per "Anspannung + Zustand gehoert
         * zusammen, das kommt zuerst" ================= */}
        <Card className="mb-6" padding="md">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.polyvagal.explainerTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-3">{t.polyvagal.explainerIntro}</p>
          <div className="flex flex-col">
            {EXPLAINER_SECTIONS.map((section) => {
              const isOpen = openSection === section;
              return (
                <div key={section} className="border-t border-[var(--color-border)] first:border-t-0">
                  <button
                    onClick={() => setOpenSection(isOpen ? null : section)}
                    aria-expanded={isOpen}
                    className="w-full flex items-center justify-between py-2.5 text-left"
                  >
                    <span className="text-[13px] text-[var(--color-text)]">{t.polyvagal[EXPLAINER_TITLE_KEY[section]]}</span>
                    <ChevronDown
                      size={15}
                      className="text-[var(--color-text-faint)] flex-shrink-0 transition-transform"
                      style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
                    />
                  </button>
                  {isOpen && (
                    <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed pb-3 animate-in">
                      {t.polyvagal[EXPLAINER_BODY_KEY[section]]}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
    </div>
  );
}
