import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Moon, Sun, Shuffle, X, MessageCircle, Sparkles, Compass } from 'lucide-react';
import { LichtCompanion } from './LichtCompanion';
import { DistractionOverlay } from './DistractionOverlay';
import { GroundingOverlay } from './GroundingOverlay';
import { getAnyLichtwesen } from './customLichtwesen';
import { useSettings } from '../../state/SettingsContext';
import { useCompanionSpoken } from '../../state/CompanionSpeechContext';
import { useRegisterHeroCompanion } from '../../state/HeroCompanionContext';
import { getCompanionOffset, setCompanionOffset } from '../../services/companionPosition';
import { getCompanionScale } from '../../services/companionScale';
import { useT } from '../../i18n';
import { playCompanionSound } from '../../services/sounds';
import { pickTip } from './pageTips';
import './companion.css';

interface CompanionDockProps {
  bottomOffset?: number;
  /** 'floating' (default) = small, fixed bottom-right, follows across every
   * page. 'hero' = larger, inline (not fixed), used once by HomePage as the
   * central figure — same tip/menu logic either way, just different
   * positioning and size, so the two never duplicate each other's behavior. */
  variant?: 'floating' | 'hero';
}

// Module-level (survives across SPA navigation, resets on a real page
// reload) — used so a page explanation only auto-appears the first time
// the person visits that page in this session, not every single time they
// navigate back to it. QA requirement: the companion must not feel like it
// pops up on every page.
const seenPagesThisSession = new Set<string>();
const REPEAT_VISIT_CHANCE = 0.12;
// Deliberately a plain module variable, not a setting: "no more tips" is
// meant to last only "for this session/use" per the request — it must
// reset on a real reload, not become a permanent preference.
let autoTipsDisabledThisSession = false;

const TIP_FADE_OUT_MS = 350;

/** How long a tip stays up scales with how much there is to read —
 * previously every triggered line (a quick "Gespeichert." AND a full
 * sentence alike) got the same fixed, quite short duration, and it was
 * even shorter than the automatic page tips. A short confirmation still
 * gets a comfortable minimum; a longer line gets proportionally more
 * time, generous enough to actually finish reading before it goes. */
function readingDurationMs(text: string): number {
  // "Laenger da bleiben"-Auftrag — raised across the board (min
  // 4000->6000, per-word 380->480, cap 12000->18000) so an explanation
  // has genuinely enough time to be read, not just glanced at.
  const words = text.trim().split(/\s+/).length;
  return Math.min(18000, Math.max(6000, 1800 + words * 480));
}

