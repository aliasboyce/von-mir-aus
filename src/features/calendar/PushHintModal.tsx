import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';

/** Shown once, the first time something with a reminder is saved:
 * "es muss ein Hinweis gezeigt werden, dass noch keine Push-
 * Benachrichtigungen funktionieren und Erinnerungen nur innerhalb der
 * App angezeigt werden" — said plainly, not hidden in settings. */
export function PushHintModal({ open, onConfirm }: { open: boolean; onConfirm: () => void }) {
  const t = useT();
  return (
    <Modal open={open} onClose={onConfirm} title={t.calendar.pushHintTitle}>
      <p className="text-[14px] text-[var(--color-text)] leading-relaxed mb-5">{t.calendar.pushHintText}</p>
      <Button fullWidth onClick={onConfirm}>
        {t.calendar.pushHintOk}
      </Button>
    </Modal>
  );
}
