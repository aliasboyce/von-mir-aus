import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { useModalStack } from '../../state/ModalStackContext';
import { useT } from '../../i18n';
import { Button } from '../ui/Button';
import { CORE_COUNT, TOUR_STOPS, tourExtrasModeStore, tourIndexStore, tourStyleStore } from './tourData';
import { AppTourWatch } from './AppTourWatch';

function pathAllowed(pathname: string, prefixes: string[]): boolean {
  return prefixes.some((p) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/')));
}

interface AppTourOverlayProps {
  /** called when the whole tour has been played through to the end */
  onFinish: () => void;
  /** leave the extras for now without losing the place (they can be resumed from the settings) */
  onPause: () => void;
}

/**
 * Die geführte Tour zum Durchspielen: jede Station öffnet die echte Seite, erklärt wozu sie da ist
 * und gibt eine kleine Aufgabe. Es gibt bewusst kein "Schließen" — die Tour wird einmal ganz
 * durchgegangen (siehe tourData.ts). Innerhalb einer Station darf man die Seite frei benutzen
 * (Formulare, Unterseiten); verlässt man den Bereich, geht es zur Station zurück.
 */
export function AppTourOverlay(props: AppTourOverlayProps) {
  // the style is chosen when the tour starts (first start or settings) and stays for the whole run
  return tourStyleStore.get() === 'watch' ? <AppTourWatch onFinish={props.onFinish} /> : <AppTourInteractive {...props} />;
}

function AppTourInteractive({ onFinish, onPause }: AppTourOverlayProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { settings } = useSettings();
  const { anyModalOpen } = useModalStack();
  const t = useT();
  const en = settings.language === 'en';
  const total = TOUR_STOPS.length;
  const [index, setIndexState] = useState(() => Math.min(Math.max(tourIndexStore.get() ?? 0, 0), total));
  const [collapsed, setCollapsed] = useState(false);
  const [done, setDone] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const [mode, setModeState] = useState(() => tourExtrasModeStore.get());
  const isClosing = index >= total;
  // right after the core: the person chooses how to meet the extras
  const isChoice = !isClosing && index === CORE_COUNT && !mode;
  const isExplain = !isClosing && index === CORE_COUNT && mode === 'explain';
  const stop = isClosing || isChoice || isExplain ? undefined : TOUR_STOPS[index];
  const inExtras = index >= CORE_COUNT;
  const extrasTotal = total - CORE_COUNT;

  function setMode(m: 'explain' | 'try' | null) {
    tourExtrasModeStore.set(m);
    setModeState(m);
  }

  function setIndex(i: number) {
    tourIndexStore.set(i);
    setIndexState(i);
    setCollapsed(false);
  }

  // go to the station's page
  useEffect(() => {
    const target = stop?.path ?? '/';
    const targetPath = target.split('?')[0];
    if (window.location.pathname !== targetPath || (target.includes('?') && window.location.search !== '?' + target.split('?')[1])) {
      navigate(target);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, mode]);

  // staying inside the station's area — stepping out leads back
  useEffect(() => {
    if (!stop) return;
    const allowed = stop.allow ?? [stop.path.split('?')[0]];
    if (!pathAllowed(location.pathname, allowed)) navigate(stop.path, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, index, mode]);

  // recognise that the task was done (something new was created)
  useEffect(() => {
    setDone(false);
    if (!stop?.check) return;
    const base = stop.check();
    const id = setInterval(() => {
      if (stop.check!() > base) {
        setDone(true);
        clearInterval(id);
      }
    }, 600);
    return () => clearInterval(id);
  }, [index, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // page content keeps clear of the card
  useLayoutEffect(() => {
    const el = cardRef.current;
    const root = document.documentElement;
    if (!el || anyModalOpen) {
      root.style.setProperty('--tour-card-h', '64px');
      return;
    }
    const set = () => root.style.setProperty('--tour-card-h', `${Math.ceil(el.getBoundingClientRect().height) + 24}px`);
    set();
    const ro = new ResizeObserver(set);
    ro.observe(el);
    return () => ro.disconnect();
  }, [index, collapsed, anyModalOpen, done]);
  useEffect(() => () => { document.documentElement.style.removeProperty('--tour-card-h'); }, []);

  const tx = stop ? (en ? stop.en : stop.de) : undefined;
  const L = en
    ? { step: 'Step', of: 'of', why: 'Why this helps', task: 'Now you', doneMsg: 'Done — nicely.', openMsg: 'Still open — you can go on any time.', back: 'Back', next: 'Next', fold: 'Fold', unfold: 'Show guide', modal: 'Guide {n}/{t} · close window to go on', foot: 'Everything here is real: what you add stays in your app.', core: 'Core step', extra: 'Extra', pause: 'Enough for today', coreDone: 'The core is done ✔', coreDoneText: 'You now know the five main areas: Where am I, Regulate, Connect, Secure, Look back. On top of that there are {n} extras (looking things up, writing, calendar, letters, parking box and more). How would you like to meet them?', explainBtn: '📖 Explain them first', tryBtn: '🧪 Try them out right away', laterBtn: 'Later – you find this in the settings', explainTitle: 'The extras in short', explainDone: 'Done', tryInstead: 'Rather try them' }
    : { step: 'Schritt', of: 'von', why: 'Wozu das gut ist', task: 'Jetzt du', doneMsg: 'Geschafft – schön.', openMsg: 'Noch offen – du kannst jederzeit weitergehen.', back: 'Zurück', next: 'Weiter', fold: 'Einklappen', unfold: 'Anleitung zeigen', modal: 'Anleitung {n}/{t} · Fenster schließen, dann weiter', foot: 'Alles hier ist echt: Was du einträgst, bleibt in deiner App.', core: 'Kern-Schritt', extra: 'Zusatz', pause: 'Für heute genug', coreDone: 'Der Kern ist geschafft ✔', coreDoneText: 'Jetzt kennst du die fünf Hauptbereiche: Wo bin ich, Mich regulieren, Mich verbinden, Mich sichern, Zurückschauen. Dazu gibt es noch {n} Zusatzfunktionen (Nachschlagen, Schreiben, Kalender, Briefe, Parkbox und mehr). Wie möchtest du sie kennenlernen?', explainBtn: '📖 Erst erklären lassen', tryBtn: '🧪 Gleich ausprobieren', laterBtn: 'Später – das findest du in den Einstellungen', explainTitle: 'Die Zusatzfunktionen in Kürze', explainDone: 'Fertig', tryInstead: 'Lieber ausprobieren' };

  // a window (form, overlay) is open: stay out of its way
  if (anyModalOpen) {
    return (
      <div className="fixed top-2 inset-x-0 z-[400] flex justify-center px-3 pointer-events-none no-print" data-testid="tour-compact">
        <div className="rounded-full bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-[var(--shadow-md)] px-3.5 py-1.5 text-[12px] text-[var(--color-text)] max-w-full truncate">
          {L.modal.replace('{n}', String(inExtras ? index - CORE_COUNT + 1 : index + 1)).replace('{t}', String(inExtras ? extrasTotal : CORE_COUNT))}
        </div>
      </div>
    );
  }

  const pct = inExtras ? Math.round(((Math.min(index, total) - CORE_COUNT) / extrasTotal) * 100) : Math.round((index / CORE_COUNT) * 100);
  const firstSentence = (txt: string) => txt.split(/(?<=[.!?])\s/)[0];

  return (
    <div className="fixed inset-x-0 bottom-0 z-[250] px-3 animate-in no-print" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom))' }} data-testid="tour-card">
      <div ref={cardRef} className="mx-auto rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-[var(--shadow-lg)] border border-[var(--color-border)] p-3.5" style={{ maxWidth: 480 }}>
        <div className="h-1 rounded-full mb-2.5 overflow-hidden" style={{ background: 'var(--color-border)' }} aria-hidden="true">
          <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'var(--color-primary)', transition: settings.reduceMotion ? 'none' : 'width 0.3s ease' }} />
        </div>

        {isChoice ? (
          <div data-testid="tour-choice">
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-1">{L.coreDone}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{L.coreDoneText.replace('{n}', String(extrasTotal))}</p>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={() => setMode('explain')} data-testid="tour-choice-explain">{L.explainBtn}</Button>
              <Button fullWidth variant="secondary" onClick={() => setMode('try')} data-testid="tour-choice-try">{L.tryBtn}</Button>
              <button type="button" onClick={() => setIndex(total)} className="text-[13px] text-[var(--color-text-faint)] underline underline-offset-2 py-1" data-testid="tour-choice-later">{L.laterBtn}</button>
            </div>
            <div className="mt-1">
              <Button variant="ghost" size="sm" onClick={() => setIndex(CORE_COUNT - 1)}>{L.back}</Button>
            </div>
          </div>
        ) : isExplain ? (
          <div data-testid="tour-explain">
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-1.5">{L.explainTitle}</p>
            <ul className="max-h-[42vh] overflow-y-auto flex flex-col gap-2 pr-1">
              {TOUR_STOPS.slice(CORE_COUNT).map((x) => (
                <li key={x.id} className="text-[12.5px] leading-snug">
                  <span className="text-[var(--color-text)] font-medium">{(en ? x.en : x.de).title}</span>
                  <span className="text-[var(--color-text-muted)]"> – {firstSentence((en ? x.en : x.de).why)}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => setMode(null)}>{L.back}</Button>
              <Button variant="secondary" onClick={() => setMode('try')} data-testid="tour-explain-try">{L.tryInstead}</Button>
              <Button fullWidth onClick={() => setIndex(total)} data-testid="tour-explain-done">{L.explainDone}</Button>
            </div>
          </div>
        ) : isClosing ? (
          <>
            <p className="text-[15px] font-medium text-[var(--color-text)] mb-1">{t.companion.tourClosingTitle}</p>
            <div className="max-h-[38vh] overflow-y-auto">
              <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.companion.tourClosingText}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <Button variant="ghost" onClick={() => { if (mode === 'try') setIndex(total - 1); else { setMode(null); setIndex(CORE_COUNT); } }}>
                {L.back}
              </Button>
              <Button fullWidth onClick={onFinish}>
                {t.companion.tourClosingCta}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-2 mb-1">
              <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]">
                {inExtras ? `${L.extra} ${index - CORE_COUNT + 1} ${L.of} ${extrasTotal}` : `${L.core} ${index + 1} ${L.of} ${CORE_COUNT}`}
              </p>
              <button type="button" onClick={() => setCollapsed((c) => !c)} aria-expanded={!collapsed} className="flex items-center gap-1 text-[12px] text-[var(--color-text-faint)]">
                {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />} {collapsed ? L.unfold : L.fold}
              </button>
            </div>
            <p className="text-[15px] font-medium text-[var(--color-text)]" data-testid="tour-title">{tx!.title}</p>
            {!collapsed && (
              <div className="max-h-[40vh] overflow-y-auto mt-1.5">
                <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)] mb-0.5">{L.why}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-2.5">{tx!.why}</p>
                <div className="rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }}>
                  <p className="text-[11px] uppercase tracking-wide text-[var(--color-primary)] mb-0.5">👉 {L.task}</p>
                  <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed">{tx!.task}</p>
                  {stop!.check && (
                    <p className="mt-1.5 text-[12px] flex items-center gap-1" style={{ color: done ? 'var(--color-primary)' : 'var(--color-text-faint)' }} data-testid="tour-status">
                      {done ? <><Check size={13} /> {L.doneMsg}</> : L.openMsg}
                    </p>
                  )}
                </div>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              {index > 0 && (
                <Button variant="ghost" onClick={() => { if (index === CORE_COUNT) setMode(null); else setIndex(index - 1); }}>
                  {L.back}
                </Button>
              )}
              <Button fullWidth onClick={() => setIndex(index + 1)} data-testid="tour-next">
                {L.next}
              </Button>
            </div>
            {inExtras && (
              <button type="button" onClick={onPause} className="block mx-auto mt-2 text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2" data-testid="tour-pause">
                {L.pause}
              </button>
            )}
            {!collapsed && index === 0 && <p className="text-[11px] text-[var(--color-text-faint)] text-center mt-2">{L.foot}</p>}
          </>
        )}
      </div>
    </div>
  );
}
