/**
 * "Das hier ist die komplette, neue Beschreibung... Wort für Wort
 * ganz genau so, das einzige was du machst ist anschaulich in
 * Absätze, Farben, fett und kursiv geschriebene Dinge darstellen"-
 * Auftrag — the person's own text, kept as close to word-for-word as
 * formatting into paragraphs/headings/lists requires, rendered via
 * MarkdownLite. Nothing paraphrased or shortened; only structured.
 * See ArousalModelExplainer.tsx for how the six zone headings get
 * their color from AROUSAL_BANDS via headingColorFor.
 */
export const AROUSAL_EXPLAINER_TEXT = `
Die Polyvagal-Theorie erklärt, wie unser autonomes Nervensystem unbewusst und rein biologisch zwischen den drei Grundzuständen **Sicherheit** (soziale Verbundenheit), **Kampf/Flucht** (Aktivierung) und **Kollaps** (Shutdown) umschaltet.

Der DBT-Ansatz übersetzt diese biologischen Zustände in eine konkrete Skala von 0 bis 100 %, um die innere Spannung messbar, greifbar und durch gezielte Verhaltens-Skills steuerbar zu machen.

Zusammen bilden sie eine biologische Landkarte.

### Erholungsphase

**15–30 %** — Hier bist du entspannt, im Ruhemodus und regenerierst. Deine Gedanken laufen geordnet und langsam. In dieser Phase bist du empfänglich für klassische Entspannungsübungen, Achtsamkeit, ein gutes Buch oder ein warmes Bad. Es ist die Phase, in der dein Nervensystem Kraft tankt.

### Konzentration & Alltag

**Ab 30–50 %** — Hier setzt die fokussierte Konzentration ein. Du brauchst diese Anspannung, um morgens in die Gänge zu kommen, zur Arbeit zu gehen oder am PC Aufgaben zu lösen. Deine Gedanken werden schneller.

### Fokus & Flow

**Um die 40–60 %** — Ein optimaler Flow (völliges Aufgehen in einer Aufgabe bei hoher Konzentration) liegt meist im Bereich von 40 bis 60 % Anspannung. Du bist maximal aufmerksam, kognitiv voll leistungsfähig und steuerst dein Handeln absolut rational.

### Frühwarnbereich

**60–70 %** — Die Konzentration droht in Stress umzukippen. Das Denken funktioniert zwar noch, aber du merkst, dass du unruhig wirst. Hier greift man in der DBT zu Frühwarn-Skills (z. B. bewusste Pausen, Bewegung), um nicht weiter zu steigen.

### Hyperarousal (Übererregung)

Das Hyperarousal beginnt ab ca. **70 %** Anspannung.

- **Was im Körper passiert:** Das sympathische Nervensystem übernimmt komplett die Kontrolle. Es schüttet Adrenalin und Cortisol aus. Der Körper schaltet auf Kampf oder Flucht (*Fight or Flight*).
- **Typische Symptome:** Herzrasen, flache Atmung, massive innere Unruhe, Angst, Panik, Wutausbrüche, rasende Gedanken oder der Drang, wegzulaufen.
- **In der DBT:** Ab dieser Grenze greift der Notfallkoffer / die Stresstoleranz-Skills. Logisches Denken ist blockiert, weshalb normale Gespräche oder Einsichten hier nicht mehr funktionieren.

In der DBT-Praxis und Neurobiologie unterteilt man den Hochstressbereich (70–100 %) anhand der dominanten Verhaltensimpulse (*Fight, Flight, Freeze, Fawn*) und dem Grad des kognitiven Kontrollverlusts:

- **Das kontrollierte Hyperarousal — Fight / Flight (Kampf oder Flucht), ca. 70–85 %:** Das sympathische Nervensystem läuft auf Hochtouren. Der Verstand ist stark eingeengt (Tunnelblick), aber du bist noch voll handlungsfähig — allerdings rein impulsgesteuert.
  - Der *Flight*-Impuls (Flucht): Äußert sich als extreme, motorische Getriebenheit, Panik, das unbändige Bedürfnis, sofort den Raum zu verlassen, oder rasende, chaotische Gedanken, um einer Situation gedanklich zu entfliehen.
  - Der *Fight*-Impuls (Kampf): Schlägt um in pure Reizbarkeit, verbale Aggression, Wutausbrüche oder den Drang, gegen Gegenstände zu schlagen. Die Energie will explosiv nach außen abgeführt werden.
- **Das blockierte Hyperarousal — "Aktiviertes" Freeze (Einfrieren unter Hochspannung), ca. 85–95 %:** Wichtig zur Unterscheidung vom Hypoarousal-Freeze: Hier sackst du nicht schlaff zusammen. Stattdessen ist dein Körper vollgepumpt mit Adrenalin, aber die Energie blockiert sich komplett selbst. Es ist, als ob du gleichzeitig mit aller Kraft auf Gas und Bremse trittst. Symptome: Du zitterst innerlich oder äußerlich vor Hochspannung, bist unfähig, ein klares Wort herauszubringen, und stehst unter maximalem Druck, bist aber wie gelähmt. Der Kopf "schreit", aber der Körper bewegt sich nicht.
- **Sicherungsausfall, 95–100 %:** Die absolute Spitze der Skala. Das Gehirn erträgt die chemische Überflutung nicht mehr. Hier bricht die Realitätswahrnehmung weg. Wenn der Stress die absolute Höchstgrenze erreicht, erleidet das Gehirn eine Art "Sicherungsausfall" durch Reizüberflutung. Das System ist so extrem mit Stresshormonen überschwemmt, dass es die Realität nicht mehr normal verarbeiten kann. Menschen erleben in diesem Moment ein Gefühl von völligem Kontrollverlust, Realitätsverlust oder eine massive innere Blockade, bei der der Körper vor lauter Druck nur noch den Impuls hat, diesen unerträglichen Zustand durch irgendeine radikale Handlung sofort zu stoppen.

### Hypoarousal (Untererregung / Shutdown)

Das Hypoarousal befindet sich am ganz unteren Ende der Skala, meist im Bereich unterhalb von **10 bis 15 %**.

- **Was im Körper passiert:** Der Körper wählt den letzten biologischen Ausweg bei extremem, unerträglichem Stress: das Erstarren / Kollabieren (*Freeze, Fawn* or *Flop*). Das parasympathische Nervensystem fährt alle Systeme radikal herunter, um Energie zu sparen und Schmerz zu dämpfen.
- **Typische Symptome:** Körperliche Taubheit, emotionale Leere, Dissoziation (das Gefühl, nicht richtig da zu sein), "Zoned-out"-Zustand, extrem niedriger Blutdruck/Puls, Erschöpfung bis hin zur Unfähigkeit, sich zu bewegen oder zu sprechen.
- **Wichtiger Unterschied zur Erholung:** Während du bei 25 % entspannt und regeneriert bist, fühlst du dich im Hypoarousal abgeschnitten, leer und handlungsunfähig.

Wenn die Anspannung unter 15 % fällt, gleitet der Körper stufenweise in den dorsovagalen Überlebensmodus ab. Auf der DBT-Skala lässt sich das klinisch so aufteilen, wie die Schutzmechanismen nacheinander anspringen:

- **Der Übergang — Fawn (Unterwerfung / Anpassung), ca. 12–15 %:** Dies ist das "soziale Einknicken" direkt an der Grenze zum echten Shutdown. Der Körper merkt, dass Kampf oder Flucht aussichtslos sind. Verhalten: Extremes People-Pleasing, Erraten von Wünschen des Gegenübers und das völlige Verleugnen eigener Bedürfnisse, um einen drohenden Konflikt im Keim zu ersticken. Du bist innerlich schon leicht taub, funktionierst aber sozial noch wie ein Roboter.
- **Die Erstarrung — Freeze (Funktionelles Einfrieren), ca. 8–12 %:** Der klassische Übergang in das Hypoarousal. Das Nervensystem zieht gleichzeitig Gas (Sympathikus) und Bremse (Parasympathikus) mit voller Kraft. Verhalten: Du bist wie versteinert. Es fühlt sich an wie eine innere Lähmung oder "Körper-Gefängnis". Du nimmst die Umwelt noch wahr (oft mit starker innerer Angst oder *Dread*), kannst dich aber kaum bewegen, deine Muskeln fühlen sich steif an und das Denken wird extrem nebelig (*Brain Fog*).
- **Das Schlaffwerden — Flop (Muskuläres Nachgeben), ca. 4–8 %:** Während du beim Freeze noch unter extremer Muskelspannung stehst, bricht hier die körperliche Kraft zusammen. Der Tonus geht verloren. Verhalten: Der Körper wird komplett weich und schlaff ("wie ein nasser Sack"). Es setzt eine starke emotionale und körperliche Taubheit (Analgesie) ein, um Schmerzen nicht mehr spüren zu müssen. Es fühlt sich an, als würde der Stecker gezogen.
- **Der Kollaps — Faint & Kompletter Shutdown, 0–4 %:** Das absolute biologische Notbremssystem im tiefsten Keller der Skala. Bei *Faint* sacken Blutdruck und Puls so radikal ab, dass Schwindel entsteht oder man tatsächlich ohnmächtig wird. Im kompletten Shutdown bei 0 % bist du vollkommen dissoziiert. Du bist mental komplett weggetreten, starrst ins Leere, nimmst deinen Körper nicht mehr wahr (Depersonalisation) und bist von der Außenwelt vollkommen abgeschnitten.

---

Das **Window of Tolerance** beschreibt den optimalen Aktivierungsbereich des Nervensystems (ca. 15–70 %), in dem ein Mensch trotz Stress emotional stabil, rational denkfähig und sozial handlungsfähig bleibt.

### Hyperarousal vs. Hypoarousal: Der entscheidende Unterschied

- Im Hyperarousal (über 70 %): Bist du eine tickende Zeitbombe. Der Tonus ist hoch, du stehst unter Strom. Das Nervensystem schreit: *"Tu irgendwas, um zu überleben!"*
- Im Hypoarousal (unter 15 %): Bist du ein abgestecktes Gerät. Der Tonus ist im Keller, du bist leer. Das Nervensystem sagt: *"Stirb leise, damit es nicht so wehtut."*

Wenn wir lernen, unsere feinen Körpersignale richtig zu deuten, werden die Prozentzahlen lebendig. Wir begreifen Stress nicht mehr als plötzlichen Überfall, sondern als eine Leiter, auf der wir uns bewegen. Das Ziel dieses kombinierten Wissens ist es, aktiv zu üben, die Leiter des Nervensystems bewusst hoch und runter zu navigieren:

- **Die Leiter hochwandern (Aktivierung):** Wenn wir schon im trägen Shutdown (Hypoarousal unter 15 %) feststecken, nutzen wir aktivierende Reize (z. B. Kälte, Bewegung), um uns die Leiter hoch in den handlungsfähigen Flow-Bereich zu holen.
- **Die Leiter runterwandern (Beruhigung):** Wenn wir durch Stress ins Hyperarousal (über 70 %) katapultiert werden, nutzen wir biologische Notbremsen (Eiswasser, langes Ausatmen), um die Energie sicher abzuleiten und die Leiter wieder kontrolliert nach unten zu steigen.

Um von der Erstarrung (Hypoarousal) wieder in die gesunde Entspannung zu kommen, müssen wir auf dieser Leiter biologisch zwingend den Weg nach oben antreten. Da der Körper aus dem Energiesparmodus (Shutdown) nicht direkt in die Ruhe schalten kann, muss er zuerst den Kreislauf und den Sympathikus aktivieren. Das bedeutet: Wir müssen durch das Hyperarousal (Mobilisierung/Aktivierung) hindurchgehen, um die eingefrorene Stressenergie abzuarbeiten, bevor das System wieder sicher nach unten in die Entspannung regulieren kann — was in der Praxis so aussieht, dass eine Person im Shutdown erst zittern, weinen oder einen Bewegungsdrang spüren wird, bevor sie echte Ruhe findet.

**Genau deshalb endet unsere Kurve dort.**

Und weil wir jetzt alle verwirrt sind: Ich habe hier quasi die klassische DBT-Anspannungskurve, die normalerweise von 0 bis 100 % nach oben ansteigt, einmal komplett auf den Kopf gestellt und direkt auf die biologische, polyvagale Leiter der Polyvagal-Theorie draufgepackt. Durch dieses Umdrehen der Skala sieht man auf einen Blick, dass der tiefste Keller (das Hypoarousal) eigentlich das Ergebnis einer vorherigen, extremen Stress-Explosion ist.

---

### Ein Alltagsbeispiel für den Wechsel der Zonen

**Die Erholungsphase (25 %):** Du sitzt morgens entspannt mit einer Tasse Kaffee in der Küche. Du bist wach, aber absolut ruhig, die Gedanken schweifen friedlich ab. Du tankst Kraft.

**Das Window of Tolerance / Flow (50 %):** Du beginnst mit der Arbeit oder einem Projekt. Du bist voll fokussiert, die Zeit vergeht wie im Flug. Du bist produktiv, aufmerksam und meisterst Aufgaben mühelos.

**Der Wechsel ins Hyperarousal (75 %):** Plötzlich stürzt der Computer ab und die wichtige Datei ist weg — gleichzeitig kippt die Kaffeetasse über den Schreibtisch. Dein Herz rast, du fluchst laut (*Fight*) oder willst am liebsten sofort alles hinwerfen und den Raum verlassen (*Flight*). Dein Tunnelblick blendet alles andere aus.

**Der Wechsel ins Hypoarousal (12 %):** Nach diesem Schock und stundenlanger Anspannung sitzt du um 16 Uhr im Meeting. Du bist energetisch völlig ausgelaugt. Dein Blick starrt stur auf die Tischplatte, du hörst den Stimmen nur noch wie durch Watte zu und nimmst gar nichts mehr richtig auf. Du hast den klassischen "Nachmittags-Kollaps" — dein System hat kurzzeitig den Stecker gezogen.

Das Ziel der DBT ist es, dich durch Skills so zu steuern, dass du weder nach oben (über 70 %) noch nach unten (unter 15 %) aus deinem Toleranzfenster herausfällst, sondern dich sicher im Bereich dazwischen bewegen kannst.

Statt den PC anzuschreien, wendet sie sofort einen Stresstoleranz-Skill an. Sie rennt kurz ins Bad, hält die Hände für 30 Sekunden unter eiskaltes Wasser und atmet dreimal ganz lang und tief aus (das aktiviert den Beruhigungsnerv).

**Der Effekt:** Die biologische Stresswelle wird gekappt. Die Anspannung sinkt rasch von 75 % zurück auf ca. 50 %. Der Tunnelblick verschwindet, und sie kann die Datei in Ruhe neu suchen.

**Im Meeting:** Körperlicher Reiz — Sie wechselt die Sitzposition, setzt sich ganz aufrecht hin und dehnt und streckt unauffällig ihre Arme und Beine, um die Muskeln wieder zu spüren. Sensorischer Reiz — Sie nimmt einen kräftigen Schluck eiskaltes Wasser oder nutzt ein scharfes Chili-Bonbon / sauren Drop, den sie für solche Fälle in der Tasche hat. Auch ein starker Duft (z. B. ätherisches Minzöl) hilft dem Gehirn, im Hier und Jetzt anzukommen. Mentaler Reiz — Sie wendet die 5-4-3-2-1-Methode an: Sie sucht im Raum bewusst nach 3 blauen Gegenständen und horcht auf 2 Geräusche, um den "Watte-Kopf" zu lüften.

**Der Effekt:** Durch die Reize signalisiert der Körper dem Gehirn: "Aufwachen, wir sind in Sicherheit, aber wir müssen wieder präsent sein." Der Blutdruck steigt leicht, der Nebel im Kopf verzieht sich, und sie pendelt sich wieder bei stabilen 40–45 % im Window of Tolerance ein.

---

### Warum Menschen unterschiedlich reagieren

Ob ein Mensch bei Stress eher in den Aktivitätsmodus (Fight/Flight) geht oder erstarrt (Freeze), hängt von seinen Genen und vor allem von früheren Lebenserfahrungen ab. Das Nervensystem wählt automatisch immer die Strategie, die in der eigenen Vergangenheit am erfolgreichsten das Überleben oder die Sicherheit gesichert hat.

### Wie sich diese Zustände chronifizieren

Chronifizierung bedeutet, dass das Nervensystem seine Flexibilität verliert und in einem Zustand feststeckt.

- Wenn ein Mensch über sehr lange Zeit — zum Beispiel durch Dauerstress im Job, chronische Sorgen oder unaufgearbeitete Belastungen — permanent hohem Druck ausgesetzt ist, verlernt der Körper, wie echte Entspannung funktioniert.
- Das Gehirn kalibriert sich quasi neu und verschiebt die Normalität: Es scannt die Umgebung dauerhaft nach Gefahren ab.
- Die Folge ist, dass das "Window of Tolerance" (das Wohlfühlfenster) immer schmaler wird. Man reagiert schon bei winzigen Kleinigkeiten sofort mit extremem Hochstress (Hyperarousal) oder rutscht bei Erschöpfung direkt in die völlige Taubheit und Antriebslosigkeit (Hypoarousal), anstatt sich im gesunden Mittelfeld zu bewegen.
`.trim();
