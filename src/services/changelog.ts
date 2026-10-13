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
    id: '2026-schutzstrategien-kontakte-plakatwand',
    date: '2026',
    items: [
      'Schutzstrategien: aufgeteilt in „Alte“ und „Neue Schutzstrategien“ (mit Ideen für Alternativen zum Übernehmen). Alles, was du aufschreibst, wird sofort mit den Fragen gespeichert. Hindernisse: mehr Erklärung, Fragen, Beispiele, eigene Notizen – und unten ein Weg zu Mein Garten.',
      'Sicherheitsplan: Das doppelte „Skill oder Hilfsmittel dazu“ ist weg. Das PDF übernimmt jetzt die Stufenfarben (Gelb/Orange/Rot).',
      'Plakatwand-Übung: neu „Buchstabensalat“, „Wörter einzeln“ und „Dreh es um“ (3 Schritte).',
      'Startseite: Deine wichtigen Kontakte sind sofort erreichbar – antippen ruft an. Hilfetelefone und Einstellungen auf aktuellen Stand geprüft.',
    ],
    itemsEn: [
      'Protection strategies: split into "Old" and "New protection strategies" (with alternative ideas you can take over). Whatever you write is saved right away with the questions. Obstacles: more explanation, questions, examples, your own notes – and a way to My Garden at the bottom.',
      'Safety plan: the duplicate "Add skill or tool" is gone. The PDF now carries the tier colours (yellow/orange/red).',
      'Billboard exercise: new "Letter salad", "Words one by one" and "Turn it around" (3 steps).',
      'Start page: your important contacts are reachable right away – tap to call. Helplines and settings checked and brought up to date.',
    ],
  },
  {
    id: '2026-zugang-umbau-wesen-starthilfe',
    date: '2026',
    items: [
      'Zugang neu geordnet: Erst hinschauen (Körper, Zustand, Gefühl, Schutzstrategie, Fürsorge, Bedürfnis, Hindernis, Wert), dann entscheidest du: „Ich reguliere mich erst“ oder „Der Zustand passt“. Danach „Was geht gerade?“ und eine Seite mit passenden Ressourcen und Brücken – direkt zu den Ressourcen oder Brücke nutzen, wenn du mehr Anleitung brauchst. „Wie war es danach?“ kommt erst nach der Nutzung, und der Rückblick zeigt jetzt jeden Schritt.',
      'Wesen: „Liebevoller Störsender“ (direkte Einladungen ohne Auswahl), „10 Sekunden Schmuggel“ (10 Sekunden etwas ganz anderes, danach darfst du sofort weiter funktionieren) und „Hilfsmittel in den Weg“ (eine deiner Ressourcen taucht über den Tag auf der Startseite auf). Alle mit Info-Knopf; der letzte ist in den Einstellungen abschaltbar.',
      'Nach der Orientierung geht es weiter: körperliche Sicherheit (auch zu Reizen), bemerken, benennen, Stopp, ein körperlicher Reiz.',
      'Neues Bedürfnis „Ausdruck“. Körperdetektiv: 12 % zeigt jetzt richtig blau/Hypoarousal. Startseite: „Verstehen (Zugang – Zustand und Handlung)“ und „Handeln (Ressourcen und Brücken)“.',
    ],
    itemsEn: [
      'Access reordered: first look (body, state, feeling, protection strategy, care, need, obstacle, value), then you decide: "I regulate first" or "The state fits". Then "What is possible now?" and a page with matching resources and bridges – straight to resources, or use a bridge if you need more guidance. "How was it afterwards?" only comes after use, and the review now shows every step.',
      'Companion: "Loving interrupter" (direct invitations without a choice), "10-second smuggle" (10 seconds of something completely different, then you may go on functioning right away) and "Putting tools in your way" (one of your resources shows up on the start page during the day). All with an info button; the last one can be switched off in the settings.',
      'After grounding it goes on: physical safety (also about stimuli), notice, name, stop, one bodily stimulus.',
      'New need "Expression". Body detective: 12 % now correctly shows blue/hypoarousal. Start page: "Understand (Access – state and action)" and "Act (Resources and bridges)".',
    ],
  },
  {
    id: '2026-bruecken-beispiel-abstaende',
    date: '2026',
    items: [
      'Brücken: Beim Erstellen findest du ganz oben ein genau erklärtes Beispiel (Wert „Natur“, fünf Schritte mit Ort, Aktivität, Hilfsmittel, Skill und Person) und kannst es als Vorlage übernehmen. Die Brücken-Impulse sind jetzt fertige Brücken statt einzelner Übungen.',
      'Alle ?-Hilfetexte, die Erklärung „Was unterscheidet Brücken von Ressourcen?“ und „Nicht sicher, was gerade passt?“ sind auf den aktuellen Stand gebracht – mit Überschriften und kurzen Absätzen.',
      'Mehr Luft überall: Ein Fehler hat bisher fast alle Abstände zwischen Überschriften und Texten verschluckt. Jetzt stehen Texte auf allen Seiten ruhiger untereinander. Startseite ohne Lieblingsbrücke, Datum mit mehr Abstand, Entdecken-Liste übersichtlicher, der Mittelpunkt der Karte pulsiert.',
    ],
    itemsEn: [
      'Bridges: when creating one you find a precisely explained example at the very top (value "Nature", five steps with place, activity, tool, skill and person) and can use it as a template. The bridge impulses are now ready-made bridges instead of single exercises.',
      'All ? help texts, the explanation "What is the difference between bridges and resources?" and "Not sure what fits right now?" are up to date – with headings and short paragraphs.',
      'More air everywhere: a bug had swallowed almost all spacing between headings and texts. Texts now sit calmly one under another on every page. Home without favourite bridge, date with more space, Explore list clearer, the centre of the map pulses.',
    ],
  },
  {
    id: '2026-ressourcen-orte-aktivitaeten',
    date: '2026',
    items: [
      'Ressourcen: Hilfsmittel sind Dinge zum Anfassen, Skills regulieren – dazu gibt es jetzt eigene Seiten „Orte & Umgebung“ (mit Natur, Ort, besondere Umgebung, Platz) und „Aktivitäten & Beschäftigung“, plus Personen aus deinem Netz. Alles davon lässt sich in den Schritten einer Brücke auswählen.',
      'Umstände („genügend Schlaf gehabt“) wählst oder tippst du beim Erstellen und Bearbeiten von Skills, Hilfsmitteln, Orten und Aktivitäten. Was du tippst, wird gespeichert und steht überall wieder zur Auswahl – ohne eigene Seite.',
      'Nach der Bedürfnis-Auswahl im Check-in landest du auf der Ressourcen-Übersicht: dort „Was geht gerade?“, darunter passend Skills, Hilfsmittel und Quellen.',
      'Aufgeräumt: „Weitermachen“ ist von der Startseite weg, alle „… automatisch übernehmen“-Schalter sind weg (Rückblicke enthalten alles von selbst, getrennt vom Tagebuch), der Zugang-Link im Check-in ist weg, und das Wetter-Rad springt nicht mehr von allein weiter.',
      'Tagebuch-Vorlagen sind nach „vorausschauend“ und „rückblickend“ sortiert – neu: Schematagebuch, DBT-Tageskarte und Verhaltensanalyse. Der Lauf mit dem Wesen reagiert sofort beim Antippen, ist am Laptop größer und füllt am Handy den ganzen Bildschirm.',
    ],
    itemsEn: [
      'Resources: tools are things you can touch, skills regulate – now with their own pages "Places & surroundings" (nature, place, special surroundings, spot) and "Activities & occupation", plus people from your network. You can pick all of them in the steps of a bridge.',
      'Circumstances ("had enough sleep") are chosen or typed when creating and editing skills, tools, places and activities. What you type is saved and selectable everywhere again – no page of its own.',
      'After choosing a need in the check-in you land on the Resources overview: "What works right now?" there, then matching skills, tools and sources below.',
      'Tidied up: "Continue" is gone from the start page, all "… take over automatically" switches are gone (reviews include everything by themselves, separate from the diary), the Access link in the check-in is gone, and the weather wheel no longer moves on by itself.',
      'Diary templates are sorted into "looking ahead" and "looking back" – new: schema diary, DBT diary card and behavior analysis. The run with your companion reacts the moment you tap, is bigger on a laptop and fills the whole screen on a phone.',
    ],
  },
  {
    id: '2026-bruecken-werte-karte',
    date: '2026',
    items: [
      'Brücken führen jetzt zu einem Wert oder einer Lebensrichtung (statt in Kategorien). Du wählst den Wert, bekommst Fragen zum Nachspüren – und die Bedürfnisse dahinter (einklappbar) schlägt die App vor. Gefiltert wird später nach Wert oder Bedürfnis; auch im Wertekompass führt ein Link direkt dorthin.',
      '„Level“ heißt jetzt „Schritte“. Zu jedem Schritt kannst du bestehende Skills, Hilfsmittel, Helfer oder Quellen dazunehmen – die App schlägt passende vor, weil sie weiß, welche Ressource welches Bedürfnis erfüllt. Die Umstände („unter welchen Bedingungen“) findest du auch bei den Ressourcen unter Hilfsmittel → Orte → Umstände.',
      'Entdecken: eine weiche, lebendige Karte mit allen Seiten, neutraler Mitte und den Zusätzen nach Zweck sortiert. „So hängt alles zusammen“ ist darin aufgegangen.',
      '„Das habe ich geschafft“ zeigt nur den heutigen Tag, alles bleibt im Rückblick. Zugang: am Abzweig gibt es „Fertig“. Neue Starter-Skills: Gewichtsdecke, eiskaltes Wasser, bilaterale Stimulation.',
    ],
    itemsEn: [
      'Bridges now lead to a value or life direction (instead of categories). You pick the value, get questions to feel into – and the app suggests the needs behind it (collapsible). Filtering is by value or need; the Values compass links straight there.',
      '"Level" is now "Steps". For each step you can add existing skills, tools, helpers or sources – the app suggests matching ones because it knows which resource fulfils which need. The circumstances ("under which conditions") are also in Resources under Tools → Places → Circumstances.',
      'Explore: a soft, living map with every page, a neutral centre and the add-ons sorted by purpose. "How it all connects" has merged into it.',
      '"Things I managed" shows only today, everything stays in the review. Access: the fork now has "Done". New starter skills: weighted blanket, ice-cold water, bilateral stimulation.',
    ],
  },
  {
    id: '2026-zugangskanaele-karte',
    date: '2026',
    items: [
      'Neu: Seite „Zugangskanäle – Was ist gerade vorhanden?“. Du sagst für zehn Wege (Denken, Fühlen, Körper, Sinne, Bewegung …), was gerade geht – das Netz zeigt dein Bild. Zustandsaufnahmen kannst du speichern, später übernehmen und mit dem Jetzt vergleichen. Was du einstellst, gilt als Filter in Skills, Skillketten und Hilfsmitteln.',
      'Zugang: Du benennst zuerst selbst, was du im Körper wahrnimmst und fühlst – erst danach kommen Auswahlen (zuerst ohne Farben, dann auf Wunsch mit den Farben der Nervensystem-Zustände).',
      'Zugang hat jetzt eine Abzweigung: „Meinen Zustand ändern“ (passende Skills und Skillketten, eingeschränkt durch „Was geht gerade?“) oder „Mein Zustand passt“ (Bedürfnis, Wert, Brücken). Beim Start kannst du wählen: „Ich will mich regulieren“ oder „Ich will etwas tun“.',
      'Unten gibt es nur noch Jetzt, Sicherheit und Entdecken. Zugang und Brücken starten auf „Jetzt“, alles findest du in Entdecken – dort als Karte mit den fünf Hauptbereichen in Farbe und den Zusätzen getrennt (die bisherige Liste gibt es weiter).',
    ],
    itemsEn: [
      'New: page "Access channels – What is available right now?". For ten routes (thinking, feeling, body, senses, movement …) you say what works now – the net shows your picture. You can save state snapshots, take them over later and compare. What you set acts as the filter in skills, skill chains and tools.',
      'Access: you first name in your own words what you notice in the body and what you feel – only then come options (first without colours, then on request with the nervous-system colours).',
      'Access now has a fork: "Change my state" (matching skills and skill chains, narrowed by "What works right now?") or "My state fits" (need, value, bridges). At the start you can choose: "I want to regulate" or "I want to do something".',
      'The bottom bar now only has Now, Safety and Explore. Access and bridges start from "Now", everything is in Explore – there as a map with the five main areas in colour and the add-ons separate (the previous list is still there).',
    ],
  },
  {
    id: '2026-was-geht-gerade',
    date: '2026',
    items: [
      'Neu: „Was geht gerade?“ — auf der Ressourcen-Startseite, bei Skills, Skillketten, Hilfsmitteln und im Zugang. Du stellst ein, was gerade da ist (Energie, Zeit, Zugangskanäle, Aufwand) und siehst nur, was damit machbar ist.',
      'Die Energie-Stufen sind jetzt lebendig: kleine Wellen-Kugeln, die je Stufe anders schwingen, damit du hineinfühlen kannst. Mit „Animation reduzieren“ stehen sie still.',
      'Beim Erstellen von Skills, Hilfsmitteln und Orten gibst du an, wie viel Zeit mindestens nötig ist und über welche Zugangskanäle es wirkt. Die Starter-Skills sind schon vormarkiert.',
      'Skillketten: Zu jedem Schritt kannst du bestehende Hilfsmittel, Helfer und gespeicherte Quellen hinzufügen. Zeit, Energie und Bedarf der Kette werden aus ihren Schritten berechnet.',
    ],
    itemsEn: [
      'New: "What works right now?" — on the Resources start page, in skills, skill chains, tools and Access. You set what is available right now (energy, time, access channels, effort) and only see what is doable with it.',
      'The energy levels are alive now: small wave orbs that move differently per level, so you can feel into them. With "Reduce motion" they stand still.',
      'When creating skills, tools and places you state the minimum time needed and through which access channels it works. The starter skills are already marked.',
      'Skill chains: add existing tools, helpers and saved sources to every step. Time, energy and needs of the chain are calculated from its steps.',
    ],
  },
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
