import { Modal } from '../../components/ui/Modal';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';

interface WeatherExplainerModalProps {
  open: boolean;
  onClose: () => void;
}

/** The full "Was ist Inner Weather?" explanation, shared between the Home
 * teaser card and the Inner Weather page itself so there's exactly one
 * version of this text to keep accurate. */
export function WeatherExplainerModal({ open, onClose }: WeatherExplainerModalProps) {
  const t = useT();

  return (
    <Modal open={open} onClose={onClose} title={t.weather.explainerCta}>
      <div className="flex flex-col gap-4">
        <div className="flex items-start gap-3">
          <InlineCompanionNote />
          <p className="text-[14px] text-[var(--color-text)] leading-relaxed flex-1">{t.weather.explainerWhat}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.weather.explainerOriginTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.weather.explainerOrigin}</p>
        </div>
        <div>
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{t.weather.explainerUseTitle}</p>
          <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{t.weather.explainerUse}</p>
        </div>
      </div>
    </Modal>
  );
}
