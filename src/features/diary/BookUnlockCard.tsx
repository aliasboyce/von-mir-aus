import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { checkPin, getLockConfig } from '../../services/appLock';
import { removeBookCode, unlockBook } from './bookLock';

/** shown instead of the entries of a diary that has its own word */
export function BookUnlockCard({ categoryId, label, count }: { categoryId: string; label: string; count: number }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const [word, setWord] = useState('');
  const [wrong, setWrong] = useState(false);
  const [forgot, setForgot] = useState(false);
  const [pin, setPin] = useState('');
  const [pinWrong, setPinWrong] = useState(false);
  const [busy, setBusy] = useState(false);
  const hasAppLock = !!getLockConfig();

  const T = en
    ? { title: `“${label}” is closed`, sub: `${count} ${count === 1 ? 'entry' : 'entries'} hidden. Enter the word of this diary.`, ph: 'The word', open: 'Open', wrong: 'That is not the word. Try again, no rush.', forgot: 'Forgot the word?', pinAsk: hasAppLock ? 'Enter your app PIN to remove the word. Your entries stay.' : 'You have no app lock, so the word can be removed here. Your entries stay.', pinPh: 'App PIN', pinWrong: 'That PIN does not fit.', removeWord: 'Remove the word', back: 'Back' }
    : { title: `„${label}“ ist verschlossen`, sub: `${count} ${count === 1 ? 'Eintrag' : 'Einträge'} verborgen. Gib das Wort dieses Tagebuchs ein.`, ph: 'Das Wort', open: 'Öffnen', wrong: 'Das ist nicht das Wort. Versuch es gern nochmal, ohne Eile.', forgot: 'Wort vergessen?', pinAsk: hasAppLock ? 'Gib deine App-PIN ein, um das Wort zu entfernen. Deine Einträge bleiben.' : 'Du hast keine App-Sperre, deshalb kann das Wort hier entfernt werden. Deine Einträge bleiben.', pinPh: 'App-PIN', pinWrong: 'Die PIN passt nicht.', removeWord: 'Wort entfernen', back: 'Zurück' };

  async function open() {
    if (busy || !word.trim()) return;
    setBusy(true);
    const ok = await unlockBook(categoryId, word);
    setBusy(false);
    setWrong(!ok);
    if (ok) setWord('');
  }

  async function removeViaPin() {
    if (hasAppLock) {
      setBusy(true);
      const ok = await checkPin(pin);
      setBusy(false);
      if (!ok) {
        setPinWrong(true);
        return;
      }
    }
    removeBookCode(categoryId);
  }

  return (
    <Card className="mb-5" data-testid="book-unlock">
      <div className="flex items-center gap-2 mb-1">
        <Lock size={16} className="text-[var(--color-primary)]" />
        <h2 className="text-[16px]">{T.title}</h2>
      </div>
      {!forgot ? (
        <>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{T.sub}</p>
          <input
            className="input mb-2"
            type="password"
            autoComplete="off"
            autoCapitalize="none"
            placeholder={T.ph}
            value={word}
            onChange={(e) => {
              setWord(e.target.value);
              setWrong(false);
            }}
            onKeyDown={(e) => e.key === 'Enter' && open()}
            data-testid="book-unlock-input"
          />
          {wrong && <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2" role="alert" data-testid="book-unlock-wrong">{T.wrong}</p>}
          <Button fullWidth onClick={open} disabled={busy || !word.trim()} data-testid="book-unlock-open">{T.open}</Button>
          <button type="button" className="text-[12.5px] text-[var(--color-text-muted)] underline mt-3" onClick={() => setForgot(true)} data-testid="book-unlock-forgot">{T.forgot}</button>
        </>
      ) : (
        <>
          <p className="text-[13px] text-[var(--color-text)] mb-3">{T.pinAsk}</p>
          {hasAppLock && (
            <input className="input mb-2" type="password" inputMode="numeric" autoComplete="off" placeholder={T.pinPh} value={pin} onChange={(e) => { setPin(e.target.value); setPinWrong(false); }} data-testid="book-unlock-pin" />
          )}
          {pinWrong && <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2" role="alert">{T.pinWrong}</p>}
          <div className="flex gap-2">
            <Button onClick={removeViaPin} disabled={busy || (hasAppLock && !pin)} data-testid="book-unlock-remove">{T.removeWord}</Button>
            <Button variant="ghost" onClick={() => setForgot(false)}>{T.back}</Button>
          </div>
        </>
      )}
    </Card>
  );
}
