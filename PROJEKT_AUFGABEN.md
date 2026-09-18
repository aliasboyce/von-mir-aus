# von mir aus — Offene-Punkte-Liste

Diese Datei wird bei jeder Sitzung aktualisiert (siehe Abschnitt 23 des Grundsatz-Auftrags). Nichts geht verloren.

## 🔴 Noch offen / Fehler
_(aktuell keine bekannten offenen Fehler — wird laufend gepflegt)_

## 🔴 RIESIGER GESAMT-AUDIT-AUFTRAG (50 Abschnitte) - IN BEARBEITUNG, priorisierte Reihenfolge
Der Nutzer hat einen sehr umfangreichen Gesamt-Audit-Auftrag gegeben (Wert/Ressource/Bruecke/Handlung-Architektur, Bruecken-Kategorien neu, Beduerfnisse erweitern, Schutzstrategien/Hindernisse ueberarbeiten, Nervensystem-Reihenfolge, Gefuehlsrad, Denkmaschine-Persistenz, Plakatwand, Loslassen-Animationen hochwertiger, Zugang/Check-in, Rueckblick, Zugang-Bruecke-Dialog, Nur-Jetzt-Modus, Helfermodus, Wesen, "So haengt alles zusammen", Entdecken-Struktur, Reizreduktion, Responsive Design, Langzeitnutzung testen). Nutzer gab explizite PRIORITAET: Check-in/Zugang-Angleichung, Gefuehlsrad, neue Beduerfnisse, Bruecken-Kategorien, Denkmaschine-Speicherung, "So haengt alles zusammen", Reizreduktion/Struktur.

### 🟢 Abgeschlossen in dieser Session (Prioritaet 2: Gefuehlsrad):
- Ruhe/Leere-Taubheit als Gefuehlsgruppen entfernt (keine Grundgefuehle)
- Rad komplett neu gebaut: 12 farbige Gruppen, per Maus/Finger drehbar, aeusserer Ring als horizontale HTML-Pillen statt gekruemmter SVG-Segmente (strukturelle Loesung des wiederholten Sub-Pixel-Bugs)
- Farben konsistent durchgezogen: Rad -> Zugang-Gefuehlsauswahl -> Zugangsrueckblick (neue colorForFeelingWord-Rueckwaertssuche)

### 🟢 Abgeschlossen (Prioritaet 3: neue Beduerfnisse):
- Sinn & Kohaerenz, Selbstwirksamkeit, Koerperliche Unversehrtheit in BEIDEN Beduerfnis-Systemen ergaenzt (vollstaendige GFK-Liste UND vereinfachte Auswahl)
- Emoji-Konsistenz bei allen Beduerfnis-Kategorien

### 🟢 Abgeschlossen (Prioritaet 4: Bruecken-Kategorien komplett neu):
- Neue vierteilige Struktur (Intrapersonell/Interpersonell/Temporal/Transzendent, elf Unterkategorien) vollstaendig umgesetzt
- Migration bestehender Bruecken an drei Einstiegspunkten abgesichert
- ECHTER ABSTURZ gefunden und behoben (bridgeImpulses.seed.ts nutzte alte Kategorien, war nicht migriert)
- Formular zeigt neue Kategorien gruppiert, benutzerdefinierte Kategorien vollstaendig erhalten
- Alles per Screenshot verifiziert (Liste, Formular, Detailseite)

### 🟢 Geprueft (Prioritaet 5: Denkmaschine-Speicherung):
- Echter End-to-End-Test durchgefuehrt (nicht nur Code gelesen): Gedanke -> speichern -> neu formulieren -> speichern -> KOMPLETTER Seiten-Reload -> Persistenz bestaetigt korrekt
- Durchgestrichener Original + neue Formulierung bleiben nach echtem Reload erhalten
- "Eigene Notiz"-Feld nutzt denselben Persistenzmechanismus, mit hoher Zuversicht ebenfalls korrekt

### 🟢 Abgeschlossen (Prioritaet 6: "So haengt alles zusammen"):
- Vollstaendiger Abgleich gegen jede Route in App.tsx - Check-in/Tageskurve fehlte komplett (!), ebenso Timer/Favoriten/Sicherheitsplan/Kontakte/Wochenrueckblick/Entwicklung/Brief an mich/Lesezeichen/Medi-Log/Quellen
- Vier neue Gruppen ergaenzt, jeder Eintrag hat jetzt Label UND kurze Beschreibung
- Roter Faden (8 Hauptschritte) bewusst unveraendert gelassen (konzeptioneller Fluss, nicht Bildschirmliste)

### 🟢 Geprueft (Prioritaet 7: Reizreduktion/klare Struktur app-weit):
- Mehrere Bereiche (Wertekompass, ProtectionStrategies, HomePage, ExplorePage) geprueft und als bereits angemessen strukturiert bestaetigt
- Nur-Jetzt-Modus bereits vollstaendig als echter abgegrenzter Modus umgesetzt (mit Routen-Absicherung)
- Helfermodus bereits mit 16 Situationen, vollstaendigem Notfall-Dialog, Abgrenzungs-Botschaft
- Wesen-Info-Seite deckt bereits alle Themen ab inkl. Trigger-Warnung
- ECHTER FUND: "Was kann ich alles?"-Button fehlte als direkter Einstiegspunkt beim Wesen selbst - ergaenzt und verifiziert
- Diese Prioritaet ist inhaerent diffus (app-weit, viele Einzelfaelle) - weitere gezielte Pruefungen bei Bedarf in Folgesitzungen sinnvoll

### 🟢 Weitere Restliste durchgearbeitet (Punkt fuer Punkt):
- Wertekompass (Momentaufnahme-Erklaerung, Praesenz/Zufriedenheit-Tracking, ACT-Inhalte): bereits VOLLSTAENDIG aus frueheren Sitzungen vorhanden und korrekt eingebunden, verifiziert
- Schutzstrategien: ECHTER FUND - acht hilfreiche/gesunde Eintraege waren faelschlich in der Liste PROBLEMATISCHER Strategien gelandet (um Hilfe bitten, Grenzen setzen, sich bewegen etc.) - entfernt, neue Erklaerung ergaenzt warum Ressourcen/Bruecken nicht hierher gehoeren
- Interaktivitaet bei Schutzstrategien UND Hindernissen (auswaehlen/trifft nicht zu/loeschen/eigene hinzufuegen): bereits vollstaendig ueber gemeinsame DismissibleCustomList-Komponente vorhanden
- Denkmaschine-Begriffserklaerung (kein Fachbegriff, Wengenroth-Bezug): bereits vollstaendig vorhanden
- Zugang-Bruecke-Dialog (Beenden/Fortfuehren/Verwerfen): verifiziert weiterhin intakt
- Bruecke-vs-Handlung visuelle Erklaerung: verifiziert weiterhin intakt
- Plakatwand/Defusion: bereits DREI eigenstaendige Uebungen vorhanden (Plakatwand, Worte betrachten, Anker fallen lassen/ACE), jeweils in klar abgegrenzten Karten - substanziell erfuellt

### 🟢 Abgeschlossen (Navigation/Zurueck-Pfade, Quellen-Transparenz, Responsive Design - vom Nutzer hoeher priorisiert):
- ECHTER FUND behoben: Check-in -> Nervensystem -> Zurueck verlor die aufgeklappte Zustands-Zone (komponenten-lokaler State ging beim Remount verloren). Jetzt ueber URL-Parameter (?zone=...) persistiert, per echtem Vorher-Nachher-Test bestaetigt
- System-Karte -> Unterseite -> Zurueck bereits korrekt (verifiziert)
- Quellen-Transparenz: Helfermodus hatte als einzige auffaellige Luecke keine Quellenangabe - zwei echte Quellen recherchiert (BBK ANKER/ERDEN-Methoden, IFRC-Leitfaden) und ergaenzt
- Responsive Design bei Desktop-Breite (1440px) getestet: Startseite/Nervensystem/Formular-Modal alle einwandfrei
- ECHTER FUND behoben: Gefuehlsrad-Textueberlauf bei drei einzelwoertigen langen Labels (Gleichgueltigkeit, Hoffnungslosigkeit, Unzufriedenheit) - neue Wortumbruch-Logik ergaenzt, per Nahaufnahme verifiziert
- Maus-Dreh-Interaktion des Rads gruendlich verifiziert (erst scheinbarer Fehler, dann als Testartefakt entlarvt und mit korrektem Test bestaetigt: funktioniert praezise)

### 🟢 STABILITAETS-PRUEFUNG vor dem Testphasen-Start (auf Nutzerwunsch priorisiert):
- Vollstaendiger Zugang-Durchlauf per echtem Puppeteer-Test (Zustand->Anspannung->Gefuehl->Schutzstrategie->Beduerfnis->Hindernis->Bruecke): ZERO Fehler, Bruecken-Kategorien zeigen korrekt in der Auswahl
- Ressourcen-Fotofunktion live verifiziert: Foto-Karussell, Neue-Vorschlaege, Eigenes-Bild-Hochladen alle intakt (leere Bilder im Test nur wegen blockierter externer Domains in der Sandbox, kein App-Fehler)
- GROSSER Langzeitnutzungs-Stresstest: 150 Zugang-Eintraege + 300 Anspannungs-Eintraege + 50 Denkmaschine-Notizen (simuliert ~60 Tage Nutzung) in alle relevanten Seiten geladen - ZERO Fehler, alle Seiten laden in ~1.2 Sekunden, Rueckblick zeigt Suchleiste und korrekte Sortierung, lange Texte werden sauber umgebrochen, Wochenrueckblick zaehlt Eintraege korrekt (18x bei 7 Tagen, exakt passend zur Datenverteilung)
- Dabei einen eigenen Testfehler gefunden und korrigiert: erste Injektion nutzte falsche localStorage-Schluessel (echte Schluessel sind 'zugang-entries'/'tension-entries'/'glaubenssaetze', nicht die Kurzformen) - nach Korrektur alles bestaetigt funktionierend

