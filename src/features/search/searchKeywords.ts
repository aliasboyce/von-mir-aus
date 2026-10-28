/**
 * Zusatz-Wörter für die Lupe: Wörter, unter denen man etwas SUCHT, die aber nicht im Titel stehen
 * („Sicherung“ für das Backup, „Zettel“ für die Parkbox, „Karte“ für die Mindmap …).
 * Schlüssel = id des Eintrags in appOverviewData.ts. Deutsch und Englisch stehen zusammen,
 * die Suche ist ohnehin tolerant.
 */
export const OVERVIEW_KEYWORDS: Record<string, string> = {
  krise: 'notfall akut panik hilfe sos crisis emergency help panic',
  orient: 'erden grounding boden sinne fünf dinge 5-4-3-2-1 dissoziation',
  plan: 'sicherheitsplan krisenplan warnzeichen notfallplan safety plan pdf drucken',
  kontakte: 'telefon anrufen nummer kontakte phone call number',
  netz: 'netzwerk menschen tiere orte gruppen unterstützung network people animals',
  checkin: 'tageskurve polyvagal zustand spannung zone ampel kurve',
  wetter: 'inneres wetter stimmung gefühl bild weather mood',
  zugang: 'zugang finden bedürfnis hindernis access',
  gefuehle: 'gefühle emotionen feelings emotions',
  denk: 'glaubenssätze gedanken denkmaschine beliefs thoughts',
  skills: 'skills fertigkeiten dbt übungen strategien',
  ketten: 'skillketten abfolge reihenfolge ketten chains',
  hilfsmittel: 'hilfsmittel werkzeuge tools sinne musik videos',
  loslassen: 'sorgen sorgenfresser loslassen worries',
  timer: 'timer stoppuhr uhr zeit wecker',
  bruecken: 'brücken schritte tun aktivierung bridges',
  werte: 'werte wertekompass values',
  garten: 'garten routinen gewohnheiten pflanzen blumen routines garden',
  mindmap: 'mindmap karte gedankenkarte zeichnen knoten ebenen to-do tabelle pro contra aquarell notiz frühere zustände festhalten mind map',
  listen: 'liste listen einkaufsliste einkauf packliste checkliste to-do todo abhaken haken aufzählung ideen merken notizen liste lists shopping packing checklist tick',
  budget: 'budget geld finanzen einnahmen ausgaben rechnung rechnungen miete fixkosten kosten sparschwein sparen rücklage konto kontostand bargeld abo abos vertrag verträge streaming netflix kündigung kündigungsfrist gehalt arbeitslosengeld kindergeld bürgergeld haushaltsbuch money bills savings piggy bank subscription contract',
  projekte: 'projekte projekt mini webseite unterseiten protokoll pdf kalender schritte zettel box wartezimmer morgen postfach alles zeigen projects',
  kalender: 'kalender termine termin planen wünsche calendar appointments',
  kalenderuebersicht: 'terminübersicht alle termine liste',
  tagebuch: 'tagebuch schreiben notizen diary journal buch gesperrt wort',
  brief: 'brief an mich zukunft letter',
  lesezeichen: 'lesezeichen merken links bookmarks',
  favoriten: 'favoriten herz gemerkt favorites',
  parkbox: 'parkbox zettel box wartezimmer später morgen notiz park wait',
  medi: 'medikamente medi log einnahme tabletten medication',
  tag: 'tagesrückblick rückblick tag review',
  woche: 'wochenrückblick woche rückblick weekly',
  entw: 'entwicklung verlauf meine entwicklung progress',
  helfer: 'helfermodus helfen begleiten helper',
  teilen: 'teilen importieren link datei import share',
  einst: 'einstellungen sprache design farben schrift erinnerungen backup sicherung export import pdf sperre pin datenschutz zurücksetzen löschen settings',
  datenschutz: 'datenschutz daten privatsphäre privacy',
  quellen: 'quellen literatur nachweise sources',
  suche: 'suche suchen finden lupe search find magnifier strg k',
  postfach: 'postfach nachrichten erinnerungen mail zettel für morgen',
};

export interface StaticFunc {
  id: string;
  emoji: string;
  de: [string, string];
  en: [string, string];
  to: string;
  kw: string;
}

