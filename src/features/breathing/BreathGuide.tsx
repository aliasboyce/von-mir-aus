import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, X } from 'lucide-react';
import { LichtCompanion } from '../../components/companion/LichtCompanion';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterExternalModalOpen, useRegisterModalOpen } from '../../state/ModalStackContext';
import { playSound } from '../../services/sounds';
import { triggerHaptic } from '../../services/haptics';
import { createId } from '../../services/storage/repository';
import { skillUsesRepo } from '../resources/skillUsesRepo';
import { isIos } from '../../services/testSupport';
import { cycleSeconds, locate, phasesFor, type BreathPattern, type BreathPhase, type BreathVisual } from './breathPatterns';

export interface BreathOptions {
  minutes: number;
  visual: BreathVisual;
  vibration: boolean;
  tone: boolean;
  skipHolds: boolean;
}

const LABEL = {
  de: { in: 'Einatmen', top: 'Nachfüllen', hold: 'Halten', out: 'Ausatmen', stop: 'Beenden', pause: 'Pause', resume: 'Weiter', left: 'noch', doneTitle: 'Das war es.', doneText: 'Spür kurz nach, wie es deinem Körper jetzt geht – ohne etwas ändern zu müssen.', again: 'Nochmal', close: 'Fertig', invite: 'Augen offen lassen ist völlig in Ordnung. Du kannst jederzeit aufhören.' },
  en: { in: 'Breathe in', top: 'Top up', hold: 'Hold', out: 'Breathe out', stop: 'Stop', pause: 'Pause', resume: 'Resume', left: 'left', doneTitle: 'That was it.', doneText: 'Notice for a moment how your body is now – without having to change anything.', again: 'Again', close: 'Done', invite: 'Keeping your eyes open is perfectly fine. You can stop at any time.' },
};

let tickSwitch: HTMLLabelElement | null = null;
/** iPhones have no vibration API; Safari 17.4+ answers a toggled "switch" checkbox with a small tick – best effort. */
function iosTick() {
  try {
    if (!tickSwitch) {
      tickSwitch = document.createElement('label');
      tickSwitch.setAttribute('data-no-tap-feedback', '');
      tickSwitch.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;pointer-events:none;';
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.setAttribute('switch', '');
      input.setAttribute('data-no-tap-feedback', '');
      tickSwitch.appendChild(input);
      document.body.appendChild(tickSwitch);
    }
    tickSwitch.click();
  } catch {
    // purely optional
  }
}

/**
 * The guided breathing screen. One number – the lung level 0…1 – drives everything that moves:
 * the circle (with the Wesen inside), the scrolling wave line, or the dot travelling around a square.
 * Phase word and seconds say what to do; vibration pulses rise while breathing in and slow down while
 * breathing out. Nothing here is a must: ✕ and pause are always there.
 */
