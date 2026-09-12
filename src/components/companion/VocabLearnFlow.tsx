import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { vocabCollectionsRepo, cardsForCollection } from './vocabRepo';
import type { VocabCard } from '../../data/types';

interface VocabLearnFlowProps {
  onManage: () => void;
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A card wrong in this round goes back to the end of the queue rather
 * than being marked "done" — it stays in play until answered correctly
 * at least once in the same sitting, which is the actual point of Punkt
 * 9's "falsche Karten werden erneut abgefragt" requirement.
 */
export function VocabLearnFlow({ onManage }: VocabLearnFlowProps) {
  const t = useT();
  const { settings } = useSettings();
  const collections = vocabCollectionsRepo.getAll();
  const [collectionId, setCollectionId] = useState<string | null>(collections.length === 1 ? collections[0].id : null);
  const [queue, setQueue] = useState<VocabCard[] | null>(null);
  const [input, setInput] = useState('');
  const [flipped, setFlipped] = useState(false);
  const [result, setResult] = useState<'correct' | 'incorrect' | null>(null);
  const [doneCount, setDoneCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const current = queue && queue.length > 0 ? queue[0] : null;

  function startCollection(id: string) {
    const cards = shuffle(cardsForCollection(id));
    setCollectionId(id);
    setQueue(cards);
    setTotalCount(cards.length);
    setDoneCount(0);
    setInput('');
    setFlipped(false);
    setResult(null);
  }

  function checkAnswer() {
    if (!current) return;
    const correct = input.trim().toLowerCase() === current.back.trim().toLowerCase();
    setResult(correct ? 'correct' : 'incorrect');
    setFlipped(true);
  }

  function next() {
    if (!queue || !current) return;
    const rest = queue.slice(1);
    if (result === 'correct') {
      setDoneCount((n) => n + 1);
      setQueue(rest);
    } else {
      // Requeue near the end, not immediately next, so the same card
      // doesn't just repeat right away — a little distance helps it
      // actually be re-learned rather than re-guessed from short memory.
      setQueue([...rest, current]);
    }
    setInput('');
    setFlipped(false);
    setResult(null);
  }

  if (!collectionId || !queue) {
    return (
      <div className="mt-6 w-full max-w-[320px]">
        <p className="text-[17px] text-[var(--color-text)] text-center mb-5">{t.vocab.pickCollectionTitle}</p>
        {collections.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-faint)] text-center mb-4">{t.vocab.noCollections}</p>
        ) : (
          <div className="flex flex-col gap-2 mb-4">
            {collections.map((c) => (
              <button
                key={c.id}
                onClick={() => startCollection(c.id)}
                disabled={cardsForCollection(c.id).length === 0}
                className="px-4 py-3 rounded-[var(--radius-lg)] text-[15px] text-left bg-[var(--color-surface-muted)] text-[var(--color-text)] disabled:opacity-40"
              >
                {c.name}{' '}
                <span className="text-[12px] text-[var(--color-text-faint)]">
                  ({t.vocab.cardCount.replace('{n}', String(cardsForCollection(c.id).length))})
                </span>
              </button>
            ))}
          </div>
        )}
        <Button fullWidth variant="secondary" onClick={onManage}>
          {t.vocab.manageTitle}
        </Button>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="mt-6 w-full max-w-[300px] text-center">
        <p className="text-[18px] text-[var(--color-text)] mb-2">{t.vocab.roundDoneTitle}</p>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5">{t.vocab.roundDoneSubtitle.replace('{n}', String(totalCount))}</p>
        <Button fullWidth onClick={() => setCollectionId(null)}>
          {t.vocab.pickAnotherCollection}
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-6 w-full max-w-[300px] flex flex-col items-center">
      <p className="text-[12px] text-[var(--color-text-faint)] mb-4">
        {t.vocab.progress.replace('{done}', String(doneCount)).replace('{total}', String(totalCount))}
      </p>

      <div style={{ perspective: 800 }} className="w-full mb-5">
        <div
          className="relative rounded-[var(--radius-lg)] w-full"
          style={{
            height: 140,
            transformStyle: 'preserve-3d',
            transform: flipped && !settings.reduceMotion ? 'rotateY(180deg)' : 'none',
            transition: settings.reduceMotion ? 'none' : 'transform 0.5s ease',
          }}
        >
          <div
            className="absolute inset-0 rounded-[var(--radius-lg)] flex items-center justify-center px-4"
            style={{ background: 'var(--color-surface-muted)', backfaceVisibility: 'hidden' }}
          >
            <p className="text-[22px] text-[var(--color-text)] text-center">{current.front}</p>
          </div>
          <div
            className="absolute inset-0 rounded-[var(--radius-lg)] flex flex-col items-center justify-center px-4 gap-1"
            style={{
              background: result === 'correct' ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)',
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <p className="text-[22px] text-[var(--color-text)] text-center">{current.back}</p>
            <p className="text-[13px]" style={{ color: result === 'correct' ? 'var(--color-primary)' : 'var(--color-text-muted)' }}>
              {result === 'correct' ? t.vocab.correctFeedback : t.vocab.incorrectFeedback}
            </p>
          </div>
        </div>
      </div>

      {!flipped ? (
        <>
          <input
            autoFocus
            className="input text-center mb-3"
            placeholder={t.vocab.answerPlaceholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
          />
          <Button fullWidth onClick={checkAnswer}>
            {t.vocab.checkCta}
          </Button>
        </>
      ) : (
        <Button fullWidth onClick={next} icon={result === 'correct' ? <Check size={16} /> : undefined}>
          {t.companion.pickerContinue}
        </Button>
      )}
    </div>
  );
}
