import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { useRegisterModalOpen } from '../../state/ModalStackContext';
import type { LetterToSelf } from './lettersRepo';

interface LetterEnvelopeProps {
  letter: LetterToSelf;
  alreadyOpen: boolean;
  onClose: () => void;
  onOpened: () => void;
}

/**
 * Priority 18 — deliberately simple envelope → letter reveal, not an
 * elaborate animation sequence. If the letter was already opened
 * before (browsing "Bereits geöffnet"), it shows straight away rather
 * than replaying the reveal each time.
 */
export function LetterEnvelope({ letter, alreadyOpen, onClose, onOpened }: LetterEnvelopeProps) {
  const t = useT();
  useRegisterModalOpen(true);
  const { settings } = useSettings();
  const [revealed, setRevealed] = useState(alreadyOpen);

  return createPortal(
    <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.5)] flex items-center justify-center px-6" onClick={onClose}>
      <button onClick={onClose} aria-label={t.common.close} className="absolute top-5 right-5 text-white/80 p-2">
        <X size={22} />
      </button>

      {!revealed ? (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setRevealed(true);
            onOpened();
          }}
          className="flex flex-col items-center gap-4"
        >
          <EnvelopeIllustration />
          <span className="text-[14px] text-white/90">{t.briefAnMich.tapToOpen}</span>
        </button>
      ) : (
        <div
          className="rounded-[8px] max-w-[380px] w-full max-h-[80vh] overflow-y-auto p-6 shadow-2xl"
          style={{ background: '#FBF6EA', animation: settings.reduceMotion ? undefined : 'letter-unfold 0.5s ease-out both' }}
          onClick={(e) => e.stopPropagation()}
        >
          <p
            className="text-[16px] leading-[1.8] whitespace-pre-wrap"
            style={{ fontFamily: 'var(--font-display)', color: '#3A3527' }}
          >
            {letter.text}
          </p>
          <p className="text-[12px] mt-6 pt-4 leading-relaxed" style={{ color: '#8A8168', borderTop: '1px solid #E4D9BE' }}>
            {t.briefAnMich.foundInDiaryNote}
          </p>
        </div>
      )}
    </div>,
    document.body
  );
}

function EnvelopeIllustration() {
  return (
    <svg viewBox="0 0 100 70" width="120" height="84" role="img" aria-hidden="true">
      <rect x="2" y="2" width="96" height="66" rx="4" fill="#F3E9D4" stroke="#C9B98F" strokeWidth="1.5" />
      <path d="M2,6 L50,42 L98,6" stroke="#C9B98F" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