/** Dinge, die nicht als eigene Seite im Überblick stehen, nach denen man aber suchen wird */
export const STATIC_FUNCS: StaticFunc[] = [
  {
    id: 'f-backup',
    emoji: '💾',
    de: ['Sicherung (Backup) erstellen & einspielen', 'Alle deine Daten als eine Datei sichern und später wieder einspielen – zum Beispiel auf einem neuen Gerät.'],
    en: ['Backup: save & restore', 'Save all your data as one file and restore it later — for example on a new device.'],
    to: '/einstellungen',
    kw: 'backup sicherung datensicherung export import wiederherstellen datei speichern umziehen neues handy',
  },
  {
    id: 'f-lang',
    emoji: '🌍',
    de: ['Sprache wechseln (Deutsch / English)', 'Die ganze App auf Deutsch oder Englisch stellen.'],
    en: ['Change language (Deutsch / English)', 'Switch the whole app between German and English.'],
    to: '/einstellungen',
    kw: 'sprache language englisch deutsch english german',
  },
  {
    id: 'f-theme',
    emoji: '🎨',
    de: ['Farben, Hell/Dunkel & Schrift', 'Aussehen der App anpassen: Farbwelt, hell oder dunkel, Schriftgröße.'],
    en: ['Colours, light/dark & text size', 'Adjust how the app looks: colour world, light or dark, text size.'],
    to: '/einstellungen',
    kw: 'farben design dunkel hell dark light schrift schriftgröße größer kleiner theme palette modus aussehen',
  },
  {
    id: 'f-lock',
    emoji: '🔒',
    de: ['App-Sperre (PIN)', 'Die App mit einer PIN vor fremden Blicken schützen.'],
    en: ['App lock (PIN)', 'Protect the app from prying eyes with a PIN.'],
    to: '/einstellungen',
    kw: 'sperre pin code passwort schützen sicher lock privatsphäre',
  },
  {
    id: 'f-remind',
    emoji: '🔔',
    de: ['Erinnerungen', 'Sanfte Erinnerungen an Check-in, Termine oder eigene Dinge einstellen.'],
    en: ['Reminders', 'Set gentle reminders for check-ins, appointments or your own things.'],
    to: '/einstellungen',
    kw: 'erinnerung erinnern benachrichtigung push wecker reminder notification',
  },
  {
    id: 'f-reset',
    emoji: '🧹',
    de: ['Von vorne beginnen / alles löschen', 'Alle Daten auf diesem Gerät löschen und neu starten.'],
    en: ['Start over / delete everything', 'Delete all data on this device and start fresh.'],
    to: '/einstellungen',
    kw: 'zurücksetzen löschen reset neu anfangen alles weg daten löschen',
  },
  {
    id: 'f-pdf',
    emoji: '📄',
    de: ['PDF erstellen', 'Sicherheitsplan, Projekte, Mindmaps, Rückblicke und mehr gibt es als PDF – mit Emojis und Bildern.'],
    en: ['Create a PDF', 'Safety plan, projects, mind maps, reviews and more are available as PDF — with emojis and images.'],
    to: '/entdecken',
    kw: 'pdf drucken export ausdrucken speichern teilen seite',
  },
  {
    id: 'f-slips',
    emoji: '🗒️',
    de: ['Zettel für morgen / ins Postfach', 'Einen Zettel für später schreiben – er erscheint zum gewählten Zeitpunkt im Postfach.'],
    en: ['Slip for tomorrow / into the Postfach', 'Write a slip for later — it appears in the Postfach at the time you choose.'],
    to: '/parkbox',
    kw: 'zettel morgen postfach später erinnern notiz schnell notiz parkbox wartezimmer',
  },
  {
    id: 'f-search',
    emoji: '🔎',
    de: ['Lupe: in der ganzen App suchen', 'Findet Funktionen und alles, was du selbst geschrieben hast – auch mit Wortteilen und kleinen Tippfehlern.'],
    en: ['Magnifier: search the whole app', 'Finds functions and everything you wrote yourself — also with word parts and small typos.'],
    to: '/suche',
    kw: 'suche suchen finden lupe search find strg k',
  },
];
