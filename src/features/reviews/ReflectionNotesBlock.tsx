import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useSettings } from '../../state/SettingsContext';
import { reflectionNotesRepo, reflectionNotesSince } from './reflectionNotes';

/** „Gedanken zu Fragen“: was die Person aus „Fragen zum Nachdenken“ im Rückblick gespeichert hat. */
export function ReflectionNotesBlock({ days }: { days: number }) {
  const en = useSettings().settings.language === 'en';
  const [notes, setNotes] = useState(() => reflectionNotesSince(days));
  if (notes.length === 0) return null;
  const locale = en ? 'en-US' : 'de-DE';
  return (
    <Card data-testid="reflection-notes-block">
      <p className="text-[15px] font-medium text-[var(--color-text)] mb-2">💭 {en ? 'Thoughts on questions' : 'Gedanken zu Fragen'}</p>
      <div className="flex flex-col gap-3">
        {notes.map((n) => (
          <div key={n.id} className="text-[13.5px] leading-relaxed">
            <p className="text-[12px] text-[var(--color-text-faint)]">{new Date(n.createdAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</p>
            <p className="text-[var(--color-text-muted)] italic">{en ? n.questionEn ?? n.question : n.question}</p>
            <p className="text-[var(--color-text)] whitespace-pre-line mt-0.5">{n.answer}</p>
            <button
              type="button"
              onClick={() => {
                reflectionNotesRepo.remove(n.id);
                setNotes(reflectionNotesSince(days));
              }}
              className="text-[11.5px] text-[var(--color-text-faint)] flex items-center gap-1 mt-1"
              aria-label={en ? 'Remove' : 'Entfernen'}
            >
              <Trash2 size={12} /> {en ? 'Remove' : 'Entfernen'}
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}
