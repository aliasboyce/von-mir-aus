/**
 * Die geführte Tour ("So hängt alles zusammen — zum Ausprobieren"): jede Station öffnet die ECHTE Seite,
 * erklärt wozu sie da ist und was der Hintergedanke ist (why) und gibt eine kleine Aufgabe (task),
 * die man gleich selbst macht. Wo sich das messen lässt (check), erkennt die Tour von allein, dass etwas
 * angelegt wurde. Reihenfolge = der rote Faden der App: Wo bin ich → verstehen → regulieren → verbinden →
 * sichern → zurückschauen → Zusätze.
 */
export interface TourStop {
  id: string;
  path: string;
  /** route prefixes the person may be on during this stop (default: only `path`) */
  allow?: string[];
  de: { title: string; why: string; task: string };
  en: { title: string; why: string; task: string };
  /** returns a number that goes UP when the task was done (compared with the value at stop start) */
  check?: () => number;
}

function arr(key: string): unknown[] {
  try {
    const v = JSON.parse(localStorage.getItem('innerpath:' + key) ?? '[]');
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
const cnt = (...keys: string[]) => () => keys.reduce((n, k) => n + arr(k).length, 0);
const favRes = () => (arr('resources') as { favorite?: boolean }[]).filter((r) => r.favorite).length;
const importantContacts = () => (arr('network-entries') as { isImportantContact?: boolean }[]).filter((e) => e.isImportantContact).length;
const planItems = () =>
  (arr('safety-plans') as { warningSignals?: { example?: boolean }[]; helpers?: unknown[]; reasonsToLive?: unknown[]; linkedByTier?: Record<string, { resourceIds?: unknown[]; bridgeIds?: unknown[]; contactIds?: unknown[] }> }[]).reduce((n, p) => {
    const linked = Object.values(p.linkedByTier ?? {}).reduce((m, l) => m + (l.resourceIds?.length ?? 0) + (l.bridgeIds?.length ?? 0) + (l.contactIds?.length ?? 0), 0);
    return n + ((p.warningSignals ?? []).filter((w) => !w.example).length) + (p.helpers?.length ?? 0) + (p.reasonsToLive?.length ?? 0) + linked;
  }, 0);

type Txt = [string, string, string];
const S = (id: string, path: string, de: Txt, en: Txt, opts: { allow?: string[]; check?: () => number } = {}): TourStop => ({
  id,
  path,
  allow: opts.allow,
  check: opts.check,
  de: { title: de[0], why: de[1], task: de[2] },
  en: { title: en[0], why: en[1], task: en[2] },
});

const ALL_STOPS: TourStop[] = [
  // ───────────── Wo bin ich? ─────────────
  S('start', '/',
    ['Die Startseite', 'Die App hat fünf Hauptbereiche: Wo bin ich · Mich regulieren · Mich verbinden · Mich sichern · Zurückschauen – damit du wieder bei dir ankommst. Diese Anleitung zeigt zuerst nur diesen Kern (10 kurze Schritte). Danach entscheidest du, ob du die Zusatzfunktionen kennenlernen willst. Hier auf der Startseite beginnt alles ruhig und ohne Pflicht.', 'Trag unter „Das habe ich geschafft“ eine Kleinigkeit von heute ein und tippe auf „Speichern“ – z. B. „bin aufgestanden“ oder „diese Anleitung angefangen“.'],
    ['The home page', 'The app has five main areas: Where am I · Regulate · Connect · Secure · Look back – so that you arrive back at yourself. This guide first shows only this core (10 short steps). Afterwards you decide whether you want to get to know the extras. Here on the home page everything begins calmly and without obligation.', 'Under "I managed this" enter a small thing from today and tap "Save" – e.g. "got up" or "started this guide".'],
    { check: cnt('diary-entries') }),
  S('wetter', '/inneres-wetter',
    ['Check-in: Inneres Wetter', 'Ein Check-in ist kein Tracking und keine Bewertung, sondern eine Momentaufnahme. Etwas zu benennen, nimmt ihm schon ein wenig Druck. Und aus vielen Momentaufnahmen entsteht später deine eigene Kurve.', 'Wähle das Wetter, das gerade am ehesten passt, und geh den kurzen Check-in bis zum Ende durch.'],
    ['Check-in: inner weather', 'A check-in is not tracking and not a judgement, just a snapshot. Naming something already takes a bit of pressure off. And many snapshots later become your own curve.', 'Choose the weather that fits best right now and go through the short check-in to the end.'],
    { allow: ['/inneres-wetter', '/entdecken/tageskurve', '/'], check: cnt('weather-checkins', 'polyvagal-checkins') }),
  S('kurve', '/entdecken/tageskurve',
    ['Deine Kurve und Entwicklung', 'Muster zu sehen ist etwas anderes, als sich zu bewerten. Du erkennst, wann es dir meist schwerer fällt und wann leichter – und kannst das mit in eine Therapie nehmen.', 'Sieh dir die Kurve an – dein Check-in von eben ist schon drin. Unter „Meine Entwicklung“ siehst du den Verlauf über die Zeit.'],
    ['Your curve and development', 'Seeing patterns is something different from judging yourself. You notice when things are usually harder or easier – and can take that to therapy.', 'Look at the curve – your check-in from just now is already in it. Under "My development" you see the course over time.'],
    { allow: ['/entdecken/tageskurve'] }),
  S('zugang', '/zugang',
    ['Zugang: ausführlicher, geführt', 'Der Check-in ist kurz. Zugang geht Schritt für Schritt: Körper, Gefühle, Schutz, Bedürfnis, Hindernis – und dann entscheidest du: den Zustand verändern oder mit einer Brücke ins Leben gehen. So wird aus „mir ist alles zu viel“ etwas, das sich ordnen lässt.', 'Geh Zugang einmal durch. Du darfst jederzeit „Das hilft gerade nicht“ wählen – auch das zählt als Durchgang.'],
    ['Access: longer, guided', 'The check-in is short. Access goes step by step: body, feelings, protection, need, obstacle – and then you decide: change the state or go back into life with a bridge. So "everything is too much" becomes something that can be sorted.', 'Go through Access once. You may choose "This does not help right now" at any time – that counts as a pass too.'],
    { allow: ['/zugang', '/'], check: cnt('zugang-entries') }),
  S('kanaele', '/entdecken/zugangskanaele',
    ['Zugangskanäle', 'Menschen kommen über verschiedene Wege an sich heran – über den Körper, Gedanken, Gefühle, Handlung. Wer weiß, welcher Kanal gerade offen ist, muss nicht den falschen erzwingen.', 'Stell die Regler so ein, wie es gerade ist, und speichere den Moment.'],
    ['Access channels', 'People reach themselves in different ways – through the body, thoughts, feelings, action. If you know which channel is open right now, you do not have to force the wrong one.', 'Set the sliders the way it is right now and save the moment.'],
    { check: cnt('channel-snapshots') }),

  // ───────────── Verstehen ─────────────
  S('nerv', '/entdecken/nervensystem',
    ['Nervensystem nachschlagen', 'Zu verstehen, warum der Körper reagiert, bevor man denkt, macht die Reaktion nicht kleiner, aber sie wird weniger beschämend: Das ist Biologie, kein Charakterfehler.', 'Tippe einen Zustand an und lies, was dein Körper dort tut. Du musst nichts auswendig lernen.'],
    ['Look up the nervous system', 'Understanding why the body reacts before you think does not make the reaction smaller, but less shameful: that is biology, not a flaw of character.', 'Tap a state and read what your body does there. You do not have to memorise anything.'],
    { allow: ['/entdecken/nervensystem'] }),
  S('koerper', '/entdecken/koerper',
    ['Körperwahrnehmung', 'Der Körper meldet oft früher als der Kopf. Wer Signale kennt, kann früher sanft gegensteuern.', 'Such dir eine Körperstelle aus und lies, was sie mitteilen kann – „kann sein“, nie „ist so“.'],
    ['Body awareness', 'The body often reports earlier than the head. If you know the signals you can steer gently earlier.', 'Pick a spot on the body and read what it can tell you – "can be", never "is".'],
    { allow: ['/entdecken/koerper'] }),
  S('gefuehle', '/entdecken/gefuehle',
    ['Gefühle', 'Feinere Wörter für Gefühle beruhigen: „wütend“ und „enttäuscht und müde“ fühlen sich verschieden an. Ein Wort zu haben, macht ein Gefühl greifbar.', 'Tippe auf ein Grundgefühl und schau, welche genaueren Begriffe es gibt.'],
    ['Feelings', 'Finer words for feelings calm: "angry" and "disappointed and tired" feel different. Having a word makes a feeling tangible.', 'Tap a basic feeling and look at which more precise words exist.'],
    { allow: ['/entdecken/gefuehle'] }),
  S('schutz', '/entdecken/schutzstrategien',
    ['Schutzstrategien und Hindernisse', 'Vieles, was heute stört, hat früher geschützt. Wer das versteht, kann freundlich damit umgehen statt dagegen zu kämpfen – und Alternativen ausprobieren, ohne die alte Strategie abzuwerten.', 'Tippe eine Schutzstrategie an, die du kennst, und schreib auf, wozu sie dich schützen will.'],
    ['Protection strategies and obstacles', 'Much of what disturbs today once protected. If you understand that you can treat it kindly instead of fighting it – and try alternatives without devaluing the old strategy.', 'Tap a protection strategy you know and write down what it wants to protect you from.'],
    { allow: ['/entdecken/schutzstrategien'], check: () => arr('protection-reflections').length + arr('obstacle-reflections').length }),
  S('beduerfnis', '/entdecken/beduerfnis-kompass',
    ['Bedürfnis-Kompass', 'Hinter fast jeder Anspannung steckt ein Bedürfnis, das gerade zu kurz kommt. Wer es benennt, findet leichter etwas, das wirklich hilft – statt irgendetwas.', 'Tippe ein Bedürfnis an, das gerade da ist, und sieh dir die Vorschläge dazu an.'],
    ['Needs compass', 'Behind nearly every tension there is a need that is currently neglected. Naming it makes it easier to find something that really helps – instead of just anything.', 'Tap a need that is present right now and look at the suggestions.'],
    { allow: ['/entdecken/beduerfnis-kompass'] }),
  S('werte', '/entdecken/wertekompass',
    ['Wertekompass', 'Regulieren ist kein Selbstzweck: Es geht darum, wieder zu dem zu kommen, was dir wichtig ist. Werte sind die Richtung, in die Brücken führen.', 'Tippe auf einen Wert, der dir wichtig ist, und leg eine eigene Wertekarte dazu an.'],
    ['Values compass', 'Regulating is no end in itself: it is about getting back to what matters to you. Values are the direction in which bridges lead.', 'Tap a value that matters to you and create your own value card for it.'],
    { allow: ['/entdecken/wertekompass'], check: () => arr('wertekompass-value-cards').length }),
  S('denk', '/entdecken/denkmaschine',
    ['Denkmaschine', 'Automatische Gedanken fühlen sich wie Tatsachen an. Wer sie aufschreibt, bekommt Abstand und kann sie neu formulieren – ohne sich zu zwingen, „positiv“ zu denken.', 'Tippe auf „Eigenen Gedanken festhalten“, schreib einen Gedanken von heute auf und probiere die Neuformulierung.'],
    ['Thought machine', 'Automatic thoughts feel like facts. Writing them down creates distance and lets you reformulate – without forcing yourself to "think positive".', 'Tap "Capture own thought", write a thought from today and try the reformulation.'],
    { allow: ['/entdecken/denkmaschine'], check: cnt('glaubenssaetze') }),
  S('loslassen', '/entdecken/loslassen',
    ['Loslassen', 'Manche Gedanken brauchen kein Argument, sondern ein Ritual: Aufschreiben, falten, wegfliegen sehen. Der Körper versteht Bilder oft besser als Sätze.', 'Tippe auf „Gedanken aufschreiben“, schreib einen Gedanken auf, den du gerade nicht festhalten willst, und lass ihn losfliegen.'],
    ['Letting go', 'Some thoughts do not need an argument but a ritual: write, fold, watch it fly away. The body often understands pictures better than sentences.', 'Tap "Write down thought", write a thought you do not want to hold on to right now and let it fly away.'],
    { allow: ['/entdecken/loslassen'], check: cnt('sorgenfresser-worries') }),

  // ───────────── Mich regulieren ─────────────
  S('ressource', '/entdecken/ressourcen/hilfsmittel',
    ['Ressourcen anlegen', 'Wenn es schwer ist, fällt einem oft nicht ein, was einem hilft. Darum legst du es jetzt an, solange es dir gut genug geht – dann liegt es bereit. Skills, Hilfsmittel, Orte und Aktivitäten sind Ressourcen.', 'Tippe auf „Hilfsmittel/Werkzeug erstellen“ und leg deine erste eigene Ressource an: etwas, das dir guttut – z. B. ein Duft, ein Lied, eine Decke. (Orte und Aktivitäten findest du unter „Ressourcen entdecken“.)'],
    ['Adding resources', 'When things are hard it is often impossible to remember what helps. So you put it in now, while you are well enough – then it is ready. Skills, tools, places and activities are resources.', 'Tap "Create tool" and add your first own resource: something that does you good – e.g. a scent, a song, a blanket. (Places and activities are under "Explore resources".)'],
    { allow: ['/entdecken/ressourcen'], check: cnt('resources') }),
  S('favorit', '/entdecken/ressourcen/hilfsmittel',
    ['Favoriten markieren', 'Ein Stern holt etwas nach vorn. Favoriten tauchen auch im Sicherheitsplan, beim Wesen und auf der Favoriten-Seite auf – du musst nichts doppelt eingeben.', 'Setz bei einer Ressource das Herz oder den Stern. Dann wird sie zu deinem Favoriten.'],
    ['Marking favourites', 'A star brings something to the front. Favourites also appear in the safety plan, at the companion and on the favourites page – you do not enter anything twice.', 'Tap the heart or star on a resource. It becomes your favourite.'],
    { allow: ['/entdecken/ressourcen'], check: favRes }),
  S('fit', '/entdecken/ressourcen',
    ['„Was geht gerade?“', 'Nicht jeder Tag hat dieselbe Kraft. Statt dich mit Vorschlägen zu überfordern, filtert die App nach dem, was heute möglich ist: Energie, Zeit, Aufwand.', 'Stell oben bei „Was geht gerade?“ ein, wie viel Kraft und Zeit du gerade hast, und schau, was dann übrig bleibt.'],
    ['"What is possible right now?"', 'Not every day has the same strength. Instead of overwhelming you with suggestions the app filters by what is possible today: energy, time, effort.', 'Under "What is possible right now?" set how much strength and time you have and see what remains.'],
    { allow: ['/entdecken/ressourcen'] }),
  S('skill', '/entdecken/ressourcen/skills',
    ['Skills ausprobieren', 'Ein Skill ist eine kleine, geübte Fertigkeit für einen Zustand – beruhigen, aktivieren, aushalten. Vorher und nachher zu spüren, wie angespannt du bist, zeigt dir, was für dich wirkt.', 'Tippe einen Skill an, starte ihn mit „Skill starten“ und mach ihn bis zum Ende mit. (Eigene legst du mit „Neuer Skill“ an.)'],
    ['Trying skills', 'A skill is a small practised ability for a state – calm, activate, endure. Feeling before and after how tense you are shows you what works for you.', 'Tap a skill, start it with "Start skill" and go through it to the end. (Create your own with "New skill".)'],
    { allow: ['/entdecken/ressourcen'], check: cnt('skill-uses') }),
  S('kette', '/entdecken/ressourcen/skillketten',
    ['Skillketten', 'Wenn es sehr hoch ist, hilft kein einzelner Skill, sondern ein Ablauf für drei Stufen der Anspannung – vorher festgelegt, damit du in dem Moment nicht denken musst.', 'Tippe auf „Meine Skillkette“ und leg eine an: je Stufe ein oder zwei Skills, die du hast. (Neue Ketten gibt es auch auf der Skills-Seite.)'],
    ['Skill chains', 'When tension is very high no single skill helps but a sequence for three levels of tension – decided beforehand so that you do not have to think in that moment.', 'Tap "My skill chain" and create one: one or two skills per level that you have. (New chains are also on the skills page.)'],
    { allow: ['/entdecken/ressourcen'], check: cnt('skillketten') }),
  S('teilen', '/entdecken/ressourcen/hilfsmittel',
    ['Teilen und Importieren', 'Was dir hilft, kann anderen helfen – ohne Konto und ohne Server: Eine Ressource (oder Brücke, Kontakt, Brief) wird zu Link oder Datei, die andere Person legt sie in ihre App.', 'Tippe bei deiner Ressource auf „Teilen“ und sieh, was entsteht. Du musst nichts verschicken. Importieren findest du unter „Teilen & Importieren“ in der Übersicht auf der Startseite.'],
    ['Sharing and importing', 'What helps you may help others – without account and server: a resource (or bridge, contact, letter) becomes a link or file, the other person puts it into their app.', 'Tap "Share" on your resource and see what happens. You do not have to send anything. Importing is explained under "Share & import" in the overview on the home page.'],
    { allow: ['/entdecken/ressourcen'] }),

  // ───────────── Mich verbinden ─────────────
  S('bruecke', '/bruecken',
    ['Brücke bauen', 'Eine Brücke ist ein kleiner Weg zurück zu etwas, das dir wichtig ist. Sie muss das Hindernis nicht beseitigen – sie öffnet nur einen Spalt. Kleine Schritte statt großer Vorsätze.', 'Tippe auf „Neue Brücke“ und bau deine erste: wohin soll sie führen, und was ist der kleinste Schritt dorthin?'],
    ['Building a bridge', 'A bridge is a small way back to something that matters to you. It does not have to remove the obstacle – it only opens a gap. Small steps instead of big resolutions.', 'Build your first bridge ("New bridge"): where should it lead, and what is the smallest step toward it?'],
    { allow: ['/bruecken'], check: cnt('bridges') }),
  S('brueckeNutzen', '/bruecken',
    ['Brücke benutzen', 'Eine Brücke wird erst durch einen Schritt wirklich. Timer und Tagebuch machen den Schritt sichtbar – für dich, nicht zur Kontrolle.', 'Öffne deine Brücke, wähle einen Schritt und starte den Timer oder speichere ihn im Tagebuch.'],
    ['Using a bridge', 'A bridge only becomes real through a step. Timer and diary make the step visible – for you, not for control.', 'Open your bridge, pick a step and start the timer or save it in the diary.'],
    { allow: ['/bruecken'], check: cnt('diary-entries', 'skill-uses', 'activity-events') }),
  S('timer', '/entdecken/timer',
    ['Der einfache Timer', 'Manches wird leichter, wenn es eine Grenze hat: „nur 5 Minuten“. Der Timer begleitet ruhig und ohne Druck, auch ohne Brücke.', 'Stell den Timer auf 1 Minute, tippe auf „Timer starten“ und lass ihn laufen – oder brich ihn sanft ab.'],
    ['The simple timer', 'Some things get easier when they have a limit: "just 5 minutes". The timer accompanies calmly and without pressure, even without a bridge.', 'Set the timer to 1 minute, tap "Start timer" and let it run – or stop it gently.'],
    { allow: ['/entdecken/timer'] }),
  S('garten', '/entdecken/garten',
    ['Mein Garten', 'Veränderung wächst in ihrem eigenen Tempo. Der Garten zeigt, was du aufbaust oder veränderst – ein Rückschlag lässt ihn nicht verschwinden.', 'Tippe auf „Neuen Garten anlegen“ und pflanze etwas: was willst du aufbauen oder verändern? Eine kleine Sache reicht.'],
    ['My garden', 'Change grows at its own pace. The garden shows what you are building or changing – a setback does not make it disappear.', 'Tap "Create new garden" and plant something: what do you want to build or change? One small thing is enough.'],
    { allow: ['/entdecken/garten'], check: cnt('garden-entries') }),

  // ───────────── Mich sichern ─────────────
  S('netzwerk', '/sicherheit/netzwerk',
    ['Netzwerk', 'Wer trägt dich? Menschen, Orte, Tiere, Gruppen – sichtbar zu machen, was da ist, entlastet gerade dann, wenn man sich allein fühlt.', 'Tippe auf „Neues Element hinzufügen“ und füge eine Person, einen Ort oder etwas anderes hinzu, das dich trägt (gern mit Telefonnummer).'],
    ['Network', 'Who supports you? People, places, animals, groups – making visible what is there relieves exactly when you feel alone.', 'Tap "Add new element" and add a person, a place or something else that supports you (phone number welcome).'],
    { allow: ['/sicherheit/netzwerk'], check: cnt('network-entries') }),
  S('verbinden', '/sicherheit/netzwerk',
    ['Verbindungen im Netzwerk', 'Ein Netz besteht aus Verbindungen, nicht nur aus dir in der Mitte: Wer kennt wen, wer hilft bei was?', 'Tippe ein Element an, wähle „Verbindung hinzufügen“ und tippe ein zweites an. Hast du nur eins, lege kurz ein zweites an.'],
    ['Connections in the network', 'A net consists of connections, not only of you in the middle: who knows whom, who helps with what?', 'Tap an element, choose "Add connection" and tap a second one. If you only have one, add a second quickly.'],
    { allow: ['/sicherheit/netzwerk'] }),
  S('kontakte', '/sicherheit/kontakte',
    ['Wichtige Kontakte', 'Wenn es schwer ist, will man nicht suchen. Wichtige Kontakte stehen mit Telefonnummer direkt auf der Startseite – ein Tipp zum Anrufen.', 'Tippe bei einer Person auf den Stern, um sie als „wichtigen Kontakt“ zu markieren. Fehlt noch die Telefonnummer, ergänzt du sie im Netzwerk.'],
    ['Important contacts', 'When it is hard you do not want to search. Important contacts with phone numbers appear right on the home page – one tap to call.', 'Tap the star next to a person to mark them as an "important contact". If the phone number is missing, add it in the network.'],
    { allow: ['/sicherheit/kontakte', '/sicherheit/netzwerk'], check: importantContacts }),
  S('plan', '/sicherheit/plan',
    ['Sicherheitsplan', 'Einen Plan macht man, solange man klar ist, nicht mittendrin. Er verbindet: bei diesen Warnzeichen (Stufe) hilft dies (Ressourcen, Brücken, Kontakte). Auch als PDF zum Mitnehmen.', 'Trag ein Warnzeichen ein, das du an dir kennst, und verknüpf eine Ressource oder einen Kontakt damit.'],
    ['Safety plan', 'You make a plan while you are clear, not in the middle of it. It connects: with these warning signs (level) this helps (resources, bridges, contacts). Also as a PDF to take along.', 'Enter a warning sign you know in yourself and link a resource or contact to it.'],
    { allow: ['/sicherheit/plan'], check: planItems }),
  S('krise', '/krisenmodus',
    ['Krisenmodus', 'In akuten Momenten ist weniger mehr: wenige große Schritte, nichts Überflüssiges. Diese App kann nicht einschätzen, wie akut es ist – im Zweifel gilt der Notruf.', 'Schau dir an, was dort ist. Du musst nichts tun – nur wissen, dass es das gibt und wo.'],
    ['Crisis mode', 'In acute moments less is more: a few big steps, nothing superfluous. This app cannot judge how acute it is – when in doubt call the emergency number.', 'Look at what is there. You do not have to do anything – just know it exists and where.'],
    { allow: ['/krisenmodus'] }),
  S('helfer', '/helfermodus',
    ['Helfermodus', 'Wer jemandem beisteht, braucht selbst Orientierung – und darf Grenzen setzen. Hier findest du erste Ideen für die Situation.', 'Wähle eine Beobachtung aus, die du bei jemandem machst, und lies die ersten Ideen.'],
    ['Helper mode', 'Whoever supports someone needs orientation too – and may set limits. Here you find first ideas for the situation.', 'Choose an observation you make in someone and read the first ideas.'],
    { allow: ['/helfermodus'] }),

  // ───────────── Zurückschauen ─────────────
  S('tagebuch', '/sicherheit/tagebuch',
    ['Tagebuch', 'Aufschreiben sortiert, was im Kopf kreist. Es ist ein privater Ort – mit eigenen Kategorien, optional mit Foto.', 'Tippe auf „Neuer Eintrag“ und schreib kurz: wie war der Tag bis jetzt?'],
    ['Diary', 'Writing sorts what circles in the head. It is a private place – with your own categories, optionally with a photo.', 'Tap "New entry" and write briefly: how has the day been so far?'],
    { allow: ['/sicherheit/tagebuch'], check: cnt('diary-entries') }),
  S('rueckblick', '/sicherheit/tagebuch?tab=review',
    ['Tagesrückblick', 'Der Rückblick sammelt automatisch, was an einem Tag war: Check-ins, Skills, Brücken, Orientierung. So siehst du schwarz auf weiß, was du getan hast – auch an Tagen, die sich leer anfühlen.', 'Sieh dir den heutigen Tag an: Was von dieser Tour steht schon drin?'],
    ['Daily review', 'The review collects automatically what happened on a day: check-ins, skills, bridges, orientation. So you see in black and white what you did – even on days that feel empty.', 'Look at today: what from this tour is already in it?'],
    { allow: ['/sicherheit/tagebuch'] }),
  S('woche', '/wochenrueckblick',
    ['Wochen- und Monatsrückblick', 'Über mehrere Tage zeigen sich Muster, die man im einzelnen Moment nicht sieht. Auch als PDF für die Therapie.', 'Wirf einen Blick darauf, du musst noch nichts verstehen – es füllt sich mit der Zeit.'],
    ['Weekly and monthly review', 'Over several days patterns appear that you do not see in the single moment. Also as PDF for therapy.', 'Have a look; you do not have to understand anything yet – it fills up over time.'],
    { allow: ['/wochenrueckblick'] }),
  S('kalender', '/kalender',
    ['Kalender', 'Termine und Erinnerungen – und „Ich muss gar nichts, aber ich will“: Wünsche statt Pflichtenliste. „will ich / soll ich“ hilft zu spüren, was von dir kommt und was nur Druck ist.', 'Trag heute einen Wunsch ein („Ich muss gar nichts, aber ich will“) und wähle, ob er sich nach „will ich“ oder „soll ich“ anfühlt.'],
    ['Calendar', 'Appointments and reminders – and "I do not have to, but I want to": wishes instead of an obligation list. "I want to / I should" helps to feel what comes from you and what is only pressure.', 'Enter a wish for today ("I do not have to, but I want to") and choose whether it feels like "I want to" or "I should".'],
    { allow: ['/kalender'], check: cnt('calendar-appointments', 'calendar-wishes') }),
  S('lesezeichen', '/entdecken/lesezeichen',
    ['Lesezeichen', 'Gute Quellen, Videos, Hilfsseiten – an einem Ort, nach Kategorien, damit du sie im richtigen Moment findest und nicht erst suchen musst.', 'Tippe auf „Neue Quelle“ und speichere einen Link, der dir etwas bedeutet (oder eine Hilfsstelle).'],
    ['Bookmarks', 'Good sources, videos, help pages – in one place, sorted by category so you find them at the right moment without searching.', 'Tap "New source" and save a link that means something to you (or a help service).'],
    { allow: ['/entdecken/lesezeichen'], check: cnt('bookmarks') }),
  S('brief', '/entdecken/brief-an-mich',
    ['Brief an mich', 'Ein Brief, den du jetzt schreibst und später öffnest – von dir an dich, wenn du es gut gebrauchen kannst. Oder an jemanden, der ihn zu einer Uhrzeit bekommt, die du einstellst.', 'Tippe auf „Neuen Brief schreiben“ und schreib kurz an dein späteres Ich: „Falls es dir gerade schlecht geht, möchte ich dir sagen …“'],
    ['Letter to myself', 'A letter you write now and open later – from you to you when you can use it. Or to someone who receives it at a time you set.', 'Tap "Write new letter" and write briefly to your later self: "If you are not doing well right now, I would like to tell you …"'],
    { allow: ['/entdecken/brief-an-mich'], check: cnt('letters-to-self') }),
  S('parkbox', '/parkbox',
    ['Parkbox & Wartezimmer', 'Was heute nicht mehr muss, darf in die Box – es bleibt sicher, nichts geht verloren, und morgen ist auch noch ein Tag. Im Wartezimmer haben Ideen, Projekte und Wünsche einen festen Platz, bis du ihnen einen Zeitraum im Kalender gibst. Das nimmt die Angst, etwas zu verpassen oder nicht genug Zeit zu haben.', 'Schreib einen Zettel und tippe auf „In die Box legen“. Setz danach etwas in das Wartezimmer – und gib ihm, wenn du magst, über „Einen Zeitraum zuordnen“ einen Platz im Kalender.'],
    ['Parking box & waiting room', 'What does not have to happen today may go into the box – it stays safe, nothing gets lost, and tomorrow is another day. In the waiting room ideas, projects and wishes have a fixed place until you give them a period in the calendar. That takes away the fear of missing something or not having enough time.', 'Write a note and tap "Put it in the box". Then seat something in the waiting room – and, if you like, give it a place in the calendar via "Assign a time period".'],
    { allow: ['/parkbox'], check: cnt('park-notes', 'waiting-room') }),
  S('medi', '/entdecken/medi-log',
    ['Medi-Log', 'Nur falls hilfreich: festhalten, was du wann eingenommen hast – damit du es nicht im Kopf behalten musst und für Gespräche mit Ärzt:innen alles parat hast.', 'Schau dir die Seite an. Trag nur etwas ein, wenn du wirklich Medikamente nimmst und es dir nützt.'],
    ['Medication log', 'Only if helpful: note what you took when – so you do not have to keep it in your head and have everything ready for talks with doctors.', 'Look at the page. Only enter something if you really take medication and it is useful.'],
    { allow: ['/entdecken/medi-log'] }),

  // ───────────── Begleitung, Zusätze, Einstellungen ─────────────
  S('wesen', '/',
    ['Das Wesen', 'Dein Wesen ist kein Schmuck: Es hilft beim Orientieren, Ablenken, Aufstehen und Schmuggeln kleiner guter Dinge – und es darf jederzeit hören: „Das hilft gerade nicht“.', 'Tippe dein Wesen auf der Startseite an und probiere eine Funktion aus, z. B. „Orientierung“ oder „Lenk mich ab“.'],
    ['The companion', 'Your companion is not decoration: it helps with orientation, distraction, getting up and smuggling small good things – and may hear any time: "This does not help right now".', 'Tap your companion on the home page and try one function, e.g. "Orientation" or "Distract me".'],
    { allow: ['/'] }),
  S('nurjetzt', '/',
    ['„Nur jetzt“ und der Überblick', 'Manchmal ist alles zu viel. „Nur jetzt“ blendet fast alles aus. Und unter „Nicht sicher, was gerade passt?“ findest du immer den Überblick über alles, was die App kann – nach dem sortiert, was du gerade brauchst.', 'Öffne „Nicht sicher, was gerade passt?“ und stöbere im Überblick. „Nur jetzt“ starten wir nicht – du findest es auf der Startseite („Ich bin gerade nicht richtig da“ / „Mir ist das alles zu viel“).'],
    ['"Only now" and the overview', 'Sometimes everything is too much. "Only now" hides almost everything. And under "Not sure what fits right now?" you always find the overview of everything the app can do – sorted by what you need.', 'Open "Not sure what fits right now?" and browse the overview. We do not start "Only now" – you find it on the home page ("I am not really here" / "This is all too much").'],
    { allow: ['/'] }),
  S('favoriten', '/favoriten',
    ['Favoriten', 'Alles, was du markiert hast, an einem Ort – ohne zu suchen, mit Bildern und Farben.', 'Sieh dir deine Favoriten an. Die Ressource von vorhin sollte dort stehen.'],
    ['Favourites', 'Everything you marked in one place – without searching, with pictures and colours.', 'Look at your favourites. The resource from before should be there.'],
    { allow: ['/favoriten'] }),
  S('entdecken', '/entdecken',
    ['Die Karte unter „Entdecken“', 'Alle Seiten der App auf einen Blick: fünf Hauptbereiche (Wo bin ich, Regulieren, Verbinden, Sichern, Zurückschauen) und die Zusätze. Jetzt weißt du, wie alles zusammenhängt.', 'Tippe auf einen der fünf Bereiche oben, um zu springen – und sieh, wie viel du schon besucht hast.'],
    ['The map under "Explore"', 'All pages of the app at a glance: five main areas (Where am I, Regulate, Connect, Secure, Look back) and the add-ons. Now you know how everything connects.', 'Tap one of the five areas at the top to jump – and see how much you have already visited.'],
    { allow: ['/entdecken'] }),
  S('quellen', '/quellen',
    ['Quellen', 'Nichts in dieser App ist erfunden oder esoterisch: Hier steht, woher die fachlichen Inhalte kommen (ACT, GFK, Polyvagal-orientierte Ansätze …), jeweils mit Link.', 'Such dir einen Ansatz aus und sieh nach, woher er stammt.'],
    ['Sources', 'Nothing in this app is made up or esoteric: here it says where the professional content comes from (ACT, NVC, polyvagal-informed approaches …), each with a link.', 'Choose an approach and look up where it comes from.'],
    { allow: ['/quellen'] }),
  S('einstellungen', '/einstellungen',
    ['Einstellungen', 'Die App soll sich nach dir richten, nicht umgekehrt: Sprache, Farben, Wesen, Erinnerungen, sanfte Hinweise, Bewegung reduzieren. Auch diese Anleitung kannst du hier später wiederholen.', 'Stell eine Erinnerung ein oder ändere etwas an der Darstellung, das dir angenehmer ist.'],
    ['Settings', 'The app should adapt to you, not the other way round: language, colours, companion, reminders, gentle hints, reduce motion. You can also repeat this guide here later.', 'Set a reminder or change something in the appearance that is more pleasant for you.'],
    { allow: ['/einstellungen'] }),
  S('datenschutz', '/einstellungen/datenschutz',
    ['Datenschutz und Sicherung', 'Alles, was du eingetragen hast, liegt nur auf diesem Gerät – kein Konto, kein Server. Das schützt dich, heißt aber auch: Mach hin und wieder eine Sicherung, sonst ist alles weg, wenn das Handy verloren geht.', 'Lies die Seite kurz durch. Eine Sicherung erstellst du in den Einstellungen unter „Meine Daten“ – jetzt oder später.'],
    ['Privacy and backup', 'Everything you entered lives only on this device – no account, no server. That protects you, but it also means: make a backup now and then, otherwise everything is gone if the phone is lost.', 'Read the page briefly. You create a backup in the settings under "My data" – now or later.'],
    { allow: ['/einstellungen'] }),
];

import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Der Kern zuerst: die fünf Hauptbereiche (Wo bin ich · Mich regulieren · Mich verbinden · Mich sichern ·
 * Zurückschauen), je mit der einen Handlung, die den Bereich lebendig macht. Alles andere sind Zusatzfunktionen:
 * nach dem Kern entscheidet die Person, ob sie sie erklärt bekommen oder gleich ausprobieren möchte.
 */
const CORE_IDS = ['start', 'wetter', 'zugang', 'ressource', 'skill', 'bruecke', 'netzwerk', 'plan', 'krise', 'rueckblick'];
const byId = (id: string) => {
  const stop = ALL_STOPS.find((x) => x.id === id);
  if (!stop) throw new Error('tour stop missing: ' + id);
  return stop;
};
export const TOUR_STOPS: TourStop[] = [...CORE_IDS.map(byId), ...ALL_STOPS.filter((x) => !CORE_IDS.includes(x.id))];
/** number of core stops; everything from this index on is an extra */
export const CORE_COUNT = CORE_IDS.length;

/** how the person wants to meet the extras after the core: read about them or try them right away */
export const tourExtrasModeStore = createKeyValueStore<'explain' | 'try' | null>('tour-extras-mode', null);
/** which station the person is on — kept so a reload in the middle of the tour continues where it was */
export const tourIndexStore = createKeyValueStore<number>('tour-index', 0);
