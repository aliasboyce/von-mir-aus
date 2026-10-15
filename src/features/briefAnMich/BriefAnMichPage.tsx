import { useState } from 'react';
import { goBack } from '../../services/navigation';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { addLetter } from './lettersRepo';
import { LettersList } from './LettersList';
import { LetterGuide } from './LetterGuide';
import { LetterShareComposer } from './LetterShareComposer';
import { LetterReceivePanel } from './LetterReceive';
import { Send, Inbox } from 'lucide-react';

/**
 * Priority 18 — writing lives here; delivery (the companion surfacing a
 * due letter on the home screen) is handled by DueLetterBanner, used
 * from HomePage.tsx, both reading the same lettersRepo. Letters also
 * appear in the diary as their own collection (see DiaryPage.tsx) —
 * same repo there too, not a second copy.
 */
export function BriefAnMichPage() {
  const t = useT();
  const navigate = useNavigate();
  const [, refresh] = useState(0);
  const [writing, setWriting] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [receiving, setReceiving] = useState(false);
  const [text, setText] = useState('');
  const [inReview, setInReview] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');

  function bump() {
    refresh((n) => n + 1);
  }

  function save() {
    if (!text.trim() || !date) return;
    addLetter(text.trim(), new Date(`${date}T${time}`).toISOString(), inReview);
    setText('');
    setDate('');
    setTime('09:00');
    setWriting(false);
    bump();
  }

  return (
    <div className="animate-in">
      <TopBar onBack={() => goBack(navigate)} action={<HelpButton helpKey="briefAnMich" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.briefAnMich.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{t.briefAnMich.subtitle}</p>

        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.briefAnMich.sectionSelf}</p>
        <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={() => setWriting(true)} className="mb-5">
          {t.briefAnMich.writeCta}
        </Button>

        <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.briefAnMich.sectionOthers}</p>
        <Card className="mb-3" data-testid="letter-flow">
          <p className="text-[13px] font-medium text-[var(--color-text)] mb-1.5">{t.briefAnMich.flowTitle}</p>
          <ol className="flex flex-col gap-1 pl-5 list-decimal">
            {[t.briefAnMich.flow1, t.briefAnMich.flow2, t.briefAnMich.flow3].map((s, i) => (
              <li key={i} className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">{s}</li>
            ))}
          </ol>
        </Card>
        <div className="flex flex-col gap-2 mb-3">
          <button type="button" onClick={() => { setSharing(true); setReceiving(false); }} className="text-left rounded-[var(--radius-lg)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface)] border border-[var(--color-border)]" data-testid="letter-share-open">
            <Send size={18} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <span>
              <span className="block text-[15px] text-[var(--color-text)]">{t.briefAnMich.shareCta}</span>
              <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{t.briefAnMich.shareCardSub}</span>
            </span>
          </button>
          <button type="button" onClick={() => { setReceiving(true); setSharing(false); }} className="text-left rounded-[var(--radius-lg)] px-4 py-3 flex items-start gap-3 bg-[var(--color-surface)] border border-[var(--color-border)]" data-testid="letter-receive-open">
            <Inbox size={18} className="text-[var(--color-primary)] mt-0.5 flex-shrink-0" />
            <span>
              <span className="block text-[15px] text-[var(--color-text)]">{t.briefAnMich.receiveCta}</span>
              <span className="block text-[12.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{t.briefAnMich.receiveCardSub}</span>
            </span>
          </button>
        </div>
        <LetterGuide />
        {sharing && <LetterShareComposer onClose={() => setSharing(false)} />}
        {receiving && <LetterReceivePanel onClose={() => { setReceiving(false); bump(); }} />}

        {writing && (
          <Card className="mb-6 flex flex-col gap-3">
            <textarea
              autoFocus
              className="input"
              rows={6}
              placeholder={t.briefAnMich.writePlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input type="checkbox" className="mt-0.5" checked={inReview} onChange={(e) => setInReview(e.target.checked)} />
              <span className="text-[13px] text-[var(--color-text)]">{t.reviewMail.inReviewLetter}</span>
            </label>
            <div className="flex gap-2">
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-faint)]">{t.briefAnMich.dateLabel}</span>
                <input type="date" className="input" value={date} min={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} />
              </label>
              <label className="flex-1 flex flex-col gap-1">
                <span className="text-[12px] text-[var(--color-text-faint)]">{t.briefAnMich.timeLabel}</span>
                <input type="time" className="input" value={time} onChange={(e) => setTime(e.target.value)} />
              </label>
            </div>
            <div className="flex gap-2">
              <Button fullWidth onClick={save} disabled={!text.trim() || !date}>
                {t.briefAnMich.sealCta}
              </Button>
              <Button variant="ghost" onClick={() => setWriting(false)}>
                {t.common.cancel}
              </Button>
            </div>
          </Card>
        )}

        <LettersList showPendingList onChanged={bump} />
      </div>

    </div>
  );
}
