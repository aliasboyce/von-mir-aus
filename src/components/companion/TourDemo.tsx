import { useEffect, useRef, useState } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { TOUR_DEMOS } from './tourDemos';

interface Props {
  stopId: string | undefined;
  /** changes → run again */
  runKey: number;
  playing: boolean;
  speed?: number;
}

const wait = (ms: number) => new Promise<void>((res) => setTimeout(res, ms));
const visible = (e: Element) => {
  const r = e.getBoundingClientRect();
  return r.width > 4 && r.height > 4 && !e.closest('[data-tour-ui]');
};

function findEl(spec: string): HTMLElement | null {
  if (spec.startsWith('css:')) {
    const all = [...document.querySelectorAll<HTMLElement>(spec.slice(4))];
    return all.find(visible) ?? null;
  }
  const needle = spec.toLowerCase();
  const cands = [...document.querySelectorAll<HTMLElement>('button,a,[role=button],label,summary,h1,h2,h3')].filter(visible);
  const hits = cands.filter((e) => (e.innerText || e.getAttribute('aria-label') || '').toLowerCase().includes(needle));
  // the smallest match is the real control, not a big wrapper
  hits.sort((a, b) => a.getBoundingClientRect().width * a.getBoundingClientRect().height - b.getBoundingClientRect().width * b.getBoundingClientRect().height);
  return hits[0] ?? null;
}

interface View {
  x: number;
  y: number;
  ms: number;
  press: boolean;
  rect?: { l: number; t: number; w: number; h: number };
  bubble?: { text: string; above: boolean; left: number; top: number; tail: number };
  ripple: number;
}

/**
 * The "Zeigefinger": walks over the real page and says in a speech bubble what one does here.
 * Purely visual – nothing is tapped, nothing saved.
 */
export function TourDemo({ stopId, runKey, playing, speed = 1 }: Props) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const reduce = !!settings.reduceMotion;
  const [view, setView] = useState<View | null>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;
  const speedRef = useRef(speed);
  speedRef.current = speed;

  useEffect(() => {
    const steps = stopId ? TOUR_DEMOS[stopId] : undefined;
    setView(null);
    if (!steps || steps.length === 0) return;
    let cancelled = false;
    // time that stands still while paused
    const sleep = async (ms: number) => {
      let left = ms;
      while (left > 0 && !cancelled) {
        await wait(80);
        if (playingRef.current) left -= 80 * speedRef.current;
      }
    };
    (async () => {
      await sleep(1500);
      for (const s of steps) {
        if (cancelled) return;
        let el: HTMLElement | null = null;
        for (let i = 0; i < 8 && !el && !cancelled; i++) {
          el = findEl(s.find);
          if (!el) await wait(250);
        }
        if (!el || cancelled) continue;
        const vh = window.innerHeight;
        const r0 = el.getBoundingClientRect();
        window.scrollBy({ top: r0.top + r0.height / 2 - vh * 0.36, behavior: reduce ? 'auto' : 'smooth' });
        await sleep(reduce ? 200 : 750);
        if (cancelled) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        const rect = { l: r.left, t: r.top, w: r.width, h: r.height };
        const above = cy > vh * 0.5;
        const bw = Math.min(280, window.innerWidth - 24);
        const left = Math.min(Math.max(12, cx - bw / 2), window.innerWidth - bw - 12);
        const bubble = { text: en ? s.en : s.de, above, left, top: above ? r.top - 14 : r.bottom + 14, tail: Math.min(Math.max(18, cx - left), bw - 18) };
        const startX = s.act === 'slide' ? r.left + r.width * 0.12 : cx;
        // glide to the element
        setView((v) => ({ x: startX, y: cy, ms: reduce ? 0 : 800, press: false, rect, bubble, ripple: v?.ripple ?? 0 }));
        await sleep(reduce ? 300 : 950);
        if (cancelled) return;
        if (s.act === 'tap') {
          setView((v) => (v ? { ...v, press: true, ripple: v.ripple + 1 } : v));
          await sleep(500);
          setView((v) => (v ? { ...v, press: false } : v));
        } else if (s.act === 'slide') {
          setView((v) => (v ? { ...v, press: true } : v));
          await sleep(150);
          setView((v) => (v ? { ...v, x: r.left + r.width * 0.78, ms: reduce ? 0 : 1600 } : v));
          await sleep(1800);
          setView((v) => (v ? { ...v, press: false } : v));
        }
        await sleep(1200 + (en ? s.en : s.de).length * 38);
      }
      if (!cancelled) setView(null);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopId, runKey, en, reduce]);

  if (!view) return null;
  const b = view.bubble;
  return (
    <div className="fixed inset-0 z-[240] pointer-events-none no-print" aria-hidden="true" data-testid="tour-demo">
      {view.rect && (
        <div
          className="absolute rounded-[14px] tour-demo-ring"
          style={{ left: view.rect.l - 4, top: view.rect.t - 4, width: view.rect.w + 8, height: view.rect.h + 8, border: '2px solid var(--color-primary)', transition: reduce ? 'none' : 'all 0.5s ease' }}
        />
      )}
      {b && (
        <div
          className="absolute rounded-[18px] bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-[var(--shadow-lg)] px-3.5 py-2.5 text-[13.5px] leading-snug text-[var(--color-text)] animate-in"
          style={{ left: b.left, width: Math.min(280, window.innerWidth - 24), ...(b.above ? { bottom: window.innerHeight - b.top } : { top: b.top }) }}
          data-testid="tour-demo-bubble"
        >
          {b.text}
          <span
            className="absolute w-3 h-3 bg-[var(--color-surface)] border-[var(--color-primary)]"
            style={{ left: b.tail - 6, ...(b.above ? { bottom: -7, borderRight: '1px solid', borderBottom: '1px solid' } : { top: -7, borderLeft: '1px solid', borderTop: '1px solid' }), transform: 'rotate(45deg)' }}
          />
        </div>
      )}
      <div className="absolute left-0 top-0" style={{ transform: `translate(${view.x - 20}px, ${view.y - 20}px)`, transition: reduce ? 'none' : `transform ${view.ms}ms cubic-bezier(.4,.1,.2,1)` }}>
        <div key={view.ripple} className={view.ripple > 0 ? 'tour-demo-ripple' : ''} style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: '2px solid var(--color-primary)' }} />
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'color-mix(in srgb, var(--color-primary) 38%, transparent)',
            border: '2px solid var(--color-primary)',
            boxShadow: '0 4px 14px rgba(0,0,0,.25)',
            transform: view.press ? 'scale(0.72)' : 'scale(1)',
            transition: reduce ? 'none' : 'transform .18s ease',
          }}
        />
      </div>
    </div>
  );
}
