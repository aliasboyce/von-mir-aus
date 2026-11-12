import { useState } from 'react';
import { Check } from 'lucide-react';
import { saveReflectionNote } from '../../features/reviews/reflectionNotes';

/**
 * Optional bei den tiefgründigen „Fragen zum Nachdenken“: aufschreiben und – nur wenn gewünscht –
 * im Rückblick speichern. Wer nur im Kopf nachdenken will, tippt nichts davon an.
 */
export function ReflectionAnswer({ question, questionEn, isEn }: { question: string; questionEn?: string; isEn: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [saved, setSaved] = useState(false);

  if (saved) {
    return (
      <p className="flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)] mb-4" data-testid="reflection-saved">
        <Check size={14} /> {isEn ? 'Saved in your review.' : 'Im Rückblick gespeichert.'}
      </p>
    );
  }
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-[13px] text-[var(--color-primary)] underline mb-4" data-testid="reflection-open">
        {isEn ? 'Write it down (optional)' : 'Aufschreiben (optional)'}
      </button>
    );
  }
  return (
    <div className="w-full max-w-[300px] flex flex-col gap-2 mb-4" data-testid="reflection-box">
      <textarea
        className="input"
        rows={4}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={isEn ? 'Your thoughts – only if you like …' : 'Deine Gedanken – nur wenn du magst …'}
        data-testid="reflection-input"
      />
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            saveReflectionNote(question, questionEn, text);
            setSaved(true);
          }}
          className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-40"
          data-testid="reflection-save"
        >
          {isEn ? 'Save in review' : 'Im Rückblick speichern'}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-3 py-2 rounded-full text-[13px] text-[var(--color-text-faint)]">
          {isEn ? 'Just think' : 'Nur nachdenken'}
        </button>
      </div>
    </div>
  );
}
