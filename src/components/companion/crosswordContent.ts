export interface CrosswordWord {
  answer: string;
  clue: string;
  clueEn: string;
  direction: 'across' | 'down';
  row: number;
  col: number;
  number: number;
}

export interface CrosswordPuzzle {
  id: string;
  size: number;
  words: CrosswordWord[];
}

// Each puzzle verified letter-by-letter before inclusion (see the node
// verification run in the accompanying session) — every shared cell
// between an across and a down word holds the exact same letter.
export const CROSSWORD_PUZZLES: CrosswordPuzzle[] = [
  {
    id: 'kreuz-1',
    size: 5,
    words: [
      { number: 1, answer: 'APFEL', clue: 'Rundes Obst, oft rot oder grün', clueEn: 'Round fruit, often red or green', direction: 'across', row: 0, col: 0 },
      { number: 2, answer: 'ROSEN', clue: 'Blumen mit Dornen, Symbol der Liebe', clueEn: 'Flowers with thorns, a symbol of love', direction: 'across', row: 4, col: 0 },
      { number: 1, answer: 'ADLER', clue: 'Großer Raubvogel, Wappentier vieler Länder', clueEn: 'Large bird of prey, a heraldic animal in many countries', direction: 'down', row: 0, col: 0 },
      { number: 3, answer: 'LEBEN', clue: 'Das Gegenteil von Tod', clueEn: 'The opposite of death', direction: 'down', row: 0, col: 4 },
    ],
  },
  {
    id: 'kreuz-2',
    size: 5,
    words: [
      { number: 1, answer: 'WOLKE', clue: 'Schwebt am Himmel, kann Regen bringen', clueEn: 'Floats in the sky, can bring rain', direction: 'across', row: 0, col: 0 },
      { number: 2, answer: 'ERBSE', clue: 'Kleine grüne Kugel aus der Hülse', clueEn: 'Small green ball from a pod', direction: 'across', row: 4, col: 0 },
      { number: 1, answer: 'WERTE', clue: 'Das, was einem im Leben wichtig ist', clueEn: 'What matters to a person in life', direction: 'down', row: 0, col: 0 },
      { number: 3, answer: 'EBENE', clue: 'Flaches Land ohne Berge', clueEn: 'Flat land without mountains', direction: 'down', row: 0, col: 4 },
    ],
  },
  {
    id: 'kreuz-3',
    size: 5,
    words: [
      { number: 1, answer: 'TIGER', clue: 'Großes gestreiftes Raubtier', clueEn: 'A large striped predator', direction: 'across', row: 0, col: 0 },
      { number: 2, answer: 'ENTEN', clue: 'Wasservögel, die schnattern', clueEn: 'Waterfowl that quack', direction: 'across', row: 4, col: 0 },
      { number: 1, answer: 'TANNE', clue: 'Nadelbaum, oft als Weihnachtsbaum', clueEn: 'A conifer, often used as a Christmas tree', direction: 'down', row: 0, col: 0 },
      { number: 3, answer: 'REGEN', clue: 'Fällt aus den Wolken', clueEn: 'Falls from the clouds', direction: 'down', row: 0, col: 4 },
    ],
  },
];

/** Every filled cell across every word, keyed "row,col" — used both to
 * derive which grid cells are fillable vs. blocked, and to check the
 * player's answers letter by letter. */
export function crosswordCells(puzzle: CrosswordPuzzle): Map<string, string> {
  const cells = new Map<string, string>();
  puzzle.words.forEach((w) => {
    for (let i = 0; i < w.answer.length; i++) {
      const r = w.direction === 'across' ? w.row : w.row + i;
      const c = w.direction === 'across' ? w.col + i : w.col;
      cells.set(`${r},${c}`, w.answer[i]);
    }
  });
  return cells;
}
