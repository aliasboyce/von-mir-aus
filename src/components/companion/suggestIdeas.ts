import type { Bi } from './wesenFunctions';

/**
 * „Schlag mir was vor“: sanfte Anstöße aus allen Funktionen der App. Jeder Anstoß ist eine Einladung (kein Auftrag)
 * und führt mit „Direkt tun“ genau dorthin, wo man es tun kann. Texte im Du, ohne Druck („du könntest“, „magst du“, „vielleicht“).
 */
export interface SuggestIdea extends Bi {
  /** Ziel in der App */
  to: string;
  /** Bereich, nur zur Übersicht beim Pflegen */
  area: string;
  /** Statt eines einzelnen „Direkt tun“: mehrere Orte zur Wahl */
  choices?: { de: string; en: string; to: string }[];
}

const i = (area: string, to: string, de: string, en: string): SuggestIdea => ({ area, to, de, en });

export const SUGGEST_IDEAS: SuggestIdea[] = [
  // ---- Gedanken-Reset (Brain Dump): drei Orte zur Wahl
  {
    area: 'gedanken',
    to: '/parkbox',
    de: 'Mach einen Gedanken-Reset.\n\nEine der wirksamsten Möglichkeiten, mentale Unordnung loszuwerden, ist, Gedanken aus dem Kopf aufs Papier zu bringen. Schreib einfach alles auf, was dir gerade durch den Kopf geht: Unerledigtes, Sorgen, spontane Ideen und alles andere, was dich beschäftigt. Diese Methode heißt auch „Brain Dump“. Indem du Gedanken aus dem Arbeitsgedächtnis auslagerst, entlastest du deinen Kopf – und es fällt dir leichter, sie zu sortieren und weiterzuverarbeiten.\n\nWohin magst du sie legen?',
    en: 'Do a thought reset.\n\nOne of the most effective ways to clear mental clutter is to get your thoughts out of your head and onto paper. Just write down everything that is going through your mind: unfinished things, worries, spontaneous ideas and anything else that is on your mind. This method is also called a “brain dump”. By moving thoughts out of your working memory you relieve your head – and it becomes easier to sort and process them.\n\nWhere would you like to put them?',
    choices: [
      { de: 'In die Parkbox', en: 'Into the park box', to: '/parkbox' },
      { de: 'Ins Tagebuch', en: 'Into the diary', to: '/sicherheit/tagebuch' },
      { de: 'Als Mindmap', en: 'As a mind map', to: '/entdecken/mindmap' },
    ],
  },
  // ---- Tagebuch
  i('tagebuch', '/sicherheit/tagebuch', 'Du könntest ein neues Tagebuch anlegen – ganz leer, ganz nach deinem Tempo.', 'You could start a new diary – completely empty, at your own pace.'),
  i('tagebuch', '/sicherheit/tagebuch', 'Magst du ein paar Zeilen ins Tagebuch schreiben? Es liest niemand mit.', 'Would you like to write a few lines in your diary? Nobody is reading along.'),
  i('tagebuch', '/sicherheit/tagebuch', 'Vielleicht magst du aufschreiben, was heute ein kleines bisschen gut war – auch wenn es winzig ist.', 'Maybe you would like to write down what was a tiny bit good today – even if it is very small.'),
  i('tagebuch', '/sicherheit/tagebuch', 'Du könntest dem Tagebuch einen Gedanken anvertrauen, der gerade viel Platz im Kopf braucht.', 'You could hand your diary a thought that is taking up a lot of room in your head.'),
  i('tagebuch', '/sicherheit/tagebuch', 'Wie wäre es mit nur einem Wort im Tagebuch? Mehr muss nicht sein.', 'How about just one word in your diary? It does not have to be more.'),
  // ---- Briefe
  i('brief', '/entdecken/brief-an-mich', 'Vielleicht magst du einen Brief schreiben – an dich selbst, für später.', 'Maybe you would like to write a letter – to yourself, for later.'),
  i('brief', '/entdecken/brief-an-mich', 'Du könntest dir einen Brief schreiben, so wie ein guter Freund ihn schreiben würde.', 'You could write yourself a letter the way a good friend would.'),
  i('brief', '/entdecken/brief-an-mich', 'Magst du deinem früheren Ich etwas sagen? Oder deinem zukünftigen?', 'Would you like to tell your earlier self something? Or your future self?'),
  // ---- Inneres Wetter, Tag, Rückblick
  i('wetter', '/inneres-wetter', 'Magst du kurz schauen, wie dein inneres Wetter gerade ist? Ein Wort oder ein Bild reicht.', 'Would you like to check what your inner weather is right now? One word or picture is enough.'),
  i('wetter', '/inneres-wetter', 'Du könntest ganz klein einchecken: Wo steht dein Wetter gerade – und darf es so sein?', 'You could check in very small: where is your weather right now – and may it be like that?'),
  i('tag', '/tag-beginnen', 'Magst du den Tag ganz sanft beginnen? Es gibt dafür eine kleine Hilfe.', 'Would you like to begin the day very gently? There is a small helper for that.'),
  i('tag', '/tag-abschliessen', 'Vielleicht magst du den Tag für dich abschließen – nur kurz, nur freundlich.', 'Maybe you would like to close the day for yourself – just briefly, just kindly.'),
  i('tag', '/entdecken/tageskurve', 'Du könntest dir deine Tageskurve anschauen. Nicht bewerten, nur ansehen.', 'You could look at your day curve. Not judging, just looking.'),
  i('tag', '/wochenrueckblick', 'Magst du auf die Woche zurückschauen? Wohlwollend – was war trotzdem da?', 'Would you like to look back on the week? Kindly – what was there anyway?'),
  // ---- Ressourcen
  i('ressourcen', '/entdecken/ressourcen/hilfsmittel', 'Magst du deine Lieblingssongs in den Ressourcen abspeichern?', 'Would you like to save your favourite songs in your resources?'),
  i('ressourcen', '/entdecken/ressourcen/hilfsmittel', 'Du könntest eine kleine Playlist für schwere Tage anlegen und als Ressource speichern.', 'You could put together a small playlist for hard days and save it as a resource.'),
  i('ressourcen', '/entdecken/ressourcen/hilfsmittel', 'Gibt es ein Buch, einen Film oder ein Lied, das dir schon einmal gutgetan hat? Dann merk es dir hier.', 'Is there a book, film or song that has done you good before? Keep it here.'),
  i('ressourcen', '/entdecken/ressourcen/hilfsmittel', 'Vielleicht magst du etwas Gemütliches als Ressource eintragen: eine Decke, einen Tee, einen Pulli.', 'Maybe you would like to add something cosy as a resource: a blanket, a tea, a jumper.'),
  i('ressourcen', '/entdecken/ressourcen/orte', 'Magst du einen Ort speichern, an dem du dich wohlfühlst – echt oder erfunden?', 'Would you like to save a place where you feel good – real or imagined?'),
  i('ressourcen', '/entdecken/ressourcen/aktivitaeten', 'Du könntest eine Beschäftigung eintragen, bei der du die Zeit vergisst.', 'You could add an activity in which you forget the time.'),
  i('ressourcen', '/entdecken/ressourcen/aktivitaeten', 'Magst du eine kleine Aktivität für müde Tage sammeln – etwas, das ganz wenig Kraft braucht?', 'Would you like to collect a small activity for tired days – something that takes very little energy?'),
  i('ressourcen', '/entdecken/ressourcen', 'Du könntest in den Ressourcen stöbern. Vielleicht springt dir etwas ins Auge.', 'You could browse your resources. Maybe something catches your eye.'),
  i('ressourcen', '/entdecken/ressourcen/hilfsmittel', 'Vielleicht magst du ein Foto von etwas Schönem als Ressource ablegen.', 'Maybe you would like to put a photo of something lovely in as a resource.'),
  // ---- Skills
  i('skills', '/entdecken/ressourcen/skills', 'Du könntest in den Skills stöbern und einen aussuchen, der sich leicht anhört.', 'You could browse the skills and pick one that sounds easy.'),
  i('skills', '/entdecken/atmen', 'Magst du ein paar Atemzüge nehmen? Es gibt Muster zum Mitatmen.', 'Would you like to take a few breaths? There are patterns to breathe along with.'),
  i('skills', '/entdecken/ressourcen/skillketten/neu', 'Du könntest eine Skillkette zusammenstellen – eine kleine Reihenfolge für schwierige Momente.', 'You could put together a skill chain – a small sequence for difficult moments.'),
  i('skills', '/entdecken/ressourcen/skillketten', 'Magst du eine deiner Skillketten ansehen? Vielleicht passt eine gerade.', 'Would you like to look at one of your skill chains? Maybe one fits right now.'),
  // ---- Brücken
  i('bruecken', '/bruecken', 'Du könntest eine neue Brücke bauen: ein kleiner Weg zu etwas, das dir wichtig ist.', 'You could build a new bridge: a small path to something that matters to you.'),
  i('bruecken', '/bruecken', 'Magst du schauen, welche Stufe einer Brücke heute geht? Die kleinste zählt genauso.', 'Would you like to see which step of a bridge works today? The smallest counts just as much.'),
  // ---- Sicherheit
  i('plan', '/sicherheit/plan', 'Du könntest in deinen Sicherheitsplan schauen: Stimmt noch alles so?', 'You could look at your safety plan: does everything still fit?'),
  i('plan', '/sicherheit/plan', 'Magst du bei deinem Sicherheitsplan ein Warnsignal ergänzen, das du bei dir kennst?', 'Would you like to add a warning sign you know about yourself to your safety plan?'),
  i('plan', '/sicherheit/plan', 'Vielleicht magst du deinen Notfallrucksack packen oder ansehen – dann ist er da, wenn du ihn brauchst.', 'Maybe you would like to pack or look at your emergency backpack – then it is there when you need it.'),
  i('netz', '/sicherheit/netzwerk', 'Du könntest dein Netzwerk ansehen: Wer oder was trägt dich gerade?', 'You could look at your network: who or what is carrying you right now?'),
  i('netz', '/sicherheit/netzwerk', 'Magst du jemanden oder etwas in dein Netzwerk eintragen, das dir guttut – ein Mensch, ein Tier, ein Ort?', 'Would you like to add someone or something that does you good to your network – a person, an animal, a place?'),
  i('netz', '/sicherheit/kontakte', 'Du könntest eine Telefonnummer eintragen, die du im Ernstfall schnell finden willst.', 'You could enter a phone number you want to find quickly when it matters.'),
  i('krise', '/krisenmodus', 'Magst du dir den Krisenmodus einmal in Ruhe ansehen – für den Fall, dass du ihn mal brauchst?', 'Would you like to look at crisis mode once in peace – in case you ever need it?'),
  // ---- Verstehen
  i('verstehen', '/entdecken/nervensystem', 'Magst du etwas über dein Nervensystem lesen? Es erklärt vieles freundlicher, als man denkt.', 'Would you like to read something about your nervous system? It explains a lot more kindly than you might think.'),
  i('verstehen', '/entdecken/koerper', 'Du könntest kurz in den Körper spüren: Wo ist gerade etwas – und wie fühlt es sich an?', 'You could feel into your body for a moment: where is something right now – and how does it feel?'),
  i('verstehen', '/entdecken/schutzstrategien', 'Vielleicht magst du nachlesen, welche Schutzstrategien es gibt – und welche du von dir kennst.', 'Maybe you would like to read about protection strategies – and which ones you know in yourself.'),
  i('verstehen', '/entdecken/denkmaschine', 'Du könntest deine Gedanken in die Denkmaschine geben – manchmal sortiert sich dann etwas.', 'You could feed your thoughts into the thinking machine – sometimes something sorts itself out.'),
  i('verstehen', '/entdecken/gefuehle', 'Magst du im Gefühlsrad schauen, wie man das nennen könnte, was du gerade spürst?', 'Would you like to look in the feelings wheel for a name for what you feel right now?'),
  i('verstehen', '/entdecken/wertekompass', 'Du könntest dich fragen: Was ist mir gerade wichtig? Der Wertekompass hilft beim Hinsehen.', 'You could ask yourself: what matters to me right now? The values compass helps you look.'),
  i('verstehen', '/entdecken/beduerfnis-kompass', 'Magst du im Bedürfnis-Kompass nachsehen, was dir gerade fehlen könnte?', 'Would you like to look in the needs compass for what you might be missing right now?'),
  i('verstehen', '/entdecken/zugangskanaele', 'Du könntest nachsehen, über welche Zugangskanäle du gerade am leichtesten erreichbar bist.', 'You could look at which access channels reach you most easily right now.'),
  i('verstehen', '/zugang', 'Magst du dich vom Zugang fragen lassen, was du gerade brauchst? „Ich weiß nicht“ ist erlaubt.', 'Would you like the access guide to ask what you need right now? “I don’t know” is allowed.'),
  i('verstehen', '/entdecken/loslassen', 'Du könntest eine Sorge ablegen und loslassen – nur für diesen Moment.', 'You could put a worry down and let go – just for this moment.'),
  i('verstehen', '/parkbox', 'Magst du einen Gedanken in die Parkbox legen? Er läuft dir nicht weg.', 'Would you like to park a thought in the park box? It will not run away.'),
  // ---- Alltag
  i('routinen', '/entdecken/routinen', 'Du könntest eine winzige Routine anlegen – so klein, dass sie fast lächerlich ist.', 'You could create a tiny routine – so small it is almost silly.'),
  i('routinen', '/entdecken/routinen', 'Magst du eine deiner Routinen anschauen und sie noch ein Stück kleiner machen?', 'Would you like to look at one of your routines and make it a little smaller still?'),
  i('kalender', '/kalender', 'Du könntest dir etwas Schönes in den Kalender eintragen – ein Termin mit dir selbst.', 'You could put something nice in your calendar – an appointment with yourself.'),
  i('kalender', '/kalender', 'Magst du einen Moment zum Ausruhen fest einplanen?', 'Would you like to plan a moment to rest?'),
  i('timer', '/entdecken/timer', 'Du könntest einen Timer auf nur fünf Minuten stellen – für irgendetwas, das du gerade vor dir herschiebst.', 'You could set a timer for just five minutes – for something you are putting off.'),
  i('listen', '/listen', 'Magst du eine Liste anlegen: Dinge, die dir guttun, oder einfach, was du später nicht vergessen willst?', 'Would you like to make a list: things that do you good, or simply what you do not want to forget later?'),
  i('mindmap', '/entdecken/mindmap', 'Du könntest eine Mindmap anfangen und alles hinschreiben, was gerade durcheinander ist.', 'You could start a mind map and write down everything that is jumbled right now.'),
  i('budget', '/budget', 'Magst du einen ganz kleinen Blick aufs Budget werfen – oder nur eine einzige Rechnung eintragen?', 'Would you like to take a very small look at your budget – or just enter a single bill?'),
  i('projekte', '/entdecken/projekte', 'Du könntest ein Projekt anlegen und nur den allerersten, kleinsten Schritt notieren.', 'You could start a project and write down only the very first, smallest step.'),
  i('medi', '/entdecken/medi-log', 'Magst du in dein Medikamenten-Log schauen oder etwas nachtragen?', 'Would you like to look at your medication log or add something?'),
  i('garten', '/entdecken/garten', 'Du könntest nach deinem Garten schauen – was ist dort inzwischen gewachsen?', 'You could check on your garden – what has grown there in the meantime?'),
  i('lesezeichen', '/entdecken/lesezeichen', 'Hast du einen Link, der dir gutgetan hat? Du könntest ihn als Lesezeichen speichern.', 'Do you have a link that did you good? You could save it as a bookmark.'),
  i('favoriten', '/favoriten', 'Magst du deine Favoriten ansehen? Vielleicht erinnert dich etwas daran, was dir schon geholfen hat.', 'Would you like to look at your favourites? Maybe something reminds you of what has helped before.'),
  i('glossar', '/entdecken/glossar', 'Du könntest im Wörterbuch ein Wort nachschlagen, das dir neulich begegnet ist.', 'You could look up a word in the glossary that you came across recently.'),
  i('quellen', '/quellen', 'Magst du nachsehen, woher die Inhalte der App kommen? Vielleicht findest du etwas Lesenswertes.', 'Would you like to see where the app’s content comes from? Maybe you will find something worth reading.'),
  i('helfer', '/helfermodus', 'Wenn du gerade jemanden unterstützt: Im Helfermodus findest du Anregungen für dich und die andere Person.', 'If you are supporting someone right now: helper mode has ideas for you and the other person.'),
  // ---- Gestalten & Einstellungen
  i('design', '/einstellungen?bereich=design', 'Du könntest eine andere Welt ausprobieren: Märchenwald, Lagerfeuer, Unterwasser, Cozy Corner …', 'You could try another world: fairytale forest, campfire, underwater, cosy corner …'),
  i('design', '/einstellungen?bereich=design', 'Magst du die Farben der App so einstellen, dass sie sich gerade gut anfühlen?', 'Would you like to set the app’s colours so that they feel good right now?'),
  i('design', '/einstellungen?bereich=design', 'Du könntest die Bewegung auf der Startseite ändern – Blätter, Sterne, Blüten oder gar nichts.', 'You could change the motion on the start page – leaves, stars, blossoms or nothing at all.'),
  i('wesen', '/einstellungen?bereich=wesen', 'Magst du mich anders aussehen lassen? Andere Farbe, anderes Wesen – ganz wie du möchtest.', 'Would you like me to look different? Another colour, another companion – whatever you like.'),
  i('erinnerungen', '/einstellungen?bereich=erinnerungen', 'Du könntest sanfte Erinnerungen einstellen – nur an das, wobei sie dir wirklich helfen.', 'You could set gentle reminders – only for what they truly help you with.'),
  i('suche', '/suche', 'Magst du etwas in der Suche nachschauen? Manchmal ist genau das da, was du gerade brauchst.', 'Would you like to look something up in the search? Sometimes exactly what you need is already there.'),
];

