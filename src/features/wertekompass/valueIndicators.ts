export interface ValueIndicatorSet {
  value: string;
  indicators: string[];
  indicatorsEn: string[];
}

/**
 * "ChatGPT-Konzept" brief — "Woran würde ich merken, dass ich so
 * lebe?" turns an abstract value ("Natur ist mir wichtig") into
 * concrete, everyday, checkable behavior ("bin ich regelmäßig
 * draußen", "kümmere ich mich um Pflanzen") — the same move ACT makes
 * from values to committed action. Deliberately concrete and everyday
 * rather than aspirational, so someone can genuinely check "does this
 * describe my actual week" rather than an idealized life.
 */
export const VALUE_INDICATORS: ValueIndicatorSet[] = [
  { value: 'Kreativität', indicators: ['ich mache etwas mit meinen Händen', 'ich probiere eine neue Idee aus', 'ich schreibe, male oder gestalte etwas', 'ich improvisiere, statt einer Anleitung zu folgen'], indicatorsEn: ['I make something with my hands', 'I try out a new idea', 'I write, paint, or design something', 'I improvise instead of following instructions'] },
  { value: 'Produktivität', indicators: ['ich schließe etwas ab, das mir wichtig war', 'ich sehe sichtbaren Fortschritt bei etwas', 'ich nutze meine Zeit für etwas, das mir etwas bedeutet'], indicatorsEn: ['I finish something that mattered to me', 'I see visible progress on something', 'I use my time for something meaningful to me'] },
  { value: 'soziale Verbindung', indicators: ['ich verbringe Zeit mit anderen Menschen', 'ich nehme an etwas Gemeinsamem teil', 'ich melde mich bei jemandem'], indicatorsEn: ['I spend time with other people', 'I take part in something shared', 'I reach out to someone'] },
  { value: 'emotionale Verbindung', indicators: ['ich teile etwas Persönliches mit jemandem', 'ich höre jemandem wirklich zu', 'ich lasse mich berühren von etwas'], indicatorsEn: ['I share something personal with someone', 'I really listen to someone', 'I let myself be moved by something'] },
  { value: 'Verantwortung', indicators: ['ich kümmere mich um etwas, das mir anvertraut ist', 'ich halte eine Zusage ein', 'ich übernehme eine Aufgabe freiwillig'], indicatorsEn: ['I take care of something entrusted to me', 'I keep a commitment', 'I take on a task voluntarily'] },
  { value: 'Dankbarkeit', indicators: ['ich bemerke etwas Gutes bewusst', 'ich sage jemandem Danke', 'ich schreibe auf, was gerade gut ist'], indicatorsEn: ['I consciously notice something good', 'I thank someone', 'I write down what is good right now'] },
  { value: 'Familie', indicators: ['ich habe Kontakt zu Familie', 'ich verbringe Zeit mit Familie', 'ich denke an Familie, ohne dass es belastend ist'], indicatorsEn: ['I have contact with family', 'I spend time with family', 'I think of family without it being distressing'] },
  { value: 'Partnerschaft', indicators: ['ich verbringe bewusste Zeit mit meinem Partner/meiner Partnerin', 'ich zeige Zuneigung', 'ich spreche offen über etwas, das mir wichtig ist'], indicatorsEn: ['I spend intentional time with my partner', 'I show affection', 'I speak openly about something that matters to me'] },
  { value: 'Freundschaft', indicators: ['ich treffe mich mit einer Freundin/einem Freund', 'ich schreibe jemandem, ohne Anlass', 'ich fühle mich verstanden von jemandem'], indicatorsEn: ['I meet up with a friend', 'I message someone without a specific reason', 'I feel understood by someone'] },
  { value: 'Gemeinschaft', indicators: ['ich bin Teil von etwas Größerem als mir selbst', 'ich helfe bei etwas Gemeinsamem mit', 'ich fühle mich zugehörig'], indicatorsEn: ['I am part of something bigger than myself', 'I help with something shared', 'I feel like I belong'] },
  { value: 'Identität', indicators: ['ich handle im Einklang mit dem, wer ich bin', 'ich sage, was ich wirklich denke', 'ich muss mich nicht verstellen'], indicatorsEn: ['I act in line with who I am', 'I say what I actually think', "I don't have to pretend"] },
  { value: 'Tageslicht', indicators: ['ich bin tagsüber draußen', 'ich öffne die Vorhänge/Fenster', 'ich sitze an einem hellen Ort'], indicatorsEn: ['I go outside during the day', 'I open the curtains/windows', 'I sit somewhere bright'] },
  { value: 'Rhythmus', indicators: ['mein Tag hat eine erkennbare Struktur', 'ich stehe und schlafe zu ähnlichen Zeiten', 'es gibt feste Punkte in meinem Tag'], indicatorsEn: ['My day has a recognizable structure', 'I wake and sleep around similar times', 'There are fixed points in my day'] },
  { value: 'Natur', indicators: ['ich bin regelmäßig draußen', 'ich kümmere mich um Pflanzen', 'ich verbringe Zeit mit Tieren', 'ich beobachte Jahreszeiten', 'ich fühle mich verbunden mit der Natur'], indicatorsEn: ['I am regularly outside', 'I take care of plants', 'I spend time with animals', 'I notice the seasons', 'I feel connected to nature'] },
  { value: 'Tiere', indicators: ['ich verbringe Zeit mit einem Tier', 'ich kümmere mich um ein Tier', 'ich beobachte Tiere'], indicatorsEn: ['I spend time with an animal', 'I take care of an animal', 'I watch animals'] },
  { value: 'Schlaf', indicators: ['ich schlafe ausreichend', 'ich habe eine Abendroutine', 'ich fühle mich erholt aufgewacht'], indicatorsEn: ['I sleep enough', 'I have an evening routine', 'I wake up feeling rested'] },
  { value: 'Erholung', indicators: ['ich habe Zeit ohne Aufgaben', 'ich mache etwas nur, weil es guttut', 'ich erlaube mir, nichts zu tun'], indicatorsEn: ['I have time without tasks', 'I do something purely because it feels good', 'I allow myself to do nothing'] },
  { value: 'Wasser/Nahrung', indicators: ['ich trinke ausreichend', 'ich esse etwas, das mir guttut', 'ich nehme mir Zeit zum Essen'], indicatorsEn: ['I drink enough', 'I eat something that agrees with me', 'I take time to eat'] },
  { value: 'Bewegung', indicators: ['ich bewege meinen Körper', 'ich gehe zu Fuß statt zu fahren', 'ich spüre meinen Körper nach Bewegung angenehm'], indicatorsEn: ['I move my body', 'I walk instead of riding', 'My body feels good after moving'] },
  { value: 'Integrität', indicators: ['meine Handlungen passen zu meinen Werten', 'ich stehe zu dem, was ich gesagt habe', 'ich muss mich innerlich nicht verbiegen'], indicatorsEn: ['My actions match my values', 'I stand by what I said', "I don't have to twist myself internally"] },
  { value: 'Ehrlichkeit', indicators: ['ich sage die Wahrheit, auch wenn es unbequem ist', 'ich vermeide es, mich zu verstellen', 'ich spreche offen über Schwieriges'], indicatorsEn: ['I tell the truth, even when uncomfortable', 'I avoid pretending', 'I speak openly about difficult things'] },
  { value: 'Spiritualität', indicators: ['ich nehme mir Zeit für Stille oder Reflexion', 'ich fühle mich mit etwas Größerem verbunden', 'ich praktiziere ein Ritual, das mir wichtig ist'], indicatorsEn: ['I take time for stillness or reflection', 'I feel connected to something bigger', 'I practice a ritual that matters to me'] },
  { value: 'Sinn', indicators: ['ich tue etwas, das mir bedeutsam erscheint', 'ich verstehe, wofür ich etwas tue', 'ich trage zu etwas bei, das über mich hinausgeht'], indicatorsEn: ['I do something that feels meaningful', 'I understand why I am doing something', 'I contribute to something beyond myself'] },
  { value: 'Humor', indicators: ['ich lache über etwas', 'ich nehme eine Situation mit Leichtigkeit', 'ich teile etwas Lustiges mit jemandem'], indicatorsEn: ['I laugh about something', 'I take a situation lightly', 'I share something funny with someone'] },
  { value: 'Lachen', indicators: ['ich lache aus vollem Herzen', 'ich verbringe Zeit mit jemandem, der mich zum Lachen bringt', 'ich sehe/lese/höre etwas, das mich amüsiert'], indicatorsEn: ['I laugh wholeheartedly', 'I spend time with someone who makes me laugh', 'I watch/read/hear something amusing'] },
  { value: 'Neugier', indicators: ['ich probiere etwas Neues aus', 'ich stelle eine Frage, nur weil es mich interessiert', 'ich lerne etwas, das mir nicht nützen muss'], indicatorsEn: ['I try something new', 'I ask a question purely out of interest', "I learn something that doesn't need to be useful"] },
  { value: 'Lernen', indicators: ['ich verstehe etwas, das ich vorher nicht verstanden habe', 'ich übe eine Fähigkeit', 'ich lese oder höre etwas Neues'], indicatorsEn: ["I understand something I didn't before", 'I practice a skill', 'I read or hear something new'] },
];

export function indicatorsFor(value: string): ValueIndicatorSet | undefined {
  return VALUE_INDICATORS.find((v) => v.value === value);
}
