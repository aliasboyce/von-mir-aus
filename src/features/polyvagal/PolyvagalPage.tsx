import { useEffect, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { triggerPrint } from '../../services/printSupport';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Maximize2, X, LineChart, ChevronDown, NotebookPen, Check, Plus, FileDown, Pencil } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ReminderControl } from '../../components/shared/ReminderControl';
import { useT } from '../../i18n';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { useSettings } from '../../state/SettingsContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { polyvagalRepo, todaysCheckIns } from './polyvagalRepo';
import { NervousSystemLadder } from './NervousSystemLadder';
import { NervousSystemLadderSlider } from './NervousSystemLadderSlider';
import { PolyvagalDayChart } from './PolyvagalDayChart';
import { describeDay } from './describeDay';
import { tensionRepo, todaysTensionEntries } from './tensionRepo';
import { TensionDayChart } from './TensionDayChart';
import { TensionHistoryChart } from './TensionHistoryChart';
import { TensionEntryModal } from './TensionEntryModal';
import { TensionPrintView } from './TensionPrintView';
import { describeTensionDay } from './describeTensionDay';
import { diaryRepo } from '../diary/diaryRepo';
import { createId } from '../../services/storage/repository';
import type { PolyvagalCheckIn, PolyvagalZone, TensionEntry, ZugangSurvivalState } from '../../data/types';
import { tensionColorFor, TensionScale } from './TensionScale';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';

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

  const [tensionEntries, setTensionEntries] = useState<TensionEntry[]>(() => todaysTensionEntries());
  const [tensionView, setTensionView] = useState<'today' | 'history'>('today');
  const [tensionEntryOpen, setTensionEntryOpen] = useState(false);
  const [editingTension, setEditingTension] = useState<TensionEntry | null>(null);
  const [tensionFullscreen, setTensionFullscreen] = useState(false);
  const [printingTension, setPrintingTension] = useState(false);

  const dayDescription = describeDay(checkIns, t);
  const tensionDescription = describeTensionDay(tensionEntries, t);
  const allTensionEntries = tensionRepo.getAll();

  useEffect(() => {
    const clear = () => setPrintingTension(false);
    window.addEventListener('afterprint', clear);
    return () => window.removeEventListener('afterprint', clear);
  }, []);

  function logZone(zone: PolyvagalZone, survivalState?: ZugangSurvivalState) {
    polyvagalRepo.save({ id: createId('pv'), createdAt: new Date().toISOString(), zone, survivalState, tensionValue });
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

  function saveTensionEntry(value: number, time: string, survivalState?: ZugangSurvivalState) {
    const [hours, minutes] = time.split(':').map(Number);
    const date = editingTension ? new Date(editingTension.createdAt) : new Date();
    date.setHours(hours, minutes, 0, 0);
    tensionRepo.save({ id: editingTension?.id ?? createId('tension'), createdAt: date.toISOString(), value, survivalState });
    setTensionEntries(todaysTensionEntries());
    setEditingTension(null);
  }

  function deleteTensionEntry() {
    if (!editingTension) return;
    tensionRepo.remove(editingTension.id);
    setTensionEntries(todaysTensionEntries());
    setEditingTension(null);
    setTensionEntryOpen(false);
  }

  function exportTensionPdf() {
    setPrintingTension(true);
    setTimeout(() => triggerPrint(t.common.printStandaloneExplanation), 50);
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
          <p className="text-[14px] text-[var(--color-text)] mb-3 text-center">{t.tension.whichIntensityQuestion}</p>
          <TensionScale value={tensionValue} onChange={setTensionValue} descriptionStyle="gentle" />

          <p className="text-[14px] text-[var(--color-text)] mt-6 mb-4 text-center">{t.polyvagal.quickPrompt}</p>

          {/* "Regenbogen-Leiter"-Auftrag — the same continuous slider
           * Zugang and the daily check-in now use, as the primary way
           * to log a state here too, instead of the fixed button grid
           * this used before. The richer per-zone detail content
           * (meaning/feeling/physical/behavior) isn't deleted — it's
           * still available right below via "Mehr erfahren", so
           * nothing already written is lost, only demoted from
           * primary interaction to optional depth. */}
          <NervousSystemLadderSlider onSelect={logZone} selectedState={checkIns[checkIns.length - 1]?.survivalState} />

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

        {/* ================= Meine Spannung — independent, clearly distinguished ================= */}
        <div className="pt-2 border-t border-[var(--color-border)]">
          <div className="flex items-center justify-between mt-6 mb-1">
            <h2 className="text-[18px] text-[var(--color-text)]">{t.tension.title}</h2>
            <button
              onClick={exportTensionPdf}
              aria-label={t.tension.exportPdf}
              className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <FileDown size={15} />
            </button>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-1">{t.tension.subtitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.tension.distinctionNote}</p>

          <Button
            fullWidth
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingTension(null);
              setTensionEntryOpen(true);
            }}
            className="mb-4"
          >
            {t.tension.addNew}
          </Button>

          <div className="flex gap-2 mb-3">
            <Chip selected={tensionView === 'today'} onClick={() => setTensionView('today')}>
              {t.tension.todayView}
            </Chip>
            <Chip selected={tensionView === 'history'} onClick={() => setTensionView('history')}>
              {t.tension.historyView}
            </Chip>
            <button
              onClick={() => setTensionFullscreen(true)}
              aria-label={t.tension.enlargeChart}
              className="ml-auto p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
            >
              <Maximize2 size={15} />
            </button>
          </div>

          <Card padding="lg" className="mb-3">
            {tensionView === 'today' ? (
              <TensionDayChart entries={tensionEntries} />
            ) : (
              <TensionHistoryChart entries={allTensionEntries} />
            )}
          </Card>

          {tensionView === 'today' && (
            <Card className="mb-4">
              <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-3">{tensionDescription}</p>
              {tensionEntries.length > 0 && (
                <div className="flex flex-col gap-1.5 pt-2 border-t border-[var(--color-border)]">
                  <p className="text-[11px] text-[var(--color-text-faint)] mb-1">{t.tension.savedEntries}</p>
                  {tensionEntries.map((e) => (
                    <div key={e.id} className="flex items-center gap-2 text-[13px]">
                      <span className="text-[var(--color-text-faint)] flex-shrink-0">
                        {new Date(e.createdAt).toLocaleTimeString(settings.language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: tensionColorFor(e.value) }} aria-hidden="true" />
                      <span className="text-[var(--color-text)] flex-1">
                        {e.value}/100
                        {e.survivalState && <span className="ml-1.5">{SURVIVAL_STATE_META[e.survivalState].emoji}</span>}
                      </span>
                      <button
                        onClick={() => {
                          setEditingTension(e);
                          setTensionEntryOpen(true);
                        }}
                        aria-label={t.common.edit}
                        className="p-1 text-[var(--color-text-faint)]"
                      >
                        <Pencil size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <Card padding="md" className="mb-3 flex items-center justify-between">
            <span className="text-[13px] text-[var(--color-text)]">{t.settings.dailyReviewTension}</span>
            <button
              role="switch"
              aria-checked={settings.dailyReviewShowTension !== false}
              onClick={() => updateSettings({ dailyReviewShowTension: !(settings.dailyReviewShowTension !== false) })}
              className="w-10 h-6 rounded-full relative flex-shrink-0"
              style={{ background: settings.dailyReviewShowTension !== false ? 'var(--color-primary)' : 'var(--color-border)' }}
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: settings.dailyReviewShowTension !== false ? 18 : 2 }}
              />
            </button>
          </Card>

          <Card padding="md" className="mb-6">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-[var(--color-text)]">{t.tension.autoAddSetting}</span>
              <button
                role="switch"
                aria-checked={!!settings.autoAddTensionToDiary}
                onClick={() => updateSettings({ autoAddTensionToDiary: !settings.autoAddTensionToDiary })}
                className="w-10 h-6 rounded-full relative flex-shrink-0"
                style={{ background: settings.autoAddTensionToDiary ? 'var(--color-primary)' : 'var(--color-border)' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                  style={{ left: settings.autoAddTensionToDiary ? 18 : 2 }}
                />
              </button>
            </div>
            <p className="text-[11px] text-[var(--color-text-faint)] mt-1">{t.tension.autoAddHint}</p>
          </Card>
        </div>
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

      {tensionFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[200] bg-[var(--color-bg)] flex flex-col animate-in"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between p-5" style={{ paddingTop: 'max(20px, env(safe-area-inset-top))' }}>
              <button
                onClick={() => setTensionFullscreen(false)}
                aria-label={t.common.close}
                className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <p className="text-[14px] text-[var(--color-text-muted)]">{t.tension.title}</p>
              <div style={{ width: 40 }} />
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 overflow-auto pb-8">
              {tensionView === 'today' ? (
                <TensionDayChart entries={tensionEntries} expanded zoomable />
              ) : (
                <TensionHistoryChart entries={allTensionEntries} width={560} height={340} zoomable />
              )}
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

      <TensionEntryModal
        open={tensionEntryOpen}
        onClose={() => {
          setTensionEntryOpen(false);
          setEditingTension(null);
        }}
        onSave={saveTensionEntry}
        onDelete={editingTension ? deleteTensionEntry : undefined}
        editing={editingTension}
      />

      {printingTension && (
        <TensionPrintView
          entries={allTensionEntries}
          labels={{ title: t.tension.exportTitle, subtitle: t.tension.subtitle, exportedOn: t.network.exportedOn }}
          formatDate={(iso) => new Date(iso).toLocaleDateString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          formatTime={(iso) => new Date(iso).toLocaleTimeString(settings.language === 'de' ? 'de-DE' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
        />
      )}
    </div>
  );
}
