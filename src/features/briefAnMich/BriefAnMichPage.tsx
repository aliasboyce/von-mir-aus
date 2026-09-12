import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Mail } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { lettersRepo, addLetter, markLetterOpened, pendingLetters, openedLetters } from './lettersRepo';
import { LetterEnvelope } from './LetterEnvelope';

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
  const { settings } = useSettings();
  const [, refresh] = useState(0);
  const [writing, setWriting] = useState(false);
  const [text, setText] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('09:00');
  const [openLetterId, setOpenLetterId] = useState<string | null>(null);

  function bump() {
    refresh((n) => n + 1);
  }

  function save() {
    if (!text.trim() || !date) return;
    addLetter(text.trim(), new Date(`${date}T${time}`).toISOString());
    setText('');
    setDate('');
    setTime('09:00');
    setWriting(false);
    bump();
  }

  const pending = pendingLetters();
  const opened = openedLetters();
  const openLetter = openLetterId ? lettersRepo.getAll().find((l) => l.id === openLetterId) : null;

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} action={<HelpButton helpKey="briefAnMich" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">{t.briefAnMich.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6 leading-relaxed">{t.briefAnMich.subtitle}</p>

        <Button fullWidth variant="secondary" icon={<Plus size={17} />} onClick={() => setWriting(true)} className="mb-5">
          {t.briefAnMich.writeCta}
        </Button>

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

        {pending.length === 0 && opened.length === 0 ? (
          <EmptyState title={t.briefAnMich.empty} />
        ) : (
          <>
            {pending.length > 0 && (
              <>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.briefAnMich.pendingLabel}</p>
                <div className="flex flex-col gap-2 mb-6">
                  {pending.map((l) => (
                    <Card key={l.id} className="flex items-center gap-3">
                      <Mail size={18} className="text-[var(--color-text-faint)] flex-shrink-0" />
                      <p className="text-[13px] text-[var(--color-text-muted)] flex-1">
                        {t.briefAnMich.arrivesOn.replace(
                          '{date}',
                          new Date(l.scheduledFor).toLocaleString(settings.language === 'de' ? 'de-DE' : 'en-US', {
                            day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
                          })
                        )}
                      </p>
                    </Card>
                  ))}
                </div>
              </>
            )}
            {opened.length > 0 && (
              <>
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.briefAnMich.openedLabel}</p>
                <div className="flex flex-col gap-2">
                  {opened.map((l) => (
                    <button key={l.id} onClick={() => setOpenLetterId(l.id)} className="text-left w-full">
                      <Card interactive className="flex items-start gap-3">
                        <Mail size={18} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <p className="text-[13px] text-[var(--color-text)] flex-1 line-clamp-2">{l.text}</p>
                      </Card>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {openLetter && (
        <LetterEnvelope
          letter={openLetter}
          alreadyOpen={openLetter.opened}
          onClose={() => setOpenLetterId(null)}
          onOpened={() => {
            if (!openLetter.opened) markLetterOpened(openLetter.id);
            bump();
          }}
        />
      )}
    </div>
  );
}