/** Textbausteine für Vorschläge, die deine eigenen Einträge aufgreifen. {x} wird durch den Titel ersetzt. */
export const SKILL_TEMPLATES: Bi[] = [
  { de: 'Du könntest deinen Skill „{x}“ ausprobieren – nur kurz, nur so weit es sich gut anfühlt.', en: 'You could try your skill “{x}” – just briefly, just as far as it feels good.' },
  { de: 'Vielleicht tut dir gerade „{x}“ gut. Das ist einer deiner Skills.', en: 'Maybe “{x}” would do you good right now. It is one of your skills.' },
  { de: 'Magst du „{x}“ einmal ausprobieren, falls es sich gerade leicht anfühlt?', en: 'Would you like to try “{x}” if it feels easy right now?' },
];
export const RESOURCE_TEMPLATES: Bi[] = [
  { de: 'Du könntest deine Ressource „{x}“ nutzen.', en: 'You could use your resource “{x}”.' },
  { de: 'Magst du dir „{x}“ gönnen? Das steht bei deinen Ressourcen.', en: 'Would you like to treat yourself to “{x}”? It is among your resources.' },
  { de: 'Vielleicht erinnerst du dich an „{x}“ – das hat dir schon einmal etwas bedeutet.', en: 'Maybe you remember “{x}” – it has meant something to you before.' },
];
export const BRIDGE_TEMPLATES: Bi[] = [
  { de: 'Du könntest eine kleine Stufe deiner Brücke „{x}“ gehen.', en: 'You could take a small step on your bridge “{x}”.' },
  { de: 'Magst du schauen, was bei deiner Brücke „{x}“ heute geht?', en: 'Would you like to see what works today on your bridge “{x}”?' },
];
export const CONTACT_TEMPLATES: Bi[] = [
  { de: 'Magst du „{x}“ kurz Hallo sagen – oder einfach an sie oder ihn denken?', en: 'Would you like to say a quick hello to “{x}” – or simply think of them?' },
  { de: 'Vielleicht tut es gut, an „{x}“ zu denken. Es steht in deinem Netzwerk.', en: 'Maybe it feels good to think of “{x}”. It is in your network.' },
];
export const ROUTINE_TEMPLATES: Bi[] = [
  { de: 'Du könntest deine Routine „{x}“ heute nur ganz klein machen – den ersten Schritt reicht.', en: 'You could do your routine “{x}” very small today – the first step is enough.' },
];

