import { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { shareOrCopy } from '../../services/shareOrCopy';
import { deliverTextFile } from '../../services/fileShare';
import { addLetter } from './lettersRepo';
import { newPayload, encodeLetter, buildLetterLink, letterFileContent, type SharedLetterPayload } from './letterShare';

/**
 * Write a letter for another person: it is packed into a link / file the
 * sender passes on; it opens for the receiver at the time chosen here.
 */
export function LetterShareComposer({ onClose }: { onClose: () => void }) {
  const t = useT();
  const b = t.briefAnMich;
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [from, setFrom] = useState(settings.userName ?? '');
  const [to, setTo] = useState('');
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [keepCopy, setKeepCopy] = useState(true);
  const [ready, setReady] = useState<{ payload: SharedLetterPayload; link: string; copyKept: boolean } | null>(null);

  async function create() {
    if (!text.trim() || !date || !from.trim()) return;
    const payload = newPayload(from, to, text, new Date(`${date}T${time}`));
    const token = await encodeLetter(payload);
    if (keepCopy) addLetter(`${b.copyPrefix.replace('{to}', to.trim() || b.shareReadyToFallback)}\n\n${payload.text}`, payload.at);
    setReady({ payload, link: buildLetterLink(token), copyKept: keepCopy });
  }

  if (ready) {
    const when = new Date(ready.payload.at).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    const whenText = settings.language === 'de' ? `am ${when}` : `on ${when}`;
    const who = ready.payload.to || b.shareReadyToFallback;
    return (
      <Card className="mb-6 flex flex-col gap-3 animate-in" data-testid="letter-ready">
        <p className="text-[16px] text-[var(--color-text)]">{b.shareReadyTitle}</p>
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{b.shareReadyText.replace('{when}', whenText).replace('{to}', who)}</p>
        <div className="rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }} data-testid="letter-next-steps">
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-primary)] mb-1">{b.shareNextTitle}</p>
          <ol className="flex flex-col gap-1 pl-4 list-decimal">
            <li className="text-[13px] text-[var(--color-text)] leading-relaxed">{b.shareNext1}</li>
            <li className="text-[13px] text-[var(--color-text)] leading-relaxed">{b.shareNext2}</li>
            <li className="text-[13px] text-[var(--color-text)] leading-relaxed">{b.shareNext3.replace('{when}', whenText)}</li>
          </ol>
        </div>
        {ready.link.length > 6000 && <p className="text-[12px] text-[var(--color-accent-clay)] leading-relaxed">{b.shareTooLong}</p>}
        <Button
          fullWidth
          data-testid="letter-share-link"
          onClick={() => shareOrCopy({ title: b.shareTitle, text: b.shareLinkMessage, url: ready.link }, b.shareLinkCopied)}
        >
          {b.shareLinkCta}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          data-testid="letter-copy-link"
          onClick={() => shareOrCopy({ url: ready.link }, b.shareLinkCopied)}
        >
          {b.shareCopyCta}
        </Button>
        <Button
          fullWidth
          variant="secondary"
          data-testid="letter-save-file"
          onClick={() => deliverTextFile(letterFileContent(ready.payload), 'von-mir-aus-brief.json', 'application/json', b.shareTitle)}
        >
          {b.shareFileCta}
        </Button>
        <p className="text-[12px] text-[var(--color-text-faint)] leading-relaxed">{ready.copyKept ? b.shareCopyKeptNote : b.shareNoCopyNote}</p>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => { setReady(null); setText(''); setDate(''); }}>{b.shareAnother}</Button>
          <Button variant="ghost" onClick={onClose}>{t.common.close}</Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mb-6 flex flex-col gap-3 animate-in" data-testid="letter-composer">
      <p className="text-[16px] text-[var(--color-text)]">{b.shareTitle}</p>
      <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{b.shareIntro}</p>
      <div className="flex gap-2">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-text-faint)]">{b.shareFromLabel}</span>
          <input className="input" value={from} placeholder={b.shareFromPlaceholder} onChange={(e) => setFrom(e.target.value)} data-testid="letter-from" />
        </label>
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-text-faint)]">{b.shareToLabel}</span>
          <input className="input" value={to} placeholder={b.shareToPlaceholder} onChange={(e) => setTo(e.target.value)} data-testid="letter-to" />
        </label>
      </div>
      <textarea autoFocus className="input" rows={7} placeholder={b.writePlaceholder} value={text} onChange={(e) => setText(e.target.value)} data-testid="letter-text" />
      <p className="text-[12px] text-[var(--color-text-faint)] -mb-1">{b.shareWhenLabel}</p>
      <div className="flex gap-2">
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-text-faint)]">{b.dateLabel}</span>
          <input type="date" className="input" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} data-testid="letter-date" />
        </label>
        <label className="flex-1 flex flex-col gap-1">
          <span className="text-[12px] text-[var(--color-text-faint)]">{b.timeLabel}</span>
          <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} data-testid="letter-time" />
        </label>
      </div>
      <label className="flex items-start gap-2.5 cursor-pointer">
        <input type="checkbox" className="mt-0.5" checked={keepCopy} onChange={(e) => setKeepCopy(e.target.checked)} data-testid="letter-keep-copy" />
        <span className="text-[13px] text-[var(--color-text)] leading-relaxed">{b.keepCopy}</span>
      </label>
      <div className="flex gap-2">
        <Button fullWidth onClick={create} disabled={!text.trim() || !date || !from.trim()} data-testid="letter-create">
          {b.shareCreateCta}
        </Button>
        <Button variant="ghost" onClick={onClose}>{t.common.cancel}</Button>
      </div>
    </Card>
  );
}
