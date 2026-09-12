# Begleiter-Dialogsystem — vollständige Übersicht

Diese Tabelle ist eine lesbare Ansicht von `src/components/companion/companionRegistry.ts`,
der **einzigen Quelle der Wahrheit** für alles, was der Begleiter sagt. Neue Sätze werden
ausschließlich dort im `COMPANION_LINES`-Array ergänzt — nicht hier direkt.

## Checkliste: Was ist pro Situationstyp schon abgedeckt?

| Situationstyp | Status | Wo im System |
|---|---|---|
| Beim ersten Öffnen einer Seite | ✅ fertig | Auslöser `erstes_oeffnen`, ausgelöst automatisch von `CompanionDock.tsx` |
| Bei wiederholtem Öffnen | ✅ fertig | Auslöser `leerlauf`, nur 12 % Chance (siehe unten, "bewusstes Schweigen") |
| Beim Erstellen eines Eintrags | ⚠️ teilweise | Auslöser `eintrag_erstellen` existiert in der Registry, ist aber nur bei Brücken tatsächlich verdrahtet |
| Beim Bearbeiten | ✅ fertig | Auslöser `eintrag_bearbeiten`, verdrahtet bei: Brücken, Ressourcen, Netzwerk (unterscheidet dort automatisch Neu-Erstellen von Bearbeiten bestehender Einträge) |
| Beim Speichern | ✅ fertig | Auslöser `speichern`, verdrahtet bei: Netzwerk, Tagebuch, Ressourcen, Brücken, Inner Weather, Tageskurve |
| **Bei einem Fehler** | ❌ noch nicht vorhanden | Es gibt aktuell **keinen** Fehler-Auslöser und keine Fehler-Sätze — das ist eine echte Lücke, siehe unten |
| Bei einer erfolgreichen Aktion | ✅ fertig | Läuft über denselben `speichern`-Auslöser |
| Auswahl Ressource/Brücke/Kontakt | ✅ fertig | Auslöser `ressource_auswahl`, `bruecke_auswahl`, `kontakt_auswahl` |
| Tipps | ✅ fertig | Kategorie `tipp`, pro Seite mehrere Varianten |
| Positive Sätze zwischendurch | ✅ fertig | Kategorie `positiv`, Seite `*` (überall), nur bei Leerlauf |
| Lustige Sätze | ✅ fertig | Kategorie `humorvoll`, Seite `*`, nur bei Leerlauf |
| Bewusstes Schweigen | ✅ fertig, siehe Abschnitt unten | — |

**Die ehrliche Lücke:** Es gibt noch keine Fehler-Sätze (z. B. "Speichern hat nicht geklappt").
Aktuell scheitert kein Speichervorgang in der App sichtbar — sollte sich das ändern (z. B. bei
einer künftigen Cloud-Synchronisation), braucht es einen neuen `fehler`-Auslöser plus passende,
warme (nicht technische) Formulierungen. Bewusst nicht vorgezogen, bis es einen echten
Anwendungsfall dafür gibt.

## Wann schweigt der Begleiter bewusst?

Das ist genauso wichtig wie das, was er sagt:

1. **Nie öfter als einmal pro Seite und Sitzung automatisch**, außer mit 12 % Zufallschance —
   das verhindert, dass er bei jedem Besuch derselben Seite dieselbe Erklärung wiederholt.
2. **Nie während ein Bearbeitungsfenster offen ist** — der Begleiter (schwebende Variante)
   wird komplett ausgeblendet, solange ein Modal aktiv ist (siehe `AppShell.tsx`).
3. **Nie doppelt auf der Startseite** — dort erscheint er nur groß/zentral, nicht zusätzlich klein.
4. **Jeder automatische Hinweis ist aktiv schließbar** (✕) und verschwindet spätestens nach
   9 Sekunden von selbst — er drängt sich nicht dauerhaft in den Vordergrund.
5. **Bei ausgeschaltetem Begleiter** (Einstellungen) erscheint er nirgends, auch nicht bei
   ausgelösten Aktionen wie Speichern.
6. **Beim Schlafen** sagt er nichts, bis er aktiv geweckt wird.

## Tabelle: Seite → Auslöser → Kategorie → Aussage

**Seite `*`** bedeutet: die Aussage kann auf jeder Seite als beiläufiger Kommentar erscheinen.
**Auslöser `leerlauf`** bedeutet: kein bestimmtes Ereignis, sondern ein gelegentlicher,
unaufdringlicher Kommentar.

