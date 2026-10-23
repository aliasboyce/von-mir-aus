import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { CROSSWORD_PUZZLES, crosswordCells, type CrosswordPuzzle } from './crosswordContent';

function randomPuzzle(exclude?: string): CrosswordPuzzle {
  const pool = exclude ? CROSSWORD_PUZZLES.filter((p) => p.id !== exclude) : CROSSWORD_PUZZLES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function CrosswordGame() {
  const t = useT();
  const { settings } = useSettings();
  const isEn = settings.language === 'en';
  const [puzzle, setPuzzle] = useState<CrosswordPuzzle>(() => randomPuzzle());
  const [entries, setEntries] = useState<Record<string, string>>({});
  const [checked, setChecked] = useState(false);

  const solutionCells = crosswordCells(puzzle);

  function setLetter(r: number, c: number, letter: string) {
    setEntries((prev) => ({ ...prev, [`${r},${c}`]: letter.toUpperCase().slice(-1) }));
    setChecked(false);
  }

  function check() {
    setChecked(true);
  }

  function newPuzzle() {
    setPuzzle(randomPuzzle(puzzle.id));
    setEntries({});
    setChecked(false);
  }

  const allCorrect = checked && [...solutionCells.entries()].every(([key, letter]) => entries[key] === letter);

  return (
    <div className="mt-5 w-full max-w-[320px] flex flex-col items-center">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-4 text-center">{t.companion.crosswordIntro}</p>

      <div
        className="grid gap-[2px] mb-4"
        style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)`, width: 240, background: 'var(--color-border)', padding: 2, borderRadius: 8 }}
      >
        {Array.from({ length: puzzle.size }, (_, r) =>
          Array.from({ length: puzzle.size }, (_, c) => {
            const key = `${r},${c}`;
            const isFillable = solutionCells.has(key);
            const startWord = puzzle.words.find((w) => w.row === r && w.col === c);
            const value = entries[key] ?? '';
            const isCorrect = checked && isFillable && value === solutionCells.get(key);
            const isWrong = checked && isFillable && value && value !== solutionCells.get(key);
            return (
              <div key={key} className="relative" style={{ aspectRatio: '1' }}>
                {isFillable ? (
                  <>
                    {startWord && <span className="absolute top-0 left-0.5 text-[8px] text-[var(--color-text-faint)]">{startWord.number}</span>}
                    <input
                      value={value}
                      onChange={(e) => setLetter(r, c, e.target.value)}
                      maxLength={1}
                      className="w-full h-full text-center text-[15px] uppercase"
                      style={{
                        background: isCorrect ? 'var(--color-primary-soft)' : isWrong ? 'var(--color-danger-soft, #fbe4e4)' : 'var(--color-surface)',
                        color: 'var(--color-text)',
                        border: 'none',
                      }}
                    />
                  </>
                ) : (
                  <div className="w-full h-full" style={{ background: 'var(--color-border-strong)' }} />
                )}
              </div>
            );
          }),
        )}
      </div>

      <div className="w-full mb-4 flex flex-col gap-1.5">
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)]">{t.companion.crosswordAcross}</p>
        {puzzle.words.filter((w) => w.direction === 'across').map((w) => (
          <p key={`a${w.number}`} className="text-[13px] text-[var(--color-text)]">
            {w.number}. {isEn ? w.clueEn : w.clue}
          </p>
        ))}
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mt-1.5">{t.companion.crosswordDown}</p>
        {puzzle.words.filter((w) => w.direction === 'down').map((w) => (
          <p key={`d${w.number}`} className="text-[13px] text-[var(--color-text)]">
            {w.number}. {isEn ? w.clueEn : w.clue}
          </p>
        ))}
      </div>

      {allCorrect && <p className="text-[14px] text-[var(--color-primary)] mb-3">{t.companion.crosswordComplete}</p>}
      {checked && !allCorrect && <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{t.companion.sudokuIncomplete}</p>}

      <div className="flex gap-2 w-full">
        <Button fullWidth variant="secondary" onClick={check} icon={allCorrect ? <Check size={16} /> : undefined}>
          {t.companion.sudokuCheck}
        </Button>
        <Button fullWidth variant="ghost" onClick={newPuzzle}>
          {t.companion.sudokuNewPuzzle}
        </Button>
      </div>
    </div>
  );
}
