import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { TestPhaseNote } from './TestPhaseNote';
import { useSettings } from '../../state/SettingsContext';

const TXT = {
  de: {
    title: 'So fängst du an',
    sub: 'Ganz ruhig. Du musst nichts auf einmal – und es geht nichts verloren.',
    points: [
      { icon: '🌱', h: 'Eine Kleinigkeit reicht', t: 'Pro Tag eins – oder gar nichts. Leer lassen ist erlaubt.' },
      { icon: '🎨', h: 'Mach es zu deinem', t: 'Wesen, Farben und Umfang findest du in den Einstellungen. Zu viel? Wähle weniger.' },
      { icon: '🔍', h: 'Stöbere, wie du magst', t: 'Unter „Entdecken“ liegt vieles bereit. Fang mit einem Ding an.' },
      { icon: '🛟', h: '„Das hilft gerade nicht“ geht immer', t: 'Tippe aufs Wesen: Atmen, Orientieren, „Schlag mir was vor“ – alles ein Tipp entfernt.' },
    ],
    moreLabel: 'Noch ein paar Dinge',
    more: [
      { icon: '🌅', h: 'Tag beginnen & abschließen', t: 'Kleine Rituale – du bestimmst, was darin steht.' },
      { icon: '🗂️', h: 'Sammelalbum', t: 'Eigene Karten sammeln. „Mehr Optionen“ nur, wenn du magst.' },
      { icon: '🔒', h: 'Sicherheit & Sperre', t: 'PIN, „Schnell weg“-Knopf und Notfall-Zugang: Einstellungen → Sicherheit & Sperre.' },
      { icon: '🔗', h: 'Alles hängt zusammen', t: 'Ein Eintrag kann an mehreren Orten auftauchen – ohne Kopien.' },
      { icon: '📅', h: 'Nach ein paar Tagen', t: 'Schau, was geholfen hat, und lass den Rest ruhen.' },
    ],
    again: 'Du findest das wieder unter Einstellungen → „So fängst du an“.',
    close: 'Verstanden',
    open: 'So fängst du an',
  },
  en: {
    title: 'How to start',
    sub: 'Take it easy. You do not have to do anything at once – and nothing is lost.',
    points: [
      { icon: '🌱', h: 'One small thing is enough', t: 'One per day – or nothing. Leaving it empty is fine.' },
      { icon: '🎨', h: 'Make it yours', t: 'Companion, colours and scope are in the settings. Too much? Choose less.' },
      { icon: '🔍', h: 'Browse as you like', t: 'Under "Explore" there is a lot. Start with just one thing.' },
      { icon: '🛟', h: '"This does not help right now" is always possible', t: 'Tap the companion: breathing, orienting, "Suggest something" – one tap away.' },
    ],
    moreLabel: 'A few more things',
    more: [
      { icon: '🌅', h: 'Begin & close the day', t: 'Small rituals – you decide what is in them.' },
      { icon: '🗂️', h: 'Collection album', t: 'Collect your own cards. "More options" only if you like.' },
      { icon: '🔒', h: 'Safety & lock', t: 'PIN, "Quick exit" button and emergency access: Settings → Safety & lock.' },
      { icon: '🔗', h: 'Everything is connected', t: 'One entry can show up in several places – without copies.' },
      { icon: '📅', h: 'After a few days', t: 'See what helped and let the rest rest.' },
    ],
    again: 'You find this again under Settings → "How to start".',
    close: 'Got it',
    open: 'How to start',
  },
};

export function startGuideLabel(en: boolean): string {
  return TXT[en ? 'en' : 'de'].open;
}

function GuideRow({ p, small = false }: { p: { icon: string; h: string; t: string }; small?: boolean }) {
  return (
    <div className={`flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] ${small ? 'px-3 py-2.5' : 'px-3.5 py-3'}`} data-testid="start-guide-point">
      <span className="text-[20px] leading-none mt-0.5" aria-hidden>{p.icon}</span>
      <div>
        <p className="text-[14.5px] text-[var(--color-text)]">{p.h}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{p.t}</p>
      </div>
    </div>
  );
}

export function StartGuideContent({ showTestNote = true }: { showTestNote?: boolean }) {
  const { settings } = useSettings();
  const [moreOpen, setMoreOpen] = useState(false);
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  return (
    <div className="flex flex-col gap-2.5" data-testid="start-guide">
      {T.points.map((p, i) => <GuideRow key={i} p={p} />)}
      <button
        type="button"
        onClick={() => setMoreOpen((o) => !o)}
        aria-expanded={moreOpen}
        data-testid="start-guide-more"
        className="flex items-center justify-between rounded-[var(--radius-md)] px-3.5 py-2.5 text-[13.5px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-strong)]"
      >
        <span>{T.moreLabel}</span>
        <ChevronDown size={16} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {moreOpen && T.more.map((p, i) => <GuideRow key={i} p={p} small />)}
      <p className="text-[12.5px] text-[var(--color-text-faint)] leading-relaxed">{T.again}</p>
      {showTestNote && <TestPhaseNote />}
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
