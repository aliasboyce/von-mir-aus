import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, LifeBuoy } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { resourcesRepo } from '../resources/resourcesRepo';
import { StepViewer } from '../crisis/StepViewer';
import { commCardsRepo, ensureCommCards } from '../nonverbal/commCardsRepo';
import { DOOR_EVERY, STILLNESS_IMPULSES } from './stillnessImpulses';
import { NurJetztHome } from './NurJetztHome';

const AUTO_MS = 30000;

/**
 * „Nur jetzt“ (Stillstand-Modus): der ganze Bildschirm zeigt immer nur einen kurzen, neutralen Satz.
 * Kein Abhaken, keine Belohnung, keine Warnung, wenn nichts passiert, keine Entscheidung: Ein Tipp irgendwo
 * zeigt den nächsten Satz, ohne Tipp wechselt er nach einer Weile ganz sanft von selbst. Ab und zu erscheint eine
 * Tür: „Jetzt einchecken und diesen Modus verlassen“ – oder „Noch bleiben“. Unten bleiben zwei stille Zeichen
 * (Karten zum Zeigen, Hilfe) und ein kleiner Weg hinaus.
 */
export function StillnessMode() {
  const { settings, updateSettings } = useSettings();
  const navigate = useNavigate();
  const en = settings.language === 'en';
  const [n, setN] = useState(0);
  const [door, setDoor] = useState(false);
  const [cards, setCards] = useState(false);
  const [doors, setDoors] = useState(false);
  const [shown, setShown] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const [cardList, setCardList] = useState(() => commCardsRepo.getAll());
  useEffect(() => { ensureCommCards(en ? 'en' : 'de'); setCardList(commCardsRepo.getAll()); }, [en]);

  // eigene Hilfsmittel/Ressourcen kommen als ruhige Feststellung vor – „es gibt …“, nie „du solltest …“
  const own = useMemo(() => resourcesRepo.getAll().filter((r) => r.hilfsmittelDetails && !r.skillDetails).slice(0, 3).map((r) => r.title), []);
  const sequence = useMemo(() => {
    const base = STILLNESS_IMPULSES.map((s) => (en ? s.en : s.de));
    own.forEach((title, i) => base.splice(8 + i * 7, 0, en ? `You have: ${title}.` : `Es gibt für dich: ${title}.`));
    return base;
  }, [own, en]);

  const advance = useCallback(() => {
    setShown(false);
    window.setTimeout(() => {
      setN((v) => {
        const next = v + 1;
        if (next % DOOR_EVERY === 0) setDoor(true);
        return next;
      });
      setShown(true);
    }, 450);
  }, []);

  useEffect(() => {
    if (door || cards || doors) return;
    timer.current = window.setTimeout(advance, AUTO_MS);
    return () => window.clearTimeout(timer.current);
  }, [n, door, cards, doors, advance]);

  const leaveToCheckin = () => {
    updateSettings({ nurJetztMode: false });
    navigate('/inneres-wetter');
  };
  const leave = () => updateSettings({ nurJetztMode: false });

  if (doors) return <NurJetztHome />;
  const text = sequence[n % sequence.length];
  const ink = 'var(--color-text)';

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex flex-col select-none"
      style={{ background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-surface-muted) 100%)', color: ink }}
      onClick={() => { if (!door && !cards) advance(); }}
      data-testid="stillness"
    >
      <div className="flex-1 flex items-center justify-center px-8 text-center">
        {door ? (
          <div className="flex flex-col items-center gap-4 w-full max-w-[340px]" onClick={(e) => e.stopPropagation()} data-testid="stillness-door">
            <p className="text-[24px] leading-snug mb-2">{en ? 'If you like: check in, and leave this mode.' : 'Wenn du magst: jetzt einchecken und diesen Modus verlassen.'}</p>
            <button onClick={leaveToCheckin} className="w-full min-h-[60px] rounded-full text-[18px] font-medium" style={{ background: 'var(--color-primary)', color: 'var(--color-surface)' }} data-testid="stillness-checkin">
              {en ? 'Check in now' : 'Jetzt einchecken'}
            </button>
            <button onClick={() => setDoor(false)} className="w-full min-h-[56px] rounded-full text-[17px] border" style={{ borderColor: 'var(--color-border-strong)' }} data-testid="stillness-stay">
              {en ? 'Stay a little longer' : 'Noch bleiben'}
            </button>
            <div className="flex flex-col items-center gap-1 mt-2">
              <button onClick={leave} className="min-h-[44px] text-[14px] underline underline-offset-2 text-[var(--color-text-muted)]" data-testid="stillness-leave">{en ? 'Just leave' : 'Nur verlassen'}</button>
              <button onClick={() => { setDoor(false); setDoors(true); }} className="min-h-[44px] text-[14px] underline underline-offset-2 text-[var(--color-text-muted)]">{en ? 'Rather pick something' : 'Lieber etwas aussuchen'}</button>
            </div>
          </div>
        ) : (
          <p
            className="leading-snug font-light max-w-[340px]"
            style={{ fontSize: text.length > 40 ? 28 : 34, opacity: shown ? 1 : 0, transition: 'opacity 450ms ease' }}
            data-testid="stillness-text"
            aria-live="polite"
          >
            {text}
          </p>
        )}
      </div>

      {!door && (
        <div className="flex items-center justify-between px-6 pb-6" style={{ paddingBottom: 'max(24px, env(safe-area-inset-bottom))' }} onClick={(e) => e.stopPropagation()}>
          <button onClick={() => setCards(true)} disabled={cardList.length === 0} aria-label={en ? 'Communication cards' : 'Kommunikationskarten'} className="w-14 h-14 rounded-full flex items-center justify-center text-[24px] opacity-70 disabled:opacity-30" data-testid="stillness-cards">🪧</button>
          <button onClick={() => setDoor(true)} className="min-h-[48px] px-4 text-[13px] text-[var(--color-text-faint)] underline underline-offset-2" data-testid="stillness-door-open">
            {en ? 'Check in & leave' : 'Einchecken & verlassen'}
          </button>
          <button onClick={() => navigate('/krisenmodus')} aria-label={en ? 'I need help' : 'Ich brauche Hilfe'} className="w-14 h-14 rounded-full flex items-center justify-center opacity-70" data-testid="stillness-help"><LifeBuoy size={24} /></button>
        </div>
      )}
      {!door && <ChevronRight size={20} className="absolute left-1/2 -translate-x-1/2 opacity-25" style={{ bottom: 'calc(max(24px, env(safe-area-inset-bottom)) + 72px)' }} aria-hidden="true" />}
      {cards && <StepViewer title={en ? 'Communication cards' : 'Kommunikationskarten'} steps={cardList.map((c) => ({ text: c.text, emoji: c.emoji, color: c.color }))} nav="swipe" onClose={() => setCards(false)} />}
    </div>,
    document.body,
  );
}
