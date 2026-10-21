/**
 * Priority 10 — additive detail for the eight Grundgefühle that already
 * live in zugangContent.ts's FEELING_GROUPS (not a second, separately
 * maintained feelings list). Every claim is phrased as "kann damit
 * zusammenhängen" rather than an absolute statement, per the brief —
 * this is a loosely GFK/NVC-informed lens on feelings and needs, not a
 * diagnostic or universally true mapping.
 */
export interface FeelingDetail {
  meaning: string;
  meaningEn: string;
  typicalThoughts: string[];
  typicalThoughtsEn: string[];
  bodySensations: string[];
  bodySensationsEn: string[];
  /** ids into NEED_CATEGORY_GROUPS — a loose, non-exhaustive pointer,
   * not a rule ("this feeling always means that need"). */
  possibleNeeds: string[];
}

export const FEELING_DETAILS: Record<string, FeelingDetail> = {
  angst: {
    meaning: 'Kann damit zusammenhängen, dass etwas Wichtiges als bedroht oder ungewiss erlebt wird — oft ein Hinweis auf ein Bedürfnis nach Sicherheit oder Orientierung.',
    meaningEn: 'Can relate to something important feeling threatened or uncertain — often a sign of a need for safety or orientation.',
    typicalThoughts: ['Was, wenn etwas Schlimmes passiert?', 'Ich bin nicht sicher.', 'Ich habe keine Kontrolle darüber.', 'Es wird schief gehen.', 'Ich werde versagen.'],
    typicalThoughtsEn: ['What if something bad happens?', "I'm not safe.", "I don't have control over this.", 'It will go wrong.', "I'm going to fail."],
    bodySensations: ['schneller Herzschlag', 'flache Atmung', 'Anspannung', 'innere Unruhe'],
    bodySensationsEn: ['racing heart', 'shallow breathing', 'tension', 'inner restlessness'],
    possibleNeeds: ['sicherheit'],
  },  traurigkeit: {
    meaning: 'Kann damit zusammenhängen, dass etwas verloren gegangen ist oder fehlt — ein Mensch, eine Möglichkeit, ein früherer Zustand.',
    meaningEn: 'Can relate to something lost or missing — a person, a possibility, a former state of things.',
    typicalThoughts: ['Ich vermisse etwas.', 'Es ist nicht mehr, wie es war.', 'Ich fühle mich allein damit.', 'Ich bekomme das Verlorene nie wieder.'],
    typicalThoughtsEn: ["I miss something.", "It's not the way it used to be.", 'I feel alone with this.', "I'll never get back what I lost."],
    bodySensations: ['Schwere im Brustkorb', 'Kloß im Hals', 'Energielosigkeit', 'Tränen'],
    bodySensationsEn: ['heaviness in the chest', 'lump in the throat', 'lack of energy', 'tears'],
    possibleNeeds: ['alle'],
  },
  wut: {
    meaning: 'Kann damit zusammenhängen, dass eine Grenze überschritten wurde oder ein wichtiges Bedürfnis gerade übergangen wird.',
    meaningEn: "Can relate to a boundary being crossed or an important need currently being overridden.",
    typicalThoughts: ['Das ist nicht fair.', 'Das hätte nicht passieren dürfen.', 'Ich will, dass sich etwas ändert.', 'Das ist / war falsch.', 'Das darf man nicht.'],
    typicalThoughtsEn: ["That's not fair.", "That shouldn't have happened.", 'I want something to change.', 'This is / was wrong.', "You're not allowed to do that."],
    bodySensations: ['Hitze', 'Anspannung in Kiefer oder Fäusten', 'erhöhter Puls', 'Energie, die raus will'],
    bodySensationsEn: ['heat', 'tension in jaw or fists', 'elevated pulse', 'energy wanting to move'],
    possibleNeeds: ['autonomie', 'alle'],
  },
  scham: {
    meaning: 'Kann damit zusammenhängen, sich als ganze Person infrage gestellt zu fühlen — anders als Schuld, die sich eher auf eine konkrete Handlung bezieht.',
    meaningEn: 'Can relate to feeling like your whole self is called into question — unlike guilt, which tends to relate to a specific action.',
    typicalThoughts: ['Mit mir stimmt etwas nicht.', 'Andere dürfen das nicht sehen.', 'Ich bin zu viel oder nicht genug.', 'Ich bin falsch.', 'Ich bin nicht in Ordnung.'],
    typicalThoughtsEn: ["Something is wrong with me.", "Others mustn't see this.", "I'm too much or not enough.", "I am wrong.", "I am not okay."],
    bodySensations: ['Erröten', 'Wunsch, sich klein zu machen', 'Blick abwenden wollen', 'Enge'],
    bodySensationsEn: ['blushing', 'wanting to shrink', 'wanting to look away', 'tightness'],
    possibleNeeds: ['verbindung'],
  },
  schuld: {
    meaning: 'Kann damit zusammenhängen, dass eigenes Handeln im Widerspruch zu den eigenen Werten steht oder jemandem geschadet hat.',
    meaningEn: "Can relate to your own actions conflicting with your own values, or having harmed someone.",
    typicalThoughts: ['Ich hätte anders handeln sollen.', 'Ich habe jemandem geschadet.', 'Ich muss das wiedergutmachen.', 'Ich habe etwas falsch gemacht.', 'Das liegt an mir.'],
    typicalThoughtsEn: ['I should have acted differently.', 'I hurt someone.', 'I need to make this right.', 'I did something wrong.', "It's because of me."],
    bodySensations: ['Unruhe', 'Druck im Magen', 'Anspannung'],
    bodySensationsEn: ['restlessness', 'pressure in the stomach', 'tension'],
    possibleNeeds: ['verbindung'],
  },
  freude: {
    meaning: 'Kann damit zusammenhängen, dass ein Bedürfnis gerade erfüllt ist oder etwas Bedeutsames erlebt wird.',
    meaningEn: 'Can relate to a need currently being met, or something meaningful being experienced.',
    typicalThoughts: ['Das tut gut.', 'Ich bin dankbar dafür.', 'Das ist gerade genau richtig.', 'Das ist so schön.', 'Das ist genau, was ich brauche.'],
    typicalThoughtsEn: ['This feels good.', "I'm grateful for this.", 'This is just right, right now.', 'This is so nice.', "This is exactly what I need."],
    bodySensations: ['Leichtigkeit', 'Wärme', 'Energie', 'ein Lächeln'],
    bodySensationsEn: ['lightness', 'warmth', 'energy', 'a smile'],
    possibleNeeds: ['alle'],
  },
  ruhe: {
    meaning: 'Kann damit zusammenhängen, dass sich das Nervensystem gerade sicher genug fühlt, um sich zu entspannen.',
    meaningEn: 'Can relate to the nervous system currently feeling safe enough to relax.',
    typicalThoughts: ['Ich bin okay, so wie es gerade ist.', 'Ich muss gerade nichts tun.', 'Es ist genug.'],
    typicalThoughtsEn: ["I'm okay, just as things are.", "I don't have to do anything right now.", "It's enough."],
    bodySensations: ['entspannte Muskeln', 'ruhiger Atem', 'warme, schwere Glieder'],
    bodySensationsEn: ['relaxed muscles', 'calm breathing', 'warm, heavy limbs'],
    possibleNeeds: ['entspannung', 'sicherheit'],
  },
  leere: {
    meaning: 'Kann damit zusammenhängen, dass das System gerade reduziert oder heruntergefahren hat — oft eine Schutzreaktion, wenn zuvor zu viel gleichzeitig da war.',
    meaningEn: 'Can relate to the system currently being reduced or shut down — often a protective response after too much was present at once.',
    typicalThoughts: ['Ich spüre nichts.', 'Ich bin weit weg von mir.', 'Nichts fühlt sich gerade wichtig an.'],
    typicalThoughtsEn: ["I don't feel anything.", 'I feel far away from myself.', "Nothing feels important right now."],
    bodySensations: ['Taubheit', 'wie hinter Glas', 'wenig Energie', 'schwer zu spüren'],
    bodySensationsEn: ['numbness', 'as if behind glass', 'low energy', 'hard to feel anything'],
    possibleNeeds: ['sicherheit', 'entspannung'],
  },
  hoffnungslosigkeit: {
    meaning: 'Kann damit zusammenhängen, dass ein Zustand als dauerhaft und unveränderbar erlebt wird — oft nach wiederholten Enttäuschungen oder erfolglosen Versuchen.',
    meaningEn: 'Can relate to a situation feeling permanent and unchangeable — often after repeated disappointments or unsuccessful attempts.',
    typicalThoughts: ['Man kann nichts tun.', 'Das lässt sich nicht ändern.', 'Das ist unmöglich.'],
    typicalThoughtsEn: ["There's nothing you can do.", "This can't be changed.", "This is impossible."],
    bodySensations: ['Schwere', 'wenig Antrieb', 'Rückzug', 'flacher Atem'],
    bodySensationsEn: ['heaviness', 'low drive', 'withdrawal', 'shallow breathing'],
    possibleNeeds: ['selbstwirksamkeit', 'alle'],
  },
  ohnmacht: {
    meaning: 'Kann damit zusammenhängen, dass eine Situation als nicht beeinflussbar erlebt wird, obwohl man etwas verändern möchte.',
    meaningEn: 'Can relate to a situation feeling impossible to influence, even though you want to change something.',
    typicalThoughts: ['Ich kann nichts tun.', 'Ich kann das nicht ändern.'],
    typicalThoughtsEn: ["I can't do anything.", "I can't change this."],
    bodySensations: ['Erstarrung', 'Schwäche in den Gliedern', 'Enge', 'Kraftlosigkeit'],
    bodySensationsEn: ['freezing up', 'weakness in the limbs', 'tightness', 'lack of strength'],
    possibleNeeds: ['selbstwirksamkeit', 'alle'],
  },
  frust: {
    meaning: 'Kann damit zusammenhängen, dass Anstrengung oder Mühe gerade nicht zum erhofften Ergebnis führt.',
    meaningEn: "Can relate to effort currently not leading to the hoped-for result.",
    typicalThoughts: ['Meine Mühe wird sinnlos sein.', 'Das bringt nichts.'],
    typicalThoughtsEn: ['My effort will be pointless.', "This isn't getting anywhere."],
    bodySensations: ['Anspannung', 'Erschöpfung', 'innere Unruhe'],
    bodySensationsEn: ['tension', 'exhaustion', 'inner restlessness'],
    possibleNeeds: ['selbstwirksamkeit', 'alle'],
  },
  unzufriedenheit: {
    meaning: 'Kann damit zusammenhängen, dass etwas gerade nicht so ist, wie man es sich wünscht oder erwartet hat.',
    meaningEn: "Can relate to something currently not being the way you wish or expected it to be.",
    typicalThoughts: ['Es ist nicht so, wie es sein soll.'],
    typicalThoughtsEn: ["It's not the way it should be."],
    bodySensations: ['leichte Anspannung', 'innere Unruhe', 'Gereiztheit'],
    bodySensationsEn: ['slight tension', 'inner restlessness', 'irritability'],
    possibleNeeds: ['alle'],
  },
  einsamkeit: {
    meaning: 'Kann damit zusammenhängen, dass Verbindung, Nähe oder Zugehörigkeit gerade fehlt.',
    meaningEn: 'Can relate to connection, closeness, or belonging currently being missing.',
    typicalThoughts: ['Keiner wird sich für mich interessieren.', 'Niemand wird für mich da sein.'],
    typicalThoughtsEn: ["No one will be interested in me.", "No one will be there for me."],
    bodySensations: ['Leere', 'Schwere', 'Kälte', 'Rückzug'],
    bodySensationsEn: ['emptiness', 'heaviness', 'coldness', 'withdrawal'],
    possibleNeeds: ['verbindung'],
  },
  gleichgueltigkeit: {
    meaning: 'Kann damit zusammenhängen, dass innerlich Abstand genommen wird — manchmal als Schutz vor zu viel Anspannung oder Enttäuschung.',
    meaningEn: 'Can relate to taking inner distance — sometimes as protection against too much tension or disappointment.',
    typicalThoughts: ['Das ist mir nicht wichtig.', 'Ich brauche das nicht.'],
    typicalThoughtsEn: ["This isn't important to me.", "I don't need that."],
    bodySensations: ['Distanzgefühl', 'wenig Energie', 'Leere', 'verminderte Aufmerksamkeit'],
    bodySensationsEn: ['feeling of distance', 'low energy', 'emptiness', 'reduced attention'],
    possibleNeeds: ['entwicklung'],
  },
};
