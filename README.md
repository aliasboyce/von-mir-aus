# InnerPath

Ein ruhiger, persönlicher Ort für Alltag, Ressourcen und Selbstfürsorge — insbesondere für Menschen mit komplexen Traumafolgen, dissoziativen Erfahrungen, oder für alle, die sich eine sanfte, nicht-zwingende Begleitung im Alltag wünschen.

InnerPath ist **keine medizinische Diagnose-App und keine therapeutische KI**. Es gibt in der App selbst keine generative KI, keinen Chat und keine automatische Analyse. Alle Inhalte sind persönliche Selbstreflexion, Orientierung und Ressourcenverwaltung — entschieden und gestaltet vom Nutzer selbst.

> Du musst nicht funktionieren. Du musst nicht alles schaffen. Du darfst klein anfangen.

## Tech Stack

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS v4** für Utility-Styling, kombiniert mit zentralen CSS-Variablen (Design Tokens) für Farben, Radius, Schatten, Spacing und Typografie
- **react-router-dom** für Routing
- **localStorage** als aktueller Storage-Adapter (offline-first, siehe Architektur unten)
- **lucide-react** für Icons
- PWA-vorbereitet (Manifest, installierbar)

Kein Backend, kein Account-Zwang, keine externen Analyse-Dienste. Alle Daten bleiben auf dem Gerät.

## Lokale Installation

```bash
npm install
```

## Entwicklung

```bash
npm run dev
```

Öffnet die App unter `http://localhost:5173`.

## Build

```bash
npm run build
```

Erstellt die Produktions-Version in `dist/`. Mit `npm run preview` kann der Build lokal getestet werden.

## Architekturüberblick

```
src/
  app/                  App-Shell (Layout, Outlet, Bottom-Navigation-Sichtbarkeit)
  components/
    ui/                 Design-System-Primitiven: Button, Card, Chip, Modal, EmptyState
    brain/              Das kleine Gehirn — wiederkehrender Begleiter
    navigation/         BottomNav, TopBar
  features/             Ein Ordner pro fachlichem Bereich (siehe unten)
  data/
    types.ts            Zentrales Datenmodell für ALLE Entitäten der App
    seed/                Demo-/Beispielinhalte
  services/
    storage/             Storage-Abstraktion (siehe unten)
  i18n/                  Übersetzungen (de/en) + Sprachkontext
  state/                 SettingsContext (Sprache, Theme, Farbwelt, Begleiter …) + ThemeEffect
  styles/
    tokens.css           Design Tokens als CSS-Variablen (Farben, Radius, Schatten, Spacing, Motion)
```

### Feature-Ordner (`src/features/`)

| Ordner | Bereich |
|---|---|
| `home/` | Startseite, Entdecken-Hub, Sicherheit-Hub |
| `innerWeather/` | Inner Weather Check-in (Zustand → optional Bedürfnis-Kompass) |
| `bridges/` | Brücken: Kategorien, Level, Detailseite |
| `resources/` | Ressourcenbibliothek: CRUD, Kategorien, Favoriten |
| `safetyNet/` | Sicheres Netz + Wichtige Kontakte |
| `safetyPlan/` | Sicherheitsplan: editierbare Sektionen |
| `diary/` | Tagebuch: Einträge, Suche |
| `settings/` | Einstellungen: Sprache, Theme, Farbwelt, Begleiter, Datenschutz-Hinweis |

Jedes Feature folgt demselben Muster: ein `*Repo.ts` (Datenzugriff über die Storage-Schicht), optionale `*Meta.ts` (Labels/Icons je Kategorie) und eine oder mehrere `*Page.tsx`.

### Storage-Schicht (`src/services/storage/`)

Kein Feature ruft `localStorage` direkt auf. Stattdessen:

- **`StorageAdapter.ts`** definiert ein austauschbares Interface (`getItem`, `setItem`, `removeItem`, `listKeys`) und implementiert es aktuell mit `localStorage`.
- **`repository.ts`** bietet `createRepository<T>(key)` für Sammlungen (Brücken, Ressourcen, Netzwerk-Einträge, Tagebucheinträge …) mit CRUD-Methoden.
- **`keyValueStore.ts`** bietet `createKeyValueStore<T>(key, fallback)` für Einzelobjekte (Settings, Sicherheitsplan).