export function CompanionDock({ bottomOffset = 92, variant = 'floating' }: CompanionDockProps) {
  const { settings, updateSettings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const t = useT();
  const spoken = useCompanionSpoken();
  useRegisterHeroCompanion(variant === 'hero');
  const [tip, setTip] = useState<string | null>(null);
  const [tipKind, setTipKind] = useState<'auto' | 'triggered'>('triggered');
  const [tipLeaving, setTipLeaving] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [offset, setOffset] = useState(() => getCompanionOffset());
  const [scale, setScale] = useState(() => getCompanionScale());

  // The floating dock is a single long-lived instance that doesn't remount
  // on navigation, so a plain useState initializer alone would never see
  // a scale change made later in Settings (a different part of the tree,
  // no route change/remount in between). A small custom event, dispatched
  // by the Settings slider, keeps this in sync without needing a full
  // context provider just for one number.
  useEffect(() => {
    function onScaleChange() {
      setScale(getCompanionScale());
    }
    window.addEventListener('companion-scale-change', onScaleChange);
    return () => window.removeEventListener('companion-scale-change', onScaleChange);
  }, []);

  // "Wesen-Fenster am Laptop wieder abgeschnitten (Regression)"-Auftrag
  // — clampOffset itself was already correct (re-reads window/card width
  // fresh on every drag), but nothing re-checked a position the person
  // had ALREADY dragged to if the window was resized afterwards without
  // dragging again (e.g. shrinking the browser after placing the
  // companion near the old edge) — the stored offset could then sit
  // outside the new, smaller bounds. Re-clamping on resize keeps it
  // inside the visible card no matter when the resize happens.
  useEffect(() => {
    // Runs once on mount too — a stored position from a previous,
    // differently-sized window (or a different device entirely) should
    // never be trusted as still valid before the very first resize event.
    function reclamp() {
      setOffset((prev) => {
        const clamped = clampOffset(prev);
        setCompanionOffset(clamped);
        return clamped;
      });
    }
    reclamp();
    window.addEventListener('resize', reclamp);
    return () => window.removeEventListener('resize', reclamp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scale]);
  const [picked, setPicked] = useState(false);
  const [justReleased, setJustReleased] = useState(false);
  const [joyBurst, setJoyBurst] = useState<'hop' | 'spin' | 'wobble' | 'dance' | null>(null);

  // Occasional idle liveliness — not tied to any save/success event, just
  // the companion feeling genuinely present during real quiet stretches.
  // Deliberately rare (checked every 90s, ~20% chance each time — roughly
  // once every 7-8 minutes of continuous idling on average) and only a
  // small, quick burst, never speech: "mehr Lebendigkeit, nicht mehr
  // Reizüberflutung" applies just as much outside the intro as within it.
  useEffect(() => {
    if (settings.reduceMotion || !settings.brainEnabled || settings.brainState !== 'awake') return;
    const interval = setInterval(() => {
      if (Math.random() < 0.2) {
        const variants: Array<'hop' | 'spin' | 'wobble' | 'dance'> = ['hop', 'spin', 'wobble', 'dance'];
        setJoyBurst(variants[Math.floor(Math.random() * variants.length)]);
        setTimeout(() => setJoyBurst(null), 700);
      }
    }, 90_000);
    return () => clearInterval(interval);
  }, [settings.reduceMotion, settings.brainEnabled, settings.brainState]);
  const [distractionOpen, setDistractionOpen] = useState(false);
  const [groundingOpen, setGroundingOpen] = useState(false);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number; moved: boolean } | null>(null);

  const isSleeping = settings.brainState === 'sleeping';
  const being = getAnyLichtwesen(settings.selectedBrainId);

  // Centralizes the fade-out sequence: mark as leaving (triggers the CSS
  // opacity transition), then actually remove the content once the
  // transition has had time to finish — every place that used to call
  // setTip(null) directly goes through here now, so hiding is always
  // gentle, never abrupt, regardless of which timer or button triggered it.
  const tipHideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  function hideTip() {
    setTipLeaving(true);
    if (tipHideTimeoutRef.current) clearTimeout(tipHideTimeoutRef.current);
    tipHideTimeoutRef.current = setTimeout(() => {
      setTip(null);
      setTipLeaving(false);
    }, TIP_FADE_OUT_MS);
  }

  // A specific triggered line (e.g. "gespeichert") always takes priority
  // over the automatic page tip, and re-shows even if the person just
  // dismissed the previous tip — that's the point of triggering it.
  useEffect(() => {
    if (!spoken || !settings.brainEnabled || settings.brainState !== 'awake') return;
    setTip(spoken.text);
    setTipKind('triggered');
    setTipLeaving(false);
    const timeout = setTimeout(hideTip, readingDurationMs(spoken.text));
    if (spoken.joy) {
      // "Wesen soll tanzen wenn etwas abgeschlossen wurde"-Auftrag —
      // joy:true is specifically for genuine completions (see this
      // file's own doc comment above), so it now reliably dances
      // rather than randomly picking one of four reactions — dancing
      // reads as a clearer "you finished something" celebration than
      // a hop/spin/wobble, which fit more ambient, lower-key moments
      // (the periodic idle joy burst above still uses all four for
      // variety, since those aren't tied to a specific completion).
      setJoyBurst('dance');
      const joyTimeout = setTimeout(() => setJoyBurst(null), 800);
      return () => {
        clearTimeout(timeout);
        clearTimeout(joyTimeout);
      };
    }
    return () => clearTimeout(timeout);
  }, [spoken, settings.brainEnabled, settings.brainState]);

  useEffect(() => {
    setTipLeaving(false);
    if (!settings.brainEnabled || settings.brainState !== 'awake' || autoTipsDisabledThisSession) {
      setTip(null);
      return;
    }

    const isFirstVisit = !seenPagesThisSession.has(location.pathname);
    seenPagesThisSession.add(location.pathname);

    if (!isFirstVisit && Math.random() > REPEAT_VISIT_CHANCE) {
      setTip(null);
      return;
    }

    const next = pickTip(location.pathname, isFirstVisit, being.preferredCategories);
    setTip(next);
    setTipKind('auto');
    // Explanations stay up long enough to actually read (scaled to
    // length), but still go away on their own if the person doesn't
    // dismiss them — never a permanent fixture.
    const timeout = setTimeout(hideTip, next ? readingDurationMs(next) : 9000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, settings.brainEnabled, settings.brainState]);

  function requestTip() {
    setMenuOpen(false);
    const next = pickTip(location.pathname, false, being.preferredCategories);
    setTip(next);
    setTipKind('auto');
    setTipLeaving(false);
    setTimeout(hideTip, next ? readingDurationMs(next) : 9000);
  }

  function disableTipsThisSession() {
    autoTipsDisabledThisSession = true;
    hideTip();
  }

  const DRAG_THRESHOLD = 6;
  // Keeps the dock from being dragged somewhere it can no longer be
  // reached — a generous margin from every edge, and never low enough to
  // sit behind the bottom nav.
  const CLAMP_MARGIN = 8;

  function clampOffset(next: { x: number; y: number }): { x: number; y: number } {
    if (typeof window === 'undefined') return next;
    // A larger companion needs a bigger margin from the edges, or scaling
    // up could push part of it off-screen even at a position that was
    // perfectly fine at the default size.
    const sizeAllowance = 60 * scale;
    // "Am Desktop nicht mehr frei verschiebbar, am Handy nicht ganz nach
    // links"-Auftrag — the previous fix always read
    // --app-max-width-desktop (560px), but that value is only what
    // .app-frame actually uses above the 768px breakpoint (see
    // index.css's `@media (min-width: 768px)` block) — below it, the
    // card is capped at the mobile --app-max-width (480px) instead.
    // Assuming 560px on a narrower-than-768px window (a laptop browser
    // that isn't maximized, e.g.) meant the clamp bounds didn't match
    // the card's real rendered width at all, cutting off free movement.
    // Reading whichever variable actually applies at the current width
    // fixes both the desktop and the narrow-viewport case together.
    const rootStyle = getComputedStyle(document.documentElement);
    const desktopMaxWidth = parseFloat(rootStyle.getPropertyValue('--app-max-width-desktop'));
    const mobileMaxWidth = parseFloat(rootStyle.getPropertyValue('--app-max-width'));
    const cardMaxWidth = window.innerWidth >= 768 ? desktopMaxWidth : mobileMaxWidth;
    const effectiveWidth = Math.min(window.innerWidth, cardMaxWidth || window.innerWidth);
    const maxX = sizeAllowance;
    // Slightly less than the full sizeAllowance*2 here specifically —
    // "nicht ganz nach links"-Auftrag: the previous margin left a small
    // but noticeable gap before reaching the true left edge.
    const minX = -(effectiveWidth - sizeAllowance * 1.42);
    const maxY = 0;
    const minY = -(window.innerHeight - bottomOffset - 140 * scale);
    return {
      x: Math.max(minX + CLAMP_MARGIN, Math.min(maxX - CLAMP_MARGIN, next.x)),
      y: Math.max(minY + CLAMP_MARGIN, Math.min(maxY - CLAMP_MARGIN, next.y)),
    };
  }

  function handleDragStart(e: React.PointerEvent) {
    (e.target as Element).setPointerCapture(e.pointerId);
    dragStart.current = { x: e.clientX, y: e.clientY, offsetX: offset.x, offsetY: offset.y, moved: false };
    setPicked(true);
  }

  function handleDragMove(e: React.PointerEvent) {
    if (!dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      dragStart.current.moved = true;
    }
    if (dragStart.current.moved) {
      setOffset(clampOffset({ x: dragStart.current.offsetX + dx, y: dragStart.current.offsetY + dy }));
    }
  }

  function handleDragEnd() {
    if (!dragStart.current) return;
    const wasDrag = dragStart.current.moved;
    dragStart.current = null;
    setPicked(false);
    setJustReleased(true);
    setTimeout(() => setJustReleased(false), 320);
    if (wasDrag) {
      setOffset((current) => {
        setCompanionOffset(current);
        return current;
      });
    } else {
      // Not a drag — treat it as the usual tap that opens the menu.
      setMenuOpen((v) => !v);
    }
  }

  function toggleSleep() {
    setMenuOpen(false);
    if (isSleeping) {
      playCompanionSound('wake', settings);
      updateSettings({ brainState: 'waking' });
      setTimeout(() => updateSettings({ brainState: 'awake' }), 1150);
      return;
    }
    playCompanionSound('sleep', settings);
    updateSettings({ brainState: 'settling' });
    setTimeout(() => updateSettings({ brainState: 'sleeping' }), 850);
  }

  if (!settings.brainEnabled) return null;

  const showTip = tip && !menuOpen;

  if (variant === 'hero') {
    return (
      <div className="flex flex-col items-center gap-3" data-hero-companion-anchor>
        <LichtCompanion size="large" onTap={() => setMenuOpen((v) => !v)} presence={!!showTip} joyBurst={joyBurst} />
        <p className="text-[15px] text-[var(--color-text)] -mt-1" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>{being.name}</p>
        {showTip && (
          <div className={`companion-tip companion-tip--hero${tipLeaving ? ' companion-tip--leaving' : ''}`}>
            <div className="flex-1 min-w-0">
              <span>{tip}</span>
              {tipKind === 'auto' && (
                <button onClick={disableTipsThisSession} className="companion-tip__no-more">
                  {t.companion.noMoreTipsSession}
                </button>
              )}
            </div>
            <button
              onClick={hideTip}
              aria-label={t.companion.dismissHint}
              className="companion-tip__close"
            >
              <X size={13} />
            </button>
          </div>
        )}
        {menuOpen && (
          <div className="companion-menu animate-in" style={{ transform: `scale(${1 / scale})`, transformOrigin: 'bottom right' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="companion-menu__hint">{t.companion.moveHint}</p>
              <button onClick={() => setMenuOpen(false)} aria-label={t.common.close} className="companion-menu__close">
                <X size={15} />
              </button>
            </div>
            <button onClick={requestTip} className="companion-menu__item">
              <MessageCircle size={15} />
              {t.companion.requestTip}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setDistractionOpen(true);
              }}
              className="companion-menu__item"
            >
              <Sparkles size={15} />
              {t.companion.distractMe}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                setGroundingOpen(true);
              }}
              className="companion-menu__item"
            >
              <Compass size={15} />
              <span>
                {t.companion.helpMeOrient}
                <span className="companion-menu__subtext">{t.companion.helpMeOrientSubtext}</span>
              </span>
            </button>
            <button onClick={toggleSleep} className="companion-menu__item">
              {isSleeping ? <Sun size={15} /> : <Moon size={15} />}
              {isSleeping ? t.companion.wake : t.companion.sleep}
            </button>
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/einstellungen#begleiter-einstellungen');
              }}
              className="companion-menu__item"
            >
              <Shuffle size={15} />
              {t.companion.changeCompanion}
            </button>
            <Link to="/einstellungen/wesen-info" onClick={() => setMenuOpen(false)} className="companion-menu__more">
              {t.companion.whatCanIDoLink}
            </Link>
          </div>
        )}
        {distractionOpen && <DistractionOverlay onClose={() => setDistractionOpen(false)} />}
        {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
      </div>
    );
  }

  return (
    <div
      className="companion-dock"
      style={{
        bottom: bottomOffset,
        transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
        touchAction: 'none',
      }}
    >
      {showTip && (
        <div className={`companion-tip${tipLeaving ? ' companion-tip--leaving' : ''}`}>
          <div className="flex-1 min-w-0">
            <span>{tip}</span>
            {tipKind === 'auto' && (
              <button onClick={disableTipsThisSession} className="companion-tip__no-more">
                {t.companion.noMoreTipsSession}
              </button>
            )}
          </div>
          <button
            onClick={hideTip}
            aria-label={t.companion.dismissHint}
            className="companion-tip__close"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {menuOpen && (
        <div className="companion-menu animate-in" style={{ transform: `scale(${1 / scale})`, transformOrigin: 'bottom right' }}>
            <div className="flex items-start justify-between gap-2">
              <p className="companion-menu__hint">{t.companion.moveHint}</p>
              <button onClick={() => setMenuOpen(false)} aria-label={t.common.close} className="companion-menu__close">
                <X size={15} />
              </button>
            </div>
          <button onClick={requestTip} className="companion-menu__item">
            <MessageCircle size={15} />
            {t.companion.requestTip}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setDistractionOpen(true);
            }}
            className="companion-menu__item"
          >
            <Sparkles size={15} />
            {t.companion.distractMe}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              setGroundingOpen(true);
            }}
            className="companion-menu__item"
          >
            <Compass size={15} />
            <span>
              {t.companion.helpMeOrient}
              <span className="companion-menu__subtext">{t.companion.helpMeOrientSubtext}</span>
            </span>
          </button>
          <button onClick={toggleSleep} className="companion-menu__item">
            {isSleeping ? <Sun size={15} /> : <Moon size={15} />}
            {isSleeping ? t.companion.wake : t.companion.sleep}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              navigate('/einstellungen#begleiter-einstellungen');
            }}
            className="companion-menu__item"
          >
            <Shuffle size={15} />
            {t.companion.changeCompanion}
          </button>
          <Link to="/einstellungen/wesen-info" onClick={() => setMenuOpen(false)} className="companion-menu__more">
            {t.companion.whatCanIDoLink}
          </Link>
        </div>
      )}

      <div
        className={['companion-grab-wrap', picked ? 'companion-grab-wrap--picked' : '', justReleased ? 'companion-grab-wrap--released' : '']
          .filter(Boolean)
          .join(' ')}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
      >
        <LichtCompanion size="small" presence={!!showTip} joyBurst={joyBurst} />
      </div>
      {distractionOpen && <DistractionOverlay onClose={() => setDistractionOpen(false)} />}
      {groundingOpen && <GroundingOverlay onClose={() => setGroundingOpen(false)} />}
    </div>
  );
}
