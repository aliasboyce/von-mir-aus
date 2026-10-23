import { ORTE_CATEGORY, AKTIVITAETEN_CATEGORY } from '../../content/hilfsmittelCategories';
import type { TranslationDictionary } from '../../i18n/de';

export type HilfsmittelKind = 'hilfsmittel' | 'orte' | 'aktivitaeten';

/** Which of the three things sharing one form a resource is, by its category. */
export function kindOfCategory(category: string | undefined): HilfsmittelKind {
  if (category === ORTE_CATEGORY) return 'orte';
  if (category === AKTIVITAETEN_CATEGORY) return 'aktivitaeten';
  return 'hilfsmittel';
}

export interface KindText {
  name: string;
  subtitlePlaceholder: string;
  energy: string;
  s1Title: string;
  s1Hint: string;
  beruhigungPh: string;
  fokusPh: string;
  ventilPh: string;
  s2Title: string;
  s2Hint: string;
  anspannungPh: string;
  alarmPh: string;
  s3Title: string;
  s3Hint: string;
  dauerPh: string;
  methodePh: string;
  ausschlussPh: string;
  s4Title: string;
  s4Hint: string;
  s5Title: string;
  s5Hint: string;
  bereitschaftLabel: string;
  bereitschaftPh: string;
}

type Override = Partial<KindText>;

/**
 * Ort and Aktivität share the Hilfsmittel form (same fields), but the
 * words around the fields must fit what they are — "Gegenstand",
 * "Objekt" or "Wie viel Energie braucht dieses Hilfsmittel?" is wrong
 * for a place. Hilfsmittel keep the original wording from the
 * dictionary; Ort and Aktivität get their own.
 */
const OVERRIDES: Record<'orte' | 'aktivitaeten', Record<'de' | 'en', Override>> = {
  orte: {
    de: {
      name: 'Name des Ortes',
      subtitlePlaceholder: 'z. B. Die Bank am Fluss / Mein Lieblingscafé',
      energy: 'Wie viel Energie braucht dieser Ort?',
      s1Title: '1. Was der Ort mit mir macht',
      s1Hint: 'Was macht er mit mir?',
      beruhigungPh: 'z. B. Hier wird mein Atem von selbst ruhiger',
      fokusPh: 'z. B. Der Blick auf das Wasser holt mich aus dem Grübeln',
      ventilPh: 'z. B. Hier kann ich mich bewegen und Spannung loswerden',
      s2Title: '2. Der richtige Moment',
      s2Hint: 'Wann gehe ich dorthin?',
      anspannungPh: 'z. B. Bei 60–80 %: raus ins Grüne',
      alarmPh: 'z. B. Wenn mir die Wohnung zu eng wird',
      s3Title: '3. Wie ich den Ort nutze',
      s3Hint: 'Was macht den Besuch gut?',
      dauerPh: 'z. B. Zehn Minuten reichen',
      methodePh: 'z. B. Erst nur ankommen und umschauen',
      ausschlussPh: 'z. B. Wenn es voll ist, gehe ich wieder',
      s5Title: '4. Hinkommen & Vorbereitung',
      s5Hint: 'Was erleichtert mir den Weg dorthin?',
      bereitschaftLabel: 'Was hilft mir hinzukommen?',
      bereitschaftPh: 'z. B. Jacke und Wasser bereitlegen, Route vorher speichern',
    },
    en: {
      name: 'Name of the place',
      subtitlePlaceholder: 'e.g. The bench by the river / My favourite café',
      energy: 'How much energy does this place take?',
      s1Title: '1. What the place does for me',
      s1Hint: 'What does it do to me?',
      beruhigungPh: 'e.g. My breathing slows down on its own here',
      fokusPh: 'e.g. Looking at the water gets me out of rumination',
      ventilPh: 'e.g. Here I can move and let tension go',
      s2Title: '2. The right moment',
      s2Hint: 'When do I go there?',
      anspannungPh: 'e.g. At 60–80 %: out into the green',
      alarmPh: 'e.g. When the flat feels too small',
      s3Title: '3. How I use the place',
      s3Hint: 'What makes the visit good?',
      dauerPh: 'e.g. Ten minutes are enough',
      methodePh: 'e.g. First just arrive and look around',
      ausschlussPh: 'e.g. If it is crowded, I leave',
      s5Title: '4. Getting there & preparation',
      s5Hint: 'What makes the way there easier?',
      bereitschaftLabel: 'What helps me get there?',
      bereitschaftPh: 'e.g. Lay out jacket and water, save the route beforehand',
    },
  },
  aktivitaeten: {
    de: {
      name: 'Name der Aktivität',
      subtitlePlaceholder: 'z. B. Zehn Minuten malen / Eine Runde um den Block',
      energy: 'Wie viel Energie braucht diese Aktivität?',
      s1Title: '1. Was die Aktivität mit mir macht',
      s1Hint: 'Was macht sie mit mir?',
      beruhigungPh: 'z. B. Das gleichmäßige Gehen beruhigt mich',
      fokusPh: 'z. B. Holt mich aus dem Grübeln',
      ventilPh: 'z. B. Bringt meine Unruhe in Bewegung',
      s2Title: '2. Der richtige Moment',
      s2Hint: 'Wann tue ich das?',
      anspannungPh: 'z. B. Bei 40–60 %: eine Runde gehen',
      alarmPh: 'z. B. Wenn ich merke, dass ich festhänge',
      s3Title: '3. So gelingt es',
      s3Hint: 'Wie gestalte ich es, damit es leicht bleibt?',
      dauerPh: 'z. B. Fünf Minuten genügen',
      methodePh: 'z. B. Erst nur das Material hinlegen',
      ausschlussPh: 'z. B. Wenn es Druck macht, höre ich auf',
      s5Title: '4. Vorbereitung',
      s5Hint: 'Was erleichtert den Anfang?',
      bereitschaftLabel: 'Was erleichtert den Anfang?',
      bereitschaftPh: 'z. B. Material sichtbar hinlegen',
    },
    en: {
      name: 'Name of the activity',
      subtitlePlaceholder: 'e.g. Ten minutes of painting / A walk around the block',
      energy: 'How much energy does this activity take?',
      s1Title: '1. What the activity does for me',
      s1Hint: 'What does it do to me?',
      beruhigungPh: 'e.g. Walking evenly calms me',
      fokusPh: 'e.g. Gets me out of rumination',
      ventilPh: 'e.g. Sets my restlessness in motion',
      s2Title: '2. The right moment',
      s2Hint: 'When do I do it?',
      anspannungPh: 'e.g. At 40–60 %: walk a round',
      alarmPh: 'e.g. When I notice I am stuck',
      s3Title: '3. How it works',
      s3Hint: 'How do I keep it light?',
      dauerPh: 'e.g. Five minutes are enough',
      methodePh: 'e.g. First just lay out the materials',
      ausschlussPh: 'e.g. If it feels like pressure, I stop',
      s5Title: '4. Preparation',
      s5Hint: 'What makes starting easier?',
      bereitschaftLabel: 'What makes starting easier?',
      bereitschaftPh: 'e.g. Put the materials where I can see them',
    },
  },
};

