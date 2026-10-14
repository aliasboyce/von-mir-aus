import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SchmuggelOverlay } from './SchmuggelOverlay';
import { InlineCompanionNote } from './InlineCompanionNote';
import { useSettings } from '../../state/SettingsContext';
import { useModalStack } from '../../state/ModalStackContext';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * "Die 10 Sekunden Schmuggel sollen random am Tag manchmal aufploppen mit
 * ‚Los‘" — while the app is open, the Wesen now and then offers one tiny
 * crack in the wall of functioning. At most three times a day, only
 * between 9 and 20 o'clock, never during a crisis, a dialog or the tour,
 * and never right at app start. "Gerade nicht" simply pushes the next
 * one back; the whole thing can be switched off in the settings. Nothing
 * about it is saved except when the next one is due.
 */
interface PopupState { day: string; count: number; nextDue: number }
const store = createKeyValueStore<PopupState | null>('schmuggel-popup-state', null);

const MAX_PER_DAY = 3;
const FIRST_HOUR = 9;
const LAST_HOUR = 20;
const minutes = (m: number) => m * 60 * 1000;
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const dayKey = () => new Date().toDateString();

function readState(): PopupState {
  const s = store.get();
  if (s && s.day === dayKey()) return s;
  // new day (or first start): first one comes a while after opening the app
  return { day: dayKey(), count: 0, nextDue: Date.now() + minutes(rand(25, 90)) };
}

export function SchmuggelPopup() {
  const { settings } = useSettings();
  const { anyModalOpen } = useModalStack();
  const location = useLocation();
  const en = settings.language === 'en';
  const [showCard, setShowCard] = useState(false);
  const [running, setRunning] = useState(false);

  const enabled = settings.schmuggelPopupEnabled !== false && settings.brainEnabled && settings.companionChosen && settings.introSeen && !settings.tourActive && !settings.nurJetztMode;
  const blockedHere = location.pathname === '/krisenmodus' || location.pathname === '/helfermodus' || location.pathname.startsWith('/inneres-wetter') || location.pathname === '/zugang';

  // refs so the interval always sees the current blocking state
  const anyModalOpenRef = useLatest(anyModalOpen || running);
  const blockedRef = useLatest(blockedHere);

  useEffect(() => {
    if (!enabled) return;
    store.set(readState());
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      const hour = new Date().getHours();
      if (hour < FIRST_HOUR || hour >= LAST_HOUR) return;
      const s = readState();
      if (s.count >= MAX_PER_DAY || Date.now() < s.nextDue) return;
      setShowCard((open) => open || !(anyModalOpenRef.current || blockedRef.current));
    };
    const id = window.setInterval(tick, 20000);
    tick();
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  function later(extraMinutes: [number, number], countIt: boolean) {
    const s = readState();
    store.set({ ...s, count: s.count + (countIt ? 1 : 0), nextDue: Date.now() + minutes(rand(extraMinutes[0], extraMinutes[1])) });
    setShowCard(false);
  }

  if (!enabled) return null;

  return (
    <>
      {showCard && !running && !anyModalOpen && !blockedHere && (
        <div
          data-testid="schmuggel-popup"
          role="dialog"
          aria-label={en ? '10-second smuggle' : '10 Sekunden Schmuggel'}
          className="fixed left-3 right-3 z-[150] mx-auto max-w-[420px] rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-primary)] shadow-[var(--shadow-md)] p-3.5 flex items-center gap-3 animate-in no-print"
          style={{ bottom: 'calc(var(--nav-height, 64px) + env(safe-area-inset-bottom) + 14px)' }}
        >
          <InlineCompanionNote joyBurst="hop" />
          <div className="flex-1 min-w-0">
            <p className="text-[14px] text-[var(--color-text)] leading-snug mb-2">
              {en ? 'A tiny crack in the wall? Just a few seconds of something completely different.' : 'Ein kleiner Riss in der Wand? Nur ein paar Sekunden etwas ganz anderes.'}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => { later([120, 240], true); setRunning(true); }}
                data-testid="schmuggel-popup-los"
                className="px-5 py-1.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]"
              >
                {en ? 'Go' : 'Los'}
              </button>
              <button onClick={() => later([90, 180], false)} className="text-[12.5px] text-[var(--color-text-faint)] underline">
                {en ? 'Not now' : 'Gerade nicht'}
              </button>
            </div>
          </div>
        </div>
      )}
      {running && <SchmuggelOverlay autoStart onClose={() => setRunning(false)} />}
    </>
  );
}

function useLatest<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}