/** Zusätzliche Bausteine für Dinge, die du selbst neu angelegt hast – die kommen öfter vor. */
export const NEW_SKILL_TEMPLATES: Bi[] = [
  { de: 'Du hast „{x}“ selbst angelegt. Magst du es einmal ausprobieren?', en: 'You created “{x}” yourself. Would you like to try it once?' },
  { de: 'Dein eigener Skill „{x}“ wartet auf dich – nur kurz, nur so weit es passt.', en: 'Your own skill “{x}” is waiting for you – just briefly, just as far as it fits.' },
];
export const NEW_RESOURCE_TEMPLATES: Bi[] = [
  { de: 'Du hast „{x}“ selbst eingetragen. Wie wäre es, dir das heute zu gönnen?', en: 'You added “{x}” yourself. How about treating yourself to it today?' },
  { de: 'Dein eigenes „{x}“ – magst du es dir gerade anschauen oder nutzen?', en: 'Your own “{x}” – would you like to look at it or use it right now?' },
];
export const NEW_BRIDGE_TEMPLATES: Bi[] = [
  { de: 'Deine selbst gebaute Brücke „{x}“ – magst du heute eine Stufe gehen?', en: 'Your own bridge “{x}” – would you like to take a step today?' },
];
export const NEW_CONTACT_TEMPLATES: Bi[] = [
  { de: 'Du hast „{x}“ in dein Netzwerk aufgenommen. Magst du kurz an sie oder ihn denken?', en: 'You added “{x}” to your network. Would you like to think of them for a moment?' },
];
export const NEW_ROUTINE_TEMPLATES: Bi[] = [
  { de: 'Deine eigene Routine „{x}“ – heute nur den ersten, kleinsten Schritt?', en: 'Your own routine “{x}” – just the first, smallest step today?' },
];
