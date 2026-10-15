import { NurJetztHome } from '../nurJetzt/NurJetztHome';
import { useEffect, useState, type ReactNode } from 'react';
import { TodaySoFar } from './TodaySoFar';
import { ImportantContactsStrip } from './ImportantContactsStrip';
import { ResourceNudgeCard } from './ResourceNudgeCard';
import { createPortal } from 'react-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Link } from 'react-router-dom';
import { GroundingOverlay } from '../../components/companion/GroundingOverlay';
import { IntentPickerModal } from './IntentPickerModal';
import { Settings2, X, Info, LifeBuoy, HeartHandshake, Mail, Compass, Pill, CalendarDays, Package } from 'lucide-react';
import { dueUnopenedLetters, markLetterOpened, pendingLetterStore } from '../briefAnMich/lettersRepo';
import type { LetterToSelf } from '../briefAnMich/lettersRepo';
import { LetterEnvelope } from '../briefAnMich/LetterEnvelope';
import { CompanionDock } from '../../components/companion/CompanionDock';
import { AboutVonMirAusModal } from '../../components/shared/AboutVonMirAusModal';
import { ABOUT_VON_MIR_AUS_TEXT } from '../../content/aboutContent';
import { AchievementSection } from './AchievementSection';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { downloadBackup } from '../../services/backup';
import { backupReminderDue, snoozeBackupReminder } from '../../services/testSupport';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { useSettings } from '../../state/SettingsContext';
import { weatherRepo } from '../innerWeather/weatherRepo';
import { getDueCustomReminders, dismissCustomReminder, type CustomReminder } from '../../services/customReminders';
import { useCompanionSay } from '../../state/CompanionSpeechContext';
import { TEST_PHASE } from '../../services/testSupport';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { getHomeContext, getBestEffortWeather } from './homeContext';
import { pickHomeContextLine, pickCustomHomeLine } from './homeCompanionLines';
import { WeatherExplainerModal } from '../innerWeather/WeatherExplainerModal';
import { SkyAmbiance } from '../../components/shared/SkyAmbiance';
import { PostfachButton, PostfachPanel, type LiveEntry } from './PostfachPanel';
import { useMailbox, markMailRead } from '../../services/mailbox';
import { FollowUpBody, isFollowUpMail } from '../calendar/FollowUpBody';
import { ReviewMailBody, isReviewMail } from '../reviews/ReviewMailBody';

function hasCheckedInToday(): boolean {
  const today = new Date().toDateString();
  return weatherRepo.getAll().some((c) => new Date(c.createdAt).toDateString() === today);
}

function reminderIsDue(times: string[] | undefined): boolean {
  if (!times || times.length === 0) return false;
  const now = new Date();
  return times.some((time) => {
    const [h, m] = time.split(':').map(Number);
    const target = new Date();
    target.setHours(h, m, 0, 0);
    return now >= target;
  });
}

/** "Erinnerung immer an, mehrere Uhrzeiten"-Auftrag — reads the new
 * array field, falling back to the old single-time field for anyone
 * who saved a reminder time before this change, and finally to a
 * sensible 09:00 default so the reminder is genuinely always on
 * rather than needing an explicit opt-in. */
function reminderTimesFor(settings: { weatherReminderTimes?: string[]; weatherReminderTime?: string }): string[] {
  if (settings.weatherReminderTimes && settings.weatherReminderTimes.length > 0) return settings.weatherReminderTimes;
  if (settings.weatherReminderTime) return [settings.weatherReminderTime];
  return ['09:00'];
}

const testerThanksSaid = createKeyValueStore<boolean>('tester-thanks-said', false);