### 🟢 UEBERSEHENE PUNKTE gefunden und behoben (Nutzer entdeckte beim eigenen Testen):
1. Wesen-Name in eigener Schriftart (Quicksand/Baloo 2, vorher ungenutzt geladen) - auf allen 4 Anzeigestellen
2. Nur-Jetzt-Modus genauso deutlich wie Krisenmodus (echter Button mit Rahmen statt blasser Text)
3. "Kurz einchecken" pulsiert jetzt auch nach bereits erfolgtem Check-in (Bedingung faelschlich versteckte es)
4. Gefuehlsfarbe auch auf der Gefuehle-Seite selbst (Detailkarten unter dem Rad), nicht nur in Zugang/Rueckblick
5. WICHTIGSTER FUND: Anspannungsskala fehlte in der Haupt-Check-in-Karte komplett - lebte nur getrennt in "Meine Spannung" (Modal). Jetzt direkt mit der Zustandsauswahl in einer Karte vereint, exakt wie im Zugang, inkl. gleicher Regenbogenfarben. PolyvagalCheckIn um tensionValue erweitert
6. Check-in-Zustandsauswahl auf PolyvagalPage.tsx (Tageskurve) nutzte noch die alte gedaempfte Aufklapp-Karten-Optik statt des bunten EXTENDED_STATE_GROUPS-Rasters - umgebaut, alte reichhaltige Zonendetails als "Mehr erfahren" erhalten
7. GROESSTER FUND: die eigentliche von der Startseite aus erreichte Check-in-Seite ist /inneres-wetter (InnerWeatherPage.tsx), NICHT /entdecken/tageskurve! Diese hatte eine komplett eigene, aeltere Umsetzung mit getrennten Zone/Spannungs-Schritten und einem einfachen HTML-Regler. Grundlegend umgebaut: beide Schritte zusammengefuehrt, identische TensionScale + EXTENDED_STATE_GROUPS-Farbraster wie ueberall sonst. Per echtem Klick-Durchlauf von der Startseite verifiziert (nicht nur direkte URL)
8. "Zu deinem inneren Kind"-Bruecken-Kategorie umbenannt zu "Zu deinem Innenleben" (Du-Anrede beibehalten fuer Konsistenz), DE+EN, keine weiteren Erwaehnungen irgendwo gefunden

### 🔴 KRITISCHER APP-WEITER FUND UND BEHOBEN (Loslassen-Animation-Untersuchung fuehrte dazu):
Beim genaueren Pruefen der Loslassen-Animationen (vom Nutzer als "gravierendes Problem" markiert) zeigte sich: die eigentlichen Papier-Animationen waren bereits qualitativ gut (gross, interaktiv per Drag). Das eigentliche Problem lag tiefer: "fixed inset-0"-Overlays wurden NICHT relativ zum echten Bildschirm positioniert, sondern relativ zur Hoehe des jeweiligen Seiteninhalts.

URSACHE: sowohl .animate-in (auf praktisch jeder Seite als aeusserster Wrapper) als auch .page-transition (auf dem <main>-Element in AppShell.tsx, DAS WIRKLICH JEDE SEITE UMSCHLIESST) nutzten animation-fill-mode:both mit einer Animation die bei transform:translateY(0) endet. fill-mode:both liess diesen Transform-Wert DAUERHAFT bestehen - und jede transform-Eigenschaft ungleich 'none' macht ein Element zum Containing-Block fuer seine position:fixed-Nachkommen (CSS-Spezifikation). Gemessen: Loslassen-Overlay hatte nur 432px statt 900px Viewport-Hoehe.

Behoben durch Entfernen von transform aus beiden Keyframes (reine Opacity-Ueberblendung, gleicher visueller Effekt). Betrifft potenziell alle 16 Komponenten mit "fixed inset-0" app-weit. Nach der Behebung: Overlay-Hoehe korrekt 900px, abdunkelnder Hintergrund ueber volle Flaeche sichtbar, Papier korrekt zentriert. Breiter Regressionstest ueber 8 Seiten bestaetigt keine Nebenwirkungen.

### 🟡 WICHTIGE LEKTION fuer kuenftige Pruefungen:
Es gibt offenbar mehrere PARALLELE/AELTERE Implementierungen derselben Konzepte in der App (z.B. InnerWeatherPage.tsx vs PolyvagalPage.tsx fuer "Wo bist du gerade"). Bei kuenftigen Aenderungen IMMER pruefen: "Wohin fuehrt der Button, den ein echter Nutzer tatsaechlich klickt?" statt nur die vermeintlich richtige/neuere Seite zu aendern. Ein systematischer Grep nach doppelten/aehnlichen Konzepten (aehnliche Fragen, aehnliche State-Picker) waere sinnvoll, um weitere solche Duplikate zu finden.

### 🔴 NOCH OFFEN, als naechstes sinnvoll:
- Loslassen-Animationen: vom Nutzer explizit als "weiterhin gravierendes Problem" markiert - deutlich hochwertigere, bildschirmfuellende Falt-/Zerknuell-/Zerreiss-Transformation noetig. Groesseres Einzelvorhaben, sollte mit eigener Sitzung/Fokus angegangen werden
- Nervensystem-Seite exakte Reihenfolge nochmal gegen den neuesten Auftrag abgleichen
- Entdecken-Struktur ueberarbeiten (Verstehen/Wahrnehmen/Reflektieren/Ausprobieren/Handeln)
- Responsive Design (Tablet/Desktop/Maus) systematisch pruefen
- Langzeitnutzung/viele-Daten-Szenarien testen
- Lange-Texte-Overflow testen
- Navigation/Zurueck-Pfade systematisch pruefen
- Quellen-Transparenz erweitern

### 🔴 NOCH KOMPLETT OFFEN (in Prioritaetsreihenfolge):
1. Neue Beduerfnisse (Sinn & Kohaerenz, Selbstwirksamkeit, Koerperliche Unversehrtheit) ergaenzen + ueberall konsistent
2. Bruecken-Kategorien komplett neu (4 Hauptbereiche: Intrapersonell/Interpersonell/Temporal/Transzendent) + alle Verknuepfungen
3. Denkmaschine: neuformulierte Gedanken + Notizen dauerhaft speichern (aktuell vermutlich nur UI-State)
4. "So haengt alles zusammen" vollstaendig aktualisieren (jede Seite/Funktion, korrekte Rueck-Navigation)
5. Reizreduktion + Informations-/Funktionsstruktur app-weit (einklappbare Theorie, Verstehen/Ausprobieren/Reflektieren-Trennung)
6. Ressourcen/Bruecken-Fotofunktion: Ursache fuer wiederholten Verlust strukturell beheben (bereits mehrfach angegangen, evtl. weitere Haertung noetig)
7. Wertekompass: Momentaufnahme-Erklaerung, "wie stark lebe ich das/wie zufrieden bin ich", ACT-Inhalte
8. Schutzstrategien: positive Strategien raus, "trifft nicht zu"/loeschen/eigene hinzufuegen
9. Hindernisse: interaktiv (anklicken/bearbeiten/loeschen/eigene), Hindernis-vs-Schutzstrategie-Erklaerung
10. Nervensystem-Seite: exakte neue Reihenfolge pruefen (teilweise schon in frueheren Sessions umgesetzt, muss gegen Punkt 18 des neuen Auftrags abgeglichen werden)
11. Denkmaschine-Begriffserklaerung (kein Fachbegriff, Wengenroth-Bezug) - evtl. schon vorhanden, pruefen
12. Plakatwand/Defusion ausbauen, mehrere Uebungen
13. Loslassen-Animationen: deutlich hochwertiger, bildschirmfuellend, echte Falt-/Zerknuell-/Zerreiss-Transformation
14. Zugang-Bruecke-Dialog (Beenden/Fortfuehren/Verwerfen) - evtl. schon vorhanden, pruefen
15. Bruecke-vs-Handlung Erklaerung visuell
16. Nur-Jetzt-Modus als echter abgegrenzter Modus
17. Helfermodus: mehr Situationen, Akuter-Notfall-Button
18. Wesen: "Was kann ich alles"-Button, Schlafen-Erklaerung
19. Ablenkungen-Trigger-Warnung
20. Entdecken-Struktur ueberarbeiten
21. Responsive Design pruefen (Tablet/Desktop/Maus/Touch)
22. Langzeitnutzung/viele-Daten-Szenarien testen
23. Lange-Texte-Overflow testen
24. Navigation/Zurueck-Pfade pruefen
25. Quellen-Transparenz erweitern

## 🟢 Erledigt (grosser "Feintuning-Auftrag": Nervensystem final + Anspannungsskala-Gestaltung + alle Fs + Rueckblick - VOLLSTAENDIG abgeschlossen)
- Nervensystem-Seite final: erste Grafik entfernt, mittlerer Erregungs-Pfeil entfernt, zwei Saetze korrigiert
- Anspannungsskala neu gestaltet: fluessiger Regenbogen-Verlauf statt Farbbloecke, keine Beschreibung bei Zugang, sanfte GFK-artige Frage beim Check-in
- "Alle Fs mit dazu": Datentyp um Fine/Flood/Friend erweitert, Zustandsauswahl in Zugang UND Check-in nach drei Zonen gruppiert mit allen Zustaenden darunter (Check-in behaelt dabei die bestehenden reichhaltigen Zonendetails)
- Check-in-Seite umstrukturiert: Nervensystem-Link direkt nach Zustandsauswahl, Erklaer-Akkordeon ans Seitenende verschoben
- Zugangsrueckblick vervollstaendigt: Anspannungswert jetzt in Vorschau UND Detailansicht sichtbar
- Alle Teile per Screenshot einzeln verifiziert, mehrere echte Fehler unterwegs gefunden und behoben (verlorener Code bei Verschiebung sofort korrigiert)

