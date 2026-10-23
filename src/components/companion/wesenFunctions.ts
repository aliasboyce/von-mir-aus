/**
 * Content of the three "Wesen" functions that take over the hard part of
 * STARTING: the loving Störsender, the 10-Sekunden-Schmuggel and the
 * Hilfsmittel-in-den-Weg nudge. Everything is bilingual and kept as plain
 * data so it can be extended later.
 */
export interface Bi { de: string; en: string }
/** A Störsender line; `doing` is what "wir tun jetzt …" then names while the Wesen dances. */
export interface StoerLine extends Bi { doing?: Bi; /** effort: 1 = right where I am, 2 = do something small, 3 = get me out of here */ lvl?: 1 | 2 | 3 }
/** A Schmuggel activity; `seconds` overrides the default 10. */
export interface SchmuggelAct extends Bi { seconds?: number }

/** Direct, warm invitations without a choice — the Wesen takes over the first step. */
export const STOERSENDER_LINES: StoerLine[] = [
  { de: 'Komm, lass mal rausgehen und kurz chillen jetzt.', en: "Come on, let's step outside and chill for a bit.", lvl: 3 },
  { de: 'Nee, jetzt trink wa erstmal nen Tee.', en: "Nah, first let's have a cup of tea.", lvl: 2 },
  { de: 'Mach ma langsam jez.', en: 'Easy now. Slow down a bit.', lvl: 1 },
  { de: 'Steh mal kurz auf. Genau jetzt.', en: 'Stand up for a second. Right now.', lvl: 1 },
  { de: 'Komm, wir holen dir jetzt ein Glas Wasser.', en: "Come on, let's get you a glass of water.", lvl: 2 },
  { de: 'Fenster auf. Einmal durchatmen. Los.', en: 'Window open. One deep breath. Go.', lvl: 1 },
  { de: 'Schuhe an, wir gehen ne Runde um den Block. Nicht denken.', en: "Shoes on, we're walking around the block. No thinking.", lvl: 3 },
  { de: 'Setz dich mal hin. Ich bleib bei dir.', en: "Sit down for a moment. I'm staying with you.", lvl: 1 },
  { de: 'Hände waschen, schön warm. Komm.', en: 'Wash your hands, nice and warm. Come on.', lvl: 2 },
  { de: 'Wir essen jetzt was Kleines. Irgendwas. Komm.', en: "We're eating something small now. Anything. Come on.", lvl: 2 },
  { de: 'Leg das Handy mal weg. Fünf Minuten.', en: 'Put the phone down. Five minutes.', lvl: 1 },
  { de: 'Augen zu. Zehn Atemzüge. Ich bin dabei.', en: "Eyes closed. Ten breaths. I'm here.", lvl: 1 },
  { de: 'Komm, wir legen uns kurz hin. Zehn Minuten, mehr nicht.', en: "Come on, let's lie down for a bit. Ten minutes, no more.", lvl: 2 },
  { de: 'Schultern hoch … und fallen lassen. Nochmal.', en: 'Shoulders up … and drop. Again.', lvl: 1 },
  { de: 'Ab unter die warme Dusche. Komm.', en: 'Off to the warm shower. Come on.', lvl: 2 },
  { de: 'Raus an die Luft. Zwei Minuten reichen.', en: 'Out into the fresh air. Two minutes are enough.', lvl: 3 },
  { de: 'Wir räumen jetzt nur EINE Sache weg. Die da. Nimm sie.', en: "We're putting away just ONE thing. That one. Pick it up.", lvl: 2 },
  { de: 'Mach dir jetzt was Warmes zu trinken.', en: 'Make yourself something warm to drink now.', lvl: 2 },
  { de: 'Jetzt wird nichts entschieden. Jetzt wird nur kurz gesessen.', en: 'Nothing gets decided now. We just sit for a moment.', lvl: 1 },
  { de: 'Dreh Musik auf, die du magst. Ein Lied.', en: 'Put on music you like. One song.', lvl: 2 },
  { de: 'Pause. Wir hören jetzt auf mit dem Kopf.', en: "Pause. We're done with the head for now.", lvl: 1 },
  { de: 'Jacke an, wir gucken mal, wie der Himmel heute aussieht.', en: "Jacket on, let's see what the sky looks like today.", lvl: 3 },
  { de: 'Du musst gerade nichts schaffen. Komm einfach mit aufs Sofa.', en: "You don't have to achieve anything right now. Just come to the sofa.", lvl: 1 },
  { de: 'Barfuß auf den Boden. Spür ihn. Sofort.', en: 'Bare feet on the floor. Feel it. Right now.', lvl: 1 },
  { de: 'Einmal richtig durchstrecken. Arme hoch!', en: 'One proper stretch. Arms up!', lvl: 1 },
  { de: 'Iss noch was Kleines. Ich glaub, dein Körper wartet schon.', en: 'Eat something small. I think your body has been waiting.', lvl: 2 },
  { de: 'Schreib jemandem nur ein Herz. Mehr nicht. Komm.', en: 'Send someone just a heart. Nothing more. Come on.', lvl: 2 },
  { de: 'Kuscheldecke. Hol sie. Jetzt.', en: 'Blanket. Go get it. Now.', lvl: 2 },
  { de: 'Wir machen jetzt Pause. Ausnahmslos.', en: "We're taking a break now. No exceptions.", lvl: 1 },
  { de: 'Trink was. Jetzt. Ich bin dabei.', en: "Drink something. Now. I'm with you.", lvl: 1 },
  { de: 'Komm ans Fenster, wir gucken fünf Dinge an.', en: "Come to the window, we're looking at five things.", lvl: 1 },
  { de: 'Lass es jetzt liegen. Komm weg vom Bildschirm.', en: 'Leave it. Step away from the screen.', lvl: 1 },
  { de: 'Stell dir einen Timer auf fünf Minuten und tu: nichts. Los.', en: 'Set a timer for five minutes and do: nothing. Go.', lvl: 1 },
  { de: 'Atme aus. Länger als ein. Nochmal.', en: 'Breathe out. Longer than in. Again.', lvl: 1 },
  { de: 'Wasch dir das Gesicht. Lauwarm. Komm.', en: 'Wash your face. Lukewarm. Come on.', lvl: 2 },
  { de: 'Mach das Licht ein bisschen weicher. Wir machen es uns gemütlich.', en: "Soften the light a little. Let's make it cosy.", lvl: 1 },
  { de: 'Ab ins Bad, Zähne putzen. Das schaffen wir zusammen.', en: "Off to the bathroom, brush your teeth. We'll do it together.", lvl: 2 },
  { de: 'Komm, wir gehen kurz raus und gucken Bäume an.', en: "Come on, let's go out and look at trees for a bit.", lvl: 3 },
  {
    de: 'Dringende Durchsage von deinem Körper: Deine Tastatur und dein Putzlappen vermissen dich nicht, wenn du jetzt mal kurz weg bist. Geh in die Küche. Koch Wasser. Mach Tee. Und wehe, du machst in der Wartezeit den Abwasch! Du starrst jetzt einfach diesem bescheuerten Wasserkocher beim Blubbern zu. Deal?',
    en: "Urgent announcement from your body: your keyboard and your cleaning cloth will not miss you if you step away for a moment. Go to the kitchen. Boil water. Make tea. And don't you dare do the dishes while you wait! You just stare at that ridiculous kettle bubbling. Deal?",
    doing: { de: 'Tee kochen und dem Wasserkocher beim Blubbern zusehen', en: 'make tea and watch the kettle bubble' },
    lvl: 2,
  },
  {
    de: 'Herzlichen Glückwunsch, du wurdest gerade von deinem eigenen Smartphone für fläzende Aktivitäten freigestellt. Geh zum Sofa. Lass dich wie ein nasser Sandsack draufplumpsen. Wenn dein innerer Antreiber meckert, sag ihm, die App hat es befohlen. Du liest jetzt eine Seite in deinem Buch – oder du starrst einfach nur Löcher in die Luft. Deine Entscheidung, du bist der Chef.',
    en: "Congratulations, your own smartphone has just released you for lounging activities. Go to the sofa. Plop onto it like a wet sack. If your inner taskmaster complains, tell it the app ordered it. Now you read one page of your book – or you just stare at the air. Your decision, you're the boss.",
    doing: { de: 'aufs Sofa plumpsen', en: 'plop onto the sofa' },
  },
  {
    de: 'Wichtige Nachricht: Die Vögel draußen führen irgendwas im Schilde. Geh ans Fenster. Mach es auf. Atme die kalte Luft ein und beobachte die Lage da draußen für ein paar Minuten. Sobald du das Gefühl hast, die Tauben planen keine Weltherrschaft, darfst du wieder rein und weiterfunktionieren.',
    en: "Important message: the birds outside are up to something. Go to the window. Open it. Breathe in the cold air and observe the situation out there for a few minutes. As soon as you feel the pigeons are not planning world domination, you may come back in and carry on functioning.",
    doing: { de: 'die Vögel am Fenster beobachten', en: 'watch the birds at the window' },
  },
  {
    de: 'Dein Autopilot läuft seit Stunden auf Anschlag. Zeit für das Burrito-Protokoll. Schnapp dir die dickste Decke, die du finden kannst, und wickle dich ein, bis du dich wie Fast-Food an der Tankstelle fühlst. Bleib so lange liegen, bis dir warm genug ist, um deinem inneren Sklaventreiber die Meinung zu sagen.',
    en: "Your autopilot has been running flat out for hours. Time for the burrito protocol. Grab the thickest blanket you can find and wrap yourself up until you feel like fast food at a gas station. Stay put until you are warm enough to tell your inner slave driver what you think.",
    doing: { de: 'uns in die Decke einwickeln – Burrito-Protokoll', en: 'wrap ourselves in a blanket – burrito protocol' },
  },
  {
    de: 'Stopp! Es ist Zeit für eine völlig unproduktive, sinnlose Aktion, die niemandem außer dir nützt. Geh zu deinem Lieblingsgegenstand (oder Buch, Magazin). Fass ihn an. Blättere drin rum. Warum? Weil du es kannst und weil die Welt nicht untergeht, wenn du jetzt mal kurz egoistisch bist.',
    en: "Stop! It is time for a completely unproductive, pointless action that benefits nobody but you. Go to your favourite object (or book, magazine). Touch it. Leaf through it. Why? Because you can, and because the world will not end if you are selfish for a moment.",
    doing: { de: 'was völlig Unproduktives machen', en: 'do something completely unproductive' },
  },
  { de: 'Lass die Schultern sinken. Und noch ein Stück tiefer.', en: 'Let your shoulders drop. And a little lower.', lvl: 1 },
  { de: 'Drück die Füße fest in den Boden. Fünf Sekunden. Loslassen.', en: 'Press your feet firmly into the floor. Five seconds. Let go.', lvl: 1 },
  { de: 'Eine Hand aufs Herz, eine auf den Bauch. Du musst nur spüren.', en: 'One hand on your heart, one on your belly. You only have to feel.', lvl: 1 },
  { de: 'Zähl fünf Dinge, die du gerade siehst. Laut oder leise.', en: 'Count five things you can see right now. Out loud or silently.', lvl: 1 },
  { de: 'Kiefer locker. Zunge weg vom Gaumen. Ahhh.', en: 'Loosen your jaw. Tongue away from the roof of your mouth. Ahhh.', lvl: 1 },
  { de: 'Reib die Handflächen aneinander, bis sie warm sind. Leg sie aufs Gesicht.', en: 'Rub your palms together until they are warm. Lay them on your face.', lvl: 1 },
  { de: 'Nimm irgendwas Weiches in die Hand. Streichel es. Eine Minute.', en: 'Pick up something soft. Stroke it. One minute.', lvl: 1 },
  { de: 'Summ einen Ton. Egal welchen. Zehn Sekunden.', en: 'Hum a note. Any note. Ten seconds.', lvl: 1 },
  { de: 'Sag leise zu dir: „Ich bin gerade hier.“ Und nochmal.', en: 'Say quietly to yourself: "I am here right now." And again.', lvl: 1 },
  { de: 'Drück die Hände fest gegeneinander. Fünf Sekunden. Und lass los.', en: 'Press your hands firmly together. Five seconds. And let go.', lvl: 1 },
  { de: 'Wackel mit allen zehn Zehen. Wirklich allen.', en: 'Wiggle all ten toes. Really all of them.', lvl: 1 },
  { de: 'Roll die Schultern fünfmal nach hinten. Langsam.', en: 'Roll your shoulders back five times. Slowly.', lvl: 1 },
  { de: 'Dreh den Kopf langsam nach links, dann nach rechts. Was ist im Raum?', en: 'Slowly turn your head left, then right. What is in the room?', lvl: 1 },
  { de: 'Lehn dich zurück. Der Stuhl oder das Sofa trägt dich. Du musst nichts halten.', en: 'Lean back. The chair or sofa carries you. You do not have to hold anything.', lvl: 1 },
  { de: 'Such dir die schönste Farbe im Raum. Schau sie eine halbe Minute an.', en: 'Find the nicest colour in the room. Look at it for half a minute.', lvl: 1 },
  { de: 'Trink einen Schluck. Nur einen. Und merk, wie er runtergeht.', en: 'Take a sip. Just one. And notice it going down.', lvl: 1 },
  { de: 'Wir räumen jetzt drei Dinge weg. Nur drei. Dann ist Schluss.', en: 'We are putting away three things now. Only three. Then we stop.', lvl: 2 },
  { de: 'Zieh dir frische, kuschelige Socken an. Los.', en: 'Put on fresh, cosy socks. Go.', lvl: 2 },
  { de: 'Hol dir einen Snack und iss ihn ganz langsam am Fenster.', en: 'Get a snack and eat it very slowly by the window.', lvl: 2 },
  { de: 'Zünd eine Kerze oder Lichterkette an. Wir machen es hell und weich.', en: 'Light a candle or fairy lights. We make it bright and soft.', lvl: 2 },
  { de: 'Gieß eine Pflanze. Nur eine. Sag ihr Hallo.', en: 'Water a plant. Just one. Say hello to it.', lvl: 2 },
  { de: 'Tanz ein Lied lang durchs Zimmer. Nicht gut, nur bewegt.', en: 'Dance through the room for one song. Not well, just moving.', lvl: 2 },
  { de: 'Kritzel zwei Minuten irgendwas auf ein Blatt. Ein Ergebnis ist nicht nötig.', en: 'Doodle anything on a sheet for two minutes. No result needed.', lvl: 2 },
  { de: 'Halt die Hände unters warme Wasser. Ganz lange. Spür es.', en: 'Hold your hands under warm water. For a long time. Feel it.', lvl: 2 },
  { de: 'Schreib drei Dinge auf einen Zettel, die heute okay waren. Auch winzige.', en: 'Write three things on a note that were okay today. Tiny ones count.', lvl: 2 },
  { de: 'Schäl eine Mandarine oder Orange und riech daran. Dann iss sie.', en: 'Peel a tangerine or orange and smell it. Then eat it.', lvl: 2 },
  { de: 'Creme dir die Hände ein. Langsam. Jeden Finger einzeln.', en: 'Put cream on your hands. Slowly. Each finger on its own.', lvl: 2 },
  { de: 'Wechsel den Raum. Geh ins andere Zimmer und schau, wie es sich anfühlt.', en: 'Change rooms. Go into another room and see how it feels.', lvl: 2 },
  { de: 'Stell dir einen Wecker auf zehn Minuten und leg dich hin. Der Wecker passt auf.', en: 'Set an alarm for ten minutes and lie down. The alarm keeps watch.', lvl: 2 },
  { de: 'Roll dich unter der Decke zusammen wie eine Kugel. Zwei Minuten.', en: 'Curl up under a blanket like a ball. Two minutes.', lvl: 2 },
  { de: 'Mach ein Foto von etwas Schönem in deiner Wohnung.', en: 'Take a photo of something beautiful in your home.', lvl: 2 },
  { de: 'Schüttel eine Minute alles aus: Arme, Beine, Kopf.', en: 'Shake everything out for a minute: arms, legs, head.', lvl: 2 },
  { de: 'Mach dir ein Brot. Auch ein trockenes zählt.', en: 'Make yourself a sandwich. A dry one counts too.', lvl: 2 },
  { de: 'Raus hier. Schlüssel, Jacke, Tür. Der Rest ergibt sich.', en: 'Out of here. Keys, jacket, door. The rest will follow.', lvl: 3 },
  { de: 'Geh bis zur nächsten Ecke und zurück. Nur bis zur Ecke.', en: 'Walk to the next corner and back. Only to the corner.', lvl: 3 },
  { de: 'Setz dich draußen auf eine Bank. Zehn Minuten Wetter gucken.', en: 'Sit on a bench outside. Ten minutes of watching the weather.', lvl: 3 },
  { de: 'Geh in den nächsten Park oder Hof und such etwas Grünes.', en: 'Go to the nearest park or yard and find something green.', lvl: 3 },
  { de: 'Stell dich kurz in die Sonne oder in den Wind. Gesicht hoch.', en: 'Stand in the sun or the wind for a moment. Face up.', lvl: 3 },
  { de: 'Hol dir unterwegs was Kleines, das du magst: Obst, Blumen, ein Eis.', en: 'Get yourself something small you like on the way: fruit, flowers, an ice cream.', lvl: 3 },
  { de: 'Ruf jemanden an, der dir guttut. Auch nur für drei Minuten.', en: 'Call someone who is good for you. Even just for three minutes.', lvl: 3 },
  { de: 'Schreib jemandem: „Hast du heute eine Stunde?“ Und geh schon mal los.', en: 'Write someone: "Do you have an hour today?" And start walking already.', lvl: 3 },
  { de: 'Geh zum Bäcker oder Kiosk und hol dir was. Du musst nicht reden, nur zeigen.', en: 'Go to the bakery or kiosk and get something. You do not have to talk, just point.', lvl: 3 },
  { de: 'Treppenhaus, Balkon, Hof – irgendwo anderes Licht. Fünf Minuten.', en: 'Stairwell, balcony, yard – somewhere with different light. Five minutes.', lvl: 3 },
  { de: 'Lauf, bis dir warm wird. Dann dreh um.', en: 'Walk until you get warm. Then turn around.', lvl: 3 },
];

