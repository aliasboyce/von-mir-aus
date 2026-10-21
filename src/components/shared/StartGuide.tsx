import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useSettings } from '../../state/SettingsContext';

const TXT = {
  de: {
    title: 'So fängst du am besten an',
    sub: 'Die App ist ein Baukasten. Sie hilft erst, wenn sie zu dir passt – und das darf langsam gehen.',
    points: [
      { icon: '🌱', h: 'Du musst nichts auf einmal einrichten', t: 'Nimm dir pro Tag eine Kleinigkeit vor – oder gar nichts. Leer lassen ist erlaubt. Es geht nichts verloren.' },
      { icon: '🎨', h: 'Zuerst: dass es sich nach dir anfühlt', t: 'Such dir ein Wesen oder Tier, eine Welt und Farben aus (Einstellungen). Wenn dir ein Teil zu viel ist, wähle weniger Umfang oder blende ihn aus.' },
      { icon: '🔍', h: 'Dann: einmal in Ruhe stöbern', t: 'Unter „Entdecken“ liegt vieles bereit. Du musst nichts davon nutzen. Schau, was dich neugierig macht oder entlastet – und fang mit genau einem Ding an.' },
      { icon: '🧩', h: 'Danach: anpassen, bis es hilft', t: 'Ändere Namen, Bilder, Zeiten, Schritte. Eine Routine mit 2 statt 6 Karten ist auch eine Routine. Was nicht passt: „Das hilft gerade nicht“ – das geht immer.' },
      { icon: '🔗', h: 'Alles hängt zusammen', t: 'Eine neue Schutzstrategie kann zugleich ein Garten-Eintrag und eine Routine sein – es bleibt ein einziger Eintrag, nicht mehrere Kopien. Hindernisse und alte Schutzstrategien verknüpfst du dort, wo du etwas anlegst.' },
      { icon: '📅', h: 'Nach ein paar Tagen', t: 'Schau, was wirklich geholfen hat, und lass den Rest ruhen. Die App soll nicht mehr werden, nur klarer.' },
    ],
    again: 'Diese Seite findest du wieder unter Einstellungen → „So fängst du an“.',
    close: 'Verstanden',
    open: 'So fängst du am besten an',
  },
  en: {
    title: 'How to start',
    sub: 'The app is a toolkit. It only helps once it fits you – and that is allowed to take time.',
    points: [
      { icon: '🌱', h: 'You do not have to set everything up at once', t: 'Take one small thing per day – or nothing. Leaving it empty is fine. Nothing is lost.' },
      { icon: '🎨', h: 'First: make it feel like yours', t: 'Pick a being or animal, a world and colours (Settings). If a part is too much, choose a smaller scope or hide it.' },
      { icon: '🔍', h: 'Then: browse in peace', t: 'Under "Explore" there is a lot. You do not have to use any of it. See what makes you curious or eases things – and start with just one.' },
      { icon: '🧩', h: 'Then: adjust until it helps', t: 'Change names, pictures, times, steps. A routine with 2 cards instead of 6 is still a routine. If something does not fit: "This does not help right now" – always possible.' },
      { icon: '🔗', h: 'Everything is connected', t: 'A new protection strategy can be a garden entry and a routine at the same time – still one single entry, not several copies. Link obstacles and old strategies where you create something.' },
      { icon: '📅', h: 'After a few days', t: 'See what really helped and let the rest rest. The app should not become more, only clearer.' },
    ],
    again: 'You find this page again under Settings → "How to start".',
    close: 'Got it',
    open: 'How to start',
  },
};

export function startGuideLabel(en: boolean): string {
  return TXT[en ? 'en' : 'de'].open;
}

export function StartGuideContent() {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  return (
    <div className="flex flex-col gap-3" data-testid="start-guide">
      {T.points.map((p, i) => (
        <div key={i} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3.5 py-3" data-testid="start-guide-point">
          <span className="text-[22px] leading-none mt-0.5" aria-hidden>{p.icon}</span>
          <div>
            <p className="text-[14.5px] text-[var(--color-text)]">{p.h}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{p.t}</p>
          </div>
        </div>
      ))}
      <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed">{T.again}</p>
    </div>
  );
}

export function StartGuideModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  return (
    <Modal open={open} onClose={onClose} title={T.title} subtitle={T.sub}>
      <div data-testid="start-guide-modal">
        <StartGuideContent />
        <div className="mt-4">
          <Button fullWidth onClick={onClose} data-testid="start-guide-close">{T.close}</Button>
        </div>
      </div>
    </Modal>
  );
}

export const START_GUIDE_TEXT = TXT;