## 🟢 Erledigt (grosser "Nervensystem-Detailkorrekturen + Anspannungsskala-Vereinheitlichung"-Auftrag - VOLLSTAENDIG abgeschlossen, alle drei Teile)
- Teil 1 Nervensystem-Seite: Koerper-Grafik neu gebaut, Grundlagen komplett umstrukturiert (10 aufklappbare Punkte mit exakten Nutzertexten inkl. Drei-Stufen-Tabelle), Neurozeption-Grafik repariert (Bahn zu N + Beschriftung), Farben angeglichen
- Teil 2 neue TensionScale-Komponente: drei klinische Farbzonen (gruen/orange/rot bei 0-30/30-70/70-100%), dynamischer Hinweistext, Farbverlauf-Slider. Check-in-Modal zweistufig: Anspannung dann optionale Zustandsauswahl (alle sieben Zustaende)
- Teil 3 dieselbe zweistufige Abfrage im Zugang-Schritt 2 ergaenzt, ZugangEntry/-Draft um tensionValue erweitert, Zusammenfassung zeigt Wert
- Zusatz: gespeicherte Werte in der Tagesansicht farblich gekennzeichnet, Zustands-Emoji sichtbar
- Alle Teile per Screenshot einzeln verifiziert, mehrere echte Fehler unterwegs gefunden und behoben (Pfeil-Rotation, fehlende Imports)


## 🟢 Erledigt (systematische Suche nach vergessenen Zusammenhaengen/Dopplungen)
- Nervensystem-Seiten-Untertitel korrigiert (sprach noch von "sieben Zustaenden")
- WICHTIGER FUND: zwei vollstaendig geschriebene Erklaerabschnitte auf der Tageskurven-Seite waren aus der Sektionsliste UND den TypeScript-Typdefinitionen herausgefallen, seitdem nie angezeigt - wiederhergestellt, dabei veraltete "weiter oben"-Formulierung durch echten Seitenverweis ersetzt
- Helfermodus-Uebergang zwischen interaktiver Anleitung und allgemeiner Liste geklaert (Inhalte selbst geprueft, nicht redundant)
- Bruecken-Detailseite umgeordnet: alle Verknuepfungen als Block, Mustererkennung als Abschluss - eigener Fehler (doppelter Block) sofort bemerkt und korrigiert
- Mechanisch geprueft: keine Duplikate in der Beduerfnisliste (109 Eintraege), vier natuerliche Ueberschneidungen im Gefuehlswortschatz gefunden und als unproblematisch bewertet
- Keine weiteren stale Zahlenangaben, keine Energie-Text-Reste bei Bruecken, ichJetzt-Feld weiterhin korrekt verdrahtet

## 🟢 Erledigt (Grafik-Reparatur + Zustands-Neuordnung + Gesamtanalyse - vollstaendig abgeschlossen)
- Beide gemeldeten Grafikfehler behoben (Text ausserhalb der Zeichenflaeche bei Leiter und Erregungsdiagramm), Ursache gefunden: edge-verankerter Text bzw. viel zu lange Bildunterschrift
- Kollaps und Angepasst/Fawn aus der Drei-Zonen-Uebersicht zu den erweiterten Reaktionen verschoben (nur Darstellung, Zugang-Datenmodell unangetastet)
- Farbige Hintergrundzonen beim "Zustaende erkunden" ergaenzt
- Neue Illustration bei den Grundlagen (vorher komplett ohne Grafik)
- Gesamtanalyse durchgefuehrt: alle 5 Illustrationen mechanisch auf Textueberlauf geprueft (nur die zwei gemeldeten waren betroffen), ein echter Fund - verwaister Abschnittstitel 'Die drei Hauptzustaende im Detail' wurde nirgends angezeigt, behoben. Keine inhaltlichen Dopplungen oder Fehlinformationen gefunden

## 🟢 Erledigt ("Foto-Bug endgueltig + Energie-Korrektur + mehr Nervensystem-Grafik"-Auftrag vollstaendig abgeschlossen)
- PhotoBackground-Komponente: dauerhafte, robuste Fehlerbehandlung fuer fehlgeschlagene externe Bildanfragen
- Vollstaendig in der GESAMTEN App ausgerollt: keine einzige rohe backgroundImage-Stelle fuer Fotos bleibt uebrig (mechanisch per Suche verifiziert)
- Energie-Level-Korrektur: nur bei Ressourcen (nicht Bruecken), exakte Uebereinstimmung statt "bis zu", klare Ausblenden-Option
- Polyvagale-Leiter-Illustration deutlich reichhaltiger nachgebaut (echte Leiterform, Figuren, beide Bewegungsrichtungen)
- Neues Erregungsniveau-Verzweigungsdiagramm (aus Bild 4) in die Neurozeption-Karte eingebunden

## 🟢 Erledigt ("Energie als Kostenfilter + Konzept-Update"-Auftrag vollstaendig abgeschlossen)
- Energie-Kostenfilter durchgaengig (Bruecken/Ressourcen-Seiten, Zugang-Handlung-Schritt, beide Erstellungsformulare)
- Timer-Wesen meditiert waehrend der aktiven Laufzeit (neuer, zur abstrakten Formsprache passender Zustand)
- Fachliche Ressourcen-Inhalte (Gabler/socialnet-Definition, interne/externe Kategorisierung, Grawe-Wirkfaktoren)
- Denkanstoss-Hinweistext bei Ressourcen mit dem Buch/Hoerbuch-Beispiel des Nutzers
- Mustererkennungs-Einsicht auf der Bruecken-Detailseite ("diese Bruecke hast du schon X Mal gewaehlt, oft bei Y"), berechnet aus bereits vorhandenen Zugang-Daten, mit vorsichtiger Mindestschwelle

- "Energie als Kostenfilter + Konzept-Update"-Auftrag: Energie-Filter (Bruecken/Ressourcen-Seiten + Zugang-Handlung-Schritt + beide Erstellungsformulare) und Timer-Wesen-Meditation erledigt. NOCH OFFEN: reichere "Bruecken als Verbindungen"-Idee (hilft bei/erfuellt/unterstuetzt/fuehrt zu, Mustererkennung ueber Zugang-Historie), fachliche Ressourcen-Inhalte (Gabler/socialnet-Definition, interne/externe Ressourcen-Kategorisierung, Grawe-Wirkfaktoren), Denkanstoss-Hinweistexte bei Ressourcen (und ggf. anderen Seiten)


## 🟢 Erledigt (fuenf gemeldete Probleme, alle behoben)
1. Gefuehlsrad-Anzeige komplett kaputt: Ursache gefunden (Aussenring-Segmente bei manchen Gruppen unter 2px breit), Ringsegment-Ansatz durch robuste Chip-Liste ersetzt
2. Inkonsistenz bei Zusatzzustaenden: Fawn/Faint dupliizierten bereits vorhandene Kernzustaende (Angepasst/Kollaps), entfernt - nur echte Ergaenzungen (Fine/Flood/Friend) verbleiben
3. Nervensystem-Grundlagenfragen jetzt einzeln aufklappbar statt alle zusammen
4. Tageskurve-Seite verweist jetzt auf die Nervensystem-Seite (fehlte komplett)
5. Loslassen-Animationen einzeln durchgesehen: Papierflieger-Faltung startete nach nur 550ms (auf 2600ms erhoeht), Zerknuellen/Zerreissen bei Maus-Bedienung robuster gemacht (fensterweite Listener statt element-gebunden), dabei einen eigenen Stale-Closure-Fehler waehrend der Umsetzung bemerkt und sofort korrigiert


## 🟢 Erledigt (gruendlicher Bild-fuer-Bild-Abgleich)
- Drei echte inhaltliche Luecken gefunden und ergaenzt: enterisches Nervensystem als drittes ANS-Element, Hemmungs-Hierarchie zwischen den drei Zustaenden, die Sicherheit-Orientierung-Beruhigung-Reihenfolge
- Eigene Organ-Wirkungs-Illustration gebaut (Sympathikus vs. Parasympathikus fuer Herz/Atemwege/Verdauung/Pupille), keine Kopie der gezeigten anatomischen Zeichnung
- Der "Nervensystem komplett neu strukturieren"-Auftrag ist damit inhaltlich vollstaendig abgeschlossen (Bild-Bug-Ursache, komplette Restrukturierung, Funktionstest, Bild-Abgleich, eigene Grafik)

- "Nervensystem komplett neu strukturieren"-Auftrag: Punkt 1 (Bild-Bug-Ursache) UND Punkt 2 (komplette Restrukturierung) erledigt. Funktionstest ueber alle 6 Szenarien code-seitig verifiziert (inkl. Resource/Bridge-Bildpfade end-to-end bestaetigt korrekt, Zonen-Konsistenz Check-in/Zugang/Nervensystem architektonisch garantiert ueber gemeinsame POLYVAGAL_ZONE_META-Quelle). NOCH OFFEN: Punkt-fuer-Punkt-Abgleich aller elf bereitgestellten Bilder gegen den finalen Seiteninhalt, konkrete visuelle Nachbildung der Vagusnerv-Organpfade als eigene Grafik