/** Templates that use one of the person's own Ressourcen ({res}). */
export const STOERSENDER_OWN: StoerLine[] = [
  { de: 'Komm, nimm dir jetzt kurz „{res}“. Fünf Minuten, mehr nicht.', en: 'Come on, take “{res}” for a moment. Five minutes, no more.' },
  { de: 'Du hast doch „{res}“ – hol’s dir. Ich bleib hier.', en: 'You have “{res}” – go get it. I’ll stay here.' },
  { de: 'Nicht überlegen: „{res}“. Los.', en: 'Don’t think: “{res}”. Go.' },
  { de: 'Wir probieren jetzt „{res}“. Einfach anfangen.', en: "We're trying “{res}” now. Just start." },
  { de: '„{res}“ wartet schon auf dich. Komm.', en: '“{res}” is already waiting for you. Come on.' },
  { de: 'Heute dran: „{res}“. Der kleinste Anfang reicht.', en: "Today: “{res}”. The smallest start is enough." },
];

/** What to do for exactly ten seconds — a small crack in the wall of functioning. */
export const SCHMUGGEL_ACTIVITIES: SchmuggelAct[] = [
  { de: 'Schüttel dich – ganz, von den Händen bis zu den Füßen!', en: 'Shake yourself – all over, from your hands to your feet!' },
  { de: 'Klatsch in die Hände – laut!', en: 'Clap your hands – loud!' },
  { de: 'Stampf mit den Füßen auf den Boden.', en: 'Stomp your feet on the floor.' },
  { de: 'Tanz! Egal wie.', en: 'Dance! However you like.' },
  { de: 'Spring auf der Stelle.', en: 'Jump on the spot.' },
  { de: 'Atme tief ein – und lang, lang aus.', en: 'Breathe in deeply – and out, long, long.' },
  { de: 'Streck dich – so weit du kannst.', en: 'Stretch – as far as you can.' },
  { de: 'Sag laut irgendwelche Wörter: Banane, Nebel, Trampolin …', en: 'Say random words out loud: banana, fog, trampoline …' },
  { de: 'Mach das komischste Gesicht, das du kannst.', en: 'Make the silliest face you can.' },
  { de: 'Summ einen Ton – so tief du kannst.', en: 'Hum a note – as low as you can.' },
  { de: 'Dreh dich einmal im Kreis.', en: 'Turn around once.' },
  { de: 'Wackel mit Fingern und Zehen.', en: 'Wiggle your fingers and toes.' },
  { de: 'Schüttel nur die Arme aus.', en: 'Shake out just your arms.' },
  { de: 'Kreis die Schultern – groß.', en: 'Roll your shoulders – big.' },
  { de: 'Gähn – so richtig, mit Geräusch.', en: 'Yawn – properly, with sound.' },
  { de: 'Trommle mit den Händen auf deine Oberschenkel.', en: 'Drum on your thighs with your hands.' },
  { de: 'Sag deinen Namen – erst ganz tief, dann ganz hoch.', en: 'Say your name – first very low, then very high.' },
  { de: 'Mach dich ganz klein – und dann ganz groß.', en: 'Make yourself very small – then very big.' },
  { de: 'Hüpf auf einem Bein.', en: 'Hop on one leg.' },
  { de: 'Pust die Backen auf und lass die Luft laut raus.', en: 'Puff up your cheeks and let the air out loudly.' },
  { de: 'Fahr dir durch die Haare und zerzaus sie.', en: 'Run your hands through your hair and mess it up.' },
  { de: 'Stell dich hin wie ein Superheld.', en: 'Stand like a superhero.' },
  { de: 'Zähl laut rückwärts von 10 – mit Gefühl.', en: 'Count down from 10 out loud – with feeling.' },
  { de: 'Sing den Anfang irgendeines Liedes. Falsch ist richtig.', en: 'Sing the start of any song. Wrong is right.' },
  { de: 'Streck die Zunge raus. Ja, wirklich.', en: 'Stick out your tongue. Yes, really.' },
  { de: 'Wirf imaginäre Bälle in die Luft und fang sie.', en: 'Toss imaginary balls in the air and catch them.' },
  { de: 'Boxe in die Luft – sanft oder kräftig, wie du magst.', en: 'Punch the air – softly or strongly, as you like.' },
  { de: 'Klopf dich sanft ab: Arme, Beine, Brust.', en: 'Pat yourself down gently: arms, legs, chest.' },
  { de: 'Mach das Geräusch eines Tieres. Welches, ist egal.', en: 'Make an animal sound. Which one does not matter.' },
  { de: 'Reib die Hände heiß aneinander.', en: 'Rub your hands together until they are hot.' },
  { de: 'Lächle komisch breit – und halte es.', en: 'Smile oddly wide – and hold it.' },
  { de: 'Wiege dich wie Seetang in der Strömung.', en: 'Sway like seaweed in the current.' },
  { de: 'Benenn schnell drei Dinge, die du im Raum siehst.', en: 'Quickly name three things you see in the room.' },
  { de: 'Heb die Arme hoch und lass sie schwer fallen.', en: 'Raise your arms and let them drop heavily.' },
  { de: 'Flattere mit den Armen wie ein Vogel.', en: 'Flap your arms like a bird.' },
  { de: 'Sag ein Wort, das es nicht gibt.', en: 'Say a word that does not exist.' },
  { de: 'Dreh den Kopf langsam links, rechts – und schau dich wirklich um.', en: 'Turn your head slowly left, right – and really look around.' },
  { seconds: 5, de: 'Egal, was du gerade tust: Reiß die Augen auf und starre für 5 Sekunden das unschuldigste Objekt im Raum an (z. B. deine Kaffeetasse oder die Wand), als wäre es das Faszinierendste auf Erden. Danach darfst du dich wieder wichtig fühlen und weiterschuften.', en: 'No matter what you are doing: open your eyes wide and stare for 5 seconds at the most innocent object in the room (your coffee cup, the wall), as if it were the most fascinating thing on earth. Afterwards you may feel important again and carry on grinding.' },
  { seconds: 8, de: 'Zieh deine Ellenbogen ganz fest an den Körper, mach kleine Hände und bewege dich für 8 Sekunden wie ein gestresster T-Rex durch den Raum. Sieht bescheuert aus? Gut. Nervensystem irritiert. Mission erfüllt. Weitermachen.', en: 'Pull your elbows tight to your body, make tiny hands and move through the room like a stressed T-rex for 8 seconds. Looks ridiculous? Good. Nervous system confused. Mission accomplished. Carry on.' },
  { seconds: 7, de: 'Achtung, dein Gehirn läuft heiß vor lauter Produktivität! Schüttle für genau 7 Sekunden deine rechte Hand aus, als hättest du klebrigen Honig an den Fingern. Nur die Hand. Der Rest bleibt in der Rüstung. Und … ab.', en: 'Attention, your brain is overheating from sheer productivity! Shake out your right hand for exactly 7 seconds as if you had sticky honey on your fingers. Only the hand. The rest stays in the armour. And … go.' },
  { seconds: 10, de: 'Tu für 10 Sekunden so, als wärst du ein Geheimagent auf Mission. Fixiere eine Türklinke. Geh langsam darauf zu. Atme aus. Berühre sie. Okay, Gefahr vorbei, du bist wieder die normale, funktionierende Person. Danke für deinen Einsatz.', en: 'For 10 seconds pretend you are a secret agent on a mission. Fix your eyes on a door handle. Walk slowly towards it. Breathe out. Touch it. Okay, danger over, you are the normal, functioning person again. Thanks for your service.' },
  { seconds: 5, de: 'Blinzele für 5 Sekunden so schnell du kannst, als wärst du ein Maulwurf, der gerade das erste Mal ans Tageslicht kommt. Schrecklich? Ja. Aber dein Blick ist nicht mehr eingefroren. Gern geschehen.', en: 'Blink as fast as you can for 5 seconds, like a mole seeing daylight for the first time. Awful? Yes. But your gaze is no longer frozen. You are welcome.' },
];

