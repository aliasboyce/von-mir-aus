import { getUiLanguage } from '../../services/uiLanguage';
import { FEELING_GROUPS, NEED_CATEGORY_GROUPS } from './zugangContent';

/**
 * English for the suggestion lists of the Zugang flow (body sensations, protection strategies, obstacles, what helps).
 * What is stored stays the German wording (so old entries, patterns and the garden keep working);
 * only what is SHOWN follows the app language. Own words typed by the person are never touched.
 */
export const ZUGANG_EN: Record<string, string> = {
  // body – tense / activated
  'schwere Augen': 'heavy eyes', benommen: 'dazed', 'Watte im Kopf': 'cotton wool in my head', Druck: 'pressure', 'flache Atmung': 'shallow breathing',
  'innere Unruhe': 'inner restlessness', Herzklopfen: 'pounding heart', frieren: 'feeling cold', angespannt: 'tense', leer: 'empty',
  'Kloß im Hals': 'lump in my throat', 'Enge im Brustkorb': 'tight chest', Zittern: 'trembling', Kribbeln: 'tingling', 'taube Hände/Füße': 'numb hands/feet',
  Übelkeit: 'nausea', Schwindel: 'dizziness', 'angespannter Kiefer': 'tense jaw', 'schwere Glieder': 'heavy limbs', 'zusammengezogener Magen': 'clenched stomach',
  heiß: 'hot', 'kalte Hände': 'cold hands', 'wackelige Beine': 'wobbly legs', 'trockener Mund': 'dry mouth',
  // body – calm
  warm: 'warm', ruhig: 'calm', entspannt: 'relaxed', leicht: 'light', 'angenehm wach': 'pleasantly awake', weich: 'soft', 'ruhig atmend': 'breathing calmly',
  gelöst: 'loosened up', stabil: 'steady', 'angenehm schwer': 'pleasantly heavy', energiegeladen: 'full of energy', wach: 'awake', Magenknurren: 'stomach rumbling',
  'gleichmäßige Atmung': 'even breathing', 'ruhiger Puls': 'calm pulse', 'aufrechte Grundspannung': 'upright base tension', 'klarer Blick': 'clear gaze',
  'entspannte Stirn': 'relaxed forehead', 'klarer Kopf': 'clear head',
  // body – mobilised
  'Atmung im Brustkorb': 'breathing in the chest', 'Puls im Hals spürbar': 'pulse felt in the throat', 'Verspannung im Nacken': 'tension in the neck',
  'hochgezogene Schultern': 'raised shoulders', 'hektischer Blick': 'frantic gaze', Kieferpresse: 'clenched jaw', 'feuchte Hände': 'clammy hands',
  Hitzewallungen: 'hot flushes', 'Flauen im Magen': 'queasy stomach', 'zugeschnürte Kehle': 'tight throat', 'rasender Puls': 'racing pulse', 'Fäuste ballen': 'clenching fists',
  Tunnelblick: 'tunnel vision', 'kalter Schweiß': 'cold sweat', 'Stechen im Magen': 'stabbing pain in the stomach', 'Atem anhalten': 'holding my breath',
  // body – shut down
  'wie eingemauert': 'as if walled in', 'eingefrorene Mimik': 'frozen expression', Schluckbeschwerden: 'trouble swallowing',
  'Druck im Kopf': 'pressure in my head', 'sehr flache Atmung': 'very shallow breathing', 'Blutdruck sackt ab': 'blood pressure dropping', 'schlaffe Muskeln': 'limp muscles',
  'wie durch Watte': 'as if through cotton wool', 'aus dem Körper schweben': 'floating out of my body', sprachlos: 'speechless', 'glanzloser Blick': 'dull gaze',
  // protection strategies
  abschalten: 'switching off', 'nichts mehr fühlen': 'feeling nothing', 'Kontrolle zurückgewinnen': 'regaining control', analysieren: 'analysing',
  'möglichst still werden': 'getting as quiet as possible', Rückzug: 'withdrawing', 'perfekt sein wollen': 'wanting to be perfect',
  'Handy/Serien als Ablenkung': 'phone/series as distraction', 'sich klein machen': 'making myself small', 'alles kontrollieren': 'controlling everything',
  'sich anpassen': 'adapting', 'gefallen wollen': 'wanting to please', dissoziieren: 'dissociating', 'weiß ich nicht': 'I don’t know',
  'gerade keine besondere Strategie': 'no particular strategy right now', 'einfach offen bleiben': 'simply staying open', 'mich zeigen, wie ich bin': 'showing myself as I am',
  'Nähe zulassen': 'allowing closeness', 'Pause machen': 'taking a break', 'Nein sagen': 'saying no', 'Grenze setzen': 'setting a boundary', 'um Hilfe bitten': 'asking for help',
  'kurz rausgehen': 'stepping out briefly', 'Reize reduzieren': 'reducing stimuli', 'Tempo rausnehmen': 'slowing down', 'Bescheid sagen, dass ich Abstand brauche': 'letting someone know I need distance',
  'orientieren (3 Dinge sehen)': 'orienting (see 3 things)', 'Nähe dosieren': 'dosing closeness', 'später antworten': 'answering later', 'mich bewegen statt erstarren': 'moving instead of freezing',
  // what helps others / care actions
  zuhören: 'listening', sortieren: 'sorting things out', 'Tee machen': 'making tea', 'spazieren gehen': 'going for a walk', 'einfach da sein': 'just being there',
  mitdenken: 'thinking along', erinnern: 'reminding', 'gemeinsam schweigen': 'being quiet together', 'in den Arm nehmen': 'giving a hug', 'ruhig sprechen': 'speaking calmly',
  'Zeit geben': 'giving time', 'nicht bewerten': 'not judging', 'erklären, was als Nächstes passiert': 'explaining what happens next',
  // obstacles
  'Angst vor Nähe': 'fear of closeness', Misstrauen: 'mistrust', Erschöpfung: 'exhaustion', 'innerer Kritiker': 'inner critic', 'altes Beschämungsmuster': 'old shaming pattern',
  'Stimme aus der Vergangenheit': 'voice from the past', Zeitmangel: 'lack of time', '„Ich darf das nicht.“': '“I’m not allowed to.”', 'Angst vor Kontrollverlust': 'fear of losing control',
  'Scham, Hilfe zu brauchen': 'shame about needing help', 'Angst, andere zu belasten': 'fear of burdening others', '„Ich muss das alleine schaffen.“': '“I have to manage this alone.”',
  'zu viele Aufgaben gleichzeitig': 'too many tasks at once', 'gerade keine Zeit': 'no time right now', 'erstmal den Ort wechseln müssen': 'need to change place first',
  'zu laut/unruhig hier': 'too loud/restless here', 'andere Menschen sind da': 'other people are around', 'kein passender Moment gerade': 'not the right moment right now',
  'gar nichts — es geht gerade gut': 'nothing – I’m doing fine right now',
  // connection items
  Kreativität: 'creativity', Produktivität: 'productivity', 'soziale Verbindung': 'social connection', 'emotionale Verbindung': 'emotional connection', Verantwortung: 'responsibility',
  Dankbarkeit: 'gratitude', Familie: 'family', Partnerschaft: 'partnership', Freundschaft: 'friendship', Gemeinschaft: 'community', Identität: 'identity', Tageslicht: 'daylight',
  Rhythmus: 'rhythm', Natur: 'nature', Tiere: 'animals', Schlaf: 'sleep', Erholung: 'rest', 'Wasser/Nahrung': 'water/food', Bewegung: 'movement', Integrität: 'integrity',
  Ehrlichkeit: 'honesty', Spiritualität: 'spirituality', Sinn: 'meaning', Humor: 'humour', Lachen: 'laughing', Neugier: 'curiosity', Lernen: 'learning',
  // actions
  'jemanden anrufen': 'calling someone', 'aufschreiben, was los ist': 'writing down what is going on', 'etwas Gutes tun': 'doing something good', rausgehen: 'going outside', lesen: 'reading',
  arbeiten: 'working', 'liegen bleiben dürfen': 'being allowed to stay lying down', 'Hilfe holen': 'getting help', 'eine Kleinigkeit erledigen': 'getting one small thing done',
  'schlafen/ruhen': 'sleeping/resting', sprechen: 'talking', 'kreativ werden': 'getting creative',
  rauchen: 'smoking', vermeiden: 'avoiding', ablenkung: 'distraction', kontrollieren: 'controlling',
  // alternatives
  'kurze Pause einlegen': 'taking a short break', 'Bescheid sagen, dass ich gerade nicht kann': 'letting someone know I can’t right now',
  'ein kleiner Körperkontakt-Anker (Hand aufs Herz)': 'a small body-contact anchor (hand on heart)', 'Gefühl nur kurz dosiert anschauen': 'looking at the feeling only briefly, in small doses',
  'jemandem sagen: „Ich spüre gerade wenig“': 'telling someone: “I feel very little right now”', 'eine Sache wählen, die ich entscheiden darf': 'choosing one thing I get to decide',
  'orientieren: 3 Dinge sehen': 'orienting: see 3 things', 'um Struktur bitten statt alles selbst zu halten': 'asking for structure instead of holding everything myself',
  'erst einen Atemzug lang spüren, dann denken': 'feeling for one breath first, then thinking', 'eine Frage aufschreiben und liegen lassen': 'writing a question down and leaving it',
  'eine Person fragen, wie sie es sieht': 'asking a person how they see it', 'einen Satz sagen, der reicht': 'saying one sentence that is enough', 'ein Zeichen vereinbaren': 'agreeing on a signal',
  'leise Bewegung statt Erstarren': 'quiet movement instead of freezing', 'Rückzug mit Ansage („Ich melde mich später“)': 'withdrawing with a heads-up (“I’ll get back to you later”)',
  'Ort mit weniger Reizen wählen': 'choosing a place with fewer stimuli', 'kleine Verbindung halten (Nachricht, Emoji)': 'keeping a small connection (message, emoji)',
  '„gut genug“ als Maßstab festlegen': 'setting “good enough” as the standard', 'etwas bewusst unfertig lassen': 'leaving something unfinished on purpose',
  'Pause statt Nachbessern': 'a break instead of fixing more', 'Ablenkung bewusst wählen und begrenzen': 'choosing distraction on purpose and limiting it',
  'danach kurz nachspüren': 'checking in with myself afterwards', 'etwas mit den Händen tun': 'doing something with my hands', 'einen Bedarf klein, aber laut aussprechen': 'saying a need out loud, even if small',
  'Haltung öffnen, Boden spüren': 'opening my posture, feeling the ground', 'eine Grenze in einem Satz setzen': 'setting a boundary in one sentence', 'einen Teil abgeben': 'handing off a part',
  'Plan B zulassen': 'allowing a plan B', 'einer Person eine Aufgabe überlassen': 'leaving one task to someone', 'erst fragen: „Was brauche ich?“': 'asking first: “What do I need?”',
  'ein kleines Nein üben': 'practising a small no', 'Bedarf aussprechen statt erraten': 'saying a need instead of making others guess', 'Nein sagen üben': 'practising saying no',
  'jemanden wählen, bei dem es sicherer ist': 'choosing someone with whom it feels safer', 'orientieren: Raum anschauen, Farben benennen': 'orienting: looking around the room, naming colours',
  'Füße spüren, Wärme/Kälte': 'feeling my feet, warmth/cold', 'Bescheid sagen und Kontakt halten': 'letting someone know and staying in touch',
};

// feelings and needs already come with English words next to the German ones
FEELING_GROUPS.forEach((g) => g.sub.forEach((w, i) => { if (g.subEn[i] && !(w in ZUGANG_EN)) ZUGANG_EN[w] = g.subEn[i]; }));
NEED_CATEGORY_GROUPS.forEach((g) => g.items.forEach((w, i) => { if (g.itemsEn[i] && !(w in ZUGANG_EN)) ZUGANG_EN[w] = g.itemsEn[i]; }));

/** shows a stored (German) Zugang item in the app language; own words pass through unchanged */
export function zl(item: string): string {
  return getUiLanguage() === 'en' ? ZUGANG_EN[item] ?? item : item;
}