**Warum das wichtig ist:** Wenn später IndexedDB, Supabase oder eine andere Synchronisationslösung ergänzt wird, muss nur `StorageAdapter.ts` ausgetauscht bzw. erweitert werden — kein Feature-Code ändert sich.

### Zentrales Datenmodell (`src/data/types.ts`)

Alle Entitäten (`WeatherCheckIn`, `NetworkEntry`, `Bridge`, `Resource`, `SafetyPlan`, `DiaryEntry`, `UserSettings`, …) sind hier einmal definiert. Das Modell enthält bereits vorbereitete Felder für Funktionen, die noch nicht gebaut sind (z. B. `NeedDirection` für den späteren Bedürfnis-Kompass, `AccessWheelEntry` für das Zugangsrad), damit spätere Iterationen keine Breaking Changes am Datenmodell brauchen.

### Design-System (`src/styles/tokens.css`)

Alle Farben, Radien, Schatten, Abstände und Schriften sind als CSS-Variablen definiert — nichts ist hart codiert. Vier Farbwelten (Neutral, Wald, Meer, Abend) sind über `[data-palette]`-Selektoren vorbereitet, Dark Mode über `[data-theme='dark']`. Beide werden zur Laufzeit über `ThemeEffect.tsx` auf `<html>` gesetzt, basierend auf den Einstellungen in `SettingsContext`.

`prefers-reduced-motion` wird respektiert; zusätzlich gibt es einen expliziten „Animationen reduzieren“-Schalter in den Einstellungen (`[data-reduce-motion]`).

### Internationalisierung (`src/i18n/`)

`de.ts` und `en.ts` exportieren dasselbe TypeScript-Interface (`TranslationDictionary`), sodass fehlende Übersetzungen ein Compile-Fehler sind, nicht ein stiller Bug. Komponenten lesen Texte ausschließlich über `useT()`, nie durch direkten Dictionary-Import.

### Das kleine Gehirn (`src/components/brain/Brain.tsx`)

Eine einzelne, freundliche Begleiter-Komponente mit zwei Zuständen (wach/schlafend), steuerbar über die Einstellungen. Bewusst einfach gehalten für Version 1 — aber als eigenständige Komponente mit klarer Props-Schnittstelle gebaut, damit spätere Varianten (verschiedene Gehirne, Persönlichkeiten, kontextbezogene Hinweise) ergänzt werden können, ohne die Aufrufstellen zu ändern.

## Was in Version 1 funktioniert

- Ruhige Startseite mit Begrüßung, Begleiter (Gehirn), Inner-Weather-Einstieg, optionaler sanfter Erinnerungs-Hinweis
- Inner Weather Check-in (7 Wetterzustände → optionaler Bedürfnis-Kompass → Abschluss), jederzeit überspringbar, lokal gespeichert
- **Zugangsrad**: 7 Lebensbereiche (Wissen, Fähigkeiten, Ressourcen, Menschen, Orte, Aktivitäten, Strategien) als Radar-Visualisierung, per Regler einstellbar
- **Bedürfnis-Kompass**: verbindet einen ausgewählten Bedürfnis-Bereich mit passenden Einträgen aus dem Sicheren Netz und passenden Brücken — die zentrale "Systeme verbinden"-Idee aus dem Konzept
- **Polyvagale Tageskurve**: schneller 3-Zonen-Check-in (ruhig & verbunden / aktiviert / reduziert), daraus entsteht ein Tagesdiagramm
- Brücken: 4 Kategorien, 5 Beispiel-Brücken, Detailseite mit Level-Auswahl, Favoriten
- Ressourcenbibliothek: Kategorien, Erstellen/Bearbeiten/Löschen, Favoriten, Link, **Teilen** (Web-Share-API mit Zwischenablage-Fallback)
- **Sicheres Netz**: interaktive Netzwerk-Visualisierung (schwebende, verschiebbare Knoten), Vollbild-Ansicht mit Pan/Zoom, editierbare Kategorie-Farben mit vorgeschlagener Pastell-Palette + eigenen Paletten, eigene Kategorien, Icon/Foto pro Eintrag, Kommunikationspfade zwischen Personen, Verlinkung zu Ressourcen, Wichtige Kontakte (auf 5 begrenzt, "Alle Kontakte"-Seite für den Rest)
- Sicherheitsplan: editierbare Sektionen, Krisenzeile, **echter PDF-Export** über die Druckfunktion des Browsers (Drucken → Als PDF speichern)
- Tagebuch: Einträge mit automatischem Datum/Zeit, Suche, Bearbeiten, Löschen
- Einstellungen: Sprache (DE/EN), Theme (Hell/Dunkel/System), 4 Farbwelten, Begleiter an/aus, Animationen reduzieren, **sanfte In-App-Erinnerung** für den Inner-Weather-Check-in (Uhrzeit einstellbar), Datenschutz-Hinweis
- Sanfte Seitenübergänge und ein deutlich liebevoller gestalteter Begleiter (große Augen, Blush, Blinzeln, Hüpfen beim Antippen)
- Vollständig responsiv (Mobile-first, funktioniert bis Desktop), Tastaturbedienbar, `prefers-reduced-motion`-konform