/** "Hilfsmittel in den Weg": short lines that put one of the person's own things in front of them. */
export const NUDGE_LINES: Bi[] = [
  { de: 'Hey, du hast da übrigens „{res}“.', en: 'Hey, by the way, you have “{res}”.' },
  { de: 'Nur so zwischendurch: Du hast „{res}“.', en: 'Just in passing: you have “{res}”.' },
  { de: 'Falls es gerade passt – „{res}“ gehört dir.', en: 'In case it fits right now – “{res}” is yours.' },
  { de: 'Ich wollte dich nur dran erinnern: „{res}“.', en: 'I just wanted to remind you: “{res}”.' },
  { de: 'Schau mal, was du alles hast: „{res}“.', en: 'Look what you have: “{res}”.' },
  { de: 'Vielleicht heute mal wieder: „{res}“?', en: 'Maybe today again: “{res}”?' },
  { de: 'Du hast da „{res}“ – es liegt für dich bereit.', en: 'You have “{res}” – it is ready for you.' },
  { de: 'Nicht vergessen: „{res}“ gibt es auch noch.', en: 'Don’t forget: “{res}” exists, too.' },
];

export const INFO_STOERSENDER: { title: Bi; body: Bi } = {
  title: { de: 'Liebevoller Störsender', en: 'Loving interrupter' },
  body: {
    de: `### Wozu das gut ist
Im Stress, in Dissoziation oder bei Erschöpfung ist oft genau die Fähigkeit weg, **selbst anzufangen** (Handlungsinitiierung, eine Exekutivfunktion). Dann ist nicht das Wissen das Problem – du weißt, dass ein Tee oder frische Luft helfen würde –, sondern der erste Schritt. Schon eine Auswahl zu treffen kostet zu viel.

### Was der Störsender tut
Ein vertrauter Mensch sagt in so einem Moment nicht „Was würde dir denn gerade guttun?“, sondern: „Komm, wir gehen raus und trinken einen Tee.“ Er übernimmt das Anfangen. Genau das macht der Störsender: eine direkte, liebevolle Einladung **ohne Auswahl**. Er unterbricht das Festhängen, und du musst nur noch mitgehen.

### Wie viel Aufwand geht gerade?
Am Anfang kannst du kurz antippen, wie viel möglich ist: **Wenig Aufwand** (an Ort und Stelle, ohne aufzustehen), **etwas mehr** (kleine Handlung in der Wohnung) oder **noch mehr** („hol mich hier raus“: raus, Ortswechsel, Kontakt). Wenn selbst das zu viel ist: „Keine Ahnung – überrasch mich“. Das ist die einzige Wahl – und sie darf auch ausfallen.

### Freiheit
Es ist eine Einladung, keine Anweisung und kein Test. „Das geht gerade nicht“ ist immer eine gültige Antwort. Wo du eigene Ressourcen angelegt hast, nimmt er sie auf – dann klingt es so, als würde jemand sagen: „Komm, du hast doch …“`,
    en: `### What it is for
Under stress, in dissociation or when exhausted, the ability to **start by yourself** (task initiation, an executive function) is often exactly what is gone. The problem is not knowing – you know tea or fresh air would help – but the first step. Even making a choice costs too much.

### What the interrupter does
A trusted person in such a moment does not ask "What would do you good right now?" but says: "Come on, let's go outside and have a tea." They take over the starting. That is exactly what this does: a direct, loving invitation **without a choice**. It breaks the stuckness, and all you have to do is come along.

### How much effort is possible right now?
At the start you can quickly tap how much is possible: **hardly any effort** (right where you are, without getting up), **a bit more** (a small action at home) or **even more** ("get me out of here": outside, change of place, contact). If even that is too much: "No idea – surprise me". That is the only choice – and it may be skipped, too.

### Freedom
It is an invitation, not an order and not a test. "That does not work right now" is always a valid answer. Where you have created your own resources, it picks them up – so it sounds like someone saying: "Come on, you have …"`,
  },
};

