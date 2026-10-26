import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { hasBookCode, lockBook, removeBookCode, setBookCode, validBookWord } from './bookLock';

/** set, change or remove the own word of ONE diary */
export function BookCodeModal({ open, onClose, categoryId, label }: { open: boolean; onClose: () => void; categoryId: string; label: string }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const has = hasBookCode(categoryId);
  const [word, setWord] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const T = en
    ? {
        title: `Own word for “${label}”`,
        intro: 'You can protect this one diary with a word of its own – on top of the app lock, if you use one. The entries stay hidden until the word is entered.',
        note: 'It is a privacy screen, not encryption. If you forget the word, you can reset it with your app PIN (or, without an app lock, remove it).',
        ph: 'One word, at least 3 letters',
        save: has ? 'Change word' : 'Set word',
        bad: 'Please one word without spaces, at least 3 letters.',
        lock: 'Lock this diary now',
        remove: 'Remove the word',
        removeSure: 'Really remove the word? The entries stay, they are just not protected any more.',
        removeYes: 'Yes, remove it',
        keep: 'Keep it',
        close: 'Close',
        active: 'This diary has its own word.',
      }
    : {
        title: `Eigenes Wort für „${label}“`,
        intro: 'Du kannst genau dieses Tagebuch mit einem eigenen Wort schützen – zusätzlich zur App-Sperre, falls du eine nutzt. Die Einträge bleiben verborgen, bis das Wort eingegeben wird.',
        note: 'Das ist ein Sichtschutz, keine Verschlüsselung. Wenn du das Wort vergisst, kannst du es mit deiner App-PIN zurücksetzen (ohne App-Sperre: entfernen).',
        ph: 'Ein Wort, mindestens 3 Buchstaben',
        save: has ? 'Wort ändern' : 'Wort festlegen',
        bad: 'Bitte ein Wort ohne Leerzeichen, mindestens 3 Buchstaben.',
        lock: 'Dieses Tagebuch jetzt sperren',
        remove: 'Wort entfernen',
        removeSure: 'Wort wirklich entfernen? Die Einträge bleiben, sie sind dann nur nicht mehr geschützt.',
        removeYes: 'Ja, entfernen',
        keep: 'Behalten',
        close: 'Schließen',
        active: 'Dieses Tagebuch hat ein eigenes Wort.',
      };

  async function save() {
    if (!validBookWord(word)) {
      setErr(T.bad);
      return;
    }
    setBusy(true);
    const ok = await setBookCode(categoryId, word);
    setBusy(false);
    if (!ok) setErr(T.bad);
    else {
      setWord('');
      setErr('');
      onClose();
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={T.title}>
      <div className="flex flex-col gap-3" data-testid="book-code-modal">
        <p className="text-[13.5px] text-[var(--color-text)]">{T.intro}</p>
        {has && <p className="text-[13px] text-[var(--color-primary)]" data-testid="book-code-active">✓ {T.active}</p>}
        <input
          className="input"
          type="text"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          placeholder={T.ph}
          value={word}
          onChange={(e) => {
            setWord(e.target.value);
            setErr('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && save()}
          data-testid="book-code-input"
        />
        {err && <p className="text-[12.5px] text-[var(--color-danger)]" role="alert">{err}</p>}
        <Button fullWidth onClick={save} disabled={busy || !word.trim()} data-testid="book-code-save">{T.save}</Button>
        {has && (
          <>
            <Button fullWidth variant="secondary" onClick={() => { lockBook(categoryId); onClose(); }} data-testid="book-code-lock">{T.lock}</Button>
            {!confirmRemove ? (
              <button type="button" className="text-[13px] text-[var(--color-text-muted)] underline py-1" onClick={() => setConfirmRemove(true)} data-testid="book-code-remove">{T.remove}</button>
            ) : (
              <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] p-3 flex flex-col gap-2">
                <p className="text-[13px]">{T.removeSure}</p>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { removeBookCode(categoryId); setConfirmRemove(false); onClose(); }} data-testid="book-code-remove-yes">{T.removeYes}</Button>
                  <Button variant="ghost" onClick={() => setConfirmRemove(false)}>{T.keep}</Button>
                </div>
              </div>
            )}
          </>
        )}
        <p className="text-[11.5px] text-[var(--color-text-faint)]">{T.note}</p>
      </div>
    </Modal>
  );
}
