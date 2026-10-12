import { createRepository, createId } from '../../services/storage/repository';

export interface DiaryTemplate {
  id: string;
  name: string;
  nameEn?: string;
  /** Each question becomes its own line (with room to answer
   * underneath) when the template is applied to a new entry. */
  questions: string[];
  questionsEn?: string[];
  isBuiltin?: boolean;
  /** "vorausschauend" = prepares / looks ahead (the day, a situation, what I need);
   * "rueckblickend" = looks back at what happened. Own templates without a phase are
   * listed separately until the person sorts them in. */
  phase?: DiaryTemplatePhase;
  /** A short note placed above the questions (e.g. safety hint for the Diary Card). */
  intro?: string;
  introEn?: string;
  /** Where the form of the template comes from — shown small in the picker. */
  source?: string;
}

export type DiaryTemplatePhase = 'vorausschauend' | 'rueckblickend';

/**
 * "Mehr vorgespeicherte Beispiel-Vorlagen fuers Tagebuch"-Auftrag —
 * grown from the original single built-in to a handful covering
 * different angles (evening review, NVC, nervous system, gentle
 * small-steps, gratitude, body check-in, connection to life, and a
 * single difficult emotion). The architecture (this array + the
 * repository below) needs no change to grow further: new built-ins
 * are just new entries here, right alongside user-created ones in
 * the same picker.
 */
