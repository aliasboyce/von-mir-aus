/**
 * Die Lupe – Suchlogik (rein, ohne App-Wissen): Wörter werden verzeihend verglichen.
 * Gefunden wird auch mit Wortanfang („tage“ → Tagebuch), Wortteil („buch“ → Tagebuch),
 * ohne Umlaute („fuhlen“ → fühlen) und mit einem kleinen Tippfehler („Mindmapp“, „Sicherheitsplahn“).
 */

/** 1:1-Zeichenabbildung (Länge bleibt gleich, damit Fundstellen im Originaltext markiert werden können) */
export function normalize(s: string): string {
  let out = '';
  for (const c of s) {
    const l = c.toLowerCase();
    if (l === 'ß') {
      out += 's';
      continue;
    }
    const d = l.normalize('NFD');
    out += d.length ? d[0] : l;
  }
  return out;
}

const WORD_RE = /[\p{L}\p{N}]+/gu;

export function wordsOf(s: string): string[] {
  return normalize(s).match(WORD_RE) ?? [];
}

/** Abstand mit Vertauschung (Damerau), bricht ab, sobald er sicher über `max` liegt */
export function editDistance(a: string, b: string, max: number): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const m = a.length;
  const n = b.length;
  let prev2: number[] = [];
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur[j] = v;
      if (v < rowMin) rowMin = v;
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[n];
}

export interface SearchDoc {
  id: string;
  /** normalisierte Wörter der Überschrift */
  titleWords: Set<string>;
  /** normalisierte Wörter aller Texte (inkl. Überschrift und Stichwörter) */
  words: string[];
  wordSet: Set<string>;
}

export function buildDoc(id: string, title: string, body: string, keywords = ''): SearchDoc {
  const tw = wordsOf(title);
  const all = [...tw, ...wordsOf(keywords), ...wordsOf(body)];
  const wordSet = new Set(all);
  return { id, titleWords: new Set(tw), words: [...wordSet], wordSet };
}

/** wie gut passt EIN Suchwort zu einem Wort (0 = gar nicht) */
function wordScore(q: string, w: string): number {
  if (w === q) return 10;
  if (q.length >= 2 && w.startsWith(q)) return 8 - Math.min(2, (w.length - q.length) / 6);
  if (q.length >= 3 && w.includes(q)) return 5;
  if (q.length >= 4) {
    const max = q.length >= 8 ? 2 : 1;
    if (Math.abs(w.length - q.length) <= max + 1) {
      const d = editDistance(q, w, max);
      if (d <= max) return 4 - d * 0.6;
      // Tippfehler im bereits getippten Anfang eines längeren Wortes („tagebucj“, „sicherhei“)
      if (w.length > q.length) {
        const d2 = editDistance(q, w.slice(0, q.length), max);
        if (d2 <= max) return 3 - d2 * 0.6;
      }
    }
  }
  return 0;
}

export interface TokenHit {
  score: number;
  inTitle: boolean;
}

export function matchToken(q: string, doc: SearchDoc): TokenHit {
  let best = 0;
  let inTitle = false;
  for (const w of doc.words) {
    const s = wordScore(q, w);
    if (s <= 0) continue;
    if (s > best) best = s;
    if (!inTitle && doc.titleWords.has(w)) inTitle = true;
    if (best >= 10 && inTitle) break;
  }
  return { score: best, inTitle };
}

export interface ScoreResult {
  score: number;
  /** alle Suchwörter haben etwas gefunden */
  full: boolean;
}

export function scoreDoc(tokens: string[], doc: SearchDoc): ScoreResult {
  if (!tokens.length) return { score: 0, full: false };
  let total = 0;
  let matched = 0;
  for (const q of tokens) {
    const h = matchToken(q, doc);
    if (h.score > 0) {
      matched++;
      total += h.score + (h.inTitle ? 6 : 0);
    }
  }
  if (!matched) return { score: 0, full: false };
  const full = matched === tokens.length;
  return { score: full ? total + 4 * tokens.length : total * 0.25, full };
}

/** Suchwörter aus der Eingabe (Satzzeichen weg, doppelte weg) */
export function queryTokens(q: string): string[] {
  return [...new Set(wordsOf(q))];
}

/**
 * Stelle im Originaltext, an der etwas gefunden wurde, mit Kontext – plus die Bereiche zum Hervorheben.
 */
export function snippetFor(text: string, tokens: string[], radius = 70): { text: string; marks: [number, number][] } {
  const flat = text.replace(/\s+/g, ' ').trim();
  if (!flat) return { text: '', marks: [] };
  const norm = normalize(flat);
  const spans: [number, number][] = [];
  const re = /[\p{L}\p{N}]+/gu;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm))) {
    const w = m[0];
    for (const q of tokens) {
      if (wordScore(q, w) > 0) {
        // genau den passenden Teil markieren, wenn es ein Teilwort-Treffer ist
        const at = w.includes(q) && q.length >= 2 ? w.indexOf(q) : 0;
        const len = w.includes(q) && q.length >= 2 ? q.length : w.length;
        spans.push([m.index + at, m.index + at + len]);
        break;
      }
    }
  }
  if (!spans.length) return { text: flat.length > radius * 2 ? flat.slice(0, radius * 2) + '…' : flat, marks: [] };
  const first = spans[0][0];
  let start = Math.max(0, first - radius);
  if (start > 0) {
    const sp = flat.indexOf(' ', start);
    if (sp !== -1 && sp < first) start = sp + 1;
  }
  const end = Math.min(flat.length, start + radius * 2 + 20);
  const cut = (start > 0 ? '…' : '') + flat.slice(start, end) + (end < flat.length ? '…' : '');
  const off = start > 0 ? 1 - start : -start;
  const marks = spans
    .filter(([a, b]) => a >= start && b <= end)
    .map(([a, b]) => [a + off, b + off] as [number, number]);
  return { text: cut, marks };
}
