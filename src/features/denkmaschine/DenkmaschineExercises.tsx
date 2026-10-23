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

/** Shuffles all letters of a sentence across the letter positions, keeping spaces/punctuation in place. */
export function letterSalad(text: string): string {
  const chars = [...text];
  const idx = chars.map((c, i) => (/\p{L}/u.test(c) ? i : -1)).filter((i) => i >= 0);
  if (idx.length < 3) return text;
  let result = text;
  for (let attempt = 0; attempt < 6; attempt++) {
    const letters = idx.map((i) => chars[i].toLowerCase());
    for (let i = letters.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const out = [...chars];
    idx.forEach((pos, k) => { out[pos] = letters[k]; });
    const firstLetter = idx[0];
    out[firstLetter] = out[firstLetter].toUpperCase();
    result = out.join('');
    if (result !== text) break;
  }
  return result;
}

type PlayMode = null | 'salad' | 'words' | 'flip';

export function DefusionBillboardExercise({ thought, onUseAsReframe }: { thought: string; onUseAsReframe?: (text: string) => void }) {
  const t = useT();
  const [play, setPlay] = useState<PlayMode>(null);
  const [salad, setSalad] = useState(() => letterSalad(thought));
  const [wordIdx, setWordIdx] = useState(0);
  const [wordAnswers, setWordAnswers] = useState<string[]>([]);
  const [flipStep, setFlipStep] = useState(0);
  const [flipText, setFlipText] = useState('');
  const words = thought.split(/\s+/).map((w) => w.replace(/^[\p{P}\p{S}]+|[\p{P}\p{S}]+$/gu, '')).filter(Boolean);
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
          <p className="text-[13px] leading-relaxed text-[var(--color-text)]" data-testid="billboard-text">{play === 'salad' ? salad : thought}</p>
        </div>
      </div>

      {play === 'salad' && (
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.glaubenssaetze.saladText}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setSalad(letterSalad(thought))}>{t.glaubenssaetze.saladAgainCta}</Button>
            <Button size="sm" variant="ghost" onClick={() => setPlay(null)}>{t.glaubenssaetze.playBackCta}</Button>
          </div>
        </div>
      )}

      {play === 'words' && (
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.glaubenssaetze.wordsOneIntro}</p>
          {wordIdx < words.length ? (
            <>
              <div className="rounded-[var(--radius-lg)] p-4 mb-3 text-center" style={{ background: 'var(--color-surface-muted)' }}>
                <p className="text-[20px] text-[var(--color-primary)] mb-1" data-testid="word-current">{words[wordIdx]}</p>
                <p className="text-[14px] text-[var(--color-text)]">{t.glaubenssaetze.wordsOneAsk.replace('{word}', words[wordIdx])}</p>
              </div>
              <textarea
                className="input mb-3"
                rows={2}
                placeholder={t.glaubenssaetze.wordsOnePlaceholder}
                value={wordAnswers[wordIdx] ?? ''}
                onChange={(e) => setWordAnswers((a) => { const n = [...a]; n[wordIdx] = e.target.value; return n; })}
              />
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => setWordIdx((i) => i + 1)}>{t.glaubenssaetze.wordsOneNextCta}</Button>
                <Button size="sm" variant="ghost" onClick={() => setPlay(null)}>{t.glaubenssaetze.playBackCta}</Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[13px] text-[var(--color-text)] leading-relaxed mb-3">{t.glaubenssaetze.wordsOneDone}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setWordIdx(0); setWordAnswers([]); }}>{t.glaubenssaetze.billboardRestartCta}</Button>
                <Button size="sm" variant="ghost" onClick={() => setPlay(null)}>{t.glaubenssaetze.playBackCta}</Button>
              </div>
            </>
          )}
        </div>
      )}

      {play === 'flip' && (
        <div>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-1">{t.glaubenssaetze.flipIntro}</p>
          <p className="text-[11px] text-[var(--color-text-faint)] leading-relaxed mb-3">{t.glaubenssaetze.flipSource}</p>
          {flipStep < 2 ? (
            <>
              <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{flipStep === 0 ? t.glaubenssaetze.flipStep1 : t.glaubenssaetze.flipStep2}</p>
              {flipStep === 1 && <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.glaubenssaetze.flipStep2Hint}</p>}
              <div className="flex flex-wrap gap-2 mb-3">
                {[t.glaubenssaetze.flipAnswerYes, t.glaubenssaetze.flipAnswerNo, t.glaubenssaetze.flipAnswerUnsure].map((a) => (
                  <Button key={a} size="sm" variant="secondary" onClick={() => setFlipStep((x) => x + 1)}>{a}</Button>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-[14px] font-medium text-[var(--color-text)] mb-1">{t.glaubenssaetze.flipStep3}</p>
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2">{t.glaubenssaetze.flipStep3Hint}</p>
              <p className="text-[12px] text-[var(--color-text-faint)] italic mb-2">{t.glaubenssaetze.flipExample}</p>
              <textarea
                className="input mb-3"
                rows={2}
                placeholder={t.glaubenssaetze.flipPlaceholder}
                value={flipText}
                onChange={(e) => setFlipText(e.target.value)}
              />
              {onUseAsReframe && (
                <Button size="sm" className="mr-2" disabled={!flipText.trim()} onClick={() => onUseAsReframe(flipText.trim())}>
                  {t.glaubenssaetze.flipUseCta}
                </Button>
              )}
            </>
          )}
          <div className="flex gap-2">
            {flipStep > 0 && <Button size="sm" variant="ghost" onClick={() => setFlipStep((x) => x - 1)}>{t.common.back}</Button>}
            <Button size="sm" variant="ghost" onClick={() => setPlay(null)}>{t.glaubenssaetze.playBackCta}</Button>
          </div>
        </div>
      )}

      {play === null && phase === 'appear' && (
        <>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{t.glaubenssaetze.billboardAppearText}</p>
          <Button size="sm" onClick={startZoomOut}>
            {t.glaubenssaetze.billboardZoomOutCta}
          </Button>
        </>
      )}

      {play === null && phase === 'zooming' && (
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.glaubenssaetze.billboardZoomingText}</p>
      )}

      {play === null && phase === 'observing' && (
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

      {play === null && phase !== 'zooming' && (
        <div className="mt-4 pt-3 border-t border-[var(--color-border)]">
          <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{t.glaubenssaetze.playTitle}</p>
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={() => { setSalad(letterSalad(thought)); setPlay('salad'); }}>
              {t.glaubenssaetze.playSaladCta}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setWordIdx(0); setWordAnswers([]); setPlay('words'); }}>
              {t.glaubenssaetze.playWordsCta}
            </Button>
            <Button size="sm" variant="secondary" onClick={() => { setFlipStep(0); setFlipText(''); setPlay('flip'); }}>
              {t.glaubenssaetze.playFlipCta}
            </Button>
          </div>
        </div>
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
