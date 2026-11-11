/** Alt → neu für Beispieltexte, die überarbeitet wurden. Wird nur angewendet, wenn der gespeicherte Text noch genau dem alten Beispiel entspricht (eigene Änderungen bleiben). */
export interface ExampleRevision { id: string; field: 'title' | 'description'; old: string; new: string }

export const EXAMPLE_REVISIONS: ExampleRevision[] = [
  {
    "id": "res_skill_carotis_druck",
    "field": "description",
    "old": "Ein reflexartiger Bremsknopf für einen rasenden Puls — über die Drucksensoren am Hals.\n\nZwei Finger sanft an eine Seite des Halses legen, unterhalb des Kieferwinkels. Mit ganz leichtem, kreisendem Druck 10–15 Sekunden massieren. Niemals beide Seiten gleichzeitig.\n\nAus Kardiologie und Neurologie: die Barorezeptoren an der Halsschlagader lösen reflexartig die parasympathische Bremse aus.",
    "new": "⚠️ Vorsicht: Nicht bei Herz- oder Kreislaufproblemen, Schwindel oder wenn Druck am Hals Angst oder Erinnerungen an Würgen/Festhalten weckt. Bei Unsicherheit lieber einen anderen Skill oder vorher ärztlich klären.\n\nEin reflexartiger Bremsknopf für einen rasenden Puls — über die Drucksensoren am Hals.\n\nZwei Finger sanft an eine Seite des Halses legen, unterhalb des Kieferwinkels. Mit ganz leichtem, kreisendem Druck 10–15 Sekunden massieren. Niemals beide Seiten gleichzeitig.\n\nAus Kardiologie und Neurologie: die Barorezeptoren an der Halsschlagader lösen reflexartig die parasympathische Bremse aus."
  },
  {
    "id": "res_skill_oculocardiac",
    "field": "description",
    "old": "Minimaler Druck auf die geschlossenen Augenlider kann aus dissoziativer Schock-Starre zurück in die Realität holen.\n\nAugen schließen. Fingerkuppen ganz sanft auf die geschlossenen Lider legen, 10 Sekunden minimalen Druck ausüben, dabei ruhig ausatmen.\n\nAus der klinischen Neurologie (Oculocardiac-Reflex): wirkt über den Vagusnerv tiefenwirksam beruhigend.",
    "new": "⚠️ Vorsicht: Nicht bei Augenerkrankungen (z. B. Glaukom, Netzhautprobleme), nach Augen-OPs oder wenn Druck am Gesicht Angst macht. Nur ganz sanft, nie auf den Augapfel drücken. Bei Unsicherheit lieber einen anderen Skill.\n\nMinimaler Druck auf die geschlossenen Augenlider kann aus dissoziativer Schock-Starre zurück in die Realität holen.\n\nAugen schließen. Fingerkuppen ganz sanft auf die geschlossenen Lider legen, 10 Sekunden minimalen Druck ausüben, dabei ruhig ausatmen.\n\nAus der klinischen Neurologie (Oculocardiac-Reflex): wirkt über den Vagusnerv tiefenwirksam beruhigend."
  },
  {
    "id": "res_skill_tipp",
    "field": "description",
    "old": "Veränderung der Körperchemie, um bei sehr hoher Anspannung schnell herunterzukommen:\n\nTemperature: Das Gesicht kurz in kaltes Wasser tauchen oder ein Kühlpack in den Nacken legen — löst den Tauchreflex aus, der den Puls spürbar senkt.\n\nIntense Exercise: 50 Kniebeugen, sprinten oder Liegestütze bis zur Erschöpfung, um überschüssiges Adrenalin abzubauen.\n\nPaced Breathing: Tief in den Bauch einatmen (z. B. 4 Sekunden) und deutlich länger ausatmen (z. B. 7 Sekunden).\n\nPaired Muscle Relaxation: Muskelgruppen extrem fest anspannen und beim Ausatmen bewusst komplett lockerlassen.",
    "new": "⚠️ Vorsicht: Nicht bei Herzproblemen, sehr niedrigem Puls/Blutdruck, Essstörung mit Untergewicht oder wenn dir ärztlich davon abgeraten wurde. Bei Schwindel aufhören. Jeder Teil ist einzeln wählbar.\n\nVeränderung der Körperchemie, um bei sehr hoher Anspannung schnell herunterzukommen:\n\nTemperature: Das Gesicht kurz in kaltes Wasser tauchen oder ein Kühlpack in den Nacken legen — löst den Tauchreflex aus, der den Puls spürbar senkt.\n\nIntense Exercise: Bewegung, die Energie abbaut – so viel, wie dir guttut: ein paar Kniebeugen, zügig gehen oder auf der Stelle laufen. Nie bis zur Erschöpfung.\n\nPaced Breathing: Tief in den Bauch einatmen (z. B. 4 Sekunden) und deutlich länger ausatmen (z. B. 7 Sekunden).\n\nPaired Muscle Relaxation: Muskelgruppen extrem fest anspannen und beim Ausatmen bewusst komplett lockerlassen."
  },
  {
    "id": "res_skill_willingness",
    "field": "description",
    "old": "Sich der Situation öffnen und das tun, was gerade nötig ist, anstatt sich stur oder trotzig zu sperren.\n\nBereitwilligkeit (Willingness) heißt: die Realität so annehmen, wie sie ist, und von dort aus handeln. Einseitigkeit (Willfulness) heißt: sich gegen das, was ist, zu stemmen, selbst wenn es nichts bringt. Die Frage lautet: „Was braucht dieser Moment von mir — nicht, was will ich eigentlich?\"",
    "new": "Sich der Situation öffnen und das tun, was gerade nötig ist – soweit es für dich stimmig ist und deine Grenzen dabei bleiben dürfen.\n\nBereitwilligkeit (Willingness) heißt: die Realität so annehmen, wie sie gerade ist, und von dort aus einen kleinen Schritt gehen. Einseitigkeit (Willfulness) heißt: sich gegen das zu stemmen, was ist – das hat oft einen guten Grund, zum Beispiel Schutz, und ist kein Fehler. Die Frage lautet: „Was braucht dieser Moment – und was brauche ich?“"
  },
  {
    "id": "res_skill_verhaltensaenderung",
    "field": "title",
    "old": "Verhaltensänderung",
    "new": "Kleine Fortschritte würdigen"
  },
  {
    "id": "res_skill_verhaltensaenderung",
    "field": "description",
    "old": "Die Prinzipien von Lob (positiver Verstärkung) und dem Setzen von Konsequenzen bewusst im Alltag anwenden — bei sich selbst und im Umgang mit anderen.\n\nVerhalten, das belohnt wird, wiederholt sich eher. Sich selbst (oder andere) für kleine Fortschritte bewusst anerkennen, wirkt oft nachhaltiger als Kritik an dem, was noch nicht klappt.",
    "new": "Sich selbst für kleine Schritte anerkennen, statt nur auf das zu schauen, was noch nicht klappt.\n\nWas freundlich bemerkt wird, wiederholt sich eher. Du kannst dir etwas Gutes sagen oder dir eine kleine Belohnung gönnen – in deinem Tempo. Es geht nicht um Kontrolle oder Strafe, auch nicht bei dir selbst."
  },
  {
    "id": "res_skill_check_the_facts",
    "field": "description",
    "old": "Überprüfen, ob die Intensität der Emotion zur echten Situation passt.\n\nMan fragt sich: „Reagiere ich gerade auf die Realität oder auf meine Katastrophengedanken im Kopf?“",
    "new": "Prüfen, ob die Stärke des Gefühls zu dem passt, was jetzt gerade ist – oder ob es an früher erinnert.\n\nFrag dich: „Passt die Stärke dieses Gefühls zu dem, was jetzt gerade ist – oder erinnert es mich an früher?“ Beides darf sein: Auch wenn es an früher erinnert, hatte die Reaktion einen Grund."
  },
  {
    "id": "res_skill_please",
    "field": "description",
    "old": "Die körperliche Basis stabil halten, um weniger anfällig für Gefühlschaos zu sein:\n\nPhysicaL illness — körperliche Beschwerden behandeln (Arztbesuche).\nEat — ausgewogen essen.\nAvoid mood-altering substances — Drogen/Alkohol meiden.\nSleep — ausreichend schlafen.\nExercise — sich täglich bewegen.",
    "new": "Dem Körper Grundlagen geben, soweit es dir möglich ist – nichts davon ist Pflicht:\n\nPhysicaL illness — körperliche Beschwerden ernst nehmen (bei Bedarf ärztlich abklären).\nEat — dem Körper regelmäßig etwas geben, was er gut verträgt.\nAvoid mood-altering substances — Stoffe, die die Stimmung stark verändern, bewusst im Blick behalten; bei Schwierigkeiten mit Unterstützung.\nSleep — Schlaf so gut schützen, wie es geht.\nExercise — sich bewegen, wie und wie viel es sich gut anfühlt.\n\nWenn Essen, Substanzen oder Bewegung für dich ein schwieriges Thema sind, überspring diesen Teil – oder besprich ihn mit einer Fachperson."
  },
  {"id": "res_skill_eiskaltes_wasser", "field": "description", "old": "Kaltes Wasser im Gesicht löst den „Tauchreflex“ aus: Der Puls sinkt, der Körper schaltet in kurzer Zeit herunter. Hilft bei sehr hoher Anspannung, Überflutung und Panik – eine Minute reicht oft.\n\nAus der DBT (T von TIPP – Temperatur): Der Kältereiz über Gesicht und Augenpartie aktiviert den Vagusnerv. Die ausführliche Variante mit allen Bausteinen steht im Skill TIPP.", "new": "⚠️ Vorsicht: Nicht bei Herzproblemen, sehr niedrigem Puls/Blutdruck oder Essstörung mit Untergewicht; bei Schwindel aufhören. Genaueres steht unten bei den Gegenanzeigen.\n\nKaltes Wasser im Gesicht löst den „Tauchreflex“ aus: Der Puls sinkt, der Körper schaltet in kurzer Zeit herunter. Hilft bei sehr hoher Anspannung, Überflutung und Panik – eine Minute reicht oft.\n\nAus der DBT (T von TIPP – Temperatur): Der Kältereiz über Gesicht und Augenpartie aktiviert den Vagusnerv. Die ausführliche Variante mit allen Bausteinen steht im Skill TIPP."}
];
