export type HelpKey =
  | 'home' | 'checkin' | 'entdecken' | 'ressourcen' | 'zugangsrad' | 'zugang' | 'zugangRueckblick'
  | 'beduerfnisKompass' | 'tageskurve' | 'meineEntwicklung' | 'lesezeichen' | 'wochenrueckblick'
  | 'timer' | 'garten' | 'mediLog' | 'bruecken' | 'bridgeDetail' | 'sicherheit' | 'sicherheitsnetz'
  | 'kontakte' | 'sicherheitsplan' | 'tagebuch' | 'einstellungen' | 'wesenInhalte' | 'favoriten'
  | 'wesenAblenkung' | 'wesenOrientierung' | 'wesenMitteilungen'
  | 'nervensystem' | 'koerperwahrnehmung' | 'schutzstrategien' | 'glaubenssaetze' | 'gefuehle' | 'wertekompass' | 'letGo' | 'briefAnMich' | 'kalender' | 'skillLauf';

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
    body: 'Hier landest du beim Öffnen der App. Die schmale Zeile unter dem Titel zeigt „Heute bisher“: welcher Tag, wie spät, wann du eingecheckt hast, welchen Skill du gemacht hast und wer kommt — ein Tipp öffnet den Tagesrückblick. Der Check-In ist freiwillig. Oben rechts liegt das Postfach mit Erinnerungen, Termin-Nachfragen, Updates und deinen automatischen Rückblicken.',
    bodyEn: 'This is where you land when opening the app. The slim line under the title shows "So far today": which day, what time, when you checked in, which skill you did and who is coming — a tap opens the daily review. The check-in is optional. The mailbox at the top right holds reminders, appointment follow-ups, updates and your automatic reviews.',
  },
  checkin: {
    title: 'Check-In',
    titleEn: 'Check-In',
    body: 'Ein kurzer, geführter Moment: inneres Wetter, dann „Wo bist du gerade?“, dann Bedürfnisse. Danach geht es zu den Ressourcen, die zu deinem Bedürfnis passen. Bist du gerade stark angespannt, fragt dich die App zuerst, ob du lieber einen Skill ausprobieren oder gleich zu den Ressourcen möchtest. Du kannst jederzeit überspringen.',
    bodyEn: 'A brief guided moment: inner weather, then "Where are you right now?", then needs. Afterwards you are taken to the resources that fit your need. If you are very tense, the app first asks whether you would rather try a skill or go straight to the resources. You can skip at any point.',
  },
  entdecken: {
    title: 'Entdecken',
    titleEn: 'Explore',
    body: 'Eine Übersicht über die Werkzeuge der App. Mit „Anpassen“ kannst du Seiten anpinnen (dann stehen sie ganz oben) oder archivieren (dann liegen sie grau ganz unten) — so bleibt sichtbar, was du wirklich nutzt. Du musst nichts davon nutzen; wähle das, was gerade zu dir passt.',
    bodyEn: 'An overview of the app\'s tools. With "Customize" you can pin pages (they then sit at the very top) or archive them (they then sit greyed at the very bottom) — so what you really use stays visible. You do not have to use any of it; pick what fits right now.',
  },
  ressourcen: {
    title: 'Ressourcen',
    titleEn: 'Resources',
    body: 'Hier sammelst du, was dir in schwierigen Momenten Halt gibt: Hilfsmittel (Dinge, nach Sinnen und Funktion geordnet), Skills (Fähigkeiten, die du übst) und gespeicherte Quellen. Jeder Eintrag kann angeben, wie viel Energie er braucht, zu welchem Bedürfnis und welchem Anspannungsbereich er passt und ob er im Netzwerk erscheinen soll. Bei einem Skill findest du „Skill starten“ mit Anleitung und Timer.',
    bodyEn: 'Here you collect what holds you in hard moments: tools (things, sorted by senses and function), skills (abilities you practice) and saved sources. Each entry can state how much energy it needs, which need and tension range it fits, and whether it should appear in the network. For a skill you will find "Start skill" with instructions and timer.',
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
    body: 'Dein persönlicher Plan für schwere Momente: Warnsignale in drei Stufen und was dann hilft. Bei jedem Warnsignal kannst du einen Skill oder ein Hilfsmittel verknüpfen („Wenn …, dann …“). Landest du später in dieser Stufe, steht dein Plan als Erstes im persönlichen Fahrplan. Auch das Körperdetektiv kann ein Körperzeichen hier aufnehmen. „Hilfe holen“ übernimmt bei einer Person aus deinem Netzwerk, was dir von ihr hilft.',
    bodyEn: 'Your personal plan for hard moments: warning signs in three tiers and what helps then. For each warning sign you can link a skill or tool ("If …, then …"). If you land in that tier later, your plan comes first in the personal roadmap. The body detective can also add a body sign here. "Get help" takes over what helps you from a person in your network.',
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
  kalender: {
    title: 'Kalender',
    titleEn: 'Calendar',
    body: 'Die nächsten sieben Tage auf einen Blick — heute ist eingerahmt. Termine trägst du mit Datum, Uhrzeit, Kategorie und, wenn du magst, einer Person aus deinem Netzwerk ein. Erinnerungen erscheinen im Postfach; für Erinnerungen bei geschlossener App kannst du die Termine als Kalenderdatei in den Handy-Kalender übernehmen (eine Momentaufnahme, bei Änderungen neu exportieren). Unter „Ich muss gar nichts, aber ich will“ sammelst du Dinge für den Tag — markiere, ob du etwas willst oder sollst, und spür vorher kurz in den Körper.',
    bodyEn: 'Your next seven days at a glance — today is framed. You enter appointments with date, time, category and, if you like, a person from your network. Reminders appear in the mailbox; for reminders while the app is closed you can put the appointments into your phone calendar as a calendar file (a snapshot, export again after changes). Under "I do not have to do anything, but I want to" you collect things for the day — mark whether you want to or should, and feel into your body first.',
  },
  skillLauf: {
    title: 'Skill oder Skillkette starten',
    titleEn: 'Start a skill or skill chain',
    body: 'Die Uhr zählt einfach mit — es gibt kein Ende, das du erreichen musst. Du siehst die Schritte der Anleitung (bei einer Kette Schritt für Schritt nacheinander) und kannst jederzeit beenden. Danach schaust du kurz nach, wo deine Anspannung jetzt ist. Das landet in Kurve und Rückblick — dort siehst du, wann du zurückgeschwungen bist.',
    bodyEn: 'The clock simply runs along — there is no end you have to reach. You see the instruction steps (for a chain, one after another) and can stop at any time. Afterwards you briefly check where your tension is now. That goes into the curve and the review — there you see when you swung back.',
  },
};
