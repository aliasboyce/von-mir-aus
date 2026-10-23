import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LichtCompanion } from './LichtCompanion';
import { animalAsBeing, getAnyLichtwesen } from './customLichtwesen';
import { LICHTWESEN } from './lichtwesen';
import { useSettings } from '../../state/SettingsContext';
import { Button } from '../ui/Button';
import { useT } from '../../i18n';
import { tourExtrasModeStore, tourIndexStore, tourStyleStore } from './tourData';
import { ScopePicker } from '../../features/scope/ScopePicker';
import { Eye, Hand } from 'lucide-react';
import { InstallGuide } from '../shared/InstallGuide';
import { TesterThanks } from '../shared/TesterThanks';
import { isStandalone } from '../../services/testSupport';
import { StartGuideContent, START_GUIDE_TEXT } from '../shared/StartGuide';

interface IntroSlide {
  text: string;
  /** "Wesen-Name in eigener Schriftart"-Auftrag — only set on slide 0,
   * where {name} in the raw string gets split out instead of just
   * substituted in-place, so the companion's own name can render in
   * the same distinct font used for it everywhere else in the app
   * (CompanionDock's name label, etc.) rather than blending into the
   * surrounding sentence. */
  namePart?: string;
}

export function IntroFlow() {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const t = useT();
  const being = getAnyLichtwesen(settings.selectedBrainId);
  // "es gibt noch mehr Begleiter": a few light beings AND animals wait faintly in the background
  const otherBeings = [
    ...LICHTWESEN.filter((b) => b.id !== being.id).slice(0, 2),
    ...[animalAsBeing('hund', 'braun', { grown: true }), animalAsBeing('glueckskatze', 'calico', { grown: true }), animalAsBeing('eule', 'kauz', { grown: true }), animalAsBeing('papagei', 'rot', { grown: true })].filter(
      (b): b is NonNullable<typeof b> => !!b && b.id !== being.id,
    ),
  ];
  const [step, setStep] = useState(0);
  const [guideStep, setGuideStep] = useState(false);
  const [installStep, setInstallStep] = useState(false);
  const [scopeStep, setScopeStep] = useState(false);
  const [tourStep, setTourStep] = useState(false);
  const [joyBurst, setJoyBurst] = useState<'hop' | 'spin' | 'wobble' | 'dance' | null>(null);

  const slides: IntroSlide[] = t.companion.introSlides.map((text, i) => {
    // "Wiederholt ich bin Verlaesslich"-Auftrag — FirstNameStep already
    // showed "Hallo, ich bin {companion}" once, right before this flow
    // starts, whenever a person just entered their own name there. This
    // first slide used to say the exact same "Hallo, ich bin ..." line
    // again immediately after — replaced with a personalized "Hallo
    // {userName}!" instead in that case, since the companion intro was
    // already just said a moment ago and doesn't need repeating.
    if (i === 0 && settings.userName) {
      return { text: t.companion.helloAfterName.replace('{name}', settings.userName) };
    }
    return {
      text: i === 0 ? text.replace('{name}', '\u0000') : text,
      namePart: i === 0 ? being.name : undefined,
    };
  });

  const isLast = step === slides.length - 1;

  function startTour(style: 'interactive' | 'watch' = 'interactive') {
    tourStyleStore.set(style);
    tourIndexStore.set(0);
    tourExtrasModeStore.set(null);
    updateSettings({ introSeen: true, tourActive: true });
    navigate('/');
  }

  function next() {
    if (isLast) {
      // right after meeting the companion: a short orientation how to start (the app needs individualising), then the install step
      setGuideStep(true);
      return;
      // Slides are done — hand off to the real, navigating app tour
      // overlay (rendered by AppShell once tourActive is set), landing on
      // Home first. The actual first check-in happens once the tour
      // finishes or is closed (see AppShell).
      startTour();
      return;
    }
    setStep((s) => s + 1);
    // A gentle, occasional reaction on advancing — not every single click,
    // "mehr Lebendigkeit, nicht mehr Reizüberflutung": roughly one in
    // three clicks gets a tiny burst, using the same joy animations as
    // elsewhere in the app rather than inventing a new one just for this.
    if (!settings.reduceMotion && Math.random() < 0.35) {
      const variants: Array<'hop' | 'spin' | 'wobble' | 'dance'> = ['hop', 'spin', 'wobble', 'dance'];
      const variant = variants[Math.floor(Math.random() * variants.length)];
      setJoyBurst(variant);
      setTimeout(() => setJoyBurst(null), 700);
    }
  }

  function skip() {
    updateSettings({ introSeen: true });
  }

  function afterGuide() {
    setGuideStep(false);
    // how to put the app on the home screen (skipped if it already is installed)
    if (!isStandalone()) setInstallStep(true);
    else setScopeStep(true);
  }

  if (guideStep) {
    const G = START_GUIDE_TEXT[settings.language === 'en' ? 'en' : 'de'];
    return (
      <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in" data-testid="start-guide-step">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setGuideStep(false)} aria-label={t.common.back} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
            <ChevronLeft size={20} />
          </button>
          <span />
        </div>
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <LichtCompanion size="small" />
          <h1 className="text-[22px] leading-tight">{G.title}</h1>
          <p className="text-[13px] text-[var(--color-text-faint)] leading-relaxed max-w-[320px]">{G.sub}</p>
        </div>
        <div className="flex-1">
          <StartGuideContent />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={afterGuide} data-testid="start-guide-continue">{G.close}</Button>
        </div>
      </div>
    );
  }

  if (scopeStep && !tourStep) {
    const en = settings.language === 'en';
    return (
      <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in" data-testid="scope-step">
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <LichtCompanion size="small" />
          <h1 className="text-[22px] leading-tight">{en ? 'How much of the app do you want to see?' : 'Wie viel von der App möchtest du sehen?'}</h1>
          <p className="text-[13px] text-[var(--color-text-faint)] leading-relaxed max-w-[320px]">
            {en ? 'You can change this any time in the settings. Nothing is lost.' : 'Das kannst du jederzeit in den Einstellungen ändern. Es geht nichts verloren.'}
          </p>
        </div>
        <div className="flex-1">
          <ScopePicker
            simple={!!settings.simple}
            onChange={(sc) => updateSettings({ scope: sc, scopeChosen: true })}
            onSimple={(v) => updateSettings({ simple: v, scopeChosen: true })}
          />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={() => { updateSettings({ scopeChosen: true }); setTourStep(true); }} data-testid="scope-continue">
            {en ? 'Continue' : 'Weiter'}
          </Button>
        </div>
      </div>
    );
  }

  if (tourStep) {
    const en = settings.language === 'en';
    const Opt = ({ icon, title, sub, onClick, id }: { icon: React.ReactNode; title: string; sub: string; onClick: () => void; id: string }) => (
      <button type="button" onClick={onClick} data-testid={id} className="w-full text-left rounded-[var(--radius-md)] px-4 py-3.5 flex items-start gap-3 border-2 border-[var(--color-border)] bg-[var(--color-surface)]">
        <span className="mt-0.5 text-[var(--color-primary)]">{icon}</span>
        <span>
          <span className="block text-[15px] text-[var(--color-text)]">{title}</span>
          <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug">{sub}</span>
        </span>
      </button>
    );
    return (
      <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in" data-testid="tour-choice-step">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => setTourStep(false)} aria-label={t.common.back} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
            <ChevronLeft size={20} />
          </button>
          <span />
        </div>
        <div className="flex flex-col items-center text-center gap-3 mb-6">
          <LichtCompanion size="small" />
          <h1 className="text-[22px] leading-tight">{en ? 'Do you want a tour?' : 'Möchtest du einen Rundgang?'}</h1>
          <p className="text-[13px] text-[var(--color-text-faint)] leading-relaxed max-w-[320px]">
            {en ? 'You choose how. Either way you can stop at any time.' : 'Du entscheidest, wie. Du kannst jederzeit aufhören.'}
          </p>
        </div>
        <div className="flex flex-col gap-3 flex-1">
          <Opt id="tour-choice-watch" icon={<Eye size={20} />} title={en ? 'Just watch' : 'Nur zuschauen'} sub={en ? 'Press play. The app goes through its functions on its own and shows them. You do not have to do anything.' : 'Auf Play drücken. Die App geht die Funktionen von allein durch und zeigt sie. Du musst nichts tun.'} onClick={() => startTour('watch')} />
          <Opt id="tour-choice-interactive" icon={<Hand size={20} />} title={en ? 'Try it out myself' : 'Selbst ausprobieren'} sub={en ? 'Step by step, with small tasks you do yourself.' : 'Schritt für Schritt, mit kleinen Aufgaben, die du selbst machst.'} onClick={() => startTour('interactive')} />
        </div>
        <button type="button" onClick={() => { updateSettings({ introSeen: true }); navigate('/'); }} className="mt-6 text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 py-1 self-center" data-testid="tour-choice-skip">
          {en ? 'No tour, take me to the app' : 'Kein Rundgang, direkt zur App'}
        </button>
      </div>
    );
  }

  if (installStep) {
    const en = settings.language === 'en';
    return (
      <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in" data-testid="install-step">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => { setInstallStep(false); setGuideStep(true); }} aria-label={t.common.back} className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
            <ChevronLeft size={20} />
          </button>
          <span />
        </div>
        <div className="flex flex-col items-center text-center gap-3 mb-5">
          <LichtCompanion size="small" />
          <h1 className="text-[22px] leading-tight">{en ? 'One thing before we start: put the app on your home screen' : 'Eins vor dem Start: Hol dir die App auf den Startbildschirm'}</h1>
          <p className="text-[13px] text-[var(--color-text-faint)] leading-relaxed max-w-[320px]">
            {en ? 'Best right now, while nothing is entered yet: on an iPhone the installed app is its own space, so you start fresh there.' : 'Am besten jetzt, wo noch nichts eingetragen ist: Auf dem iPhone ist die installierte App ein eigener Speicher – du startest dort noch einmal von vorn.'}
          </p>
        </div>
        <div className="mb-5">
          <TesterThanks showWhere />
        </div>
        <div className="flex-1">
          <InstallGuide />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <Button fullWidth onClick={() => { setInstallStep(false); setScopeStep(true); }} data-testid="install-continue">
            {en ? 'Done – show me the app' : 'Erledigt – zeig mir die App'}
          </Button>
          <button type="button" onClick={() => { setInstallStep(false); setScopeStep(true); }} className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 py-1" data-testid="install-later">
            {en ? 'Later (you find this under Settings → Test version)' : 'Später (du findest das unter Einstellungen → Test-Version)'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in" style={{ overflowX: 'clip' }}>
      <div className="flex items-center justify-between mb-8">
        {step > 0 ? (
          <button
            onClick={() => setStep((s) => s - 1)}
            aria-label={t.common.back}
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]"
          >
            <ChevronLeft size={20} />
          </button>
        ) : (
          <span />
        )}
        <button onClick={skip} className="text-[13px] text-[var(--color-text-faint)]">
          {t.common.skip}
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center text-center gap-6">
        {step === 0 ? (
          <div className="relative flex items-center justify-center" style={{ width: 320, height: 200 }} data-testid="intro-others">
            {otherBeings.map((b, i) => {
              const positions = [
                { left: '0%', top: '0%' },
                { left: '80%', top: '0%' },
                { left: '-2%', top: '40%' },
                { left: '82%', top: '40%' },
                { left: '12%', top: '66%' },
                { left: '68%', top: '66%' },
              ];
              const pos = positions[i];
              if (!pos) return null;
              return (
                <div key={b.id} className="absolute flex flex-col items-center opacity-40" style={{ ...pos, transform: `scale(${b.animal ? 0.6 : 0.78})`, transformOrigin: 'top center' }}>
                  <LichtCompanion size="small" beingOverride={b} />
                  <span className="text-[10px] mt-0.5" style={{ color: b.color, fontFamily: 'var(--font-companion)' }}>
                    {b.name}
                  </span>
                </div>
              );
            })}
            <LichtCompanion size="large" joyBurst={joyBurst} />
          </div>
        ) : (
          <LichtCompanion size="large" joyBurst={joyBurst} />
        )}
        <p key={step} className="text-[16px] text-[var(--color-text)] w-full max-w-[300px] mx-auto leading-relaxed animate-in">
          {slides[step].namePart
            ? slides[step].text.split('\u0000').map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && (
                    <span style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>{slides[step].namePart}</span>
                  )}
                </span>
              ))
            : slides[step].text}
        </p>
        {step === 0 && (
          <p className="text-[12px] text-[var(--color-text-faint)] w-full max-w-[280px] mx-auto leading-relaxed -mt-3">
            {t.companion.introOtherBeingsNote}
          </p>
        )}
      </div>

      <div className="flex items-center justify-center gap-1.5 mb-6">
        {slides.map((_, i) => (
          <span
            key={i}
            className="rounded-full transition-all"
            style={{
              width: i === step ? 18 : 6,
              height: 6,
              background: i === step ? 'var(--color-primary)' : 'var(--color-border-strong)',
            }}
          />
        ))}
      </div>

      <Button fullWidth onClick={next}>
        {isLast ? t.companion.showMeTheApp : t.companion.pickerContinue}
      </Button>
    </div>
  );
}
