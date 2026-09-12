/**
 * A single-pass "group items by their date-key" helper. Several
 * features (Tagesrückblick, PDF-Export-Aufbereitung, Meine Entwicklung)
 * had each grown their own near-identical copy of this — consolidated
 * here so there's one place to get it right, not three to keep in sync.
 * Always O(n) — a single pass over `items` — regardless of how many
 * distinct day-keys end up in the result.
 */
export function groupByDay<T>(items: T[], dateOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const day = dateOf(item).slice(0, 10);
    const bucket = map.get(day);
    if (bucket) bucket.push(item);
    else map.set(day, [item]);
  }
  return map;
}
