import { InlineCompanionNote } from '../companion/InlineCompanionNote';
import { useSettings } from '../../state/SettingsContext';
import { sharedHeadline, type ShareKind } from '../../services/sharedLinks';

const TXT = {
  de: { sub: 'Das ist ein Vorschlag, kein Muss. Magst du es in deiner App speichern und ausprobieren?', accept: 'Als Idee speichern', later: 'Nicht jetzt' },
  en: { sub: 'This is a suggestion, not a must. Would you like to save it in your app and try it?', accept: 'Save as an idea', later: 'Not now' },
};

export function useSharedIdeaTexts() {
  const { settings } = useSettings();
  return TXT[settings.language === 'en' ? 'en' : 'de'];
}

/** "Anna hat dir einen Ort geschickt – als Idee." Shown at the top of every import page. */
export function SharedIdeaIntro({ kind, from }: { kind?: ShareKind; from?: string }) {
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const T = TXT[lang];
  return (
    <div className="flex items-start gap-3 mb-5" data-testid="shared-idea-intro">
      <InlineCompanionNote />
      <div className="flex-1">
        <p className="text-[15px] text-[var(--color-text)] font-medium">{sharedHeadline(kind, from, lang)}</p>
        <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{T.sub}</p>
      </div>
    </div>
  );
}
