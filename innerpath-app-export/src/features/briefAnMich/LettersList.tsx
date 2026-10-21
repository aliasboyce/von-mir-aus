import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { lettersRepo, markLetterOpened, pendingLetters, openedLetters, describeLetter, type LetterToSelf, type LetterRole } from './lettersRepo';
import { LetterEnvelope } from './LetterEnvelope';

interface LettersListProps {
  /** also list the letters that are still on their way (the Brief-an-mich page does; the diary only counts them) */
  showPendingList?: boolean;
  onChanged?: () => void;
}

/**
 * Letters, grouped by who they are with: to myself, from others to me,
 * and my copies of letters I sent. One list for the diary tab "Meine
 * Briefe" and the Brief-an-mich page — same repo, no second copy.
 */
export function LettersList({ showPendingList = false, onChanged }: LettersListProps) {
  const t = useT();
  const d = t.diary;
  const { settings } = useSettings();
  const locale = settings.language === 'de' ? 'de-DE' : 'en-US';
  const [, setTick] = useState(0);
  const [openId, setOpenId] = useState<string | null>(null);
  const pending = pendingLetters();
  const opened = openedLetters();
  const openLetter = openId ? lettersRepo.getAll().find((l) => l.id === openId) : null;

  const by = (role: LetterRole) => opened.filter((l) => describeLetter(l).role === role);
  const groups: { role: LetterRole; title: string; list: LetterToSelf[] }[] = [
    { role: 'received', title: d.lettersOthersTitle, list: by('received') },
    { role: 'self', title: d.lettersSelfTitle, list: by('self') },
    { role: 'copy', title: d.lettersCopiesTitle, list: by('copy') },
  ];

  const fmt = (iso: string) => new Date(iso).toLocaleString(locale, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  function labelOf(l: LetterToSelf): string | null {
    const info = describeLetter(l);
    if (info.role === 'received') return t.briefAnMich.fromLine.replace('{name}', info.who || t.briefAnMich.receiveFromSomeone);
    if (info.role === 'copy') return t.briefAnMich.copyPrefix.replace('{to}', info.who || t.briefAnMich.shareReadyToFallback);
    return null;
  }

  return (
    <div data-testid="letters-list">
      {pending.length > 0 && !showPendingList && (
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">{d.lettersOnTheWay.replace('{n}', String(pending.length))}</p>
      )}
      {pending.length > 0 && showPendingList && (
        <>
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{t.briefAnMich.pendingLabel}</p>
          <div className="flex flex-col gap-2 mb-6">
            {pending.map((l) => {
              const info = describeLetter(l);
              return (
                <Card key={l.id} className="flex items-center gap-3">
                  <Mail size={18} className="text-[var(--color-text-faint)] flex-shrink-0" />
                  <p className="text-[13px] text-[var(--color-text-muted)] flex-1">
                    {info.role === 'received'
                      ? t.briefAnMich.inTransitFrom.replace('{name}', info.who || t.briefAnMich.receiveFromSomeone).replace('{date}', fmt(l.scheduledFor))
                      : info.role === 'copy'
                        ? `${t.briefAnMich.copyPrefix.replace('{to}', info.who || t.briefAnMich.shareReadyToFallback)} · ${fmt(l.scheduledFor)}`
                        : t.briefAnMich.arrivesOn.replace('{date}', fmt(l.scheduledFor))}
                  </p>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {opened.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)] leading-relaxed">{d.lettersEmpty}</p>}

      {groups.map(
        (g) =>
          g.list.length > 0 && (
            <section key={g.role} className="mb-6" data-testid={`letters-${g.role}`}>
              <h2 className="text-[15px] mb-2">{g.title}</h2>
              <div className="flex flex-col gap-2">
                {g.list.map((l) => {
                  const label = labelOf(l);
                  return (
                    <button key={l.id} onClick={() => setOpenId(l.id)} className="text-left w-full">
                      <Card interactive className="flex items-start gap-3">
                        <Mail size={18} className="text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {label && <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{label}</p>}
                          <p className="text-[13px] text-[var(--color-text)] line-clamp-2">{describeLetter(l).body}</p>
                        </div>
                      </Card>
                    </button>
                  );
                })}
              </div>
            </section>
          ),
      )}

      {openLetter && (
        <LetterEnvelope
          letter={openLetter}
          alreadyOpen={openLetter.opened}
          onClose={() => setOpenId(null)}
          onOpened={() => {
            if (!openLetter.opened) markLetterOpened(openLetter.id);
            setTick((n) => n + 1);
            onChanged?.();
          }}
        />
      )}
    </div>
  );
}