export const INFO_SCHMUGGEL: { title: Bi; body: Bi } = {
  title: { de: '10 Sekunden Schmuggel', en: '10-second smuggle' },
  body: {
    de: `### Ein Riss in der Wand des Funktionierens
Wer lange funktioniert – Maske, Dauer-Anspannung, Autopilot –, spürt die Wand oft erst, wenn sie schon sehr dick ist. Dann ist jede große Veränderung zu viel.

### Wie es hilft
Für **nur 10 Sekunden** tust du etwas ganz anderes: schütteln, klatschen, stampfen, summen, Quatsch sagen. Solch eine kleine Musterunterbrechung holt dich über Körper, Stimme und Überraschung aus Grübeln, Erstarrung oder Autopilot zurück ins Hier. Du musst nichts verarbeiten, nichts verstehen, nichts lösen.

### Warum so kurz
10 Sekunden sind so wenig, dass kein Widerstand entsteht. Und danach darfst du **sofort weiter funktionieren** – nichts bleibt offen, nichts wird von dir erwartet. Oft wird daraus von selbst ein Moment mehr Kontakt zu dir.

Das ist ein kleiner Alltagshelfer, kein Ersatz für Hilfe in einer akuten Krise – dafür ist der Krisenmodus da.

### Fachlicher Hintergrund
**Psychologisch.** Grübeln, Dissoziation und Erstarrung halten sich oft selbst am Laufen – wie eine Schleife. Eine kurze, deutlich *andere* Handlung unterbricht das Muster (Musterunterbrechung). Das Prinzip kennt man aus der Verhaltensaktivierung: Man muss nicht erst motiviert sein – **das Tun kommt vor der Stimmung**, und ein sehr kleiner Schritt senkt die Hürde. In der Dialektisch-Behavioralen Therapie gehören kurze, körperlich intensive Reize zu den Skills für Stresstoleranz. Das Zeitlimit und das „Danach geht alles weiter“ vermeiden Widerstand und geben ein schnelles Erfolgserlebnis (Selbstwirksamkeit). Humor und Quatsch schaffen außerdem Abstand zur Belastung.

**Ergotherapeutisch.** Hier wird eine Aktivität so zugeschnitten, dass sie *genau machbar* ist („Just-right-Challenge“): klein, klar, mit sichtbarem Ende. Schütteln, Stampfen, Klatschen, Drücken oder Trommeln sind propriozeptive Reize – in der sensorischen Integration nutzt man sie, um das Aktivierungsniveau zu ordnen („Schwerarbeit“ fürs Nervensystem). Rhythmus und Stimme wirken zusätzlich organisierend. Außerdem sind es Mikropausen: Sie unterbrechen langes Durchhalten, bevor es zur Erschöpfung wird (Pacing).

**Neurobiologisch.** Bewegung, Berührung und Stimme sind „Bottom-up“-Signale: Sie erreichen über Körper und Hirnstamm die Systeme für Aufmerksamkeit und Aktivierung schneller als ein Gedanke. Etwas Überraschendes löst eine Orientierungsreaktion aus und holt die Aufmerksamkeit in die Gegenwart. Wechselt man von innerem Grübeln auf eine äußere, körperliche Aufgabe, wird das Ruhenetzwerk des Gehirns (Default-Mode-Netzwerk, bei Grübeln überaktiv) gedämpft und aufgabenbezogene Netzwerke übernehmen. Summen und tiefes Tönen beanspruchen Kehlkopf und Rachen, die über den Vagusnerv versorgt werden – ein plausibler Weg zu mehr Ruhe, auch wenn die Studienlage dazu begrenzt ist.

*Das sind Erklärmodelle für Alltagshilfen, keine Heilversprechen und kein Ersatz für Therapie. Wie stark etwas wirkt, ist von Mensch zu Mensch verschieden – wenn es nicht passt, ist „Gerade nicht“ die richtige Antwort.*`,
    en: `### A crack in the wall of functioning
Whoever functions for a long time – mask, constant tension, autopilot – often only notices the wall when it is already very thick. Then any big change is too much.

### How it helps
For **just 10 seconds** you do something completely different: shake, clap, stomp, hum, say nonsense. A small pattern interruption like that brings you back to the here and now through body, voice and surprise – out of rumination, freeze or autopilot. You do not have to process, understand or solve anything.

### Why so short
10 seconds is so little that no resistance builds up. And afterwards you may **go on functioning right away** – nothing stays open, nothing is expected of you. Often it turns into a moment of more contact with yourself all by itself.

This is a small everyday helper, not a replacement for help in an acute crisis – that is what the crisis mode is for.

### Professional background
**Psychological.** Rumination, dissociation and freeze often keep themselves going, like a loop. A short, clearly *different* action interrupts the pattern. The principle is known from behavioural activation: you do not have to feel motivated first – **doing comes before the mood**, and a very small step lowers the barrier. In dialectical behaviour therapy, brief, physically intense stimuli are part of the distress-tolerance skills. The time limit and the "afterwards everything goes on" avoid resistance and give a quick experience of success (self-efficacy). Humour and silliness also create distance from the strain.

**Occupational-therapy.** An activity is cut to be *just doable* ("just-right challenge"): small, clear, with a visible end. Shaking, stomping, clapping, pressing or drumming are proprioceptive inputs – in sensory integration they are used to organise the arousal level ("heavy work" for the nervous system). Rhythm and voice add an organising effect. They are also micro-breaks: they interrupt long stretches of pushing on before it turns into exhaustion (pacing).

**Neurobiological.** Movement, touch and voice are "bottom-up" signals: through body and brainstem they reach the systems for attention and arousal faster than a thought. Something surprising triggers an orienting response and pulls attention into the present. Switching from inner rumination to an outer, bodily task dampens the brain's resting network (default mode network, overactive in rumination) while task-related networks take over. Humming and low tones engage larynx and pharynx, which are supplied by the vagus nerve – a plausible path to more calm, although the evidence is limited.

*These are explanatory models for everyday helpers, not promises of healing and not a replacement for therapy. How strongly something works differs from person to person – if it does not fit, "Not now" is the right answer.*`,
  },
};

