/**
 * Sanfter Hinweis auf Doppeltes: gleicher Text (ohne Groß-/Kleinschreibung, Satzzeichen, Emojis)
 * oder fast gleich (ein Tippfehler Unterschied bei längeren Wörtern). Blockiert nie – es ist nur ein Hinweis.
 */
export const normalizeText = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();

function distance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let last = i - 1;
    prev[0] = i;
    let rowMin = prev[0];
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, last + (a[i - 1] === b[j - 1] ? 0 : 1));
      last = tmp;
      rowMin = Math.min(rowMin, prev[j]);
    }
    if (rowMin > max) return max + 1;
  }
  return prev[b.length];
}

/** gibt den ersten Treffer zurück, der (fast) dasselbe ist wie `text` */
export function findSimilar<T extends { text: string }>(text: string, candidates: T[]): T | undefined {
  const n = normalizeText(text);
  if (n.length < 3) return undefined;
  const tolerance = n.length >= 6 ? 1 : 0;
  return candidates.find((c) => {
    const m = normalizeText(c.text);
    if (!m) return false;
    if (m === n) return true;
    return tolerance > 0 && m.length >= 6 && distance(n, m, tolerance) <= tolerance;
  });
}
