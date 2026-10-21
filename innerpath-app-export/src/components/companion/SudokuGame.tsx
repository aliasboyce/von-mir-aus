import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { generateSudoku, isSudokuComplete, type SudokuDifficulty, type SudokuPuzzle } from './sudokuGenerator';

interface SudokuGameProps {
  difficulty: SudokuDifficulty;
}

export function SudokuGame({ difficulty }: SudokuGameProps) {
  const t = useT();
  const [puzzle, setPuzzle] = useState<SudokuPuzzle>(() => generateSudoku(difficulty));
  const [grid, setGrid] = useState<number[][]>(() => puzzle.grid.map((row) => [...row]));
  const [activeCell, setActiveCell] = useState<[number, number] | null>(null);
  const [checked, setChecked] = useState<'unchecked' | 'complete' | 'incomplete'>('unchecked');

  function setCell(r: number, c: number, value: number) {
    if (puzzle.given[r][c]) return;
    const next = grid.map((row) => [...row]);
    next[r][c] = value;
    setGrid(next);
    setChecked('unchecked');
  }

  function check() {
    setChecked(isSudokuComplete(grid) ? 'complete' : 'incomplete');
  }

  function newPuzzle() {
    const p = generateSudoku(difficulty);
    setPuzzle(p);
    setGrid(p.grid.map((row) => [...row]));
    setActiveCell(null);
    setChecked('unchecked');
  }

  return (
    <div className="mt-5 w-full max-w-[320px] flex flex-col items-center">
      <p className="text-[13px] text-[var(--color-text-muted)] mb-4 text-center">{t.companion.sudokuIntro}</p>

      <div
        className="grid gap-[2px] mb-4"
        style={{ gridTemplateColumns: 'repeat(6, 1fr)', width: 264, background: 'var(--color-border-strong)', padding: 2, borderRadius: 8 }}
      >
        {grid.map((row, r) =>
          row.map((val, c) => {
            const isGiven = puzzle.given[r][c];
            const isActive = activeCell?.[0] === r && activeCell?.[1] === c;
            // Thicker visual separators between the 2×3 boxes, done via
            // border sides rather than a second overlay grid.
            const boxRight = c === 2 ? '2px solid var(--color-border-strong)' : undefined;
            const boxBottom = r === 1 || r === 3 ? '2px solid var(--color-border-strong)' : undefined;
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => !isGiven && setActiveCell([r, c])}
                disabled={isGiven}
                className="flex items-center justify-center text-[16px]"
                style={{
                  aspectRatio: '1',
                  background: isGiven ? 'var(--color-surface-muted)' : isActive ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  color: isGiven ? 'var(--color-text-muted)' : 'var(--color-text)',
                  fontWeight: isGiven ? 600 : 400,
                  borderRight: boxRight,
                  borderBottom: boxBottom,
                }}
              >
                {val !== 0 ? val : ''}
              </button>
            );
          }),
        )}
      </div>

      {activeCell && (
        <div className="flex gap-1.5 mb-4 animate-in">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <button
              key={n}
              onClick={() => setCell(activeCell[0], activeCell[1], n)}
              className="w-8 h-8 rounded-[var(--radius-md)] text-[15px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setCell(activeCell[0], activeCell[1], 0)}
            aria-label={t.common.delete}
            className="w-8 h-8 rounded-[var(--radius-md)] text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text-faint)]"
          >
            ×
          </button>
        </div>
      )}

      {checked === 'complete' && <p className="text-[14px] text-[var(--color-primary)] mb-3">{t.companion.sudokuComplete}</p>}
      {checked === 'incomplete' && <p className="text-[13px] text-[var(--color-text-muted)] mb-3">{t.companion.sudokuIncomplete}</p>}

      <div className="flex gap-2 w-full mb-2">
        <Button fullWidth variant="secondary" onClick={check} icon={checked === 'complete' ? <Check size={16} /> : undefined}>
          {t.companion.sudokuCheck}
        </Button>
        <Button fullWidth variant="ghost" onClick={newPuzzle}>
          {t.companion.sudokuNewPuzzle}
        </Button>
      </div>
    </div>
  );
}