export const INFO_NUDGE: { title: Bi; body: Bi } = {
  title: { de: 'Hilfsmittel in den Weg legen', en: 'Putting tools in your way' },
  body: {
    de: `### Wozu das gut ist
Bei Dissoziation, Stress oder Erschöpfung ist das Wissen darüber, was du hast und was dir hilft, oft gerade nicht abrufbar – nicht, weil es weg ist, sondern weil der **Abruf** blockiert. Was du siehst, kannst du eher nutzen als das, woran du dich erinnern müsstest.

### Was das Wesen tut
Es legt dir über den Tag verteilt eine deiner eigenen Ressourcen in den Weg: „Hey, du hast da übrigens …“. Du musst nicht suchen, nicht entscheiden, nicht erinnern. Passt es gerade nicht, tippst du auf „Gerade nicht“ – dann kommt es erst später wieder.

### Du bestimmst
Du kannst es jederzeit in den Einstellungen unter „Mein Wesen“ ausschalten.

### Fachlicher Hintergrund
**Psychologisch.** Unter Stress oder in Dissoziation ist Wissen oft zustandsabhängig: Es ist vorhanden, aber im jetzigen Zustand nicht abrufbar. Dabei ist *Wiedererkennen* viel leichter als *freies Erinnern* – ein sichtbarer Hinweis (Cue) ersetzt die Suche im Kopf. Eine einzelne Option statt einer Liste schützt vor Entscheidungsüberlastung (Choice Overload). Das Prinzip kennt man aus der „Nudging“-Forschung: Die Umgebung so gestalten, dass das Hilfreiche das Naheliegende ist. Dass es *deine eigenen* Ressourcen sind, stärkt Selbstkohärenz und Selbstwirksamkeit – du wirst an dich erinnert, nicht belehrt.

**Ergotherapeutisch.** Statt die Person zu verändern, passt man die Umwelt an (Umweltanpassung): Hilfsmittel werden sichtbar, griffbereit und mit wenig Aufwand erreichbar. Visuelle Erinnerungen sind eine klassische kompensatorische Strategie, wenn Planen, Anfangen oder Erinnern (Exekutivfunktionen) gerade schwerfallen. Ein „Hinweis zur richtigen Zeit“ verknüpft das Hilfsmittel mit dem Alltag und unterstützt den Aufbau von Gewohnheiten und Routinen.

**Neurobiologisch.** Bei starker Anspannung dämpfen Stresshormone (Noradrenalin, Cortisol) den präfrontalen Kortex, der Arbeitsgedächtnis, Planen und gezielten Abruf trägt – und stärken zugleich eher automatische, angstnahe Schaltkreise. Wiedererkennen braucht weniger präfrontale Kontrolle als freier Abruf, deshalb funktioniert ein äußerer Hinweis auch dann, wenn das „Nachdenken“ gerade offline ist. Bei dissoziativen Zuständen ist zudem der Zugang zu Körper- und Selbstbezug verändert; ein einfacher, klarer Reiz von außen ist dann ein niedrigschwelliger Einstieg.

*Das sind Erklärmodelle, keine Heilversprechen. Es soll entlasten, nicht antreiben – „Gerade nicht“ ist immer in Ordnung.*`,
    en: `### What it is for
With dissociation, stress or exhaustion, knowing what you have and what helps you is often not retrievable – not because it is gone, but because **retrieval** is blocked. You can use what you see more easily than what you would have to remember.

### What the companion does
Spread over the day it puts one of your own resources in your way: "Hey, by the way, you have …". You do not have to search, decide or remember. If it does not fit right now, tap "Not now" – then it only comes back later.

### You decide
You can switch it off at any time in the settings under "My companion".

### Professional background
**Psychological.** Under stress or in dissociation, knowledge is often state-dependent: it is there, but not retrievable in the present state. *Recognising* is much easier than *free recall* – a visible cue replaces the search in your head. A single option instead of a list protects against choice overload. The principle is known from "nudging" research: shape the environment so that the helpful thing is the obvious one. Because these are *your own* resources, it strengthens self-coherence and self-efficacy – you are reminded of yourself, not taught.

**Occupational-therapy.** Instead of changing the person, the environment is adapted (environmental modification): aids become visible, within reach and low in effort. Visual reminders are a classic compensatory strategy when planning, starting or remembering (executive functions) are hard right now. A "hint at the right time" ties the aid to everyday life and supports building habits and routines.

**Neurobiological.** Under strong tension, stress hormones (noradrenaline, cortisol) dampen the prefrontal cortex, which carries working memory, planning and deliberate retrieval – and at the same time strengthen more automatic, fear-related circuits. Recognition needs less prefrontal control than free recall, so an outside cue works even when "thinking" is offline. In dissociative states, access to body and self is also altered; a simple, clear stimulus from outside is then a low-threshold way in.

*These are explanatory models, not promises of healing. It should relieve, not push – "Not now" is always fine.*`,
  },
};
