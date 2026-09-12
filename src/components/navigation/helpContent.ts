export type HelpKey =
  | 'home' | 'checkin' | 'entdecken' | 'ressourcen' | 'zugangsrad' | 'zugang' | 'zugangRueckblick'
  | 'beduerfnisKompass' | 'tageskurve' | 'meineEntwicklung' | 'lesezeichen' | 'wochenrueckblick'
  | 'timer' | 'garten' | 'mediLog' | 'bruecken' | 'bridgeDetail' | 'sicherheit' | 'sicherheitsnetz'
  | 'kontakte' | 'sicherheitsplan' | 'tagebuch' | 'einstellungen' | 'wesenInhalte' | 'favoriten'
  | 'wesenAblenkung' | 'wesenOrientierung' | 'wesenMitteilungen'
  | 'nervensystem' | 'koerperwahrnehmung' | 'schutzstrategien' | 'glaubenssaetze' | 'gefuehle' | 'wertekompass' | 'letGo' | 'briefAnMich';

interface HelpEntry {
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
}

export const HELP_CONTENT: Record<HelpKey, HelpEntry> = {
  home: {
    title: 'Startseite',
    titleEn: 'Home',
    body: 'Hier landest du beim Öffnen der App. Der Check-In lädt dich ein, kurz anzukommen — er ist freiwillig, nicht verpflichtend. Darunter findest du schnelle Wege zu dem, was dir gerade helfen könnte.',
    bodyEn: 'This is where you land when opening the app. The Check-In invites you to briefly arrive — it\'s optional, not required. Below it, you\'ll find quick paths to whatever might help right now.',
  },
  checkin: {
    title: 'Check-In',
    titleEn: 'Check-In',
    body: 'Ein kurzer, geführter Moment: inneres Wetter, dann „Wo bist du gerade?", dann Spannung, dann Bedürfnisse. Es gibt kein richtig oder falsch — du kannst jederzeit überspringen. Nichts davon musst du ausfüllen, um die App zu nutzen.',
    bodyEn: 'A brief guided moment: inner weather, then "Where are you right now?", then tension, then needs. There\'s no right or wrong — you can skip at any point. None of this is required to use the app.',
  },
  entdecken: {
    title: 'Entdecken',
    titleEn: 'Explore',
    body: 'Eine Übersicht über die verschiedenen Werkzeuge der App — Ressourcen, Tageskurve, Garten, Medi-Log und mehr. Du musst nichts davon nutzen; wähle das, was gerade zu dir passt.',
    bodyEn: "An overview of the app's different tools — resources, daily curve, garden, medi-log and more. You don't have to use all of them; pick whatever fits right now.",
  },
  ressourcen: {
    title: 'Ressourcen',
    titleEn: 'Resources',
    body: 'Ressourcen sind Dinge, auf die du zurückgreifen kannst — ein Gegenstand, eine Person, ein Ort, eine Erinnerung, eine Fähigkeit. Sammle hier, was dir in schwierigen Momenten Halt geben kann, damit es griffbereit ist, wenn du es brauchst.',
    bodyEn: "Resources are things you can draw on — an object, a person, a place, a memory, a skill. Collect here what can give you steadiness in difficult moments, so it's within reach when you need it.",
  },
  zugangsrad: {
    title: 'Zugangsrad',
    titleEn: 'Access Wheel',
    body: 'Ein Rad mit verschiedenen Lebensbereichen. Schätze für jeden ein, wie gut du gerade Zugang dazu hast — nicht als Bewertung, sondern als ehrlicher Schnappschuss. Bei Bereichen mit wenig Zugang kannst du direkt zu Ressourcen, Brücken oder Kontakten springen.',
    bodyEn: "A wheel of different life areas. For each one, gauge how much access you currently have to it — not as a judgment, just an honest snapshot. For areas with little access, you can jump straight to resources, bridges, or contacts.",
  },
  zugang: {
    title: 'Zugang',
    titleEn: 'Access',
    body: 'Ein geführter, tieferer Weg für Momente, in denen der Zugang zu dir selbst gerade schwierig ist: Körper, Zustand, Gefühl, Bedürfnis, Hindernis, Brücke, Handlung — Schritt für Schritt, mit dem Wesen an deiner Seite. „Ich weiß nicht" ist an jeder Stelle eine vollwertige Antwort.',
    bodyEn: '"Access" is a deeper, guided path for moments when access to yourself feels difficult right now: body, state, feeling, need, obstacle, bridge, action — one step at a time, with the companion alongside you. "I don\'t know" is a valid answer at every single step.',
  },
  zugangRueckblick: {
    title: 'Zugang — Rückblick',
    titleEn: 'Access — Review',
    body: 'Deine bisherigen Zugang-Durchgänge, wie eine persönliche Sammlung: was passiert bei dir, was hilft dir, welche Brücken funktionieren. Kein technisches Protokoll, sondern etwas, das mit der Zeit wächst.',
    bodyEn: "Your past Access passes, like a personal collection: what happens for you, what helps, which bridges work. Not a technical log — something that grows with you over time.",
  },
  beduerfnisKompass: {
    title: 'Bedürfnis-Kompass',
    titleEn: 'Needs Compass',
    body: 'Eine Übersicht über grundlegende menschliche Bedürfnisse. Manchmal hilft es schon, ein Bedürfnis beim Namen zu kennen, um zu verstehen, was gerade fehlt oder gebraucht wird.',
    bodyEn: 'An overview of basic human needs. Sometimes just knowing a need by name already helps in understanding what\'s missing or needed right now.',
  },
  tageskurve: {
    title: 'Tageskurve',
    titleEn: 'Daily Curve',
    body: 'Halte fest, wie sich dein Nervensystem über den Tag anfühlt — verbunden, aktiviert oder reduziert. Kein Muss, sondern ein optionales Werkzeug, um eigene Muster über die Zeit besser zu erkennen.',
    bodyEn: "Track how your nervous system feels over the course of the day — connected, activated, or reduced. Not a requirement, just an optional tool for recognizing your own patterns over time.",
  },
  meineEntwicklung: {
    title: 'Meine Entwicklung',
    titleEn: 'My Development',
    body: 'Ein längerfristiger Blick auf deine Tageskurve über Wochen und Monate. Es geht nicht darum, „besser" zu werden, sondern darum, eigene Muster und Zusammenhänge sichtbarer zu machen.',
    bodyEn: "A longer-term view of your daily curve over weeks and months. It's not about getting 'better' — it's about making your own patterns and connections more visible.",
  },
  lesezeichen: {
    title: 'Lesezeichen',
    titleEn: 'Bookmarks',
    body: 'Speichere Links, Videos, Artikel oder andere externe Inhalte, die dir gutgetan haben oder guttun könnten — an einem Ort gesammelt, statt in Browser-Tabs verloren zu gehen.',
    bodyEn: "Save links, videos, articles, or other external content that has helped or might help you — collected in one place instead of getting lost in browser tabs.",
  },
  wochenrueckblick: {
    title: 'Wochenrückblick',
    titleEn: 'Weekly Review',
    body: 'Eine ruhige Zusammenfassung der letzten Woche aus deinen Tagebucheinträgen und Check-ins. Kein Leistungsnachweis — eher ein sanfter Blick zurück.',
    bodyEn: "A calm summary of the past week, drawn from your diary entries and check-ins. Not a performance report — more of a gentle look back.",
  },
  timer: {
    title: 'Timer & Stoppuhr',
    titleEn: 'Timer & Stopwatch',
    body: 'Ein einfacher Timer, den du für Brücken, Ressourcen oder einfach für dich selbst nutzen kannst — etwa um dir bewusst eine bestimmte Zeit für etwas zu geben.',
    bodyEn: "A simple timer you can use for bridges, resources, or just for yourself — for example, to consciously give yourself a set amount of time for something.",
  },
  garten: {
    title: 'Mein Garten',
    titleEn: 'My Garden',
    body: 'Ein visuelles Bild für Dinge, die du aufbauen oder verändern möchtest. Jeder Eintrag wächst mit der Zeit — nicht als Leistungsdruck, sondern als ruhige, sichtbare Erinnerung an deinen eigenen Weg.',
    bodyEn: "A visual picture for things you'd like to build or change. Each entry grows over time — not as pressure to perform, but as a calm, visible reminder of your own path.",
  },
  mediLog: {
    title: 'Medi-Log',
    titleEn: 'Medi-Log',
    body: 'Halte Medikamente fest — sowohl regelmäßig eingenommene als auch Bedarfsmedikation. Optional und übersichtlich, mit Verlauf und Vergleich über die Zeit.',
    bodyEn: 'Keep track of medications — both regularly taken ones and as-needed medication. Optional and clear, with history and comparison over time.',
  },
  bruecken: {
    title: 'Brücken',
    titleEn: 'Bridges',
    body: 'Brücken sind konkrete Handlungsmöglichkeiten, die oft mehrere Ressourcen kombinieren — zum Beispiel „Playlist hören und dabei die Füße spüren". Anders als eine einzelne Ressource ist eine Brücke schon ein kleiner, machbarer Schritt.',
    bodyEn: 'Bridges are concrete actions you can take, often combining several resources — for example "listen to a playlist while feeling your feet on the ground." Unlike a single resource, a bridge is already a small, doable step.',
  },
  bridgeDetail: {
    title: 'Brücke',
    titleEn: 'Bridge',
    body: 'Details zu dieser Brücke, mit den einzelnen Ebenen zum Durcharbeiten und einem optionalen Timer. Du entscheidest, wie viel davon gerade passt.',
    bodyEn: "Details for this bridge, with the individual levels to work through and an optional timer. You decide how much of it fits right now.",
  },
  sicherheit: {
    title: 'Sicherheit',
    titleEn: 'Safety',
    body: 'Der Bereich für alles, was dir Sicherheit gibt: dein Netzwerk an Menschen und Aktivitäten, dein Sicherheitsplan und dein Tagebuch.',
    bodyEn: 'The area for everything that gives you safety: your network of people and activities, your safety plan, and your diary.',
  },
  sicherheitsnetz: {
    title: 'Sicherheitsnetz',
    titleEn: 'Safety Net',
    body: 'Eine visuelle Übersicht der Menschen, Aktivitäten und Ressourcen, auf die du zurückgreifen kannst. Favorisierte Ressourcen erscheinen hier automatisch mit.',
    bodyEn: 'A visual overview of the people, activities, and resources you can draw on. Favorited resources automatically show up here too.',
  },
  kontakte: {
    title: 'Kontakte',
    titleEn: 'Contacts',
    body: 'Eine Liste der Menschen in deinem Sicherheitsnetz — mit einer kurzen Notiz dazu, wobei sie dir jeweils helfen können.',
    bodyEn: 'A list of the people in your safety net — with a short note on what each one can help you with.',
  },
  sicherheitsplan: {
    title: 'Sicherheitsplan',
    titleEn: 'Safety Plan',
    body: 'Ein persönlicher Plan für schwierige Momente: Warnsignale, was hilft, und Anlaufstellen. Am besten schon jetzt ausfüllen, wenn es dir gut geht, damit er da ist, wenn du ihn brauchst.',
    bodyEn: "A personal plan for difficult moments: warning signs, what helps, and who to reach out to. It's best to fill this in now, while things feel okay, so it's ready when you need it.",
  },
  tagebuch: {
    title: 'Tagebuch',
    titleEn: 'Diary',
    body: 'Ein Ort für alles, was du festhalten möchtest — frei oder nach Kategorien. Du kannst Schrift und Farbe je Kategorie individuell gestalten.',
    bodyEn: "A place for anything you'd like to write down — freely or by category. You can customize font and color for each category individually.",
  },
  einstellungen: {
    title: 'Einstellungen',
    titleEn: 'Settings',
    body: 'Hier kannst du das Wesen, Erinnerungen, Darstellung und mehr anpassen — einschließlich, das Wesen oder einzelne Tracking-Funktionen ganz abzuschalten, wenn du das möchtest.',
    bodyEn: 'Here you can adjust the companion, reminders, appearance, and more — including turning off the companion or individual tracking features entirely, if you\'d like.',
  },
  wesenInhalte: {
    title: 'Wesen-Inhalte',
    titleEn: 'Companion Content',
    body: 'Verwalte, was das Wesen sagen und zeigen kann: Mitteilungen, Tipps, Ablenkungsinhalte und die Orientierungsübung. Du kannst einzelne Inhalte deaktivieren und eigene hinzufügen.',
    bodyEn: 'Manage what the companion can say and show: messages, tips, distraction content, and the grounding exercise. You can deactivate individual items and add your own.',
  },
  favoriten: {
    title: 'Favoriten',
    titleEn: 'Favorites',
    body: 'Alles, was du in der App favorisiert hast, an einem Ort — schneller Zugriff auf das, was dir am wichtigsten ist.',
    bodyEn: "Everything you've favorited in the app, in one place — quick access to what matters most to you.",
  },
  wesenAblenkung: {
    title: 'Ablenkung verwalten',
    titleEn: 'Manage distraction',
    body: 'Hier kannst du festlegen, welche Arten von Ablenkung dir das Wesen anbietet. Du kannst eigene Kategorien und eigene Inhalte hinzufügen.',
    bodyEn: 'Here you can decide what kinds of distraction the companion offers you. You can add your own categories and your own content.',
  },
  wesenOrientierung: {
    title: 'Orientierung verwalten',
    titleEn: 'Manage grounding',
    body: 'Hier kannst du deine Orientierungsübungen und deren Reihenfolge anpassen.',
    bodyEn: 'Here you can adjust your grounding exercises and the order of their steps.',
  },
  wesenMitteilungen: {
    title: 'Tipps & Mitteilungen verwalten',
    titleEn: 'Manage tips & messages',
    body: 'Hier kannst du festlegen, welche Nachrichten das Wesen wann und wo anzeigen darf.',
    bodyEn: 'Here you can decide which messages the companion is allowed to show, when, and where.',
  },
  nervensystem: {
    title: 'Nervensystem',
    titleEn: 'Nervous system',
    body: 'Die sieben Zustände, die auch im Zugang vorkommen, hier zum Nachschlagen ohne einen ganzen Durchgang zu starten.',
    bodyEn: 'The seven states also used in Access, here to look up without starting a whole pass.',
  },
  koerperwahrnehmung: {
    title: 'Körperwahrnehmung',
    titleEn: 'Body awareness',
    body: 'Mögliche Körperempfindungen zum Nachschlagen — dieselbe Liste, die auch im Zugang verwendet wird.',
    bodyEn: 'Possible body sensations to look up — the same list used in Access.',
  },
  schutzstrategien: {
    title: 'Schutzstrategien',
    titleEn: 'Protection strategies',
    body: 'Wie dein System versuchen kann, dich zu schützen, mit einer kurzen Erklärung dazu, warum das nicht immer gleich hilfreich bleibt.',
    bodyEn: 'How your system can try to protect you, with a short explanation of why that stays helpful.',
  },
  glaubenssaetze: {
    title: 'Denkmaschine',
    titleEn: 'Mind Machine',
    body: 'Dein Kopf produziert ständig Gedanken — hier kannst du sie festhalten und mit einfachen Techniken etwas Abstand dazu gewinnen.',
    bodyEn: 'Your mind keeps producing thoughts — note them here and gain a little distance with simple techniques.',
  },
  gefuehle: {
    title: 'Gefühle',
    titleEn: 'Feelings',
    body: 'Grundgefühle zum Nachschlagen — mit möglichen Gedanken, Körperwahrnehmungen und Bedürfnissen, die damit zusammenhängen können.',
    bodyEn: 'Core feelings to look up — with possible thoughts, body sensations, and needs that can relate to them.',
  },
  wertekompass: {
    title: 'Wertekompass',
    titleEn: 'Values compass',
    body: 'Eine Momentaufnahme, welche Werte in deinen letzten Zugang-Durchgängen häufiger präsent waren — keine feste Eigenschaft, kein Test.',
    bodyEn: 'A snapshot of which values have been more present in your recent Access passes — not a fixed trait, not a test.',
  },
  letGo: {
    title: 'Loslassen',
    titleEn: 'Letting go',
    body: 'Schreib einen Gedanken auf, der dich beschäftigt, und wähle, wie er ziehen darf — als Papierflieger oder zerknüllt im Wind.',
    bodyEn: "Write down a thought that's on your mind and choose how it drifts away — as a paper plane or crumpled in the wind.",
  },
  briefAnMich: {
    title: 'Brief an mich',
    titleEn: 'Letter to myself',
    body: 'Schreib einen Brief an dein zukünftiges Ich mit einem Datum — das Wesen zeigt ihn dir zur passenden Zeit auf der Startseite.',
    bodyEn: 'Write a letter to your future self with a date — the companion shows it to you at the right time on the home screen.',
  },
};
