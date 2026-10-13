/**
 * Content of the three "Wesen" functions that take over the hard part of
 * STARTING: the loving Störsender, the 10-Sekunden-Schmuggel and the
 * Hilfsmittel-in-den-Weg nudge. Everything is bilingual and kept as plain
 * data so it can be extended later.
 */
export interface Bi { de: string; en: string }
/** A Störsender line; `doing` is what "wir tun jetzt …" then names while the Wesen dances. */
export interface StoerLine extends Bi { doing?: Bi }
/** A Schmuggel activity; `seconds` overrides the default 10. */
export interface SchmuggelAct extends Bi { seconds?: number }

/** Direct, warm invitations without a choice — the Wesen takes over the first step. */
export const STOERSENDER_LINES: StoerLine[] = [
  { de: 'Komm, lass mal rausgehen und kurz chillen jetzt.', en: "Come on, let's step outside and chill for a bit." },
  { de: 'Nee, jetzt trink wa erstmal nen Tee.', en: "Nah, first let's have a cup of tea." },
  { de: 'Mach ma langsam jez.', en: 'Easy now. Slow down a bit.' },
  { de: 'Steh mal kurz auf. Genau jetzt.', en: 'Stand up for a second. Right now.' },
  { de: 'Komm, wir holen dir jetzt ein Glas Wasser.', en: "Come on, let's get you a glass of water." },
  { de: 'Fenster auf. Einmal durchatmen. Los.', en: 'Window open. One deep breath. Go.' },
  { de: 'Schuhe an, wir gehen ne Runde um den Block. Nicht denken.', en: "Shoes on, we're walking around the block. No thinking." },
  { de: 'Setz dich mal hin. Ich bleib bei dir.', en: "Sit down for a moment. I'm staying with you." },
  { de: 'Hände waschen, schön warm. Komm.', en: 'Wash your hands, nice and warm. Come on.' },
  { de: 'Wir essen jetzt was Kleines. Irgendwas. Komm.', en: "We're eating something small now. Anything. Come on." },
  { de: 'Leg das Handy mal weg. Fünf Minuten.', en: 'Put the phone down. Five minutes.' },
  { de: 'Augen zu. Zehn Atemzüge. Ich bin dabei.', en: "Eyes closed. Ten breaths. I'm here." },
  { de: 'Komm, wir legen uns kurz hin. Zehn Minuten, mehr nicht.', en: "Come on, let's lie down for a bit. Ten minutes, no more." },
  { de: 'Schultern hoch … und fallen lassen. Nochmal.', en: 'Shoulders up … and drop. Again.' },
  { de: 'Ab unter die warme Dusche. Komm.', en: 'Off to the warm shower. Come on.' },
  { de: 'Raus an die Luft. Zwei Minuten reichen.', en: 'Out into the fresh air. Two minutes are enough.' },
  { de: 'Wir räumen jetzt nur EINE Sache weg. Die da. Nimm sie.', en: "We're putting away just ONE thing. That one. Pick it up." },
  { de: 'Mach dir jetzt was Warmes zu trinken.', en: 'Make yourself something warm to drink now.' },
  { de: 'Jetzt wird nichts entschieden. Jetzt wird nur kurz gesessen.', en: 'Nothing gets decided now. We just sit for a moment.' },
  { de: 'Dreh Musik auf, die du magst. Ein Lied.', en: 'Put on music you like. One song.' },
  { de: 'Pause. Wir hören jetzt auf mit dem Kopf.', en: "Pause. We're done with the head for now." },
  { de: 'Jacke an, wir gucken mal, wie der Himmel heute aussieht.', en: "Jacket on, let's see what the sky looks like today." },
  { de: 'Du musst gerade nichts schaffen. Komm einfach mit aufs Sofa.', en: "You don't have to achieve anything right now. Just come to the sofa." },
  { de: 'Barfuß auf den Boden. Spür ihn. Sofort.', en: 'Bare feet on the floor. Feel it. Right now.' },
  { de: 'Einmal richtig durchstrecken. Arme hoch!', en: 'One proper stretch. Arms up!' },
  { de: 'Iss noch was Kleines. Ich glaub, dein Körper wartet schon.', en: 'Eat something small. I think your body has been waiting.' },
  { de: 'Schreib jemandem nur ein Herz. Mehr nicht. Komm.', en: 'Send someone just a heart. Nothing more. Come on.' },
  { de: 'Kuscheldecke. Hol sie. Jetzt.', en: 'Blanket. Go get it. Now.' },
  { de: 'Wir machen jetzt Pause. Ausnahmslos.', en: "We're taking a break now. No exceptions." },
  { de: 'Trink was. Jetzt. Ich bin dabei.', en: "Drink something. Now. I'm with you." },
  { de: 'Komm ans Fenster, wir gucken fünf Dinge an.', en: "Come to the window, we're looking at five things." },
  { de: 'Lass es jetzt liegen. Komm weg vom Bildschirm.', en: 'Leave it. Step away from the screen.' },
  { de: 'Stell dir einen Timer auf fünf Minuten und tu: nichts. Los.', en: 'Set a timer for five minutes and do: nothing. Go.' },
  { de: 'Atme aus. Länger als ein. Nochmal.', en: 'Breathe out. Longer than in. Again.' },
  { de: 'Wasch dir das Gesicht. Lauwarm. Komm.', en: 'Wash your face. Lukewarm. Come on.' },
  { de: 'Mach das Licht ein bisschen weicher. Wir machen es uns gemütlich.', en: "Soften the light a little. Let's make it cosy." },
  { de: 'Ab ins Bad, Zähne putzen. Das schaffen wir zusammen.', en: "Off to the bathroom, brush your teeth. We'll do it together." },
  { de: 'Komm, wir gehen kurz raus und gucken Bäume an.', en: "Come on, let's go out and look at trees for a bit." },
  {
    de: 'Dringende Durchsage von deinem Körper: Deine Tastatur und dein Putzlappen vermissen dich nicht, wenn du jetzt mal kurz weg bist. Geh in die Küche. Koch Wasser. Mach Tee. Und wehe, du machst in der Wartezeit den Abwasch! Du starrst jetzt einfach diesem bescheuerten Wasserkocher beim Blubbern zu. Deal?',
    en: "Urgent announcement from your body: your keyboard and your cleaning cloth will not miss you if you step away for a moment. Go to the kitchen. Boil water. Make tea. And don't you dare do the dishes while you wait! You just stare at that ridiculous kettle bubbling. Deal?",
    doing: { de: 'Tee kochen und dem Wasserkocher beim Blubbern zusehen', en: 'make tea and watch the kettle bubble' },
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

### Freiheit
Es ist eine Einladung, keine Anweisung und kein Test. „Das geht gerade nicht“ ist immer eine gültige Antwort. Wo du eigene Ressourcen angelegt hast, nimmt er sie auf – dann klingt es so, als würde jemand sagen: „Komm, du hast doch …“`,
    en: `### What it is for
Under stress, in dissociation or when exhausted, the ability to **start by yourself** (task initiation, an executive function) is often exactly what is gone. The problem is not knowing – you know tea or fresh air would help – but the first step. Even making a choice costs too much.

### What the interrupter does
A trusted person in such a moment does not ask "What would do you good right now?" but says: "Come on, let's go outside and have a tea." They take over the starting. That is exactly what this does: a direct, loving invitation **without a choice**. It breaks the stuckness, and all you have to do is come along.

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

Das ist ein kleiner Alltagshelfer, kein Ersatz für Hilfe in einer akuten Krise – dafür ist der Krisenmodus da.`,
    en: `### A crack in the wall of functioning
Whoever functions for a long time – mask, constant tension, autopilot – often only notices the wall when it is already very thick. Then any big change is too much.

### How it helps
For **just 10 seconds** you do something completely different: shake, clap, stomp, hum, say nonsense. A small pattern interruption like that brings you back to the here and now through body, voice and surprise – out of rumination, freeze or autopilot. You do not have to process, understand or solve anything.

### Why so short
10 seconds is so little that no resistance builds up. And afterwards you may **go on functioning right away** – nothing stays open, nothing is expected of you. Often it turns into a moment of more contact with yourself all by itself.

This is a small everyday helper, not a replacement for help in an acute crisis – that is what the crisis mode is for.`,
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
Du kannst es jederzeit in den Einstellungen unter „Mein Wesen“ ausschalten.`,
    en: `### What it is for
With dissociation, stress or exhaustion, knowing what you have and what helps you is often not retrievable – not because it is gone, but because **retrieval** is blocked. You can use what you see more easily than what you would have to remember.

### What the companion does
Spread over the day it puts one of your own resources in your way: "Hey, by the way, you have …". You do not have to search, decide or remember. If it does not fit right now, tap "Not now" – then it only comes back later.

### You decide
You can switch it off at any time in the settings under "My companion".`,
  },
};
