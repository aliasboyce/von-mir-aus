export type HelpKey =
  | 'home' | 'checkin' | 'entdecken' | 'ressourcen' | 'zugangsrad' | 'zugang' | 'zugangRueckblick'
  | 'beduerfnisKompass' | 'tageskurve' | 'meineEntwicklung' | 'lesezeichen' | 'wochenrueckblick'
  | 'timer' | 'garten' | 'atmen' | 'mindmap' | 'mediLog' | 'bruecken' | 'bridgeDetail' | 'sicherheit' | 'sicherheitsnetz'
  | 'kontakte' | 'sicherheitsplan' | 'tagebuch' | 'einstellungen' | 'wesenInhalte' | 'favoriten'
  | 'wesenAblenkung' | 'wesenOrientierung' | 'wesenMitteilungen'
  | 'quellen' | 'skills' | 'hilfsmittel' | 'orte' | 'aktivitaeten' | 'skillketten'
  | 'nervensystem' | 'koerperwahrnehmung' | 'schutzstrategien' | 'glaubenssaetze' | 'gefuehle' | 'wertekompass' | 'letGo' | 'briefAnMich' | 'kalender' | 'skillLauf' | 'zugangskanaele';

interface HelpEntry {
  title: string;
  titleEn: string;
  body: string;
  bodyEn: string;
}

