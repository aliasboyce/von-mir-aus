import { useState } from 'react';
import { X, ArrowRight, RotateCcw } from 'lucide-react';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { triggerHaptic } from '../../services/haptics';
import { useRegisterModalOpen } from '../../state/ModalStackContext';

/**
 * "Beduerfnis-Spiel MIT dem Wesen ueber Gefuehle und Beduerfnisse, das
 * gleichzeitig beim Lernen/Benennen hilft"-Auftrag — a light, playful
 * matching game rather than a quiz: a feeling is shown, the person
 * picks which need feels most connected to it. There is no real
 * "wrong" answer in GFK/NVC terms (several needs can genuinely
 * underlie one feeling) — the game only ever affirms the pick and
 * gently offers the commonly-named connection alongside it, never
 * marks anything as incorrect. Deliberately short: six rounds, then a
 * calm close, not a leaderboard or a streak to chase.
 */
interface Round {
  feeling: string;
  feelingEn: string;
  correctNeed: string;
  correctNeedEn: string;
  distractors: [string, string];
  distractorsEn: [string, string];
}

const ROUNDS: Round[] = [
  { feeling: 'einsam', feelingEn: 'lonely', correctNeed: 'Verbindung', correctNeedEn: 'Connection', distractors: ['Ruhe', 'Ordnung'], distractorsEn: ['Rest', 'Order'] },
  { feeling: 'gereizt', feelingEn: 'irritated', correctNeed: 'Ruhe', correctNeedEn: 'Rest', distractors: ['Anerkennung', 'Abenteuer'], distractorsEn: ['Recognition', 'Adventure'] },
  { feeling: 'ängstlich', feelingEn: 'anxious', correctNeed: 'Sicherheit', correctNeedEn: 'Safety', distractors: ['Freiheit', 'Spaß'], distractorsEn: ['Freedom', 'Fun'] },
  { feeling: 'erschöpft', feelingEn: 'exhausted', correctNeed: 'Erholung', correctNeedEn: 'Recovery', distractors: ['Verbindung', 'Wertschätzung'], distractorsEn: ['Connection', 'Appreciation'] },
  { feeling: 'übersehen', feelingEn: 'overlooked', correctNeed: 'Wertschätzung', correctNeedEn: 'Appreciation', distractors: ['Ruhe', 'Struktur'], distractorsEn: ['Rest', 'Structure'] },
  { feeling: 'eingeengt', feelingEn: 'boxed in', correctNeed: 'Autonomie', correctNeedEn: 'Autonomy', distractors: ['Nähe', 'Sicherheit'], distractorsEn: ['Closeness', 'Safety'] },
  { feeling: 'überfordert', feelingEn: 'overwhelmed', correctNeed: 'Orientierung', correctNeedEn: 'Orientation', distractors: ['Abenteuer', 'Anerkennung'], distractorsEn: ['Adventure', 'Recognition'] },
  { feeling: 'verunsichert', feelingEn: 'unsettled', correctNeed: 'Orientierung', correctNeedEn: 'Orientation', distractors: ['Freude', 'Autonomie'], distractorsEn: ['Joy', 'Autonomy'] },
  { feeling: 'gelangweilt', feelingEn: 'bored', correctNeed: 'Anregung', correctNeedEn: 'Stimulation', distractors: ['Sicherheit', 'Ruhe'], distractorsEn: ['Safety', 'Rest'] },
  { feeling: 'beschämt', feelingEn: 'ashamed', correctNeed: 'Zugehörigkeit', correctNeedEn: 'Belonging', distractors: ['Autonomie', 'Struktur'], distractorsEn: ['Autonomy', 'Structure'] },
  { feeling: 'hilflos', feelingEn: 'helpless', correctNeed: 'Selbstwirksamkeit', correctNeedEn: 'Self-efficacy', distractors: ['Nähe', 'Freude'], distractorsEn: ['Closeness', 'Joy'] },
  { feeling: 'unruhig', feelingEn: 'restless', correctNeed: 'innere Ruhe', correctNeedEn: 'inner calm', distractors: ['Anerkennung', 'Sinn'], distractorsEn: ['Recognition', 'Meaning'] },
  { feeling: 'leer', feelingEn: 'empty', correctNeed: 'Sinn', correctNeedEn: 'Meaning', distractors: ['Ordnung', 'Sicherheit'], distractorsEn: ['Order', 'Safety'] },
  { feeling: 'misstrauisch', feelingEn: 'distrustful', correctNeed: 'Sicherheit', correctNeedEn: 'Safety', distractors: ['Freude', 'Anregung'], distractorsEn: ['Joy', 'Stimulation'] },
  { feeling: 'dankbar', feelingEn: 'grateful', correctNeed: 'Verbindung', correctNeedEn: 'Connection', distractors: ['Autonomie', 'Ordnung'], distractorsEn: ['Autonomy', 'Order'] },
  { feeling: 'stolz', feelingEn: 'proud', correctNeed: 'Selbstwirksamkeit', correctNeedEn: 'Self-efficacy', distractors: ['Ruhe', 'Zugehörigkeit'], distractorsEn: ['Rest', 'Belonging'] },
];

