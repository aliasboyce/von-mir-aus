import type { Resource } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

const now = new Date().toISOString();
// Point 4 — each seed example now gets an image that's actually about
// its own theme (a book icon for a reading resource, a teacup for
// warmth), not an arbitrary photo from a random seed string.
const img = (name: string) => suggestImagesFor(name)[0];

export const DEMO_RESOURCES: Resource[] = [
  {
    id: 'res_waldspaziergang',
    title: 'Waldspaziergang',
    category: 'emotionsregulation',
    image: img('Waldspaziergang Natur Baum'),
    description: 'Der Geruch von feuchter Erde und Moos.',
    tags: ['natur', 'erdung'],
    favorite: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_klavier',
    title: 'Sanftes Piano',
    category: 'stresstoleranz',
    image: img('Sanftes Piano Musik'),
    description: 'Beruhigende Melodien zum Abschalten.',
    tags: ['musik', 'ruhe'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_atemzitat',
    title: 'Atem holen',
    category: 'achtsamkeit',
    image: img('Atem holen atmen'),
    description: 'Ein kurzer Hinweis, dass es reicht, einfach nur zu sein.',
    tags: ['zitat'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_waermequelle',
    title: 'Wärmequelle',
    category: 'stresstoleranz',
    image: img('Wärmequelle Tee Decke warm'),
    description: 'Eine warme Tasse Tee oder eine Decke.',
    tags: ['körper', 'wärme'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
];

/**
 * "Die 4 klassischen Basis-Module"-Auftrag — eight DBT skills, taken
 * from the person's own attached material, each saved once under the
 * module it actually belongs to. Two sensory-interrupt techniques
 * from the same source (strong smell/taste shock, rubber-band
 * snapping) are deliberately left out — too close to known self-harm
 * substitution patterns to store as standing content, regardless of
 * their legitimate clinical framing here. Added via
 * addMissingDbtSkills() in resourcesRepo.ts, not this array directly,
 * so existing installs gain them without losing anything they already
 * have — see that function's own comment for why.
 */
export const DBT_SKILL_RESOURCES: Resource[] = [
  {
    id: 'res_skill_tipp',
    title: 'TIPP-Skills',
    category: 'stresstoleranz',
    image: img('kaltes Wasser Gesicht Eis'),
    description:
      'Veränderung der Körperchemie, um bei sehr hoher Anspannung schnell herunterzukommen:\n\nTemperature: Das Gesicht kurz in kaltes Wasser tauchen oder ein Kühlpack in den Nacken legen — löst den Tauchreflex aus, der den Puls spürbar senkt.\n\nIntense Exercise: 50 Kniebeugen, sprinten oder Liegestütze bis zur Erschöpfung, um überschüssiges Adrenalin abzubauen.\n\nPaced Breathing: Tief in den Bauch einatmen (z. B. 4 Sekunden) und deutlich länger ausatmen (z. B. 7 Sekunden).\n\nPaired Muscle Relaxation: Muskelgruppen extrem fest anspannen und beim Ausatmen bewusst komplett lockerlassen.',
    tags: ['dbt', 'stresstoleranz', 'notfall'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_radikale_akzeptanz',
    title: 'Radikale Akzeptanz',
    category: 'stresstoleranz',
    image: img('Radikale Akzeptanz Ruhe'),
    description:
      'Eine Situation, die man absolut nicht ändern kann (z. B. einen verpassten Zug oder eine Trennung), im Geist vollkommen annehmen, statt dagegen anzukämpfen.\n\nDer Satz lautet: „Es ist jetzt genau so, wie es ist, auch wenn es mir nicht gefällt.“\n\nDas verhindert, dass aus Schmerz echtes Leiden wird.',
    tags: ['dbt', 'stresstoleranz'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_opposite_action',
    title: 'Entgegengesetztes Handeln (Opposite Action)',
    category: 'emotionsregulation',
    image: img('Opposite Action Handeln'),
    description:
      'Genau das Gegenteil von dem tun, was der emotionale Impuls verlangt.\n\nWenn die Depression/Traurigkeit sagt: „Bleib im Bett und zieh die Decke über den Kopf“ — bewusst aufstehen und unter Menschen gehen.\n\nWenn die Wut sagt: „Schrei die Person an“ — stattdessen leise sprechen und auf Abstand gehen.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_check_the_facts',
    title: 'Fakten-Check (Check the Facts)',
    category: 'emotionsregulation',
    image: img('Fakten Check Gedanken'),
    description:
      'Überprüfen, ob die Intensität der Emotion zur echten Situation passt.\n\nMan fragt sich: „Reagiere ich gerade auf die Realität oder auf meine Katastrophengedanken im Kopf?“',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_please',
    title: 'PLEASE-Skills',
    category: 'emotionsregulation',
    image: img('PLEASE Skills Selbstfürsorge'),
    description:
      'Die körperliche Basis stabil halten, um weniger anfällig für Gefühlschaos zu sein:\n\nPhysicaL illness — körperliche Beschwerden behandeln (Arztbesuche).\nEat — ausgewogen essen.\nAvoid mood-altering substances — Drogen/Alkohol meiden.\nSleep — ausreichend schlafen.\nExercise — sich täglich bewegen.',
    tags: ['dbt', 'emotionsregulation', 'alltag'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_54321',
    title: 'Die 5-4-3-2-1 Methode',
    category: 'stresstoleranz',
    image: img('5-4-3-2-1 Erdung Sinne'),
    description:
      'Um sich im Raum zu verankern, benennt man laut oder leise:\n\n5 Dinge, die man sieht.\n4 Dinge, die man spüren kann.\n3 Dinge, die man hört.\n2 Dinge, die man riecht.\n1 Sache, die man schmeckt.',
    tags: ['dbt', 'achtsamkeit', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_wahrnehmen_beschreiben',
    title: 'Wahrnehmen und Beschreiben im Alltag',
    category: 'achtsamkeit',
    image: img('Achtsamkeit Kaffee Alltag'),
    description:
      'Eine alltägliche Sache (z. B. Zähneputzen oder Kaffeetrinken) absolut fokussiert tun.\n\nWenn man Kaffee trinkt, spürt man nur die Wärme der Tasse, riecht das Aroma und schmeckt den Geschmack — ohne nebenbei aufs Handy zu schauen oder über morgen nachzudenken.',
    tags: ['dbt', 'achtsamkeit', 'alltag'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  // "Soforthilfen sollen nicht mehr als Bruecke, sondern als Skills
  // gespeichert sein"-Auftrag — all 15 exercises previously only
  // reachable as bridges (bridge_478_atmung etc., linked from
  // AROUSAL_BANDS[x].exercises as "Soforthilfe: X") converted to
  // skill resources, categorised by what kind of technique they
  // actually are: breathing/awareness practices under Innere
  // Achtsamkeit, body-based crisis/activation techniques under
  // Stresstoleranz — matching the zone they were originally offered
  // in (calm/focus zones vs. early-warning/hyper/hypoarousal zones).
  // Content (instructions + a short version of the scientific
  // grounding) kept faithful to the original bridge text. The bridges
  // themselves are archived, not deleted — see
  // archiveSoforthilfeBridges() in bridgesRepo.ts.
  {
    id: 'res_skill_478_atmung',
    title: '4-7-8 Atmung',
    category: 'stresstoleranz',
    image: img('Atem atmen Wind'),
    description:
      'Eine ruhige, verlängerte Ausatmung, um den Körper aus reiner Unter-Aktivierung sanft aufzuwecken — passend, wenn Herz und Atem ganz flach und langsam sind.\n\n4 Sekunden einatmen, 7 Sekunden halten (oder kürzer, falls unangenehm), 8 Sekunden ausatmen. 3–4 Mal wiederholen, im eigenen Tempo.\n\nNach Dr. Andrew Weil, basierend auf Pranayama. Die lange Ausatmung erhöht nachweislich die Herzratenvariabilität.',
    tags: ['atmung', 'ruhe'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_36_bauchatmung',
    title: '3-zu-6 Bauchatmung',
    category: 'stresstoleranz',
    image: img('Atem atmen Wind'),
    description:
      'Die Ausatemzeit exakt verdoppeln, um tief in die Regeneration zu finden — für die reine Ruhephase, nicht für den Arbeitsmodus.\n\nHände auf den Bauchnabel legen. 3 Sekunden tief in den Bauch einatmen, dann 6 Sekunden langsam und lautlos durch die Lippenbremse ausatmen. Mehrmals wiederholen.\n\nAus der klinischen Verhaltensmedizin: das exakte Verdoppeln der Ausatemzeit senkt nachweislich den Blutdruck.',
    tags: ['atmung', 'ruhe'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_gaehn_impuls',
    title: 'Sanfter Gähn-Impuls',
    category: 'stresstoleranz',
    image: img('Entspannung Ruhe Erholung'),
    description:
      'Ein künstlich ausgelöstes, echtes Gähnen bringt sanfte, entspannte Wachheit — ganz ohne Stresshormone.\n\nMund weit öffnen und so tun, als würde man herzhaft gähnen, bis ein echtes Gähnen getriggert wird. 2–3 Mal wiederholen, Schultern sinken lassen.\n\nKünstlich induziertes Gähnen stimuliert den Nervus Trigeminus und reguliert die Gehirntemperatur.',
    tags: ['körper', 'wachheit'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_grounding_54321',
    title: 'Kognitives Grounding',
    category: 'stresstoleranz',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description:
      'Die 5-4-3-2-1-Methode holt die Aufmerksamkeit aus dem Kreisen zurück in den gegenwärtigen Moment — der Klassiker für den Fokus-Sweetspot.\n\n5 Dinge sehen, 4 spüren, 3 hören, 2 riechen, 1 schmecken — der Reihe nach.\n\nAus MBSR nach Dr. Jon Kabat-Zinn: lenkt die Aktivität weg von der überaktiven Amygdala hin zum präfrontalen Kortex.',
    tags: ['achtsamkeit', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_peripheres_sehen',
    title: 'Peripheres Sehen',
    category: 'stresstoleranz',
    image: img('Augen Blick Orientierung'),
    description:
      'Vom Tunnelblick zum Weitwinkel — hält das Gehirn wach und aufmerksam, ohne die Alarmbereitschaft zu triggern.\n\nEinen Punkt geradeaus fixieren. Ohne die Augen zu bewegen, die Aufmerksamkeit bewusst zu den Seiten ausdehnen, bis die äußeren Ränder des Sichtfelds gleichzeitig wahrgenommen werden.\n\nNach Dr. Andrew Huberman: peripheres Sehen deaktiviert die sympathische Alarmbereitschaft.',
    tags: ['achtsamkeit', 'sinne'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_box_atmung',
    title: 'Box-Atmung (Taktisch)',
    category: 'stresstoleranz',
    image: img('Atem atmen Wind'),
    description:
      'Vier gleich lange Phasen balancieren das Nervensystem aus — für ruhige, laserfokussierte Handlungsbereitschaft.\n\n4 Sekunden einatmen – 4 Sekunden halten – 4 Sekunden ausatmen – 4 Sekunden leer abwarten. 2 Minuten wiederholen.\n\nAus dem Tactical Breathing Protocol der US Navy SEALs.',
    tags: ['atmung', 'fokus'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_voo_atem',
    title: 'Orientierung & Voo-Atem',
    category: 'stresstoleranz',
    image: img('Raum Orientierung Umschauen'),
    description:
      'Den Raum nach sicheren Dingen absuchen und mit einem tönenden Ausatmen emotionale Überflutung dämpfen.\n\nDen Blick langsam durch den Raum wandern lassen, 3 neutrale oder beruhigende Dinge finden. Dann tief einatmen und beim Ausatmen ein tiefes, tönendes „Vooo" erklingen lassen.\n\nNach Dr. Peter Levine (Somatic Experiencing): die Vibration dämpft emotionale Überflutung über den Vagusnerv.',
    tags: ['dbt', 'stresstoleranz', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_gewichtswahrnehmung',
    title: 'Gewichtswahrnehmung',
    category: 'stresstoleranz',
    image: img('Boden Erdung Halt'),
    description:
      'Propriozeptives Grounding — den eigenen Körper physisch spüren, statt im Gefühl zu verschwimmen.\n\nFersen bewusst und fest in den Boden drücken. Dann 30 Sekunden lang nur auf das Gewicht des Körpers auf der Sitzfläche konzentrieren.\n\nAus der MBCT: das Gehirn registriert physische Schwerkraft, was das Gefühl von Überflutet-Werden stoppt.',
    tags: ['dbt', 'stresstoleranz', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_auditives_verankern',
    title: 'Auditives Verankern',
    category: 'stresstoleranz',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description:
      'Dem leisesten Geräusch lauschen — ein Signal an dein Nervensystem, dass gerade kein akuter Angriff stattfindet.\n\nAugen schließen, das leiseste, am weitesten entfernte Geräusch in der Umgebung suchen. 30 Sekunden zuhören, ohne es zu bewerten.\n\nNach Dr. Stephen Porges (Polyvagal-Theorie): signalisiert dem Nervensystem „es findet kein akuter Angriff statt".',
    tags: ['dbt', 'stresstoleranz', 'erdung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_physio_seufzer',
    title: 'Physiologischer Seufzer',
    category: 'stresstoleranz',
    image: img('Atem atmen Wind'),
    description:
      'Zwei kurze Einatmer durch die Nase, dann lang und seufzend durch den Mund ausatmen — senkt den Puls in Echtzeit.\n\nDoppelt kurz durch die Nase einatmen, dann lang und hörbar durch den Mund ausatmen. 1–3 Mal wiederholen.\n\nNach Prof. Andrew Huberman und Dr. David Spiegel (Cell Reports Medicine, 2023) — die schnellste bekannte Methode, den Puls biochemisch zu senken.',
    tags: ['dbt', 'stresstoleranz', 'notfall'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_shaking',
    title: 'Shaking (Neurogenes Zittern)',
    category: 'stresstoleranz',
    image: img('Bewegung Energie Aktivierung'),
    description:
      'Bewusstes Ausschütteln entlädt überschüssige Stress-Energie mechanisch, damit das System nicht in den Shutdown stürzen muss.\n\nLocker hinstellen. Hände, Arme, Schultern und Beine ausschütteln, als würde man Wassertropfen abschütteln — etwa eine Minute lang.\n\nAus TRE nach Dr. David Berceli: Säugetiere zittern instinktiv, um im Sympathikus gefangene Spannung abzubauen.',
    tags: ['dbt', 'stresstoleranz', 'notfall'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_carotis_druck',
    title: 'Carotis-Sanftdruck',
    category: 'stresstoleranz',
    image: img('Hand Beruhigung Halt'),
    description:
      'Ein reflexartiger Bremsknopf für einen rasenden Puls — über die Drucksensoren am Hals.\n\nZwei Finger sanft an eine Seite des Halses legen, unterhalb des Kieferwinkels. Mit ganz leichtem, kreisendem Druck 10–15 Sekunden massieren. Niemals beide Seiten gleichzeitig.\n\nAus Kardiologie und Neurologie: die Barorezeptoren an der Halsschlagader lösen reflexartig die parasympathische Bremse aus.',
    tags: ['dbt', 'stresstoleranz', 'notfall'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_schmetterling_klopf',
    title: 'Schmetterlings-Klopfen',
    category: 'stresstoleranz',
    image: img('Umarmung Selbstfürsorge Halt'),
    description:
      'Arme vor der Brust kreuzen, abwechselnd sanft links und rechts klopfen — bringt beide Gehirnhälften wieder in Kontakt.\n\nArme vor der Brust kreuzen, Hände auf die Oberarme legen. Langsam und sanft abwechselnd links, dann rechts klopfen — so lange es guttut.\n\nNach Lucina Artigas, Teil des EMDR-Protokolls: die bilaterale Stimulation re-integriert beide Gehirnhälften.',
    tags: ['dbt', 'stresstoleranz', 'shutdown'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_oculocardiac',
    title: 'Oculocardiac-Reflex (Augendruck)',
    category: 'stresstoleranz',
    image: img('Entspannung Ruhe Erholung'),
    description:
      'Minimaler Druck auf die geschlossenen Augenlider kann aus dissoziativer Schock-Starre zurück in die Realität holen.\n\nAugen schließen. Fingerkuppen ganz sanft auf die geschlossenen Lider legen, 10 Sekunden minimalen Druck ausüben, dabei ruhig ausatmen.\n\nAus der klinischen Neurologie (Oculocardiac-Reflex): wirkt über den Vagusnerv tiefenwirksam beruhigend.',
    tags: ['dbt', 'stresstoleranz', 'shutdown'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_self_holding',
    title: 'Self-Holding Umarmung',
    category: 'stresstoleranz',
    image: img('Umarmung Selbstfürsorge Halt'),
    description:
      'Die eigenen Körpergrenzen fest spüren, wenn sich alles taub oder schwebend anfühlt.\n\nRechten Arm unter die linke Achselhöhle schlingen, linke Hand auf die rechte Schulter legen — sich selbst fest umarmt halten. Die festen Grenzen des Körpers eine Minute lang spüren.\n\nAus Somatic Experiencing nach Dr. Peter Levine: gibt über Haut- und Druckrezeptoren klare topografische Rückmeldung.',
    tags: ['dbt', 'stresstoleranz', 'shutdown'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  // "Die 5 Module, einzelne Skills mit genuegend Info, nicht den
  // kompletten Text"-Auftrag — 17 additional skills distilled from
  // the person's detailed module breakdown, each concise but complete
  // (what it is + how it's done), not the full essay-style source
  // text. Includes the fifth module (Mittelweg finden), new for this
  // batch.
  {
    id: 'res_skill_was_fertigkeiten',
    title: 'Die „Was"-Fertigkeiten',
    category: 'achtsamkeit',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description:
      'Die drei Grundbausteine der Achtsamkeit — was man eigentlich tut, wenn man achtsam ist:\n\nWahrnehmen (Observe): Reize, Gefühle und Gedanken einfach nur registrieren, wie ein innerer Beobachter, ohne an ihnen festzuhalten.\n\nBeschreiben (Describe): Das Wahrgenommene in sachliche Worte fassen — „Mein Herz schlägt schneller" statt „Ich sterbe gleich vor Angst".\n\nTeilnehmen (Participate): Ganz im Moment aufgehen, sich schamlos und vollkommen auf eine Aktivität einlassen.',
    tags: ['dbt', 'achtsamkeit'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_wie_fertigkeiten',
    title: 'Die „Wie"-Fertigkeiten',
    category: 'achtsamkeit',
    image: img('Achtsamkeit Fokus Ruhe'),
    description:
      'Nicht was man tut, sondern wie man es tut:\n\nNicht-bewertend: Die Realität so sehen, wie sie ist, ohne sie in „gut" oder „schlecht" einzuteilen. Fakten von Bewertungen trennen.\n\nKonzentriert / Einmütig: Nur eine einzige Sache zur Zeit tun, den Fokus komplett auf den gegenwärtigen Moment richten.\n\nWirkungsvoll: Das tun, was in der Situation funktioniert, statt stur Recht haben zu wollen oder sich nur von Gefühlen leiten zu lassen.',
    tags: ['dbt', 'achtsamkeit'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_wise_mind',
    title: 'Der „Weise Verstand" (Wise Mind)',
    category: 'achtsamkeit',
    image: img('Balance Gleichgewicht Ruhe'),
    description:
      'Die Schnittmenge und Balance aus dem Gefühlsverstand (Emotion Mind) und dem Logikverstand (Reasonable Mind).\n\nWeder nur dem Gefühl noch nur dem Kopf folgen, sondern innehalten und fragen: Was weiß ich gerade, wenn ich beides zusammen anschaue? Der weise Verstand ist kein Kompromiss, sondern ein eigener, dritter Ort.',
    tags: ['dbt', 'achtsamkeit'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_accepts',
    title: 'Ablenkung mit ACCEPTS',
    category: 'stresstoleranz',
    image: img('Ablenkung Aktivitaet Vielfalt'),
    description:
      'Sieben Wege, sich kurzfristig von einer Krise abzulenken, ohne sie zu verschlimmern:\n\nActivities — Aktivitäten wie Sport, Puzzeln, Aufräumen.\nContributing — einen Beitrag leisten, jemandem helfen.\nComparisons — sich mit Zeiten vergleichen, in denen es einem schlechter ging.\nEmotions — gegensätzliche Emotionen erzeugen, z. B. einen lustigen Film schauen.\nPushing away — sich von der Situation distanzieren, den Raum verlassen.\nThoughts — andere Gedanken aktivieren, Rätsel lösen, rückwärts zählen.\nSensations — andere sensorische Reize nutzen, kalt duschen.',
    tags: ['dbt', 'stresstoleranz', 'ablenkung'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_improve',
    title: 'Den Moment verbessern mit IMPROVE',
    category: 'stresstoleranz',
    image: img('Entspannung Ruhe Erholung'),
    description:
      'Sieben Wege, einen schwierigen Moment erträglicher zu machen:\n\nImagery — sich an einen sicheren, schönen Ort träumen.\nMeaning — dem Leid einen tieferen Sinn abgewinnen.\nPrayer — sich einer höheren Kraft oder Philosophie öffnen.\nRelaxation — Meditation, Badewanne, Tee trinken.\nOne thing at a time — nur den aktuellen Schritt bewältigen.\nVacation — eine kurze Auszeit nehmen, z. B. 15 Minuten ins Bett legen.\nEncouragement — gut auf sich einreden: „Ich schaffe das".',
    tags: ['dbt', 'stresstoleranz'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_willingness',
    title: 'Bereitwilligkeit vs. Einseitigkeit',
    category: 'stresstoleranz',
    image: img('Offenheit Weg Entscheidung'),
    description:
      'Sich der Situation öffnen und das tun, was gerade nötig ist, anstatt sich stur oder trotzig zu sperren.\n\nBereitwilligkeit (Willingness) heißt: die Realität so annehmen, wie sie ist, und von dort aus handeln. Einseitigkeit (Willfulness) heißt: sich gegen das, was ist, zu stemmen, selbst wenn es nichts bringt. Die Frage lautet: „Was braucht dieser Moment von mir — nicht, was will ich eigentlich?"',
    tags: ['dbt', 'stresstoleranz'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_halbes_laecheln',
    title: 'Inneres Lächeln & Achtsames Körperwahrnehmen',
    category: 'stresstoleranz',
    image: img('Gesicht Entspannung Ruhe'),
    description:
      'Das Gesicht leicht entspannen — ein halbes Lächeln —, um dem Gehirn Entwarnung zu signalisieren.\n\nMundwinkel ganz leicht anheben, Kiefer lockern, die Stirn entspannen. Kein echtes Lächeln nötig, schon die kleine Veränderung der Gesichtsmuskulatur sendet ein beruhigendes Signal an das Nervensystem zurück.',
    tags: ['dbt', 'stresstoleranz'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_gefuehle_verstehen',
    title: 'Gefühle verstehen und benennen',
    category: 'emotionsregulation',
    image: img('Gefühle verstehen benennen'),
    description:
      'Emotionen beobachten, beschreiben und ihre biologische Funktion verstehen — wozu ist die Angst, die Wut gerade gut?\n\nJedes Gefühl hat ursprünglich eine Schutzfunktion. Angst warnt vor Gefahr, Wut markiert eine überschrittene Grenze, Trauer zeigt einen Verlust an. Das Gefühl zu benennen und seine Funktion zu verstehen nimmt ihm die Überwältigung, ohne es wegzudrücken.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_problem_solving',
    title: 'Problemlösung (Problem Solving)',
    category: 'emotionsregulation',
    image: img('Problem Loesung Schritte'),
    description:
      'Wenn der Fakten-Check zeigt, dass ein Gefühl berechtigt ist: die Situation durch logische, strukturierte Schritte tatsächlich verändern.\n\nDas Problem konkret benennen, mögliche Lösungen sammeln, eine auswählen und ausprobieren, das Ergebnis überprüfen. Nicht jedes starke Gefühl braucht Regulation — manche brauchen Handeln.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_positive_emotionen',
    title: 'Angenehme Gefühle aufbauen',
    category: 'emotionsregulation',
    image: img('Freude kleine Dinge Alltag'),
    description:
      'Kurzfristig: täglich kleine, schöne Dinge tun — Musik hören, Kaffee trinken, kurz rausgehen.\n\nLangfristig: das eigene Leben nach den eigenen Grundwerten gestalten — berufliche Ziele verfolgen, Beziehungen pflegen, die wirklich zählen. Beides zusammen senkt die emotionale Verwundbarkeit über Zeit.',
    tags: ['dbt', 'emotionsregulation', 'alltag'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_build_mastery',
    title: 'Innere Stärke aufbauen (Build Mastery)',
    category: 'emotionsregulation',
    image: img('Kompetenz Erfolg kleine Schritte'),
    description:
      'Täglich eine Sache tun, die eine kleine, machbare Herausforderung darstellt, um das eigene Selbstvertrauen und Kompetenzgefühl zu stärken.\n\nDie Aufgabe sollte schwierig genug sein, dass sie etwas erfordert, aber nicht so schwer, dass ein Scheitern wahrscheinlich ist — ein neues Rezept kochen, eine unangenehme E-Mail schreiben, einen längeren Spaziergang machen.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_cope_ahead',
    title: 'Vorausplanen (Cope Ahead)',
    category: 'emotionsregulation',
    image: img('Planung vorbereiten Weg'),
    description:
      'Sich mental auf eine schwierige, bevorstehende Situation vorbereiten und einen konkreten Plan zurechtlegen, wie man mit den eigenen Gefühlen dabei umgeht.\n\nDie Situation im Kopf durchspielen: was wird passieren, was werde ich wahrscheinlich fühlen, welchen Skill nutze ich dann? Je konkreter der Plan vorher, desto leichter lässt er sich im Moment selbst abrufen.',
    tags: ['dbt', 'emotionsregulation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_give',
    title: 'Beziehungen pflegen mit GIVE',
    category: 'zwischenmenschlich',
    image: img('Beziehung Freundlichkeit Verbindung'),
    description:
      'Vier Haltungen, um eine Beziehung dabei zu stärken, während man etwas bespricht:\n\nGentle — freundlich und sanft sein, keine Drohungen oder Vorwürfe.\nInterested — echtes Interesse am Gegenüber zeigen, aktiv zuhören.\nValidate — die Gefühle des anderen anerkennen, auch wenn man anderer Meinung ist.\nEasy manner — eine lockere, leichte Haltung bewahren, auch mal lächeln.',
    tags: ['dbt', 'zwischenmenschlich', 'kommunikation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_fast',
    title: 'Selbstachtung bewahren mit FAST',
    category: 'zwischenmenschlich',
    image: img('Selbstachtung Werte Haltung'),
    description:
      'Vier Leitlinien, um in einem Gespräch die eigene Selbstachtung nicht zu verlieren:\n\nFair — fair zu sich selbst und zum anderen sein.\nApologies — keine unnötigen Entschuldigungen für die eigene Existenz oder Meinung.\nStick to values — den eigenen Werten und moralischen Vorstellungen treu bleiben.\nTruthful — ehrlich sein, nicht lügen oder übertreiben.',
    tags: ['dbt', 'zwischenmenschlich', 'kommunikation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_dialektik',
    title: 'Dialektisches Denken',
    category: 'mittelweg',
    image: img('Balance zwei Seiten Gleichgewicht'),
    description:
      'Erkennen, dass zwei scheinbar gegensätzliche Dinge gleichzeitig wahr sein können — „Ich tue mein Bestes" UND „Ich muss mich noch mehr anstrengen".\n\nStatt in Schwarz-Weiß-Denken zu verfallen (entweder/oder), nach dem UND suchen. Das löst viele innere und zwischenmenschliche Konflikte, die durch starres Entweder-Oder-Denken erst entstehen.',
    tags: ['dbt', 'mittelweg'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_validierung',
    title: 'Validierung',
    category: 'mittelweg',
    image: img('Anerkennung Verstehen Zuhören'),
    description:
      'Die Gefühle und Reaktionen von sich selbst und anderen als nachvollziehbar und wahr anerkennen — auch wenn man die Handlung selbst nicht gutheißt.\n\n„Es macht Sinn, dass du dich so fühlst" ist etwas anderes als „Was du getan hast, war richtig". Validierung trennt das Gefühl von der Handlung und schafft dadurch Nähe, ohne alles gutzuheißen.',
    tags: ['dbt', 'mittelweg'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_verhaltensaenderung',
    title: 'Verhaltensänderung',
    category: 'mittelweg',
    image: img('Veraenderung Wachstum Schritt'),
    description:
      'Die Prinzipien von Lob (positiver Verstärkung) und dem Setzen von Konsequenzen bewusst im Alltag anwenden — bei sich selbst und im Umgang mit anderen.\n\nVerhalten, das belohnt wird, wiederholt sich eher. Sich selbst (oder andere) für kleine Fortschritte bewusst anerkennen, wirkt oft nachhaltiger als Kritik an dem, was noch nicht klappt.',
    tags: ['dbt', 'mittelweg'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'res_skill_dear_man',
    title: 'DEAR MAN',
    category: 'zwischenmenschlich',
    image: img('DEAR MAN Gespräch'),
    description:
      'Ein Leitfaden für ein strukturiertes Gespräch, wenn man eine Bitte äußern oder „Nein“ sagen möchte:\n\nDescribe — die Situation sachlich beschreiben.\nExpress — eigene Gefühle/Meinung äußern.\nAssert — klar sagen, was man will oder nicht will.\nReinforce — die positiven Folgen für den anderen betonen.\nMindful — beim Thema bleiben (Schallplattenmethode).\nAppear confident — sicher und aufrecht auftreten.\nNegotiate — Kompromisse anbieten.',
    tags: ['dbt', 'zwischenmenschlich', 'kommunikation'],
    favorite: false,
    createdAt: now,
    updatedAt: now,
  },
];
