import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Link } from 'react-router-dom';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { IntentPickerModal } from './IntentPickerModal';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { Settings2, X, Info, LifeBuoy, HeartHandshake, Mail, Compass, Pill } from 'lucide-react';
import { dueUnopenedLetters, markLetterOpened } from '../briefAnMich/lettersRepo';
import type { LetterToSelf } from '../briefAnMich/lettersRepo';
import { LetterEnvelope } from '../briefAnMich/LetterEnvelope';
import { CompanionDock } from '../../components/companion/CompanionDock';
import { ContinueSection } from './ContinueSection';
import { AchievementSection } from './AchievementSection';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useSettings } from '../../state/SettingsContext';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { BRIDGE_CATEGORY_META } from '../bridges/bridgeMeta';
import { polyvagalRepo } from '../polyvagal/polyvagalRepo';
import { tensionRepo } from '../polyvagal/tensionRepo';
import { describeTensionDay } from '../polyvagal/describeTensionDay';
import { describeDay } from '../polyvagal/describeDay';
import { diaryRepo } from '../diary/diaryRepo';
import { createId } from '../../services/storage/repository';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { getHomeContext, getBestEffortWeather } from './homeContext';
import { pickHomeContextLine } from './homeCompanionLines';
import { WeatherExplainerModal } from '../innerWeather/WeatherExplainerModal';

function hasCheckedInToday(): boolean {
  const today = new Date().toDateString();
  return weatherRepo.getAll().some((c) => new Date(c.createdAt).toDateString() === today);
}

function reminderIsDue(time: string | undefined): boolean {
  if (!time) return false;
  const [h, m] = time.split(':').map(Number);
  const now = new Date();
  const target = new Date();
  target.setHours(h, m, 0, 0);
  return now >= target;
}

function dateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function HomePage() {
  const t = useT();
  const say = useCompanionSay();
  const { settings, updateSettings } = useSettings();
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [showWeatherExplainer, setShowWeatherExplainer] = useState(false);
  const [showNurJetztExplainer, setShowNurJetztExplainer] = useState(false);
  useRegisterModalOpen(showNurJetztExplainer);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [openLetter, setOpenLetter] = useState<LetterToSelf | null>(null);
  const dueLetters = dueUnopenedLetters();

  // Auto-add yesterday's day-curve summary to the diary once per day, if
  // the person opted in — runs at most once per calendar day.
  useEffect(() => {
    if (!settings.autoAddCurveToDiary) return;
    const today = dateKey(new Date());
    if (settings.lastAutoCurveDiaryDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dateKey(yesterday);
    const yesterdayCheckIns = polyvagalRepo
      .getAll()
      .filter((c) => c.createdAt.slice(0, 10) === yKey);

    if (yesterdayCheckIns.length > 0) {
      const now = new Date().toISOString();
      diaryRepo.save({
        id: createId('diary'),
        createdAt: now,
        updatedAt: now,
        content: `${t.polyvagal.todayChart}\n${describeDay(yesterdayCheckIns, t)}`,
        polyvagalSnapshot: yesterdayCheckIns.map((c) => ({ zone: c.zone, createdAt: c.createdAt })),
      });
    }
    updateSettings({ lastAutoCurveDiaryDate: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoAddCurveToDiary]);

  // Same mechanism, entirely independent setting — the personal tension
  // curve and the polyvagal day curve are separate records, so a person
  // can opt each into the diary independently.
  useEffect(() => {
    if (!settings.autoAddTensionToDiary) return;
    const today = dateKey(new Date());
    if (settings.lastAutoTensionDiaryDate === today) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yKey = dateKey(yesterday);
    const yesterdayTension = tensionRepo.getAll().filter((e) => e.createdAt.slice(0, 10) === yKey);

    if (yesterdayTension.length > 0) {
      const now = new Date().toISOString();
      diaryRepo.save({
        id: createId('diary'),
        createdAt: now,
        updatedAt: now,
        content: `${t.tension.title}\n${describeTensionDay(yesterdayTension, t)}`,
      });
    }
    updateSettings({ lastAutoTensionDiaryDate: today });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.autoAddTensionToDiary]);

  // Contextual companion aside: time-of-day / weekend / (best-effort,
  // permission-gated) weather. Only ~45% of Home visits so it stays a
  // pleasant surprise rather than a fixed greeting that gets stale fast.
  useEffect(() => {
    if (Math.random() > 0.45) return;
    let cancelled = false;
    getBestEffortWeather().then(() => {
      if (cancelled) return;
      const ctx = getHomeContext();
      say(pickHomeContextLine(ctx.timeOfDay, ctx.isWeekend, ctx.weather, settings.userName));
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showReminder =
    settings.remindersEnabled &&
    !reminderDismissed &&
    reminderIsDue(settings.weatherReminderTime) &&
    !hasCheckedInToday();

  const favoriteBridge = useMemo(() => bridgesRepo.getAll().find((b) => b.favorite), []);

  const hour = new Date().getHours();
  const greeting = t.home.hourlyGreetings[hour] ?? t.home.subtitle;

  return (
    <div className="px-5 pt-8 pb-6 animate-in">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[15px] text-[var(--color-text-muted)]">{greeting}</p>
          <h1 className="text-[26px] mt-1 text-[var(--color-text)]">{t.common.appName}</h1>
        </div>
        <div className="flex items-center gap-1">
          <HelpButton helpKey="home" />
          <Link
            to="/einstellungen"
            aria-label={t.settings.title}
            className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <Settings2 size={20} />
          </Link>
        </div>
      </div>

      <p className="text-[15px] text-[var(--color-text-muted)] mb-5 max-w-[280px]">
        {t.home.subtitle}
      </p>

      {/* Punkt 1 — klein und ruhig gehalten, aber jederzeit ohne Suchen
       * erreichbar. Bewusst VOR dem Wesen/Check-In platziert: wer diese
       * beiden Wege braucht, sollte nicht erst an anderen Inhalten
       * vorbei muessen. */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          to="/krisenmodus"
          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-[13px] text-[var(--color-text-muted)] border border-[var(--color-border)]"
        >
          <LifeBuoy size={15} />
          {t.crisisMode.homeCta}
        </Link>
        <Link
          to="/helfermodus"
          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-[13px] text-[var(--color-text-muted)] border border-[var(--color-border)]"
        >
          <HeartHandshake size={15} />
          {t.helperMode.homeCta}
        </Link>
        <Link
          to="/entdecken/medi-log"
          className="flex-1 min-w-[100px] flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-[13px] text-[var(--color-text-muted)] border border-[var(--color-border)]"
        >
          <Pill size={15} />
          {t.home.mediLogCta}
        </Link>
      </div>

      {!settings.nurJetztMode && dueLetters.length > 0 && (
        <Card padding="md" className="mb-6 flex items-center gap-3 animate-in" style={{ borderColor: 'var(--color-accent-clay)', borderWidth: 1.5 }}>
          <Mail size={20} className="text-[var(--color-accent-clay)] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text)]">{t.briefAnMich.arrivedBanner}</p>
          </div>
          <button onClick={() => setOpenLetter(dueLetters[0])} className="text-[13px] text-[var(--color-primary)] flex-shrink-0">
            {t.briefAnMich.tapToOpen}
          </button>
        </Card>
      )}

      {showReminder && (
        <Card padding="md" className="mb-6 flex items-start gap-3 animate-in">
          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text)]">{t.home.reminderBanner}</p>
            <Link to="/inneres-wetter" className="text-[13px] text-[var(--color-primary)] inline-block mt-1.5">
              {t.home.checkInCta} →
            </Link>
          </div>
          <button
            onClick={() => setReminderDismissed(true)}
            aria-label={t.home.reminderDismiss}
            className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] flex-shrink-0"
          >
            <X size={16} />
          </button>
        </Card>
      )}

      {settings.nurJetztMode ? (
        <Card padding="none" className="mb-4 animate-in flex items-center justify-between gap-3 px-3.5 py-2.5" style={{ background: 'var(--color-primary-soft)', borderColor: 'var(--color-primary)', borderWidth: 1.5 }}>
          <p className="text-[12px] text-[var(--color-text)] leading-snug flex-1">{t.home.nurJetztActiveTitle}</p>
          <button
            onClick={() => updateSettings({ nurJetztMode: false })}
            className="text-[12px] text-[var(--color-primary)] font-medium flex-shrink-0"
          >
            {t.home.nurJetztExitCta}
          </button>
        </Card>
      ) : (
        <button
          onClick={() => setShowNurJetztExplainer(true)}
          className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-[var(--radius-lg)] text-[13px] text-[var(--color-text-muted)] border border-[var(--color-border)] mb-5"
        >
          <Compass size={15} className="flex-shrink-0" />
          {t.home.nurJetztEntryCta}
        </button>
      )}

      {showNurJetztExplainer && createPortal(
        <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={() => setShowNurJetztExplainer(false)}>
          <div
            className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[420px] p-5 overflow-y-auto"
            style={{ maxHeight: '85vh', paddingBottom: 'max(20px, env(safe-area-inset-bottom))' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-[18px] text-[var(--color-text)] mb-3">{t.home.nurJetztExplainerTitle}</p>
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.home.nurJetztExplainerText1}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-5">{t.home.nurJetztExplainerText2}</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  updateSettings({ nurJetztMode: true });
                  setShowNurJetztExplainer(false);
                }}
                className="flex-1 py-2.5 rounded-[var(--radius-md)] text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
              >
                {t.home.nurJetztStartCta}
              </button>
              <button onClick={() => setShowNurJetztExplainer(false)} className="px-4 py-2.5 text-[13px] text-[var(--color-text-faint)]">
                {t.common.cancel}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex flex-col items-center mb-6">
        <CompanionDock variant="hero" />
        <p className="text-[14px] text-[var(--color-text-muted)] mt-3">{t.companion.greetingHello}</p>
        <Link to="/einstellungen/wesen-info" className="text-[12px] text-[var(--color-primary)] mt-1.5">
          {t.companion.whatCanIDoLink}
        </Link>
      </div>

      {/* Check-In is now the single, unambiguous primary action right
       * after the companion — the brief's own feedback was that five
       * stacked entry points (fork x2, intent picker, check-in,
       * grounding) left no clear "start here" for someone new. Everything
       * else below is now visibly secondary to this one. */}
      <div className="relative mb-4">
        <Link to="/inneres-wetter" className="block">
          <Card
            interactive
            padding="lg"
            className={`text-center${!settings.reduceMotion ? ' checkin-pulse' : ''}`}
          >
            <p className="text-[20px] text-[var(--color-text)] text-center">{t.home.checkInCta}</p>
            {hasCheckedInToday() && (
              <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-1">{t.home.checkInDoneToday}</p>
            )}
          </Card>
        </Link>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowWeatherExplainer(true);
          }}
          aria-label={t.weather.explainerCta}
          className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-faint)] shadow-[var(--shadow-sm)]"
        >
          <Info size={13} />
        </button>
      </div>

      {/* "ChatGPT-Konzept" brief's fork, now visibly secondary (smaller
       * padding, smaller icon/text, framed as "oder") rather than
       * competing with the check-in for primary attention. */}
      {!settings.nurJetztMode && (
        <>
          <p className="text-[11px] text-[var(--color-text-faint)] text-center mb-2">{t.home.forkOrLabel}</p>
          <div className="flex gap-2 mb-2">
            <Link to="/zugang" className="flex-1">
              <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-0.5">
                <span className="text-[16px]">🔎</span>
                <p className="text-[12px] text-[var(--color-text)]">{t.home.forkUnderstandTitle}</p>
              </Card>
            </Link>
            <Link to="/bruecken" className="flex-1">
              <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-0.5">
                <span className="text-[16px]">👣</span>
                <p className="text-[12px] text-[var(--color-text)]">{t.home.forkActTitle}</p>
              </Card>
            </Link>
          </div>
          <button onClick={() => setShowIntentPicker(true)} className="text-[11px] text-[var(--color-primary)] mb-6 block mx-auto">
            {t.home.intentPickerEntryCta}
          </button>
        </>
      )}

      {settings.nurJetztMode && (
        <Link to="/zugang" className="block mb-6">
          <Card interactive padding="lg" className="text-center">
            <p className="text-[20px] text-[var(--color-text)] text-center">{t.zugang.navLabel}</p>
            <p className="text-[12px] text-[var(--color-text-faint)] text-center mt-1">{t.zugang.homeSubtitle}</p>
          </Card>
        </Link>
      )}

      {/* Priority 6 + 20/21 of the "Verbinden, glätten" brief — the
       * explicitly requested "Ich bin gerade nicht richtig da" shortcut.
       * Deliberately one tap straight to the same GroundingOverlay
       * Zugang and Krisenmodus already use, not a path through several
       * check-in questions first. */}
      <button
        onClick={() => setGroundingOpen(true)}
        className="flex items-center justify-center gap-2 w-full text-[13px] text-[var(--color-text-muted)] mb-6 -mt-3"
      >
        <Compass size={14} className="flex-shrink-0" />
        {t.home.notPresentShortcut}
      </button>

      <WeatherExplainerModal open={showWeatherExplainer} onClose={() => setShowWeatherExplainer(false)} />
      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
      {showIntentPicker && (
        <IntentPickerModal onClose={() => setShowIntentPicker(false)} onOpenGrounding={() => setGroundingOpen(true)} />
      )}
      {openLetter && (
        <LetterEnvelope
          letter={openLetter}
          alreadyOpen={false}
          onClose={() => setOpenLetter(null)}
          onOpened={() => {
            markLetterOpened(openLetter.id);
          }}
        />
      )}

      {!settings.nurJetztMode && (
        <>
          <AchievementSection />
          <ContinueSection />
        </>
      )}

      {!settings.nurJetztMode && favoriteBridge && (
        <Link to={`/bruecken/${favoriteBridge.id}`} className="block">
          <Card interactive className="flex items-center gap-4">
            <PhotoBackground src={favoriteBridge.image} className="w-14 h-14 rounded-[var(--radius-md)] bg-cover bg-center flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[12px] text-[var(--color-text-faint)]">{t.home.resumeBridge}</p>
              <p className="text-[15px] text-[var(--color-text)] truncate">{favoriteBridge.title}</p>
              <p className="text-[13px] text-[var(--color-text-muted)]">
                {BRIDGE_CATEGORY_META[favoriteBridge.category].label(t)}
              </p>
            </div>
          </Card>
        </Link>
      )}
    </div>
  );
}
