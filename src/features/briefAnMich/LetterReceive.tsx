import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { deliverTextFile } from '../../services/fileShare';
import { buildLetterArrivalIcs } from '../../services/icsExport';
import { pendingLetterStore } from './lettersRepo';
import { decodeLetter, extractToken, parseLetterFile, importLetter, type SharedLetterPayload } from './letterShare';

/** Preview of an incoming letter + "put into my app". The text itself stays sealed. */
export function LetterPreview({ payload, showIosHint = false }: { payload: SharedLetterPayload; showIosHint?: boolean }) {
  const t = useT();
  const b = t.briefAnMich;
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [result, setResult] = useState<'saved' | 'duplicate' | null>(null);
  const at = new Date(payload.at);
  const already = at.getTime() <= Date.now();
  const whenStr = at.toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const whenText = settings.language === 'de' ? `am ${whenStr}` : `on ${whenStr}`;

  return (
    <Card className="flex flex-col gap-3 animate-in" data-testid="letter-preview">
      <div className="flex items-center gap-3">
        <Mail size={22} className="text-[var(--color-primary)] flex-shrink-0" />
        <p className="text-[15px] text-[var(--color-text)] leading-snug">
          {b.receiveFromTitle.replace('{name}', payload.from || b.receiveFromSomeone)}
        </p>
      </div>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
        {already ? b.receiveArrivedAlready : b.receiveArrivesPending.replace('{when}', whenText)}
      </p>

      {result === null ? (
        <Button
          fullWidth
          data-testid="letter-accept"
          onClick={() => { setResult(importLetter(payload)); pendingLetterStore.set(null); }}
        >
          {b.receiveAcceptCta}
        </Button>
      ) : (
        <div className="flex flex-col gap-3" data-testid="letter-accepted">
          <p className="text-[13px] text-[var(--color-text)] flex items-start gap-1.5 leading-relaxed">
            <Check size={14} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            {result === 'duplicate' ? b.receiveDuplicate : already ? b.receiveSavedNow : b.receiveSaved}
          </p>
          {!already && result === 'saved' && (
            <div>
              <Button
                variant="secondary"
                fullWidth
                data-testid="letter-ics"
                onClick={() => deliverTextFile(buildLetterArrivalIcs(at, b.receiveIcsTitle, t.common.appName), 'von-mir-aus-brief.ics', 'text/calendar', b.receiveIcsTitle)}
              >
                {b.receiveIcsCta}
              </Button>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5 leading-relaxed">{b.receiveIcsHint}</p>
            </div>
          )}
          <div className="flex gap-3 text-[13px]">
            <Link to="/" className="text-[var(--color-primary)]">{b.receiveToHome} →</Link>
            <Link to="/entdecken/brief-an-mich" className="text-[var(--color-primary)]">{b.receiveToLetters} →</Link>
          </div>
        </div>
      )}
      {showIosHint && result === null && <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{b.receiveIosHint}</p>}
    </Card>
  );
}

/** Paste a link/code or choose a file, then show the preview. */
export function LetterReceivePanel({ onClose }: { onClose: () => void }) {
  const t = useT();
  const b = t.briefAnMich;
  const [input, setInput] = useState('');
  const [payload, setPayload] = useState<SharedLetterPayload | null>(null);
  const [invalid, setInvalid] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function check() {
    setInvalid(false);
    setPayload(null);
    const token = extractToken(input);
    const p = token ? await decodeLetter(token) : null;
    if (p) setPayload(p);
    else setInvalid(true);
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setInvalid(false);
    setPayload(null);
    const p = parseLetterFile(await file.text());
    if (p) setPayload(p);
    else setInvalid(true);
  }

  return (
    <Card className="mb-6 flex flex-col gap-3 animate-in" data-testid="letter-receive">
      <p className="text-[16px] text-[var(--color-text)]">{b.receiveTitle}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{b.receiveIntro}</p>
      <textarea className="input" rows={3} placeholder={b.receivePastePlaceholder} value={input} onChange={(e) => setInput(e.target.value)} data-testid="letter-paste" />
      <div className="flex gap-2">
        <Button fullWidth onClick={check} disabled={!input.trim()} data-testid="letter-check">{b.receiveCheckCta}</Button>
        <Button fullWidth variant="secondary" onClick={() => fileRef.current?.click()}>{b.receiveFileCta}</Button>
        <input ref={fileRef} type="file" accept=".json,application/json" className="hidden" data-testid="letter-file" onChange={(e) => { void onFile(e.target.files?.[0]); e.target.value = ''; }} />
      </div>
      {invalid && <p className="text-[12.5px] text-[var(--color-accent-clay)] leading-relaxed" data-testid="letter-invalid">{b.receiveInvalid}</p>}
      {payload && <LetterPreview payload={payload} />}
      <Button variant="ghost" onClick={onClose}>{t.common.close}</Button>
    </Card>
  );
}
