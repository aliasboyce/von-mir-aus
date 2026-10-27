type LFn = (de: string, en: string) => string;

/** Kurz erklärt: was ein Zettel ist, der irgendwo angeheftet wurde. */
export const SLIP_CALENDAR_HINT = (L: LFn) =>
  L('Diese Zettel hängen hier. Du kannst sie abhaken oder zurück in die Parkbox / ins Wartezimmer legen.', 'These slips are pinned here. Tick them off or put them back in the Park box / waiting room.');

/** „Zettel losfliegen lassen“ – was dabei passiert. */
export const SLIP_FLY_EXPLAIN = (L: LFn) =>
  L('Der Zettel fliegt zur gewählten Zeit auf deine Startseite – als Erinnerung. Bis dahin liegt er in der Box – mit ✉️-Vermerk.', 'At the time you choose, the slip flies to your start page — as a reminder. Until then it stays in the box, marked with ✉️.');

export const PARK_EXPLAIN = (L: LFn) =>
  L('Parkbox = kurze Zettel. Etwas fällt dir ein, du willst es nicht verlieren – aufschreiben, weglegen, später entscheiden.', 'Park box = short slips. Something comes to mind and you don’t want to lose it — write it down, put it away, decide later.');

export const WAIT_EXPLAIN = (L: LFn) =>
  L('Wartezimmer = Dinge, die irgendwann passieren sollen (Ideen, Vorhaben, Aktivitäten) – aber noch keinen Zeitraum haben. Sie warten auf ihren Platz im Kalender.', 'Waiting room = things that should happen sometime (ideas, plans, activities) — but have no time yet. They wait for their place in the calendar.');
