import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { useSettings } from '../../state/SettingsContext';

type Place = 'tagebuch' | 'scrapbook' | 'sammelalbum';

/**
 * Drei Orte zum Festhalten – kurz gegeneinander abgegrenzt, damit klar ist, wofür was da ist,
 * und eine kleine Erklärung, wozu das Ganze gut ist (ohne Druck, nichts muss befüllt werden).
 */
export function MemoryFamily({ current }: { current: Place }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [open, setOpen] = useState(false);
  const places: { id: Place; to: string; emoji: string; de: [string, string]; en: [string, string] }[] = [
    { id: 'tagebuch', to: '/sicherheit/tagebuch', emoji: '📔', de: ['Tagebuch', 'schnell aufschreiben'], en: ['Diary', 'quick notes'] },
    { id: 'scrapbook', to: '/scrapbook', emoji: '📖', de: ['Scrapbook', 'Seiten gestalten'], en: ['Scrapbook', 'design pages'] },
    { id: 'sammelalbum', to: '/sammelalbum', emoji: '🃏', de: ['Sammelalbum', 'Karten von allem, was du hast'], en: ['Collection album', 'cards of all you have'] },
  ];
  return (
    <div className="mb-4" data-testid="memory-family">
      <div className="flex gap-1.5">
        {places.map((p) => {
          const on = p.id === current;
          const c = en ? p.en : p.de;
          const cls = `flex-1 min-w-0 rounded-[var(--radius-md)] px-2 py-2 text-center min-h-[52px] ${on ? 'bg-[var(--color-primary-soft)] border border-[var(--color-primary)]' : 'bg-[var(--color-surface)] border border-[var(--color-border)]'}`;
          const inner = (
            <>
              <span className="block text-[13px] text-[var(--color-text)] truncate"><span aria-hidden="true">{p.emoji} </span>{c[0]}</span>
              <span className="block text-[10.5px] leading-tight text-[var(--color-text-faint)] mt-0.5">{c[1]}</span>
            </>
          );
          return on ? <div key={p.id} className={cls} aria-current="page">{inner}</div> : <Link key={p.id} to={p.to} className={cls} data-testid={`memory-family-${p.id}`}>{inner}</Link>;
        })}
      </div>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} className="flex items-center gap-1 mt-1.5 min-h-[44px] text-[12.5px] text-[var(--color-text-muted)]" data-testid="memory-family-why">
        {en ? 'What is this for?' : 'Wozu ist das gut?'} <ChevronDown size={13} style={{ transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>
      {open && (
        <div className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed animate-in" data-testid="memory-family-text">
          <p className="mb-2">{en
            ? 'What you can see and hold is easier to reach than what only lives in your head – especially in moments when your head is not available. Writing, designing and collecting make your own life visible from the outside: what you have, who is there, what helped.'
            : 'Was du sehen und in der Hand halten kannst, ist leichter erreichbar als etwas, das nur im Kopf ist – gerade in Momenten, in denen der Kopf nicht zugänglich ist. Aufschreiben, Gestalten und Sammeln machen dein Leben von außen sichtbar: was du hast, wer da ist, was geholfen hat.'}</p>
          <p className="mb-2">{en
            ? 'That builds continuity (“this is my story, I have been here before”), shows resources instead of only problems, and gives memories a place. Many people find that reassuring – but nothing here is a duty, and nothing has to be complete.'
            : 'So entsteht Kontinuität („das ist meine Geschichte, ich war schon einmal hier“), du siehst Ressourcen statt nur Probleme, und Erinnerungen bekommen einen Platz. Viele empfinden das als beruhigend – aber nichts davon ist Pflicht, und nichts muss vollständig sein.'}</p>
          <p>{en
            ? 'Diary = fast, plain notes. Scrapbook = take your time and design pages like on paper. Collection album = your people, skills, places and aids from the app as cards (they read what already exists, nothing is entered twice).'
            : 'Tagebuch = schnell und schlicht notieren. Scrapbook = sich Zeit nehmen und Seiten wie auf Papier gestalten. Sammelalbum = deine Menschen, Skills, Orte und Hilfsmittel aus der App als Karten (sie lesen, was es schon gibt – nichts wird doppelt eingetragen).'}</p>
        </div>
      )}
    </div>
  );
}
