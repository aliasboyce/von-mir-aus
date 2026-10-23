export interface HelperSituation {
  id: string;
  label: string;
  labelEn: string;
  guidance: string[];
  guidanceEn: string[];
}

/**
 * "Großer Qualitäts- und Erweiterungsprompt" brief, Section 3 — the
 * explicit list of observable situations, each with its own tailored
 * first guidance instead of one generic set of tips for everything.
 * Deliberately observational language ("wirkt überfordert") rather than
 * diagnostic labels, and phrased as "könnte helfen" rather than
 * instructions — matching the app's own established tone elsewhere.
 * Not medical or clinical guidance — a starting orientation only.
 */
export const HELPER_SITUATIONS: HelperSituation[] = [
  {
    id: 'ueberfordert',
    label: 'wirkt überfordert',
    labelEn: 'seems overwhelmed',
    guidance: ['Reize reduzieren, wenn möglich (Lautstärke, Licht, Menschenmenge)', 'ruhig und in kurzen Sätzen sprechen', 'nicht zu viele Fragen auf einmal stellen', 'eine einfache Wahl anbieten statt vieler Optionen'],
    guidanceEn: ['Reduce stimulation where possible (noise, light, crowd)', 'speak calmly, in short sentences', "don't ask too many questions at once", 'offer one simple choice instead of many options'],
  },
  {
    id: 'aengstlich',
    label: 'wirkt sehr ängstlich',
    labelEn: 'seems very anxious',
    guidance: ['ruhige, gleichbleibende Stimme', 'fragen, ob Nähe oder Abstand gerade guttut', 'nicht drängen oder Druck aufbauen', 'konkrete, kleine Orientierung geben ("Wir sind hier, es ist gerade sicher")'],
    guidanceEn: ['Calm, steady voice', 'ask whether closeness or distance feels better right now', "don't push or add pressure", 'offer small, concrete orientation ("we\'re here, this is safe right now")'],
  },
  {
    id: 'panisch',
    label: 'wirkt panisch',
    labelEn: 'seems panicked',
    guidance: ['langsam und ruhig atmen — die eigene Ruhe kann sich übertragen', 'kurze, einfache Sätze statt langer Erklärungen', 'gemeinsam etwas Konkretes wahrnehmen (z. B. "Spürst du den Boden unter dir?")', 'nicht anfassen, ohne vorher zu fragen'],
    guidanceEn: ['Breathe slowly and calmly yourself — calm can be contagious', 'short, simple sentences rather than long explanations', 'notice something concrete together (e.g. "can you feel the floor?")', "don't touch without asking first"],
  },
  {
    id: 'rueckzug',
    label: 'zieht sich zurück',
    labelEn: 'withdraws',
    guidance: ['Raum lassen, nicht verfolgen oder drängen', 'kurz signalisieren, dass du da bist, ohne eine Reaktion zu verlangen', 'kein "Du musst jetzt reden"', 'Angebot machen, aber Ablehnung akzeptieren'],
    guidanceEn: ['Give space, don\'t follow or push', "briefly let them know you're there, without demanding a response", 'avoid "you need to talk now"', "make an offer, but accept if it's declined"],
  },
  {
    id: 'verwirrt',
    label: 'wirkt verwirrt',
    labelEn: 'seems confused',
    guidance: ['einfache, klare Orientierung geben (Ort, Zeit, was gerade passiert)', 'eine Sache nach der anderen ansprechen', 'ruhig wiederholen, wenn nötig', 'nicht korrigieren oder testen'],
    guidanceEn: ['Offer simple, clear orientation (place, time, what is happening)', 'address one thing at a time', 'repeat calmly if needed', "don't correct or quiz them"],
  },
  {
    id: 'abwesend',
    label: 'wirkt nicht richtig anwesend',
    labelEn: 'seems not fully present',
    guidance: ['ruhig ansprechen, mit Namen falls bekannt', 'auf konkrete Sinneswahrnehmungen lenken ("Kannst du etwas in der Hand halten?")', 'nicht anschreien oder wachrütteln', 'Zeit lassen, wieder anzukommen'],
    guidanceEn: ['Speak calmly, using their name if known', 'guide toward a concrete sense (e.g. "can you hold something in your hand?")', "don't shout or shake them", 'give time to come back'],
  },
  {
    id: 'aufgewuehlt',
    label: 'ist sehr aufgewühlt',
    labelEn: 'very agitated',
    guidance: ['selbst ruhig bleiben, nicht mit-eskalieren', 'genug körperlichen Abstand lassen', 'wenig, klare Worte', 'fragen statt anzunehmen, was gebraucht wird'],
    guidanceEn: ["Stay calm yourself, don't escalate along", 'allow enough physical space', 'few, clear words', 'ask rather than assume what is needed'],
  },
  {
    id: 'sprachlos',
    label: 'kann kaum sprechen',
    labelEn: 'can barely speak',
    guidance: ['kein Sprechen einfordern', 'Ja/Nein-Fragen oder Zeigen anbieten', 'einfach da sein können reicht oft schon', 'Stille aushalten dürfen'],
    guidanceEn: ["Don't demand speech", 'offer yes/no questions or pointing instead', 'simply being there is often already enough', "it's okay to sit with silence"],
  },
  {
    id: 'weint',
    label: 'weint',
    labelEn: 'crying',
    guidance: ['Weinen muss nicht gestoppt werden', 'da sein, ohne sofort trösten zu müssen', 'fragen, ob Nähe gewünscht ist', 'kein "Nicht weinen" oder "Ist doch nicht so schlimm"'],
    guidanceEn: ["Crying doesn't need to be stopped", 'be present without needing to fix it immediately', 'ask if closeness is wanted', 'avoid "don\'t cry" or "it\'s not that bad"'],
  },
  {
    id: 'erstarrt',
    label: 'wirkt erstarrt',
    labelEn: 'seems frozen',
    guidance: ['ruhig und langsam sprechen', 'kleine, machbare Bewegungsimpulse anbieten (z. B. Finger bewegen)', 'nicht anfassen, ohne zu fragen', 'Zeit lassen, ohne Druck'],
    guidanceEn: ['Speak calmly and slowly', 'offer small, doable movement prompts (e.g. wiggling fingers)', "don't touch without asking", 'allow time, without pressure'],
  },
  {
    id: 'wuetend',
    label: 'wirkt wütend',
    labelEn: 'seems angry',
    guidance: ['selbst ruhig bleiben, nicht persönlich nehmen', 'genug Abstand lassen', 'nicht rechtfertigen oder diskutieren, solange die Wut hoch ist', 'wenn nötig: Raum verlassen und später wiederkommen'],
    guidanceEn: ["Stay calm yourself, don't take it personally", 'allow enough space', "don't justify or argue while anger is high", 'if needed: step away and return later'],
  },
  {
    id: 'orientierung',
    label: 'braucht Orientierung',
    labelEn: 'needs orientation',
    guidance: ['knapp und konkret sagen, was gerade passiert', 'Ort, Zeit, nächste Schritte benennen', 'eine Sache nach der anderen', 'Rückfragen erlauben'],
    guidanceEn: ['State briefly and concretely what is happening', 'name place, time, next steps', 'one thing at a time', 'allow questions'],
  },
  {
    id: 'unklar',
    label: 'weiß selbst nicht, was gerade hilft',
    labelEn: "doesn't know what helps",
    guidance: ['das ist ein völlig gültiger Zustand, kein Versagen', 'einfache Optionen anbieten statt offener Fragen', 'gemeinsam ausprobieren dürfen', 'kein Druck, sofort eine Antwort zu haben'],
    guidanceEn: ['This is a completely valid state, not a failure', 'offer simple options instead of open questions', "it's okay to try things together", 'no pressure to have an answer right away'],
  },
  {
    id: 'allein',
    label: 'möchte allein sein',
    labelEn: 'wants to be alone',
    guidance: ['das respektieren, wenn keine akute Gefahr besteht', 'kurz sagen, dass du erreichbar bleibst', 'nicht kränken lassen — es ist meist nicht persönlich gemeint', 'nach einer Weile ruhig nachfragen, ob sich das geändert hat'],
    guidanceEn: ['Respect this if there is no acute danger', "briefly let them know you're reachable", "don't take it personally — it usually isn't", 'after a while, gently check if that has changed'],
  },
  {
    id: 'naehe',
    label: 'möchte Nähe',
    labelEn: 'wants closeness',
    guidance: ['da sein und bleiben', 'fragen, was genau guttut (neben sitzen, in den Arm nehmen, sprechen)', 'eigene Grenzen dabei ebenfalls beachten', 'ruhige, verlässliche Präsenz'],
    guidanceEn: ['Be present and stay', 'ask what specifically helps (sitting nearby, a hug, talking)', 'mind your own limits too', 'calm, reliable presence'],
  },
  {
    id: 'koerperlich',
    label: 'körperliche Beschwerden',
    labelEn: 'physical complaints',
    guidance: ['ernst nehmen, nicht abtun', 'bei Unsicherheit lieber medizinische Einschätzung einholen', 'nicht selbst diagnostizieren', 'im Zweifel: 112 bzw. ärztliche Hilfe'],
    guidanceEn: ["Take it seriously, don't dismiss it", 'when unsure, seek medical assessment rather than guessing', "don't diagnose yourself", 'when in doubt: emergency services or medical help'],
  },
];