| Seite | Auslöser | Kategorie | Aussage |
|---|---|---|---|
| `/` | erstes Öffnen | Einführung | Schön, dass du da bist. |
| `/` | erstes Öffnen | Einführung | Hallo. Ich bin hier, ganz in deinem Tempo. |
| `/` | wiederholtes Öffnen | Einführung | Da bist du ja. Kein Grund zur Eile. |
| `/` | wiederholtes Öffnen | Einführung | Willkommen zurück. |
| `/` | erstes Öffnen | beruhigend | Du musst hier nichts leisten — nur schauen, was gerade da ist. |
| `/` | Leerlauf | Tipp | Ein kleiner Check-in reicht schon. |
| `/` | Leerlauf | beruhigend | Kein Druck. Du entscheidest, was du gerade brauchst. |
| `/inneres-wetter` | erstes Öffnen | beruhigend | Es gibt kein falsches Wetter. |
| `/inneres-wetter` | erstes Öffnen | Anleitung | Du kannst jederzeit überspringen. |
| `/inneres-wetter` | Leerlauf | beruhigend | Nimm dir die Zeit, die es braucht — auch wenn das eine Sekunde ist. |
| `/inneres-wetter` | Inner Weather | Kontext | Magst du kurz schauen, wie es dir gerade geht? |
| `/inneres-wetter` | Inner Weather | beruhigend | Es gibt kein richtig oder falsch — nur eine Momentaufnahme. |
| `/inneres-wetter` | Speichern | Feedback | Danke, dass du kurz bei dir warst. |
| `/bruecken` | erstes Öffnen | Erklärung | Level 1 ist genauso gültig wie Level 4. |
| `/bruecken` | Brücke wählen | Tipp | Wähle das, was sich gerade richtig anfühlt, nicht das, was am meisten bringt. |
| `/bruecken` | Brücke wählen | Anleitung | Du kannst jederzeit ein anderes Level wählen. |
| `/bruecken` | Eintrag erstellen | Erklärung | Eine Brücke ist ein kleiner Schritt, kein Sprung. |
| `/bruecken` | Speichern | Feedback | Deine Brücke ist gespeichert. |
| `/entdecken` | erstes Öffnen | Einführung | Hier findest du Dinge, die dir sonst schwerer zugänglich sind. |
| `/entdecken` | Leerlauf | beruhigend | Nichts hier ist in Stein gemeißelt — alles darf sich verändern. |
| `/entdecken/ressourcen` | erstes Öffnen | Erklärung | Ressourcen sind Dinge, die dir selbst Halt geben. Brücken sind kleine Schritte, die dich von hier zu etwas anderem hinführen — zu dir, zu deinem Körper, zu anderen oder nach draußen. |
| `/entdecken/ressourcen` | Leerlauf | Tipp | Auch ein einzelnes Lied kann eine Ressource sein. |
| `/entdecken/ressourcen` | Leerlauf | Funktionshinweis | Favoriten helfen dir, schnell zurückzufinden. |
| `/entdecken/ressourcen` | Speichern | Feedback | Ressource gespeichert. |
| `/entdecken/ressourcen` | Ressource auswählen | Feedback | Schön, dass du das entdeckt hast. |
| `/entdecken/zugangsrad` | erstes Öffnen | Erklärung | Nicht zugänglich bedeutet nicht verschwunden. |
| `/entdecken/zugangsrad` | Leerlauf | Anleitung | Die Regler dürfen sich täglich verschieben. |
| `/entdecken/zugangsrad` | Leerlauf | Tipp | Verknüpfe hier etwas Konkretes, das dir hilft, wenn dieser Bereich sich fern anfühlt. |
| `/entdecken/beduerfnis-kompass` | erstes Öffnen | Ermutigung | Ein Bedürfnis zu erkennen ist schon ein wichtiger Schritt. |
| `/entdecken/beduerfnis-kompass` | Leerlauf | Erklärung | Es gibt meist mehr als einen Weg, ein Bedürfnis zu erfüllen. |
| `/entdecken/tageskurve` | erstes Öffnen | beruhigend | Ein Punkt reicht — du musst nicht den ganzen Tag tracken. |
| `/entdecken/tageskurve` | Leerlauf | Erklärung | Muster zeigen sich erst mit der Zeit, das ist normal. |
| `/entdecken/tageskurve` | Tageskurve | Feedback | Gespeichert. |
| `/sicherheit` | erstes Öffnen | Einführung | Das hier ist dein privater, geschützter Bereich. |
| `/sicherheit` | Leerlauf | beruhigend | Du bestimmst, was hier hineinkommt. |
| `/sicherheit/netzwerk` | erstes Öffnen | Anleitung | Du kannst die Knoten frei anordnen, wie es sich stimmig anfühlt. |
| `/sicherheit/netzwerk` | Leerlauf | Tipp | Auch Orte oder Lieblingslieder dürfen hier rein. |
| `/sicherheit/netzwerk` | Speichern | Feedback | Person gespeichert. |
| `/sicherheit/netzwerk` | Löschen | Feedback | Verbindung gelöscht. |
| `/sicherheit/netzwerk` | Kontakt auswählen | Kontext | Diese Person hilft dir vielleicht gerade. |
| `/sicherheit/plan` | erstes Öffnen | Einführung | Das hier ist deine Struktur für schwierige Momente — persönlich, nicht klinisch. |
| `/sicherheit/plan` | Leerlauf | beruhigend | Dieser Plan darf sich jederzeit verändern. |
| `/sicherheit/plan` | Leerlauf | Funktionshinweis | Du kannst ihn als PDF exportieren und teilen, wenn du magst. |
| `/sicherheit/plan` | Sicherheitsplan-Limit | Erklärung | Ich gebe dir hier nur drei Möglichkeiten, damit du im entscheidenden Moment nicht erst aus vielen Dingen auswählen musst. Wir suchen lieber die wenigen Dinge heraus, die dir wirklich helfen. |
| `/sicherheit/plan` | Sicherheitsplan-Limit | Erklärung | In einer belastenden Situation ist eine kleine Auswahl leichter zugänglich als eine lange Liste. Deshalb gibt es hier bewusst nur drei Plätze — für das, was wirklich hilft. |
| `/sicherheit/plan` | Sicherheitsplan-Limit | Erklärung | Wenn es schwer wird, hilft wenig Auswahl mehr als viel. Drei gut gewählte Dinge findest du schneller wieder als zehn. |
| `/sicherheit/tagebuch` | erstes Öffnen | Einführung | Ein ruhiger, privater Ort — nur für dich. |
| `/sicherheit/tagebuch` | Leerlauf | beruhigend | Niemand liest hier mit außer dir. |
| `/sicherheit/tagebuch` | Leerlauf | Ermutigung | Auch ein einziger Satz zählt als Eintrag. |
| `/sicherheit/tagebuch` | Speichern | Feedback | Eintrag gespeichert. |
| `/einstellungen` | erstes Öffnen | Funktionshinweis | Du darfst mich jederzeit gegen ein anderes Wesen tauschen. |
| `/einstellungen` | Einstellungen | Einführung | Farbwelt, Sprache, Bewegung — alles anpassbar. |
| `*` | Leerlauf | positiv | Du bist schon einen Schritt weiter, als du denkst. |
| `*` | Leerlauf | positiv | Dass du hier bist, ist schon etwas. |
| `*` | Leerlauf | positiv | Du kennst dich besser, als es sich manchmal anfühlt. |
| `*` | Leerlauf | positiv | Kleine Momente der Achtsamkeit summieren sich. |
| `*` | Leerlauf | beruhigend | Atme kurz durch. Ich warte hier. |
| `*` | Leerlauf | beruhigend | Alles darf langsamer werden. |
| `*` | Leerlauf | beruhigend | Du musst gerade nichts entscheiden. |
| `*` | Leerlauf | beruhigend | Ein Moment nach dem anderen reicht. |
| `*` | Leerlauf | humorvoll | Ich zähl mal meine Funken. Eins, zwei… ah, verzählt. |
| `*` | Leerlauf | humorvoll | Falls ich gerade komisch schaue — das ist nur mein Nachdenk-Gesicht. |
| `*` | Leerlauf | humorvoll | Ich schwebe hier einfach mal ein bisschen rum. |
| `*` | Leerlauf | humorvoll | Kein Druck, aber ich find dich schon ziemlich gut. |
| `*` | Speichern | Feedback | Gut. Weiter geht's. |
| `*` | Speichern | Feedback | Alles gespeichert. |
| `*` | Speichern | Feedback | Das ist notiert. |
| `*` | Speichern | Feedback | Schön gemacht. |