## 🟢 Erledigt (Funktionstest-Verifikation)
- Szenario A-D (Check-in/Zugang/Entdecken -> Nervensystem -> zurueck): navigate(-1)-Muster und Zugang-Auto-Fortsetzung bereits verifiziert, Nervensystem-Link von Zugang aus bestaetigt vorhanden
- Szenario E/F (Ressource/Bruecke erstellen -> Bild waehlen -> speichern -> spaeter oeffnen): ResourceDetailModal.tsx und BridgeDetailPage.tsx beide bestaetigt korrekt, zeigen resource.image/bridge.image beim erneuten Oeffnen
- Konsistenzpruefung: POLYVAGAL_ZONE_META ist die alleinige Quelle fuer Zonen-Label/Farbe/Hinweis in Check-in, Zugang UND Nervensystem - Abweichung strukturell ausgeschlossen
- NEUER, sehr umfangreicher "Nervensystem-Seite komplett neu strukturieren"-Auftrag: Punkt 1 (Ressourcen/Bruecken-Foto-Bug, Ursache gefunden und behoben) erledigt. NOCH KOMPLETT OFFEN: die grosse Nervensystem-Seiten-Restrukturierung selbst (exakte 8-Schritte-Reihenfolge: Grundlagen/Polyvagaltheorie/Neurozeption/drei Hauptzustaende mit Leiter beide Richtungen/vereinfachter Ablauf/erweiterte Stressreaktionen zugeordnet/mindestens 3 interaktive Alltagssituationen/Was-kann-mir-helfen erst am Ende), Dopplungen entfernen, eigene Nachbauten der bereitgestellten Bilder/Grafiken, Konsistenzpruefung Check-in/Zugang/Entdecken, vollstaendiger Funktionstest ueber 6 Szenarien

## 🟢 Erledigt (Bild-Bug-Ursachenuntersuchung)
- Systematisch alle 20 Dateien geprueft die resourcesRepo/bridgesRepo referenzieren
- Strukturelle Ursache gefunden: Resource.image war optional, Bridge.image bereits Pflicht - diese Asymmetrie liess Luecken unbemerkt durch. Resource.image jetzt ebenfalls Pflichtfeld
- Der dadurch ausgeloeste Typecheck deckte sofort zwei echte Luecken auf: ResourceImportPage.tsx (image-Feld komplett vergessen) und BridgeImportPage.tsx (image explizit leerer String) - beide durch echte Bildvorschlaege ersetzt
- Bewusstes 'Kein Bild'-Wahlrecht des Nutzers im Bearbeitungsformular unangetastet gelassen (gewollte Option, keine Icon-Ersetzung)
- "Nervensystem-Ausbau"-Auftrag (sehr umfangreich, Bildmaterial-Referenz): Stresstoleranzfenster-Illustration, Check-in-Zonenhilfe, "drei Hauptzustaende"-Vertiefung mit Quellen, erweiterte Stressreaktionen (Fawn/Faint/Fine/Flood/Friend) mit Quellen, Aktivierungswelle mit Alltagsbeispiel, Quellenseite umbenannt - alles erledigt. NOCH OFFEN: weitere eigene Grafiken/Illustrationen (Vagusnerv-Pfade, Leiter-Diagramm) nach Wunsch des Nutzers "wirklich Grafiken/Bilder", vollstaendiger Konsistenz-Check ueber ALLE Seiten wo Nervensystem-Zustaende vorkommen, Pruefung ob noch weitere Dopplungen bestehen
- "Die App stärker verbinden"-Auftrag: weitgehend abgeschlossen — der zentrale Datenverknuepfungs-Audit ist jetzt Teil der Gesamtpruefungs-Sitzung erledigt

## 🟢 Erledigt (Reizreduktions-Sitzung — die drei vom Nutzer bestaetigten Vorschlaege)
- Schutzstrategien-Seite entlastet: vier Textbloecke (Schutzstrategien-Erklaerung, Hindernisse-Erklaerung) hinter je einem Toggle, man landet jetzt sofort bei den antippbaren Listen
- Gefuehle-Seite entlastet: drei Erklaerbloecke (Signal, Pseudogefuehle, Gedankentest) zu einem einzigen Toggle zusammengefasst, das Rad ruckt direkt nach oben
- Startseite neu geordnet: Check-in ist jetzt eindeutig der primaere Einstieg direkt nach dem Wesen, die Verstehen/Tun-Weiche sichtbar nachrangig (kleiner, "oder direkt:"-Label). Eigenen Fehler waehrend der Umsetzung (verwaiste doppelte Schliess-Tags) sofort bemerkt und korrigiert, Ergebnis manuell auf Dopplungsfreiheit im Quellcode geprueft

## 🟢 Erledigt (zweite, genauere Durchsicht des GFK-Gefuehlskartenmaterials)
- Drei fehlende Einzelbegriffe ergaenzt (die Nase voll haben, etwas satt haben bei Wut; unmotiviert bei Frust), ein Duplikat (gereizt) entfernt
- Neuer Abschnitt "Ueber den Gedanken zum Gefuehl": uebernimmt die auf der Karte hervorgehobene Gefuehlstest-Methodik und den Bestaetigungs-Tipp, bewusst als eigener Text-Abschnitt getrennt vom Rad
- WICHTIGER FUND: Untertitel und Quellenangabe sprachen noch von "acht Gefuehlsbereichen" statt der seit der letzten Sitzung gueltigen 14 - korrigiert, Quellenangabe nennt jetzt explizit den GFK-Navigator fuer Gefuehle
- Geprueft und bestaetigt bereits vorhanden: die "echte vs. unechte Gefuehle"-Unterscheidung aus der Kartenfusszeile existierte schon als eigene Pseudogefuehle-Karte

## 🟢 Erledigt — "Fehler beheben + UX vereinfachen"-Auftrag vollstaendig abgeschlossen
- Gefuehlsrad grundlegend erweitert anhand des GFK-Navigator-Gefuehlskartenmaterials: von 8 auf 14 Grundgefuehle (neu: Hoffnungslosigkeit, Ohnmacht, Frust, Unzufriedenheit, Einsamkeit, Gleichgueltigkeit), bestehende sechs Gruppen mit reichhaltigeren Unterbegriffen ergaenzt, "typische Gedanken" pro Gefuehl in die bereits bestehende FEELING_DETAILS-Struktur eingearbeitet statt eine zweite parallele Struktur zu schaffen (eigener Fehler waehrend der Umsetzung bemerkt und korrigiert). Laengenabhaengige Schriftgroesse ergaenzt, um bei jetzt 14 statt 8 Segmenten kein erneutes Lesbarkeitsproblem zu riskieren. Mechanisch verifiziert (inkl. Korrektur eines fehlerhaften eigenen Pruefskripts)

## 🟢 Erledigt (Fortsetzung — End-to-End-Test & visuelle Identitaet)
- Vollstaendiger End-to-End-Test des 18-Schritte-Zugangswegs durchgefuehrt (Abschnitt 21): alle neun aus dem Zugang verlinkten Seiten (Koerper, Nervensystem, Gefuehle, Schutzstrategien, Garten, Beduerfnisse, Denkmaschine, Wertekompass) nutzen korrektes navigate(-1), inklusive eines Falls der sich ueber TopBars sicheren Standardwert loest statt eines expliziten onBack. Kette Zugang->Bruecke->Fortfuehren->Handlung-Schritt mit erhaltener Bruecken-Auswahl im Code verifiziert
- Visuelle Identitaet pro Entdecken-Kachel: 20 Kacheln mit vier bestehenden Akzentfarben nach Themenbereich eingefaerbt statt einheitlicher Farbe, andere Nutzer derselben Komponente (Sicherheit) unveraendert

## 🟢 Erledigt (Fortsetzung — "Fehler beheben + UX vereinfachen")
- Denkmaschine-Namenserklaerung: neuer eingeklappter Hinweis, dass "Denkmaschine" kein Fachbegriff ist, sondern ACT-inspiriert (Wengenroth)
- Bruecke-vs-Handlung-Klarheit: neue Karte in Zugang-Schritt 10 zeigt explizit die gewaehlte Bruecke mit dem Uebergang zur konkreten Handlung, exakt nach dem Beispiel aus dem Auftrag

## 🟢 Erledigt (neue Sitzung — "Fehler beheben + UX vereinfachen")
- Textkorrektur "Oben hilft dir..." auf der Tageskurve-Seite praezisiert
- Echter Zustandsverlust-Bug im Check-in behoben: kompletter Fortschritt ging bei Navigation weg+zurueck verloren (z.B. ueber "Mehr zu den drei Zustaenden"), jetzt mit demselben Auto-Fortsetzungs-Muster wie beim Zugang geloest
- Beenden/Fortfuehren/Verwerfen-Dialog fuer aus dem Zugang geoeffnete Bruecken umgesetzt, inkl. neuer eigenstaendiger Speicherfunktion die unabhaengig von ZugangPage funktioniert
- Ablenkungs-Trigger-Warnung ergaenzt (ruhig formuliert, nicht alarmierend)
- Echten Regressions-Fund behoben: Wesen-Name war fuer sehende Nutzer nirgends sichtbar (nur aria-label)
- GFK-Beduerfnisliste anhand des bereitgestellten offiziellen Kartenmaterials um ca. 30 fehlende Begriffe erweitert, mechanisch auf DE/EN-Konsistenz verifiziert

