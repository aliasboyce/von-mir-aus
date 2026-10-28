/**
 * Häufige Fragen („FAQ“) in der Lupe – die zehn Dinge, die am ehesten missverstanden werden.
 * Diese Liste lässt sich jederzeit ergänzen: einfach einen weiteren Eintrag unten anhängen.
 * `to` ist optional (öffnet die passende Seite), `toLabel` der Text des Knopfes.
 */
export interface FaqItem {
  id: string;
  de: { q: string; a: string; toLabel?: string };
  en: { q: string; a: string; toLabel?: string };
  to?: string;
}

export const FAQ: FaqItem[] = [
  {
    id: 'daten',
    de: { q: 'Wo sind meine Daten – und was passiert, wenn ich das Handy wechsle?', a: 'Alles bleibt auf diesem Gerät (nichts liegt auf einem Server). Wenn du das Handy wechselst oder den Browser-Speicher löschst, ist es weg – außer du hast vorher eine Sicherung gemacht. Unter Einstellungen → Sicherung kannst du alles als Datei speichern und auf dem neuen Gerät wieder einlesen.', toLabel: 'Zu den Einstellungen' },
    en: { q: 'Where is my data – and what happens if I change phones?', a: 'Everything stays on this device (nothing lives on a server). If you change phones or clear the browser storage it is gone – unless you made a backup first. Under Settings → Backup you can save everything as a file and load it on the new device.', toLabel: 'To settings' },
    to: '/einstellungen',
  },
  {
    id: 'zuviel',
    de: { q: 'Die App ist mir zu voll. Wie sehe ich weniger?', a: 'Du bestimmst, wie viel du siehst: Auf der Startseite ganz unten „Mehr von der App zeigen“ (oder in den Einstellungen) wählst du eine kleinere Ansicht. Im Krisenmodus und bei „Nur jetzt“ bleibt nur das Nötigste. Alles andere ist nicht weg, nur ausgeblendet – du kannst jederzeit zurück.', toLabel: 'Zum Krisenmodus' },
    en: { q: 'The app is too full for me. How do I see less?', a: 'You decide how much you see: at the very bottom of the start page, “Show more of the app” (or in Settings) lets you choose a smaller view. Crisis mode and “Just now” leave only the essentials. Nothing else is gone, only hidden – you can go back any time.', toLabel: 'To crisis mode' },
    to: '/krisenmodus',
  },
  {
    id: 'zettel',
    de: { q: 'Parkbox, Wartezimmer, Zettel – was ist was?', a: 'Die Parkbox ist für kurze Zettel („nicht vergessen!“). Das Wartezimmer ist für größere Vorhaben, die auf ihre Zeit warten. Die Farbe eines Zettels zeigt, wie eilig er ist: orange = dringend, dunkelgrün = wichtig, grau = später, weiß = „weiß ich noch nicht“. Ein Zettel kann später an einen Termin, ein Projekt, eine Person oder eine Mindmap gehängt werden.', toLabel: 'Zur Parkbox' },
    en: { q: 'Park box, waiting room, slips – what is what?', a: 'The park box is for short slips (“don’t forget!”). The waiting room is for bigger plans that wait for their time. A slip’s colour shows how urgent it is: orange = urgent, dark green = important, grey = later, white = “not sure yet”. A slip can later be pinned to an appointment, a project, a person or a mind map.', toLabel: 'To the park box' },
    to: '/parkbox',
  },
  {
    id: 'wiederfinden',
    de: { q: 'Wie finde ich etwas wieder, das ich gerade offen hatte?', a: 'Ganz unten auf der Startseite steht „Weiterbearbeiten“ mit den letzten drei Seiten – ein Tipp bringt dich zurück, mit dem X nimmst du eine weg. Außerdem findet die Lupe Funktionen und alles, was du selbst geschrieben hast – ein Wortteil reicht. Und „Entdecken“ zeigt alle Seiten der App auf einer Karte.', toLabel: 'Zu Entdecken' },
    en: { q: 'How do I find something I just had open?', a: 'At the very bottom of the start page there is “Continue” with the last three pages – a tap takes you back, the X removes one. The magnifier also finds functions and everything you wrote yourself – a word part is enough. And “Discover” shows all pages of the app on a map.', toLabel: 'To Discover' },
    to: '/entdecken',
  },
  {
    id: 'budget-uebrig',
    de: { q: 'Budget-Planer: Wie wird „wahrscheinlich übrig“ gerechnet?', a: 'In drei Stufen: 1) „Nur fest“ = feste Einnahmen minus feste Kosten und Rechnungen dieses Monats. 2) „Aktuell“ = dazu weitere Einnahmen, minus einzelne Ausgaben und das, was ins Sparschwein ging. 3) „Mit Töpfen“ = minus das Geld, das in deinen Töpfen noch eingeplant, aber noch nicht ausgegeben ist. Verträge und feste Einnahmen sind schon enthalten und werden nur einmal gezählt. „So wird gerechnet“ zeigt jede Zeile.', toLabel: 'Zum Budget-Planer' },
    en: { q: 'Budget planner: how is “probably left” calculated?', a: 'In three steps: 1) “Fixed only” = fixed income minus fixed costs and bills this month. 2) “So far” = plus other income, minus single spending and what went into the piggy bank. 3) “With pots” = minus the money still planned in your pots but not spent yet. Contracts and fixed income are already included and counted once. “How it is calculated” shows every line.', toLabel: 'To the budget planner' },
    to: '/budget',
  },
  {
    id: 'budget-projekt',
    de: { q: 'Budget-Planer oder Finanzplan im Projekt – was nehme ich?', a: 'Der Budget-Planer ist für dein ganzes Geld im Alltag (Monat, Verträge, Rechnungen, Sparschwein). Der Finanzplan im Projekt ist nur für das Geld eines einzelnen Vorhabens (z. B. ein Fest) – er fließt nicht in den Budget-Planer ein. Du kannst beides benutzen, ohne dass etwas doppelt gezählt wird.', toLabel: 'Zu den Projekten' },
    en: { q: 'Budget planner or finance plan in a project – which one?', a: 'The budget planner is for your whole everyday money (month, contracts, bills, piggy bank). The finance plan in a project is only for the money of one undertaking (e.g. a party) – it does not flow into the budget planner. You can use both without anything being counted twice.', toLabel: 'To the projects' },
    to: '/entdecken/projekte',
  },
  {
    id: 'listen',
    de: { q: 'Listen, Aufgaben im Projekt, Routinen – wo schreibe ich was hin?', a: '„Meine Listen“ sind für alles zum Abhaken oder Aufzählen (Einkauf, Packliste, Ideen). Aufgaben und Schritte gehören in ein Projekt, wenn sie zu einem Vorhaben mit Ziel gehören. Routinen sind Dinge, die sich regelmäßig wiederholen. Ein Listenpunkt lässt sich mit einem kleinen Knopf in eine andere Liste kopieren, ohne dass er von der ersten verschwindet.', toLabel: 'Zu meinen Listen' },
    en: { q: 'Lists, tasks in a project, routines – where do I write what?', a: '“My lists” are for anything to tick off or enumerate (shopping, packing list, ideas). Tasks and steps belong in a project when they are part of an undertaking with a goal. Routines are things that repeat regularly. A list item can be copied to another list with a small button without leaving the first one.', toLabel: 'To my lists' },
    to: '/listen',
  },
  {
    id: 'kalender-plus',
    de: { q: 'Wie plane ich eine Routine oder ein Projekt im Kalender ein?', a: 'Im Kalender auf das Plus tippen: Dort kannst du neben einem normalen Termin auch eine deiner Routinen oder eines deiner Projekte einplanen. Sie sehen im Kalender ein bisschen anders aus als gewöhnliche Termine, damit du sie auf einen Blick erkennst. Übersicht und Kategorien findest du hinter den drei Punkten oben.', toLabel: 'Zum Kalender' },
    en: { q: 'How do I schedule a routine or a project in the calendar?', a: 'Tap the plus in the calendar: besides a normal appointment you can also schedule one of your routines or projects. They look a bit different from ordinary appointments so you can spot them at a glance. Overview and categories are behind the three dots at the top.', toLabel: 'To the calendar' },
    to: '/kalender',
  },
  {
    id: 'auge',
    de: { q: 'Was macht der Augen-Knopf („Schnell weg“)?', a: 'Ein Tipp verdeckt die App sofort mit einem neutralen Bildschirm (Uhrzeit und Datum). Zweimal schnell tippen bringt dich zurück – genau auf die Seite, auf der du warst (mit PIN, falls du eine eingestellt hast). Der Knopf lässt sich wie das Wesen verschieben, wenn er im Weg ist. Ein- und ausschalten kannst du ihn in den Einstellungen.', toLabel: 'Zu den Einstellungen' },
    en: { q: 'What does the eye button (“Hide now”) do?', a: 'One tap covers the app at once with a neutral screen (time and date). Two quick taps bring you back – exactly to the page you were on (with a PIN if you set one). The button can be dragged like the Wesen if it is in the way. You can switch it on and off in Settings.', toLabel: 'To settings' },
    to: '/einstellungen',
  },
  {
    id: 'wesen',
    de: { q: 'Das Wesen ist im Weg oder sagt zu viel – was tun?', a: 'Du kannst das Wesen mit dem Finger verschieben, wohin du magst. Wenn es etwas sagt, hilft „nerv nich ♥“ für diese Sitzung – und in den Einstellungen und unter „Das Wesen“ lässt sich einstellen, wie viel es spricht, schmuggelt oder stört. Es ist für dich da, nicht umgekehrt.', toLabel: 'Zu den Einstellungen' },
    en: { q: 'The Wesen is in the way or says too much – what can I do?', a: 'You can drag the Wesen wherever you like. When it says something, “nerv nich ♥” helps for this session – and in Settings and under “The Wesen” you can set how much it talks, smuggles or disturbs. It is there for you, not the other way round.', toLabel: 'To settings' },
    to: '/einstellungen',
  },
];