## Wie es funktioniert

- **`CompanionDock.tsx`** ruft bei jedem Seitenwechsel `pickTip(pathname, firstVisit)` auf
  (aus `pageTips.ts`). Beim ersten Besuch einer Seite in der Sitzung wird bevorzugt eine
  Zeile mit Auslöser `erstes_oeffnen` gezeigt, danach nur noch selten (12 % Chance) eine
  mit `leerlauf`. Zusätzlich gibt es eine 22-%-Chance auf einen globalen, unaufdringlichen
  Kommentar (positiv/beruhigend/humorvoll) statt der Seiten-Erklärung.
- **Einzelne Seiten** können gezielt eine bestimmte Kategorie/Auslöser-Kombination abfragen,
  z. B. der Sicherheitsplan für die 3er-Grenzen-Erklärung:
  `pickLine({ page: '/sicherheit/plan', trigger: 'sicherheitsplan_limit' })`.
- **Noch nicht verdrahtet**, aber in der Registry-Struktur bereits vorbereitet: Auslöser wie
  `eintrag_bearbeiten`, `ressource_auswahl`, `bruecke_auswahl` an den jeweiligen
  Bearbeiten-/Auswahl-Stellen im Code aufzurufen. Das ist der nächste sinnvolle Schritt,
  sobald wir gemeinsam Seite für Seite festlegen, wo genau der Begleiter zusätzlich etwas
  sagen soll.

## Wie man einen neuen Satz hinzufügt

In `src/components/companion/companionRegistry.ts`, im `COMPANION_LINES`-Array:

```ts
{ id: 'eindeutige-id', text: 'Der neue Satz.', category: 'tipp', page: '/bruecken', trigger: 'leerlauf' },
```

`category` und `trigger` sind über TypeScript-Unions abgesichert — ein Tippfehler fällt
sofort beim Bauen der App auf.
