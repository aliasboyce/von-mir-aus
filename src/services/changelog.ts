/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — a short, hand-written
 * list of what changed, shown once to someone who just reloaded after
 * an update (see useWhatsNew.ts). Newest entry first. Keep each
 * entry's `items` to 2-4 short, plain-language bullets — this is a
 * friendly note, not a technical release log. Add a new entry here at
 * the end of a work session that changed something a person would
 * actually notice; skip purely internal/invisible fixes.
 */
export interface ChangelogEntry {
  id: string;
  date: string;
  items: string[];
  itemsEn: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-monatsrueckblick',
    date: '2026',
    items: [
      'Neu: Monatsrückblick — im Wochenrückblick zwischen Woche und Monat umschalten.',
      'Diese kurze "Was ist neu"-Anzeige nach einem Update.',
    ],
    itemsEn: [
      'New: monthly review — switch between week and month in the review page.',
      'This short "what\'s new" note after an update.',
    ],
  },
];
