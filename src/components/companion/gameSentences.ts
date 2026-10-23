import { nextFromBag } from '../../services/shuffleBag';

/**
 * Sätze am Ende einer Runde "Lauf mit dem Wesen". Vier Kategorien nach der Zeit, die man durchgehalten hat;
 * innerhalb einer Kategorie kommen die Sätze in zufälliger Reihenfolge, und erst wenn alle einmal dran waren, geht es von vorn los.
 * Teils Insider zwischen den Menschen, die die App gerade testen.
 */
export type GameCategory = 'schlecht' | 'mittel' | 'oberliga' | 'bestwert';

export const GAME_CATEGORY_LABEL: Record<GameCategory, string> = {
  schlecht: 'Ganz schlecht',
  mittel: 'Mittelfeld',
  oberliga: 'Oberliga',
  bestwert: 'Bestwert',
};

/** seconds survived → category */
export function gameCategoryFor(seconds: number): GameCategory {
  if (seconds < 8) return 'schlecht';
  if (seconds < 20) return 'mittel';
  if (seconds < 35) return 'oberliga';
  return 'bestwert';
}

export const GAME_SENTENCES: Record<GameCategory, string[]> = {
  schlecht: [
    'Kopf hoch! Schlechter als jetzt kann es statistisch gesehen in der nächsten Runde gar nicht mehr laufen.',
    'Deine Reaktionszeit hat heute ein dreitägiges Visum beantragt.',
    'Deine Reaktionszeit läuft heute über das Vodafone-Netz im ländlichen Raum.',
    'War das ein Spiel oder ein Unfall?',
    'Komplett hopsgenommen in zwei Sekunden.',
    'Hopsgenommen – geh lieber direkt in Frührente.',
    'Bei dir seh ich schwarz, aber bei Phillip schwärzer.',
    'Grandios krepiert, aber hey: Du bist gut genuuu uuuug!',
  ],
  mittel: [
    'Das war kein Spiel mehr, das war ein persönlicher Überlebenskampf.',
    'Die Wildblume blüht im Stress erst auf,\ndie Mondblume setzt noch einen drauf!',
    'Das Spiel wird schneller, die Panik groß,\ndie Rossi rennt die Koppel los.',
    'Mein Puls war höher als die Mietpreise in München.',
    'Die Jackie drückt den Turbo-Knopf,\nder Edda raucht der ganze Kopf!',
    'Das war schon fast – aber Anton war faster.',
    'Stabil.',
  ],
  oberliga: [
    'Fast so viel Pfeffer im Hintern wie Sarah.',
    'Das Erdmännchen guckt völlig starr,\nweil dieses Tempo Wahnsinn war.',
    'Zwei kleine Wölfe gehn des nachts im dunkeln …\nund sehen am Ende nur noch Sternchen funkeln!',
  ],
  bestwert: [
    'Ich wollte dich eigentlich anfeuern, aber du warst schon fertig.',
    'Bruder, du hast das Spiel nicht gespielt, du hast es gelöscht.',
    'Du bist einfach anders gebaut.',
    'Absolute Maschine!',
    'Ganz ehrlich? Such dir Hobbys. Das ist nicht mehr gesund.',
  ],
};

export function pickGameSentence(category: GameCategory): string {
  return nextFromBag('game-' + category, GAME_SENTENCES[category]) ?? '';
}

export const GAME_INSIDER_NOTE = 'Hinweis: Viele der Sätze sind Insider zwischen den Menschen, die die App gerade testen. Nicht wundern – du bist nicht komisch. Die Person, die das erstellt hat (Boycie), ist es.';
export const GAME_INSIDER_NOTE_EN = 'Note: many of these lines are inside jokes between the people currently testing the app. Do not be puzzled – you are not weird. The person who made this (Boycie) is.';