## Bewusst getroffene Architekturentscheidungen

- **Kein Account-System / kein Login in Version 1.** Der ursprüngliche Fragebogen hat die Entscheidung bewusst offengelassen ("man darf das erstmal selbst entscheiden"). Ein echtes E-Mail/Passwort- oder Social-Login braucht ein Backend (z. B. Supabase) — das ist eine grundlegende Architekturentscheidung mit Hosting-/Kostenfolgen, die wir gemeinsam bewusst treffen sollten, statt sie nebenbei mitzubauen. Die App funktioniert bewusst weiterhin komplett lokal und ohne Zwang; ein Account-System lässt sich später sauber ergänzen, ohne bestehende Daten zu verlieren (die Storage-Schicht ist genau dafür vorbereitet).
- **PDF-Export über die Browser-Druckfunktion statt einer PDF-Bibliothek.** Funktioniert sofort, offline, auf allen Plattformen, ohne zusätzliches Bundle-Gewicht. Wer eine Bilddatei statt eines nativen "Drucken"-Dialogs möchte, kann das später mit einer dedizierten PDF-Bibliothek ergänzen.
- **Erinnerungen sind aktuell In-App-Hinweise, keine Push-Benachrichtigungen.** Echte Push-Benachrichtigungen brauchen einen Service Worker und (für iOS) eine installierte PWA — beides ist vorbereitbar, aber ein eigener nächster Schritt.
- **Diary Cards** bleiben bewusst für eine spätere Version reserviert (wie ursprünglich besprochen).

## Bewusst noch nicht vollständig gebaut (siehe Roadmap)

- Diary Cards (schnelle, teilbare Tageskarten)
- Freundeverbindungen, selektives Teilen von Sicherheitsplänen, Accounts, Cloud-Synchronisation
- Push-Benachrichtigungen (echte, geräteweite Erinnerungen)
- Komplexere Statistiken / Verlauf über mehrere Tage bei der Tageskurve

## Roadmap (Vorschlag für nächste Iterationen)

1. Diary Cards — kurze, schnell ausfüllbare Tageskarten, teilbar
2. Mehrtägiger Verlauf der Tageskurve (nicht nur "heute")
3. Push-Benachrichtigungen via Service Worker (PWA-Installation vorausgesetzt)
4. Backend-Entscheidung für Accounts + Sync (z. B. Supabase), wenn gewünscht
5. Granulares Teilen (Sicherheitsplan, einzelne Ressourcen) zwischen Nutzer:innen
6. IndexedDB-Adapter als Ersatz/Ergänzung für `localStorage`
7. Native iOS-/Android-App auf Basis derselben Architektur

## Wichtige Architekturentscheidungen

- **Warum kein IndexedDB von Anfang an?** `localStorage` ist für Version 1 einfacher, synchron und ausreichend für die Datenmengen, um die es hier geht. Da alle Zugriffe über die Storage-Schicht laufen, ist ein späterer Wechsel isoliert und risikoarm.
- **Warum Tailwind v4 statt eines CSS-Frameworks mit Komponenten?** Tailwind liefert nur Utilities: die eigentliche visuelle Identität kommt vollständig aus `tokens.css`. Das hält das Design konsistent und leicht themenfähig, ohne fremde Komponenten-Optik zu übernehmen.
- **Warum Bottom-Nav mit nur 4 Punkten?** Laut Briefing soll die Navigation ruhig und übersichtlich bleiben. Home, Entdecken, Brücken und Sicherheit fassen die zwölf fachlichen Bereiche sinnvoll zusammen; Unterbereiche (Netzwerk, Sicherheitsplan, Tagebuch, Ressourcen) sind über Hub-Seiten erreichbar.
