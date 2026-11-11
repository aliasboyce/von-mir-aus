# Durchsicht der vorgespeicherten Beispiele (10.11.2026)

Geprüft: Ressourcen/Skills, Hilfsmittel, Brücken (+ Brücken-Impulse), Ressourcen-Impulse, Netzwerk, Routinen-Vorlagen, Sicherheitsplan-Beispiele.
**Nichts wurde geändert** – das ist nur die Liste zum Entscheiden. Reihenfolge = Dringlichkeit.

## 1. Sollten raus oder mindestens eine deutliche Warnung bekommen (Sicherheit)
- **Skill „Carotis-Sanftdruck“** (data/seed/resources.seed.ts, `res_skill_carotis_druck`): Druck auf die Halsschlagader kann Herzrhythmus/Blutdruck stark verändern (Ohnmacht, bei Älteren/Herzproblemen gefährlich) und ist für Menschen mit Würge-/Halserfahrung ein möglicher Trigger. Keine Gegenanzeigen im Text. → Empfehlung: entfernen.
- **Skill „Oculocardiac-Reflex (Augendruck)“** (`res_skill_oculocardiac`): Druck auf die Augen ist medizinisch nicht unbedenklich (Netzhaut/Glaukom). Keine Gegenanzeigen. → Empfehlung: entfernen.
- **Skill „TIPP“** (`res_skill_tipp`): „50 Kniebeugen … bis zur Erschöpfung“ ohne Hinweis (Essstörung, Herz, Selbstbestrafung durch Sport). → „so viel, wie guttut“ + Gegenanzeigen wie beim Eiswasser-Skill.
- **Sicherheitsplan-Beispiel Stufe Rot**: „Kaltes Wasser ins Gesicht …“ (safetyPlansRepo.ts). Eiswasser hat Gegenanzeigen (Herz) und ist in manchen Lebenslagen heikel. → ersetzen durch etwas Neutrales („Hilfsperson anrufen“, „5-4-3-2-1“).
- **Skill „Eiskaltes Wasser“** hat Gegenanzeigen im Detail – gut. Aber in der kurzen Beschreibung steht keine; die Detailseite sollte immer mitgezeigt werden.

## 2. Passen inhaltlich nicht zu dem, was die App sonst vertritt (Wahl statt Zwang, kein Vorwurf)
- **Skill „Bereitwilligkeit vs. Einseitigkeit“**: „stur oder trotzig sperren“, „nicht, was will ich eigentlich?“ klingt nach Schuldzuweisung und kann Grenzen entwerten. → umformulieren oder entfernen.
- **Skill „Verhaltensänderung“**: „Lob und Konsequenzen setzen – bei sich selbst und anderen“ wirkt wie Erziehungsprogramm, nicht wie Selbstmitgefühl. → entfernen oder in „Kleine Fortschritte würdigen“ umformulieren.
- **Skill „Fakten-Check“**: „Katastrophengedanken“ kann bei Traumafolgen entwerten (die Alarmreaktion hatte oft einen echten Grund). → Satz weicher: „Passt die Stärke des Gefühls zu dem, was jetzt gerade ist – oder erinnert es an früher?“
- **Skill „PLEASE“**: „ausgewogen essen“, „Drogen/Alkohol meiden“, „täglich bewegen“ – für Menschen mit Essstörung/Sucht in Genesung eher Druck. → neutraler („dem Körper Grundlagen geben, soweit es geht“).

