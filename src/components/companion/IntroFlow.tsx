import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { LichtCompanion } from './LichtCompanion';
import { getAnyLichtwesen } from './customLichtwesen';
import { LICHTWESEN } from './lichtwesen';
import { useSettings } from '../../state/SettingsContext';
import { Button } from '../ui/Button';
import { useT } from '../../i18n';

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
  const otherBeings = LICHTWESEN.filter((b) => b.id !== being.id).slice(0, 3);
  const [step, setStep] = useState(0);
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

  function next() {
    if (isLast) {
      // Slides are done — hand off to the real, navigating app tour
      // overlay (rendered by AppShell once tourActive is set), landing on
      // Home first. The actual first check-in happens once the tour
      // finishes or is closed (see AppShell).
      updateSettings({ introSeen: true, tourActive: true });
      navigate('/');
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

  return (
    <div className="min-h-screen flex flex-col px-6 pt-10 pb-10 animate-in">
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
          <div className="relative flex items-center justify-center" style={{ width: 220, height: 160 }}>
            {otherBeings.map((b, i) => {
              const positions = [
                { left: '2%', top: '38%' },
                { left: '78%', top: '10%' },
                { left: '80%', top: '58%' },
              ];
              const pos = positions[i] ?? positions[0];
              return (
                <div key={b.id} className="absolute flex flex-col items-center opacity-40" style={pos}>
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
