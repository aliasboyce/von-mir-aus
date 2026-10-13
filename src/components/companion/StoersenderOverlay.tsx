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

  // own things first: favourites, otherwise anything the person has
  const ownTitles = useMemo(() => {
    const all = resourcesRepo.getAll();
    const favs = all.filter((r) => r.favorite);
    return (favs.length > 0 ? favs : all).map((r) => r.title);
  }, []);

  function nextLine(prev?: string): string {
    for (let i = 0; i < 6; i++) {
      const useOwn = ownTitles.length > 0 && Math.random() < 0.35;
      let text: string;
      if (useOwn) {
        const tpl = STOERSENDER_OWN[Math.floor(Math.random() * STOERSENDER_OWN.length)];
        const res = ownTitles[Math.floor(Math.random() * ownTitles.length)];
        text = (en ? tpl.en : tpl.de).replace('{res}', res);
      } else {
        const l = STOERSENDER_LINES[Math.floor(Math.random() * STOERSENDER_LINES.length)];
        text = en ? l.en : l.de;
      }
      if (text !== prev) return text;
    }
    return en ? STOERSENDER_LINES[0].en : STOERSENDER_LINES[0].de;
  }

  const [line, setLine] = useState(() => nextLine());

  return createPortal(
    <div className="fixed inset-0 z-[240] bg-[var(--color-bg)] flex flex-col items-center px-6 py-14 overflow-y-auto animate-in no-print" role="dialog" aria-modal="true" aria-label={en ? INFO_STOERSENDER.title.en : INFO_STOERSENDER.title.de}>
      <div className="absolute flex gap-2" style={{ top: 'max(20px, env(safe-area-inset-top))', right: 20 }}>
        <WesenInfoButton info={INFO_STOERSENDER} />
        <button onClick={onClose} aria-label={t.common.close} className="w-10 h-10 rounded-full bg-[var(--color-surface)] shadow-[var(--shadow-sm)] flex items-center justify-center">
          <X size={20} />
        </button>
      </div>

      <InlineCompanionNote />
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-5 mb-3">{en ? INFO_STOERSENDER.title.en : INFO_STOERSENDER.title.de}</p>

      {declined ? (
        <div className="text-center animate-in">
          <p className="text-[19px] text-[var(--color-text)] leading-relaxed max-w-[290px] mb-6">{en ? 'Okay. Then it is enough that you heard it. I am still here.' : 'Okay. Dann reicht es, dass du es gehört hast. Ich bin trotzdem da.'}</p>
          <button onClick={onClose} className="px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">{t.common.close}</button>
        </div>
      ) : (
        <>
          <p data-testid="stoersender-line" className="text-[22px] text-[var(--color-text)] text-center max-w-[300px] leading-snug mt-2 mb-8" style={{ fontFamily: 'var(--font-companion)', fontWeight: 600 }}>
            {line}
          </p>
          <div className="flex flex-col items-center gap-3 w-full max-w-[290px]">
            <button
              onClick={() => {
                triggerHaptic('settle', settings);
                onClose();
              }}
              className="w-full px-5 py-3 rounded-full text-[15px] bg-[var(--color-primary)] text-[var(--color-surface)]"
            >
              {en ? 'Okay, doing it' : 'Okay, mach ich'}
            </button>
            <button onClick={() => setLine((p) => nextLine(p))} className="flex items-center justify-center gap-2 w-full px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
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