## 🟢 Erledigt (Gesamtpruefungs-Sitzung — Datenverknuepfungs-Audit)
- Drei echte, konkrete Verbindungsluecken gefunden und behoben: die linkedNeeds/linkedObstacles/connectionTags-Felder auf Bruecken wurden nirgends in die Gegenrichtung angezeigt
- Beduerfniskompass: neue Zuordnungstabelle (13 grobe Richtungen -> feineres GFK-Vokabular) verbindet das neuere linkedNeeds-Feld mit der bestehenden Kategorie-Zuordnung
- Hindernisse: neue Sektion "Diese Bruecken koennten trotzdem helfen" bei markierten Hindernissen (vorher gar keine Verbindung sichtbar)
- Wertekompass: geteiltes ReflectionModal um wiederverwendbaren "custom"-Schritttyp erweitert, Wertekarten zeigen jetzt verknuepfte Bruecken
- Verifiziert: andere Nutzer der geteilten ReflectionModal-Komponente funktionieren nach der Erweiterung weiterhin einwandfrei
## 🟢 Erledigt (Gesamtpruefungs-Sitzung — Geraete-Kompatibilitaet)
- Loslassen: Papier skalierte nur mit Breite, nicht mit Hoehe — auf kurzen Bildschirmen (Querformat) haette es ueberragt. Jetzt zusaetzlich hoehenbegrenzt, plus Scroll-Sicherheitsnetz
- Systematischer Fund: vier SVG-Illustrationen in der App hatten width=100% mit fest codierter Pixel-Hoehe — haetten auf breiteren Bildschirmen (Tablet/Desktop) verzerrt/gestreckt ausgesehen (Gefuehlsrad, Bruecken-Illustration, Schutzstrategien-Waage, Nervensystem-Aktivierungswelle). Alle vier auf aspectRatio umgestellt, skalieren jetzt gleichmaessig
- Dabei einen eigenen Fehler waehrend der Umsetzung sofort bemerkt und behoben (Gefuehlsrad-Vergroesserung haette zunaechst selbst eine neue Verzerrung verursacht)

## 🟢 Erledigt (Gesamtpruefungs-Sitzung, Fortsetzung)
- Nervensystem-Seite restrukturiert: kurze Erklaerung -> Visualisierung -> Interaktion -> Vertiefung, Grundlagen und Regulations-Tipps hinter Aufklapp-Bereichen statt Textwand
- Schutzstrategie-Hindernis-Verbindung mit konkretem Beispiel aus dem Auftrag ergaenzt
- Zugangsrueckblick-Suche ergaenzt (konsistent mit Tagebuch-Muster)
- WICHTIGER FUND: echter Datenverlust-Bug behoben — Zugang-Schritt-0 ("Wo bin ich gerade?") wurde im Entwurf gespeichert, aber beim Abschluss verworfen und tauchte im Rueckblick nie auf. Stichprobenartig geprueft: andere grosse Formulare (Ressourcen, Bruecken) nutzen ein strukturell sichereres Speicher-Muster (komplettes Objekt statt einzeln aufgelisteter Felder) und sind daher gegen denselben Fehlertyp geschuetzt

## 🟢 Erledigt (Gesamtpruefungs-Sitzung)
- Foto-Funktion bei Ressourcen/Bruecken verifiziert: echte Picsum-Fotos, veralteten irrefuehrenden Kommentar korrigiert
- Navigationskontext-Fehler behoben: Zugangsrueckblick fuehrte "Zurueck" fest codiert zu Entdecken statt echtem navigate(-1)
- Loslassen komplett neu gebaut: pointer-events:none als Kernursache der fehlenden Interaktivitaet gefunden und behoben, alle drei Rituale mit echter Zieh-Interaktion zurueck, deutlich groesseres Papier
- Wertekompass: dritte Dimension "gewuenschter Raum" ergaenzt, Verwirrung zwischen zwei Radar-Diagrammen (Werte vs. Zugangsbereiche) durch klarere Beschriftung entschaerft
- Gefuehlsrad-Aussenring: zweiter Versuch mit strukturell anderem, risikoaermerem Ansatz (keine rotierten Labels mehr)
## 🟢 Erledigt — "Materialien"-Auftrag (53 Abschnitte) vollständig umgesetzt
- Nervensystem-Grundlagen (was ist ein Nervensystem, Neurozeption, Regulations-Tipps), globale Quellenbibliothek, Onboarding von 18 auf 30 Stationen erweitert, Brücken-Visualisierung+Kartenoptik, "Was kann ich alles" im Detail (8 Fähigkeiten, Vier-Fragen-Struktur), Entdecken-Feinstruktur (11 Untergruppen), Navigationskontext-Bewahrung bei Zugang-Sprüngen (Auto-Fortsetzung bei < 15 Min), adaptive Nutzung bei geringer Kapazität (sanftes Angebot nach dreimaligem Zurückgehen), bestehende Quellenangaben mit der Bibliothek verlinkt

## 🟢 Erledigt (diese Sitzung, Fortsetzung 3)
- Entdecken-Feinstruktur: Erforschen in fuenf, Tun in sechs Untergruppen aufgeteilt, drei neue Querverweis-Kacheln (Zugang/Bruecken/Helfermodus)
- Navigationskontext bei tiefen Zugang-Spruengen: ein gerade eben verlassener Zugang (< 15 Minuten) wird beim Zurueckkehren automatisch und ohne Unterbrechung an exakt der vorherigen Stelle fortgesetzt

## 🟢 Erledigt (diese Sitzung, Fortsetzung 2)
- Bruecken-Seite: neue warme SVG-Illustration oben, echte 2-spaltige Kartenoptik mit grossem Foto, Schatten, gestaffelter Eintritts-Animation statt schmaler Listenzeile
- "Was kann ich alles" im Detail: neue eingeklappte Sektion mit acht Faehigkeiten, jeweils Was/Wann/Wo/Wie-ausschalten-Struktur

## 🟢 Erledigt (diese Sitzung, Fortsetzung)
- Onboarding-Tour von 18 auf 30 Stationen erweitert (bestehende AppTourOverlay.tsx-Infrastruktur genutzt, nicht neu gebaut) — deckt jetzt alle 17 im Auftrag geforderten Themen ab, inklusive Krisenmodus, Helfermodus, Nur-jetzt-Modus, Quellen, So-haengt-alles-zusammen
- Nervensystem-Seite von Grund auf erweitert: Grundlagen-Sektion, Ablauf-Grafik, Neurozeption-Erklaerer, Regulations-Tipps — Bildmaterial analysiert und konzeptionell (nicht grafisch) uebernommen wegen Copyright
- Globale Quellenbibliothek mit den sieben vorgegebenen Quellen, gruppiert nach Ansatz, erreichbar von Entdecken aus
## 🟢 Erledigt — "ChatGPT-Konzept" vollständig umgesetzt (alle fünf großen Bausteine)
- Erforschen vs. Tun als zwei getrennte Wege (Startseiten-Weiche + Entdecken-Umgruppierung)
- Neues Konzept "Bedingungen" für Brücken
- Werte-Verhaltens-Checkliste "Woran würde ich merken, dass ich so lebe?" für alle 26 Lebensrichtungen
- "Nicht geschafft" als Datenquelle: Zustand×Handlung-Mustererkennung im Zugangsrückblick
- "Wiedererkennen": sanfte Karte bei ähnlicher vergangener Situation im Zugangscheck
- "Was möchte ich heute?"-Einstieg mit sieben Absichten, routet ausschließlich zu bereits bestehenden Zielen
- Das Zugangs-Lücken-Modell (Wollen/Wissen/Energie/Sicherheit/Konkretheit/Erreichbarkeit) als wiederverwendbares Diagnose-Werkzeug, erreichbar von Zugang-Reflexion und Brücken-Detailseite

## 🟢 Erledigt (diese Sitzung — Mustererkennung & Wiedererkennen)
- "Nicht geschafft" als Datenquelle: neue Zustand×Handlung-Mustererkennung in zugangPatterns.ts, gruppiert vergangene Durchgänge und erkennt z. B. "Lesen scheint in Kollaps-Zuständen bisher schwieriger zugänglich gewesen zu sein" — erfordert mindestens zwei Vorkommen, durchgehend hypothesenhafte Sprache, neue eingeklappte Sektion im Zugangsrückblick
- "Wiedererkennen": sanfte Karte während des Gefühl-Schritts im Zugangscheck, wenn eine ähnliche vergangene Situation existiert — "Das kennst du vielleicht schon" mit echter Ja/Nein/Gerade-nicht-Wahl statt Tatsachenbehauptung
- Beide mit simulierten Testdatensätzen mechanisch verifiziert
- Loslassen-Zerknüllen: echte Touch/Maus-Zieh-Interaktion bewusst nicht umgesetzt (Konfliktrisiko zwischen Inline-Transform und CSS-Keyframe) — die mehrstufige 3D-Animation selbst ist fertig, das Ziehen fehlt noch

## 🟢 Erledigt (diese Sitzung — "ChatGPT-Konzept")
- Erforschen vs. Tun als zwei getrennte Wege — neue Weiche auf der Startseite, Entdecken-Seite komplett umgruppiert (fünf Gruppen → zwei Wege)
- Neues Konzept "Bedingungen" für Brücken (zwölf Bedingungen direkt aus den Beispielen des Nutzers)
- Neue Werte-Verhaltens-Checkliste "Woran würde ich merken, dass ich so lebe?" mit sorgfältig ausgearbeiteten Indikatoren für alle 26 Lebensrichtungen, ReflectionModal um Checklisten-Schritttyp erweitert
- Textdurchgang gründlich, aber stichprobenbasiert: Wesen-Nachrichten (169), Ablenken-Inhalte (224), Ressourcen-/Brücken-Beispiele, GFK-Bedürfnisliste geprüft — Wissensseiten-Fließtext (Nervensystem, Schutzstrategien usw.) noch nicht Wort für Wort durchgegangen

