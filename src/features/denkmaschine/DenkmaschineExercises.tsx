import { useState } from 'react';
import { useT } from '../../i18n';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

/**
 * Section 10 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief —
 * two ACT exercises, researched rather than invented: both are drawn
 * from Dr. Sonia Jaeger's published overview of ACT techniques
 * (sonia-jaeger.com), which itself cites Russ Harris. The billboard
 * exercise directly matches the user's own "observe the thought on a
 * screen, at a distance" idea. Both are framed the same way the app
 * frames everything: observe → gain distance → don't fight it →
 * reclaim a small, real choice — not a standalone therapy module.
 */

/**
 * Section 10 of the "Verknüpfung, Inhalt & visuelle Ausbaustufe" brief,
 * expanded per the "Großer Qualitäts- und Erweiterungsprompt" Section
 * 12 — the billboard exercise now has a genuine multi-stage sequence
 * (thought appears → camera visibly pulls back, shrinking and fading
 * it → the person actively chooses what happens next) instead of a
 * single opacity fade behind a linear "weiter" button. Every choice at
 * the end is a real branch, not just progressing to the next screen —
 * matching the explicit "der Nutzer entscheidet selbst" requirement.
 * Drawn from Dr. Sonia Jaeger's published overview of ACT techniques
 * (sonia-jaeger.com), itself citing Russ Harris.
 */
type BillboardPhase = 'appear' | 'zooming' | 'observing';

export function DefusionBillboardExercise({ thought }: { thought: string }) {
  const t = useT();
  const [phase, setPhase] = useState<BillboardPhase>('appear');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [passing, setPassing] = useState(false);

  function startZoomOut() {
    setPhase('zooming');
    window.setTimeout(() => {
      setZoomLevel(0.55);
      setPhase('observing');
    }, 900);
  }

  function zoomOutFurther() {
    setZoomLevel((z) => Math.max(0.3, z - 0.15));
  }
  function lookCloser() {
    setZoomLevel((z) => Math.min(1, z + 0.2));
  }
  function letItPass() {
    setPassing(true);
    window.setTimeout(() => setPassing(false), 1800);
  }
  function restart() {
    setPhase('appear');
    setZoomLevel(1);
    setPassing(false);
  }

  return (
    <Card className="mb-5">
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.glaubenssaetze.billboardTitle}</p>

      <div
        className="rounded-[var(--radius-lg)] p-6 mb-3 flex items-center justify-center overflow-hidden"
        style={{ background: '#2C2A22', minHeight: 160 }}
      >
        <div
          className="rounded-[var(--radius-md)] p-4 text-center transition-transform duration-[900ms] ease-out"
          style={{
            background: 'var(--color-surface)',
            width: 200,
            transform: `scale(${zoomLevel}) ${passing ? 'translateX(60px) rotate(2deg)' : ''}`,
            opacity: passing ? 0.2 : 1,
            transitionProperty: 'transform, opacity',
            transitionDuration: passing ? '1800ms' : '900ms',
          }}
        >
          <p className="text-[10px] text-[var(--color-text-faint)] mb-2">{t.glaubenssaetze.billboardFrameLabel}</p>
          <p className="text-[13px] leading-relaxed text-[var(--color-text)]">{thought}</p>
        </div>
      </div>

      {phase === 'appear' && (
        <>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.glaubenssaetze.billboardAppearText}</p>
          <Button size="sm" onClick={startZoomOut}>
            {t.glaubenssaetze.billboardZoomOutCta}
          </Button>
        </>
      )}

      {phase === 'zooming' && (
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.billboardZoomingText}</p>
      )}

      {phase === 'observing' && (
        <>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.glaubenssaetze.billboardObserveText}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="ghost" onClick={lookCloser}>
              {t.glaubenssaetze.billboardLookCloserCta}
            </Button>
            <Button size="sm" variant="ghost" onClick={zoomOutFurther}>
              {t.glaubenssaetze.billboardZoomFurtherCta}
            </Button>
            <Button size="sm" variant="ghost" onClick={letItPass}>
              {t.glaubenssaetze.billboardLetPassCta}
            </Button>
            <Button size="sm" variant="ghost" onClick={restart}>
              {t.glaubenssaetze.billboardRestartCta}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}

/**
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Section 13 — a
 * third, genuinely different exercise: distance through language
 * rather than space (billboard) or the body (anchor). This is one of
 * ACT's best-known defusion techniques (Steven C. Hayes): repeating a
 * thought with an increasing prefix of self-observation turns "I'm a
 * failure" into progressively more "just a thought I'm having" rather
 * than a fact — the words themselves start to feel different, often a
 * little strange or even funny, which is itself part of the point.
 */
export function WordsExercise({ thought }: { thought: string }) {
  const t = useT();
  const [level, setLevel] = useState(0);

  const prefixes = [
    '',
    t.glaubenssaetze.wordsPrefix1,
    t.glaubenssaetze.wordsPrefix2,
    t.glaubenssaetze.wordsPrefix3,
  ];

  return (
    <Card className="mb-5">
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.glaubenssaetze.wordsTitle}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-4">{t.glaubenssaetze.wordsIntro}</p>

      <div className="rounded-[var(--radius-lg)] p-4 mb-4 text-center" style={{ background: 'var(--color-surface-muted)' }}>
        <p className="text-[15px] leading-relaxed text-[var(--color-text)]">
          {prefixes[level] && <span className="text-[var(--color-primary)]">{prefixes[level]} </span>}
          {thought}
        </p>
      </div>

      <div className="flex gap-2">
        {level < prefixes.length - 1 ? (
          <Button size="sm" onClick={() => setLevel((l) => l + 1)}>
            {t.glaubenssaetze.wordsNextCta}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setLevel(0)}>
            {t.glaubenssaetze.billboardRestartCta}
          </Button>
        )}
      </div>
    </Card>
  );
}

export function AnchorExercise() {
  const t = useT();
  const [step, setStep] = useState(0);
  const steps = [
    { label: 'A', title: t.glaubenssaetze.anchorAckTitle, text: t.glaubenssaetze.anchorAckText },
    { label: 'C', title: t.glaubenssaetze.anchorBodyTitle, text: t.glaubenssaetze.anchorBodyText },
    { label: 'E', title: t.glaubenssaetze.anchorEngageTitle, text: t.glaubenssaetze.anchorEngageText },
  ];

  return (
    <Card className="mb-5">
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-3">{t.glaubenssaetze.anchorTitle}</p>
      <div className="flex gap-1.5 mb-4">
        {steps.map((s, i) => (
          <div
            key={s.label}
            className="flex-1 h-1.5 rounded-full"
            style={{ background: i <= step ? 'var(--color-primary)' : 'var(--color-border)' }}
          />
        ))}
      </div>
      <div className="flex items-start gap-3 mb-4">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-medium flex-shrink-0"
          style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}
        >
          {steps[step].label}
        </span>
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{steps[step].title}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{steps[step].text}</p>
        </div>
      </div>
      <div className="flex gap-2">
        {step > 0 && (
          <Button size="sm" variant="ghost" onClick={() => setStep((s) => s - 1)}>
            {t.common.back}
          </Button>
        )}
        {step < steps.length - 1 ? (
          <Button size="sm" onClick={() => setStep((s) => s + 1)}>
            {t.common.next}
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setStep(0)}>
            {t.glaubenssaetze.billboardRestartCta}
          </Button>
        )}
      </div>
    </Card>
  );
}
