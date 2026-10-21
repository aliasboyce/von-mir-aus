/** Questions for getting back in when the PIN is forgotten. Friendly ones – nothing that digs into painful things. */
export interface SecurityQuestion {
  id: string;
  de: string;
  en: string;
}

export const SECURITY_QUESTIONS: SecurityQuestion[] = [
  { id: 'q1', de: 'Wie hieß mein erstes Haustier (oder das, das ich mir gewünscht habe)?', en: 'What was my first pet called (or the one I wished for)?' },
  { id: 'q2', de: 'Was war mein Hassfach in der Schule?', en: 'What was my least favourite school subject?' },
  { id: 'q3', de: 'Was war mein Lieblingsessen als Kind?', en: 'What was my favourite food as a child?' },
  { id: 'q4', de: 'Wie hieß mein Lieblingskuscheltier oder meine Lieblingspuppe?', en: 'What was my favourite stuffed toy or doll called?' },
  { id: 'q5', de: 'Was war mein erster Berufswunsch?', en: 'What was my first career wish?' },
  { id: 'q6', de: 'Welches Buch, welchen Film oder welche Serie habe ich als Kind am liebsten gemocht?', en: 'Which book, film or series did I like best as a child?' },
  { id: 'q7', de: 'In welcher Stadt oder an welchem Ort war ich zuletzt im schönsten Urlaub?', en: 'Which town or place was my loveliest holiday in?' },
  { id: 'q8', de: 'Wie hieß eine Lehrerin oder ein Lehrer, die/den ich mochte (Nachname)?', en: 'What was the surname of a teacher I liked?' },
  { id: 'q9', de: 'Welcher Ort fühlt sich für mich am ruhigsten an?', en: 'Which place feels calmest to me?' },
  { id: 'q10', de: 'Welches Lied oder welche Band singe ich immer mit?', en: 'Which song or band do I always sing along to?' },
];

export const questionText = (qid: string, own: string | undefined, en: boolean): string => {
  if (qid === 'own') return own || (en ? 'My own question' : 'Meine eigene Frage');
  const q = SECURITY_QUESTIONS.find((x) => x.id === qid);
  return q ? (en ? q.en : q.de) : '';
};
