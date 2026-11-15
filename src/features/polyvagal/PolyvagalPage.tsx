import { useRef, useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { createPortal } from 'react-dom';
import { Link, useSearchParams } from 'react-router-dom';
import { Maximize2, X, LineChart, ChevronDown, NotebookPen, Check, Printer } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ReminderControl } from '../../components/shared/ReminderControl';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { ChartPrintView } from './ChartPrintView';
import { exportCurvePdf } from '../reviews/curvePdf';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { pickLine } from '../../components/companion/companionRegistry';
import { polyvagalRepo, todaysCheckIns, checkInsInLastDays, setCheckInNote } from './polyvagalRepo';
import { NervousSystemLadder } from './NervousSystemLadder';
import { NervousSystemLadderSlider } from './NervousSystemLadderSlider';
import { ArousalModelExplainer } from './ArousalModelExplainer';
import { ReflectionModal } from './ReflectionModal';
import { PolyvagalDayChart } from './PolyvagalDayChart';
import { CheckInNote } from './CheckInNote';
import { CheckInRows } from './CheckInRows';
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
  const { settings } = useSettings();
  const say = useCompanionSay();
  const [searchParams, setSearchParams] = useSearchParams();
  const expandedZoneParam = (searchParams.get('zone') as PolyvagalZone | null) ?? null;
  const setExpandedZoneParam = (zone: PolyvagalZone | null) => {
    const next = new URLSearchParams(searchParams);
    if (zone) next.set('zone', zone);
    else next.delete('zone');
    setSearchParams(next, { replace: true });
  };
  const [checkIns, setCheckIns] = useState<PolyvagalCheckIn[]>(() => todaysCheckIns());
  const [chartPeriod, setChartPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [reflectingOn, setReflectingOn] = useState<PolyvagalCheckIn | null>(null);
  const chartCheckIns = chartPeriod === 'day' ? checkIns : chartPeriod === 'week' ? checkInsInLastDays(7) : checkInsInLastDays(30);
  const [tensionValue, setTensionValue] = useState(50);
  const [showLadderDetail, setShowLadderDetail] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [savedToDiary, setSavedToDiary] = useState(false);
  const [showAllRows, setShowAllRows] = useState(false);
  const [openSection, setOpenSection] = useState<ExplainerSection | null>(null);

  const dayDescription = describeDay(checkIns, t);

  // wer innerhalb von 90 Sekunden die Auswahl ändert, ändert den Wert – es entsteht kein zweiter Eintrag
  const lastSaved = useRef<{ pv: string; tension: string; at: number } | null>(null);
  const [noteDraft, setNoteDraft] = useState('');
  const [lastId, setLastId] = useState<string | null>(null);

  function refresh() {
    setCheckIns(todaysCheckIns());
  }

  function logZone(zone: PolyvagalZone, survivalState?: ZugangSurvivalState) {
    const nowMs = Date.now();
    const now = new Date(nowMs).toISOString();
    const prev = lastSaved.current;
    const reuse = prev && nowMs - prev.at < 90_000 && polyvagalRepo.getById(prev.pv);
    if (reuse && prev) {
      const old = polyvagalRepo.getById(prev.pv)!;
      polyvagalRepo.save({ ...old, zone, survivalState, tensionValue });
      const t = tensionRepo.getById(prev.tension);
      if (t) tensionRepo.save({ ...t, value: tensionValue, survivalState });
      lastSaved.current = { ...prev, at: nowMs };
    } else {
      const pvId = createId('pv');
      const tId = createId('tension');
      polyvagalRepo.save({ id: pvId, createdAt: now, zone, survivalState, tensionValue });
      // „Status-Niveau/Anspannung vereinen“: DailyReview liest weiterhin tensionRepo – gespeist aus dem einen Regler
      tensionRepo.save({ id: tId, createdAt: now, value: tensionValue, survivalState });
      lastSaved.current = { pv: pvId, tension: tId, at: nowMs };
      setLastId(pvId);
      setNoteDraft('');
    }
    refresh();
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 1800);
    say(pickLine({ page: '/entdecken/tageskurve', trigger: 'tageskurve' }), { joy: true });
  }

  function changeNote(v: string) {
    setNoteDraft(v);
    if (lastId) setCheckInNote(lastId, v);
    refresh();
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

        <Button fullWidth onClick={() => document.getElementById('eintragen')?.scrollIntoView({ behavior: settings.reduceMotion ? 'auto' : 'smooth', block: 'start' })} className="mb-5" data-testid="curve-enter-btn">
          {settings.language === 'en' ? 'Enter a value now ↓' : 'Jetzt einen Wert eintragen ↓'}
        </Button>

        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-1.5">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setChartPeriod(p)}
                className="px-2.5 py-1 rounded-full text-[12px] hit44"
                style={{
                  background: chartPeriod === p ? 'var(--color-primary)' : 'var(--color-surface-muted)',
                  color: chartPeriod === p ? 'var(--color-surface)' : 'var(--color-text-muted)',
                }}
              >
                {p === 'day' ? t.polyvagal.periodDay : p === 'week' ? t.polyvagal.periodWeek : t.polyvagal.periodMonth}
              </button>
            ))}
          </div>
          <button
            onClick={() => setFullscreen(true)}
            aria-label={t.polyvagal.expandChart}
            className="p-1.5 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hit44"
          >
            <Maximize2 size={15} />
          </button>
        </div>
        <Card padding="md" className="mb-4" data-testid="curve-chart">
          <PolyvagalDayChart checkIns={chartCheckIns} period={chartPeriod} large />
        </Card>

        {chartCheckIns.length > 0 && (
          <div className="mb-5" data-testid="curve-values">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{settings.language === 'en' ? 'Your values, with time and notes' : 'Deine Werte – mit Uhrzeit und Notiz'}</p>
            <CheckInRows checkIns={chartPeriod === 'day' ? chartCheckIns : [...chartCheckIns].sort((x, y) => y.createdAt.localeCompare(x.createdAt)).slice(0, showAllRows ? 500 : 8)} showDate={chartPeriod !== 'day'} onChanged={refresh} />
            {chartPeriod !== 'day' && chartCheckIns.length > 8 && (
              <button type="button" onClick={() => setShowAllRows((v) => !v)} className="block mx-auto mt-2 min-h-[44px] px-3 text-[13px] text-[var(--color-primary)]">
                {showAllRows ? (settings.language === 'en' ? 'Show fewer' : 'Weniger zeigen') : (settings.language === 'en' ? `Show all ${chartCheckIns.length}` : `Alle ${chartCheckIns.length} zeigen`)}
              </button>
            )}
          </div>
        )}
        {chartCheckIns.length === 0 && (
          <p className="text-[13.5px] text-[var(--color-text-muted)] text-center mb-5">{settings.language === 'en' ? 'No value yet in this period – the first one is just below.' : 'In diesem Zeitraum ist noch kein Wert – der erste lässt sich gleich unten eintragen.'}</p>
        )}

        <Card className="mb-6">
          <p className="text-[14px] text-[var(--color-text)] leading-relaxed">{dayDescription}</p>
        </Card>

        {/* ================= Interactive state ladder + check-in ================= */}
        <Card padding="lg" className="mb-6" id="eintragen" data-testid="curve-enter">
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
          {lastId && polyvagalRepo.getById(lastId) && <CheckInNote key={lastId} value={noteDraft} onChange={changeNote} autoOpen />}

          <button
            onClick={() => setShowLadderDetail((v) => !v)}
            className="text-[12px] text-[var(--color-primary)] mt-4 mx-auto block hit44"
          >
            {showLadderDetail ? t.polyvagal.hideLadderDetailCta : t.polyvagal.showLadderDetailCta}
          </button>
          {showLadderDetail && (
            <div className="mt-3 animate-in">
              <NervousSystemLadder selected={checkIns[checkIns.length - 1]?.zone} expanded={expandedZoneParam} onExpandedChange={setExpandedZoneParam} />
            </div>
          )}
        </Card>

        <Link to="/entdecken/nervensystem" className="flex items-center gap-1.5 text-[13px] text-[var(--color-primary)] mb-6 hit44">
          🧠 {t.polyvagal.nervensystemPageLink}
        </Link>

        <Card padding="md" className="mb-6">
          <ReminderControl compact />
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
                className="w-11 h-11 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <X size={20} />
              </button>
              <p className="text-[14px] text-[var(--color-text-muted)]">
                {chartPeriod === 'week' ? t.polyvagal.weekChart : chartPeriod === 'month' ? t.polyvagal.monthChart : t.polyvagal.todayChart}
              </p>
              <button
                onClick={() => void exportCurvePdf(chartPeriod, t, settings.language === 'de' ? 'de-DE' : 'en-US')}
                aria-label={t.polyvagal.printChartCta}
                className="w-11 h-11 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center"
              >
                <Printer size={18} />
              </button>
            </div>
            <div className="flex-1 flex items-center justify-center px-4">
              <PolyvagalDayChart checkIns={chartCheckIns} expanded period={chartPeriod} onPointClick={(c) => setReflectingOn(c)} />
            </div>
          </div>,
          document.body,
        )}

      <ChartPrintView
        checkIns={chartCheckIns}
        boundaries={settings.arousalZoneBoundaries}
        periodLabel={chartPeriod === 'week' ? t.polyvagal.weekChart : chartPeriod === 'month' ? t.polyvagal.monthChart : t.polyvagal.todayChart}
        formatDateTime={(iso) => new Date(iso).toLocaleString(settings.language === 'de' ? 'de-DE' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
      />

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
                    className="w-full flex items-center justify-between py-2.5 min-h-[44px] text-left"
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
      {reflectingOn && (
        <ReflectionModal checkIn={reflectingOn} onClose={() => setReflectingOn(null)} onSaved={() => setCheckIns(todaysCheckIns())} />
      )}
    </div>
  );
}