const ROUNDS_PER_SESSION = 6;

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface NeedsGameProps {
  onClose: () => void;
}

export function NeedsGame({ onClose }: NeedsGameProps) {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  useRegisterModalOpen(true);

  const [session] = useState(() => shuffled(ROUNDS).slice(0, ROUNDS_PER_SESSION));
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const round = session[index];
  const options = useState(() =>
    session.map((r) => shuffled([r.correctNeed, ...r.distractors])),
  )[0][index];
  const optionsEn = session.map((r) => [r.correctNeedEn, ...r.distractorsEn])[index];

  function pick(need: string) {
    if (picked) return;
    setPicked(need);
    triggerHaptic('select', settings);
  }

  function next() {
    if (index + 1 >= session.length) {
      setDone(true);
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  function restart() {
    setIndex(0);
    setPicked(null);
    setDone(false);
  }

  return (
    <div className="fixed inset-0 z-[400] flex items-end sm:items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="w-full sm:max-w-[380px] sm:rounded-[var(--radius-xl)] rounded-t-[var(--radius-xl)] bg-[var(--color-surface)] p-5 pb-[max(20px,env(safe-area-inset-bottom))] max-h-[85vh] overflow-y-auto animate-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-[15px] font-medium text-[var(--color-text)]">{t.needsGame.title}</p>
          <button onClick={onClose} aria-label={t.common.close} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[var(--color-surface-muted)]">
            <X size={16} />
          </button>
        </div>

        {!done ? (
          <>
            <p className="text-[12px] text-[var(--color-text-faint)] mb-4">{t.needsGame.roundLabel.replace('{n}', String(index + 1)).replace('{total}', String(session.length))}</p>
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2">{t.needsGame.prompt}</p>
            <p className="text-[26px] text-[var(--color-text)] text-center mb-6">{isEn ? round.feelingEn : round.feeling}</p>

            <div className="flex flex-col gap-2 mb-4">
              {(isEn ? optionsEn : options).map((opt) => {
                const isPicked = picked === opt;
                const isTheCorrectOne = opt === (isEn ? round.correctNeedEn : round.correctNeed);
                const showHighlight = picked && isTheCorrectOne;
                return (
                  <button
                    key={opt}
                    onClick={() => pick(opt)}
                    disabled={!!picked}
                    className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left"
                    style={{
                      background: showHighlight ? 'var(--color-primary-soft)' : isPicked ? 'var(--color-surface-muted)' : 'var(--color-surface-muted)',
                      outline: showHighlight ? '1.5px solid var(--color-primary)' : isPicked ? '1.5px solid var(--color-border-strong)' : 'none',
                      color: showHighlight ? 'var(--color-primary)' : 'var(--color-text)',
                      opacity: picked && !isPicked && !showHighlight ? 0.55 : 1,
                    }}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>

            {picked && (
              <div className="mb-4">
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                  {picked === (isEn ? round.correctNeedEn : round.correctNeed)
                    ? t.needsGame.affirmMatch
                    : t.needsGame.affirmOther.replace('{need}', isEn ? round.correctNeedEn : round.correctNeed)}
                </p>
              </div>
            )}

            <button
              onClick={next}
              disabled={!picked}
              className="flex items-center justify-center gap-1.5 w-full px-5 py-2.5 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)] disabled:opacity-40"
            >
              {index + 1 >= session.length ? t.needsGame.finishCta : t.needsGame.nextCta}
              <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4 py-6 text-center">
            <p className="text-[16px] text-[var(--color-text)] leading-relaxed">{t.needsGame.closingLine}</p>
            <div className="flex gap-2">
              <button onClick={restart} className="flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
                <RotateCcw size={13} />
                {t.needsGame.restartCta}
              </button>
              <button onClick={onClose} className="px-4 py-2 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]">
                {t.common.close}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
