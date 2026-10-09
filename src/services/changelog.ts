/**
 * "Was ist neu-Hinweis beim Update"-Auftrag — a short, hand-written
 * list of what changed, shown once to someone who just reloaded after
 * an update (see useWhatsNew.ts). Newest entry first. Keep each
 * entry's `items` to 2-4 short, plain-language bullets — this is a
 * friendly note, not a technical release log. Add a new entry here at
 * the end of a work session that changed something a person would
 * actually notice; skip purely internal/invisible fixes.
 */
export interface ChangelogEntry {
  id: string;
  date: string;
  items: string[];
  itemsEn: string[];
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    id: '2026-fahrplan-zustand',
    date: '2026',
    items: [
      'Skills richten sich nach deinem Zustand: In hoher Anspannung und im Rückzug zeigt die App nur Skills, die über den Körper wirken.',
      'Persönlicher Fahrplan: Dort, wo „zu den Skills“ landet, siehst du zuerst deinen Plan und was dir bei ähnlicher Anspannung schon geholfen hat.',
      'Neu auf der Startseite: „Heute bisher“ — welcher Tag, was du schon getan hast, wer kommt.',
      'Sicherheitsplan: Warnsignale lassen sich mit einem Skill verknüpfen; das Körperdetektiv kann ein Körperzeichen in den Plan aufnehmen. Bei Personen im Netzwerk gibt es „Was hilft mir von dir“.',
      'Hinweise wandern in Zeit, Form und Wortlaut; du wählst still, mit Klang oder mit Vibration. Termine und Check-in-Erinnerungen gibt es auch als Kalenderdatei für den Handy-Kalender.',
      'Bei leichter Unruhe schlägt die App eine kurze Übung vor. Skills können einen Anker bekommen: ein Foto und eine Sprachnotiz.',
      '„Ich will“ kennt „will ich“ und „soll ich“; der automatische Tagesrückblick enthält bei Bedarf eine sanfte Frage.',
    ],
    itemsEn: [
      'Skills follow your state: in high tension and withdrawal the app only shows skills that work through the body.',
      'Personal roadmap: where "to the skills" lands you first see your plan and what has helped you at a similar tension.',
      'New on the home screen: "So far today" — which day, what you already did, who is coming.',
      'Safety plan: warning signs can be linked to a skill; the body detective can add a body sign to the plan. People in the network have "What helps me from you".',
      'Hints move in time, form and wording; you choose silent, with sound or with vibration. Appointments and check-in reminders are also available as a calendar file for your phone calendar.',
      'At light unrest the app suggests a short practice. Skills can get an anchor: a photo and a voice note.',
      '"I want to" knows "I want" and "I should"; the automatic daily review includes a gentle question when needed.',
    ],
  },
  {
    id: '2026-energie-netzwerk-rueckblick',
    date: '2026',
    items: [
      'Neu: Skillketten kannst du jetzt starten — Schritt für Schritt, sichtbar als Kette, mit Reflexion danach.',
      'Neu: vier Energielevel mit Beschreibungen; Hilfsmittel und Skills geben an, wie viel Energie sie brauchen.',
      'Hilfsmittel sind neu geordnet (Sinne und Funktion, Orte mit Unterkategorien). Klavier, „Atem holen“, Waldspaziergang und Wärmequelle sind jetzt Skills.',
      'Nach dem Check-in führt dein Bedürfnis zu passenden Ressourcen; bei hoher Anspannung fragt die App zuerst, ob du lieber einen Skill ausprobieren möchtest.',
      'Tages-, Wochen- und Monatsrückblick kommen automatisch ins Postfach (Uhrzeit in den Einstellungen).',
      'Netzwerk mit vier Rollen: Person, Ressource, Hilfsmittel, Ort — verbunden mit deinen Einträgen und mit dem Kalender.',
      'Entdecken: Seiten anpinnen und archivieren. Eigene Sätze für die Startseite werden jetzt angezeigt. Klick-Töne sind verlässlicher, und „Animation reduzieren“ beruhigt jetzt auch die Blätter.',
    ],
    itemsEn: [
      'New: you can now start skill chains — step by step, shown as a chain, with a reflection afterwards.',
      'New: four energy levels with descriptions; tools and skills state how much energy they need.',
      'Tools are reorganised (senses and function, places with sub-categories). Piano, "Catch your breath", forest walk and warmth source are now skills.',
      'After the check-in your need leads to matching resources; when tension is high the app first asks whether you would rather try a skill.',
      'Daily, weekly and monthly reviews arrive in the mailbox automatically (time in settings).',
      'Network with four roles: person, resource, tool, place — connected to your entries and the calendar.',
      'Explore: pin and archive pages. Your own home-screen sentences now show up. Click sounds are more reliable, and "Reduce animation" now also calms the leaves.',
    ],
  },
  {
    id: '2026-kalender-rueckblick',
    date: '2026',
    items: [
      'Neu: Kalender — die nächsten sieben Tage auf einen Blick, Termine mit Person aus deinem Netzwerk, Kategorien in eigenen Farben und „Ich muss gar nichts, aber ich will“.',
      'Erinnerungen und die Nachfragen eine Stunde nach einem Termin landen im Postfach (nur in der App, keine Push-Meldungen).',
      'Neu: „Skill starten“ mit Timer und Anleitung, danach kurze Reflexion — im Rückblick siehst du, wie du zurückgeschwungen bist.',
      'Der Tagesrückblick zeigt deine Kurve mit allen Werten und Uhrzeiten; Tag, Woche und Monat gibt es als PDF.',
      'Auf dem Regenbogen führt ab dem Frühwarnbereich der Knopf „zu den Skills“ zu den passenden Skills und Skillketten.',
    ],
    itemsEn: [
      'New: Calendar — your next seven days at a glance, appointments with a person from your network, categories in your own colors and "I don\'t have to, but I want to".',
      'Reminders and the follow-up questions an hour after an appointment arrive in the mailbox (in the app only, no push notifications).',
      'New: "Start skill" with timer and instructions, then a short reflection — the review shows how you swung back.',
      'The daily review shows your curve with all values and times; day, week and month are available as PDF.',
      'On the rainbow, from the early-warning zone upward, the "to the skills" button leads to matching skills and skill chains.',
    ],
  },
  {
    id: '2026-postfach-skills-pdf',
    date: '2026',
    items: [
      'Neu: Postfach — das kleine Briefsymbol auf der Startseite leuchtet bei Neuem (Updates, Erinnerungen, Briefe) und sammelt alles an einem Ort.',
      'Neu: Skills und Hilfsmittel haben ein eigenes Formular (Einsatzbereich, Anleitung, Zonen). Skillketten haben jetzt eine eigene Unterseite.',
      'Das PDF von Skills und Hilfsmitteln funktioniert jetzt auch im iPhone-Startbildschirm-Modus.',
      'Der Himmel auf der Startseite blendet im hellen Modus weich aus, und „Das habe ich geschafft“ ist immer sichtbar.',
    ],
    itemsEn: [
      'New: Mailbox — the small letter icon on the home screen glows when something is new (updates, reminders, letters) and gathers everything in one place.',
      'New: Skills and tools have their own form (when to use, instructions, zones). Skill chains now have their own subpage.',
      'The PDF for skills and tools now also works in the iPhone home-screen mode.',
      'The home-screen sky now fades softly in light mode, and "What I achieved" is always visible.',
    ],
  },
  {
    id: '2026-lebendige-app-dino-medipackungen',
    date: '2026',
    items: [
      'Neu: Die Startseite und der Garten spiegeln jetzt Tageszeit und Jahreszeit wider — mit Sternenhimmel, Sonnenaufgang/-untergang und jahreszeitlichen Details.',
      'Neu: Ein kleines Lauf-Spiel mit dem Wesen (erreichbar über das Wesen-Menü) — mit Zeit-Bonus fürs Funken-Sammeln.',
      'Neu: Medikamenten-Packungen — trage an, wie viele Tabletten eine Packung hat, die App zählt den Verbrauch automatisch mit und warnt, wenn es knapp wird.',
      'Der Timer bei Übungen zeigt jetzt einen ruhigen, dünnen Fortschrittsring statt einer groben Anzeige.',
      'Die Nervensystem-Beschreibungen sind jetzt offener formuliert ("das kann bedeuten...") statt sehr bestimmt.',
      'Mehrere kleinere Fehler behoben, u. a. beim "Eigenes erstellen" in den Ablenkungs-Kategorien und beim Wesen-Menü auf dem Laptop.',
    ],
    itemsEn: [
      'New: The home screen and garden now reflect time of day and season — with a starry sky, sunrise/sunset, and seasonal details.',
      "New: A small running game with your companion (reachable from the companion menu) — collect sparks for a time bonus.",
      'New: Medication packages — enter how many tablets a package has, the app automatically tracks usage and warns when it\'s running low.',
      'The exercise timer now shows a calm, thin progress ring instead of a bulkier display.',
      'Nervous-system descriptions are now phrased more openly ("this can mean...") instead of very definite.',
      'Several smaller fixes, including "create your own" in the distraction categories and the companion menu on laptop screens.',
    ],
  },
  {
    id: '2026-koerper-detektiv-uebungen',
    date: '2026',
    items: [
      'Neu: Körper-Detektiv (🔍) — falls du dich gerade nicht einschätzen kannst, drei einfache Körper-Fragen finden den passenden Stand für dich.',
      '18 Soforthilfe-Übungen, drei pro Nervensystem-Stufe, direkt aus dem Regler erreichbar.',
      'Neu: Reflexions-Tagebuch — tippe auf einen Punkt im Verlauf, um kurz festzuhalten, was da war.',
      'Neu: Fenster-Fortschritt speichern und als Chronik nachlesen oder exportieren.',
      '"Erklär\'s mir als..." — die Nervensystem-Erklärung jetzt auch einfacher oder fachlicher lesbar.',
      'Ein hartnäckiger Fehler bei der Weiterleitung zu manchen Übungen ist behoben.',
    ],
    itemsEn: [
      'New: Body detective (🔍) — if you can\'t tell where you are right now, three simple body questions find the right spot for you.',
      '18 quick-help exercises, three per nervous-system stage, reachable straight from the slider.',
      'New: reflection journal — tap a point in your history to briefly note what was going on.',
      'New: save your window progress and look back at it as a chronicle, or export it.',
      '"Explain it to me as..." — the nervous system explainer can now also be read simpler or more clinically.',
      'A persistent bug where some exercises failed to open has been fixed.',
    ],
  },
  {
    id: '2026-nervensystem-6-zonen',
    date: '2026',
    items: [
      'Der Nervensystem-Regler ist komplett überarbeitet: sechs feinere Stufen statt drei, mit neuem Regenbogen-Design.',
      'Neu: Klinische Fenster-Kalibrierung — stelle dein eigenes Toleranzfenster ein, samt sanfter Warnung, wenn du deinen persönlichen Bereich verlässt.',
      'Ein neuer, ausführlicher Erklärtext zum Modell (zum Aufklappen) an allen drei Check-in-Stellen.',
    ],
    itemsEn: [
      'The nervous system slider has been completely reworked: six finer stages instead of three, with a new rainbow design.',
      'New: clinical window calibration — set your own window of tolerance, with a gentle warning when you leave your personal range.',
      'A new, detailed explainer about the model (collapsible) at all three check-in spots.',
    ],
  },
  {
    id: '2026-monatsrueckblick',
    date: '2026',
    items: [
      'Neu: Monatsrückblick — im Wochenrückblick zwischen Woche und Monat umschalten.',
      'Diese kurze "Was ist neu"-Anzeige nach einem Update.',
    ],
    itemsEn: [
      'New: monthly review — switch between week and month in the review page.',
      'This short "what\'s new" note after an update.',
    ],
  },
];