export function kindText(t: TranslationDictionary, kind: HilfsmittelKind, lang: 'de' | 'en' = 'de'): KindText {
  const r = t.resources;
  const base: KindText = {
    name: r.hilfsmittelNameLabel,
    subtitlePlaceholder: r.hilfsmittelSubtitlePlaceholder,
    energy: t.energy.formTitleHilfsmittel,
    s1Title: r.hilfsmittelSection1Title,
    s1Hint: r.hilfsmittelSection1Hint,
    beruhigungPh: r.hilfsmittelBeruhigungPlaceholder,
    fokusPh: r.hilfsmittelFokusPlaceholder,
    ventilPh: r.hilfsmittelVentilPlaceholder,
    s2Title: r.hilfsmittelSection2Title,
    s2Hint: r.hilfsmittelSection2Hint,
    anspannungPh: r.hilfsmittelAnspannungsbereichPlaceholder,
    alarmPh: r.hilfsmittelAlarmPlaceholder,
    s3Title: r.hilfsmittelSection3Title,
    s3Hint: r.hilfsmittelSection3Hint,
    dauerPh: r.hilfsmittelDauerPlaceholder,
    methodePh: r.hilfsmittelMethodePlaceholder,
    ausschlussPh: r.hilfsmittelAusschlussPlaceholder,
    s4Title: r.hilfsmittelSection4Title,
    s4Hint: r.hilfsmittelSection4Hint,
    s5Title: r.hilfsmittelSection5Title,
    s5Hint: r.hilfsmittelSection5Hint,
    bereitschaftLabel: r.hilfsmittelBereitschaftLabel,
    bereitschaftPh: r.hilfsmittelBereitschaftPlaceholder,
  };
  if (kind === 'hilfsmittel') return base;
  return { ...base, ...OVERRIDES[kind][lang] };
}
