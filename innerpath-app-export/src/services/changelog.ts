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
    id: '2026-verbindungen',
    date: '2026',
    items: [
      'Neu am Anfang: „So fängst du am besten an“ – eine kurze, ruhige Erklärung, wie du die App Stück für Stück zu deiner machst. Du findest sie jederzeit wieder oben in den Einstellungen.',
      'Alles hängt zusammen: Bei Garten und Routinen ist jetzt erklärt, was „Alternative für …“ meint. Eine neue Schutzstrategie kann zugleich Garten-Eintrag und Routine sein – es bleibt ein einziger Eintrag. Alte Schutzstrategie, neue Schutzstrategie und Hindernis sind verknüpft und springen dorthin.',
      'Hindernisse werden wie Schutzstrategien als Eintrag gespeichert – mit den Fragen zum Weiterdenken.',
      'Routinen kannst du jetzt einfach abbrechen, ohne sie zu beenden oder etwas zu speichern.',
      'Haustier-Begleiter sind ganz ohne Geräusche. In den Einstellungen stehen Tiere jetzt nur einmal und getrennt von den Wesen, und sie sind größer.',
      'Wesen und Begleiter machen genau dasselbe, mit „Wesen/Begleiter-Inhalte verwalten“ und dem Hinweis, dass sich alles ganz ausschalten lässt.',
      'Lauf mit dem Wesen läuft nur noch mit dem Wesen. Am Ende kommt ein Satz passend zur Zeit, die du durchgehalten hast (Insider-Hinweis inklusive).',
      'Neue Sprüche bei „Sag mir was“, drei neue Nachdenk-Texte, acht Bilder bei „Überrasch mich“ und ein Hinweis auf die Testphase.',
      'Kurz was an Boycie melden: vier Tipps und optional ein Satz – ohne ein ganzes Formular.',
      'Sechs neue Welten: Strand, Abendrot, Kirschblüte, Nebel, Regen, Polarlicht.',
    ],
    itemsEn: [
      'New at the start: "How to start" – a short, calm explanation of how to make the app yours step by step. You can find it again at the top of the settings.',
      'Everything is connected: Garden and routines now explain what "Alternative for …" means. A new protection strategy can be a garden entry and a routine at once – still one single entry. Old strategy, new strategy and obstacle are linked and jump to each other.',
      'Obstacles are saved as an entry like protection strategies – with the questions for further thinking.',
      'You can now simply cancel a routine without finishing it or saving anything.',
      'Pet companions are completely silent. In the settings animals now appear only once, separate from the beings, and they are bigger.',
      'Being and companion do exactly the same, with "Manage being/companion content" and a note that everything can be switched off.',
      'Run with the being now only runs with the being. At the end a line fits the time you lasted (inside-joke note included).',
      'New lines under "Tell me something", three new thinking texts, eight pictures under "Surprise me" and a note about the test phase.',
      'Quick note to Boycie: four taps and optionally one sentence – no whole form needed.',
      'Six new worlds: beach, sunset, cherry blossom, fog, rain, northern lights.',
    ],
  },
  {
    id: '2026-begleittiere-3',
    date: '2026',
    items: [
      'Babys sind jetzt kleiner, mit sichtbarem Körper und Beinchen und einem Babygesicht (größere, tiefer sitzende Augen).',
      'Etwas halten oder dabeihaben: Der Otter hält Muschel, Stein, Fisch, Seestern oder Perle in den Pfoten, die Krähe sammelt Münze, Diamant, Schlüssel, Ring oder Perle. Auch andere Tiere haben Dinge, die zu ihnen passen. Tragbares (Hut, Halsband, Schal …) und Gehaltenes sind getrennt wählbar.',
      'Beim Timer hat das Tier jetzt eine kleine Uhr bei sich statt des Blatts.',
      'Bewegungen noch passender: Füße laufen im Takt, Vögel ziehen im Flug die Füße an, Otter und Axolotl paddeln beim Schwimmen.',
      'Die Tiere nach deinen Fotos (Katze, Pudel, Labrador, Collie, schwarzer Hund) sehen wieder genau so aus wie vorgesehen, die Augen sind wieder schlicht und dunkel.',
    ],
    itemsEn: [
      'Babies are smaller now, with a visible body and little legs and a baby face (bigger, lower-set eyes).',
      'Holding something: the otter holds a shell, stone, fish, starfish or pearl in its paws, the crow collects a coin, diamond, key, ring or pearl. Other animals have things that suit them too. Wearables (hat, collar, scarf …) and held items are chosen separately.',
      'During the timer the animal has a little clock with it instead of the leaf.',
      'More fitting movements: feet move in rhythm, birds tuck their feet in flight, otters and axolotls paddle when swimming.',
      'The animals based on your photos (cat, poodle, labrador, collie, black dog) look exactly as intended again, and the eyes are plain and dark again.',
    ],
  },
  {
    id: '2026-begleittiere-2',
    date: '2026',
    items: [
      'Neue Begleittiere: Corgi und Piepmatz, jeweils in drei Farben.',
      'Weichere Gesichter: flauschigerer Rand, und die Babys sehen babyhafter aus.',
      'Mehr Extras: jedes Tier hat eigene, die zu ihm passen – zum Beispiel Knochen und Ball beim Hund, Glöckchen bei der Katze, Doktorhut und Buch bei der Eule, Fisch beim Otter, Kopfhörer beim Papagei.',
      'Ruhigere Bewegungen. In Ruhe verhält sich jedes Tier auf seine Art: Die Eule dreht den Kopf, Vögel picken und hüpfen, die Katze streckt sich, das Schwein schnüffelt. Vögel fliegen, Hunde laufen, Otter und Axolotl schwimmen.',
    ],
    itemsEn: [
      'New companions: corgi and little songbird, each in three colourings.',
      'Softer faces: a fluffier edge, and the babies look more like babies.',
      'More extras: every animal has its own that suit it – for example bone and ball for the dog, a little bell for the cat, graduation cap and book for the owl, a fish for the otter, headphones for the parrot.',
      'Calmer movements. At rest every animal behaves its own way: the owl turns its head, birds peck and hop, the cat stretches, the pig sniffs. Birds fly, dogs run, otters and axolotls swim.',
    ],
  },
  {
    id: '2026-begleittiere',
    date: '2026',
    items: [
      'Begleittiere: 21 Tiere können dich statt des Lichtwesens begleiten – Wolf, Eule, Krähe, Esel, Katze, Hund, Otter, Erdmännchen, Schweinchen, Axolotl, Bär, Gans, Einhorn und neu Papagei, Drache, Dino, Eisvogel, Pudel, Labrador, Collie und Glückskatze. Jedes gibt es in drei natürlichen Farbvarianten, deutlich flauschiger und lebendiger.',
      'Tier einrichten: Name, Farbe, kleines Extra (Schleife, Halstuch, Krone, Blume, Brille, Mütze, Geschirr), eigene Hauptfarbe und wie es spricht – unter Einstellungen → Begleittiere.',
      'Die Tiere ziehen als Baby ein und wachsen mit den Tagen, an denen du in der App etwas machst. Nach 30 Tagen sind sie ausgewachsen. Keine Serie, kein Druck – du kannst sie auch gleich erwachsen oder immer Baby lassen.',
      'Beim Wegschicken und Herbeirufen bewegt sich jedes Tier auf seine Art (galoppieren, watscheln, fliegen, schwimmen …).',
    ],
    itemsEn: [
      'Animal companions: 21 animals can accompany you instead of the light being – wolf, owl, crow, donkey, cat, dog, otter, meerkat, piglet, axolotl, bear, goose, unicorn and new: parrot, dragon, dino, kingfisher, poodle, labrador, collie and lucky cat. Each comes in three natural colourings, much fluffier and livelier.',
      'Set up your animal: name, colour, little extras (bow, scarf, crown, flower, glasses, cap, harness), your own main colour and how it talks – in Settings → Animal companions.',
      'Animals move in as babies and grow with the days you do something in the app. After 30 days they are fully grown. No streak, no pressure – you can also keep them grown or a baby.',
      'When sent away or called back, every animal moves its own way (gallop, waddle, fly, swim …).',
    ],
  },
  {
    id: '2026-routinen-sicherung-tour-snapshot',
    date: '2026',
    items: [
      'Routinen: Karten ohne Symbol, nur mit Farbe oder mit eigenem Foto (Polaroid). Medikamente lassen sich in eine Karte legen und werden beim Abhaken automatisch im Medi-Log eingetragen. Fähigkeiten und Ressourcen aus Routinen landen im Rückblick, am Ende optional mit Anspannung und Nervensystem.',
      'Sicherheitsnetz und Mindmap: Im Vollbild gibt es eine Momentaufnahme als Foto, das PDF enthält jetzt auch das Bild des Netzes. Mindmaps können ein eigenes Foto als Hintergrund haben.',
      'Sicherung: Eigene Fotos, Videos und Töne sind jetzt mit in der Sicherungsdatei, und beim Einspielen wird der Stand genau wiederhergestellt (bei zu wenig Speicher bleibt alles wie vorher). Die App-Sperre ist bewusst nicht in der Datei.',
      'Neu außerdem: Rundgang mit Sprechblasen, die zeigen, was man auf jeder Seite tun kann. PIN vergessen? Mit einer Sicherheitsfrage kommst du wieder hinein. Wesen wegschicken und herbeirufen, Nachrichten ganz ausschalten, Stufen beim Störsender, Link-Vorschau für Lieder und Playlists.',
    ],
    itemsEn: [
      'Routines: cards without a symbol, with colour only or with your own photo (polaroid). Medication can go into a card and is logged in the medication log when you tick it. Skills and resources from routines show up in the review, optionally with tension and nervous system at the end.',
      'Safety net and mind map: a snapshot photo in full screen, and the PDF now includes the picture of the net. Mind maps can have your own photo as background.',
      'Backup: your own photos, videos and sounds are now in the backup file, and restoring brings back the exact state (if storage is too small, everything stays as before). The app lock is deliberately not in the file.',
      'Also new: tour with speech bubbles showing what to do on each page. Forgot the PIN? A security question gets you back in. Send the companion away and call it back, switch messages off completely, levels for the interrupter, link previews for songs and playlists.',
    ],
  },
  {
    id: '2026-mindmap-doodle-stift-ebenen',
    date: '2026',
    items: [
      'Mindmap: Doodles (Kreise auch gestrichelt, Pfeile, Sprechblasen, Sterne …), freies Zeichnen mit Stift, Bleistift und Textmarker plus Radierer – und Text, Fotos und Symbole ganz ohne Feld.',
      'Mindmap: alles lässt sich verschieben, drehen, größer/kleiner ziehen, nach vorn oder hinten legen. Neu: Schriftarten, Rahmen, mehr Hintergründe und Bewegungen (z. B. Drehen) – einzeln oder als Gruppe, jederzeit pausierbar.',
      'Mindmap: mehrere Dinge auswählen, kopieren, ausschneiden, duplizieren, löschen oder „In neue Mindmap“ übernehmen.',
      'Mindmaps ordnen: verschieben, in Ordner legen, archivieren (und zurückholen) – und eine Mindmap kann Unter-Mindmap einer anderen sein, mit kleiner Vorschau als Karte.',
    ],
    itemsEn: [
      'Mind map: doodles (circles also dashed, arrows, speech bubbles, stars …), free drawing with pen, pencil and highlighter plus eraser – and text, photos and symbols without any box.',
      'Mind map: everything can be moved, rotated, resized, brought forward or back. New: fonts, borders, more backgrounds and motions (e.g. spinning) – single or as a group, pausable any time.',
      'Mind map: select several things, copy, cut, duplicate, delete or take them “Into a new mind map”.',
      'Organise mind maps: move, put in folders, archive (and restore) – and a mind map can be a sub mind map of another, with a small preview as a card.',
    ],
  },
  {
    id: '2026-schutz-stufen-zuschauen-energie',
    date: '2026',
    items: [
      'Neu: Optionale App-Sperre mit PIN und ein neutraler „Schnell weg“-Knopf (Einstellungen → Umfang und Schutz). Die PIN ist ein Sichtschutz, keine Verschlüsselung.',
      'Neu: Du entscheidest, wie viel du siehst – „Nur das Nötigste“, „Mit Sicherheitsplan“ oder „Alles“ – plus die „Einfach“-Darstellung mit größeren Flächen. Nichts geht verloren, es ist nur ausgeblendet.',
      'Neu: Den Rundgang kannst du dir auch nur ansehen – auf Play drücken, die App zeigt alles von allein. Oder selbst ausprobieren. Du entscheidest.',
      'Routinen: Alltags-Vorlagen (Morgen, Abend, Duschen, Essen, Schlaf, kleiner Spaziergang, Wohnung „5 Minuten“) als freiwillige Beispiele, und eine Energie-Ampel: pro Karte einstellbar, ob sie auch an einem schweren Tag dazugehört. Im Krisenmodus stehen Notruf und Telefonseelsorge fest und ruhig bereit; die Sicherungs-Erinnerung nach etwa einer Woche lässt sich abschalten.',
    ],
    itemsEn: [
      'New: optional app lock with a PIN and a neutral “Hide now” button (Settings → Scope and protection). The PIN is a privacy screen, not encryption.',
      'New: you decide how much you see – “Just the essentials”, “With safety plan” or “Everything” – plus the “Simple” view with bigger surfaces. Nothing is lost, it is only hidden.',
      'New: you can also just watch the tour – press play and the app shows everything on its own. Or try it out yourself. Your choice.',
      'Routines: everyday templates (morning, evening, showering, eating, sleep, small walk, home “5 minutes”) as voluntary examples, and an energy traffic light: set per card whether it belongs on a hard day. In crisis mode, emergency numbers and the crisis line are fixed and calm; the backup reminder after about a week can be switched off.',
    ],
  },
  {
    id: '2026-welten-einfuegen-lesbar',
    date: '2026',
    items: [
      'Neu: Ästhetik-Welten in den Einstellungen – Wald, Meer, Wiese, Herbst, Winter, Berge und Sternennacht als ruhige Landschaft im Hintergrund, auf Wunsch mit sanfter Bewegung (oder „Nur Bild“). Alle anderen Einstellungen bleiben frei wählbar.',
      'Mindmaps: eigene Fotos, Sticker, Symbole und kopierte Texte einfügen („Einfügen“ oder einfach Text/Bild in die Fläche einfügen).',
      'Routinen-Karten: ganzes Lied über „In Spotify öffnen“, eigene Fotos, Videos oder Audio-Dateien pro Karte (bleiben auf deinem Gerät). Links wischen = überspringen, rechts = fertig – jetzt deutlich sichtbar.',
      'Schrift bleibt in jeder Farbwelt lesbar, auch abends im hellen Modus. Der Briefkasten passt jetzt zu deiner Farbwelt. „Atmen“ liegt jetzt bei den Skills. Beim Senden von Briefen: Hinweis, Hilfe mit Freund:innen und Helfer:innen zu koordinieren.',
    ],
    itemsEn: [
      'New: aesthetic worlds in the settings – forest, sea, meadow, autumn, winter, mountains and starry night as a calm landscape in the background, gently moving if you like (or “picture only”). All other settings stay freely adjustable.',
      'Mind maps: insert your own photos, stickers, symbols and copied text (“Insert”, or simply paste text/pictures onto the canvas).',
      'Routine cards: play the whole song via “Open in Spotify”, your own photos, videos or audio files per card (they stay on your device). Swipe left = skip, right = done – now clearly visible.',
      'Text stays readable in every colour world, also in the evening in light mode. The mailbox now matches your colour world. “Breathing” now lives under Skills. When sending letters: a hint to coordinate help with friends and helpers.',
    ],
  },
  {
    id: '2026-mindmap-netzwerk-atmen',
    date: '2026',
    items: [
      'Neu: „Mindmaps“ unter Entdecken – so viele, wie du magst, mit Formen, Farben, Linien, Symbolen, benannten Verbindungen, Rahmen und frei verschiebbarer, riesiger Fläche. Als PDF druckbar (alles drauf) und per Link oder Datei mit Freund:innen teilbar.',
      'Sicherheitsnetzwerk: Unterelemente wie bei einer Mindmap (z. B. nur mit deinem Hund verbunden), Verbindungen mit Namen und Farbe (wiederverwendbar), sehr große Fläche ohne Verzerrung, und das PDF zeigt das ganze gebaute Netz.',
      'Neu: Atemübungen mit lebendigem Wesen, Kreis, Linien und Wellen – zum Mitmachen mit Bild und (auf Android) Vibration. Zu finden bei den Skills und im Wesen-Menü.',
      'Routinen: Karten lassen sich richtig mit dem Finger wegschieben und fortschleudern. Mehr Symbole und Farben. Pro Karte ein Link zu Lied oder Video (YouTube, Spotify …), das erst nach Antippen spielt.',
      'Rückblicke: „Verlauf & Auffälligkeiten“ für 7, 30 und 90 Tage – ruhigster und anstrengendster Tag, schwierige Momente und was du am häufigsten genutzt hast.',
    ],
    itemsEn: [
      'New: “Mindmaps” under Discover – as many as you like, with shapes, colours, lines, symbols, named connections, frames and a huge, freely movable canvas. Printable as PDF (everything on it) and shareable with friends by link or file.',
      'Safety network: sub-elements like a mind map (e.g. connected only to your dog), connections with a name and colour (reusable), a very large canvas without distortion, and the PDF shows the whole network you built.',
      'New: breathing exercises with a lively companion, circle, lines and waves – to follow along with visuals and (on Android) vibration. Find them under Skills and in the companion menu.',
      'Routines: cards can really be pushed away and flung with your finger. More symbols and colours. A link to a song or video per card (YouTube, Spotify …) that only plays after you tap it.',
      'Reviews: “Trend & highlights” for 7, 30 and 90 days – calmest and most strenuous day, difficult moments and what you used most.',
    ],
  },
  {
    id: '2026-routinen-und-tagesrahmen',
    date: '2026',
    items: [
      'Neu: „Routinen & mein Garten“ unter Ressourcen. Du baust Routinen aus kleinen Karten (ein Schritt, Symbol oder Foto, optional Timer, Garten oder Ressource), spielst sie Karte für Karte ab und wischst jede fertige Karte nach rechts. Am Ende tanzt das Wesen, und die Dauer wird für den Rückblick festgehalten.',
      'Neu: „Den Tag beginnen“ am Morgen und „Tag abschließen“ am Abend – eine ruhige Einladung mit dem Wesen, mit Kreuz wegklickbar und in den Einstellungen anpassbar. Erledigtes wird grün.',
      'Garten: „Alternative für …“ (eine alte Schutzstrategie) und „Belohnung nach x Tagen“. Schutzstrategien haben neue Fragen und zeigen deine Einträge direkt auf der Seite.',
      'Am Ende des Check-ins wirst du sanft gefragt, ob du noch ein Medikament eintragen, eine Routine starten oder etwas im Garten wachsen lassen möchtest. Im Zugang gibt es immer „Ich will eine Routine machen“. „Eine andere“ beim Erinnern des Wesens zeigt jetzt wirklich eine andere.',
    ],
    itemsEn: [
      'New: “Routines & my garden” under Resources. You build routines from small cards (one step, symbol or photo, optionally a timer, garden or resource), play them card by card and swipe each finished card to the right. At the end the companion dances and the duration is kept for the review.',
      'New: “Begin the day” in the morning and “Close the day” in the evening – a calm invitation with the companion, dismissible with the cross and adjustable in settings. What is done turns green.',
      'Garden: “Alternative for …” (an old protection strategy) and “reward after x days”. Protection strategies have new questions and show your entries right on the page.',
      'At the end of the check-in you are gently asked whether you would like to log a medication, start a routine or let something grow in the garden. Zugang always has “I want to do a routine”. “Another one” on the companion’s reminder now really shows another one.',
    ],
  },
  {
    id: '2026-aufgeraeumt-und-passender',
    date: '2026',
    items: [
      'Neu in den Einstellungen: „Ich kenne mich aus – weniger Hinweistexte“. Das blendet die vielen kleinen Erklär- und Beispielzeilen aus. Info-Texte und Fragezeichen bleiben.',
      'Das Wesen ist von Anfang an das „Verlässliche“ und lässt sich auf dem Handy flüssiger verschieben.',
      'Vorgespeicherte Skills und Brücken haben jetzt passende gezeichnete Bilder in den Stresstoleranz-Farben. Beim Teilen reisen Bild, Beschreibung und alle Angaben mit.',
      'Hilfsmittel erscheinen auch, wenn du mehr Energie hast, als sie brauchen. Im Zugang ist „Wie versucht mein System gerade, Sicherheit herzustellen?“ jetzt sortiert. Das Sicherheitsnetz zeigt Beispiele klar als Beispiele (alle auf einmal löschbar), und die Denkmaschine hat ein sinnvolles Beispiel.',
    ],
    itemsEn: [
      'New in settings: “I know my way around – fewer hint texts”. It hides the many small explanation and example lines. Info texts and question marks stay.',
      'The companion is the “Reliable” one from the very start and moves more smoothly on the phone.',
      'Pre-saved skills and bridges now have fitting drawn pictures in the stress-tolerance colours. When sharing, picture, description and all details travel along.',
      'Aids also show when you have more energy than they need. In Zugang, “How is my system trying to create safety right now?” is now sorted. The safety net marks examples clearly as examples (deletable all at once), and the thought machine has a meaningful example.',
    ],
  },
  {
    id: '2026-etwas-melden',
    date: '2026',
    items: [
      'Danke, dass du „von mir aus“ testest! Wenn dir etwas auffällt, kannst du es jetzt anonym melden: Einstellungen → Test-Version → „Etwas melden“ (ca. 1 Minute, alles freiwillig).',
    ],
    itemsEn: [
      'Thank you for testing “von mir aus”! If something stands out you can now report it anonymously: Settings → Test version → “Report something” (about 1 minute, everything optional).',
    ],
  },
  {
    id: '2026-sicherheitsplan-angaben-pdf',
    date: '2026',
    items: [
      'Sicherheitsplan: Er sieht jetzt aus wie der Rest der App (kein eigener Nachtmodus mehr). Jeder Abschnitt hat ein als „Beispiel“ markiertes, löschbares oder übernehmbares Beispiel – Beispiele kommen nie ins PDF.',
      'Neu, ganz oben und freiwillig: „Meine Angaben“ (Name, Geburtsdatum, Adresse, Medikamente – auch aus der Medikamenten-Seite übernehmbar, Allergien, Diagnosen, Notfallkontakte, Krankenkasse, GdB, Haustiere) und „Klinikaufenthalt & Behandlung“ mit deinen Wünschen zu Behandlung und Unterbringung.',
      'Teilen & PDF: Du wählst für jeden Plan einzeln, was mitkommt – Plan, Angaben, Klinik-Teil, einzeln oder zusammen. Im PDF steht nur, was ausgefüllt ist. Außerdem fehlten im PDF bisher die Abschnittsüberschriften; das ist behoben.',
    ],
    itemsEn: [
      'Safety plan: it now looks like the rest of the app (no separate night mode any more). Every section has an example marked “Example” that you can delete or keep – examples never go into the PDF.',
      'New, at the top and optional: “My details” (name, date of birth, address, medication – can be taken over from the medication page, allergies, diagnoses, emergency contacts, insurance, GdB, pets) and “Hospital stay & treatment” with your wishes for treatment and placement.',
      'Share & PDF: for each plan you choose separately what goes along – plan, details, hospital part, alone or together. The PDF only shows what is filled in. The PDF was also missing the section headings before; that is fixed.',
    ],
  },
  {
    id: '2026-links-briefe-safari',
    date: '2026',
    items: [
      'Skills, Hilfsmittel, Orte und Aktivitäten können jetzt einen Link (Song, Route, Pinterest, Film …) und ein eigenes Bild haben. Orte und Aktivitäten haben eigene, passende Beschriftungen.',
      'Etwas von jemandem erhalten: Link kopieren und in der App einfügen (auf dem iPhone landet Antippen im Browser). Geteiltes erscheint als „X hat dir … geschickt – als Idee“, du entscheidest, ob du es speicherst.',
      'Briefe: „Meine Briefe“ steht im Tagebuch gleichberechtigt neben Einträgen und Tagesrückblick. Briefe von anderen heißen „Brief von … an dich“ und stehen getrennt von denen an dich selbst.',
      'Kalender zeigt Uhrzeit und Titel in der Kachel. Aus dem Wartezimmer geplante Termine bekommen danach Rückblick und die Wahl: nächster Termin oder zurück ins Wartezimmer.',
      'Einstellungen: Datenschutz nur noch einmal, Erinnerungen sagen, wofür sie sind, Hinweise können Klang und Vibration zugleich. „Was kann ich alles?“ des Wesens ist aktualisiert.',
    ],
    itemsEn: [
      'Skills, tools, places and activities can now have a link (song, route, Pinterest, film …) and your own picture. Places and activities have their own fitting labels.',
      'Receiving something from someone: copy the link and paste it in the app (on iPhone tapping lands in the browser). Shared things show as "X sent you … – as an idea", you decide whether to save it.',
      'Letters: "My letters" sits in the diary next to entries and daily review. Letters from others are called "Letter from … to you" and are kept apart from those to yourself.',
      'The calendar tile shows time and title. Appointments planned from the waiting room get a review afterwards and the choice: next appointment or back to the waiting room.',
      'Settings: privacy only once, reminders say what they are for, hints can use sound and vibration together. The companion\'s "What can I do?" is updated.',
    ],
  },
  {
    id: '2026-installieren-startseite-ruhiger',
    date: '2026',
    items: [
      'Gleich nach der Vorstellung des Wesens zeigt dir die App Schritt für Schritt, wie du sie auf den Startbildschirm holst – für iPhone/iPad, Android und Computer. Später findest du die Anleitung unter Einstellungen → Test-Version.',
      'Die Startseite ist ruhiger: oben nur der Krisenmodus, dann das Wesen und „Kurz einchecken“. Es erscheint immer nur ein Hinweis auf einmal (der Rest wartet im Postfach), und Kalender, Parkbox, Medikament und Helfermodus stehen gemeinsam unter „Alltag“.',
    ],
    itemsEn: [
      'Right after meeting your companion the app shows you step by step how to put it on your home screen – for iPhone/iPad, Android and computer. Later you find the guide under Settings → Test version.',
      'The start page is calmer: only the crisis mode at the top, then the companion and "Quick check-in". Only one notice appears at a time (the rest waits in the Postfach), and calendar, parking box, medication and helper mode sit together under "Everyday".',
    ],
  },
  {
    id: '2026-parkbox-nurjetzt-kern',
    date: '2026',
    items: [
      'Neu: „Verbindliche Parkbox & Wartezimmer“. Schreib Zettel, die in eine sichere Box fliegen – du bist für heute entlastet. Im Wartezimmer warten Ideen, Projekte und Wünsche auf einem festen Platz; mit „Einen Zeitraum zuordnen“ landen sie im Kalender.',
      '„Nur jetzt“ ist jetzt wirklich minimal: sechs große Türen, nichts sonst. Skills, Ressourcen und Brücken gibt es als je drei kleine Vorschläge.',
      'Die Anleitung zeigt zuerst nur den Kern (10 Schritte). Danach entscheidest du: Zusatzfunktionen erklärt bekommen, gleich ausprobieren oder später – jederzeit in den Einstellungen.',
      'Briefe an andere Menschen sind klarer erklärt (3 Schritte, „So geht es jetzt weiter“), du kannst eine Kopie für dich behalten, und ein geöffneter Link geht nicht mehr verloren. Neu: Sicherungs-Erinnerung, Installations-Tipp und eine Rückmelde-Vorlage in den Einstellungen.',
    ],
    itemsEn: [
      'New: "Binding Parking Box & Waiting Room". Write notes that fly into a safe box – you are relieved for today. In the waiting room ideas, projects and wishes wait in a fixed seat; "Assign a time period" puts them in the calendar.',
      '"Only now" is now really minimal: six big doors, nothing else. Skills, resources and bridges come as three small suggestions each.',
      'The guide first shows only the core (10 steps). Then you decide: have the extras explained, try them right away, or later – any time in the settings.',
      'Letters to other people are explained more clearly (3 steps, "What happens now"), you can keep a copy for yourself, and an opened link is no longer lost. New: backup reminder, install tip and a feedback template in the settings.',
    ],
  },
  {
    id: '2026-tour-zum-durchspielen',
    date: '2026',
    items: [
      'Die Anleitung ist jetzt eine Tour zum Durchspielen: 43 Stationen, jede öffnet die echte Seite, erklärt wozu sie gut ist und gibt dir eine kleine Aufgabe – z. B. die erste Ressource anlegen, eine Brücke bauen, jemanden ins Netzwerk eintragen.',
      'Die Tour merkt von selbst, wenn du etwas angelegt hast, und macht nach einem Neustart genau dort weiter, wo du warst. Sie wird einmal ganz durchgegangen; mit „Einklappen“ kannst du die Karte zur Seite schieben.',
    ],
    itemsEn: [
      'The guide is now a tour to play through: 43 stations, each opens the real page, explains what it is good for and gives you a small task – e.g. add your first resource, build a bridge, enter someone in the network.',
      'The tour notices by itself when you created something and continues exactly where you were after a restart. It is gone through once completely; with "Fold" you can push the card aside.',
    ],
  },
  {
    id: '2026-uebersicht-datenschutz-lebendig',
    date: '2026',
    items: [
      '„Nicht sicher, was gerade passt?“ zeigt jetzt alles, was die App kann – nach „Was brauchst du gerade“ in Bereiche sortiert, jeder Eintrag zum Ausklappen mit Beschreibung und „Öffnen“.',
      'Datenschutz: In den Einstellungen gibt es eine eigene Seite, die verständlich erklärt, wie die App mit deinen Daten umgeht (alles bleibt auf deinem Gerät, was online passiert, was beim Teilen zu beachten ist).',
      'Skills, Aktivitäten, Ressourcen und Brücken erscheinen überall mit Farbe und Bild – auch in Zugang, Sicherheitsplan, Favoriten, Skillketten und im Rückblick.',
      'Orientierung, die du durchgemacht hast, steht jetzt im Tagesrückblick. Im Kalender ist „will ich / soll ich“ klarer: ein Schildchen pro Eintrag. Der Funken-Ton im Lauf mit dem Wesen kommt schneller.',
    ],
    itemsEn: [
      '"Not sure what fits right now?" now shows everything the app can do – sorted into "What do you need right now" areas, each entry expandable with a description and "Open".',
      'Privacy: Settings has its own page that explains in plain words how the app handles your data (everything stays on your device, what happens online, what to keep in mind when sharing).',
      'Skills, activities, resources and bridges now appear everywhere with colour and picture – also in Access, safety plan, favourites, skill chains and the review.',
      'Orientation you went through now appears in the daily review. In the calendar "I want to / I should" is clearer: one tag per entry. The spark sound in the run with the companion is quicker.',
    ],
  },
  {
    id: '2026-briefe-teilen-schmuggel-popup',
    date: '2026',
    items: [
      'Briefe an andere: Unter „Brief an mich“ kannst du jetzt einen Brief an jemanden schicken. Er steckt in einem Link oder einer Datei (ohne Server), die andere Person legt ihn in ihre App – und er geht bei ihr zu der Uhrzeit auf, die du eingestellt hast. Mit genauer Schritt-für-Schritt-Anleitung für beide Seiten.',
      'Liebevoller Störsender: Bei „Okay, mach ich“ schließt sich nichts mehr – dein Wesen tanzt weiter („Juhu, wir tun jetzt …“), bis du auf „Weiter“ oder das Kreuz tippst.',
      '10 Sekunden Schmuggel: Das Wesen fragt dich manchmal über den Tag („Los?“) – höchstens dreimal, zwischen 9 und 20 Uhr, in den Einstellungen abschaltbar.',
      'Neue freche Texte für Störsender und Schmuggel (Tee, Sofa, Vögel, Decken-Burrito, T-Rex, Maulwurf …).',
    ],
    itemsEn: [
      'Letters to others: under "Letter to myself" you can now send a letter to someone. It sits inside a link or file (no server), the other person puts it into their app – and it opens for them at the time you set. With a detailed step-by-step guide for both sides.',
      'Loving interrupter: "Okay, doing it" no longer closes anything – your companion keeps dancing ("Yay, we are doing this now …") until you tap "Go on" or the cross.',
      '10-second smuggle: the companion sometimes asks you during the day ("Go?") – at most three times, between 9 am and 8 pm, can be switched off in the settings.',
      'New cheeky texts for interrupter and smuggle (tea, sofa, birds, blanket burrito, T-rex, mole …).',
    ],
  },
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
