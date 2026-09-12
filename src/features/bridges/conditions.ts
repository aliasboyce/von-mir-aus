export interface Condition {
  id: string;
  label: string;
  labelEn: string;
  emoji: string;
}

/**
 * "ChatGPT-Konzept" brief — "Bedingungen": the missing link between
 * Bedürfnis → Brücke → Handlung. Sometimes it isn't the action itself
 * that decides whether it works, but the circumstances around it (the
 * brief's own example: reading works, but only in the morning, with
 * tea, in bed, without time pressure, after a walk). Deliberately a
 * fixed, recognizable vocabulary rather than free text for the common
 * ones — quick to tap, easy to notice a pattern across many bridges —
 * while BridgeFormModal still allows a free-text addition for anything
 * this list doesn't cover.
 */
export const CONDITIONS: Condition[] = [
  { id: 'draussen-gewesen', label: 'vorher draußen gewesen', labelEn: 'been outside first', emoji: '🌿' },
  { id: 'etwas-warmes', label: 'etwas Warmes (Tee, Dusche, Decke)', labelEn: 'something warm (tea, shower, blanket)', emoji: '☕' },
  { id: 'ruhiger-ort', label: 'ruhiger Ort', labelEn: 'a quiet place', emoji: '🕯️' },
  { id: 'kein-zeitdruck', label: 'kein Zeitdruck', labelEn: 'no time pressure', emoji: '⏰' },
  { id: 'nicht-allein', label: 'nicht allein', labelEn: 'not alone', emoji: '🤝' },
  { id: 'allein', label: 'allein sein', labelEn: 'being alone', emoji: '🚪' },
  { id: 'handy-weg', label: 'Handy weg', labelEn: 'phone put away', emoji: '🔕' },
  { id: 'vorher-orientierung', label: 'vorher Orientierung', labelEn: 'orientation first', emoji: '🧠' },
  { id: 'genug-energie', label: 'genug Energie', labelEn: 'enough energy', emoji: '🔋' },
  { id: 'morgens', label: 'eher morgens', labelEn: 'rather in the morning', emoji: '🌅' },
  { id: 'abends', label: 'eher abends', labelEn: 'rather in the evening', emoji: '🌙' },
  { id: 'vorher-bewegung', label: 'vorher etwas Bewegung', labelEn: 'some movement first', emoji: '🏃' },
];