export const HELP_CONTENT: Record<HelpKey, HelpEntry> = {
  home: {
    title: `Startseite`,
    titleEn: `Home`,
    body: `Hier landest du beim Öffnen der App. Nichts davon ist Pflicht.

### Die Zeile unter dem Titel
Sie zeigt „Heute bisher“: Wochentag, Datum und Uhrzeit, dazu wann du eingecheckt hast, welchen Skill du gemacht hast und wer kommt. Ein Tipp darauf öffnet den Tagesrückblick.

### Check-in
Ein kurzer, geführter Moment, wie es dir gerade geht. Danach führt er dich zu dem, was zu deinem Bedürfnis passt.

### Verstehen und Tun
„Verstehen“ öffnet Zugang: Schritt für Schritt herausfinden, was los ist. „Tun“ öffnet Brücken: kleine Schritte zu etwas, das dir wichtig ist.

### Nicht sicher, was gerade passt?
Der kleine Link darunter fragt, was du gerade brauchst, und führt dich dorthin.

### Oben rechts
Das Postfach sammelt Erinnerungen, Nachfragen zu Terminen und Updates. Über das Wesen erreichst du auch die Orientierungsübung.`,
    bodyEn: `This is where you land when you open the app. None of it is required.

### The line under the title
It shows "So far today": weekday, date and time, plus when you checked in, which skill you did and who is coming. A tap on it opens the daily review.

### Check-in
A short guided moment about how you are right now. Afterwards it leads you to what fits your need.

### Understand and Do
"Understand" opens Access: find out step by step what is going on. "Do" opens Bridges: small steps toward something that matters to you.

### Not sure what fits right now?
The small link below asks what you need right now and takes you there.

### Top right
The mailbox collects reminders, appointment follow-ups and updates. The companion also gives you the grounding exercise.`,
  },
  checkin: {
    title: `Check-in`,
    titleEn: `Check-in`,
    body: `Ein kurzer, geführter Moment. Du kannst an jeder Stelle überspringen.

### Der Ablauf
• **Inneres Wetter:** Wie fühlt es sich innen gerade an? Es gibt kein Richtig oder Falsch.
• **Nervensystem:** Wie fühlt sich dein Nervensystem an?
• **Anspannung:** Wie angespannt bist du?
• **Bedürfnis:** Was würde dir gerade guttun?

### Danach
Du kommst zu den Ressourcen, die zu deinem Bedürfnis passen: zuerst Skills, dann Hilfsmittel, dazu Orte und Aktivitäten und gespeicherte Quellen. Mit „Was geht gerade?“ schränkst du ein, was jetzt machbar ist.

### Wichtig
Ein Check-in ist kein Tracking und keine Pflicht. Was du eintippst, bleibt auf deinem Gerät. Im Rückblick siehst du es nur, wenn du ihn dir ansiehst.

### Weiter ohne Auswahl
Passt keins der Angebote? „Keines von beiden“ geht trotzdem weiter. Wählst du danach ein Bedürfnis, fragt die App, ob du direkt dorthin willst oder zurück zur Startseite. Gespeichert wird so oder so.`,
    bodyEn: `A short guided moment. You can skip at any point.

### The flow
• **Inner weather:** How does it feel inside right now? There is no right or wrong.
• **Nervous system:** How does your nervous system feel?
• **Tension:** How tense are you?
• **Need:** What would do you good right now?

### Afterwards
You get to the resources that fit your need: skills first, then tools, plus places, activities and saved sources. With "What works right now?" you narrow down what is doable now.

### Important
A check-in is not tracking and not a duty. What you enter stays on your device. You only see it in the review when you open the review.

### Continue without choosing
If none of the options fits, “Neither” still moves on. After picking a need the app asks whether you want to go there right away or back to the start page. It is saved either way.`,
  },
  entdecken: {
    title: `Entdecken`,
    titleEn: `Explore`,
    body: `Hier liegt alles, was die App kann, an einem Ort.

### Karte
Die fünf Hauptbereiche in Farbe: Wo bin ich? · Mich regulieren · Mich verbinden · Mich sichern · Zurückschauen. Dazu die Zusätze, grau abgesetzt. Tippe auf einen Bereich oder eine Seite, um zu ihr zu springen.

### Liste
Dieselben Seiten in Reihen: **Erforschen** (verstehen, was los ist) und **Tun** (etwas für mich tun). Jede Reihe lässt sich einzeln umsortieren.

### Anpassen
Du kannst Seiten anpinnen (dann stehen sie ganz oben) oder archivieren (dann liegen sie grau ganz unten). So bleibt sichtbar, was du wirklich nutzt.

Du musst nichts davon nutzen. Wähle, was gerade passt.`,
    bodyEn: `Everything the app can do, in one place.

### Map
The five main areas in colour: Where am I? · Regulate · Connect · Secure · Look back. Plus the add-ons, set apart in grey. Tap an area or a page to jump to it.

### List
The same pages in rows: **Explore** (understand what is going on) and **Do** (do something for myself). Each row can be re-ordered separately.

### Customize
You can pin pages (they then sit at the very top) or archive them (they then sit greyed at the very bottom). So what you really use stays visible.

You do not have to use any of it. Pick what fits right now.`,
  },
  ressourcen: {
    title: `Ressourcen`,
    titleEn: `Resources`,
    body: `Hier sammelst du, was dir hilft. Alles, was du hier ablegst, kannst du später in den Schritten einer Brücke auswählen.

### Die Türen
• **Skills:** erlernte Abfolgen, um Anspannung zu regulieren, dazu deine Skillketten
• **Hilfsmittel:** Dinge zum Anfassen, Werkzeuge, Anker, Bücher, Apps
• **Orte & Umgebung:** Orte, an denen es dir besser geht
• **Aktivitäten & Beschäftigung:** Dinge, die du tun kannst
• **Personen:** Menschen aus deinem Netz
• **Gespeicherte Quellen:** Links, Videos, Artikel

### Was geht gerade?
Der Filter oben stellt ein, was jetzt da ist (Energie, Zeit, was du innen und außen brauchst). Du siehst dann nur, was damit machbar ist. Einträge ohne Angaben bleiben sichtbar.

### Jeder Eintrag
Er kann angeben, welches Bedürfnis und welche Anspannung er trifft, wie viel Energie er braucht und unter welchen Umständen er funktioniert. Die Umstände, die du einmal einträgst, stehen überall wieder zur Auswahl.

### Und die Brücken?
Eine Ressource ist ein einzelnes Ding, eine Brücke der Weg zu einem Wert. Mehr dazu auf der Brücken-Seite.`,
    bodyEn: `Here you collect what helps you. Anything you put here you can later pick in the steps of a bridge.

### The doors
• **Skills:** learned sequences to regulate tension, plus your skill chains
• **Tools:** things you can touch, aids, anchors, books, apps
• **Places & surroundings:** places where you feel better
• **Activities:** things you can do
• **People:** people from your network
• **Saved sources:** links, videos, articles

### What works right now?
The filter at the top sets what is available now (energy, time, what you need inside and outside). You then only see what is doable with that. Entries without details stay visible.

### Every entry
It can state which need and which tension range it fits, how much energy it takes and under which circumstances it works. Circumstances you enter once are available everywhere.

### And bridges?
A resource is a single thing; a bridge is the path to a value. More on the Bridges page.`,
  },
  skills: {
    title: `Skills`,
    titleEn: `Skills`,
    body: `Skills sind erlernte Abfolgen, mit denen du Anspannung gezielt regulieren kannst.

### So nutzt du sie
• Tippe einen Skill an, um ihn zu lesen.
• „Skill starten“ öffnet die Anleitung mit Uhr. Die Uhr zählt nur mit, es gibt kein Ende, das du erreichen musst.
• Danach schaust du kurz, wo deine Anspannung jetzt ist.

### Skillketten
Eine Skillkette ist ein Fahrplan aus mehreren Skills in einer Reihenfolge, zum Beispiel für den Notfall. Du findest sie oben auf dieser Seite.

### Eigene Skills
Mit „Neuer Skill“ legst du eigene an. Ordne sie einem Bereich zu und gib an, was du dafür brauchst.

### Was geht gerade?
Mit dem Filter siehst du zuerst die Skills, die zu deiner jetzigen Energie und Situation passen.`,
    bodyEn: `Skills are learned sequences with which you can regulate tension deliberately.

### How to use them
• Tap a skill to read it.
• "Start skill" opens the instructions with a clock. The clock simply runs along, there is no end you have to reach.
• Afterwards you briefly check where your tension is now.

### Skill chains
A skill chain is a roadmap of several skills in a sequence, for example for emergencies. You find them at the top of this page.

### Your own skills
With "New skill" you add your own. Assign them to an area and state what you need for them.

### What works right now?
With the filter you see first the skills that fit your current energy and situation.`,
  },
  skillketten: {
    title: `Skillketten`,
    titleEn: `Skill chains`,
    body: `Eine Skillkette ist dein Fahrplan: mehrere Skills in einer Reihenfolge, die dich Schritt für Schritt zurück zur Ruhe führen.

### Aufbau
• Du gibst an, wo du stehst und wohin du willst (auf der Anspannungsskala nach unten).
• Dann fügst du Schritte aus deinen Skills hinzu. Zu jedem Schritt kannst du Hilfsmittel, Helfer und Quellen hängen.

### Starten
„Starten“ führt dich Schritt für Schritt durch. Du kannst jederzeit aufhören.

### Unterschied zur Brücke
Eine Skillkette reguliert den Zustand. Eine Brücke führt zu einem Wert.`,
    bodyEn: `A skill chain is your roadmap: several skills in a sequence that lead you step by step back to calm.

### Structure
• You state where you stand and where you want to go (down the tension scale).
• Then you add steps from your skills. To each step you can attach tools, helpers and sources.

### Starting
"Start" guides you through step by step. You can stop at any time.

### Difference to a bridge
A skill chain regulates the state. A bridge leads to a value.`,
  },
  hilfsmittel: {
    title: `Hilfsmittel`,
    titleEn: `Tools`,
    body: `Hilfsmittel sind Dinge, die man anfassen oder benutzen kann: Werkzeuge, Anker, Stoffe, Geräte, Bücher, Apps.

### Ordnen
Sortiere sie nach Sinnen und Funktion mit den Unterkategorien oben. Eigene Unterkategorien kannst du hinzufügen.

### Angaben
Bei jedem Hilfsmittel kannst du angeben, welches Bedürfnis es trifft, wie viel Energie es braucht und unter welchen Umständen es hilft.

### In Brücken
In den Schritten einer Brücke wählst du aus, welche Hilfsmittel den Schritt tragen, zum Beispiel „Thermoskanne mit Tee“.`,
    bodyEn: `Tools are things you can touch or use: aids, anchors, fabrics, devices, books, apps.

### Sorting
Sort them by senses and function with the sub-categories at the top. You can add your own sub-categories.

### Details
For each tool you can state which need it meets, how much energy it takes and under which circumstances it helps.

### In bridges
In the steps of a bridge you choose which tools carry the step, for example "flask of tea".`,
  },
  orte: {
    title: `Orte & Umgebung`,
    titleEn: `Places & surroundings`,
    body: `Orte, an denen es dir besser geht: ein Platz in der Natur, ein Café, ein Zimmer, ein besonderer Ort.

### Ordnen
Mit den Unterkategorien oben sortierst du sie, zum Beispiel Natur, Platz oder besondere Umgebung.

### Angaben
Du kannst festhalten, wie viel Energie der Weg dorthin braucht und unter welchen Umständen der Ort guttut (zum Beispiel „nicht am Wochenende“).

### In Brücken
In den Schritten einer Brücke hängst du Orte an: „Bank im Park“ trägt zum Beispiel den Schritt „Zehn Minuten draußen sitzen“.`,
    bodyEn: `Places where you feel better: a spot in nature, a café, a room, a special place.

### Sorting
Sort them with the sub-categories at the top, for example nature, square or special surroundings.

### Details
You can note how much energy the way there takes and under which circumstances the place does you good (for example "not on weekends").

### In bridges
In the steps of a bridge you attach places: "bench in the park" can carry the step "sit outside for ten minutes".`,
  },
  aktivitaeten: {
    title: `Aktivitäten & Beschäftigung`,
    titleEn: `Activities`,
    body: `Dinge, die du tun kannst, allein oder mit anderen, klein oder größer: eine Runde gehen, Tee kochen, malen, telefonieren, tanzen.

### Ordnen
Die Unterkategorien oben helfen beim Sortieren. Einige Beispiele sind schon angelegt, du kannst sie ändern oder löschen.

### Angaben
Gib an, wie viel Energie und Zeit eine Aktivität mindestens braucht. So findest du bei wenig Kraft das Passende.

### In Brücken
In den Schritten einer Brücke hängst du Aktivitäten an. Sie sind oft das, was einen Schritt wirklich in Gang bringt.`,
    bodyEn: `Things you can do, alone or with others, small or bigger: take a walk, make tea, paint, phone, dance.

### Sorting
The sub-categories at the top help with sorting. Some examples are already there, you can change or delete them.

### Details
State how much energy and time an activity needs at least. That way you find what fits when you have little strength.

### In bridges
In the steps of a bridge you attach activities. They are often what really gets a step going.`,
  },
  zugangsrad: {
    title: `Zugangsrad`,
    titleEn: `Access Wheel`,
    body: `Ein Rad mit verschiedenen Lebensbereichen. Schätze für jeden ein, wie gut du gerade Zugang dazu hast. Es ist keine Bewertung, sondern ein ehrlicher Schnappschuss.

### Danach
Bei Bereichen mit wenig Zugang kannst du direkt zu Ressourcen, Brücken oder Kontakten springen.`,
    bodyEn: `A wheel of different life areas. For each one, gauge how much access you currently have. It is not a judgment, just an honest snapshot.

### Afterwards
For areas with little access you can jump straight to resources, bridges or contacts.`,
  },
  zugang: {
    title: `Zugang`,
    titleEn: `Access`,
    body: `Ein geführter, tieferer Weg für Momente, in denen der Zugang zu dir selbst gerade schwierig ist. Du gehst Schritt für Schritt, mit dem Wesen an deiner Seite.

### Der Weg
• **Körper:** Du schreibst zuerst selbst auf, was da ist. Auswahlen gibt es erst danach.
• **Zustand und Gefühl:** Wie fühlt sich dein Nervensystem an, was fühlst du?
• **Schutzstrategie und Fürsorge:** Wie stellt dein System gerade Sicherheit her, und was würdest du dir von einem sicheren Menschen wünschen?
• **Bedürfnis, Hindernis, Wert:** Was brauchst du, was steht im Weg, was ist dir wichtig?
• **Abzweigung:** Jetzt entscheidest du: Du regulierst dich erst (Skills, Skillketten), um dir das Bedürfnis erfüllen zu können – oder der Zustand passt und du kümmerst dich gleich um Bedürfnis, Wert und Handeln.
• **Was geht gerade?** Energie, Zeit, Zugangskanäle, Einsatz – nur, was du sagen magst.
• **Passendes:** Du siehst Ressourcen und Brücken, die dazu passen. Entweder direkt zu den Ressourcen, oder eine Brücke nutzen, wenn du mehr Anleitung brauchst.
• **Danach:** Dein Durchgang wird zuerst gespeichert. Erst wenn du die Ressourcen oder die Brücke genutzt hast, fragt die App – freiwillig –, wie es danach war. „Hat gerade nicht gepasst“ ist eine vollwertige Antwort.

### Freiheit
„Ich weiß nicht“ ist an jeder Stelle eine vollwertige Antwort. „Das hilft gerade nicht“ geht immer. Du kannst aussteigen, ohne dass etwas verloren geht, und später weitermachen.`,
    bodyEn: `A deeper, guided path for moments when access to yourself feels difficult. You go step by step, with the companion at your side.

### The path
• **Body:** You first write down yourself what is there. Options only come afterwards.
• **State and feeling:** How does your nervous system feel, what do you feel?
• **Safety strategy and care:** How is your system creating safety right now, and what would you wish from someone you feel safe with?
• **Need, obstacle, value:** What do you need, what is in the way, what matters to you?
• **Fork:** Now you decide: regulate first (skills, skill chains) so you can meet the need – or the state fits and you take care of need, value and action right away.
• **What is possible now?** Energy, time, access channels, effort – only what you want to say.
• **What fits:** You see resources and bridges that match. Either straight to the resources, or use a bridge if you need more guidance.
• **Afterwards:** Your pass is saved first. Only once you have used the resources or the bridge does the app ask – optionally – how it was afterwards. "Did not fit right now" is a full answer.

### Freedom
"I don't know" is a valid answer at every step. "That does not help right now" is always possible. You can leave without losing anything and continue later.`,
  },
  zugangRueckblick: {
    title: `Zugang: Rückblick`,
    titleEn: `Access: Review`,
    body: `Deine bisherigen Zugang-Durchgänge als persönliche Sammlung: was bei dir passiert, was hilft, welche Brücken funktionieren.

Es ist kein technisches Protokoll, sondern etwas, das mit der Zeit wächst. Tippe einen Durchgang an: Du siehst jeden Schritt, alles, was du aufgeschrieben und angetippt hast, was du genutzt hast und – wenn du es ergänzt hast – wie es danach war. Fehlt das „Danach“ noch, kannst du es dort nachtragen.`,
    bodyEn: `Your past Access passes as a personal collection: what happens for you, what helps, which bridges work.

It is not a technical log but something that grows over time. You can view and delete entries.`,
  },
  beduerfnisKompass: {
    title: `Bedürfnis-Kompass`,
    titleEn: `Needs Compass`,
    body: `Eine Übersicht über grundlegende menschliche Bedürfnisse. Manchmal hilft es schon, ein Bedürfnis beim Namen zu kennen, um zu verstehen, was gerade fehlt.

### Weiter
Von einem Bedürfnis aus kommst du zu den Ressourcen, die dazu passen.`,
    bodyEn: `An overview of basic human needs. Sometimes just knowing a need by name helps to understand what is missing.

### Going on
From a need you get to the resources that fit it.`,
  },
  tageskurve: {
    title: `Tageskurve`,
    titleEn: `Daily Curve`,
    body: `Halte fest, wie sich dein Nervensystem über den Tag anfühlt: verbunden, aktiviert oder reduziert.

Es ist ein optionales Werkzeug, um eigene Muster über die Zeit zu erkennen. Du trägst nur ein, wenn du magst.`,
    bodyEn: `Keep track of how your nervous system feels over the day: connected, activated or reduced.

It is an optional tool for recognizing your own patterns over time. You only enter something if you like.`,
  },
  meineEntwicklung: {
    title: `Meine Entwicklung`,
    titleEn: `My Development`,
    body: `Ein längerer Blick auf deine Tageskurve über Wochen und Monate.

Es geht nicht darum, „besser“ zu werden, sondern eigene Muster und Zusammenhänge sichtbarer zu machen.

Unter der Kurve findest du „Verlauf & Auffälligkeiten“ für 7, 30 oder 90 Tage: ruhigster und anstrengendster Tag, schwierige Momente und was du am meisten genutzt hast.`,
    bodyEn: `A longer view of your daily curve over weeks and months.

It is not about getting "better" but about making your own patterns and connections more visible.

Below the curve you find "Trend & highlights" for 7, 30 or 90 days: calmest and most strenuous day, difficult moments and what you used most.`,
  },
  lesezeichen: {
    title: `Gespeicherte Quellen`,
    titleEn: `Saved sources`,
    body: `Hier speicherst du Links, Videos, Artikel und andere externe Inhalte, die dir guttun oder guttun könnten. So gehen sie nicht in Browser-Tabs verloren.

### Ordnen
Lege eigene Kategorien an und sortiere hinein. Quellen kannst du in den Schritten einer Brücke oder Skillkette anhängen.

### Teilen
Du kannst Quellen als Link teilen oder von anderen importieren.`,
    bodyEn: `Here you save links, videos, articles and other external content that does or might do you good. That way they do not get lost in browser tabs.

### Sorting
Create your own categories and sort into them. You can attach sources in the steps of a bridge or skill chain.

### Sharing
You can share sources as a link or import from others.`,
  },
  wochenrueckblick: {
    title: `Wochen- und Monatsrückblick`,
    titleEn: `Weekly and monthly review`,
    body: `Ein ruhiger Blick zurück auf die letzten 7 oder 30 Tage. Mit „Woche“ und „Monat“ wechselst du.

### Was drin ist
Alles, was du ohnehin festgehalten hast: Check-ins, genutzte Ressourcen und Brücken, Zugang-Durchgänge, Medikamente, Garten und deine Tagebucheinträge.

### Verlauf & Auffälligkeiten
In einem Kasten wird für 7, 30 oder 90 Tage von selbst berechnet: dein Verlauf, der ruhigste und der anstrengendste Tag, deine schwierigen Momente (und ob du danach wieder zurückgekommen bist) und was du am häufigsten genutzt hast – Skills, Hilfsmittel, Routinen. Das ist nur eine Spiegelung, keine Bewertung.

### Getrennt vom Tagebuch
Der Rückblick sammelt von selbst, schreibt aber nichts ins Tagebuch. Das Tagebuch bleibt nur das, was du dort selbst einträgst.

### PDF
Mit dem Symbol oben rechts exportierst du den Rückblick, zum Beispiel für ein Gespräch mit deiner Therapeutin. Es ist kein Leistungsnachweis.`,
    bodyEn: `A calm look back at the last 7 or 30 days. Switch with "Week" and "Month".

### What is in it
Everything you captured anyway: check-ins, resources and bridges used, Access passes, medication, garden and your diary entries.

### Trend & highlights
One box calculates by itself for 7, 30 or 90 days: your trend, the calmest and most strenuous day, your difficult moments (and whether you came back afterwards) and what you used most – skills, tools, routines. It is only a mirror, not a judgement.

### Separate from the diary
The review collects by itself but writes nothing into the diary. The diary stays only what you enter there yourself.

### PDF
With the icon at the top right you export the review, for example for a conversation with your therapist. It is not a performance report.`,
  },
  timer: {
    title: `Timer & Stoppuhr`,
    titleEn: `Timer & Stopwatch`,
    body: `Ein einfacher Timer, den du für Brücken, Ressourcen oder einfach für dich nutzen kannst, um dir bewusst eine bestimmte Zeit für etwas zu geben.

Die Stoppuhr zählt nur mit. Es gibt kein Ende, das du erreichen musst.`,
    bodyEn: `A simple timer for bridges, resources or just for yourself, to consciously give yourself a set time for something.

The stopwatch simply counts along. There is no end you have to reach.`,
  },
  mindmap: {
    title: `Mindmaps`,
    titleEn: `Mind maps`,
    body: `Eine freie Fläche für deine Gedanken: Du baust Karten aus Knoten, Notizzetteln und Rahmen (Cluster) und verbindest sie so, wie es für dich Sinn ergibt. Das hat mit dem Sicherheitsnetzwerk nichts zu tun – es ist einfach dein Platz zum Sortieren, Planen und Träumen.

### So geht es
- **Knoten** hinzufügen (oder doppelt auf die Fläche tippen). Antippen wählt aus, ziehen verschiebt.
- Am ausgewählten Knoten ist ein **+**: antippen = Unterknoten, ziehen zu einem anderen Knoten = Verbindung, ziehen ins Leere = neuer Knoten daran.
- **Stil**: Form (Rechteck, Oval, Wolke …), Farbe, Symbol, Größe.
- **Linien** antippen: Farbe, Stil (durchgezogen, gestrichelt, gepunktet), Stärke, Pfeil, Beschriftung – und am Punkt in der Mitte biegen.
- **Rahmen** fassen Dinge zu einem Cluster zusammen; zieht man den Rahmen, wandert der Inhalt mit.
- **Einfügen**: eigene Fotos (aus Galerie oder Kamera), Sticker (große Symbole) und kopierte Texte. Du kannst auch einfach Text oder ein Bild in die Fläche einfügen. Fotos bleiben in der Mindmap auf deinem Gerät; im Link sind sie weggelassen, „Als Datei teilen“ nimmt sie mit.
- Mit zwei Fingern oder den Knöpfen zoomen, auf der Fläche ziehen zum Verschieben – so weit du magst.

### Doodles, Stift und Bewegung
- **Doodles** (unten): Kreise (auch gestrichelt), Pfeile, Sprechblasen, Sterne, Haken, Wellen und mehr – frei auf der Fläche, ohne Feld.
- **Stift**: selbst schreiben und zeichnen – Stift, Bleistift oder Textmarker, viele Farben, Dicke einstellbar, Radierer (ein Stück oder den ganzen Strich).
- **Text** ohne Feld, **Fotos** ohne Rahmen und **Symbole** liegen einfach frei. Schriftart, Fett/Kursiv und verschiedene Rahmen wählst du im Stil.
- **Größe & Drehen**: Griffe an der Auswahl ziehen, oder im Stil fein einstellen. Schriftgröße und Linienstärke gibt es als Regler.
- **Ebenen**: im Stil unter „Anordnen“ nach vorn oder hinten – so entscheidest du, was oben liegt.
- **Bewegung**: im Stil unter „Bewegung“ – drehen, schwingen, pulsieren, hüpfen, schweben u. a. Mehrere Dinge können sich einzeln oder als Gruppe bewegen. Mit „Bewegung anhalten“ im Menü steht alles still; wer weniger Bewegung eingestellt hat, sieht sie gar nicht.
- **Mehrere auswählen**: Knopf „Mehrere“, dann Rahmen aufziehen oder antippen. Dann kopieren, ausschneiden, duplizieren, gruppieren, löschen oder „In neue Mindmap“.
- **Hintergründe**: viele Muster und Farben, auch eigene Farbe.
- **Mindmaps ordnen**: In der Liste verschieben (Ordner), archivieren und zurückholen. Eine Mindmap kann **Unter-Mindmap** einer anderen sein; als Karte in einer Mindmap zeigt sie eine kleine Vorschau – so baust du verbundene, aber getrennte Systeme.

### Teilen und drucken
Über die drei Punkte kannst du die Mindmap als PDF drucken (alles ist drauf – bei großen Karten mit Detailseiten) oder per Link mit Freund:innen teilen. Der Link enthält die ganze Mindmap; die andere Person fügt ihn unter „Etwas von jemandem erhalten“ ein und bekommt eine eigene Kopie.

### Momentaufnahme und eigenes Foto
Im Vollbild speichert das Foto-Symbol ein Bild der Mindmap. Das PDF enthält dieses Bild und zusätzlich die Liste aller Elemente. Als Hintergrund kannst du ein eigenes Foto nehmen; es bleibt auf diesem Gerät.`,
    bodyEn: `A free canvas for your thoughts: you build maps from nodes, sticky notes and frames (clusters) and connect them the way that makes sense to you. This has nothing to do with the safety net – it is simply your place to sort, plan and dream.

### How it works
- Add a **node** (or double-tap the canvas). Tapping selects, dragging moves.
- A selected node has a **+**: tap = sub-node, drag to another node = connection, drag into empty space = new node attached.
- **Style**: shape (rectangle, oval, cloud …), colour, symbol, size.
- Tap **lines**: colour, style (solid, dashed, dotted), weight, arrow, label – and bend them with the dot in the middle.
- **Frames** gather things into a cluster; when you drag the frame, its contents move along.
- **Insert**: your own photos (gallery or camera), stickers (big symbols) and copied text. You can also simply paste text or a picture onto the canvas. Photos stay in the mind map on your device; the link leaves them out, “Share as file” includes them.
- Zoom with two fingers or the buttons, drag the canvas to move – as far as you like.

### Doodles, pen and motion
- **Doodles** (bottom): circles (also dashed), arrows, speech bubbles, stars, ticks, waves and more – free on the canvas, no box needed.
- **Pen**: write and draw yourself – pen, pencil or highlighter, many colours, adjustable thickness, eraser (a piece or the whole stroke).
- **Text** without a box, **photos** without a frame and **symbols** simply lie free. Font, bold/italic and different borders are in Style.
- **Size & rotate**: drag the handles on the selection, or fine-tune in Style. Font size and line weight have sliders.
- **Layers**: in Style under “Arrange” bring forward or send back – you decide what is on top.
- **Motion**: in Style under “Motion” – spin, swing, pulse, bounce, float and more. Several things can move individually or as a group. “Pause motion” in the menu stops everything; if you chose less motion you will not see it at all.
- **Select several**: “Several” button, then drag a frame or tap. Then copy, cut, duplicate, group, delete or “Into new mind map”.
- **Backgrounds**: many patterns and colours, also your own colour.
- **Organise mind maps**: move in the list (folders), archive and restore. A mind map can be a **sub mind map** of another; as a card inside a mind map it shows a small preview – this way you build connected yet separate systems.

### Share and print
Via the three dots you can print the mind map as a PDF (everything is on it – big maps get detail pages) or share it with friends by link. The link contains the whole mind map; the other person pastes it under "Received something from someone" and gets a copy of their own.

### Snapshot and own photo
In full screen the photo icon saves a picture of the mind map. The PDF contains this picture plus the list of all elements. You can use your own photo as background; it stays on this device.`,
  },
  atmen: {
    title: `Atmen`,
    titleEn: `Breathing`,
    body: `Hier führt dich ein Bild durch den Atem: ein Kreis, der wächst und schrumpft (das Wesen atmet darin mit), eine Welle, der du mit dem Punkt folgst, oder ein Quadrat für gleich lange Teile.

### Alles ist ein Angebot
Du kannst die Augen offen lassen, jederzeit mit dem ✕ aufhören, pausieren und die Halte-Pausen weglassen. Wenn Atmen sich gerade unangenehm anfühlt, ist das ein ernstzunehmendes Signal – dann hilft vielleicht etwas anderes (Bewegung, Umschauen, ein anderer Skill).

### Fühlen
Mit „Mitvibrieren“ gibt es kleine Impulse: schneller beim Einatmen, langsamer beim Ausatmen. Das klappt auf Android-Handys. Auf dem iPhone erlaubt der Browser keine Vibration – dort helfen Bild und der sanfte Ton.

### Was ist belegt?
Jede Übung zeigt ehrlich, wie gut sie untersucht ist. Am besten belegt: Seufzer-Atmen und etwa sechs Atemzüge pro Minute. Box-Atmen und 4-7-8 sind weniger belegt – wahrscheinlich zählt vor allem das langsame Tempo und das lange Ausatmen.

Nach dem Üben wird es als Skill im Rückblick vermerkt.`,
    bodyEn: `Here a picture guides you through the breath: a circle that grows and shrinks (the Wesen breathes inside it), a wave you follow with the dot, or a square for equal parts.

### Everything is an offer
You can keep your eyes open, stop any time with the ✕, pause and leave out the holds. If breathing feels unpleasant right now, take that seriously – maybe something else helps (movement, looking around, another skill).

### Feeling it
With "Vibrate along" there are small pulses: faster while breathing in, slower while breathing out. This works on Android phones. On iPhone the browser allows no vibration – picture and the soft tone help there.

### What is supported?
Each exercise honestly shows how well it is studied. Best supported: sigh breathing and about six breaths per minute. Box breathing and 4-7-8 are less supported – probably the slow pace and long exhale matter most.

After practising it is noted as a skill in the review.`,
  },
  garten: {
    title: `Routinen & mein Garten`,
    titleEn: `Routines & my garden`,
    body: `Routinen strukturieren den Alltag, sparen Mühe und Zeit und automatisieren das Handeln.

### Oben: Routinen
Eine Routine ist eine Reihe kleiner Karten, jede mit genau einem Schritt. Beim Starten siehst du immer nur eine Karte, ganz groß. Ist der Schritt getan, wischst du sie nach rechts – die nächste erscheint. Auf Wunsch hat eine Karte einen Timer, einen Garten, der automatisch abgehakt wird, oder eine Ressource. Alles ist freiwillig. „Gerade nicht“ ist immer möglich.

**Energie-Ampel:** Pro Karte stellst du ein, ob sie auch an einem schweren Tag dazugehört (rot), ab mittlerer Energie (gelb) oder nur bei voller Energie (grün). Vor dem Start fragt die Routine dann: „Schwerer Tag: nur die Kleinsten“, „Mittel“ oder „Alle Schritte“. So hast du dieselbe Routine in mehreren Größen. **Alltags-Vorlagen** (Morgen, Abend, Duschen, Essen, Schlaf, kleiner Spaziergang, Wohnung „5 Minuten“) gibt es nur auf Wunsch, als Beispiele markiert – du kannst sie ändern oder löschen.

Am Ende siehst du, wie lange es gedauert hat – nur zum Anschauen und Vergleichen. Der Verlauf steht auch im Rückblick.

### Unten: Garten
Ein Bild für Dinge, die du aufbauen oder verändern möchtest. Jeder Eintrag wächst mit der Zeit, ohne Leistungsdruck. Du kannst eine Alternative zu einer alten Schutzstrategie eintragen und eine Belohnung nach einer Anzahl Tage festlegen.

### „Alternative für …“ und neue Schutzstrategien
„Alternative für“ heißt: Das hier ist etwas, das du statt einer alten Schutzstrategie tun kannst (z. B. statt Rückzug eine kurze Nachricht). Du kannst auch ankreuzen, dass der Eintrag selbst eine **neue Schutzstrategie** ist, und ein **Hindernis** dazuwählen, bei dem er hilft. Das ist alles **ein einziger Eintrag**: Dieselbe neue Schutzstrategie steht auf der Schutzstrategien-Seite, kann einen Garten haben und eine Routine sein – nichts wird doppelt angelegt. Über die Links kommst du direkt zu den Schutzstrategien und Hindernissen.

Eine Routine kannst du beim Abspielen jederzeit einfach abbrechen („Einfach abbrechen – nichts speichern“).`,
    bodyEn: `Routines give the day structure, save effort and time and automate doing.

### On top: routines
A routine is a series of small cards, each with exactly one step. When you start it you only see one card, large. When the step is done you swipe it to the right – the next one appears. A card can optionally have a timer, a garden that is ticked automatically, or a resource. All of it is voluntary. "Not right now" is always possible.

**Energy traffic light:** per card you set whether it belongs even on a hard day (red), from medium energy (yellow) or only with full energy (green). Before the start the routine asks: "Hard day: only the smallest", "Medium" or "All steps". So you have the same routine in several sizes. **Everyday templates** (morning, evening, showering, eating, sleep, small walk, home "5 minutes") only come on request, marked as examples – you can change or delete them.

At the end you see how long it took – just to look at and compare. The history is also in the review.

### Below: garden
A picture for things you would like to build or change. Each entry grows over time, without pressure. You can enter an alternative to an old protection strategy and set a reward after a number of days.

### "Alternative for …" and new protection strategies
"Alternative for" means: this is something you can do instead of an old protection strategy (e.g. a short message instead of withdrawing). You can also tick that the entry is itself a **new protection strategy** and pick an **obstacle** it helps with. This is **one single entry**: the same new strategy is listed on the protection strategies page, can have a garden and can be a routine – nothing is created twice. The links take you straight to the protection strategies and obstacles.

You can cancel a routine at any time while it plays ("Just cancel – save nothing").`,
  },
  mediLog: {
    title: `Medi-Log`,
    titleEn: `Medi-Log`,
    body: `Hier hältst du Medikamente fest, sowohl regelmäßig eingenommene als auch Bedarfsmedikation.

### Was du siehst
Einen Verlauf und den Vergleich über die Zeit. Auch Packungen kannst du anlegen.

Alles ist optional und bleibt auf deinem Gerät. Die App gibt keine Dosierungsempfehlungen.`,
    bodyEn: `Here you keep track of medication, both regular and as-needed.

### What you see
A history and a comparison over time. You can also add packages.

Everything is optional and stays on your device. The app gives no dosage recommendations.`,
  },
  bruecken: {
    title: `Brücken`,
    titleEn: `Bridges`,
    body: `Eine Brücke führt dich in kleinen Schritten zu einem Wert, der dir wichtig ist, zum Beispiel Natur, Freundschaft oder Kreativität.

### So baust du eine
• **Wert wählen:** Wohin soll die Brücke führen?
• **Schritte bauen:** Der erste ist so klein, dass er auch an einem schweren Tag geht. Jeder weitere ist ein Stück größer.
• **Schritte tragen lassen:** An jeden Schritt hängst du, was dir hilft: Ort, Aktivität, Person, Hilfsmittel oder Skill. Es sind immer Dinge aus deinen Ressourcen.

Beim Erstellen findest du ganz oben ein genaues Beispiel, das du als Vorlage übernehmen kannst.

### Brücken entdecken
Zeigt dir fertige Brücken. Du kannst sie übernehmen und beliebig ändern.

### Benutzen
In einer Brücke wählst du den Schritt, der gerade passt. Du darfst auf jeder Stufe stehen bleiben. Mit dem Symbol oben exportierst du alle als PDF.`,
    bodyEn: `A bridge leads you in small steps to a value that matters to you, for example nature, friendship or creativity.

### How to build one
• **Choose a value:** Where should the bridge lead?
• **Build steps:** The first is so small that it works on a hard day. Each further one is a little bigger.
• **Let the steps be carried:** To each step you attach what helps: place, activity, person, tool or skill. They are always things from your resources.

When creating, you find an exact example at the very top that you can use as a template.

### Discover bridges
Shows you ready-made bridges. You can adopt them and change them however you like.

### Using one
In a bridge you choose the step that fits right now. You may stop on any step. With the icon at the top you export all as PDF.`,
  },
  bridgeDetail: {
    title: `Brücke`,
    titleEn: `Bridge`,
    body: `Hier siehst du eine Brücke mit ihren Schritten.

### Benutzen
• Wähle den Schritt, der sich gerade richtig anfühlt. Du kannst auch mehrere antippen.
• Unter jedem Schritt siehst du, was ihn trägt: Ort, Aktivität, Person, Hilfsmittel, Skill.
• Optional startest du einen Timer und legst das Handy weg.

### Danach
Du kannst die Brücke mit Datum und Uhrzeit ins Tagebuch übernehmen, aber nur, wenn du das willst.

### Weiteres
Oben bearbeitest du die Brücke (Stift). Unten exportierst du sie als PDF oder teilst sie als Link. „Warum fällt mir das gerade schwer?“ führt dich in den Zugang.`,
    bodyEn: `Here you see a bridge with its steps.

### Using it
• Choose the step that feels right now. You can also tap several.
• Under each step you see what carries it: place, activity, person, tool, skill.
• Optionally start a timer and put your phone away.

### Afterwards
You can put the bridge with date and time into the diary, but only if you want to.

### More
At the top you edit the bridge (pencil). At the bottom you export it as PDF or share it as a link. "Why is this hard right now?" leads you into Access.`,
  },
  sicherheit: {
    title: `Sicherheit`,
    titleEn: `Safety`,
    body: `Der Bereich für alles, was dir Sicherheit gibt.

• **Ressourcen:** was dir hilft
• **Netzwerk:** Menschen und Aktivitäten, auf die du zurückgreifen kannst
• **Sicherheitsplan:** dein Plan für schwere Momente
• **Tagebuch:** dein eigener Ort zum Festhalten`,
    bodyEn: `The area for everything that gives you safety.

• **Resources:** what helps you
• **Network:** people and activities you can draw on
• **Safety plan:** your plan for hard moments
• **Diary:** your own place to write things down`,
  },
  sicherheitsnetz: {
    title: `Netzwerk`,
    titleEn: `Network`,
    body: `Eine Übersicht der Menschen, Aktivitäten und Ressourcen, auf die du zurückgreifen kannst.

### Aufbau
Du ordnest Personen, Aktivitäten und Ressourcen frei auf der Fläche an. In der Mitte steht, was du dort festlegst (zum Beispiel „Ich“). Du kannst Einträge miteinander verbinden. Personen legst du hier an, Favoriten unter Ressourcen erscheinen automatisch mit.

### Personen
Zu jeder Person kannst du notieren, wobei sie dir helfen kann. Diese Personen kannst du in den Schritten einer Brücke und im Sicherheitsplan auswählen.

### Momentaufnahme
Im Vollbild speichert das Foto-Symbol ein Bild deines Netzes, das du direkt aufs Handy legen kannst. Auch das PDF enthält das Bild des Netzes. „Verbindung hinzufügen“ beendet das Vollbild nicht mehr.`,
    bodyEn: `An overview of the people, activities and resources you can draw on.

### Structure
You arrange people, activities and resources freely on the canvas. The middle shows what you set there (for example "Me"). You can connect entries with each other. You add people here; favourites under resources show up automatically.

### People
For each person you can note what they can help you with. You can pick these people in the steps of a bridge and in the safety plan.

### Snapshot
In full screen the photo icon saves a picture of your net that you can put straight on your phone. The PDF also contains the picture of the net. “Add connection” no longer leaves full screen.`,
  },
  kontakte: {
    title: `Kontakte`,
    titleEn: `Contacts`,
    body: `Eine Liste der Menschen in deinem Netzwerk, mit einer kurzen Notiz, wobei sie dir jeweils helfen können.`,
    bodyEn: `A list of the people in your network, with a short note on what each one can help you with.`,
  },
  sicherheitsplan: {
    title: `Sicherheitsplan`,
    titleEn: `Safety Plan`,
    body: `Dein persönlicher Plan für schwere Momente: Warnsignale in drei Stufen und was dann hilft.

### Wenn …, dann …
Bei jedem Warnsignal kannst du einen Skill oder ein Hilfsmittel verknüpfen. Landest du später in dieser Stufe, steht dein Plan als Erstes im Fahrplan.

### Körperzeichen
Auch das Körperdetektiv kann ein Körperzeichen hier aufnehmen.

### Hilfe holen
Hier übernimmst du, was dir bei einer Person aus deinem Netzwerk hilft.

### Beispiele
Die mit „Beispiel“ markierten Einträge sind nur Anregungen. Du kannst sie übernehmen, umschreiben oder löschen. Sie kommen nie ins PDF.

### Meine Angaben und Klinikaufenthalt
Ganz oben kannst du freiwillig Angaben für den Notfall eintragen (Name, Medikamente, Notfallkontakte, Krankenkasse …) und deine Wünsche für Behandlung und Unterbringung. Beides ist ein eigener Teil und bleibt auf deinem Gerät.

### Teilen & PDF
Pro Plan wählst du, was mitkommt: der Plan, deine Angaben, der Klinik-Teil – einzeln oder zusammen. Auf dem Handy öffnet sich das Teilen-Menü, am Computer wird die Datei heruntergeladen.`,
    bodyEn: `Your personal plan for hard moments: warning signs in three tiers and what helps then.

### If …, then …
For each warning sign you can link a skill or tool. If you land in that tier later, your plan comes first in the roadmap.

### Body signs
The body detective can also add a body sign here.

### Get help
Here you take over what helps you from a person in your network.

### Examples
Entries marked “Example” are only suggestions. You can keep, rewrite or delete them. They never go into the PDF.

### My details and hospital stay
At the top you can optionally enter details for emergencies (name, medication, emergency contacts, insurance …) and your wishes for treatment and placement. Both are separate parts and stay on your device.

### Share & PDF
Per plan you choose what goes along: the plan, your details, the hospital part – alone or together. On a phone the share menu opens, on a computer the file is downloaded.`,
  },
  tagebuch: {
    title: `Tagebuch`,
    titleEn: `Diary`,
    body: `Ein Ort für alles, was du festhalten möchtest, frei oder nach Kategorien.

### Einträge
Du schreibst selbst. Vorlagen helfen dir: vorausschauend (zum Beispiel Tagesplan, DBT-Tageskarte) oder rückblickend (zum Beispiel Schematagebuch, Verhaltensanalyse). Schrift und Farbe kannst du je Kategorie gestalten.

### Tagesrückblick
Über den zweiten Reiter siehst du, was am Tag passiert ist: Check-ins, Skills, Termine. Das ist getrennt von deinen Einträgen.

### Schreibt die App etwas hinein?
Nein. Nur wenn du selbst etwas ins Tagebuch übernimmst, zum Beispiel nach einer Brücke oder ein Erfolgserlebnis.

### Briefe an mich
Der Link darunter führt zu Briefen an dein zukünftiges Ich.`,
    bodyEn: `A place for anything you want to write down, freely or by category.

### Entries
You write yourself. Templates help: forward-looking (for example day plan, DBT daily card) or looking back (for example schema diary, behaviour analysis). You can shape font and colour per category.

### Daily review
The second tab shows what happened during the day: check-ins, skills, appointments. This is separate from your entries.

### Does the app write anything in?
No. Only when you yourself put something into the diary, for example after a bridge or an achievement.

### Letters to myself
The link below leads to letters to your future self.`,
  },
  einstellungen: {
    title: `Einstellungen`,
    titleEn: `Settings`,
    body: `Hier passt du die App an dich an.

• **So fängst du an:** die kurze Einstiegs-Erklärung, jederzeit wieder aufrufbar (oben)
• **Sprache und Darstellung:** Schrift, Farben, Welten, weniger Bewegung
• **Wesen:** ein- oder ausschalten, was es sagt und zeigt
• **Erinnerungen:** sanfte Hinweise und Termine
• **Über die App:** die Idee dahinter
• **Umfang und Schutz:** wie viel du siehst (Nötigstes / Sicherheitsplan / Alles), Einfach-Darstellung, App-Sperre mit PIN, „Schnell weg“-Knopf
• **Meine Daten:** Export und Import als Datei, Sicherungs-Erinnerung (abschaltbar)
• **Gefahrenzone:** alles zurücksetzen oder löschen

Alles bleibt auf deinem Gerät. Du kannst das Wesen und einzelne Funktionen ganz abschalten.

### Sicherung
Die Sicherungsdatei enthält alle deine Einträge und Einstellungen sowie deine eigenen Fotos, Videos und Töne (zusammen bis etwa 60 MB). Beim Einspielen wird der Stand der Datei genau wiederhergestellt; reicht der Speicher nicht, bleibt alles wie vorher. Die App-Sperre (PIN und Sicherheitsfrage) steckt bewusst nicht in der Datei.

### PIN vergessen
Mit einer Sicherheitsfrage (zehn zur Auswahl) kommst du wieder hinein und legst eine neue PIN fest. Frühere PINs mit Änderungsdatum stehen in den Einstellungen und sind nur mit der aktuellen PIN lesbar.

### Begleiter
Du kannst das Wesen wegschicken und per Knopf auf der Startseite wieder herbeirufen, alle Nachrichten ausschalten (es spricht dann nur, wenn du es antippst) und archivierte Inhalte anzeigen.

### Begleittiere
Statt eines Lichtwesens kann dich ein Tier begleiten – von Wolf bis Drache, Corgi, Papagei oder Piepmatz, jeweils in drei natürlichen Farbvarianten. Tippe ein Tier unter „Begleittiere“ an und richte es ein: Name, Farbe, kleines Extra zum Tragen (allgemeine wie Schleife, Halstuch, Krone, Blume, Brille, Mütze – und eigene je Tierart, z. B. Halsband beim Hund oder Doktorhut bei der Eule; bei Hunden ein Geschirr), etwas zum Halten oder Dabeihaben (z. B. Knochen, Buch – der Otter hält Muschel, Stein, Fisch, Seestern oder Perle, die Krähe Münze, Diamant, Schlüssel, Ring oder Perle) und wie es spricht. Das Tier zieht als Baby ein und wächst mit den Tagen, an denen du in der App irgendetwas machst – nach 30 solcher Tage ist es ausgewachsen. Das ist keine Serie: Pausen sind in Ordnung, es schrumpft nie, und du kannst es auch gleich erwachsen oder immer Baby lassen. Beim Wegschicken und Herbeirufen läuft es auf seine Art (der Hund galoppiert, die Gans watschelt, der Papagei fliegt).`,
    bodyEn: `Here you adapt the app to you.

• **Language and appearance:** font, colours, reduced motion
• **Companion:** switch on or off what it says and shows
• **Reminders:** gentle hints and appointments
• **About the app:** the idea behind it
• **Scope and protection:** how much you see (essentials / safety plan / everything), simple view, app lock with PIN, “Hide now” button
• **My data:** export and import as a file, backup reminder (can be switched off)
• **Danger zone:** reset or delete everything

Everything stays on your device. You can switch off the companion and individual features entirely.

### Backup
The backup file contains all your entries and settings plus your own photos, videos and sounds (up to about 60 MB in total). Restoring brings back exactly the state of the file; if storage is too small, everything stays as before. The app lock (PIN and security question) is deliberately not in the file.

### Forgot the PIN
With a security question (ten to choose from) you get back in and set a new PIN. Earlier PINs with their change date are listed in the settings and readable only with the current PIN.

### Companion
You can send the companion away and call it back with a button on the start page, switch all messages off (it then only speaks when you tap it) and show archived contents.

### Animal companions
Instead of a light being, an animal can accompany you – from wolf to dragon, corgi, parrot or little songbird, each in three natural colourings. Tap an animal under "Begleittiere" and set it up: name, colour, a little extra to wear (general ones like bow, scarf, crown, flower, glasses, cap – and ones just for your species, e.g. a collar for the dog or a graduation cap for the owl; a harness for dogs), something to hold or have with it (e.g. a bone, a book – the otter holds a shell, stone, fish, starfish or pearl, the crow a coin, diamond, key, ring or pearl) and how it talks. The animal moves in as a baby and grows with the days you do anything in the app – after 30 such days it is fully grown. That is not a streak: pauses are fine, it never shrinks, and you can also keep it grown or a baby. When sent away or called back it moves its own way (the dog gallops, the goose waddles, the parrot flies).`,
  },
  wesenInhalte: {
    title: `Wesen/Begleiter-Inhalte`,
    titleEn: `Being/companion content`,
    body: `Hier verwaltest du, was dein Wesen oder dein Begleiter sagen und zeigen kann: Mitteilungen, Tipps, Ablenkungsinhalte und die Orientierungsübung.

Wesen und Begleiter sind dasselbe und machen genau dasselbe – wer lieber Tiere mag, wählt in den Einstellungen ein Tier. Tiere sind ganz ohne Geräusche. Alles lässt sich ganz ausschalten: die Nachrichten hier, den Begleiter selbst unter „Begleiter anzeigen“ in den Einstellungen.

Du kannst einzelne Inhalte abschalten und eigene hinzufügen.`,
    bodyEn: `Here you manage what your being or companion can say and show: messages, tips, distraction content and the grounding exercise.

Being and companion are the same thing and do exactly the same – if you prefer animals, pick an animal in the settings. Animals are completely silent. Everything can be switched off: the messages here, the companion itself under "Show companion" in the settings.

You can switch off individual items and add your own.`,
  },
  favoriten: {
    title: `Favoriten`,
    titleEn: `Favorites`,
    body: `Alles, was du in der App favorisiert hast, an einem Ort, für schnellen Zugriff auf das, was dir am wichtigsten ist.`,
    bodyEn: `Everything you have favourited in the app, in one place, for quick access to what matters most.`,
  },
  wesenAblenkung: {
    title: `Ablenkung verwalten`,
    titleEn: `Manage distraction`,
    body: `Lege fest, welche Arten von Ablenkung dir das Wesen anbietet. Du kannst eigene Kategorien und Inhalte hinzufügen.`,
    bodyEn: `Decide what kinds of distraction the companion offers you. You can add your own categories and content.`,
  },
  wesenOrientierung: {
    title: `Orientierung verwalten`,
    titleEn: `Manage grounding`,
    body: `Hier passt du deine Orientierungsübungen und die Reihenfolge ihrer Schritte an.`,
    bodyEn: `Here you adjust your grounding exercises and the order of their steps.`,
  },
  wesenMitteilungen: {
    title: `Tipps & Mitteilungen verwalten`,
    titleEn: `Manage tips & messages`,
    body: `Lege fest, welche Nachrichten das Wesen wann und wo anzeigen darf.`,
    bodyEn: `Decide which messages the companion may show, when and where.`,
  },
  nervensystem: {
    title: `Nervensystem`,
    titleEn: `Nervous system`,
    body: `Die sieben Zustände, die auch im Zugang vorkommen, zum Nachschlagen, ohne einen ganzen Durchgang zu starten.`,
    bodyEn: `The seven states that also appear in Access, to look up without starting a whole pass.`,
  },
  koerperwahrnehmung: {
    title: `Körperwahrnehmung`,
    titleEn: `Body awareness`,
    body: `Mögliche Körperempfindungen zum Nachschlagen. Es ist dieselbe Liste wie im Zugang.`,
    bodyEn: `Possible body sensations to look up. It is the same list as in Access.`,
  },
  schutzstrategien: {
    title: `Schutzstrategien`,
    titleEn: `Protection strategies`,
    body: `Wie dein System versuchen kann, dich zu schützen, und warum das nicht immer gleich hilfreich bleibt. Sie sind keine Fehler, sondern frühere Lösungen.

Alte Schutzstrategien, neue Schutzstrategien und Hindernisse gehören zusammen: Zu jedem kannst du Fragen zum Weiterdenken beantworten, sie werden als Eintrag gespeichert. Eine neue Schutzstrategie kann zugleich ein Garten-Eintrag und eine Routine sein – es bleibt ein einziger Eintrag. Unten stehen deine Hindernisse mit deinen Antworten.`,
    bodyEn: `How your system can try to protect you and why this does not always stay equally helpful. They are not mistakes but earlier solutions.

Old protection strategies, new protection strategies and obstacles belong together: for each you can answer questions for further thinking, saved as an entry. A new protection strategy can be a garden entry and a routine at once – still one single entry. Below you find your obstacles with your answers.`,
  },
  glaubenssaetze: {
    title: `Denkmaschine`,
    titleEn: `Mind Machine`,
    body: `Dein Kopf produziert ständig Gedanken. Hier kannst du sie festhalten und mit einfachen Techniken etwas Abstand gewinnen.`,
    bodyEn: `Your mind keeps producing thoughts. Here you can note them down and gain a little distance with simple techniques.`,
  },
  gefuehle: {
    title: `Gefühle`,
    titleEn: `Feelings`,
    body: `Grundgefühle zum Nachschlagen, mit möglichen Gedanken, Körperwahrnehmungen und Bedürfnissen, die damit zusammenhängen können.`,
    bodyEn: `Core feelings to look up, with possible thoughts, body sensations and needs that can relate to them.`,
  },
  wertekompass: {
    title: `Wertekompass`,
    titleEn: `Values compass`,
    body: `Eine Momentaufnahme, welche Werte in deinen letzten Zugang-Durchgängen häufiger da waren. Es ist keine feste Eigenschaft und kein Test.

Dieselben Werte nutzt du, wenn du eine Brücke baust.`,
    bodyEn: `A snapshot of which values were more present in your recent Access passes. It is not a fixed trait and not a test.

You use the same values when you build a bridge.`,
  },
  letGo: {
    title: `Loslassen`,
    titleEn: `Letting go`,
    body: `Schreib einen Gedanken auf, der dich beschäftigt, und wähle, wie er ziehen darf: als Papierflieger oder zerknüllt im Wind.`,
    bodyEn: `Write down a thought that is on your mind and choose how it drifts away: as a paper plane or crumpled in the wind.`,
  },
  briefAnMich: {
    title: `Brief an mich`,
    titleEn: `Letter to myself`,
    body: `### An dich selbst
Schreib einen Brief an dein zukünftiges Ich mit einem Datum. Das Wesen zeigt ihn dir zur passenden Zeit auf der Startseite.

### An jemand anderen
Mit „Brief an jemanden schicken“ schreibst du einen Brief, der bei der anderen Person erst zu **deiner** gewählten Zeit aufgeht. Er steckt in einem Link oder einer Datei, die du selbst verschickst – ohne Server, ohne Konto.

• Die andere Person fügt den Link unter „Brief erhalten“ ein oder wählt die Datei aus.
• Der Brief wartet verschlossen unter „Unterwegs“ und geht zur Uhrzeit auf der Startseite auf.
• Eine genaue Schritt-für-Schritt-Anleitung findest du auf der Seite unter „Genaue Anleitung ansehen“.`,
    bodyEn: `### To yourself
Write a letter to your future self with a date. The companion shows it to you at the right time on the home screen.

### To someone else
With "Send a letter to someone" you write a letter that only opens for the other person at **your** chosen time. It sits inside a link or a file that you send yourself – no server, no account.

• The other person pastes the link under "Receive a letter" or chooses the file.
• The letter waits sealed under "On its way" and opens at that time on the start page.
• You find a detailed step-by-step guide on the page under "Show the detailed guide".`,
  },
  kalender: {
    title: `Kalender`,
    titleEn: `Calendar`,
    body: `Die nächsten sieben Tage auf einen Blick, heute ist eingerahmt.

### Termine
Du trägst sie mit Datum, Uhrzeit, Kategorie und, wenn du magst, einer Person aus deinem Netzwerk ein. Erinnerungen erscheinen im Postfach.

### Handy-Kalender
Für Erinnerungen bei geschlossener App übernimmst du die Termine als Kalenderdatei in den Handy-Kalender. Das ist eine Momentaufnahme, bei Änderungen exportierst du neu.

### Ich muss gar nichts, aber ich will
Hier sammelst du Dinge für den Tag. Markiere, ob du etwas willst oder sollst, und spür vorher kurz in den Körper.`,
    bodyEn: `Your next seven days at a glance, today is framed.

### Appointments
You enter them with date, time, category and, if you like, a person from your network. Reminders appear in the mailbox.

### Phone calendar
For reminders while the app is closed you put the appointments into your phone calendar as a calendar file. It is a snapshot, export again after changes.

### I do not have to do anything, but I want to
Here you collect things for the day. Mark whether you want to or should, and feel into your body first.`,
  },
  skillLauf: {
    title: `Skill oder Skillkette starten`,
    titleEn: `Start a skill or skill chain`,
    body: `Die Uhr zählt einfach mit, es gibt kein Ende, das du erreichen musst. Du siehst die Schritte der Anleitung (bei einer Kette nacheinander) und kannst jederzeit beenden.

Danach schaust du kurz, wo deine Anspannung jetzt ist. Das landet in Kurve und Rückblick, dort siehst du, wann du zurückgeschwungen bist.`,
    bodyEn: `The clock simply runs along, there is no end you have to reach. You see the instruction steps (for a chain one after another) and can stop at any time.

Afterwards you briefly check where your tension is now. That goes into the curve and the review, where you see when you swung back.`,
  },
  zugangskanaele: {
    title: `Zugangskanäle`,
    titleEn: `Access channels`,
    body: `Hier sagst du, was gerade vorhanden ist: über welche der zehn Wege du gerade an etwas herankommst. Die Wege sind Denken, Erinnerung, Fühlen, Körper, Sinne, Aufmerksamkeit, Bewegung, Anfangen, Beziehung, Ort & Zeit.

### Drei Stufen
„Ja“, „Eher schwer“, „Gerade nicht“. Das Netz zeigt dir dein Bild. Der Vorschlag aus deinem Zustand ist nur eine Tendenz.

### Wirkung
Was du hier einstellst, gilt als Filter „Was geht gerade?“ in Skills, Skillketten und Hilfsmitteln.

### Zustandsaufnahme
Du kannst festhalten, wie das Netz zu einem Zeitpunkt aussah, und es später übernehmen oder vergleichen.`,
    bodyEn: `Here you say what is available right now: through which of the ten routes you can reach something at the moment. The routes are thinking, memory, feeling, body, senses, attention, movement, starting, relationship, place & time.

### Three levels
"Yes", "Rather hard", "Not right now". The net shows your picture. The suggestion from your state is only a tendency.

### Effect
What you set here acts as the "What works right now?" filter in skills, skill chains and tools.

### State snapshot
You can keep how the net looked at one moment and later take it over or compare it.`,
  },
  quellen: {
    title: `Verwendete Quellen`,
    titleEn: `Sources used`,
    body: `Hier findest du, woher die fachlichen Inhalte der App kommen, geordnet nach Ansatz.

### Was die App ist
Sie fasst Inhalte zusammen und verlinkt zu den Originalquellen. Sie ersetzt keine eigene Recherche und keine fachliche Beratung.

### PDF
Mit „Als PDF exportieren“ nimmst du die Liste mit.

### Nicht zu verwechseln
Deine eigenen gespeicherten Links findest du unter Ressourcen → Gespeicherte Quellen.`,
    bodyEn: `Here you find where the app's professional content comes from, sorted by approach.

### What the app is
It summarises content and links to the original sources. It replaces neither your own research nor professional advice.

### PDF
With "Export as PDF" you can take the list with you.

### Not to be confused
Your own saved links are under Resources → Saved sources.`,
  },
};