## 3. Falsche Schublade (Konzept der App: Brücke ≠ Übung)
- **Brücken „Der Salamander-Blick“, „Schulterkreisen (Fixierter Blick)“, „Isometrischer Hand-Zug“**: Das sind Einzelübungen mit nur einer Stufe – laut eigener Regel (bridgeImpulses.seed.ts) gehören Einzelübungen zu Ressourcen → Skills. → in Skills verschieben (die Brücken-Seite hat dadurch weniger „Übungs-Charakter“).
- **Brücken „Zum Atem zurückkehren“, „Musik & Klang“, „Etwas aufschreiben“** (bridges.seed.ts): prüfen, ob sie wirklich mehrere Stufen/Ressourcen verbinden – sonst dasselbe Problem.
- **Ressourcen „Waldspaziergang“, „Sanftes Piano“, „Atem holen“, „Wärmequelle“** haben DBT-Skill-Module als Kategorie (Emotionsregulation/Stresstoleranz/Achtsamkeit), sind aber Orte/Medien/Hilfsmittel/Aktivitäten. Sie tauchen dadurch unter Skills auf. → richtigen Typ geben (Ort, Musik, Aktivität, Hilfsmittel).
- **Doppelungen**: „Malen/kritzeln“ (Impuls) = „Kritzeln, malen oder kneten“ (Beispiel); „Strecke, die du gerne gehst“ = „Eine Runde gehen“; „Tanzen oder Schütteln“ = „Lieblingslied … mitwippen“; „Zeit mit einem Tier“ = Brücke „Einem Tier nah sein“ = Netzwerk „Meine Katze“.

## 4. Setzen etwas voraus, das nicht bei allen stimmt (können irritieren/triggern)
- **Ressourcen-Impulse**: „Ein Geruch aus deiner Kindheit“, „Ein Spiel oder Ritual aus früheren Zeiten“, „Eine Erinnerung, die dich zum Lächeln bringt“, „Ein Gericht, das dich an etwas Gutes erinnert“ – setzen eine gute Kindheit voraus. → Formulierung „… aus irgendeiner Zeit – falls es so etwas gibt“ oder „Ein Geruch, der dir guttut“.
- **„Eine Person, bei der du dich sicher fühlst“**: für manche gibt es (noch) keine. → „Eine Person, ein Tier oder ein Ort … – oder noch niemand, auch das ist okay“.
- **„Ein persönliches Hilfsmittel“** (id `wetterfeste-jacke`, Titel passt nicht zur Kennung) und **„Etwas, das dich klein und gleichzeitig ruhig fühlen lässt“** sind zu abstrakt/verwirrend. **„Ein Film oder eine Serie für ruhige Abende“** hat die id `dokumentarfilm` – nur intern, aber verwirrend beim Pflegen.
- **Brücke „Anrufen & Sprechen“ Stufe 3–4** („Aktiv erzählen, wie es dir geht“, „Zeit gemeinsam verbringen“): hübsche Steigerung, aber für Menschen mit Vertrauensproblemen sehr groß. → „Stufe 0: Ein Zeichen an jemanden denken“ ergänzen.

## 5. Netzwerk-Beispiele
- **„Meine Katze“** (Kategorie Person!): setzt ein Haustier voraus und liegt unter „Personen“. → als Beispiel „Mein Tier“ unter eigene Kategorie, oder streichen.
- **„Ärztin“, „Psychotherapeutin“, „Hausärztin“ nur weiblich; „Freundin“ + „Freund“ doppelt**; „Ärztin“ (Fachärztliche Hilfe) neben „Hausärztin“ verwirrt. → neutral („Ärzt:in“, „Hausarztpraxis“, „Vertraute Person“).
- Alle als **„wichtiger Kontakt“** markiert (Ärztin, Psychotherapeutin, Freundin) – das Beispiel suggeriert, wer wichtig sein sollte. → Markierung bei Beispielen weglassen.

## 6. In Ordnung / gut
- Routinen-Vorlagen (Morgen, Abend, Duschen, Essen, Schlaf, Spaziergang, Wohnung „5 Minuten“): niedrigschwellig, mit Stufen, „auch ganz klein“ – passt.
- Brücken-Impulse (14 Stück, alle mit Wert + kleinen Stufen) – passen zum Konzept.
- Sicherheitsplan-Beispiele außer Rot-Hilfe: gut, vor allem „Mir sagen, ich solle mich zusammenreißen“ bei „Was andere nicht tun sollen“.

*Wenn du möchtest, setze ich die Punkte um, die du absegnest (am besten: Block 1 sofort, Block 2–5 nach deiner Wahl).*


---
**Stand 11.11.2026: Entscheidungen umgesetzt** – Block 1 (Warnhinweise statt Entfernen), 2 (umformuliert), 3 (Einzelübungen → Skills, Ressourcen-Typen, Doppelungen raus), 4 (nur Hinweis „bei dir kann das anders sein“), 5 (Netzwerk neutral), 6 unverändert.
