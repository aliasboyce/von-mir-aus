/**
 * A single-pass "group items by their date-key" helper. Several
 * features (Tagesrückblick, PDF-Export-Aufbereitung, Meine Entwicklung)
 * had each grown their own near-identical copy of this — consolidated
 * here so there's one place to get it right, not three to keep in sync.
 * Always O(n) — a single pass over `items` — regardless of how many
 * distinct day-keys end up in the result.
 */
/** The person's LOCAL calendar day as 'YYYY-MM-DD'. (Used to be the UTC
 * date — slice(0,10) of the ISO string — which put a check-in at 00:30
 * local time onto the previous day for anyone east of Greenwich.) */
export function localDayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function groupByDay<T>(items: T[], dateOf: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const day = localDayKey(dateOf(item));
    const bucket = map.get(day);
    if (bucket) bucket.push(item);
    else map.set(day, [item]);
  }
  return map;
}
