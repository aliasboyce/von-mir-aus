/**
 * Erste Hilfe – Schritt für Schritt. Immer nur EIN Schritt auf dem Bildschirm; wo es sich verzweigt,
 * führt die Auswahl zum richtigen nächsten Schritt. Inhalte nach den Empfehlungen von DRK und Maltesern
 * (Prüfen – Rufen – Handeln). Das ersetzt keinen Erste-Hilfe-Kurs und keinen Notruf.
 */
export interface Bi { de: string; en: string }
export interface FAChoice { label: Bi; to: string; tone?: 'danger' | 'calm' }
export interface FANode {
  id: string;
  emoji: string;
  title: Bi;
  /** short lines, shown big; each line is one thing to do or know */
  lines?: Bi[];
  /** one line that must not be overlooked (warning) */
  warn?: Bi;
  /** a quiet reassurance */
  calm?: Bi;
  choices?: FAChoice[];
  next?: string;
  nextLabel?: Bi;
  /** show the metronome (pulse at about 110 per minute) */
  pulse?: boolean;
  /** show the 112 call button big */
  call?: boolean;
  end?: boolean;
}

const B = (de: string, en: string): Bi => ({ de, en });

export const FA_RULE: Bi = B('Prüfen – Rufen – Handeln', 'Check – Call – Act');
export const FA_PRINCIPLE: Bi = B('Eigenschutz geht immer vor.', 'Your own safety always comes first.');
export const FA_COMFORT: Bi = B('Das Einzige, was du wirklich falsch machen kannst, ist nichts zu tun.', 'The only thing you can really do wrong is to do nothing.');

export const FA_START = 'start';

