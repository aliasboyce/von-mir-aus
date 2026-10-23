/**
 * "Die F-Zustaende auf der Nervensystem-Seite muessen aktualisiert
 * werden und in die richtigen Anspannungsbereiche uebernommen werden,
 * wie aus dem Info-Text beim Regulations-Regenbogen — und auf
 * Vollstaendigkeit: Fight, Flight, Fawn, Freeze, Flop, Faint"-Auftrag.
 *
 * The ranges and descriptions are taken from the same DBT+Polyvagal
 * text the ladder explainer uses (content/arousalExplainerContent.ts),
 * so this page and the rainbow can never disagree. Fine / Flood /
 * Friend (added earlier, "Alle Fs") stay inside the tolerance window;
 * their ranges are approximate placements, said so on the page.
 * Kept as a content file (not in i18n/de.ts) because each entry is
 * long, two-language prose.
 */
export type FStateGroup = 'window' | 'hyper' | 'hypo';

export interface FStateEntry {
  id: string;
  group: FStateGroup;
  emoji: string;
  min: number;
  max: number;
  /** Placement is an approximation (not given as a range in the source text). */
  approx?: boolean;
  de: { name: string; meaning: string; mechanism: string };
  en: { name: string; meaning: string; mechanism: string };
}

export const F_STATES: FStateEntry[] = [
  {
    id: 'fine',
    group: 'window',
    emoji: '🙂',
    min: 30,
    max: 59,
    approx: true,
    de: {
      name: 'Fine — der neutrale Normalzustand',
      meaning: 'Einfach okay, ruhig, ohne dass etwas Besonderes ansteht.',
      mechanism: 'Puls und Atmung sind ruhig, es gibt keine akute Bedrohung und keine besondere Aktivierung — der Ausgangspunkt, von dem aus alles andere abweicht.',
    },
    en: {
      name: 'Fine — the neutral baseline',
      meaning: 'Just okay, calm, nothing in particular going on.',
      mechanism: 'Pulse and breathing are calm, there is no acute threat and no particular activation — the starting point everything else deviates from.',
    },
  },
  {
    id: 'friend',
    group: 'window',
    emoji: '🧑\u200d🤝\u200d🧑',
    min: 15,
    max: 69,
    approx: true,
    de: {
      name: 'Friend — aktiv Verbündete suchen',
      meaning: 'Bewusst Kontakt zu sicheren Menschen suchen, um dich auszutauschen.',
      mechanism: 'Dein System nutzt Beziehungen zur Co-Regulation: Du suchst aktiv Nähe oder bittest um Hilfe — gesunde soziale Verbindung statt eines Alarmzustands. Möglich im ganzen Toleranzfenster.',
    },
    en: {
      name: 'Friend — actively seeking allies',
      meaning: 'Deliberately reaching out to safe people to talk.',
      mechanism: 'Your system uses relationships for co-regulation: you actively seek closeness or ask for help — healthy social connection instead of an alarm state. Possible anywhere inside the tolerance window.',
    },
  },
  {
    id: 'flood',
    group: 'window',
    emoji: '🌊',
    min: 60,
    max: 69,
    approx: true,
    de: {
      name: 'Flood — emotionale Überflutung',
      meaning: 'Gefühle rollen wie eine Welle, aber du bist noch da.',
      mechanism: 'Der Übergang an der oberen Grenze des Toleranzfensters (Frühwarnbereich): Intensive Emotionen überrollen dich. Lässt sie sich regulieren, bleibst du im Fenster — wird sie zu stark, reißt sie dich nach oben ins Hyperarousal.',
    },
    en: {
      name: 'Flood — emotional overwhelm',
      meaning: 'Feelings roll in like a wave, but you are still here.',
      mechanism: 'The transition at the upper edge of the tolerance window (early-warning zone): intense emotions wash over you. If it can be regulated you stay inside the window — if it grows too strong it pulls you up into hyperarousal.',
    },
  },
  {
    id: 'fight',
    group: 'hyper',
    emoji: '🔥',
    min: 70,
    max: 85,
    de: {
      name: 'Fight — Kampf',
      meaning: 'Reizbarkeit, Wut, der Drang, sich zu wehren.',
      mechanism: 'Das sympathische Nervensystem läuft auf Hochtouren. Der Verstand ist stark eingeengt (Tunnelblick), aber du bist noch handlungsfähig — rein impulsgesteuert. Der Kampf-Impuls schlägt um in Reizbarkeit, verbale Aggression, Wutausbrüche oder den Drang, gegen Gegenstände zu schlagen: Die Energie will explosiv nach außen abgeführt werden.',
    },
    en: {
      name: 'Fight',
      meaning: 'Irritability, anger, the urge to defend yourself.',
      mechanism: 'The sympathetic nervous system runs at full speed. Thinking narrows (tunnel vision) but you can still act — purely on impulse. The fight impulse turns into irritability, verbal aggression, outbursts of anger or the urge to hit things: the energy wants to be discharged outward, explosively.',
    },
  },
  {
    id: 'flight',
    group: 'hyper',
    emoji: '🏃',
    min: 70,
    max: 85,
    de: {
      name: 'Flight — Flucht',
      meaning: 'Getriebenheit, Panik, der Drang, wegzukommen.',
      mechanism: 'Äußert sich als extreme, motorische Getriebenheit, Panik, das unbändige Bedürfnis, sofort den Raum zu verlassen, oder rasende, chaotische Gedanken, um einer Situation gedanklich zu entfliehen. Tunnelblick und Impulssteuerung wie beim Kampf.',
    },
    en: {
      name: 'Flight',
      meaning: 'Restlessness, panic, the urge to get away.',
      mechanism: 'Shows up as extreme physical restlessness, panic, an overwhelming need to leave the room at once, or racing, chaotic thoughts trying to escape a situation mentally. Tunnel vision and impulse-driven, like fight.',
    },
  },
  {
    id: 'freeze-active',
    group: 'hyper',
    emoji: '⚡',
    min: 85,
    max: 95,
    de: {
      name: 'Freeze (aktiv) — Einfrieren unter Hochspannung',
      meaning: 'Voller Druck, aber wie gelähmt.',
      mechanism: 'Hier sackst du nicht schlaff zusammen: Der Körper ist voller Adrenalin, aber die Energie blockiert sich selbst — als würdest du gleichzeitig mit aller Kraft auf Gas und Bremse treten. Du zitterst innerlich oder äußerlich, bekommst kein klares Wort heraus und stehst unter maximalem Druck, bist aber wie gelähmt. Der Kopf „schreit", aber der Körper bewegt sich nicht.',
    },
    en: {
      name: 'Freeze (active) — freezing under high tension',
      meaning: 'Full pressure, yet paralysed.',
      mechanism: 'You do not slump here: the body is full of adrenaline, but the energy blocks itself — as if you were pressing gas and brake with all your strength at once. You tremble inside or outside, cannot get a clear word out, and are under maximum pressure yet paralysed. Your head "screams" but your body does not move.',
    },
  },
  {
    id: 'overload',
    group: 'hyper',
    emoji: '💥',
    min: 95,
    max: 100,
    de: {
      name: 'Sicherungsausfall — Reizüberflutung',
      meaning: 'Die absolute Spitze der Skala.',
      mechanism: 'Das Gehirn erträgt die chemische Überflutung nicht mehr, die Realitätswahrnehmung bricht weg. Menschen erleben ein Gefühl von völligem Kontrollverlust, Realitätsverlust oder eine massive innere Blockade. Wenn du hier bist, ist Körper-Regulation (Kälte, Atem, Bewegung) wichtiger als jedes Nachdenken — und es ist ein guter Moment, Hilfe zu holen.',
    },
    en: {
      name: 'Fuse blown — sensory overload',
      meaning: 'The very top of the scale.',
      mechanism: 'The brain can no longer bear the chemical flooding and the sense of reality drops away. People experience complete loss of control, loss of reality or a massive inner blockade. If you are here, regulating through the body (cold, breath, movement) matters more than any thinking — and it is a good moment to reach for help.',
    },
  },
  {
    id: 'fawn',
    group: 'hypo',
    emoji: '🙇',
    min: 12,
    max: 15,
    de: {
      name: 'Fawn — Unterwerfung / Anpassung',
      meaning: 'Das „soziale Einknicken" an der Grenze zum Shutdown.',
      mechanism: 'Der Körper merkt, dass Kampf oder Flucht aussichtslos sind. Verhalten: extremes People-Pleasing, Erraten der Wünsche des Gegenübers und völliges Verleugnen eigener Bedürfnisse, um einen drohenden Konflikt im Keim zu ersticken. Du bist innerlich schon leicht taub, funktionierst sozial aber noch wie ein Roboter.',
    },
    en: {
      name: 'Fawn — submission / appeasing',
      meaning: 'The "social buckling" at the edge of shutdown.',
      mechanism: 'The body senses that fight or flight are hopeless. Behaviour: extreme people-pleasing, guessing the other person\'s wishes and completely denying your own needs to nip a looming conflict in the bud. You are already slightly numb inside, yet still function socially like a robot.',
    },
  },
  {
    id: 'freeze-functional',
    group: 'hypo',
    emoji: '🧊',
    min: 8,
    max: 12,
    de: {
      name: 'Freeze (funktionell) — Erstarrung',
      meaning: 'Wie versteinert, ein „Körper-Gefängnis".',
      mechanism: 'Der klassische Übergang ins Hypoarousal: Das Nervensystem zieht gleichzeitig Gas (Sympathikus) und Bremse (Parasympathikus) mit voller Kraft. Du nimmst die Umwelt noch wahr (oft mit starker innerer Angst oder Dread), kannst dich aber kaum bewegen, die Muskeln fühlen sich steif an und das Denken wird extrem nebelig (Brain Fog).',
    },
    en: {
      name: 'Freeze (functional) — stiffening',
      meaning: 'As if turned to stone, a "body prison".',
      mechanism: 'The classic transition into hypoarousal: the nervous system pulls gas (sympathetic) and brake (parasympathetic) with full force at the same time. You still perceive your surroundings (often with strong inner fear or dread) but can hardly move, your muscles feel stiff and thinking becomes extremely foggy (brain fog).',
    },
  },
  {
    id: 'flop',
    group: 'hypo',
    emoji: '🫠',
    min: 4,
    max: 8,
    de: {
      name: 'Flop — muskuläres Nachgeben',
      meaning: 'Es fühlt sich an, als würde der Stecker gezogen.',
      mechanism: 'Während du beim Freeze noch unter extremer Muskelspannung stehst, bricht hier die körperliche Kraft zusammen: Der Tonus geht verloren, der Körper wird komplett weich und schlaff („wie ein nasser Sack"). Es setzt eine starke emotionale und körperliche Taubheit (Analgesie) ein, um Schmerzen nicht mehr spüren zu müssen.',
    },
    en: {
      name: 'Flop — muscular giving way',
      meaning: 'It feels as if the plug has been pulled.',
      mechanism: 'While freeze still holds extreme muscle tension, here physical strength collapses: tone is lost and the body goes completely soft and limp ("like a wet sack"). Strong emotional and physical numbness (analgesia) sets in, so pain no longer has to be felt.',
    },
  },
  {
    id: 'faint',
    group: 'hypo',
    emoji: '🌫️',
    min: 0,
    max: 4,
    de: {
      name: 'Faint — Kollaps / kompletter Shutdown',
      meaning: 'Das biologische Notbremssystem im tiefsten Keller der Skala.',
      mechanism: 'Bei Faint sacken Blutdruck und Puls so radikal ab, dass Schwindel entsteht oder man tatsächlich ohnmächtig wird. Im kompletten Shutdown bei 0 % bist du vollkommen dissoziiert: mental weggetreten, du starrst ins Leere, nimmst deinen Körper nicht mehr wahr (Depersonalisation) und bist von der Außenwelt abgeschnitten.',
    },
    en: {
      name: 'Faint — collapse / complete shutdown',
      meaning: 'The biological emergency brake at the very bottom of the scale.',
      mechanism: 'In faint, blood pressure and pulse drop so radically that dizziness sets in or you actually pass out. In complete shutdown at 0% you are fully dissociated: mentally gone, staring into space, no longer feeling your body (depersonalisation) and cut off from the outside world.',
    },
  },
];