## 🟢 Erledigt (diese Sitzung — "Die App stärker verbinden")
- Wertekompass-Seite grundlegend restrukturiert (vier klare Abschnitte statt sieben unsortierter Karten), fehlende Wertekarten-Übersicht ergänzt
- Neue Verbindung "Was könnte dahinterstecken?" — Schutzstrategie schlägt mögliche Bedürfnisse vor (eigene protectionToNeeds.ts, 21 Zuordnungen)
- Handlung-Reflexion ohne Erfolg/Misserfolg-Bewertung: optionales "Was hat den Zugang erschwert?" + "Was hätte geholfen?"
- Bestätigt bereits vorhanden: Brücke-jetzt-nutzen/weiter-erkunden-Wahl, vollständiger Zugangs-Pfad in der Rückblick-Liste
- Brücken zusätzlich mit Bedürfnissen und Hindernissen verknüpfbar (zuvor nur mit Werten)
- "Nur jetzt"-Modus: jetzt echt navigations-eingeschränkt (Punkt 2 der Weiterentwicklung), aber Speichern selbst in Zugang/Check-in läuft weiterhin normal

## 🟢 Erledigt (diese Sitzung — Weiterentwicklung, 13 von 17 Punkten)
- Tagebuch-Fotos, "Nur jetzt"-Modus grundlegend überarbeitet (echte Navigationssperre), "So hängt alles zusammen" vollständig ausgebaut (Beschriftungen + elf fehlende Seiten ergänzt)
- Gefühlsrad-Außenring (bereits fachlich abgestimmte sub-Begriffe wiederverwendet)
- Schutzstrategien und Hindernisse vollständig interaktiv (trifft nicht zu / eigene Einträge, geteilte Infrastruktur)
- Wertekompass: Alltags-Präsenz-Frage statt Ranking, verstärkte Momentaufnahme-Erklärung
- Drei fehlende Zugangscheck-Verbindungen ergänzt (Schutzstrategie, Bedürfnis, Hindernis → jeweilige Referenzseite)
- Loslassen-Animationen grundlegend neu gebaut (echtes CSS-3D-Falten statt 2D-Skalierung), dabei einen eigenen Fehler (Text-Überlauf-Sicherheitsnetz) sofort gefunden und behoben
- Denkmaschine-Neuformulierung bleibt bewusst außerhalb der gemeinsamen ReflectionModal-Komponente (strukturell anders eingebettet)

## 🟢 Erledigt (diese Sitzung — Perspektiven-Audit-Umsetzung)
- Sinnesmodalitäts-Tags für Ressourcen/Brücken (Ergotherapie-Perspektive)
- Begleiter-Hintergrund-Vorschau bei der Einführung mit Hinweis auf freie Auswahl
- "Keine Traumaverarbeitung" und "kein Ersatz für Risikoeinschätzung" explizit ausformuliert (allgemeiner Disclaimer + eigene Krisenmodus-Formulierung)
- Selbstverantwortungs-Hinweis für potenziell zwanghaft wirkende Funktionen (Denkmaschine, Loslassen, Tagebuch)
- Gezielter Textdurchgang: ein echter Fund (Schaf-Rätsel nutzte "sterben" als Wortspiel) gefunden und behoben, sonst keine problematischen Inhalte in Wesen-Nachrichten, Ablenken-Inhalten oder Beispieldaten gefunden
- Helfermodus: alte statische Do's/Don'ts-Liste existiert noch neben der neuen zugeschnittenen Situations-Anleitung — teilweise redundant, als allgemeine Referenz darunter aber nicht unsinnig
- Vollständiger geräteübergreifender Qualitätsdurchgang weiterhin nicht als eigener separater Block durchgeführt

## 🟢 Erledigt (diese Sitzung — alle zehn Audit-Prioritäten umgesetzt)
- Wertekompass durchgehend einheitlich benannt; Zugangsrad-Regler vollständig hinein verschoben, alte Seite entfernt
- Zwei von drei Reflexions-Bausteinen auf eine neue gemeinsame ReflectionModal-Komponente umgestellt
- Entdecken-Gruppen mit kurzem Einordnungssatz erklärt
- Kleine Inhalte-Pools für vier Wochen Nutzung deutlich aufgefüllt, Hinweis auf eigene Inhalte ergänzt
- Neue Hindernisse-Sektion in die Schutzstrategien-Seite eingebaut
- Rückblick↔Wertekompass jetzt echt verlinkt (antippbare Werte-Tags, Tiefen-Link)
- Neue Speicherverbrauchs-Übersicht in den Einstellungen (live berechnet, nach Kategorie)
- Neuer "Nur jetzt"-Modus vom Startbildschirm aus
- Neue "So hängt alles zusammen"-Landkarte, von Einstellungen und Entdecken aus erreichbar
## 🟢 Erledigt (diese Sitzung — offene Punkte abgeschlossen + Konsistenz-Check)
- Gefühle: fachlich präzisiert (GFK definiert keine feste "Grundgefühle"-Anzahl), äußerer Ring bewusst nicht gebaut
- Schutzstrategien: echte geführte Reflexion beim Antippen einer Strategie ergänzt
- Denkmaschine: Plakatwand-Übung mit echtem Zoom-Effekt und Verzweigung ausgebaut, dritte Übung (Sprachdistanzierung) ergänzt
- Navigations-Audit: automatisierter Link-Scan (0 kaputte Links), Zugang-Zwischenspeicherung erneut verifiziert
- **Wichtiger Konsistenz-Fund und Fix:** Es gibt zwei getrennte "Schlaf"-Mechanismen für das Wesen (brainEnabled = komplett ausblenden, brainState = sanftes Ruhigstellen). Die neue Infoseite aus der letzten Sitzung hatte fälschlich den falschen als "Schlafen legen" dokumentiert — korrigiert

## 🟢 Erledigt (diese Sitzung — Loslassen immersiv, Wesen-Infoseite)
- Loslassen: Animation jetzt tatsächlich vollflächig/immersiv (viewport-relative Größe statt fest 220px), großzügigere Zeitabläufe, verstärkte Hintergrund-Abdunklung
- Neue "Was kann ich alles?"-Seite für das Wesen, mit besonders hervorgehobener, beruhigender Erklärung für Schlafen legen/Aufwecken (bleibt vollständig erhalten, nichts wird gelöscht)

## 🟢 Erledigt (diese Sitzung — kritischer Bilder-Fund, Helfermodus, Wertekompass)
- **Kritischer Fund:** Ressourcen-/Brücken-Bildvorschläge waren in einer früheren Sitzung von echten Fotos auf SVG-Icons umgestellt worden — genau das explizit unerwünschte Verhalten. Zurückgestellt auf echte Fotografien (Lorem Picsum statt der abgeschalteten Unsplash-Source), inklusive automatischer Korrektur aller Beispieldaten
- Helfermodus: echte Mehrfachauswahl über 16 konkrete Situationen mit zugeschnittener Erstorientierung, explizite Verantwortungsgrenzen-Stufe, prominenter "Akuter Notfall"-Schnellzugriff
- Wertekompass: deutlich verstärkte "keine Rangliste"-Erklärung, neue ausklappbare ACT-Werte-Theorie mit Quellenangabe

## 🟢 Erledigt (diese Sitzung — Gefühle-Rad, Phase 4 größtenteils abgeschlossen)
- Neues antippbares Gefühlsrad mit acht Segmenten, positions- statt farbbasierte Unterscheidung, synchron mit der bestehenden Akkordeon-Detailliste

## 🟢 Erledigt (diese Sitzung — Loslassen/Denkmaschine bei langen Texten, echte Speicher-Bestätigung)
- Loslassen: zwei echte Fehler bei längeren Texten gefunden und behoben (harte Text-Abschneidung in der Illustration, fehlende Zeilenumbruch-Erhaltung in der Liste), Eingabefeld wächst jetzt mit
- Denkmaschine: dasselbe fehlende-Bestätigung-Problem auch beim Notiz-Feld behoben (vorher nur bei Neuformulierung), alle Textfelder wachsen mit, Zeilenumbrüche an fünf Anzeigestellen korrigiert
- Mechanisch mit langem, mehrzeiligem Text verifiziert: alle Felder (Original, Neuformulierung, Notiz, Datum) bleiben korrekt im selben Eintrag verbunden

## 🟢 Erledigt (diese Sitzung — Denkmaschine/Loslassen/Wertekompass gründlich korrigiert)
- Denkmaschine-Speicherfehler gefunden: Datenspeicherung war korrekt, aber die Anzeige versteckte gespeicherte Neuformulierungen hinter dem falschen Reiter. Jetzt automatischer Sprung zum richtigen Reiter mit klarer Vorher-Nachher-Karte
- Loslassen komplett neu: zeigt jetzt den tatsächlich geschriebenen Text auf einer echten, größeren Notizzettel-Form (statt leerer abstrakter Form), sichtbar bis zur eigentlichen Faltung/Verknüllung/Zerreißung
- Wertekompass-Kartenentdeckung: neue Karte-für-Karte-Entdeckung mit drei Resonanz-Reaktionen ersetzt das vorherige flache Chip-Raster
- Radar-Diagramm jetzt antippbar — öffnet die persönliche Wertekarte direkt aus der Visualisierung

## 🟢 Erledigt (vorherige Sitzung — Bedürfnisse/Werte/Brücken vertiefen, Denkmaschine, Helfermodus)
- Bestandsbericht vor jeder Änderung erstellt (Bedürfnisse, Werte, Brücken, alte Zugangsrad-Implementierung)
- Glaubenssätze zu "Denkmaschine" erweitert (nicht ersetzt), Name geprüft statt automatisch übernommen, alle bestehenden Funktionen erhalten, neue Verbindung zu Loslassen
- Loslassen: dritte Option "Zerreißen" mit eigener Illustration und Animation ergänzt
- Bedürfnisse: GFK-Liste explizit als Modell/Arbeitsgrundlage gekennzeichnet, nicht als abschließende Liste
- Brücken↔Werte-Verknüpfung neu geschaffen (existierte vorher gar nicht) — Mehrfachzuordnung, dieselbe Werte-Quelle wie Zugang/Wertekompass
- Helfermodus: neuer interaktiver Situations-Leitfaden (7 Schritte) statt nur statischer Informationen
- "Mein Kompass" (vorher Wertekompass): persönliche Wertekarten mit vier Unterfragen und "heute leben"-Feld neu geschaffen