export const FA_NODES: Record<string, FANode> = {
  start: {
    id: 'start', emoji: '🛟',
    title: B('Du schaffst das.', 'You can do this.'),
    lines: [B('Ich führe dich Schritt für Schritt.', 'I will guide you step by step.'), B('Immer nur ein Schritt auf einmal.', 'Only one step at a time.')],
    calm: FA_COMFORT,
    next: 'danger', nextLabel: B('Los geht’s', 'Let’s go'),
  },
  danger: {
    id: 'danger', emoji: '👀',
    title: B('Prüfen: Bist du sicher?', 'Check: are you safe?'),
    lines: [B('Schau dich kurz um.', 'Take a quick look around.'), B('Droht dir selbst Gefahr – zum Beispiel durch fließenden Verkehr oder Strom?', 'Is there danger to you – for example moving traffic or electricity?')],
    warn: FA_PRINCIPLE,
    choices: [
      { label: B('Ja, es ist sicher', 'Yes, it is safe'), to: 'conscious' },
      { label: B('Nein, es ist gefährlich', 'No, it is dangerous'), to: 'unsafe', tone: 'danger' },
    ],
  },
  unsafe: {
    id: 'unsafe', emoji: '⚠️',
    title: B('Zuerst du.', 'You first.'),
    lines: [B('Bring dich nicht selbst in Gefahr.', 'Do not put yourself in danger.'), B('Halte Abstand und warne andere.', 'Keep your distance and warn others.'), B('Ruf die 112 – sie sagen dir, was du tun kannst.', 'Call 112 – they tell you what you can do.')],
    call: true,
    next: 'conscious', nextLabel: B('Jetzt ist es sicher', 'It is safe now'),
  },
  conscious: {
    id: 'conscious', emoji: '🗣️',
    title: B('Reagiert die Person?', 'Does the person respond?'),
    lines: [B('Sprich sie laut an.', 'Speak to her loudly.'), B('Rüttle sanft an den Schultern.', 'Gently shake her shoulders.')],
    choices: [
      { label: B('Sie reagiert', 'She responds'), to: 'responds' },
      { label: B('Sie reagiert nicht', 'She does not respond'), to: 'call', tone: 'danger' },
    ],
  },
  responds: {
    id: 'responds', emoji: '🤝',
    title: B('Bleib bei ihr.', 'Stay with her.'),
    lines: [B('Sprich ruhig mit ihr.', 'Talk to her calmly.'), B('Frag, was passiert ist und was wehtut.', 'Ask what happened and what hurts.')],
    calm: B('Bei ernsten Verletzungen oder wenn du unsicher bist: 112 wählen.', 'With serious injuries or if you are unsure: call 112.'),
    choices: [
      { label: B('Starke Blutung', 'Heavy bleeding'), to: 'bleed1', tone: 'danger' },
      { label: B('Blass, kalter Schweiß, Zittern', 'Pale, cold sweat, shivering'), to: 'shock1' },
      { label: B('Ich bin unsicher – Notruf', 'I am unsure – emergency call'), to: 'call' },
    ],
  },
  call: {
    id: 'call', emoji: '📞',
    title: B('Rufen: 112', 'Call: 112'),
    lines: [B('Wähle selbst die 112 – oder bitte eine Person neben dir gezielt darum.', 'Call 112 yourself – or ask a specific person next to you.'), B('Bleib am Telefon, bis die Leitstelle alle Fragen geklärt hat.', 'Stay on the phone until the dispatcher has asked everything.')],
    calm: B('Sie fragen: Wo ist es passiert? Was ist passiert? Wie viele Verletzte? Welche Verletzungen?', 'They ask: where did it happen? What happened? How many injured? What injuries?'),
    call: true,
    next: 'breathing', nextLabel: B('Weiter: Atmung prüfen', 'Next: check breathing'),
  },
  breathing: {
    id: 'breathing', emoji: '🫁',
    title: B('Atmung prüfen', 'Check breathing'),
    lines: [B('Eine Hand an die Stirn, die andere ans Kinn.', 'One hand on the forehead, the other on the chin.'), B('Kopf vorsichtig nach hinten überstrecken.', 'Gently tilt the head back.'), B('Höre und fühle bis zu 10 Sekunden: Hebt sich der Brustkorb? Strömt Luft?', 'Listen and feel for up to 10 seconds: does the chest rise? Does air flow?')],
    choices: [
      { label: B('Sie atmet normal', 'She breathes normally'), to: 'rec1' },
      { label: B('Keine normale Atmung (oder nur Schnappatmung)', 'No normal breathing (or only gasping)'), to: 'cpr1', tone: 'danger' },
    ],
  },
  rec1: {
    id: 'rec1', emoji: '🧍',
    title: B('Stabile Seitenlage', 'Recovery position'),
    calm: B('Sie ist bewusstlos, atmet aber normal. Die Seitenlage hält die Atemwege frei.', 'She is unconscious but breathing normally. The recovery position keeps the airway open.'),
    lines: [B('Knie dich neben sie, strecke ihre Beine aus.', 'Kneel next to her and straighten her legs.'), B('Lege den nahen Arm angewinkelt nach oben – Handfläche nach oben.', 'Place the near arm bent upwards – palm up.')],
    next: 'rec2', nextLabel: B('Weiter', 'Next'),
  },
  rec2: {
    id: 'rec2', emoji: '↩️',
    title: B('Drehen', 'Turn'),
    lines: [B('Greife das ferne Handgelenk und lege ihren Handrücken an die nahe Wange.', 'Take the far wrist and lay the back of her hand against her near cheek.'), B('Ziehe gleichzeitig das ferne Knie zu dir, bis sie auf der Seite liegt.', 'At the same time pull the far knee towards you until she lies on her side.')],
    next: 'rec3', nextLabel: B('Weiter', 'Next'),
  },
  rec3: {
    id: 'rec3', emoji: '💨',
    title: B('Atemwege sichern', 'Secure the airway'),
    lines: [B('Überstrecke den Kopf noch einmal leicht nach hinten.', 'Tilt the head back slightly once more.'), B('Öffne den Mund, damit Flüssigkeit ablaufen kann.', 'Open the mouth so fluid can drain.'), B('Decke sie warm zu.', 'Cover her to keep her warm.')],
    next: 'rec4', nextLabel: B('Weiter', 'Next'),
  },
  rec4: {
    id: 'rec4', emoji: '👁️',
    title: B('Bleib dabei', 'Stay with her'),
    lines: [B('Kontrolliere regelmäßig die Atmung.', 'Check the breathing regularly.'), B('Bleib bei ihr, bis der Rettungsdienst da ist.', 'Stay until the ambulance arrives.')],
    calm: B('Hört die Atmung auf: sofort mit der Wiederbelebung beginnen.', 'If breathing stops: start resuscitation straight away.'),
    choices: [
      { label: B('Atmung hat aufgehört', 'Breathing has stopped'), to: 'cpr1', tone: 'danger' },
      { label: B('Rettungsdienst ist da', 'The ambulance is here'), to: 'done' },
    ],
  },
  cpr1: {
    id: 'cpr1', emoji: '❤️',
    title: B('Wiederbelebung', 'Resuscitation'),
    calm: B('Keine normale Atmung heißt: Herz-Kreislauf-Stillstand. Fang sofort an – jedes Drücken zählt.', 'No normal breathing means cardiac arrest. Start right away – every compression counts.'),
    lines: [B('Hat noch niemand 112 gerufen? Jetzt rufen.', 'Has no one called 112 yet? Call now.'), B('Lege die Person flach auf den Rücken und mache den Oberkörper frei.', 'Lay the person flat on her back and bare the chest.')],
    call: true,
    next: 'cpr2', nextLabel: B('Weiter: Drücken', 'Next: compressions'),
  },
  cpr2: {
    id: 'cpr2', emoji: '🙌',
    title: B('Richtig drücken', 'Press correctly'),
    lines: [B('Knie dich neben den Oberkörper.', 'Kneel beside the chest.'), B('Handballen genau in die Mitte des Brustkorbs (Brustbein).', 'Heel of one hand exactly in the centre of the chest (breastbone).'), B('Zweite Hand darüber, Finger verschränken.', 'Second hand on top, fingers interlaced.')],
    next: 'cpr3', nextLabel: B('Weiter', 'Next'),
  },
  cpr3: {
    id: 'cpr3', emoji: '💓',
    title: B('Tempo und Tiefe', 'Pace and depth'),
    lines: [B('Arme durchgestreckt, 5–6 cm tief drücken.', 'Arms straight, press 5–6 cm deep.'), B('100–120 Mal pro Minute – im Takt des Herzens unten.', '100–120 times a minute – to the beat below.'), B('Takt-Hilfe: „Stayin’ Alive“ oder „Highway to Hell“.', 'Rhythm aid: “Stayin’ Alive” or “Highway to Hell”.')],
    pulse: true,
    next: 'cpr4', nextLabel: B('Weiter', 'Next'),
  },
  cpr4: {
    id: 'cpr4', emoji: '🔁',
    title: B('Beatmen oder durchdrücken', 'Breaths or keep pressing'),
    lines: [B('Wenn du dich traust: nach 30 Mal Drücken 2 Atemspenden. Kopf überstrecken, Nase zuhalten, gleichmäßig Luft einblasen.', 'If you feel able: after 30 compressions give 2 breaths. Tilt the head, pinch the nose, blow in steadily.'), B('Wenn nicht: einfach ohne Pause weiterdrücken.', 'If not: simply keep pressing without a pause.')],
    calm: B('Mach weiter, bis der Rettungsdienst übernimmt oder ein AED (Defibrillator) gebracht wird.', 'Carry on until the ambulance takes over or an AED (defibrillator) arrives.'),
    choices: [
      { label: B('Rettungsdienst übernimmt', 'The ambulance takes over'), to: 'done' },
      { label: B('Zurück zum Drücken', 'Back to pressing'), to: 'cpr3', tone: 'calm' },
    ],
  },
  bleed1: {
    id: 'bleed1', emoji: '🩹',
    title: B('Direkter Druck', 'Direct pressure'),
    lines: [B('Wenn möglich: Einmalhandschuhe an.', 'If possible: put on disposable gloves.'), B('Sterile Wundauflage oder sauberes Tuch fest direkt auf die Wunde drücken.', 'Press a sterile dressing or clean cloth firmly on the wound.')],
    calm: B('Ruf dazu die 112, wenn die Blutung stark ist.', 'Call 112 as well if the bleeding is heavy.'),
    call: true,
    next: 'bleed2', nextLabel: B('Weiter', 'Next'),
  },
  bleed2: {
    id: 'bleed2', emoji: '🧻',
    title: B('Druckverband', 'Pressure bandage'),
    lines: [B('Mullbinde zweimal um die Auflage wickeln.', 'Wrap a gauze bandage twice around the dressing.'), B('Ein geschlossenes Verbandpäckchen als Druckpolster direkt auf die Wunde legen.', 'Place an unopened dressing pack on the wound as a pressure pad.'), B('Fest umwickeln.', 'Wrap it tightly.')],
    next: 'bleed3', nextLabel: B('Weiter', 'Next'),
  },
  bleed3: {
    id: 'bleed3', emoji: '🧣',
    title: B('Ruhigstellen und wärmen', 'Rest and keep warm'),
    lines: [B('Lagere das verletzte Körperteil hoch.', 'Raise the injured limb.'), B('Decke die Person zu – das beugt einem Schock vor.', 'Cover the person – this helps prevent shock.')],
    warn: B('Steckt etwas in der Wunde (Messer, Splitter): niemals herausziehen. Vorsichtig abpolstern.', 'If something is stuck in the wound (knife, splinter): never pull it out. Pad around it carefully.'),
    choices: [
      { label: B('Sie ist blass, zittert, schwitzt kalt', 'She is pale, shivering, sweating cold'), to: 'shock1' },
      { label: B('Rettungsdienst ist da', 'The ambulance is here'), to: 'done' },
    ],
  },
  shock1: {
    id: 'shock1', emoji: '🥶',
    title: B('Schock erkennen', 'Recognise shock'),
    calm: B('Ein Schock entsteht oft durch Blutverlust, starke Schmerzen oder Aufregung.', 'Shock often comes from blood loss, severe pain or excitement.'),
    lines: [B('Zeichen: blass, kalter Schweiß, Zittern, Unruhe.', 'Signs: pale, cold sweat, shivering, restlessness.'), B('Wenn nicht schon geschehen: 112 rufen.', 'If not done yet: call 112.')],
    call: true,
    next: 'shock2', nextLabel: B('Weiter', 'Next'),
  },
  shock2: {
    id: 'shock2', emoji: '🦵',
    title: B('Schocklage', 'Shock position'),
    lines: [B('Lege die wache Person flach auf den Rücken.', 'Lay the awake person flat on her back.'), B('Beine etwa 20–30 cm hoch lagern (Tasche oder Jacke).', 'Raise the legs about 20–30 cm (bag or jacket).')],
    warn: B('Nicht bei Kopf-, Brust-, Bauch- oder Beinverletzungen und nicht bei Atemnot.', 'Not with head, chest, abdomen or leg injuries, and not with difficulty breathing.'),
    next: 'shock3', nextLabel: B('Weiter', 'Next'),
  },
  shock3: {
    id: 'shock3', emoji: '🫶',
    title: B('Beruhigen und wärmen', 'Reassure and warm'),
    lines: [B('Bleib bei der Person und sprich ruhig mit ihr.', 'Stay with the person and talk to her calmly.'), B('Decke sie mit einer Rettungsdecke oder Jacke zu, damit sie nicht auskühlt.', 'Cover her with a rescue blanket or jacket so she does not get cold.')],
    next: 'done', nextLabel: B('Weiter', 'Next'),
  },
  done: {
    id: 'done', emoji: '💚',
    title: B('Du hast geholfen.', 'You helped.'),
    lines: [B('Bleib bei der Person, bis der Rettungsdienst übernimmt.', 'Stay with the person until the ambulance takes over.'), B('Sag der Besatzung kurz, was passiert ist und was du getan hast.', 'Briefly tell the crew what happened and what you did.')],
    calm: B('Danach darfst du durchatmen. Das war viel. Sprich bei Bedarf mit jemandem darüber.', 'Afterwards you may breathe out. That was a lot. Talk to someone about it if you need to.'),
    end: true,
  },
};

export const FA_SOURCES = [
  { name: 'Deutsches Rotes Kreuz (DRK) – Erste Hilfe: Tipps und Maßnahmen', url: 'https://www.drk.de/hilfe-in-deutschland/erste-hilfe/' },
  { name: 'Malteser – Erste-Hilfe-Maßnahmen: Das kannst du tun', url: 'https://www.malteser.de/aware/hilfreich/erste-hilfe-massnahmen-das-kannst-du-tun.html' },
];
