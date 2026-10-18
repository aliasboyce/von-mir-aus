import { useState } from 'react';
import { Lock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { checkPin, getLockConfig, lockNow, removeLock, setLockAfter, setPin, validPin } from '../../services/appLock';

type Flow = null | 'set' | 'change' | 'off';

/** Settings card: optional PIN lock and the "Schnell weg" button. */
export function AppLockCard() {
  const { settings, updateSettings } = useSettings();
  const en = settings.language === 'en';
  const [cfg, setCfg] = useState(getLockConfig());
  const [flow, setFlow] = useState<Flow>(null);
  const [cur, setCur] = useState('');
  const [a, setA] = useState('');
  const [b, setB] = useState('');
  const [err, setErr] = useState('');

  const L = en
    ? {
        title: 'App lock (PIN)',
        intro: 'Optional. With a PIN, the app asks for it every time it is opened – so nobody who happens to hold your phone sees your entries.',
        honest: 'This is a privacy screen, not encryption. Please also use your device’s screen lock. If you forget the PIN, the only way out is to reset the app (all entries are deleted) – so make a backup first.',
        set: 'Set a PIN',
        active: 'The lock is on.',
        after: 'Lock again',
        a0: 'at once when I leave the app',
        a1: 'after 1 minute away',
        a5: 'after 5 minutes away',
        a1x: 'only when the app is opened',
        now: 'Lock now',
        change: 'Change PIN',
        off: 'Turn lock off',
        newPin: 'New PIN (4 to 6 digits)',
        again: 'Repeat the PIN',
        current: 'Current PIN',
        save: 'Save',
        cancel: 'Cancel',
        mismatch: 'The two PINs are different.',
        short: 'The PIN needs 4 to 6 digits.',
        wrong: 'That was not the current PIN.',
        qTitle: '“Hide now” button',
        qText: 'A small round button at the bottom left. One tap hides the app behind a neutral screen (just the time) and returns to the start page. Double tap on the time brings the app back – or asks for the PIN if you set one.',
        qLabel: 'Show the “Hide now” button',
      }
    : {
        title: 'App-Sperre (PIN)',
        intro: 'Optional. Mit einer PIN fragt die App bei jedem Öffnen danach – so sieht niemand deine Einträge, der zufällig dein Handy in der Hand hat.',
        honest: 'Das ist ein Sichtschutz, keine Verschlüsselung. Nutze bitte zusätzlich die Bildschirmsperre deines Geräts. Wenn du die PIN vergisst, hilft nur, die App zurückzusetzen (alle Einträge werden gelöscht) – mach also vorher eine Sicherung.',
        set: 'PIN festlegen',
        active: 'Die Sperre ist an.',
        after: 'Wieder sperren',
        a0: 'sofort, wenn ich die App verlasse',
        a1: 'nach 1 Minute Abwesenheit',
        a5: 'nach 5 Minuten Abwesenheit',
        a1x: 'nur beim Öffnen der App',
        now: 'Jetzt sperren',
        change: 'PIN ändern',
        off: 'Sperre ausschalten',
        newPin: 'Neue PIN (4 bis 6 Ziffern)',
        again: 'PIN wiederholen',
        current: 'Aktuelle PIN',
        save: 'Speichern',
        cancel: 'Abbrechen',
        mismatch: 'Die beiden PINs sind verschieden.',
        short: 'Die PIN braucht 4 bis 6 Ziffern.',
        wrong: 'Das war nicht die aktuelle PIN.',
        qTitle: '„Schnell weg“-Knopf',
        qText: 'Ein kleiner runder Knopf unten links. Ein Tipp versteckt die App hinter einem neutralen Bildschirm (nur die Uhrzeit) und springt zur Startseite zurück. Zweimal auf die Uhrzeit tippen holt die App zurück – oder fragt nach der PIN, wenn du eine festgelegt hast.',
        qLabel: '„Schnell weg“-Knopf anzeigen',
      };

  const close = () => { setFlow(null); setCur(''); setA(''); setB(''); setErr(''); };
  const digits = (v: string) => v.replace(/\D/g, '').slice(0, 6);

  async function save() {
    setErr('');
    if (flow !== 'set' && cfg && !(await checkPin(cur))) { setErr(L.wrong); return; }
    if (flow === 'off') { removeLock(); setCfg(null); close(); return; }
    if (!validPin(a)) { setErr(L.short); return; }
    if (a !== b) { setErr(L.mismatch); return; }
    await setPin(a, cfg?.lockAfterMin ?? 1);
    setCfg(getLockConfig());
    close();
  }

  const input = 'w-full px-3 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] text-[18px] tracking-[0.4em]';
  const needCur = flow === 'change' || flow === 'off';
  const needNew = flow === 'set' || flow === 'change';

  return (
    <>
      <Card padding="md" className="mb-3" data-testid="app-lock-card">
        <p className="text-[14px] font-medium text-[var(--color-text)] flex items-center gap-2 mb-1"><Lock size={15} /> {L.title}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{L.intro}</p>
        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-2">{L.honest}</p>
        {!cfg ? (
          <Button className="mt-3" onClick={() => setFlow('set')} data-testid="lock-set">{L.set}</Button>
        ) : (
          <div className="mt-3 flex flex-col gap-2.5">
            <p className="text-[13px] text-[var(--color-primary)]" data-testid="lock-active">{L.active}</p>
            <label className="text-[13px] text-[var(--color-text-muted)]">
              {L.after}
              <select
                className="block w-full mt-1 px-3 py-2 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)] text-[14px]"
                value={cfg.lockAfterMin}
                data-testid="lock-after"
                onChange={(e) => { setLockAfter(Number(e.target.value)); setCfg(getLockConfig()); }}
              >
                <option value={0}>{L.a0}</option>
                <option value={1}>{L.a1}</option>
                <option value={5}>{L.a5}</option>
                <option value={-1}>{L.a1x}</option>
              </select>
            </label>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="secondary" onClick={() => lockNow()} data-testid="lock-now">{L.now}</Button>
              <Button size="sm" variant="secondary" onClick={() => setFlow('change')} data-testid="lock-change">{L.change}</Button>
              <Button size="sm" variant="ghost" onClick={() => setFlow('off')} data-testid="lock-off">{L.off}</Button>
            </div>
          </div>
        )}
      </Card>

      <Card padding="md" className="mb-3">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input type="checkbox" className="mt-1" checked={!!settings.quickExit} onChange={(e) => updateSettings({ quickExit: e.target.checked })} data-testid="quick-exit-toggle" />
          <span>
            <span className="block text-[14px] text-[var(--color-text)]">{L.qLabel}</span>
            <span className="block text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-0.5">{L.qText}</span>
          </span>
        </label>
      </Card>

      <Modal open={flow !== null} onClose={close} title={flow === 'off' ? L.off : flow === 'change' ? L.change : L.set}>
        <div className="flex flex-col gap-3" data-testid="lock-modal">
          {needCur && (
            <label className="text-[13px] text-[var(--color-text-muted)]">{L.current}
              <input className={input} type="password" inputMode="numeric" autoComplete="off" value={cur} onChange={(e) => setCur(digits(e.target.value))} data-testid="lock-in-cur" />
            </label>
          )}
          {needNew && (
            <>
              <label className="text-[13px] text-[var(--color-text-muted)]">{L.newPin}
                <input className={input} type="password" inputMode="numeric" autoComplete="new-password" value={a} onChange={(e) => setA(digits(e.target.value))} data-testid="lock-in-a" />
              </label>
              <label className="text-[13px] text-[var(--color-text-muted)]">{L.again}
                <input className={input} type="password" inputMode="numeric" autoComplete="new-password" value={b} onChange={(e) => setB(digits(e.target.value))} data-testid="lock-in-b" />
              </label>
            </>
          )}
          {err && <p className="text-[13px] text-[var(--color-text)]" role="alert" data-testid="lock-err">{err}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={close}>{L.cancel}</Button>
            <Button fullWidth onClick={() => void save()} data-testid="lock-save">{flow === 'off' ? L.off : L.save}</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