## 🟢 Erledigt (vorherige Sitzung — systematischer Langzeitnutzungs-/Performance-Durchgang)
- Tagesrückblick + PDF-Export-Aufbereitung: dieselbe volle Datenquelle wurde für jeden angezeigten Tag erneut durchsucht statt einmal gruppiert — mit realistischem Drei-Jahres-Datensatz verifiziert (30× weniger Operationen)
- Wertekompass-Monatsverlauf: dieselbe Korrektur (Zugang-Historie wurde pro Monat neu durchsucht)
- Wesen-Verwaltung (eigene Ablenkungskategorien): dieselbe Korrektur, geringere Dringlichkeit aber aus Konsistenz behoben
- Drei fast identische groupByDay-Implementierungen zu einer gemeinsamen Hilfsfunktion konsolidiert
- Systematisch geprüft und sauber befunden: Ressourcen, Brücken, Garten, Sicherheitsnetz/Kontakte, Lesezeichen, Medi-Log-Charts und -PDF-Export, Meine Entwicklung, gelöste-Rätsel-Verfolgung, Mehrfach-Brief-Logik
- Korrektur einer eigenen Fehlbehauptung: Desktop-Breitenbegrenzung existierte bereits vollständig

## 🟢 Erledigt (vorherige Sitzung — Verknüpfung, Inhalt & visuelle Ausbaustufe)
- Zugang-Schritte für Körperwahrnehmung, Nervensystem und Gefühle jetzt mit den jeweiligen Entdecken-Seiten verbunden ("Mehr über X erfahren"), bestehende Zwischenspeicherung greift automatisch
- Bedürfnisse-Seitentitel von "Was brauche ich gerade?" zu "Bedürfnisse" geändert — nur auf der Entdecken-Seite, Check-In-Frage bleibt unangetastet
- Bedürfnisliste gegen die Originalquelle (gfk-info.de) geprüft und von 67 auf 81 quellengetreue Einträge vervollständigt, Quellenangabe ergänzt
- Glaubenssätze: neue "Durchstreichen & neu formulieren"-Funktion mit Anleitung gegen hohle Positiv-Sprüche, zwei recherchierte ACT-Übungen (Plakatwand-Defusion, ACE-Anker-Übung nach Dr. Sonia Jaeger)
- Gefühle: GFK-Kerneinsicht (Gefühle als Signal für erfüllte/unerfüllte Bedürfnisse) und echte-vs-Pseudogefühle ergänzt
- Körperwahrnehmung: neue interaktive Körper-Silhouette mit fünf antippbaren Bereichen
- Schutzstrategien: neue Waage-Illustration (kurzfristig vs. langfristig)
- Nervensystem: neue antippbare Aktivierungs-Welle
- Einheitliches "Quelle & Hintergrund"-Element über alle sechs Fachseiten

## 🟢 Erledigt (vorherige Sitzung — Regressionen prüfen, Wertekompass zurückbringen)
- **Kritischster Regressions-Fund:** Ressourcen-/Brücken-Bilder — meine eigene Anführungszeichen-Korrektur der letzten Sitzung hatte einen Regex-Fehler, der überall buchstäblich `url("resource.image")` statt der interpolierten Variable einsetzte. An allen 11 Stellen behoben.
- Schutzstrategie-Schritt im Zugang: Garten-Link löste nur bei 4/20 Strategien aus — jetzt immer sichtbar
- Alte Zugangsrad-Visualisierung (AccessWheelChart.tsx) wiedergefunden und als ValuesRadarChart.tsx für den Wertekompass verallgemeinert
- Rätsel-Wiederholung behoben: echte Shuffle-Bag-Logik statt reinem Math.random(), mechanisch verifiziert
- Sorgenfresser komplett umbenannt zu "Loslassen" — alle Hund-Referenzen (auch im Text, nicht nur der Animation) entfernt, echte mehrstufige Papier-Knüll-Animation
- Brief an mich: Öffnen-Fehler auf der Startseite behoben (Brief-Objekt statt nur ID gespeichert), ruhige Aufklapp-Animation, Tagebuch-Hinweis ergänzt
- Entdecken in fünf klar benannte Gruppen strukturiert, Reihenfolge-Funktion pro Gruppe erhalten

## 🟢 Erledigt (vorherige Sitzung — Verbinden, Glätten, Fehler beheben)
- **Root-Cause-Fund:** Ressourcen-/Brücken-Bilder verschwanden wegen unmaskierter Klammern in Daten-URIs bei nicht in Anführungszeichen gesetzten CSS-url()-Angaben — an 11 Stellen behoben
- Ablenken-Kategorien bereinigt: zwei Fehlklassifizierungen und ein kaputtes Rätsel gefunden und korrigiert
- Neue Kategorie "Allgemeinwissen" mit 50 geprüften Fragen
- Wesen-Verwaltung: Suchfeld-Inkonsistenz behoben
- Krisenmodus verlässt sich nicht mehr versehentlich (Sicherheitsplan/-netz jetzt eingebettet)
- Helfermodus durchdacht erweitert (gemeinsame Orientierung, respektvolle Fragen)
- Zugang-Fortschritt übersteht jetzt verbundene Seiten (neue Zwischenspeicherung)
- Zugangsrückblick-Navigation korrigiert
- Wertekompass von Anfang an nutzbar plus echter monatlicher Verlauf
- Gießanimation jetzt auch bei einzelnen Pflanzenkarten
- Nervensystem, Körperwahrnehmung, Schutzstrategien, Glaubenssätze ausgebaut (Grundlagen, Quellen)
- Sorgenfresser komplett neu gestaltet (zwei animierte Loslass-Rituale statt Hund)
- Einstieg/Anleitung erweitert: Zugang- und Entdecken-Tourstopps ergänzt, Datenschutz-Hinweis im Abschluss
- Echte Lücke geschlossen: "Ich bin gerade nicht richtig da"-Shortcut existierte nirgends — jetzt auf der Startseite

## 🟢 Erledigt (vorherige Sitzung — Grundstruktur, Resonanz und neue Funktionen)
- Sechs neue, vollständig verbundene Entdecken-Seiten für die Zugang-Bausteine: Nervensystem, Körperwahrnehmung, Schutzstrategien, Gefühle, Glaubenssätze (neue Architektur), Wertekompass — alle bauen auf bestehenden Zugang-Daten auf, keine Dopplungen
- Bedürfnis-Seite geprüft: bewusste Zweiteilung (13 handlungsverknüpfte Richtungen + volle GFK-Liste als Ergänzung) bestätigt sinnvoll, keine Dopplung
- Ressourcen/Brücken-Definition konzeptionell verifiziert, architektonisch bereits sauber
- Sorgenfresser (neue Funktion, eigene Hund-Illustration)
- Brief an mich (neue Funktion, Umschlag-Optik, Zustellung über die Startseite, im Tagebuch sichtbar)
- Zentrale Quellen-/Ansätze-Übersicht in den Einstellungen mit der geforderten "keine Therapie"-Erklärung
- Jede neue fachliche Seite mit eigener, nachvollziehbarer Quellenangabe

## 🟢 Erledigt (vorherige Sitzung — gezielte Verbesserungen, 8 Punkte)
- Krisenmodus: weiß auf schwarz statt dunkel auf hell, maximaler Kontrast
- Garten: sofortige Wachstumserkennung beim Klick (vorher erst beim nächsten Aufruf), echte Gieß-Animation, Wachstumsstufen von 8 auf 11 erweitert für echtes Langzeitwachstum
- Rätsel: freie Eingabe statt Multiple Choice bei schwer/sehr schwer, strukturell über die Schwierigkeitsstufe entschieden; Brückenwörter hatten gar keine aktivierte Schwierigkeitsauswahl — behoben
- Ressourcen-/Brücken-Bilder: neue lokale, thematisch passende SVG-Symbolbibliothek statt picsum.photos-Zufallsfotos, überall eingebunden (Beispiele + 48 Entdecken-Einträge)
- Wesen-Verwaltung: von fünf auf drei Hauptbereiche konsolidiert (Tipps & Mitteilungen / Orientierung / Ablenkung)
- Eigene-Kategorie-Verwaltung an die logische Stelle verschoben (nur noch unter Wesen verwalten, redundanter Settings-Bereich entfernt)
- Kategorien-Archivierung verifiziert weiterhin vollständig funktionsfähig
- Drei neue kontextbezogene "?"-Hilfe-Buttons innerhalb der Wesen-Verwaltung

## 🟢 Erledigt (vorherige Sitzung — großer gründlicher Themenblock, 14 Punkte)
- Doppelte Schrift-Einstellung entfernt
- Zugang-Zentrierung strukturell gelöst (neue ZugangStepHeader-Komponente, Flexbox statt text-align/margin:auto)
- "Hier weitermachen" bei "Ich brauche Unterstützung"
- Zugang startet mit ruhiger Einführung statt direkt mit dem ersten Schritt
- Zugangsrückblick jetzt unter "Entdecken" erreichbar
- Orientierungsschritte tatsächlich per Hoch/Runter verschiebbar (Anfang/Ende bleiben sinnvoll fest)
- Eigene-Kategorie-Bug: echte Ursache war ein z-index-Konflikt (Modal hinter Vollbild-Overlays versteckt), nicht die Logik
- Eigene Ablenkungskategorien: vollständiger Ablauf erstellen/benennen/bearbeiten/löschen/archivieren/wiederherstellen
- "Das möchte ich nicht mehr sehen" statt riesiger Schalter-Liste für Standardinhalte
- Wesen-Inhalte komplett neu geordnet: Unterstützung (seitenbezogen) / Zwischendurch (random) / Rückmeldung (Feedback) statt einem großen Sammeltopf, 67 fälschlich seitengebundene Sätze korrigiert
- Startseite neu strukturiert: Wesen/Check-In/Krisenmodus/Helfermodus/"Das habe ich geschafft" klar hierarchisiert
- Krisenmodus und Helfermodus als echte neue Funktionen gebaut (existierten vorher gar nicht)
- Tagebuch-Vorlagen (Standardvorlagen + eigene, robust erweiterbare Architektur)
- "Das hilft gerade nicht" bei der Orientierungsübung ergänzt (fehlte trotz wiederholter Grundsatz-Anforderung)

