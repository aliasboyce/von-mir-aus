/**
 * "Die App stärker verbinden" brief, Section 5 — after choosing a
 * protection strategy, the app may gently offer what could be behind
 * it, always as a possibility ("könnte dahinterstecken"), never a
 * claim ("dein Bedürfnis ist X"). Terms are drawn from the existing
 * NEED_CATEGORY_GROUPS vocabulary wherever a close match exists, so
 * tapping "passt" adds a real, already-established need rather than a
 * new parallel word — keeps "Bedürfnis" one consistent vocabulary
 * across the whole app instead of two similar-but-different lists.
 */
export const PROTECTION_TO_NEEDS_DE: Record<string, string[]> = {
  abschalten: ['Erholung', 'Ruhe', 'Distanz'],
  'nichts mehr fühlen': ['Schutz', 'Distanz', 'Erholung'],
  'Kontrolle zurückgewinnen': ['Schutz', 'Übersicht', 'Klarheit', 'Selbstbestimmung'],
  analysieren: ['Klarheit', 'Übersicht', 'Struktur'],
  'möglichst still werden': ['Schutz', 'Struktur', 'Ruhe'],
  Rückzug: ['Ruhe', 'Schutz', 'Distanz', 'Erholung'],
  'perfekt sein wollen': ['Anerkennung', 'Wertschätzung', 'Schutz'],
  'Handy/Serien als Ablenkung': ['Erholung', 'Ruhe', 'Leichtigkeit'],
  'sich klein machen': ['Schutz', 'Zugehörigkeit'],
  'alles kontrollieren': ['Schutz', 'Übersicht', 'Klarheit', 'Selbstbestimmung'],
  'sich anpassen': ['Zugehörigkeit', 'Akzeptanz', 'Schutz'],
  'gefallen wollen': ['Zugehörigkeit', 'Anerkennung', 'Wertschätzung'],
  dissoziieren: ['Schutz', 'Distanz', 'Erholung'],
  'um Hilfe bitten': ['Unterstützung', 'Verbindung'],
  'eine Pause machen': ['Erholung', 'Ruhe'],
  'mit jemandem sprechen': ['Verständnis', 'Unterstützung', 'Kontakt'],
  'bewusst durchatmen': ['Ruhe', 'Struktur'],
  'sich Zeit nehmen': ['Ruhe', 'Klarheit'],
  'Grenzen setzen': ['Abgrenzung', 'Selbstbestimmung', 'Schutz'],
  'sich bewegen': ['Kraft', 'Erholung'],
  'aufschreiben, was los ist': ['Klarheit', 'Verständnis'],
};