export function HomePage() {
  const t = useT();
  const say = useCompanionSay();
  const { settings, updateSettings } = useSettings();
  const [reminderDismissed, setReminderDismissed] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showWeatherExplainer, setShowWeatherExplainer] = useState(false);
  const [showNurJetztExplainer, setShowNurJetztExplainer] = useState(false);
  useRegisterModalOpen(showNurJetztExplainer);
  const [showIntentPicker, setShowIntentPicker] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const [openLetter, setOpenLetter] = useState<LetterToSelf | null>(null);
  const [postfachOpen, setPostfachOpen] = useState(false);
  const { unread: unreadMail, prominent: prominentMail } = useMailbox();
  const dueLetters = dueUnopenedLetters();
  const pendingToken = pendingLetterStore.get();
  const isEn = settings.language === 'en';
  const [backupDue, setBackupDue] = useState(() => backupReminderDue());
  const [dueCustomReminders, setDueCustomReminders] = useState<CustomReminder[]>(() => getDueCustomReminders());

  // Test phase: the companion thanks the testers once (after the intro/tour, never in the middle of it).
  useEffect(() => {
    if (!TEST_PHASE || !settings.introSeen || settings.tourActive || testerThanksSaid.get()) return;
    const timer = window.setTimeout(() => {
      testerThanksSaid.set(true);
      say(
        settings.language === 'en'
          ? 'Thank you for testing “von mir aus”. If something stands out, you can report it any time: Settings → Test version → “Report something”.'
          : 'Danke, dass du „von mir aus“ testest. Wenn dir etwas auffällt, kannst du es jederzeit melden: Einstellungen → Test-Version → „Etwas melden“.',
      );
    }, 3500);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.introSeen, settings.tourActive]);

  // Contextual companion aside: time-of-day / weekend / (best-effort,
  // permission-gated) weather. Only ~45% of Home visits so it stays a
  // pleasant surprise rather than a fixed greeting that gets stale fast.
  useEffect(() => {
    // the person's own Home sentences get their own chance first
    const own = pickCustomHomeLine();
    if (own) {
      say(own);
      return;
    }
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
    !reminderDismissed &&
    reminderIsDue(reminderTimesFor(settings)) &&
    !hasCheckedInToday();

  // "Wesen soll auf Erinnerung/Brief hinweisen"-Auftrag — a separate,
  // one-shot effect (not folded into the greeting effect above, which
  // already has its own 55% random skip and shouldn't compete for the
  // same speech-bubble slot) that points the companion's own voice at
  // whichever of these is showing, once per page load. Deliberately
  // simple priority: a letter feels the most personally significant if
  // several are due at once, then the daily reminder, then a custom one.
  useEffect(() => {
    if (dueLetters.length > 0) {
      say(t.home.pointOutLetter);
    } else if (showReminder) {
      say(t.home.pointOutReminder);
    } else if (dueCustomReminders.length > 0) {
      say(t.home.pointOutCustomReminder.replace('{label}', dueCustomReminders[0].label));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const hour = new Date().getHours();
  const greeting = t.home.hourlyGreetings[hour] ?? t.home.subtitle;

  // Live entries for the Postfach panel: the same due letter / daily
  // reminder / custom reminders that also show as cards below.
  const liveEntries: LiveEntry[] = [
    ...(!settings.nurJetztMode && dueLetters.length > 0
      ? [{ key: 'letter', kind: 'letter' as const, title: t.postfach.letterTitle, text: dueLetters[0].fromName ? t.briefAnMich.arrivedFromBanner.replace('{name}', dueLetters[0].fromName) : t.briefAnMich.arrivedBanner, actionLabel: t.briefAnMich.tapToOpen, onAction: () => setOpenLetter(dueLetters[0]) }]
      : []),
    ...(showReminder
      ? [{ key: 'checkin', kind: 'checkin' as const, title: t.postfach.checkInTitle, text: t.home.reminderBanner, actionLabel: t.home.checkInCta, actionTo: '/inneres-wetter', onDismiss: () => setReminderDismissed(true) }]
      : []),
    ...dueCustomReminders.map((r) => ({
      key: `custom-${r.id}`,
      kind: 'reminder' as const,
      title: t.postfach.reminderTitle,
      text: r.label,
      onDismiss: () => {
        dismissCustomReminder(r.id);
        setDueCustomReminders((prev) => prev.filter((x) => x.id !== r.id));
      },
    })),
  ];
  const postfachCount = liveEntries.length + unreadMail.length;

  // "Nur jetzt": the whole start page shrinks to a few large doors
  if (settings.nurJetztMode) return <NurJetztHome />;

  // One calm notice at a time (the rest waits in the Postfach) — a start page that shows
  // five pulsing cards at once overwhelms exactly the people it is for.
  const notices: { key: string; node: ReactNode }[] = [];
  if (dueLetters.length > 0) {
    notices.push({
      key: 'letter',
      node: (
        <Card padding="md" className="flex items-center gap-3 animate-in pulse-glow" style={{ borderColor: 'var(--color-accent-clay)', borderWidth: 1.5 }} data-testid="due-letter">
          <Mail size={20} className="text-[var(--color-accent-clay)] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text)]">{dueLetters[0].fromName ? t.briefAnMich.arrivedFromBanner.replace('{name}', dueLetters[0].fromName) : t.briefAnMich.arrivedBanner}</p>
          </div>
          <button onClick={() => setOpenLetter(dueLetters[0])} className="text-[13px] text-[var(--color-primary)] flex-shrink-0">
            {t.briefAnMich.tapToOpen}
          </button>
        </Card>
      ),
    });
  }
  if (pendingToken) {
    notices.push({
      key: 'pending',
      node: (
        <Card padding="md" className="flex items-center gap-3 animate-in" data-testid="pending-letter" style={{ borderColor: 'var(--color-primary)', borderWidth: 1.5 }}>
          <Mail size={20} className="text-[var(--color-primary)] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text)]">{t.briefAnMich.pendingLetterTitle}</p>
          </div>
          <Link to={`/brief/importieren?d=${pendingToken}`} className="text-[13px] text-[var(--color-primary)] flex-shrink-0">
            {t.briefAnMich.pendingLetterCta}
          </Link>
        </Card>
      ),
    });
  }
  prominentMail.forEach((m) =>
    notices.push({
      key: `mail-${m.id}`,
      node: (
        <Card padding="md" className="flex items-start gap-3 animate-in pulse-glow" style={{ borderColor: 'var(--color-accent-clay)', borderWidth: 1.5 }}>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-[var(--color-text)] mb-0.5">{m.title}</p>
            {m.text && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed whitespace-pre-line">{m.text}</p>}
            {isFollowUpMail(m) && <FollowUpBody mail={m} />}
            {isReviewMail(m) && <ReviewMailBody mail={m} />}
            {m.actionKind === 'reload' && m.actionLabel && (
              <button onClick={() => window.location.reload()} className="text-[13px] text-[var(--color-primary)] mt-1.5">
                {m.actionLabel} →
              </button>
            )}
            {m.actionKind === 'link' && m.actionTo && m.actionLabel && (
              <Link to={m.actionTo} onClick={() => markMailRead(m.id)} className="text-[13px] text-[var(--color-primary)] inline-block mt-1.5">
                {m.actionLabel} →
              </Link>
            )}
          </div>
          <button onClick={() => markMailRead(m.id)} data-sound="close" aria-label={t.postfach.markRead} className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] flex-shrink-0">
            <X size={16} />
          </button>
        </Card>
      ),
    }),
  );
  dueCustomReminders.forEach((r) =>
    notices.push({
      key: `custom-${r.id}`,
      node: (
        <Card padding="md" className="flex items-start gap-3 animate-in pulse-glow" style={{ borderColor: 'var(--color-accent-clay)', borderWidth: 1.5 }}>
          <div className="flex-1">
            <p className="text-[13px] text-[var(--color-text)]">{r.label}</p>
          </div>
          <button
            onClick={() => {
              dismissCustomReminder(r.id);
              setDueCustomReminders((prev) => prev.filter((x) => x.id !== r.id));
            }}
            aria-label={t.home.reminderDismiss}
            className="p-1 text-[var(--color-text-faint)] hover:text-[var(--color-text)] flex-shrink-0"
          >
            <X size={16} />
          </button>
        </Card>
      ),
    }),
  );
  if (backupDue) {
    notices.push({
      key: 'backup',
      node: (
        <Card padding="md" className="animate-in" data-testid="backup-reminder">
          <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed">{isEn ? 'Would you like to make a backup? Everything you entered lives only on this device – a copy keeps it safe if the phone or browser is reset.' : 'Magst du eine Sicherung machen? Alles, was du eingetragen hast, liegt nur auf diesem Gerät – eine Kopie hält es sicher, falls Handy oder Browser mal zurückgesetzt werden.'}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={() => { downloadBackup(); setBackupDue(false); }} data-testid="backup-reminder-do">{isEn ? 'Create backup' : 'Sicherung erstellen'}</Button>
            <Button size="sm" variant="ghost" onClick={() => { snoozeBackupReminder(7); setBackupDue(false); }} data-testid="backup-reminder-later">{isEn ? 'Later' : 'Später'}</Button>
          </div>
        </Card>
      ),
    });
  }
  // letters first, then the rare backup reminder, then everything else
  const rank = (k: string) => (k === 'letter' ? 0 : k === 'pending' ? 1 : k === 'backup' ? 2 : 3);
  const shownNotices = settings.tourActive ? [] : [...notices].sort((x, y) => rank(x.key) - rank(y.key));

  const chip = 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-[var(--radius-lg)] text-[13px] text-[var(--color-text-muted)] border border-[var(--color-border)]';

  return (
    <div className="px-5 pt-8 pb-6 animate-in relative" data-testid="home-page">
      <SkyAmbiance />
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[15px] text-[var(--color-text-muted)]">{greeting}</p>
          <h1 className="text-[26px] mt-1 text-[var(--color-text)]" onClick={() => setAboutOpen(true)} role="button" tabIndex={0}>
            {t.common.appName}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <PostfachButton count={postfachCount} open={postfachOpen} onToggle={() => setPostfachOpen((v) => !v)} />
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

      {/* always within reach, small and calm */}
      <Link to="/krisenmodus" className={`${chip} mb-4`}>
        <LifeBuoy size={15} />
        {t.crisisMode.homeCta}
      </Link>

      {postfachOpen && <PostfachPanel live={liveEntries} />}

      {/* at most one notice at a time; the rest waits in the Postfach */}
      {!postfachOpen && shownNotices.length > 0 && (
        <div className="mb-5" data-testid="home-notices">
          <div key={shownNotices[0].key}>{shownNotices[0].node}</div>
          {shownNotices.length > 1 && (
            <button type="button" onClick={() => setPostfachOpen(true)} className="block mx-auto mt-2 text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2" data-testid="home-more-notices">
              {isEn ? `${shownNotices.length - 1} more in the Postfach` : `${shownNotices.length - 1} weitere im Postfach`}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col items-center mb-5">
        <CompanionDock variant="hero" />
        <p className="text-[14px] text-[var(--color-text-muted)] mt-3">{t.companion.greetingHello}</p>
      </div>

      {/* Check-In: the single clear "start here" */}
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

      <p className="text-[11px] text-[var(--color-text-faint)] text-center mb-2">{t.home.forkOrLabel}</p>
      <div className="flex gap-2 mb-2">
        <Link to="/zugang" className="flex-1">
          <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-0.5">
            <span className="text-[16px]">🔎</span>
            <p className="text-[12px] text-[var(--color-text)]">{t.home.forkUnderstandTitle}</p>
            <p className="text-[10.5px] text-[var(--color-text-faint)] leading-snug">({t.home.forkUnderstandTag})</p>
          </Card>
        </Link>
        <Link to="/bruecken" className="flex-1">
          <Card interactive padding="md" className="text-center h-full flex flex-col items-center justify-center gap-0.5">
            <span className="text-[16px]">👣</span>
            <p className="text-[12px] text-[var(--color-text)]">{t.home.forkActTitle}</p>
            <p className="text-[10.5px] text-[var(--color-text-faint)] leading-snug">({t.home.forkActTag})</p>
          </Card>
        </Link>
      </div>
      <button onClick={() => setShowIntentPicker(true)} className="text-[12.5px] text-[var(--color-primary)] mt-3 mb-6 block mx-auto">
        {t.home.intentPickerEntryCta}
      </button>

      <ResourceNudgeCard />

      <ImportantContactsStrip />

      <TodaySoFar />

      {/* everyday helpers, together in one calm place */}
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{isEn ? 'Everyday' : 'Alltag'}</p>
      <div className="grid grid-cols-2 gap-2 mb-6" data-testid="home-everyday">
        <Link to="/kalender" className={chip}>
          <CalendarDays size={15} />
          {t.calendar.title}
        </Link>
        <Link to="/parkbox" className={chip} data-testid="home-parkbox">
          <Package size={15} />
          {isEn ? 'Parking box' : 'Parkbox'}
        </Link>
        <Link to="/entdecken/medi-log" className={chip}>
          <Pill size={15} />
          {t.home.mediLogCta}
        </Link>
        <Link to="/helfermodus" className={chip}>
          <HeartHandshake size={15} />
          {t.helperMode.homeCta}
        </Link>
      </div>

      <AchievementSection />

      <button
        onClick={() => setShowNurJetztExplainer(true)}
        className="flex items-center justify-center gap-2 mx-auto mt-4 text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2"
        data-testid="nurjetzt-entry"
      >
        <Compass size={13} className="flex-shrink-0" />
        {t.home.nurJetztEntryCta}
      </button>

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

      {aboutOpen && <AboutVonMirAusModal text={ABOUT_VON_MIR_AUS_TEXT} onClose={() => setAboutOpen(false)} />}
    </div>
  );
}
