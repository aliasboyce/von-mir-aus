# Begleiter — vollständige Content-Liste

Diese Liste ist die separate, strukturierte Übersicht, die zusätzlich zu
`docs/companion-dialogue-table.md` gewünscht wurde. Sie ist nach **Seite →
Situation** gegliedert, mit Zweck, Wortlaut, Kategorie und Alternativ-Sätzen
pro Zeile. Die tatsächliche Quelle bleibt `src/components/companion/companionRegistry.ts` —
diese Datei hier ist die lesbare, redaktionelle Sicht darauf.

## Redaktionelle Prüfung (wie gewünscht)

Alle bisherigen Sätze wurden auf Widersprüche, Wiederholungen, unnatürliche
Formulierungen und unpassende/bevormundende Aussagen durchgesehen:

- **Keine inhaltlichen Widersprüche gefunden.** Der Ton ist über alle Seiten
  hinweg konsistent: einladend, nie fordernd, nie diagnostisch.
- **Bewusste Wiederholung, keine versehentliche:** Es gibt sowohl globale
  Feedback-Sätze ("Alles gespeichert.") als auch seitenspezifische ("Eintrag
  gespeichert.", "Person gespeichert."). Das ist beabsichtigt — es sorgt für
  Abwechslung, ohne dass die spezifischere Aussage verloren geht.
- **Keine Ferndiagnosen:** Alle Sätze sprechen nur über die App/den
  Begleiter selbst oder stellen offene Fragen — nie Behauptungen über den
  inneren Zustand des Nutzers ("Ich merke, du bist gerade angespannt" o. ä.
  kommt bewusst nicht vor).
- **Keine Befehlsform:** Durchgehend im Konjunktiv/als Angebot formuliert
  ("magst du…", "du darfst…"), nicht als Anweisung ("Atme jetzt tief durch!").

## Wann sagt der Begleiter *nichts*?

Siehe `docs/companion-dialogue-table.md`, Abschnitt "Wann schweigt der
Begleiter bewusst?" — dort stehen alle sechs Regeln im Detail (max. 1x pro
Seite/Sitzung automatisch, nie bei offenem Bearbeitungsfenster, nie doppelt
auf der Startseite, jeder Hinweis aktiv schließbar, nichts bei
ausgeschaltetem Begleiter, nichts im Schlafzustand).

---

## Startbildschirm (`/`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch der Sitzung | Ankommen lassen, ohne Erwartungsdruck aufzubauen | „Schön, dass du da bist." | Einführung | „Hallo. Ich bin hier, ganz in deinem Tempo." |
| Wiederholter Besuch | Vertrautheit signalisieren, ohne aufdringlich zu sein | „Da bist du ja. Kein Grund zur Eile." | Einführung | „Willkommen zurück." |
| Erster Besuch, ergänzend | Klarstellen: die App verlangt nichts | „Du musst hier nichts leisten — nur schauen, was gerade da ist." | beruhigend | — |
| Gelegentlich, im Leerlauf | Sanfte Erinnerung an die niedrigschwelligste Funktion | „Ein kleiner Check-in reicht schon." | Tipp | — |
| Gelegentlich, im Leerlauf | Autonomie betonen | „Kein Druck. Du entscheidest, was du gerade brauchst." | beruhigend | — |
| Tageszeit/Wetter/Wochenende (~45 % der Besuche) | Das Gefühl vermitteln, der Begleiter „lebt mit" | z. B. „Guten Morgen. Ich bin schon wach." / „Es regnet draußen — auch ein guter Grund, es sich drinnen gemütlich zu machen." | positiv/beruhigend | siehe `homeCompanionLines.ts` — je 2–3 Sätze pro Tageszeit, Wochenende, Wetterlage |

## Inner Weather / „Wo bist du gerade?" (`/inneres-wetter`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Angstfreiheit vor „falscher" Antwort nehmen | „Es gibt kein falsches Wetter." | beruhigend | — |
| Erster Besuch | Auf die Möglichkeit hinweisen, den Schritt zu überspringen | „Du kannst jederzeit überspringen." | Anleitung | — |
| Leerlauf | Tempo-Druck herausnehmen | „Nimm dir die Zeit, die es braucht — auch wenn das eine Sekunde ist." | beruhigend | — |
| Check-in-Aufforderung | Einladung, nicht Aufforderung | „Magst du kurz schauen, wie es dir gerade geht?" | Kontext | — |
| Während des Check-ins | Bewertungsdruck nehmen | „Es gibt kein richtig oder falsch — nur eine Momentaufnahme." | beruhigend | — |
| Nach Abschluss des Check-ins | Anerkennung der kleinen Handlung | „Danke, dass du kurz bei dir warst." | Feedback | — |

