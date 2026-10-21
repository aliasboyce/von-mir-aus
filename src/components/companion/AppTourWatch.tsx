import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pause, Play, SkipBack, SkipForward, X, RotateCcw } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { Button } from '../ui/Button';
import { TOUR_STOPS } from './tourData';
import { TourDemo } from './TourDemo';
import { demoDuration, hasDemo } from './tourDemos';

/** how long a station stays: reading time of its text, never too short or endless */
const durationFor = (txt: string) => Math.min(24000, Math.max(8000, 4500 + txt.length * 55));
const SPEEDS = [0.75, 1, 1.5] as const;

/**
 * Die Tour zum Zuschauen: Die App geht von allein durch alle Stationen, öffnet die echten Seiten,
 * blättert sie langsam durch und erklärt jede in einem Satz. Man muss nichts tun – Play/Pause,
 * Vor und Zurück gibt es, und man kann jederzeit aufhören.
 */
export function AppTourWatch({ onFinish }: { onFinish: () => void }) {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const en = settings.language === 'en';
  const total = TOUR_STOPS.length;
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<(typeof SPEEDS)[number]>(1);
  const [progress, setProgress] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const finished = index >= total;
  const stop = finished ? undefined : TOUR_STOPS[index];
  const tx = stop ? (en ? stop.en : stop.de) : undefined;
  const demo = hasDemo(stop?.id);
  const dur = tx ? Math.max(durationFor(tx.why), demo ? demoDuration(stop?.id) : 0) : 1;

  // open the real page of the station
  useEffect(() => {
    const target = stop?.path ?? '/';
    const targetPath = target.split('?')[0];
    if (window.location.pathname !== targetPath || (target.includes('?') && window.location.search !== '?' + target.split('?')[1])) navigate(target);
    window.scrollTo({ top: 0 });
    setProgress(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // time runs while playing; the page is scrolled through gently along with it
  const elapsed = useRef(0);
  useEffect(() => {
    elapsed.current = 0;
  }, [index]);
  useEffect(() => {
    if (!playing || finished) return;
    let raf = 0;
    let last = performance.now();
    const tick = (nowT: number) => {
      elapsed.current += (nowT - last) * speed;
      last = nowT;
      const p = Math.min(1, elapsed.current / dur);
      setProgress(p);
      if (!settings.reduceMotion && !demo) {
        const max = Math.min(1600, document.documentElement.scrollHeight - window.innerHeight);
        const t = Math.min(1, Math.max(0, (elapsed.current - 1800) / (dur * 0.75)));
        if (max > 40) window.scrollTo({ top: max * t });
      }
      if (p >= 1) {
        setIndex((i) => i + 1);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, finished, index, speed, dur, settings.reduceMotion, demo]);

  // page content keeps clear of the card
  useLayoutEffect(() => {
    const el = cardRef.current;
    const root = document.documentElement;
    if (!el) return;
    const set = () => root.style.setProperty('--tour-card-h', `${Math.ceil(el.getBoundingClientRect().height) + 24}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, finished]);
  useEffect(() => () => { document.documentElement.style.removeProperty('--tour-card-h'); }, []);

  const L = en
    ? { step: 'Station', of: 'of', watching: 'Just watch – nothing to do', play: 'Play', pause: 'Pause', prev: 'Back', next: 'Next', close: 'Stop', speed: 'Speed', doneTitle: 'That was the tour', doneText: 'You have seen the app once from start to finish. Nothing was changed. You can watch it again any time from the settings – or try the steps out yourself.', again: 'Watch again', fin: 'Done' }
    : { step: 'Station', of: 'von', watching: 'Nur zuschauen – du musst nichts tun', play: 'Abspielen', pause: 'Pause', prev: 'Zurück', next: 'Weiter', close: 'Beenden', speed: 'Tempo', doneTitle: 'Das war der Rundgang', doneText: 'Du hast die App einmal von vorn bis hinten gesehen. Es wurde nichts verändert. Du kannst sie dir jederzeit wieder in den Einstellungen ansehen – oder die Schritte selbst ausprobieren.', again: 'Nochmal ansehen', fin: 'Fertig' };

  return (
    <>
      {!finished && <TourDemo stopId={stop?.id} runKey={index} playing={playing} speed={speed} />}
    <div className="fixed inset-x-0 bottom-0 z-[250] px-3 animate-in no-print" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }} data-testid="tour-watch" data-tour-ui>
      <div ref={cardRef} className="mx-auto rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-3.5" style={{ maxWidth: 480 }}>
        {finished ? (
          <div data-testid="tour-watch-done">
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-1">{L.doneTitle}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{L.doneText}</p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => { setIndex(0); setPlaying(true); }} data-testid="tour-watch-again"><RotateCcw size={15} className="mr-1.5" /> {L.again}</Button>
              <Button fullWidth onClick={onFinish} data-testid="tour-watch-finish">{L.fin}</Button>
            </div>
          </div>
        ) : (
          <>
            <div className="h-1 rounded-full mb-2.5 overflow-hidden" style={{ background: 'var(--color-border)' }} aria-hidden="true">
              <div className="h-full rounded-full" style={{ width: `${Math.round(progress * 100)}%`, background: 'var(--color-primary)' }} />
            </div>
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]">{L.step} {index + 1} {L.of} {total} · {L.watching}</p>
              <button type="button" onClick={onFinish} aria-label={L.close} className="flex items-center gap-1 text-[12px] text-[var(--color-text-faint)]" data-testid="tour-watch-close"><X size={14} /> {L.close}</button>
            </div>
            <p className="text-[15px] font-medium text-[var(--color-text)]" data-testid="tour-watch-title">{tx!.title}</p>
            <div className="max-h-[26vh] overflow-y-auto mt-1">
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{tx!.why}</p>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button type="button" onClick={() => setIndex((i) => Math.max(0, i - 1))} aria-label={L.prev} className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="tour-watch-prev"><SkipBack size={18} /></button>
              <button type="button" onClick={() => setPlaying((p) => !p)} aria-label={playing ? L.pause : L.play} aria-pressed={playing} className="flex-1 h-11 rounded-full flex items-center justify-center gap-2 text-[14px]" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }} data-testid="tour-watch-play">
                {playing ? <Pause size={18} /> : <Play size={18} />} {playing ? L.pause : L.play}
              </button>
              <button type="button" onClick={() => setIndex((i) => i + 1)} aria-label={L.next} className="w-11 h-11 rounded-full flex items-center justify-center border border-[var(--color-border-strong)] text-[var(--color-text)]" data-testid="tour-watch-next"><SkipForward size={18} /></button>
              <button type="button" onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} aria-label={L.speed} className="h-11 px-3 rounded-full text-[13px] border border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid="tour-watch-speed">{speed}×</button>
            </div>
          </>
        )}
      </div>
    </div>
    </>
  );
}