## 🟢 Erledigt (vorherige Sitzung — Orientierung, Kontexthilfe, Wochenrückblick)
- Orientierungsübung mit voller Bearbeitbarkeit (Schritte aktivierbar/deaktivierbar, eigene Schritte hinzufügen/bearbeiten/löschen/verschieben)
- Kontexthilfe-"?"-Buttons auf allen ~24 Hauptseiten der App ausgerollt
- Wochenrückblick vollständig überarbeitet: Wesen-Erzählung statt Zahlen zuerst, "was" statt "wie viel" genutzt, Zugang & Garten integriert, "Moment der Woche" statt flacher Liste, freiwilliger Ausblick zum Schluss
- Garten-Pflanzenauswahl "nur ein Strich": Root Cause gefunden (Vorschau-Daten erzeugten durch Deduplizierung nur Wachstumsstufe 1 statt einer ausgewachsenen Pflanze)
- Garten-Hauptansicht: feste SVG-Breite (320px) auf responsive Breite umgestellt (Überlauf-Risiko auf sehr schmalen Geräten)
- Pflanzenauswahl-Karte: overflow-hidden + feste Höhe + justify-end haette bei zweizeiligen Pflanzennamen die Vorschau oben abschneiden können — behoben
- MiniCurve (Tageskurven-Vorschau in Tagebuch/Wochenrückblick/Check-in): dieselbe feste-Breite-Ursache vorsorglich behoben
- Ressourcen-Karten, Bild-Karussell, Diagramm-Komponenten (MediLogChart/PolyvagalDayChart/TensionDayChart) systematisch geprüft — bereits korrekt, keine Änderung nötig

## 🟢 Erledigt (vorherige Sitzung — Ablenkung/Zugang gründlicher Themenblock)
- Zugang: Speicherung bei vorzeitigem Brücken-Ausstieg (echter Datenverlust-Bug behoben)
- Ablenken: "Eigene Kategorie"-Bug behoben (nicht-reaktive Kategorieliste)
- Ablenken: Kategorien vollständig neu geordnet — Rätsel/Wortspiele/Brückenwörter/Rechnen/Sudoku/Fragen zum Nachdenken/Kuriose Fakten/Humor/Vokabeln/Eigene Kategorien
- Vokabeln als normale Kategorie statt isolierter Sonderposition
- Sudoku als eigene Top-Level-Kategorie mit echter Schwierigkeitsauswahl
- Eigene Inhalte jetzt in JEDER Kategorie möglich, nicht nur in eigenen Kategorien
- Einstellungen: neuer klar strukturierter "Ablenkung"-Bereich
- Rätsel-Pool um 10 verifizierte neue Aufgaben erweitert (Muster, Logik, Zahlen, Kombinatorik)
- Fragen zum Nachdenken um 12 echte philosophisch-psychologische Fragen erweitert
- Quellenangaben durchgängig geprüft — keine fehlenden, keine erfundenen

## ✅ STATUS: Grosse Mobile/Funktions-Ueberarbeitungsrunde abgeschlossen (diese Sitzung)
Alle vom Nutzer gemeldeten Fehler und Feature-Wuensche aus der grossen Mobile-Testrunde sind bearbeitet:
- Mehrere echte Layout-/Ueberlauf-Fehler bei Vollbild-Overlays gefunden und behoben (Loslassen, Timer, Ablenkung, Erdung) - durchgaengiges Muster: fehlendes overflow-y-auto + fehlender ModalStackContext-Schutz
- Timer-Vermischungsfehler bei Ressourcen behoben (Z-Index-Konflikt), freie Zeiteingabe ueberall ergaenzt
- Drei Drag-Interaktionen auf Mobile gehaertet (setPointerCapture auf currentTarget statt target, mit try/catch)
- Sicherheitsnetz-Ressourcen-Sync um Bild + laufende Aktualisierung erweitert
- Eigene Kategorien bei "wie hilft mir das" moeglich
- PDF-auf-iOS-Problem geloest (echter "In Safari oeffnen"-Weg statt nur Warnung)
- Vokabeln-Textabschneidung UND fehlende Tap-Flaeche behoben
- "Wichtige Kontakte" jetzt anklickbar (war es vorher nicht)
- Willkommens-Nachricht ueber Beispiele/Personalisierung ergaenzt
- Sanftes Kartenaufklappen (card-reveal) bei allen Modals + Bruecken-Detailseite
- Bruecken-Bauanimation deutlich ausgebaut (Sonnenaufgang, Pfeiler, laenger)
- Teilen-Funktion fuer Kontakte ergaenzt (Ressourcen/Bruecken/Lesezeichen hatten es bereits)
- Haptik UND sanfte Toene ergaenzt, beide ueber eigene Einstellungen-Schalter steuerbar (Toene standardmaessig aus)
- Bild-Zuschneiden bei eigenen Uploads ergaenzt
- Vorschlagbilder bei Ressourcen/Bruecken von 6 auf bis zu 18 erweitert
- Apps/Buecher als eigene Ressourcen-Kategorien

Nicht gefunden trotz gruendlicher Pruefung mit mehreren Datenszenarien: der gemeldete Fehler bei der "Zugang-Durchgang-beendet"-Anzeige - moeglicherweise geraetespezifisch, Screenshot vom Nutzer waere hilfreich falls das Problem weiterhin auftritt.


- Neue Anleitung: die große Anfangsanleitung selbst noch nicht überarbeitet/verkleinert (Kontexthilfe-Buttons sind bereits umgesetzt, das war der erste Teil davon)
- Tagebuch-Vorlagen, insbesondere eine bewusst einfache "Diary Card" (druckbar, PDF, an Therapeutin weitergebbar)
- Bedürfnis-Spiel/-Erkennung als spielerischer Zugang (die Bedürfnis-*Seite* selbst existiert bereits und wurde fachlich nach GFK überarbeitet) — konkretisiert: ein Spiel MIT dem Wesen über Gefühle und Bedürfnisse, das gleichzeitig beim Lernen/Benennen hilft (explizit vom Nutzer gewünscht)
- Update-Benachrichtigung für Nutzer: bei jedem neuen App-Update sollen bestehende Nutzer eine Nachricht sehen ("[Name] hat wieder was verbessert, bitte lade die App neu auf deinen Home-Bildschirm") — Mechanismus noch zu klären (z. B. Versionsnummer-Vergleich beim Start)
- Low-Capacity-Prinzip: Oberfläche passt sich rein interaktionsbasiert an geringere Kapazität an (noch nicht umgesetzt — siehe Notiz unten)
- Kostenpflichtige Zusatzfunktionen / Spendenmöglichkeit prüfen
- Mehr vorgespeicherte Beispiel-Vorlagen fürs Tagebuch
- "Das ist mir hier jetzt grad alles zu viel"-Option: das Wesen lenkt gezielt durch, weil die App sehr viele Funktionen hat
- Zusatzfunktionen für Therapeutinnen/Institutionen, optionale Auswertungen
- "Neuroaffektives Bilderbuch" als fachliche Inspirationsquelle prüfen
- Vollständige Gesamtanalyse der App
- Realistisches Praxistesten vorbereiten

## Für später (neu ergänzt, diese Sitzung)
- Bei Brücken: eigene Hindernisse ergänzen können (bei "Brücke bearbeiten"), die dann automatisch app-weit überall verfügbar sind, wo Hindernisse vorkommen
- Bei Brücken: mehrere Kategorien gleichzeitig auswählbar machen
- Wetter-Kreis: drehbar + neue Zustände (Schnee, Hagel, Brise, Wind, Sturm, Tornado, Hurrikan, Hitze/Dürre, Frost/Kälte)
- Wesen-Fenster am Laptop wieder abgeschnitten/nicht sichtbar (Regression erneut aufgetreten)
- Witze/Rätsel-Pool: Nutzer will nochmal durchgehen was bleibt/raus soll, plus eigene konkrete Beiträge ergänzen
- Einfaches Spiel mit dem Wesen (z. B. Hüpfen)
- Low-Capacity-Prinzip: Oberfläche passt sich interaktionsbasiert an geringere Kapazität an
- Mehr vorgespeicherte Beispiel-Vorlagen fürs Tagebuch
- "Das ist mir hier jetzt alles zu viel"-Option mit gezielter Führung durchs Wesen

## Grundsatzprinzipien (als Leitlinie bei jeder künftigen Entscheidung)
- Resonanz statt Optimierung, Wahl statt Zwang, Zugang statt Leistung
- "Das hilft gerade nicht" muss bei Übungen immer möglich sein
- "Ich weiß nicht" ist eine vollwertige Antwort, nie eine Sackgasse
- Check-In ≠ Tracking — Tracking bleibt vollständig optional/abschaltbar
- Nach innen UND nach außen balancieren, nicht nur Selbstbeobachtung
- Ressourcen (Dinge, auf die man zurückgreift) vs. Brücken (zusammengesetzte Handlungsmöglichkeiten aus Ressourcen) — Unterschied muss überall verständlich bleiben
- Quellen bei allen fachlichen Inhalten nachvollziehbar, keine Diagnosen, Modelle als Modelle kennzeichnen
