# Begleiter-Content-System — formale Übersicht

Diese Datei beschreibt das Begleiter-System als ein zusammenhängendes Ganzes, nicht als lose Sammlung einzelner Sätze. Sie ordnet jede Art von Begleiter-Content einer klaren Funktion zu und zeigt, wo im Code sie jeweils lebt.

Der eigentliche Satz-Inhalt steht separat in docs/companion-full-line-export.md (reines Nachschlage-Dokument, nicht zur Einbindung in die App). Diese Datei hier beschreibt das System dahinter.

---

## Die 12 Content-Arten

| # | Art | Zweck | Wo im Code |
|---|-----|-------|-----------|
| 1 | Begrüßung | Erster Kontakt beim App-Öffnen | companionRegistry.ts, Kategorie einfuehrung, Seite /, Auslöser erstes_oeffnen; ergänzt durch homeCompanionLines.ts (tageszeit-/wetterabhängig) |
| 2 | Seitentipp | Spontaner, seitenbezogener Hinweis ohne konkreten Auslöser | companionRegistry.ts, Auslöser leerlauf, ausgewählt über pageTips.ts |
| 3 | Erklärung | Das "Warum" hinter einer Design-Entscheidung | Kategorie erklaerung — z. B. warum der Sicherheitsplan nur Schwarz/Weiß ist, warum es nur 3 Plätze pro Warnstufe gibt |
| 4 | Kontext-Tipp | Situationsgebunden, reagiert auf einen konkreten Zustand | Kategorie kontext — z. B. der Hinweis im Zugangsrad nach einem kürzlichen Inner-Weather-Check-in |
| 5 | Bestätigung | Reine Rückmeldung auf eine Aktion, ohne Wertung | Kategorie feedback, Auslöser speichern/loeschen — "Gespeichert.", "Notiert." |
| 6 | Ermutigung | Aktive, wertschätzende Zusprache | Kategorie ermutigung und positiv, häufig Auslöser leerlauf |
| 7 | Humor | Liebevoll-charmante, unaufgeforderte Auflockerung | Kategorie humorvoll, Seite * (global), Auslöser leerlauf |
| 8 | Leerlauf | Sammelbegriff für alles, was ohne direkten Anlass erscheint | Auslöser leerlauf selbst — überschneidet sich mit Humor/Ermutigung/Kontext-Tipp, ist aber technisch der gemeinsame Auslöser-Typ dafür |
| 9 | Animation | Nonverbale Reaktion des Wesens selbst | Kein Text — LichtCompanion.tsx (Bewegungs-Klassen je Persönlichkeit), companion.css (Aufheben/Loslassen-Wackeln, 4 Freude-Varianten), joyBurst-Prop |
| 10 | Intro | Die einmalige Anfangs-Erzählung | IntroFlow.tsx — eigene, feste Folienabfolge, nicht Teil des zufälligen Satz-Pools |
| 11 | App-Tour | Geführter Rundgang durch die echte App nach dem Intro | AppTourOverlay.tsx — feste, geordnete Stationsliste mit echter Navigation, ebenfalls nicht Teil des Zufalls-Pools |
| 12 | Fehler-/Hilfesituation | Unterstützung in schwierigen Momenten | DistractionOverlay.tsx ("Lenk mich ab"), GroundingOverlay.tsx ("Hilf mir beim Orientieren"), Sicherheitsplan-Erklärungen (Kategorie erklaerung auf /sicherheit/plan) |

## Die 15 Auslöser (CompanionTrigger)

Jede Zeile im Register ist genau einem Auslöser zugeordnet — das steuert, wann sie infrage kommt, unabhängig von der inhaltlichen Art oben:

erstes_oeffnen, wiederholtes_oeffnen, eintrag_erstellen, eintrag_bearbeiten, speichern, loeschen, ressource_auswahl, bruecke_auswahl, kontakt_auswahl, inner_weather, tageskurve, sicherheitsplan_limit, netzwerk, einstellungen, timer_start, timer_ende, leerlauf

## Die 11 Kategorien (CompanionCategory)

Jede Zeile hat zusätzlich genau eine Kategorie — das steuert die Persönlichkeits-Passung (jeder Begleiter hat 2 bevorzugte Kategorien):

einfuehrung, anleitung, erklaerung, tipp, ermutigung, beruhigend, positiv, humorvoll, feedback, funktionshinweis, kontext

## Wie eine Zeile ausgewählt wird

1. getLines() filtert nach Seite + Auslöser (Register-Datei companionRegistry.ts)
2. Falls der aktuelle Begleiter bevorzugte Kategorien hat: diese werden im Auswahl-Pool doppelt gewichtet (nicht exklusiv — der vorherige exklusive 75%-Filter hat den Pool künstlich verkleinert und wurde deshalb korrigiert)
3. pickAvoidingRepeats() schließt die letzten 6 tatsächlich gezeigten Sätze aus, damit sich nichts direkt wiederholt
4. Bei aktivierter englischer Sprache wird automatisch textEn statt text verwendet (zentral synchronisiert über CompanionSpeechProvider, kein Umbau an jeder Aufrufstelle nötig)

## Wiederholungsschutz

Session-weites Gedächtnis der letzten 6 gezeigten Sätze (recentLines in companionRegistry.ts), setzt sich bei echtem Neuladen zurück. Fällt automatisch auf den vollen Pool zurück, falls eine Kategorie zu wenige Sätze für den Ausschluss hätte — nie stumm wegen des Schutzes selbst.

## Zusätzliche, unabhängige Nutzer-Steuerung

- "Keine Tipps mehr (diese Sitzung)" — Link direkt in der Tipp-Blase, betrifft nur automatische Seitentipps, nicht direkte Aktions-Rückmeldungen
- Name-Personalisierung — falls der Nutzer beim ersten Start einen Namen angegeben hat, mischt homeCompanionLines.ts mit ~20% Wahrscheinlichkeit namentliche Varianten in den Startseiten-Kontext-Pool

## Bewusst außerhalb dieses Systems

- Intro-Folien und App-Tour-Stationen sind feste, geordnete Abfolgen — kein Zufall, keine Wiederholungsvermeidung nötig, da sie nur einmal (bzw. bei explizitem Zurücksetzen) durchlaufen werden
- Notfallnummern, Quellen-Beschreibungen sind Fakteninhalte, keine Begleiter-Sätze, auch wenn sie teils in Begleiter-Sprechblasen erscheinen können
