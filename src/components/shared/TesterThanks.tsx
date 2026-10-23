import { ExternalLink } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { TEST_FEEDBACK_URL, TEST_PHASE } from '../../services/testSupport';

const TXT = {
  de: {
    thanks: 'Danke, dass du „von mir aus“ testest.',
    body: 'Wenn dir etwas auffällt – etwas hilft, drückt, fehlt oder nicht funktioniert – kannst du es jederzeit melden. Anonym, ca. 1 Minute, alles freiwillig.',
    cta: 'Etwas melden',
    where: 'Du findest den Link auch jederzeit unter Einstellungen → Test-Version.',
    hintSafari: 'Die Umfrage öffnet sich im Browser. Danach kommst du mit dem Zurück-Pfeil oder über deine App vom Startbildschirm wieder hierher.',
  },
  en: {
    thanks: 'Thank you for testing “von mir aus”.',
    body: 'Whenever you notice something – it helps, weighs on you, is missing or does not work – you can report it. Anonymous, about 1 minute, everything optional.',
    cta: 'Report something',
    where: 'You can always find the link under Settings → Test version.',
    hintSafari: 'The survey opens in the browser. Afterwards use the back arrow or your app on the home screen to come back here.',
  },
};

/** Thank-you from the companion plus the link to the anonymous feedback form (test phase only). */
export function TesterThanks({ compact = false, showWhere = false }: { compact?: boolean; showWhere?: boolean }) {
  const { settings } = useSettings();
  if (!TEST_PHASE) return null;
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  return (
    <div
      className="rounded-[var(--radius-lg)] px-4 py-3.5 text-left"
      style={{ background: 'var(--color-primary-soft)', border: '1px solid var(--color-border)' }}
      data-testid="tester-thanks"
    >
      <p className="text-[14.5px] font-medium text-[var(--color-text)] mb-1">{T.thanks}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{T.body}</p>
      <a
        href={TEST_FEEDBACK_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-[var(--radius-md)] text-[14px] font-medium bg-[var(--color-primary)] text-[var(--color-surface)]"
        data-testid="feedback-survey-link"
      >
        <ExternalLink size={15} />
        {T.cta}
      </a>
      {!compact && <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-2">{T.hintSafari}</p>}
      {showWhere && <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-1">{T.where}</p>}
    </div>
  );
}
