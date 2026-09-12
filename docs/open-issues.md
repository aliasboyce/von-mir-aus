# Von mir aus — Laufende Open-Issues-Liste

**Zuletzt aktualisiert nach:** "Nicht vollständig umgesetzte Punkte nacharbeiten" — gezielte Nacharbeit + systematischer Abgleich mit der gesamten bisherigen Anforderungshistorie.

---

## ✅ ERLEDIGT (diese Runde)

**Priorität 1 — Zentrierung:**
- Wichtigster Fund: Das Wesen hatte `transformOrigin: 'bottom right'` beim Skalieren — bei zentrierten Ansichten (Begrüßung, Intro, Home-Hero) verschob das die sichtbare Position spürbar, obwohl der Container technisch korrekt zentriert war. Aus der `size`-Prop abgeleitet behoben (large=center, small=eckenverankert für das schwebende Wesen)
- Alle betroffenen Textblöcke von implizitem Flex-Verhalten auf robustes `w-full max-w mx-auto` umgestellt

**Priorität 2 — Tageskurve:**
- Zustandsauswahl war tatsächlich nur drei Listen-Buttons — neue `ZoneSpectrum`-Komponente mit Farbverlauf und charakteristischen Wellenformen pro Zustand
- Fehlenden Abschnitt "Wie nutze ich das im Alltag?" ergänzt

**Priorität 3 — Garten:**
- Von 5 auf 9 strukturell unterschiedliche Pflanzenstile (3 echte Blütenarten: Rose/Gänseblümchen/Mohn, 3 echte Baumformen: rund/schlank/ausladend)
- Auswahl-Vorschauen deutlich vergrößert (104×116px), in voller Blüte gezeigt
- Saubere Rückwärts-Kompatibilität für bestehende gespeicherte Gärten

**Priorität 4 — Wortspiele:**
- Jedes einzeln verifiziert — ein tatsächlich defekter Eintrag gefunden (Reimwort ohne funktionierende Lösung) und neu geschrieben, mehrere neue Kategorien ergänzt (fehlender Buchstabe, Gegenteile, Wortketten)

**Priorität 5 — Witze:**
- Fast alle vorherigen waren reine Wortspiele — neue Sammlung mit echter Vielfalt (Beobachtungshumor, Selbstironie, überraschende Fakten, trockener Humor)

**Priorität 6 — Kuriose Fakten:**
- Vier neue, breit recherchierte Fakten mit echten Quellen (Oktopus-Farbenblindheit, Milchstraßen-Duft, Sprachen ohne exakte Zahlen, zitronenförmiger Mond)

**Priorität 7 — Systematischer Abgleich:**
- **Echter Fund:** "Quellen" (Lesezeichen) hatte Teilen, aber keinen PDF-Export — jetzt ergänzt, gleiches Muster wie bei Ressourcen/Brücken/Sicherheitsplan/Medi-Log
- Verifiziert (kein Fund, bereits korrekt): Notfallnummern ausklappbar + Schnellhilfe-Nachricht existieren bereits im Sicherheitsplan, Nummern gegen aktuelle Recherche (Stand Juni 2026) geprüft und bestätigt korrekt
- Verifiziert: Wesen-Dopplungs-Schutz weiterhin intakt

## 🐛 BEHOBENE BUGS

- Wesen-Skalierungs-Ursprung bei zentrierten Ansichten (Priorität 1)
- Defektes Reimwort-Wortspiel (Priorität 4)
- Fehlender PDF-Export bei Quellen (Priorität 7)

## 🟠 TEILWEISE UMGESETZT

- **Garten-Wachstumsanimationen** (neuer Tag, neue Blätter/Blüten, Meilensteine) — die strukturelle/visuelle Vielfalt ist fertig, dedizierte kleine Animationen beim Übergang zwischen Stufen wurden in dieser Runde aus Zeitgründen zurückgestellt

## ❌ NOCH OFFEN

- Garten-Wachstumsanimationen (siehe oben)
- Der systematische Abgleich der Checkliste wurde gezielt an mehreren Hochrisiko-Stellen geprüft (Notfallnummern, Wesen-Dopplung, Quellen-PDF), aber nicht jeder einzelne der über 80 Checklisten-Punkte wurde in dieser Runde nochmals einzeln nachgewiesen — bei so vielen Punkten über so viele Sitzungen hinweg ist ein Restrisiko einzelner, noch nicht wiederentdeckter Lücken ehrlich nicht auszuschließen

## 🧠 NOCH ZU ENTSCHEIDEN

- Push-Benachrichtigungen — weiterhin bewusst zurückgestellt, braucht einen Server
- Echte KI-Bildsuche für Vorschlagsbilder — würde einen bezahlten API-Schlüssel erfordern
- Bekannte kleine Nuance: untere Navigation markiert bei Ressourcen weiterhin "Entdecken" als aktiv

## 📌 SPÄTERE IDEEN (bewusst nicht umgesetzt)

- App-Logo entwickeln und auf der Startseite integrieren
- Wochenrückblick weiter verschönern/personalisieren
- Eigenes Zugangsrad-Konzept integrieren
- Konkretere Abfragen zu Gefühlen, Körperwahrnehmung, Impulsen
- Zitat des Tages / Frage des Tages

## 💡 SELBSTSTÄNDIG VERBESSERT

- Bei der Zentrierung: die eigentliche Ursache (Skalierungs-Ursprung des Wesens) gefunden, statt nur weitere CSS-Klassen zu setzen — verbessert automatisch mehrere Seiten gleichzeitig (Begrüßung, Intro, Home)
- Bei den Wortspielen: JEDES einzeln Buchstabe für Buchstabe nachgerechnet statt nur oberflächlich durchgesehen — der defekte Eintrag wäre sonst übersehen worden
- Beim systematischen Abgleich: gezielt nach Notfallnummern gesucht, obwohl nicht explizit als "fehlend" gemeldet — bei einer trauma-informierten App ein besonders wichtiger Bereich zur eigenständigen Prüfung. Ergebnis diesmal: bereits korrekt vorhanden, mit aktueller Recherche gegengeprüft statt blind vertraut

## 📋 GESAMT-OPEN-ISSUES-LISTE

Siehe "Noch offen", "Noch zu entscheiden" und "Spätere Ideen" oben für die vollständige aktuelle Liste.

## ➡️ EMPFOHLENE NÄCHSTE SCHRITTE

1. **Echter Test auf einem physischen Smartphone** — besonders wichtig diesmal für: die Zentrierungs-Korrekturen (Begrüßung, Intro, Wetter-Seite), die neue Zustands-Auswahl bei der Tageskurve, den erweiterten Garten mit 9 Pflanzenstilen
2. Den vollständigen User-Flow einmal bewusst langsam durchklicken: Start → Anleitung → Inner Weather → Wo bist du gerade → Bedürfnisse → Ressourcen → Brücken → Entdecken → Tagebuch → Medi-Log → Sicherheitsnetz → Sicherheitsplan — und dabei gezielt auf die in der Anfrage genannten Detailprobleme achten (abgeschnittene Texte, Überlappungen, doppelte Wesen, Scrollprobleme)