## Brücken (`/bruecken` + Detailseite)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Level-Hierarchie entschärfen (kein „höher = besser") | „Level 1 ist genauso gültig wie Level 4." | Erklärung | — |
| Level auswählen | Gegen Leistungsdenken bei der Auswahl | „Wähle das, was sich gerade richtig anfühlt, nicht das, was am meisten bringt." | Tipp | — |
| Level auswählen | Auf Reversibilität hinweisen | „Du kannst jederzeit ein anderes Level wählen." | Anleitung | — |
| Neue Brücke erstellen | Größenordnung einordnen | „Eine Brücke ist ein kleiner Schritt, kein Sprung." | Erklärung | — |
| Bestehende Brücke bearbeiten | Bearbeiten normalisieren, nicht als „Korrektur" framen | „Deine Brücke darf sich verändern, so wie du dich veränderst." | Ermutigung | — |
| Nach dem Bearbeiten speichern | Kurzes, neutrales Feedback | „Änderung gespeichert." | Feedback | — |
| Neue Brücke speichern | Bestätigung | „Deine Brücke ist gespeichert." | Feedback | — |

## Entdecken – Übersicht (`/entdecken`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Einordnen, wofür der Bereich da ist | „Hier findest du Dinge, die dir sonst schwerer zugänglich sind." | Einführung | — |
| Leerlauf | Veränderbarkeit betonen | „Nichts hier ist in Stein gemeißelt — alles darf sich verändern." | beruhigend | — |

## Ressourcen (`/entdecken/ressourcen`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Abgrenzung zu Brücken erklären | „Ressourcen sind Dinge, die dir selbst Halt geben. Brücken sind kleine Schritte, die dich von hier zu etwas anderem hinführen." | Erklärung | über den Info-Button jederzeit erneut abrufbar |
| Leerlauf | Konkretes Beispiel, Schwelle senken | „Auch ein einzelnes Lied kann eine Ressource sein." | Tipp | — |
| Leerlauf | Funktion sichtbar machen | „Favoriten helfen dir, schnell zurückzufinden." | Funktionshinweis | — |
| Neue Ressource speichern | Bestätigung | „Ressource gespeichert." | Feedback | — |
| Bestehende Ressource bearbeiten | Bestätigung | „Änderung gespeichert." | Feedback | — |
| Ressource ansehen/auswählen | Kleine Anerkennung | „Schön, dass du das entdeckt hast." | Feedback | — |

## Zugangsrad / „Was ist greifbar?" (`/entdecken/zugangsrad`)

*(Konzept aktuell zurückgestellt — Sätze unten sind der bestehende Stand, unverändert.)*

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Selbstwertkritik vorbeugen | „Nicht zugänglich bedeutet nicht verschwunden." | Erklärung | — |
| Leerlauf | Auf tägliche Veränderbarkeit hinweisen | „Die Regler dürfen sich täglich verschieben." | Anleitung | — |
| Leerlauf | Zur Verknüpfung mit Ressourcen/Brücken anregen | „Verknüpfe hier etwas Konkretes, das dir hilft, wenn dieser Bereich sich fern anfühlt." | Tipp | — |

## Bedürfnis-Kompass (`/entdecken/beduerfnis-kompass`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Wahrnehmung selbst als Erfolg würdigen | „Ein Bedürfnis zu erkennen ist schon ein wichtiger Schritt." | Ermutigung | — |
| Leerlauf | Gegen Schwarz-Weiß-Denken bei Bedürfniserfüllung | „Es gibt meist mehr als einen Weg, ein Bedürfnis zu erfüllen." | Erklärung | — |
| Bedürfnis auswählen | Zum Weiterdenken einladen, ohne zu drängen | „Gut erkannt. Magst du schauen, was das gerade für dich bedeutet?" | Feedback | — |

## Tageskurve (`/entdecken/tageskurve`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Perfektionsdruck beim Tracking nehmen | „Ein Punkt reicht — du musst nicht den ganzen Tag tracken." | beruhigend | — |
| Leerlauf | Erwartungen an sichtbare Muster relativieren | „Muster zeigen sich erst mit der Zeit, das ist normal." | Erklärung | — |
| Eintrag loggen | Kurzes, unaufdringliches Feedback | „Gespeichert." | Feedback | — |

## Sicherheit – Übersicht (`/sicherheit`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Schutzraum-Charakter betonen | „Das hier ist dein privater, geschützter Bereich." | Einführung | — |
| Leerlauf | Kontrolle beim Nutzer belassen | „Du bestimmst, was hier hineinkommt." | beruhigend | — |

## Netzwerk (`/sicherheit/netzwerk`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Frei-Anordnen als Feature erklären | „Du kannst die Knoten frei anordnen, wie es sich stimmig anfühlt." | Anleitung | — |
| Leerlauf | Begriff „Kontakt" erweitern (nicht nur Personen) | „Auch Orte oder Lieblingslieder dürfen hier rein." | Tipp | — |
| Kontakt hinzufügen/speichern | Bestätigung | „Person gespeichert." | Feedback | — |
| Kontakt bearbeiten | Bestätigung | „Änderung gespeichert." | Feedback | — |
| Verbindung löschen | Bestätigung, neutral (nicht wertend) | „Verbindung gelöscht." | Feedback | — |
| Kontakt auswählen/ansehen | Kontext liefern, ohne zu unterstellen | „Diese Person hilft dir vielleicht gerade." | Kontext | — |

