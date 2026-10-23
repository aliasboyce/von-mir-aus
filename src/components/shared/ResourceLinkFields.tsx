import { Link as LinkIcon } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';
import { LinkPreview } from './LinkPreview';

export type LinkKind = 'skill' | 'hilfsmittel' | 'ort' | 'aktivitaet' | 'generic';

/** Adds https:// when someone pastes "open.spotify.com/…" without it. */
export function normalizeLink(raw: string | undefined): string | undefined {
  const v = (raw ?? '').trim();
  if (!v) return undefined;
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v;
  return `https://${v}`;
}

const TXT = {
  de: {
    title: '🔗 Link (optional)',
    placeholder: 'Link hier einfügen',
    noteLabel: 'Wofür ist der Link? (optional)',
    notePlaceholder: 'z. B. Der Song, der mich trägt',
    ideas: 'Ideen für einen Link',
    base: [
      'Dein Lieblingssong, zum Beispiel bei Spotify',
      'Lieblings-Pins von Pinterest, Videos, Sprüche oder Bilder, die dich aufbauen',
      'Ein Film oder eine Serie bei Netflix, die für dich Comfort bedeutet',
    ],
    ort: ['Die Route von Google Maps zu deinem Lieblingsort', 'Die Wegbeschreibung zur Therapie, für Momente ohne Orientierung', 'Die Website des Ortes, mit Öffnungszeiten'],
    aktivitaet: ['Eine Anleitung oder ein Video dazu', 'Die Playlist, die dazu gehört', 'Die Seite, auf der du es buchst oder nachlesen kannst'],
    hilfsmittel: ['Der Shop oder die Seite, wo du es wieder bekommst', 'Eine App im Store', 'Das Video, das zeigt, wie du es nutzt'],
    skill: ['Eine Audio- oder Videoanleitung, die du magst', 'Die Playlist, die beim Üben hilft', 'Eine Seite, auf der die Übung erklärt wird'],
    how: 'Einfach den Link kopieren und hier einfügen. Beim Öffnen landest du im Browser deines Handys.',
  },
  en: {
    title: '🔗 Link (optional)',
    placeholder: 'Paste the link here',
    noteLabel: 'What is the link for? (optional)',
    notePlaceholder: 'e.g. The song that carries me',
    ideas: 'Ideas for a link',
    base: [
      'Your favourite song, for example on Spotify',
      'Favourite Pinterest pins, videos, sayings or pictures that lift you up',
      'A film or series on Netflix that means comfort to you',
    ],
    ort: ['The Google Maps route to your favourite place', 'The directions to therapy, for moments without orientation', 'The place’s website, with opening hours'],
    aktivitaet: ['A guide or video for it', 'The playlist that goes with it', 'The page where you book it or read about it'],
    hilfsmittel: ['The shop or page where you can get it again', 'An app in the store', 'The video that shows how you use it'],
    skill: ['An audio or video guide you like', 'The playlist that helps while practising', 'A page that explains the exercise'],
    how: 'Just copy the link and paste it here. When you open it, you land in your phone’s browser.',
  },
};

interface ResourceLinkFieldsProps {
  kind: LinkKind;
  link: string;
  note: string;
  onLink: (v: string) => void;
  onNote: (v: string) => void;
}

/**
 * The same link field on every kind of resource (skill, Hilfsmittel,
 * Ort, Aktivität): something that is already somewhere else — a song,
 * a route, a pin, a film — can simply be attached. The ideas below the
 * field are the app's own examples of what that can mean.
 */
export function ResourceLinkFields({ kind, link, note, onLink, onNote }: ResourceLinkFieldsProps) {
  const { settings } = useSettings();
  const T = TXT[settings.language === 'en' ? 'en' : 'de'];
  const specific = kind === 'generic' ? [] : T[kind];
  const ideas = [...specific, ...T.base];
  return (
    <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
      <p className="text-[13px] font-semibold text-[var(--color-text)] mb-2 flex items-center gap-1.5">
        <LinkIcon size={14} /> {T.title.replace('🔗 ', '')}
      </p>
      <input className="input" type="text" inputMode="url" autoCapitalize="none" autoCorrect="off" placeholder={T.placeholder} value={link} onChange={(e) => onLink(e.target.value)} />
      <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{T.how}</p>
      {link.trim() && <div className="mt-2.5"><LinkPreview url={normalizeLink(link)} compact /></div>}
      <label className="flex flex-col gap-1.5 mt-3">
        <span className="text-[13px] font-medium text-[var(--color-text-muted)]">{T.noteLabel}</span>
        <input className="input" placeholder={T.notePlaceholder} value={note} onChange={(e) => onNote(e.target.value)} />
      </label>
      <details className="mt-3">
        <summary className="text-[12.5px] text-[var(--color-primary)] cursor-pointer">{T.ideas}</summary>
        <ul className="mt-1.5 flex flex-col gap-1 text-[12.5px] text-[var(--color-text-muted)] list-disc pl-5">
          {ideas.map((i) => (
            <li key={i}>{i}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
