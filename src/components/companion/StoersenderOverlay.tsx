import { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, RefreshCw } from 'lucide-react';
import { InlineCompanionNote } from './InlineCompanionNote';
import { WesenInfoButton } from './WesenInfoButton';
import { INFO_STOERSENDER, STOERSENDER_LINES, STOERSENDER_OWN } from './wesenFunctions';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import { triggerHaptic } from '../../services/haptics';
import { resourcesRepo } from '../../features/resources/resourcesRepo';

/**
 * "Liebevoller Störsender": a direct, warm invitation without any choice —
 * the Wesen takes over the executive function of STARTING ("komm, wir gehen
 * jetzt raus und trinken einen Tee"). Nothing is saved or tracked.
 * "Das geht gerade nicht" is always there and is answered kindly.
 */
export function StoersenderOverlay({ onClose }: { onClose: () => void }) {
  const t = useT();
  useRegisterModalOpen(true);
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [declined, setDeclined] = useState(false);
  const [doing, setDoing] = useState(false);
  /** how much effort is possible right now: 0 = surprise me, 1 = right where I am, 2 = do something small, 3 = get me out of here; null = not chosen yet */
  const [level, setLevel] = useState<0 | 1 | 2 | 3 | null>(null);

  // own things first: favourites, otherwise anything the person has
  const ownTitles = useMemo(() => {
    const all = resourcesRepo.getAll();
    const favs = all.filter((r) => r.favorite);
    return (favs.length > 0 ? favs : all).map((r) => r.title);
  }, []);

  interface Picked { text: string; doing: string }

  function nextLine(prev?: string, lv: 0 | 1 | 2 | 3 | null = level): Picked {
    const pool = lv ? STOERSENDER_LINES.filter((l) => (l.lvl ?? 2) === lv) : STOERSENDER_LINES;
    for (let i = 0; i < 6; i++) {
      const useOwn = ownTitles.length > 0 && lv !== 3 && Math.random() < (lv === 1 ? 0.15 : 0.35);
      let picked: Picked;
      if (useOwn) {
        const tpl = STOERSENDER_OWN[Math.floor(Math.random() * STOERSENDER_OWN.length)];
        const res = ownTitles[Math.floor(Math.random() * ownTitles.length)];
        picked = { text: (en ? tpl.en : tpl.de).replace('{res}', res), doing: `„${res}“` };
      } else {
        const l = pool[Math.floor(Math.random() * pool.length)];
        picked = { text: en ? l.en : l.de, doing: l.doing ? (en ? l.doing.en : l.doing.de) : '' };
      }
      if (picked.text !== prev) return picked;
    }
    const l = pool[0] ?? STOERSENDER_LINES[0];
    return { text: en ? l.en : l.de, doing: '' };
  }

  const [line, setLine] = useState<Picked>(() => nextLine(undefined, 0));
  function choose(lv: 0 | 1 | 2 | 3) {
    setLevel(lv);
    setLine(nextLine(undefined, lv));
  }
  const LEVELS: { lv: 1 | 2 | 3; icon: string; de: string; deSub: string; en: string; enSub: string }[] = [
    { lv: 1, icon: '🌱', de: 'Wenig Aufwand', deSub: 'an Ort und Stelle', en: 'Hardly any effort', enSub: 'right where I am' },
    { lv: 2, icon: '🍵', de: 'Etwas mehr', deSub: 'lass was machen', en: 'A bit more', enSub: 'let’s do something' },
    { lv: 3, icon: '🚪', de: 'Noch mehr', deSub: 'hol mich hier raus', en: 'Even more', enSub: 'get me out of here' },
  ];
  const long = line.text.length > 110;

  return createPortal(
    <div className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in no-print" role="dialog" aria-modal="true" aria-label={en ? INFO_STOERSENDER.title.en : INFO_STOERSENDER.title.de}>
      <div className="absolute flex gap-2" style={{ top: 'max(20px, env(safe-area-inset-top))', right: 20 }}>
        <WesenInfoButton info={INFO_STOERSENDER} />
        <button onClick={onClose} aria-label={t.common.close} className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      {!doing && <InlineCompanionNote />}
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-3">{en ? INFO_STOERSENDER.title.en : INFO_STOERSENDER.title.de}</p>

      {doing ? (
        <div className="flex flex-col items-center w-full animate-in" data-testid="stoersender-doing">
          <p className="text-[24px] text-[var(--color-text)] text-center max-w-[300px] leading-snug mt-2" style={{ fontFamily: 'var(--font-companion)', fontWeight: 700 }}>
            {line.doing
              ? (en ? `Yay, we are now going to ${line.doing}!` : `Juhu, wir tun jetzt: ${line.doing}!`)
              : (en ? 'Yay, we are doing this now!' : 'Juhu, wir tun das jetzt!')}
          </p>
          <div className="wesen-dance-stage" aria-hidden="true">
            <span className="wesen-note wesen-note--1">♪</span>
            <span className="wesen-note wesen-note--2">♫</span>
            <span className="wesen-note wesen-note--3">✨</span>
            <span className="wesen-note wesen-note--4">♪</span>
            <div className="wesen-dance-path">
              <div className="wesen-dance-body">
                <InlineCompanionNote />
              </div>
            </div>
          </div>
          <p className="text-[13px] text-[var(--color-text-muted)] text-center max-w-[260px] leading-relaxed mb-5">
            {en ? 'I keep dancing until you want to go on.' : 'Ich tanze weiter, bis du weiter willst.'}
          </p>
          <button onClick={onClose} data-testid="stoersender-weiter" className="w-full max-w-[260px] px-5 py-3 rounded-full text-[15px] bg-[var(--color-primary)] text-[var(--color-surface)]">
            {en ? 'Go on' : 'Weiter'}
          </button>
        </div>
      ) : level === null && !declined ? (
        <div className="flex flex-col items-center w-full animate-in" data-testid="stoersender-levels">
          <p className="text-[20px] text-[var(--color-text)] text-center max-w-[300px] leading-snug mt-2 mb-6" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {en ? 'How much is possible right now?' : 'Wie viel geht gerade?'}
          </p>
          <div className="flex flex-col gap-3 w-full max-w-[320px]">
            {LEVELS.map((l) => (
              <button key={l.lv} type="button" onClick={() => choose(l.lv)} className="text-left rounded-[var(--radius-lg)] px-4 py-3.5 flex items-center gap-3.5 bg-[var(--color-surface)] border-2" style={{ borderColor: 'var(--color-border)', minHeight: 64 }} data-testid={`stoersender-level-${l.lv}`}>
                <span className="text-[26px]" aria-hidden="true">{l.icon}</span>
                <span>
                  <span className="block text-[16px] text-[var(--color-text)]">{en ? l.en : l.de}</span>
                  <span className="block text-[13px] text-[var(--color-text-muted)]">{en ? l.enSub : l.deSub}</span>
                </span>
              </button>
            ))}
            <button type="button" onClick={() => choose(0)} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]" data-testid="stoersender-level-0">
              {en ? 'No idea – surprise me' : 'Keine Ahnung – überrasch mich'}
            </button>
            <button onClick={() => setDeclined(true)} className="text-[13px] text-[var(--color-text-faint)] underline mt-1">
              {en ? 'That does not work right now' : 'Das geht gerade nicht'}
            </button>
          </div>
        </div>
      ) : declined ? (
        <div className="text-center animate-in">
          <p className="text-[19px] text-[var(--color-text)] leading-relaxed max-w-[290px] mb-6">{en ? 'Okay. Then it is enough that you heard it. I am still here.' : 'Okay. Dann reicht es, dass du es gehört hast. Ich bin trotzdem da.'}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">{t.common.close}</button>
        </div>
      ) : (
        <>
          <p data-testid="stoersender-line" className={`${long ? 'text-[17px]' : 'text-[22px]'} text-[var(--color-text)] text-center max-w-[320px] leading-snug mt-2 mb-8`} style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {line.text}
          </p>
          {level !== 0 && (
            <div className="flex gap-1.5 mb-5" role="group" aria-label={en ? 'Effort' : 'Aufwand'}>
              {LEVELS.map((l) => (
                <button key={l.lv} type="button" onClick={() => choose(l.lv)} aria-pressed={level === l.lv} className="px-3 py-1.5 rounded-full text-[12.5px]" style={{ background: level === l.lv ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: level === l.lv ? 'var(--color-surface)' : 'var(--color-text-muted)' }} data-testid={`stoersender-chip-${l.lv}`}>
                  {l.icon} {en ? l.en : l.de}
                </button>
              ))}
            </div>
          )}
          <div className="flex flex-col items-center gap-3 w-full max-w-[290px]">
            <button
              onClick={() => {
                triggerHaptic('settle', settings);
                setDoing(true);
              }}
              className="w-full px-5 py-3 rounded-full text-[15px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            >
              {en ? 'Okay, doing it' : 'Okay, mach ich'}
            </button>
            <button onClick={() => setLine((p) => nextLine(p.text))} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
              <RefreshCw size={14} /> {en ? 'Another one' : 'Noch eine'}
            </button>
            <button onClick={() => setDeclined(true)} className="text-[13px] text-[var(--color-text-faint)] underline mt-1">
              {en ? 'That does not work right now' : 'Das geht gerade nicht'}
            </button>
          </div>
        </>
      )}
    </div>,
    document.body,
  );
}
