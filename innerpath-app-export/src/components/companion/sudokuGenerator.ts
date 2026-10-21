// A single hand-verified complete 6x6 Sudoku solution (2×3 boxes). See
// the accompanying node verification run before this file was written:
// every row, column, and box contains each of 1–6 exactly once.
const BASE_SOLUTION: number[][] = [
  [1, 2, 3, 4, 5, 6],
  [4, 5, 6, 1, 2, 3],
  [2, 3, 1, 5, 6, 4],
  [5, 6, 4, 2, 3, 1],
  [3, 1, 2, 6, 4, 5],
  [6, 4, 5, 3, 1, 2],
];

export type SudokuDifficulty = 'leicht' | 'mittel' | 'schwer';

export interface SudokuPuzzle {
  /** 0 = empty cell to fill in */
  grid: number[][];
  /** true where the cell was pre-filled and must stay fixed */
  given: boolean[][];
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
 * Every one of these operations is a well-known Sudoku-validity-
 * preserving transformation: relabeling digits, permuting rows within
 * a band (a band = the 2 rows sharing box membership), permuting
 * columns within a stack (3 cols sharing box membership), and
 * reordering whole bands/stacks. Applying a random combination to the
 * one verified base grid gives effectively unlimited genuinely-valid
 * puzzles without needing a full solver/generator — and without risking
 * hand-authoring a second grid incorrectly.
 */
function randomizedValidGrid(): number[][] {
  let grid = BASE_SOLUTION.map((row) => [...row]);

  // Relabel digits 1–6 via a random permutation.
  const digitMap = shuffle([1, 2, 3, 4, 5, 6]);
  grid = grid.map((row) => row.map((v) => digitMap[v - 1]));

  // Shuffle the 2 rows within each of the 3 bands.
  const newRows: number[][] = [];
  for (let band = 0; band < 3; band++) {
    const rows = shuffle([grid[band * 2], grid[band * 2 + 1]]);
    newRows.push(...rows);
  }
  grid = newRows;

  // Shuffle the 3 columns within each of the 2 stacks.
  const colOrder: number[] = [];
  for (let stack = 0; stack < 2; stack++) {
    const cols = shuffle([stack * 3, stack * 3 + 1, stack * 3 + 2]);
    colOrder.push(...cols);
  }
  grid = grid.map((row) => colOrder.map((c) => row[c]));

  // Reorder the 3 bands themselves (as whole 2-row blocks).
  const bandOrder = shuffle([0, 1, 2]);
  const bandedRows: number[][] = [];
  bandOrder.forEach((band) => {
    bandedRows.push(grid[band * 2], grid[band * 2 + 1]);
  });
  grid = bandedRows;

  // Reorder the 2 stacks (as whole 3-col blocks).
  const stackOrder = shuffle([0, 1]);
  grid = grid.map((row) => [...row.slice(stackOrder[0] * 3, stackOrder[0] * 3 + 3), ...row.slice(stackOrder[1] * 3, stackOrder[1] * 3 + 3)]);

  return grid;
}

const CLUE_COUNT: Record<SudokuDifficulty, number> = {
  // out of 36 cells total
  leicht: 24,
  mittel: 18,
  schwer: 14,
};

export function generateSudoku(difficulty: SudokuDifficulty): SudokuPuzzle {
  const solution = randomizedValidGrid();
  const keep = CLUE_COUNT[difficulty];
  const allPositions = shuffle(Array.from({ length: 36 }, (_, i) => i));
  const keepSet = new Set(allPositions.slice(0, keep));

  const grid: number[][] = [];
  const given: boolean[][] = [];
  for (let r = 0; r < 6; r++) {
    const gridRow: number[] = [];
    const givenRow: boolean[] = [];
    for (let c = 0; c < 6; c++) {
      const idx = r * 6 + c;
      const isGiven = keepSet.has(idx);
      gridRow.push(isGiven ? solution[r][c] : 0);
      givenRow.push(isGiven);
    }
    grid.push(gridRow);
    given.push(givenRow);
  }
  return { grid, given };
}

/**
 * Validates by Sudoku RULES (every row/col/box contains 1–6 exactly
 * once), not by comparing against one stored "correct" answer — this
 * is the mathematically correct approach regardless of whether a given
 * puzzle happens to have a literally unique solution, and it's the only
 * approach that's honest about what "correct" means here.
 */
export function isSudokuComplete(grid: number[][]): boolean {
  const isValidSet = (arr: number[]) => new Set(arr).size === 6 && arr.every((v) => v >= 1 && v <= 6);
  for (let r = 0; r < 6; r++) {
    if (!isValidSet(grid[r])) return false;
  }
  for (let c = 0; c < 6; c++) {
    if (!isValidSet(grid.map((row) => row[c]))) return false;
  }
  for (let br = 0; br < 6; br += 2) {
    for (let bc = 0; bc < 6; bc += 3) {
      const box: number[] = [];
      for (let r = br; r < br + 2; r++) for (let c = bc; c < bc + 3; c++) box.push(grid[r][c]);
      if (!isValidSet(box)) return false;
    }
  }
  return true;
}
