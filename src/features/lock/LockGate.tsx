import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Delete } from 'lucide-react';
import { checkPin, getLockConfig, lockNow, unlockNow, uncover, useCovered, useLocked } from '../../services/appLock';
import { resetAllAppData } from '../../services/resetAppData';
import { useSettings } from '../../state/SettingsContext';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

/**
 * Wraps the whole app. While locked (or "schnell weg" covers the screen) the app stays mounted but
 * inert behind an opaque, neutral screen – nothing of it is readable or reachable.
 */
export function LockGate({ children }: { children: ReactNode }) {
  const locked = useLocked();
  const covered = useCovered();
  const hiddenAt = useRef<number | null>(null);

  // come back after a while in the background → lock again
  useEffect(() => {
    const onVis = () => {
      const c = getLockConfig();
      if (!c) return;
      if (document.visibilityState === 'hidden') {
        hiddenAt.current = Date.now();
        if (c.lockAfterMin === 0) lockNow();
      } else if (hiddenAt.current !== null) {
        const away = Date.now() - hiddenAt.current;
        hiddenAt.current = null;
        if (c.lockAfterMin >= 0 && away >= c.lockAfterMin * 60000) lockNow();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const blocked = locked || covered;
  return (
    <>
      <div inert={blocked} aria-hidden={blocked || undefined} style={blocked ? { display: 'contents', visibility: 'hidden' } : { display: 'contents' }}>
        {children}
      </div>
      {locked ? <LockScreen /> : covered ? <CoverScreen /> : null}
    </>
  );
}

function LockScreen() {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const cfg = getLockConfig();
  const len = cfg?.length ?? 4;
  const [pin, setPin] = useState('');
  const [wrong, setWrong] = useState(0);
  const [waitUntil, setWaitUntil] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [forgot, setForgot] = useState(false);
  const busy = useRef(false);

  const waiting = waitUntil > now;
  useEffect(() => {
    if (!waiting) return;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [waiting]);

  async function submit(value: string) {
    if (busy.current) return;
    busy.current = true;
    const ok = await checkPin(value);
    busy.current = false;
    if (ok) {
      setPin('');
      setWrong(0);
      uncover();
      unlockNow();
      return;
    }
    const w = wrong + 1;
    setWrong(w);
    setPin('');
    if (w % 5 === 0) {
      setWaitUntil(Date.now() + Math.min(300, 15 * w) * 1000);
      setNow(Date.now());
    }
  }

  function press(d: string) {
    if (waiting || forgot) return;
    if (d === 'del') {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (!/^\d$/.test(d)) return;
    const next = (pin + d).slice(0, 6);
    setPin(next);
    if (next.length === len) void submit(next);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  const L = en
    ? { title: 'Enter PIN', wrong: 'That was not the PIN.', wait: 'Please wait a moment.', forgot: 'Forgot the PIN?', del: 'Delete', fTitle: 'Forgot the PIN?', fText: 'Your entries are only on this device and the PIN protects them – so there is no way around it. The only way out is to reset the app: all entries are deleted and you start fresh. If you have a backup file, you can restore it afterwards.', fDo: 'Delete everything and start fresh', fBack: 'Back to the PIN' }
    : { title: 'PIN eingeben', wrong: 'Das war nicht die PIN.', wait: 'Bitte einen Moment warten.', forgot: 'PIN vergessen?', del: 'Löschen', fTitle: 'PIN vergessen?', fText: 'Deine Einträge liegen nur auf diesem Gerät, und die PIN schützt sie – deshalb gibt es keinen Umweg. Der einzige Ausweg ist, die App zurückzusetzen: Alle Einträge werden gelöscht und du fängst neu an. Wenn du eine Sicherung als Datei hast, kannst du sie danach wieder einspielen.', fDo: 'Alles löschen und neu anfangen', fBack: 'Zurück zur PIN' };

  return (
    <div className="fixed inset-0 z-[10000] flex flex-col items-center justify-center px-6" style={{ background: '#f3f3f1', color: '#1f1f1f' }} data-testid="lock-screen" role="dialog" aria-modal="true" aria-label={L.title}>
      {forgot ? (
        <div className="max-w-[340px] text-center" data-testid="lock-forgot">
          <p className="text-[19px] font-medium mb-3">{L.fTitle}</p>
          <p className="text-[14.5px] leading-relaxed mb-6" style={{ color: '#4a4a4a' }}>{L.fText}</p>
          <button type="button" className="w-full py-3 rounded-full text-[15px] mb-3 border-2" style={{ borderColor: '#1f1f1f' }} onClick={() => { resetAllAppData(); window.location.reload(); }} data-testid="lock-reset">{L.fDo}</button>
          <button type="button" className="text-[14px] underline underline-offset-2 py-2" onClick={() => setForgot(false)}>{L.fBack}</button>
        </div>
      ) : (
        <>
          <p className="text-[18px] mb-6">{L.title}</p>
          <div className="flex gap-3.5 mb-3 h-4" aria-hidden="true" data-testid="lock-dots">
            {Array.from({ length: len }, (_, i) => (
              <span key={i} className="w-3.5 h-3.5 rounded-full border-2" style={{ borderColor: '#1f1f1f', background: i < pin.length ? '#1f1f1f' : 'transparent' }} />
            ))}
          </div>
          <p className="h-5 text-[13px] mb-4" style={{ color: '#6a6a6a' }} role="status" data-testid="lock-msg">{waiting ? L.wait : wrong > 0 ? L.wrong : ''}</p>
          <div className="grid grid-cols-3 gap-3" style={{ opacity: waiting ? 0.4 : 1 }}>
            {KEYS.map((k, i) =>
              k === '' ? (
                <span key={i} />
              ) : (
                <button key={i} type="button" onClick={() => press(k)} aria-label={k === 'del' ? L.del : k} className="w-[72px] h-[72px] rounded-full flex items-center justify-center text-[26px] border" style={{ borderColor: '#c9c9c4', background: '#ffffff' }} data-testid={`lock-key-${k}`}>
                  {k === 'del' ? <Delete size={22} /> : k}
                </button>
              ),
            )}
          </div>
          <button type="button" onClick={() => setForgot(true)} className="mt-8 text-[13px] underline underline-offset-2" style={{ color: '#6a6a6a' }} data-testid="lock-forgot-link">{L.forgot}</button>
        </>
      )}
    </div>
  );
}

/** the neutral screen of "Schnell weg": just the time. Double tap returns (asking for the PIN if there is one). */
function CoverScreen() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(id);
  }, []);
  function back() {
    if (getLockConfig()) {
      lockNow();
      uncover();
    } else {
      uncover();
    }
  }
  return (
    <div className="fixed inset-0 z-[10001] flex flex-col items-center justify-center select-none" style={{ background: '#f3f3f1', color: '#2a2a2a' }} onDoubleClick={back} data-testid="cover-screen" role="presentation">
      <p className="text-[64px] font-light tabular-nums">{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
      <p className="text-[16px]" style={{ color: '#6a6a6a' }}>{now.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}</p>
    </div>
  );
}
