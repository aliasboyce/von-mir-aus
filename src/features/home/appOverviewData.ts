/**
 * Complete overview of everything the app can do — grouped by "Was brauchst du gerade?".
 * One source for the overview behind "Nicht sicher, was gerade passt?" on the Startseite.
 * Every page / function of the app appears at least once; some are listed under two needs
 * on purpose (a need decides where you look, not where the thing lives).
 */
export interface OverviewEntry {
  id: string;
  emoji: string;
  de: { title: string; text: string };
  en: { title: string; text: string };
  /** route to open */
  to?: string;
  /** special action instead of a route */
  action?: 'grounding';
}
export interface OverviewGroup {
  id: string;
  emoji: string;
  color: string;
  de: { title: string; hint: string };
  en: { title: string; hint: string };
  entries: OverviewEntry[];
}

const E = (id: string, emoji: string, de: [string, string], en: [string, string], to?: string, action?: 'grounding'): OverviewEntry => ({
  id,
  emoji,
  de: { title: de[0], text: de[1] },
  en: { title: en[0], text: en[1] },
  to,
  action,
});

export const OVERVIEW_GROUPS: OverviewGroup[] = [
  {
    id: 'acute',
    emoji: '🫂',
    color: '#c9522f',
    de: { title: 'Ich brauche gerade Halt', hint: 'Für starke, akute Momente' },
    en: { title: 'I need support right now', hint: 'For strong, acute moments' },
    entries: [
      E('krise', '🛟', ['Krisenmodus', 'Schneller Zugriff in akuten Momenten: wenige, große Schritte, nichts Überflüssiges. Du kannst jederzeit zurück.'], ['Crisis mode', 'Quick access in acute moments: a few big steps, nothing superfluous. You can go back any time.'], '/krisenmodus'),
      E('orient', '🧭', ['Orientierung', 'Eine sanfte Übung, um zu sehen, wo du gerade bist: Sinne, Atem, Raum. Kein Zählzwang, nichts wird gespeichert – außer dass du sie durchgemacht hast (im Tagesrückblick).'], ['Orientation', 'A gentle exercise to see where you are right now: senses, breath, space. No counting pressure, nothing is saved — except that you did it (in the daily review).'], undefined, 'grounding'),
      E('plan', '📋', ['Sicherheitsplan', 'Dein persönlicher Plan für schwere Momente: Warnzeichen, was hilft, wen du erreichst. Auch als farbiges PDF zum Mitnehmen.'], ['Safety plan', 'Your personal plan for hard moments: warning signs, what helps, who you can reach. Also as a coloured PDF to take along.'], '/sicherheit/plan'),
      E('kontakte', '📞', ['Kontakte', 'Menschen und Stellen, die du erreichen kannst – mit Telefonnummern zum direkten Anrufen. Wichtige Kontakte erscheinen auch auf der Startseite.'], ['Contacts', 'People and services you can reach — with phone numbers to call directly. Important contacts also appear on the home page.'], '/sicherheit/kontakte'),
      E('netz', '🤝', ['Netzwerk', 'Wer trägt dich – Menschen, Orte, Tiere, Gruppen – und was du mit ihnen verbindest. Nach Kategorien sortiert.'], ['Network', 'Who supports you — people, places, animals, groups — and what you connect with them. Sorted by category.'], '/sicherheit/netzwerk'),
      E('hub', '🧱', ['Sicherheit im Überblick', 'Alles zum Thema Sichern an einem Ort: Plan, Kontakte, Netzwerk, Tagebuch.'], ['Safety overview', 'Everything about safety in one place: plan, contacts, network, diary.'], '/sicherheit'),
    ],
  },
  {
    id: 'understand',
    emoji: '🧠',
    color: '#6fbf73',
    de: { title: 'Ich will verstehen, was los ist', hint: 'Zustand erkennen, einordnen, nachschlagen' },
    en: { title: 'I want to understand what is going on', hint: 'Notice, classify, look up' },
    entries: [
      E('checkin', '📈', ['Check-in & Tageskurve', 'Kurz mehrmals am Tag: wie angespannt, in welchem Bereich. Kein Tracking-Zwang – daraus wird nur, wenn du magst, deine Kurve.'], ['Check-in & daily curve', 'Short, several times a day: how tense, in which zone. No tracking pressure — it only becomes your curve if you like.'], '/entdecken/tageskurve'),
      E('wetter', '⛅', ['Inneres Wetter', 'Dein Zustand als Wetterbild – ein weicher Einstieg, wenn Worte schwerfallen.'], ['Inner weather', 'Your state as a weather picture — a soft way in when words are hard.'], '/inneres-wetter'),
      E('zugang', '🔑', ['Zugang', 'Schritt für Schritt herausfinden, was los ist: Zustand, Bedürfnis, Hindernis und was jetzt passen könnte.'], ['Access (Zugang)', 'Find out step by step what is going on: state, need, obstacle and what could fit now.'], '/zugang'),
      E('kanaele', '🕸️', ['Zugangskanäle', 'Über welche Kanäle (Körper, Gedanken, Gefühl, Handlung …) du gerade am besten an dich herankommst.'], ['Access channels', 'Through which channels (body, thoughts, feeling, action …) you reach yourself best right now.'], '/entdecken/zugangskanaele'),
      E('nerv', '🌊', ['Nervensystem', 'Grundlagen und Zustände zum Nachschlagen – warum dein System tut, was es tut.'], ['Nervous system', 'Basics and states to look up — why your system does what it does.'], '/entdecken/nervensystem'),
      E('koerper', '🫀', ['Körperwahrnehmung', 'Körperwahrnehmung als eigener Zugang: was du spüren kannst und was es bedeuten kann.'], ['Body awareness', 'Body awareness as its own way in: what you can feel and what it can mean.'], '/entdecken/koerper'),
      E('gefuehle', '❤️', ['Gefühle', 'Gefühlsrad und Hintergrund: Worte für das, was in dir ist.'], ['Feelings', 'Feelings wheel and background: words for what is inside you.'], '/entdecken/gefuehle'),
      E('schutz', '🛡️', ['Schutzstrategien', 'Wie dich dein System schützen will – ohne Wertung, mit Alternativen, die du ausprobieren kannst.'], ['Protection strategies', 'How your system tries to protect you — without judgement, with alternatives you can try.'], '/entdecken/schutzstrategien'),
      E('denk', '💭', ['Denkmaschine', 'Automatische Gedanken erkennen, prüfen und neu formulieren.'], ['Thought machine', 'Notice, check and reformulate automatic thoughts.'], '/entdecken/denkmaschine'),
      E('bedarf', '💛', ['Bedürfnis-Kompass', 'Was brauche ich eigentlich gerade? Bedürfnisse benennen und zuordnen.'], ['Needs compass', 'What do I actually need right now? Name and sort your needs.'], '/entdecken/beduerfnis-kompass'),
    ],
  },
  {
    id: 'regulate',
    emoji: '🌿',
    color: '#8fae3d',
    de: { title: 'Ich will etwas für mich tun', hint: 'Regulieren, beruhigen, aktivieren, genießen' },
    en: { title: 'I want to do something for myself', hint: 'Regulate, calm, activate, enjoy' },
    entries: [
      E('res', '🎁', ['Alle Ressourcen', 'Alles, was dir zur Verfügung steht: Skills, Aktivitäten, Orte, Hilfsmittel – mit Bildern und Farben nach Kategorie. Du kannst eigene anlegen.'], ['All resources', 'Everything available to you: skills, activities, places, tools — with pictures and colours per category. You can add your own.'], '/entdecken/ressourcen'),
      E('skills', '🧰', ['Skills', 'Kleine Übungen für verschiedene Zustände – von beruhigen bis aktivieren.'], ['Skills', 'Small exercises for different states — from calming to activating.'], '/entdecken/ressourcen/skills'),
      E('ketten', '⛓️', ['Skillketten', 'Mehrere Skills hintereinander als Ablauf, den du Schritt für Schritt gehen kannst.'], ['Skill chains', 'Several skills in a row as a sequence you can go through step by step.'], '/entdecken/ressourcen/skillketten'),
      E('hilfsmittel', '🪴', ['Hilfsmittel', 'Dinge, Orte und Gewohnheiten, die dir helfen können.'], ['Tools', 'Things, places and habits that can help you.'], '/entdecken/ressourcen/hilfsmittel'),
      E('loslassen', '🍃', ['Loslassen', 'Einen Gedanken bildlich loslassen.'], ['Letting go', 'Let a thought go, as a picture.'], '/entdecken/loslassen'),
      E('timer', '⏱️', ['Timer', 'Freier Timer, unabhängig von einer Brücke – für alles, was eine Zeitspanne braucht.'], ['Timer', 'Free timer, independent of a bridge — for anything that needs a span of time.'], '/entdecken/timer'),
      E('wesen', '✨', ['Das Wesen', 'Dein Begleiter: ist da, tanzt, sammelt Funken im Lauf, stört liebevoll und schmuggelt kleine Dinge in den Tag. Hier siehst du, was es alles kann.'], ['The companion', 'Your companion: is there, dances, collects sparks in the run, interrupts lovingly and smuggles small things into the day. See here everything it can do.'], '/einstellungen/wesen-info'),
    ],
  },
  {
    id: 'act',
    emoji: '👣',
    color: '#4a9d8f',
    de: { title: 'Ich will ins Handeln kommen', hint: 'Zurück ins Leben, in kleinen Schritten' },
    en: { title: 'I want to get moving', hint: 'Back into life, in small steps' },
    entries: [
      E('bruecken', '🌉', ['Brücken', 'Kleine Schritte zu etwas, das dir wichtig ist – mit Hindernissen, Ressourcen und eigenem Tempo.'], ['Bridges', 'Small steps toward something that matters to you — with obstacles, resources and your own pace.'], '/bruecken'),
      E('werte', '🧭', ['Wertekompass', 'Was dir wichtig ist – damit Brücken in eine Richtung führen, die zu dir passt.'], ['Values compass', 'What matters to you — so bridges lead in a direction that fits you.'], '/entdecken/wertekompass'),
      E('garten', '🌱', ['Routinen & mein Garten', 'Routinen aus kleinen Karten und Gesammeltes im Garten – wachsen sehen, ohne Druck.'], ['Routines & my garden', 'Routines made of small cards and collected actions in the garden — watch things grow, without pressure.'], '/entdecken/garten'),
      E('mindmap', '🕸️', ['Mindmaps', 'Eigene Karten aus Knoten, Notizen und Rahmen – frei gestalten, verbinden, drucken und teilen.'], ['Mind maps', 'Your own maps of nodes, notes and frames — design freely, connect, print and share.'], '/entdecken/mindmap'),
      E('projekte', '🗂️', ['Meine Projekte', 'Eigene Vorhaben allein oder mit anderen planen: Ziele, Zeitplan, Aufgaben, Rollen, Finanzen, Entscheidungen – verbunden mit Kalender und Mindmaps, als PDF mit allen Bildern teilbar. Jedes Projekt ist wie eine kleine Webseite mit eigenen Seiten („Alles zeigen“ klappt alles auf), dazu Protokoll, Schnellnotiz und Zettel-Box.'], ['My projects', 'Plan your own undertakings alone or with others: a start page like a small website with its own pages (“Show all” unfolds everything), goals, timeline, tasks, roles, budget, decisions, log, quick notes and a slip box — connected to calendar and mind maps, shareable as PDF with all images.'], '/entdecken/projekte'),
      E('budget', '💶', ['Budget-Planer', 'Alles Geld an einem ruhigen Ort: Einnahmen und feste Kosten zum Abhaken, Rechnungen mit Foto und Ablageort, Ausgaben und Töpfe, Konten, Sparschwein, Verträge & Abos – mit Kalender-Erinnerung und Finanz-Rückblicken als PDF. Die App rechnet aus, was übrig ist.'], ['Budget planner', 'All your money in one calm place: income and fixed costs to tick off, bills with photo and where they are kept, spending and pots, accounts, piggy bank, contracts & subscriptions — with calendar reminders and finance reviews as PDF. The app works out what is left.'], '/budget'),
      E('listen', '📝', ['Meine Listen', 'Einkauf, Packliste, Ideen: einfach aufschreiben und abhaken (grau und durchgestrichen, bleibt aber stehen). Mit Unterpunkten, Notizen, Farbe, Symbol und Foto, oben anheften und archivieren. Ein Punkt lässt sich zusätzlich auf eine andere Liste legen.'], ['My lists', 'Shopping, packing, ideas: just write it down and tick it off (grey and struck through but it stays). With sub-items, notes, colour, symbol and photo, pin to the top and archive. An item can also be put on another list.'], '/listen'),
      E('kalender', '📅', ['Kalender', 'Die nächsten Tage: Termine, Erinnerungen und die „Ich muss gar nichts, aber ich will“-Liste (mit „will ich / soll ich“ zum Hinspüren).'], ['Calendar', 'The next days: appointments, reminders and the “I don’t have to, but I want to” list (with “I want to / I should” for noticing).'], '/kalender'),
      E('kalenderuebersicht', '🗓️', ['Kalender-Übersicht', 'Alle Termine auf einen Blick.'], ['Calendar overview', 'All appointments at a glance.'], '/kalender/uebersicht'),
    ],
  },
  {
    id: 'write',
    emoji: '📔',
    color: '#9a7bc4',
    de: { title: 'Ich will aufschreiben oder merken', hint: 'Schreiben, sammeln, festhalten' },
    en: { title: 'I want to write or keep something', hint: 'Write, collect, hold on to' },
    entries: [
      E('tagebuch', '📔', ['Tagebuch & Tagesrückblick', 'Freies Schreiben, jederzeit – und der Tagesrückblick: was heute war, was geholfen hat.'], ['Diary & daily review', 'Free writing any time — and the daily review: what today was, what helped.'], '/sicherheit/tagebuch'),
      E('brief', '💌', ['Brief an mich', 'Ein Brief von dir an dich, für später – oder per Link/Datei an eine andere Person, die ihn zu der Uhrzeit bekommt, die du einstellst.'], ['Letter to myself', 'A letter from you to you, for later — or by link/file to someone else, who gets it at the time you set.'], '/entdecken/brief-an-mich'),
      E('lesezeichen', '🔖', ['Lesezeichen', 'Gespeicherte Links und Inhalte.'], ['Bookmarks', 'Saved links and content.'], '/entdecken/lesezeichen'),
      E('favoriten', '⭐', ['Favoriten', 'Schnellzugriff auf gemerkte Ressourcen und Brücken.'], ['Favourites', 'Quick access to saved resources and bridges.'], '/favoriten'),
      E('parkbox', '📮', ['Verbindliche Parkbox & Wartezimmer', 'Zettel schreiben, die in eine sichere Box fliegen – für heute bist du entlastet. Darunter das Wartezimmer: Ideen, Projekte und Wünsche mit festem Platz, denen du später einen Zeitraum im Kalender geben kannst. Zettel lassen sich auch „für morgen“ ins Postfach schicken und einem Projekt zuordnen.'], ['Binding parking box & waiting room', 'Write note slips that fly into a safe box — you are relieved for today. Below it the waiting room: ideas, projects and wishes with a fixed seat, which you can later give a period in the calendar. Slips can also be sent “for tomorrow” into the Postfach and assigned to a project.'], '/parkbox'),
      E('medi', '💊', ['Medi-Log', 'Medikamente/Einnahmen festhalten, samt Packungen.'], ['Medication log', 'Note medication/intake, including packages.'], '/entdecken/medi-log'),
    ],
  },
  {
    id: 'look',
    emoji: '🌙',
    color: '#e8a83d',
    de: { title: 'Ich will zurückschauen', hint: 'Was hat sich gezeigt, was hat geholfen?' },
    en: { title: 'I want to look back', hint: 'What showed up, what helped?' },
    entries: [
      E('tag', '🌙', ['Tagesrückblick', 'Was heute war: Check-ins, Dinge, die du getan hast (auch Orientierung), Erfolge. Auch als PDF.'], ['Daily review', 'What today held: check-ins, things you did (including orientation), achievements. Also as PDF.'], '/sicherheit/tagebuch'),
      E('woche', '🗓️', ['Wochen-/Monatsrückblick', 'Muster über mehrere Tage hinweg – auch als PDF zum Mitnehmen in die Therapie.'], ['Weekly / monthly review', 'Patterns over several days — also as PDF to take to therapy.'], '/wochenrueckblick'),
      E('entw', '📉', ['Meine Entwicklung', 'Deine Spannungskurve über die Zeit.'], ['My development', 'Your tension curve over time.'], '/entdecken/tageskurve/entwicklung'),
      E('zugangrueck', '🔁', ['Zugang-Rückblick', 'Was sich in deinen Zugang-Einträgen wiederholt.'], ['Access review', 'What repeats in your access entries.'], '/zugang/rueckblick'),
    ],
  },
  {
    id: 'others',
    emoji: '🫶',
    color: '#d17a9a',
    de: { title: 'Ich will teilen oder für andere da sein', hint: 'Ohne Server, ohne Konto' },
    en: { title: 'I want to share or be there for others', hint: 'No server, no account' },
    entries: [
      E('helfer', '🫶', ['Helfermodus', 'Wenn du jemand anderem beistehst: Orientierung für die Situation, ohne dich selbst zu übergehen.'], ['Helper mode', 'When you support someone else: guidance for the situation without overlooking yourself.'], '/helfermodus'),
      E('teilen', '🔗', ['Teilen & Importieren', 'Ressourcen, Brücken, Kontakte, Lesezeichen und Briefe lassen sich als Link oder Datei weitergeben. Die andere Person importiert sie in ihre App – nichts läuft über einen Server. Importieren kannst du bei Brücken, Ressourcen, Lesezeichen, Kontakten und Briefen.'], ['Share & import', 'Resources, bridges, contacts, bookmarks and letters can be passed on as link or file. The other person imports them into their app — nothing goes through a server. You can import bridges, resources, bookmarks, contacts and letters.'], '/brief/importieren'),
    ],
  },
  {
    id: 'app',
    emoji: '⚙️',
    color: '#9a948a',
    de: { title: 'Die App selbst', hint: 'Einstellen, sichern, nachlesen' },
    en: { title: 'The app itself', hint: 'Set up, back up, read up' },
    entries: [
      E('suche', '🔍', ['Lupe – Suche in der ganzen App', 'Findet Funktionen der App und alles, was du selbst geschrieben hast – auch mit Wortteilen und kleinen Tippfehlern. Das Lupen-Symbol steht oben auf den Seiten, am Computer geht Strg + K.'], ['Magnifier – search the whole app', 'Finds app functions and everything you wrote yourself — also with word parts and small typos. The magnifier icon is at the top of the pages; on a computer press Ctrl + K.'], '/suche'),
      E('entdecken', '🔎', ['Entdecken – die Karte', 'Alle Seiten der App als weiche Karte, in fünf Hauptbereichen plus Zusätzen.'], ['Explore — the map', 'All pages of the app as a soft map, in five main areas plus add-ons.'], '/entdecken'),
      E('einst', '⚙️', ['Einstellungen', 'Sprache, Darstellung, Wesen, Erinnerungen, Datenschutz, Sicherung deiner Daten, Daten löschen.'], ['Settings', 'Language, appearance, companion, reminders, privacy, backup of your data, deleting data.'], '/einstellungen'),
      E('wesencontent', '🎛️', ['Wesen/Begleiter-Inhalte verwalten', 'Die Texte deines Wesens (Mitteilungen, Orientierung, Ablenkung) – einzelne an- und ausschalten oder eigene ergänzen.'], ['Manage companion content', 'The texts of your companion (messages, orientation, distraction) — switch single ones on/off or add your own.'], '/einstellungen/wesen-inhalte'),
      E('postfach', '📬', ['Postfach & Erinnerungen', 'Auf der Startseite: Erinnerungen, Rückblicke (Tag um 20 Uhr, Woche sonntags, Monat am Monatsende) und eingehende Briefe erscheinen hier – nur in der App, nicht als Handy-Meldung.'], ['Mailbox & reminders', 'On the home page: reminders, reviews (day at 8 pm, week on Sundays, month at month end) and incoming letters appear here — only inside the app, not as phone notifications.'], '/'),
      E('nurjetzt', '🕯️', ['Nur jetzt', 'Ein Modus, in dem die App auf das Hier und Jetzt schrumpft: nur Check-in, Zugang und Orientierung. Alles andere bleibt unverändert im Hintergrund. Du startest ihn auf der Startseite.'], ['Only now', 'A mode in which the app shrinks to the here and now: only check-in, access and orientation. Everything else stays untouched in the background. You start it on the home page.'], '/'),
      E('datenschutz', '🔒', ['Datenschutz', 'Klar erklärt, wie die App mit deinen Daten umgeht: alles bleibt auf deinem Gerät, was online passiert und was beim Teilen zu beachten ist.'], ['Privacy', 'Clearly explained how the app handles your data: everything stays on your device, what happens online and what to keep in mind when sharing.'], '/einstellungen/datenschutz'),
      E('quellen', '📚', ['Quellen', 'Woher die fachlichen Inhalte stammen.'], ['Sources', 'Where the professional content comes from.'], '/quellen'),
    ],
  },
];