export function BreathGuide({ pattern, options, onClose }: { pattern: BreathPattern; options: BreathOptions; onClose: () => void }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const L = en ? LABEL.en : LABEL.de;
  useRegisterModalOpen(true);
  useRegisterExternalModalOpen(true);

  const phases: BreathPhase[] = useMemo(() => phasesFor(pattern, options.skipHolds), [pattern, options.skipHolds]);
  const cycle = cycleSeconds(phases);
  const visual: BreathVisual = options.visual === 'box' && phases.length !== 4 ? 'circle' : options.visual;
  const totalSec = options.minutes * 60;

  const [run, setRun] = useState(0); // restart counter
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [secLeft, setSecLeft] = useState(phases[0].sec);
  const [remaining, setRemaining] = useState(totalSec);

  const clock = useRef({ start: 0, pausedAt: 0, pausedTotal: 0 });
  const pausedRef = useRef(false);
  pausedRef.current = paused;
  const startedAtIso = useRef(new Date().toISOString());

  // visuals
  const circleRef = useRef<SVGGElement>(null);
  const haloRefs = useRef<(SVGCircleElement | null)[]>([]);
  const arcRef = useRef<SVGCircleElement>(null);
  const wesenRef = useRef<HTMLDivElement>(null);
  const wavePathRef = useRef<SVGPathElement>(null);
  const dotRef = useRef<SVGGElement>(null);
  const boxDotRef = useRef<SVGGElement>(null);
  const boxFillRef = useRef<SVGRectElement>(null);
  const boxEdgeRef = useRef<SVGPathElement>(null);

  const audio = useRef<{ ctx: AudioContext; osc: OscillatorNode; gain: GainNode } | null>(null);

  // tone: one very soft sine whose pitch follows the lung level
  useEffect(() => {
    if (!options.tone || finished) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 196;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    audio.current = { ctx, osc, gain };
    void ctx.resume();
    return () => {
      try {
        gain.gain.setTargetAtTime(0, ctx.currentTime, 0.1);
        osc.stop(ctx.currentTime + 0.4);
        window.setTimeout(() => void ctx.close(), 600);
      } catch {
        // ignore
      }
      audio.current = null;
    };
  }, [options.tone, finished, run]);

  useEffect(() => {
    if (finished) return;
    clock.current = { start: performance.now(), pausedAt: 0, pausedTotal: 0 };
    startedAtIso.current = new Date().toISOString();
    let raf = 0;
    let lastIdx = -1;
    let lastSecShown = -1;
    let nextPulse = 0;
    const W = 360;
    const H = 210;
    const dotX = 120;
    const pxPerSec = 40;

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const c = clock.current;
      if (pausedRef.current) {
        if (!c.pausedAt) c.pausedAt = now;
        return;
      }
      if (c.pausedAt) {
        c.pausedTotal += now - c.pausedAt;
        c.pausedAt = 0;
      }
      const t = (now - c.start - c.pausedTotal) / 1000;
      const pos = locate(phases, t);
      const lvl = pos.level;

      // the end comes softly: at the first cycle boundary after the chosen time
      if (t >= totalSec && pos.cycleFraction < 0.02 && t > 1) {
        setFinished(true);
        return;
      }

      // circle + Wesen
      if (circleRef.current) {
        const base = 62 + 46 * lvl;
        haloRefs.current.forEach((h, i) => {
          if (h) {
            h.setAttribute('r', String(base + 16 + i * 17 + 6 * lvl));
            h.setAttribute('opacity', String((0.2 - i * 0.055) * (0.55 + 0.45 * lvl)));
          }
        });
        circleRef.current.style.transform = `scale(${0.6 + 0.4 * lvl})`;
      }
      if (arcRef.current) {
        const C = 2 * Math.PI * 138;
        arcRef.current.setAttribute('stroke-dasharray', String(C));
        arcRef.current.setAttribute('stroke-dashoffset', String(C * (1 - pos.progress)));
      }
      if (wesenRef.current) wesenRef.current.style.transform = `translate(-50%,-50%) scale(${0.95 + 0.75 * lvl})`;

      // wave: the line scrolls to the left under a fixed dot – "follow the line"
      if (wavePathRef.current) {
        const t0 = t - dotX / pxPerSec;
        const t1 = t + (W - dotX) / pxPerSec;
        let d = '';
        const step = 0.12;
        for (let tt = t0; tt <= t1; tt += step) {
          const x = (tt - t0) * pxPerSec;
          const y = H - 26 - locate(phases, tt).level * (H - 64);
          d += `${d ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)} `;
        }
        wavePathRef.current.setAttribute('d', d);
      }
      if (dotRef.current) dotRef.current.setAttribute('transform', `translate(${dotX},${H - 26 - lvl * (H - 64)})`);

      // square: a dot travels clockwise from bottom-left, one side per phase
      if (boxDotRef.current && phases.length === 4) {
        const corners = [[60, 240], [60, 60], [240, 60], [240, 240], [60, 240]];
        const a = corners[pos.index];
        const b = corners[pos.index + 1];
        const x = a[0] + (b[0] - a[0]) * pos.progress;
        const y = a[1] + (b[1] - a[1]) * pos.progress;
        boxDotRef.current.setAttribute('transform', `translate(${x},${y})`);
        if (boxFillRef.current) {
          const h = 36 + 150 * lvl;
          boxFillRef.current.setAttribute('height', String(h));
          boxFillRef.current.setAttribute('y', String(150 - h / 2));
          boxFillRef.current.setAttribute('x', String(150 - h / 2));
          boxFillRef.current.setAttribute('width', String(h));
        }
        if (boxEdgeRef.current) {
          boxEdgeRef.current.setAttribute('d', `M${a[0]},${a[1]} L${x},${y}`);
        }
      }

      // words
      if (pos.index !== lastIdx) {
        lastIdx = pos.index;
        setPhaseIdx(pos.index);
        nextPulse = 0;
      }
      const sl = Math.ceil(pos.secLeft);
      if (sl !== lastSecShown) {
        lastSecShown = sl;
        setSecLeft(sl);
        setRemaining(Math.max(0, Math.ceil(totalSec - t)));
      }

      // tone follows the lung level
      if (audio.current) {
        const { ctx, osc, gain } = audio.current;
        osc.frequency.setTargetAtTime(170 + 110 * lvl, ctx.currentTime, 0.08);
        gain.gain.setTargetAtTime(phases[pos.index].kind === 'hold' ? 0.012 : 0.03, ctx.currentTime, 0.2);
      }

      // vibration: little pulses that come faster while breathing in and slow down while breathing out
      if (options.vibration) {
        const kind = phases[pos.index].kind;
        if (kind !== 'hold' && now >= nextPulse) {
          const interval = kind === 'out' ? 260 + 380 * pos.progress : 640 - 380 * pos.progress;
          nextPulse = now + interval;
          if (isIos()) iosTick();
          else triggerHaptic('tap', { hapticsEnabled: true });
        }
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, finished, phases, totalSec, options.vibration]);

  // when finished: remember it like any skill use (Rückblick, "Tag beginnen" …) and say goodbye softly
  useEffect(() => {
    if (!finished) return;
    const end = new Date();
    const secs = Math.max(5, Math.round((end.getTime() - new Date(startedAtIso.current).getTime()) / 1000));
    skillUsesRepo.save({
      id: createId('skilluse'),
      skillId: `breath-${pattern.id}`,
      skillTitle: en ? pattern.titleEn : pattern.title,
      startedAt: startedAtIso.current,
      endedAt: end.toISOString(),
      durationSec: secs,
    });
    playSound('complete', settings);
    triggerHaptic('settle', settings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished]);

  const phase = phases[phaseIdx] ?? phases[0];
  const mm = String(Math.floor(remaining / 60)).padStart(1, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const hint = en ? phase.hintEn : phase.hint;
  const c1 = 'color-mix(in srgb, var(--color-primary) 55%, #9ad0c0)';

  const overlay = (
    <div className="fixed inset-0 z-[225] flex flex-col" style={{ background: 'radial-gradient(120% 80% at 50% 25%, color-mix(in srgb, var(--color-primary) 16%, var(--color-bg)) 0%, var(--color-bg) 72%)', paddingTop: 'max(14px, env(safe-area-inset-top))', paddingBottom: 'max(18px, env(safe-area-inset-bottom))' }} data-testid="breath-guide">
      <div className="flex items-center justify-between px-4">
        <button type="button" onClick={onClose} aria-label={L.stop} data-sound="close" className="w-11 h-11 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center" data-testid="breath-close">
          <X size={20} />
        </button>
        <p className="text-[13px] text-[var(--color-text-muted)]">{en ? pattern.titleEn : pattern.title}</p>
        {!finished ? (
          <button type="button" onClick={() => setPaused((v) => !v)} aria-label={paused ? L.resume : L.pause} className="w-11 h-11 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center" data-testid="breath-pause">
            {paused ? <Play size={18} /> : <Pause size={18} />}
          </button>
        ) : (
          <span className="w-11" />
        )}
      </div>

      {!finished ? (
        <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
          <div className="relative w-full flex items-center justify-center" style={{ maxWidth: 360, aspectRatio: visual === 'wave' ? '360 / 210' : '1 / 1' }} data-testid={`breath-visual-${visual}`}>
            {visual === 'circle' && (
              <>
                <svg viewBox="-180 -180 360 360" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <g ref={circleRef} style={{ transformOrigin: '0 0' }}>
                    {[0, 1, 2].map((i) => (
                      <circle key={i} ref={(el) => { haloRefs.current[i] = el; }} cx="0" cy="0" r={90 + i * 17} fill={c1} opacity={0.15} />
                    ))}
                  </g>
                  <circle cx="0" cy="0" r="138" fill="none" stroke="var(--color-border)" strokeWidth="2" opacity="0.7" />
                  <circle ref={arcRef} cx="0" cy="0" r="138" fill="none" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" transform="rotate(-90)" />
                </svg>
                <div ref={wesenRef} className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0.95)', willChange: 'transform' }}>
                  <LichtCompanion size="large" />
                </div>
              </>
            )}
            {visual === 'wave' && (
              <svg viewBox="0 0 360 210" className="absolute inset-0 w-full h-full" aria-hidden="true">
                <defs>
                  <linearGradient id="bw-fade" x1="0" x2="1" y1="0" y2="0">
                    <stop offset="0" stopColor="var(--color-primary)" stopOpacity="0" />
                    <stop offset="0.3" stopColor="var(--color-primary)" stopOpacity="0.35" />
                    <stop offset="0.36" stopColor="var(--color-primary)" stopOpacity="1" />
                    <stop offset="1" stopColor="var(--color-primary)" stopOpacity="0.75" />
                  </linearGradient>
                </defs>
                <line x1="120" y1="12" x2="120" y2="198" stroke="var(--color-border-strong)" strokeDasharray="3 6" />
                <path ref={wavePathRef} fill="none" stroke="url(#bw-fade)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
                <g ref={dotRef}>
                  <circle r="20" fill="var(--color-primary)" opacity="0.18" />
                  <circle r="11" fill="var(--color-primary)" />
                  <circle r="4" fill="#fff" opacity="0.9" />
                </g>
              </svg>
            )}
            {visual === 'box' && (
              <>
                <svg viewBox="0 0 300 300" className="absolute inset-0 w-full h-full" aria-hidden="true">
                  <rect ref={boxFillRef} x="114" y="114" width="72" height="72" rx="18" fill={c1} opacity="0.28" />
                  <rect x="60" y="60" width="180" height="180" rx="14" fill="none" stroke="var(--color-border-strong)" strokeWidth="3" />
                  <path ref={boxEdgeRef} fill="none" stroke="var(--color-primary)" strokeWidth="7" strokeLinecap="round" />
                  <g ref={boxDotRef}>
                    <circle r="19" fill="var(--color-primary)" opacity="0.2" />
                    <circle r="10" fill="var(--color-primary)" />
                  </g>
                </svg>
                <div className="absolute" style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%) scale(0.55)' }}>
                  <LichtCompanion size="large" />
                </div>
              </>
            )}
          </div>

          <div className="text-center mt-4" style={{ minHeight: 110 }} aria-live="polite">
            <p className="text-[30px] font-light text-[var(--color-text)] leading-tight" data-testid="breath-phase">{L[phase.kind]}</p>
            <p className="text-[15px] text-[var(--color-text-muted)] tabular-nums mt-1">{phase.kind === 'top' ? '' : `${secLeft}`}</p>
            {hint && <p className="text-[13px] text-[var(--color-text-faint)] mt-0.5">{hint}</p>}
          </div>
          <p className="text-[12px] text-[var(--color-text-faint)] tabular-nums" data-testid="breath-remaining">
            {paused ? L.pause : `${L.left} ${mm}:${ss}`}
          </p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mt-4 text-center max-w-[300px]" data-hint>{L.invite}</p>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center px-8 text-center" data-testid="breath-done">
          <LichtCompanion size="large" joyBurst="hop" />
          <p className="text-[24px] font-light text-[var(--color-text)] mt-6 mb-2">{L.doneTitle}</p>
          <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px] mb-8">{L.doneText}</p>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setFinished(false); setPaused(false); setRun((n) => n + 1); }} className="px-5 py-2.5 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="breath-again">{L.again}</button>
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-full text-[14px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="breath-finish">{L.close}</button>
          </div>
        </div>
      )}
    </div>
  );
  void cycle;
  return createPortal(overlay, document.body);
}
