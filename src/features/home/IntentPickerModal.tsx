import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useT } from '../../i18n';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

interface Intent {
  emoji: string;
  labelKey: 'auffangen' | 'orientieren' | 'handeln' | 'verstehen' | 'fuerMich' | 'erforschen' | 'lernen';
}

const INTENTS: Intent[] = [
  { emoji: '🫂', labelKey: 'auffangen' },
  { emoji: '🧭', labelKey: 'orientieren' },
  { emoji: '👣', labelKey: 'handeln' },
  { emoji: '🧠', labelKey: 'verstehen' },
  { emoji: '🌿', labelKey: 'fuerMich' },
  { emoji: '🔎', labelKey: 'erforschen' },
  { emoji: '📖', labelKey: 'lernen' },
];

/**
 * "ChatGPT-Konzept" brief — "Was möchte ich heute?" as a simple way to
 * structure the app's many functions by intent rather than by feature
 * name. Deliberately routes to existing destinations only — nothing
 * new is built here, this is purely a differently-shaped door into
 * what already exists (Krisenmodus, Grounding, Brücken, Zugang,
 * Garten, Entdecken), matching the brief's own explicit caution
 * against adding more modules.
 */
export function IntentPickerModal({ onClose, onOpenGrounding }: { onClose: () => void; onOpenGrounding: () => void }) {
  const t = useT();
  useRegisterModalOpen(true);
  const navigate = useNavigate();

  function go(labelKey: Intent['labelKey']) {
    onClose();
    switch (labelKey) {
      case 'auffangen':
        navigate('/krisenmodus');
        return;
      case 'orientieren':
        onOpenGrounding();
        return;
      case 'handeln':
        navigate('/bruecken');
        return;
      case 'verstehen':
        navigate('/zugang');
        return;
      case 'fuerMich':
        navigate('/entdecken/garten');
        return;
      case 'erforschen':
      case 'lernen':
        navigate('/entdecken');
        return;
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-[230] bg-[rgba(44,42,34,0.35)] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div
        className="bg-[var(--color-surface)] rounded-t-[24px] sm:rounded-[24px] w-full sm:max-w-[420px] max-h-[85vh] overflow-y-auto p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-[18px] text-[var(--color-text)] mb-4">{t.home.intentPickerTitle}</p>
        <div className="flex flex-col gap-2">
          {INTENTS.map((intent) => (
            <button
              key={intent.labelKey}
              onClick={() => go(intent.labelKey)}
              className="flex items-center gap-3 px-4 py-3 rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] text-left"
            >
              <span className="text-[20px] flex-shrink-0">{intent.emoji}</span>
              <span className="text-[14px] text-[var(--color-text)]">{t.home.intentLabels[intent.labelKey]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