export const BUILTIN_DIARY_TEMPLATES: DiaryTemplate[] = [
  {
    id: 'builtin-abendlicher-rueckblick',
    phase: 'rueckblickend',
    name: 'Abendlicher Rückblick',
    nameEn: 'Evening review',
    questions: ['Was war heute gut?', 'Was war schwierig?', 'Was hat mir geholfen?', 'Was brauche ich morgen?'],
    questionsEn: ['What was good today?', 'What was difficult?', 'What helped me?', 'What do I need tomorrow?'],
    isBuiltin: true,
  },
  {
    // Vier-Schritte der Gewaltfreien Kommunikation (Beobachtung,
    // Gefuehl, Beduerfnis, Bitte) — dieselbe Struktur, die bereits
    // beim Gefuehlsrad und der Beduerfnis-Zuordnung in der App steckt.
    id: 'builtin-gfk-reflexion',
    phase: 'rueckblickend',
    name: 'GFK-Reflexion',
    nameEn: 'NVC reflection',
    questions: [
      'Was ist konkret passiert? (nur die Beobachtung, ohne Bewertung)',
      'Was habe ich dabei gefühlt?',
      'Welches Bedürfnis steckte vermutlich dahinter?',
      'Was würde mir jetzt helfen, oder worum möchte ich bitten?',
    ],
    questionsEn: [
      'What actually happened? (just the observation, no judgment)',
      'What did I feel?',
      'What need was probably underneath that?',
      'What would help me now, or what would I like to ask for?',
    ],
    isBuiltin: true,
  },
  {
    // An die bestehende Nervensystem-/Polyvagal-Seite angelehnt
    // (ventral/sympathisch/dorsal) — hilft, den Zusammenhang
    // zwischen Zustand und Alltag nachzuverfolgen.
    id: 'builtin-nervensystem-check',
    phase: 'rueckblickend',
    name: 'Nervensystem-Check',
    nameEn: 'Nervous system check',
    questions: [
      'In welchem Zustand war mein Nervensystem heute überwiegend? (sicher, mobilisiert, erstarrt)',
      'Was hat diesen Zustand ausgelöst oder begünstigt?',
      'Was hat geholfen, wieder zur Ruhe zu kommen — oder was könnte helfen?',
      'Was hat mein Nervensystem heute gebraucht?',
    ],
    questionsEn: [
      'What state was my nervous system mostly in today? (safe, mobilized, frozen)',
      'What triggered or contributed to that state?',
      'What helped me settle back down — or what might help?',
      "What did my nervous system need today?",
    ],
    isBuiltin: true,
  },
  {
    // Bewusst sanft und selbstmitfuehlend gehalten, fuer schwerere
    // Tage — passend zum Grundton der App: keine Leistungsfrage,
    // kleine Schritte zaehlen.
    id: 'builtin-kleine-schritte',
    phase: 'rueckblickend',
    name: 'Kleine Schritte',
    nameEn: 'Small steps',
    questions: [
      'Was habe ich heute geschafft, auch wenn es klein war?',
      'Wie bin ich heute mit mir selbst umgegangen?',
      'Was hätte ich gebraucht, das ich mir nicht geben konnte?',
      'Ein Satz an mich für morgen:',
    ],
    questionsEn: [
      'What did I manage today, even if it was small?',
      'How did I treat myself today?',
      "What did I need that I couldn't give myself?",
      'One sentence for myself for tomorrow:',
    ],
    isBuiltin: true,
  },
  {
    // Ein bewusst leichter, dankbarkeitsorientierter Gegenpol zu den
    // eher verarbeitenden Vorlagen oben — muss nicht jeden Tag um ein
    // Problem kreisen.
    id: 'builtin-dankbarkeit',
    phase: 'rueckblickend',
    name: 'Dankbarkeit',
    nameEn: 'Gratitude',
    questions: [
      'Was hat mich heute zum Lächeln gebracht, auch wenn es klein war?',
      'Wofür bin ich heute dankbar?',
      'Wer oder was hat mir heute gutgetan?',
    ],
    questionsEn: [
      'What made me smile today, even if it was small?',
      'What am I grateful for today?',
      'Who or what felt good today?',
    ],
    isBuiltin: true,
  },
  {
    // Knuepft an die Koerperwahrnehmungs-Seite und das Zonen-Modell an,
    // ohne Prozentzahlen oder Fachbegriffe zu verlangen — bewusst
    // niedrigschwellig gehalten.
    id: 'builtin-koerper-checkin',
    phase: 'vorausschauend',
    name: 'Körper-Check-in',
    nameEn: 'Body check-in',
    questions: [
      'Wo in meinem Körper spüre ich gerade etwas besonders deutlich?',
      'Wie fühlt sich meine Atmung gerade an?',
      'Was würde meinem Körper jetzt gerade gut tun?',
    ],
    questionsEn: [
      'Where in my body do I notice something especially clearly right now?',
      'How does my breathing feel right now?',
      'What would feel good to my body right now?',
    ],
    isBuiltin: true,
  },
  {
    // An Zugangs eigenen "Verbindung zum Leben"-Schritt angelehnt —
    // dieselbe Grundfrage, aber als eigenstaendige Tagebuch-Vorlage
    // fuer Momente ohne akute Belastung.
    id: 'builtin-verbindung-zum-leben',
    phase: 'rueckblickend',
    name: 'Verbindung zum Leben',
    nameEn: 'Connection to life',
    questions: [
      'Womit oder mit wem habe ich mich heute verbunden gefühlt?',
      'Was ist mir heute wichtig gewesen?',
      'Wo möchte ich morgen mehr Verbindung spüren?',
    ],
    questionsEn: [
      'What or who did I feel connected to today?',
      'What mattered to me today?',
      'Where would I like to feel more connection tomorrow?',
    ],
    isBuiltin: true,
  },
  {
    // Eine tiefer gehende, aber weiterhin wertfreie Vorlage fuer eine
    // einzelne, schwer greifbare Emotion — bewusst getrennt von der
    // GFK-Reflexion oben, die eher auf eine konkrete Situation zielt.
    id: 'builtin-schwierige-emotion',
    phase: 'rueckblickend',
    name: 'Eine schwierige Emotion verstehen',
    nameEn: 'Understanding a difficult emotion',
    questions: [
      'Welches Gefühl ist gerade am stärksten da?',
      'Wo im Körper spüre ich es?',
      'Kenne ich dieses Gefühl von früher — woher könnte es kommen?',
      'Was würde diesem Gefühl gerade helfen, ohne es wegzudrücken?',
    ],
    questionsEn: [
      "What feeling is strongest right now?",
      'Where in my body do I feel it?',
      'Do I know this feeling from before — where might it come from?',
      'What would help this feeling right now, without pushing it away?',
    ],
    isBuiltin: true,
  },
  // ---------------------------------------------------------------
  // Vorausschauend — vorbereiten, planen, den Tag ausrichten
  // ---------------------------------------------------------------
  {
    id: 'builtin-tag-ausrichten',
    phase: 'vorausschauend',
    name: 'Den Tag ausrichten',
    nameEn: 'Setting up the day',
    questions: [
      'Was brauche ich heute am meisten?',
      'Wie viel Energie habe ich heute — und welche eine kleine Sache passt dazu?',
      'Was könnte heute schwierig werden — und was hilft mir dann?',
      'Worauf freue ich mich, auch wenn es klein ist?',
    ],
    questionsEn: [
      'What do I need most today?',
      'How much energy do I have today — and which one small thing fits it?',
      'What might be difficult today — and what helps me then?',
      'What am I looking forward to, even if it is small?',
    ],
    isBuiltin: true,
  },
  {
    // Knüpft an die Umstände an (global gespeicherte Liste): was die Bedingungen
    // sind, unter denen etwas gelingt — und ob ich sie herstellen kann.
    id: 'builtin-umstaende-vorbereiten',
    phase: 'vorausschauend',
    name: 'Umstände vorbereiten',
    nameEn: 'Preparing the circumstances',
    questions: [
      'Was möchte ich ausprobieren oder tun?',
      'Unter welchen Umständen gelingt mir das leichter? (z. B. genug Schlaf, ruhiger Ort, nicht allein)',
      'Welche davon kann ich heute oder morgen herstellen?',
      'Wenn es trotzdem nicht klappt: Was ist mein kleinerer Plan B?',
    ],
    questionsEn: [
      'What would I like to try or do?',
      'Under which circumstances is that easier for me? (e.g. enough sleep, a quiet place, not alone)',
      'Which of them can I create today or tomorrow?',
      'If it still does not work out: what is my smaller plan B?',
    ],
    isBuiltin: true,
  },
  {
    // Vorbereitung auf eine anspruchsvolle Situation ("Cope ahead" aus den
    // DBT-Fertigkeiten), bewusst ohne Leistungsdruck.
    id: 'builtin-situation-vorbereiten',
    phase: 'vorausschauend',
    name: 'Schwierige Situation vorbereiten',
    nameEn: 'Preparing for a difficult situation',
    source: 'angelehnt an „Cope ahead" (DBT-Fertigkeiten)',
    questions: [
      'Welche Situation steht an — und wann?',
      'Was daran macht mir Sorge? Was könnte passieren?',
      'Welche Gefühle und Körperreaktionen erwarte ich?',
      'Was hilft mir davor, währenddessen und danach? (Skills, Hilfsmittel, Orte, Menschen)',
      'Woran merke ich früh, dass es mir zu viel wird — und was tue ich dann?',
      'Wie gönne ich mir danach Erholung?',
    ],
    questionsEn: [
      'Which situation is coming up — and when?',
      'What worries me about it? What could happen?',
      'Which feelings and body reactions do I expect?',
      'What helps me before, during and after? (skills, tools, places, people)',
      'How will I notice early that it is getting too much — and what do I do then?',
      'How will I give myself rest afterwards?',
    ],
    isBuiltin: true,
  },
  // ---------------------------------------------------------------
  // Rückblickend — aus Therapie-Formaten übernommen
  // ---------------------------------------------------------------
  {
    // Schema-Tagebuch: Situation → Gefühl/Körper → Gedanken → alter Anteil (Modus) →
    // Bedürfnis → gesunder Erwachsenen-Blick → Handlung. Die Modus-Begriffe stammen
    // aus der Schematherapie (Kind-, Eltern-, Bewältigungsmodi, Gesunder Erwachsener).
    id: 'builtin-schematagebuch',
    phase: 'rueckblickend',
    name: 'Schematagebuch',
    nameEn: 'Schema diary',
    source: 'Schematherapie (Modus-Modell)',
    intro: 'Zum Verstehen, nicht zum Bewerten. Wenn es gerade zu viel ist: erst ankommen (Füße spüren, Atem), später weiterschreiben.',
    introEn: 'For understanding, not judging. If it is too much right now: arrive first (feel your feet, breathe), write on later.',
    questions: [
      'Situation: Was ist passiert? (nur Fakten — wer, wo, wann)',
      'Gefühl und Körper: Was habe ich gefühlt, und wo spüre ich es im Körper? Wie stark, von 0 bis 100?',
      'Gedanken: Was ging mir durch den Kopf? (auch die harten, automatischen Sätze)',
      'Alter Anteil: Kommt mir das Gefühl von früher bekannt vor? Welcher Teil von mir war aktiv — das verletzliche Kind, eine strenge oder fordernde innere Stimme, oder ein Schutzmodus (Rückzug, Anpassen, Kämpfen, Abschalten)?',
      'Bedürfnis dahinter: Was hätte dieser Teil in dem Moment gebraucht? (z. B. Sicherheit, Trost, Anerkennung, eine Grenze)',
      'Gesunder Erwachsener: Wie würde ich mit einem Kind in genau dieser Lage sprechen? Was könnte die Situation außerdem bedeuten?',
      'Handlung: Was habe ich getan — und was möchte ich nächstes Mal beibehalten oder anders machen?',
    ],
    questionsEn: [
      'Situation: What happened? (facts only — who, where, when)',
      'Feeling and body: What did I feel, and where do I feel it in my body? How strong, from 0 to 100?',
      'Thoughts: What went through my mind? (including the harsh, automatic sentences)',
      'Old part: Does the feeling seem familiar from earlier? Which part of me was active — the vulnerable child, a strict or demanding inner voice, or a protective mode (withdrawing, adapting, fighting, switching off)?',
      'Need behind it: What would this part have needed in that moment? (e.g. safety, comfort, recognition, a boundary)',
      'Healthy adult: How would I talk to a child in exactly this situation? What else could the situation mean?',
      'Action: What did I do — and what would I like to keep or do differently next time?',
    ],
    isBuiltin: true,
  },
  {
    // Tageskarte nach dem Muster der DBT Diary Card (Linehan): Drang, Gefühle (0–5),
    // Substanzen, Handlungen, genutzte Skills (0–7). Die Skalen sind die der
    // klassischen Karte; Formulierungen sind hier in Fragen übersetzt.
    id: 'builtin-dbt-diary-card',
    phase: 'rueckblickend',
    name: 'DBT-Tageskarte (Diary Card)',
    nameEn: 'DBT diary card',
    source: 'DBT Diary Card nach Linehan (Skalen 0–5 und 0–7)',
    intro: 'Die Tageskarte aus der DBT, als Fragen. Ehrlich statt „gut": Es geht ums Erkennen, nicht ums Bewerten. Ist ein Drang stark (4–5), bleib bitte nicht allein — Sicherheit-Seite öffnen oder eine vertraute Person kontaktieren.',
    introEn: 'The DBT diary card, as questions. Honest rather than "good": it is for noticing, not judging. If an urge is strong (4–5), please do not stay alone — open the Safety page or contact someone you trust.',
    questions: [
      'Datum und ein Satz zum Tag:',
      'Stärkster Drang heute (0 = keiner … 5 = sehr stark) — z. B. mir wehzutun, zu verschwinden, zu fliehen, etwas zu konsumieren:',
      'Stärkste Gefühle heute (jeweils 0–5): seelischer Schmerz — körperliches Unwohlsein — Freude:',
      'Medikamente und Substanzen heute (was, wie viel — ohne Bewertung):',
      'Habe ich etwas getan, das ich nicht wollte oder das mir geschadet hat? (ja/nein, was):',
      'Skills heute: Welche habe ich genutzt, und wie war es? (0 = nicht daran gedacht · 1–2 = dran gedacht, nicht genutzt · 3 = versucht, ging nicht · 4 = versucht, hat nicht geholfen · 5 = versucht, hat geholfen · 6 = von selbst genutzt, hat nicht geholfen · 7 = von selbst genutzt, hat geholfen)',
      'Das möchte ich in der Therapie oder mit meiner Begleitung besprechen:',
    ],
    questionsEn: [
      'Date and one sentence about the day:',
      'Strongest urge today (0 = none … 5 = very strong) — e.g. to hurt myself, to disappear, to flee, to consume something:',
      'Strongest feelings today (each 0–5): emotional pain — physical discomfort — joy:',
      'Medication and substances today (what, how much — without judgment):',
      'Did I do something I did not want to do or that harmed me? (yes/no, what):',
      'Skills today: Which did I use, and how was it? (0 = did not think of it · 1–2 = thought of it, did not use · 3 = tried, could not do it · 4 = tried, did not help · 5 = tried, helped · 6 = used on my own, did not help · 7 = used on my own, helped)',
      'I would like to talk about this in therapy or with my support person:',
    ],
    isBuiltin: true,
  },
  {
    // Verhaltensanalyse / Kettenanalyse (DBT): Problemverhalten → Auslöser →
    // Verletzlichkeitsfaktoren → Verhaltenskette → Konsequenzen → Alternativen → Prävention.
    id: 'builtin-verhaltensanalyse',
    phase: 'rueckblickend',
    name: 'Verhaltensanalyse (Kettenanalyse)',
    nameEn: 'Behavior analysis (chain analysis)',
    source: 'DBT-Verhaltensanalyse / Kettenanalyse (Linehan)',
    intro: 'Zum Verstehen, nicht um dich zu verurteilen. Bearbeite sie erst, wenn du dich etwas beruhigt hast — gern zusammen mit deiner Therapeutin oder deinem Therapeuten.',
    introEn: 'To understand, not to judge yourself. Work on it only once you have calmed down a little — ideally together with your therapist.',
    questions: [
      'Welches Verhalten möchte ich genauer verstehen? (konkret: was genau, wann, wie lange)',
      'Auslöser: Was ist direkt davor passiert? (Ereignis, Ort, Person — oder ein innerer Auslöser wie ein Gedanke oder eine Erinnerung)',
      'Verletzlichkeit: Was hat mich an diesem Tag anfälliger gemacht? (z. B. wenig Schlaf, Hunger, Schmerz, Stress, Streit, Einsamkeit, Substanzen)',
      'Die Kette, Glied für Glied: Was kam nacheinander? Gedanken — Gefühle — Körperempfindungen — Impulse — Handlungen (ein Glied pro Zeile)',
      'Folgen: Was hat das Verhalten kurzfristig erleichtert? Was hat es langfristig gekostet — bei mir und bei anderen?',
      'Alternativen: An welchen Stellen der Kette hätte ich etwas anders machen können? Welche Skills, Hilfsmittel oder Menschen hätten dort gepasst?',
      'Wiedergutmachung: Gibt es etwas, das ich bei mir oder bei anderen reparieren möchte? (nur wenn es sich stimmig anfühlt)',
      'Vorbeugen: Wie kann ich die Verletzlichkeit verringern und früh gegensteuern? Meine Frühwarnzeichen und mein Wenn-dann-Plan:',
    ],
    questionsEn: [
      'Which behavior do I want to understand better? (concretely: what exactly, when, for how long)',
      'Trigger: What happened right before? (event, place, person — or an inner trigger such as a thought or a memory)',
      'Vulnerability: What made me more susceptible that day? (e.g. little sleep, hunger, pain, stress, a fight, loneliness, substances)',
      'The chain, link by link: What came one after another? Thoughts — feelings — body sensations — urges — actions (one link per line)',
      'Consequences: What did the behavior relieve in the short term? What did it cost in the long term — for me and for others?',
      'Alternatives: At which points of the chain could I have done something differently? Which skills, tools or people would have fit there?',
      'Repair: Is there something I want to repair, for myself or for others? (only if it feels right)',
      'Preventing: How can I reduce the vulnerability and counter early? My early warning signs and my if-then plan:',
    ],
    isBuiltin: true,
  },
];