## Sicherheitsplan (`/sicherheit/plan`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Abgrenzung zu klinischen Sicherheitsplänen | „Das hier ist deine Struktur für schwierige Momente — persönlich, nicht klinisch." | Einführung | — |
| Leerlauf | Statik-Angst nehmen | „Dieser Plan darf sich jederzeit verändern." | beruhigend | — |
| Leerlauf | PDF-Export sichtbar machen | „Du kannst ihn als PDF exportieren und teilen, wenn du magst." | Funktionshinweis | — |
| Warnsignal/Hilfsmittel hinzufügen | Kurzes Feedback | „Notiert." | Feedback | — |
| **3er-Grenze bei „Was mir hilft"** | Erklärt *warum* nur 3 Ressourcen/Brücken/Kontakte pro Warnstufe wählbar sind | „Ich gebe dir hier nur drei Möglichkeiten, damit du im entscheidenden Moment nicht erst aus vielen Dingen auswählen musst." | Erklärung | 2 weitere Varianten, zufällig gewählt (siehe companionLines.ts) |

## Tagebuch (`/sicherheit/tagebuch`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Privatsphäre betonen | „Ein ruhiger, privater Ort — nur für dich." | Einführung | — |
| Leerlauf | Privatsphäre nochmals konkret bekräftigen | „Niemand liest hier mit außer dir." | beruhigend | — |
| Leerlauf | Einstiegshürde senken | „Auch ein einziger Satz zählt als Eintrag." | Ermutigung | — |
| Eintrag speichern | Bestätigung | „Eintrag gespeichert." | Feedback | — |

## Lesezeichen (`/entdecken/lesezeichen`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Charakter als „Quellenbibliothek", nicht Bookmark-Tool | „Ein ruhiger Ort für Dinge, die dir wichtig waren oder wichtig werden könnten." | Einführung | — |
| Quelle speichern | Bestätigung | „Quelle gespeichert." | Feedback | — |

## Einstellungen (`/einstellungen`)

| Situation | Zweck | Begleiter-Satz | Kategorie | Alternativen |
|---|---|---|---|---|
| Erster Besuch | Auf Wechsel-Funktion hinweisen | „Du darfst mich jederzeit gegen ein anderes Wesen tauschen." | Funktionshinweis | — |
| Beim Einstellen | Überblick über Anpassbarkeit geben | „Farbwelt, Sprache, Bewegung — alles anpassbar." | Einführung | — |

## Global (jede Seite, nur im Leerlauf, gelegentlich)

| Situation | Zweck | Begleiter-Satz (Auswahl) | Kategorie |
|---|---|---|---|
| Positive Aussage zwischendurch | Ressourcenorientierung stärken, ohne Anlass | „Du bist schon einen Schritt weiter, als du denkst." / „Dass du hier bist, ist schon etwas." / „Du kennst dich besser, als es sich manchmal anfühlt." / „Kleine Momente der Achtsamkeit summieren sich." | positiv |
| Beruhigende Aussage zwischendurch | Tempo herausnehmen | „Atme kurz durch. Ich warte hier." / „Alles darf langsamer werden." / „Du musst gerade nichts entscheiden." / „Ein Moment nach dem anderen reicht." | beruhigend |
| Humorvolle Aussage zwischendurch | Auflockerung, Beziehungsgefühl | „Ich zähl mal meine Funken. Eins, zwei… ah, verzählt." / „Falls ich gerade komisch schaue — das ist nur mein Nachdenk-Gesicht." / „Ich schwebe hier einfach mal ein bisschen rum." / „Kein Druck, aber ich find dich schon ziemlich gut." | humorvoll |
| Generisches Erfolgs-Feedback | Fallback, wenn keine seitenspezifische Zeile passt | „Gut. Weiter geht's." / „Alles gespeichert." / „Das ist notiert." / „Schön gemacht." | Feedback |

---

## Offene Punkte (ehrlich benannt)

- **Fehler-Zustand:** Es gibt aktuell keine Fehler-Sätze, weil kein
  Speichervorgang in der App sichtbar fehlschlägt (reines lokales Speichern
  ohne Netzwerk). Sollte sich das ändern, braucht es einen neuen Auslöser
  `fehler` plus 2–3 warme, nicht-technische Formulierungen
  (z. B. „Das hat gerade nicht geklappt — magst du es nochmal versuchen?").
- **Warnstufe auswählen (Gelb/Orange/Rot):** Das *Anlegen* eines Eintrags in
  einer Warnstufe löst jetzt Feedback aus ("Notiert."), aber das reine
  *Wechseln* zwischen den Farb-Reitern hat bewusst keinen eigenen Satz — das
  wäre zu häufig/aufdringlich für eine reine Navigationsaktion.
- **Zugangsrad-Sätze** bleiben unverändert, bis das Konzept dafür gemeinsam
  entschieden ist (siehe separate Konzept-Vorschläge).
