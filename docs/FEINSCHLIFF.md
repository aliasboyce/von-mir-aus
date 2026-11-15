# Feinschliff 15.11.2026 – was neu ist und wie man jedes Teil rückgängig macht

Sag einfach im Chat: **„F5 rückgängig“** (oder „F3 und F9 rückgängig“) – dann baue ich genau dieses eine Teil wieder aus, ohne die anderen anzufassen.
Alles auf einmal zurück: den letzten Stand vor dem Feinschliff aus der Sicherung (`von-mir-aus-stand-2026-11-15.zip`) oder über Git (`git revert` des Feinschliff-Commits).

| Nr. | Was | Wo im Code | Rückgängig (technisch) |
|---|---|---|---|
| **F1** | Größere Tippflächen (≥ 44 px): Kopfzeile (Suchen, Hilfe, Zurück, Mehr, Einstellungen, Postfach), Pins, Schließen-Knöpfe, Album-Knöpfe, Chips, Krisenmodus-Nummern | viele Dateien: `w-9/w-10 → w-11`, `min-h-[44px]`, `EmergencyCard.tsx`, `AlbumPage.tsx`, `FirstAidPage.tsx` | Größen zurücksetzen (Backup-Ordner `orig-feinschliff`) |
| **F2** | Unsichtbar größere Tippfläche für kleine Textlinks/Knöpfe (Klasse `hit44`, ändert das Aussehen nicht) | `index.css` (Block „Feinschliff F1/F2“), Klasse `hit44` in ~400 Stellen; `companion.css`, `network.css` | Block in `index.css` löschen → alle `hit44` wirken nicht mehr |
| **F3** | Einstellung „Zoomen mit zwei Fingern erlauben“ (Standard: **aus**, wie bisher) | `ThemeEffect.tsx`, `index.css` (`data-allow-zoom`), `SettingsPage.tsx`, `types.ts` | Karte „Textgröße“ in Einstellungen + Effekt in `ThemeEffect.tsx` entfernen |
| **F4** | Statusleiste des Handys passt sich dem Design an (`theme-color`) | `ThemeEffect.tsx` (Block „F4“) | Block entfernen → feste Farbe `#F7F3EA` aus `index.html` |
| **F5** | App-Kurzbefehle beim langen Drücken auf das App-Symbol (Krisenmodus, Kurz einchecken, Medi-Log) | `public/manifest.webmanifest` (`shortcuts`) | `shortcuts` löschen |
| **F6** | „Gelöscht · Rückgängig“ (7 Sek.) nach dem Löschen | `services/undoDelete.ts`, `app/UndoToast.tsx`, `repository.ts` (`recordRemoval`), `mediaStore.ts`, `AppShell.tsx` | `<UndoToast />` aus `AppShell.tsx` entfernen (Löschen wie vorher) |
| **F7** | Startablauf: neuer Schritt „Wie soll sich die App anfühlen?“ (Töne + Vibration / nur Vibration / still) | `IntroFlow.tsx` (Block „F7“, `setSoundStep`) | Beim „Weiter“ des Umfangs wieder `setTourStep(true)` statt `setSoundStep(true)` |
| **F8** | Leere Auswertungen mit Orientierung („Ein Check-in setzt den ersten Punkt …“) | `EmptyState.tsx` (`hint`), `TensionDayChart.tsx`, `MeineEntwicklungPage.tsx`, `MediLogChart.tsx` | Zusatztexte entfernen |
| **F9** | Textgröße Normal / Groß / Sehr groß | `index.css` (`data-text-size`), `ThemeEffect.tsx`, `SettingsPage.tsx` | CSS-Regeln `[data-text-size…]` löschen |
| **F10** | Seitentitel zeigt die Seite (z. B. „Medi-Log – von mir aus“) | `AppShell.tsx` (Block „F10“) | Block entfernen |
| **F11** | Eigene „maskable“-Icons, getrennt von den normalen | `public/icons/icon-maskable-*.png`, `manifest.webmanifest` | `icons` im Manifest wieder auf `any maskable` |
| **F12** | Ruhiger Startbildschirm auf dem iPhone | `public/splash/*`, `index.html` (`apple-touch-startup-image`) | Zeilen in `index.html` löschen |
| **F13** | Wechsel zwischen den vier Hauptseiten flinker (0,45 s; tiefe Seiten bleiben 0,8 s) | `index.css` (`.page-transition--tab`), `AppShell.tsx` | Klasse `page-transition--tab` entfernen |
| **F14** | Sanftes „Geschafft“-Signal (Ton + Vibration, nur wenn eingeschaltet) bei Check-in speichern, Medi-Log-Eintrag, Zugang abschließen | `services/completionMoment.ts` + 3 Aufrufe | Aufrufe `completionMoment(settings)` löschen |
| **F15** | Schatten mit einem Hauch der Designfarbe | `styles/tokens.css` (`--shadow-*`) | alte Werte stehen als Kommentar daneben |

## Ehrliche Grenzen
- F12 und F4/F5 wirken erst auf dem echten Handy (installierte App); im Browser-Test habe ich nur geprüft, dass die Dateien und Einträge stimmen.
- F11: Das Symbol (grüner Kreis) lag schon in der sicheren Zone – optisch ändert sich kaum etwas, es ist nur sauber getrennt.
- F6: Rückgängig gibt Einträge zurück; bei Bildern/Dateien bleibt die Datei 7 Sekunden erhalten, damit sie mit zurückkommen kann. Gelöschte Dinge, die gar nicht über die normale Löschfunktion laufen (z. B. „Alles zurücksetzen“), haben bewusst kein Rückgängig.
- F2 erweitert nur die Berührungsfläche. Bei sehr dicht stehenden Knöpfen kann sich die unsichtbare Fläche mit der Nachbarin überlappen – dann gewinnt der später gezeichnete.