export const customDiaryTemplatesRepo = createRepository<DiaryTemplate>('diary-templates');

export function allDiaryTemplates(): DiaryTemplate[] {
  return [...BUILTIN_DIARY_TEMPLATES, ...customDiaryTemplatesRepo.getAll()];
}

export function addCustomDiaryTemplate(name: string, questions: string[], phase?: DiaryTemplatePhase): DiaryTemplate {
  const template: DiaryTemplate = { id: createId('diary-template'), name, questions: questions.filter((q) => q.trim()), phase };
  customDiaryTemplatesRepo.save(template);
  return template;
}

export function updateCustomDiaryTemplate(id: string, name: string, questions: string[], phase?: DiaryTemplatePhase): void {
  customDiaryTemplatesRepo.save({ id, name, questions: questions.filter((q) => q.trim()), phase });
}

export function removeCustomDiaryTemplate(id: string): void {
  customDiaryTemplatesRepo.remove(id);
}

/** Turns a template's questions into the starting text for a new entry
 * — each question on its own line with a blank line underneath to
 * answer into, rather than inventing a separate structured-fields data
 * model. Diary entries stay simple plain text throughout the app. */
export function applyTemplate(template: DiaryTemplate, isEn: boolean): string {
  const questions = isEn && template.questionsEn ? template.questionsEn : template.questions;
  const intro = isEn && template.introEn ? template.introEn : template.intro;
  return (intro ? `${intro}\n\n` : '') + questions.map((q) => `${q}\n\n`).join('');
}
