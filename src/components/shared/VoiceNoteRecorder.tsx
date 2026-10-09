import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Trash2 } from 'lucide-react';
import { useT } from '../../i18n';

const MAX_SECONDS = 45;

/**
 * A short voice note (up to 45 seconds), recorded on the device and kept
 * as a data URL in local storage — nothing is uploaded anywhere. Used for
 * the "Kontext-Anker" of a skill: a few words recorded in a safe moment
 * that bring the context back when the knowledge about the skill is not
 * reachable anymore. Degrades quietly when the browser cannot record or
 * the microphone is refused.
 */
export function VoiceNoteRecorder({ value, onChange }: { value?: string; onChange: (v: string | undefined) => void }) {
  const t = useT();
  const supported = typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && typeof MediaRecorder !== 'undefined';
  const [state, setState] = useState<'idle' | 'recording' | 'denied'>('idle');
  const [seconds, setSeconds] = useState(0);
  const recRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      if (recRef.current && recRef.current.state !== 'inactive') recRef.current.stop();
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = typeof MediaRecorder.isTypeSupported === 'function' && MediaRecorder.isTypeSupported('audio/mp4') ? 'audio/mp4' : 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType: mime });
      const chunks: Blob[] = [];
      rec.ondataavailable = (e) => e.data.size > 0 && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((tr) => tr.stop());
        if (timerRef.current) window.clearInterval(timerRef.current);
        const reader = new FileReader();
        reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : undefined);
        reader.readAsDataURL(new Blob(chunks, { type: mime }));
        setState('idle');
      };
      recRef.current = rec;
      rec.start();
      setSeconds(0);
      setState('recording');
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= MAX_SECONDS && recRef.current?.state === 'recording') recRef.current.stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setState('denied');
    }
  }

  function stop() {
    if (recRef.current?.state === 'recording') recRef.current.stop();
  }

  if (!supported) return <p className="text-[12.5px] text-[var(--color-text-faint)]">{t.resources.voiceUnsupported}</p>;
  return (
    <div className="flex flex-col gap-2">
      {value && state !== 'recording' && (
        <div className="flex items-center gap-2">
          <audio controls src={value} className="flex-1 min-w-0" style={{ height: 36 }} />
          <button type="button" onClick={() => onChange(undefined)} aria-label={t.resources.voiceDelete} className="p-2 text-[var(--color-text-faint)]">
            <Trash2 size={16} />
          </button>
        </div>
      )}
      {state === 'recording' ? (
        <button type="button" onClick={stop} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] text-[var(--color-surface)]" style={{ background: 'var(--color-danger)' }}>
          <Square size={14} /> {t.resources.voiceStop} · {seconds}s
        </button>
      ) : (
        <button type="button" onClick={start} className="flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-[13.5px] border" style={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}>
          <Mic size={15} /> {value ? t.resources.voiceAgain : t.resources.voiceRecord}
        </button>
      )}
      {state === 'denied' && <p className="text-[12px] text-[var(--color-text-faint)]">{t.resources.voiceDenied}</p>}
    </div>
  );
}
