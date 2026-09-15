import type { Bridge } from '../types';
import { suggestImagesFor } from '../../components/shared/imageSuggestionLibrary';

/**
 * Point 4 — each bridge's image now actually matches its own theme (a
 * nature icon for the nature bridge, a phone icon for the contact
 * bridge) via the local SVG icon library, instead of an arbitrary
 * picsum.photos stock photo that had no real connection to the bridge's
 * content.
 */
const img = (name: string) => suggestImagesFor(name)[0];

export const DEMO_BRIDGES: Bridge[] = [
  {
    id: 'bridge_natur',
    title: '10 Minuten Natur',
    category: 'gedanken_werte_intra',
    image: img('Natur Spaziergang Baum'),
    description: 'Eine kleine Brücke in die Natur. Wähle das Level, das sich gerade richtig für dich anfühlt.',
    levels: [
      { level: 1, title: 'Durch das Fenster schauen', description: 'Sich nur für einen Moment hinsetzen und die Bäume draußen beobachten.' },
      { level: 2, title: 'Kurzer Ausblick', description: 'Vor der Tür stehen und für eine Minute die frische Luft spüren.' },
      { level: 3, title: 'Kurzer Spaziergang', description: 'Eine Runde um den Block gehen und den Boden unter den Füßen spüren.' },
      { level: 4, title: 'Tiefer eintauchen', description: 'Ein längerer Spaziergang in der Natur, um wirklich anzukommen.' },
    ],
    tip: 'Wenn es passt: benenne für dich fünf Dinge, die du gerade siehst. Das muss nicht laut oder besonders sein — es hilft schon, es einfach zu bemerken.',
    favorite: true,
    isCustom: false,
  },
  {
    id: 'bridge_atem',
    title: 'Zum Atem zurückkehren',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Der Atem ist immer da — eine Brücke, die dich sanft in den Körper zurückholt.',
    levels: [
      { level: 1, title: 'Einmal bewusst durchatmen', description: 'Ein einzelner Atemzug, ohne Zählen, ohne Technik.' },
      { level: 2, title: 'Ein paar tiefe Atemzüge', description: 'Ein paar Atemzüge tief in die Nase — kein Zählen nötig, nur spüren.' },
      { level: 3, title: 'Ruhiger, gezählter Atem', description: 'Wenn es guttut: 4 Sekunden ein, kurze Pause, 4 Sekunden aus. Jederzeit abbrechbar.' },
      { level: 4, title: 'Längere Atemreise', description: 'Für einige Minuten dem eigenen Atem folgen, ohne ihn zu verändern.' },
    ],
    tip: 'Wenn Zählen sich eng oder kontrollierend anfühlt, lass es weg — einfach nur den Atem zu bemerken reicht vollkommen.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_kontakt',
    title: 'Anrufen & Sprechen',
    category: 'menschen_inter',
    image: img('Anruf Telefon Kontakt'),
    description: 'Ein kleiner Schritt zurück zu anderen Menschen — in deinem eigenen Tempo.',
    levels: [
      { level: 1, title: 'Kurze Nachricht schicken', description: 'Ein einzelnes Wort oder Emoji an jemanden senden, dem du vertraust.' },
      { level: 2, title: 'Eine vertraute Person anrufen', description: 'Ein kurzer Anruf — es muss nicht viel gesagt werden.' },
      { level: 3, title: 'Ein Gespräch beginnen', description: 'Aktiv erzählen, wie es dir gerade geht.' },
      { level: 4, title: 'Zeit gemeinsam verbringen', description: 'Sich verabreden oder gemeinsam Zeit verbringen.' },
    ],
    tip: 'Du musst nicht erklären, warum du dich meldest. „Ich wollte nur hallo sagen“ reicht völlig.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_musik',
    title: 'Musik & Klang',
    category: 'koerper_intra',
    image: img('Musik Lied Playlist'),
    description: 'Klang kann helfen, wieder im Körper anzukommen.',
    levels: [
      { level: 1, title: 'Ein Lied anhören', description: 'Ein vertrautes, ruhiges Lied auflegen.' },
      { level: 2, title: 'Bewusst zuhören', description: 'Für ein Lied nichts anderes tun, nur zuhören.' },
      { level: 3, title: 'Mitsummen oder bewegen', description: 'Leicht mitsummen oder sich sanft dazu bewegen.' },
      { level: 4, title: 'Eine Playlist gestalten', description: 'Eine kleine Playlist für genau solche Momente zusammenstellen.' },
    ],
    tip: 'Vertraute Musik wirkt oft stärker als neue — der Wiedererkennungseffekt allein kann schon beruhigen.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_notiz',
    title: 'Etwas aufschreiben',
    category: 'natur_inter',
    image: img('Schreiben Notiz Tagebuch'),
    description: 'Worte finden, ohne sie sofort teilen zu müssen.',
    levels: [
      { level: 1, title: 'Ein einzelnes Wort notieren', description: 'Ein Wort, das gerade passt — mehr nicht.' },
      { level: 2, title: 'Ein paar Sätze', description: 'Kurz aufschreiben, was gerade da ist.' },
      { level: 3, title: 'Ins Tagebuch schreiben', description: 'Einen Tagebucheintrag beginnen.' },
      { level: 4, title: 'Etwas gestalten', description: 'Schreiben, zeichnen oder anders kreativ ausdrücken, was da ist.' },
    ],
    tip: 'Es darf unfertig, unleserlich oder nur für dich verständlich sein — niemand außer dir muss es je lesen.',
    favorite: false,
    isCustom: false,
  },
  /**
   * "Sofort-Hilfe-Uebungen nach Stufen, erweitertes Repertoire"-Auftrag
   * — eighteen bridges total, three per arousal-ladder zone (see
   * arousalBands.ts), each holding the exact technique, step-by-step
   * instruction, and clinical background/source from the person's own
   * detailed brief — kept close to their original wording throughout,
   * only reorganized into clear paragraphs. Linked from each zone's
   * own exercise picker (see NervousSystemLadderSlider.tsx).
   */
  {
    id: 'bridge_478_atmung',
    title: '4-7-8 Atmung',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description:
      'Eine ruhige, verlängerte Ausatmung, um den Körper aus reiner Unter-Aktivierung sanft aufzuwecken — passend, wenn Herz und Atem ganz flach und langsam sind.',
    levels: [
      { level: 1, title: 'Ein Durchgang', description: '4 Sekunden einatmen, 7 Sekunden halten (oder kürzer, falls das Halten unangenehm ist), 8 Sekunden ausatmen.', energyLevel: 1 },
      { level: 2, title: 'Mehrere Runden', description: 'Den Zyklus 3–4 Mal wiederholen, in deinem eigenen Tempo. Lass das Halten weg, wenn es sich eng anfühlt.', energyLevel: 2 },
    ],
    tip:
      'Entwickelt und klinisch etabliert von Dr. Andrew Weil (Center for Integrative Medicine, University of Arizona), basierend auf der altindischen Pranayama-Lehre. Die ausgeprägte Verlängerung der Ausatmung moduliert das Verhältnis von Sympathikus und Parasympathikus und erhöht nachweislich die Herzratenvariabilität (HRV), indem sie die efferenten Signale des ventralen Vagusnervs künstlich triggert und den Herzschlag verlangsamt.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_36_bauchatmung',
    title: '3-zu-6 Bauchatmung',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Die Ausatemzeit exakt verdoppeln, um tief in die Regeneration zu finden — für die reine Ruhephase, nicht für den Arbeitsmodus.',
    levels: [
      { level: 1, title: 'Hände auf den Bauch', description: 'Lege beide Hände flach auf deinen Bauchnabel. Atme 3 Sekunden lang tief in den Bauch ein, sodass sich deine Hände heben.', energyLevel: 1 },
      { level: 2, title: 'Lange Ausatmung', description: 'Atme danach 6 Sekunden lang ganz langsam und lautlos durch die Lippenbremse aus. Mehrmals wiederholen.', energyLevel: 1 },
    ],
    tip:
      'Aus der klinischen Verhaltensmedizin. Durch das exakte Verdoppeln der Ausatmenzeit im Vergleich zur Einatmung wird die respiratorische Sinusarrhythmie ausgenutzt — das stimuliert den Nucleus tractus solitarii im Hirnstamm, schaltet das System tiefer in den ventralen Vagus und senkt den Blutdruck.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_gaehn_impuls',
    title: 'Sanfter Gähn-Impuls',
    category: 'koerper_intra',
    image: img('Entspannung Ruhe Erholung'),
    description: 'Ein künstlich ausgelöstes, echtes Gähnen bringt sanfte, entspannte Wachheit — ganz ohne Stresshormone.',
    levels: [{ level: 1, title: 'Zwei bis drei Mal', description: 'Öffne den Mund weit und tue so, als ob du herzhaft gähnst, bis ein echtes, biologisches Gähnen getriggert wird. Wiederhole das 2–3 Mal, Schultern sinken lassen.', energyLevel: 1 }],
    tip:
      'Aus der Neurobiologie des Schlafs (u. a. Dr. Andrew Newberg). Künstlich induziertes Gähnen stimuliert den Nervus Trigeminus und reguliert die Gehirntemperatur — es bringt sanfte, entspannte Wachheit ins System, ohne Stresshormone auszuschütten.',
    favorite: false,
    isCustom: false,
  },

  {
    id: 'bridge_grounding_54321',
    title: 'Kognitives Grounding',
    category: 'koerper_intra',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description: 'Die 5-4-3-2-1-Methode holt deine Aufmerksamkeit aus dem Kreisen zurück in den gegenwärtigen Moment — der Klassiker für den Fokus-Sweetspot.',
    levels: [
      { level: 1, title: 'Kurzfassung', description: 'Finde 5 Dinge, die du gerade siehst, und 4, die du körperlich spürst.', energyLevel: 1 },
      { level: 2, title: 'Vollständig', description: '5 Dinge sehen, 4 spüren, 3 hören, 2 riechen, 1 schmecken — der Reihe nach.', energyLevel: 2 },
    ],
    tip:
      'Ein Standardverfahren aus der kognitiven Verhaltenstherapie (KVT) und den Achtsamkeits-Protokollen (Mindfulness-Based Stress Reduction, MBSR) nach Dr. Jon Kabat-Zinn. Die Übung lenkt die neuronale Aktivität gezielt weg von der überaktiven Amygdala hin zum präfrontalen Kortex, beendet das grübelnde „Default Mode Network" und verankert das Nervensystem im sozialen Interaktionsmodus.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_peripheres_sehen',
    title: 'Peripheres Sehen',
    category: 'koerper_intra',
    image: img('Augen Blick Orientierung'),
    description: 'Vom Tunnelblick zum Weitwinkel — hält das Gehirn wach und aufmerksam, ohne die Alarmbereitschaft zu triggern.',
    levels: [
      {
        level: 1,
        title: 'Weitwinkel üben',
        description: 'Fixiere einen Punkt geradeaus an der Wand. Dehne nun, ohne die Augen zu bewegen, deine Aufmerksamkeit bewusst zu den Seiten aus — versuche, die äußeren Ränder deines Sichtfelds gleichzeitig wahrzunehmen.',
        energyLevel: 1,
      },
    ],
    tip:
      'Aus den Neurowissenschaften (u. a. Dr. Andrew Huberman, Stanford). Das Umschalten von fokussiertem (fovealem) Sehen auf peripheres Sehen deaktiviert die sympathische Alarmbereitschaft im Gehirn, hält das Gehirn aber gleichzeitig hochgradig wach und aufmerksam — es beendet den Stress-Tunnelblick.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_box_atmung',
    title: 'Box-Atmung (Taktisch)',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Vier gleich lange Phasen balancieren das Nervensystem perfekt aus — für ruhige, laserfokussierte Handlungsbereitschaft.',
    levels: [{ level: 1, title: 'Ein Zyklus', description: '4 Sekunden einatmen – 4 Sekunden Luft anhalten – 4 Sekunden ausatmen – 4 Sekunden mit leerer Lunge abwarten. Für 2 Minuten wiederholen.', energyLevel: 2 }],
    tip:
      'Aus dem Tactical Breathing Protocol der US Navy SEALs. Das Anhalten der Luft mit voller und leerer Lunge stabilisiert den CO₂-Gehalt im Blut und führt zu einem Zustand ruhiger, laserfokussierter Handlungsbereitschaft.',
    favorite: false,
    isCustom: false,
  },

  {
    id: 'bridge_voo_atem',
    title: 'Orientierung & Voo-Atem',
    category: 'koerper_intra',
    image: img('Raum Orientierung Umschauen'),
    description: 'Den Raum nach sicheren Dingen absuchen und mit einem tönenden Ausatmen emotionale Überflutung dämpfen.',
    levels: [
      { level: 1, title: 'Nur orientieren', description: 'Lass deinen Blick langsam durch den Raum wandern und finde 3 Dinge, die sich neutral oder beruhigend anfühlen.', energyLevel: 1 },
      { level: 2, title: 'Mit Voo-Ton', description: 'Danach tief einatmen und beim Ausatmen ein tiefes, tönendes „Vooo" erklingen lassen — so lange und ruhig wie angenehm.', energyLevel: 2 },
    ],
    tip:
      'Entwickelt von Dr. Peter Levine (Somatic Experiencing). Das Scannen der Umgebung aktiviert die bewusste Neurozeption (Suche nach Sicherheit). Das tiefe „Voo"-Tönen versetzt Zwerchfell und Kehlkopfmuskulatur in Schwingung — da der Vagusnerv direkt durch diese Region verläuft, dämpft die mechanische Vibration emotionale Überflutung unmittelbar.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_gewichtswahrnehmung',
    title: 'Gewichtswahrnehmung',
    category: 'koerper_intra',
    image: img('Boden Erdung Halt'),
    description: 'Propriozeptives Grounding — den eigenen Körper physisch spüren, statt im Gefühl zu verschwimmen.',
    levels: [
      { level: 1, title: 'Fersen spüren', description: 'Drücke deine Fersen ganz bewusst und fest in den Boden. Spüre die Härte des Bodens.', energyLevel: 1 },
      { level: 2, title: 'Sitzfläche spüren', description: 'Konzentriere dich für 30 Sekunden ausschließlich auf das Gewicht deines Körpers, das auf die Sitzfläche drückt.', energyLevel: 1 },
    ],
    tip:
      'Aus der Achtsamkeitsbasierten Kognitiven Therapie (MBCT). Die Aktivierung der Mechanorezeptoren und Propriozeptoren in Muskeln und Gelenken sendet Signale an den somatosensorischen Kortex — das Gehirn registriert physische Schwerkraft und Stabilität, was das Gefühl von emotionalem Verschwimmen oder Überflutet-Werden stoppt.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_auditives_verankern',
    title: 'Auditives Verankern',
    category: 'koerper_intra',
    image: img('Achtsamkeit Sinne wahrnehmen'),
    description: 'Dem leisesten Geräusch lauschen — ein Signal an dein Nervensystem, dass gerade kein akuter Angriff stattfindet.',
    levels: [{ level: 1, title: '30 Sekunden zuhören', description: 'Schließe die Augen und suche in deiner Umgebung nach dem leisesten, am weitesten entfernten Geräusch. Höre ihm 30 Sekunden zu, ohne es zu bewerten.', energyLevel: 1 }],
    tip:
      'Auditives Systemtraining nach Dr. Stephen Porges (Polyvagal-Theorie). Die bewusste Filterung von Frequenzen trainiert die feinen Muskeln im Mittelohr, gesteuert über den Nervus Facialis — das signalisiert dem Nervensystem evolutionär: „Ich lausche auf die Umgebung, es findet kein akuter Angriff statt."',
    favorite: false,
    isCustom: false,
  },

  {
    id: 'bridge_physio_seufzer',
    title: 'Physiologischer Seufzer',
    category: 'koerper_intra',
    image: img('Atem atmen Wind'),
    description: 'Zwei kurze Einatmer durch die Nase, dann lang und seufzend durch den Mund ausatmen — senkt den Puls in Echtzeit.',
    levels: [{ level: 1, title: 'Ein bis drei Durchgänge', description: 'Doppelt kurz durch die Nase einatmen, dann lang und hörbar durch den Mund ausatmen. 1–3 Mal wiederholen.', energyLevel: 1 }],
    tip:
      'Bekannt gemacht durch Prof. Andrew Huberman (Stanford) und Dr. David Spiegel, klinisch bestätigt in einer Verlaufsstudie (Cell Reports Medicine, 2023). Stress führt dazu, dass winzige Lungenbläschen (Alveolen) kollabieren — der doppelte Atemzug bläht sie wieder auf, wodurch beim langen Ausatmen maximal CO₂ abtransportiert wird. Die schnellste bekannte Methode, den Puls in Echtzeit biochemisch zu senken.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_shaking',
    title: 'Shaking (Neurogenes Zittern)',
    category: 'koerper_intra',
    image: img('Bewegung Energie Aktivierung'),
    description: 'Bewusstes Ausschütteln entlädt überschüssige Stress-Energie mechanisch, damit das System nicht in den Shutdown stürzen muss.',
    levels: [
      {
        level: 1,
        title: 'Eine Minute durchschütteln',
        description: 'Stelle dich locker hin. Schüttle deine Hände locker aus, dann Arme, Schultern und Beine — als würdest du Wassertropfen abschütteln, etwa eine Minute lang.',
        energyLevel: 2,
      },
    ],
    tip:
      'Aus TRE (Tension & Trauma Releasing Exercises) nach Dr. David Berceli. Säugetiere zittern nach überstandener Todesangst instinktiv, um im Sympathikus gefangene Muskelspannung abzubauen. Das bewusste Schütteln entlädt die überschüssige Stress-Energie mechanisch.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_carotis_druck',
    title: 'Carotis-Sanftdruck',
    category: 'koerper_intra',
    image: img('Hand Beruhigung Halt'),
    description: 'Ein reflexartiger Bremsknopf für einen rasenden Puls — über die Drucksensoren am Hals.',
    levels: [
      {
        level: 1,
        title: 'Leichter Druck, eine Seite',
        description: 'Lege zwei Finger sanft an eine Seite deines Halses, unterhalb des Kieferwinkels, wo man den Puls fühlt. Massiere mit ganz leichtem, kreisendem Druck 10–15 Sekunden. Niemals beide Seiten gleichzeitig.',
        energyLevel: 1,
      },
    ],
    tip:
      'Aus Kardiologie und Neurologie. An der Halsschlagader sitzen Barorezeptoren (Drucksensoren) — der sanfte Druck simuliert einen zu hohen Blutdruck, das Gehirn wirft reflexartig die parasympathische Bremse an und senkt den Herzschlag innerhalb von Sekunden.',
    favorite: false,
    isCustom: false,
  },

  {
    id: 'bridge_salamander_blick',
    title: 'Der Salamander-Blick',
    category: 'koerper_intra',
    image: img('Augen Blick Orientierung'),
    description: 'Kopf ruhig halten, Augen weit zur Seite bewegen, bis sich Gähnen oder Schlucken einstellt — löst innere Erstarrung.',
    levels: [{ level: 1, title: 'Einmal probieren', description: 'Kopf geradeaus halten. Nur die Augen ganz nach rechts bewegen und einige Atemzüge dort verweilen, bis sich Gähnen oder Schlucken einstellt. Dann zur anderen Seite.', energyLevel: 1 }],
    tip:
      'Entwickelt von Stanley Rosenberg (Vagus-Regulation). Die extreme Augenbewegung ohne Kopfdrehung entkoppelt die für die Freeze-Reaktion verantwortlichen Hirnnerven (u. a. III, IV, VI und XI). Das unwillkürliche Gähnen oder Schlucken ist das sichtbare Zeichen, dass das System die Erstarrung löst und wieder in den sicheren ventralen Vagus schaltet.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_schulterkreisen',
    title: 'Schulterkreisen (Fixierter Blick)',
    category: 'koerper_intra',
    image: img('Bewegung Dehnung Koerper'),
    description: 'Augen fixiert, Schultern in Bewegung — entkoppelt die im Freeze verriegelte Augen-Nacken-Einheit.',
    levels: [
      {
        level: 1,
        title: '45 Sekunden',
        description: 'Fixiere einen Punkt geradeaus an der Wand, Augen bleiben starr darauf. Kreise die Schultern ganz langsam und groß nach hinten — Kopf und Augen bewegen sich dabei nicht.',
        energyLevel: 1,
      },
    ],
    tip:
      'Aus der kraniofazialen Therapie (Stanley Rosenberg). Im Freeze-Zustand arbeiten Augen und Nacken starr als verriegelte Einheit (Fluchtreflex-Vorbereitung). Die Schulterbewegung bei fixierten Augen zwingt die tiefen Nackenmuskeln zur Entspannung, was die Erstarrungsschleife im Hirnstamm auflöst.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_isometrischer_zug',
    title: 'Isometrischer Hand-Zug',
    category: 'koerper_intra',
    image: img('Hand Beruhigung Halt'),
    description: 'Blockierte Energie durch einen kurzen, erfolgreichen „Kraftakt" entladen — ohne jede Bewegung nach außen.',
    levels: [
      {
        level: 1,
        title: '5 Wiederholungen',
        description: 'Verhake die Finger vor der Brust ineinander. Versuche beim Ausatmen, die Hände mit maximaler Kraft auseinanderzuziehen, ohne loszulassen. 5 Sekunden halten, beim Einatmen ganz locker lassen. 5-mal wiederholen.',
        energyLevel: 2,
      },
    ],
    tip:
      'Aus der körperorientierten Traumatherapie. Freeze ist blockierte Energie — die kurze, maximale Muskelanspannung ohne Bewegung (Isometrie) simuliert für das Nervensystem einen „erfolgreichen Kraftakt". Das System kann die blockierte Energie entladen und schaltet die Bremse ab.',
    favorite: false,
    isCustom: false,
  },

  {
    id: 'bridge_schmetterling_klopf',
    title: 'Schmetterlings-Klopfen',
    category: 'koerper_intra',
    image: img('Umarmung Selbstfürsorge Halt'),
    description: 'Arme vor der Brust kreuzen, abwechselnd sanft links und rechts klopfen — bringt beide Gehirnhälften wieder in Kontakt.',
    levels: [{ level: 1, title: 'Ein paar Minuten', description: 'Arme vor der Brust kreuzen, Hände auf die Oberarme legen. Ganz langsam und sanft abwechselnd links, dann rechts klopfen — so lange es guttut.', energyLevel: 1 }],
    tip:
      'Entwickelt von Lucina Artigas, fester Bestandteil des EMDR-Protokolls nach Dr. Francine Shapiro. Im tiefen Hypoarousal-Shutdown ist die Kommunikation zwischen linker (logischer) und rechter (emotionaler) Gehirnhälfte blockiert — das langsame, rhythmische, wechselseitige Klopfen (bilaterale Stimulation) aktiviert abwechselnd beide Hemisphären und re-integriert das Nervensystem.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_oculocardiac',
    title: 'Oculocardiac-Reflex (Augendruck)',
    category: 'koerper_intra',
    image: img('Entspannung Ruhe Erholung'),
    description: 'Minimaler Druck auf die geschlossenen Augenlider kann aus dissoziativer Schock-Starre zurück in die Realität holen.',
    levels: [{ level: 1, title: '10 Sekunden', description: 'Augen schließen. Fingerkuppen ganz sanft auf die geschlossenen Augenlider legen, für 10 Sekunden minimalen, kaum spürbaren Druck ausüben. Dabei ruhig ausatmen.', energyLevel: 1 }],
    tip:
      'Aus der klinischen Neurologie — der sogenannte Aschner- oder Oculocardiaci-Reflex. Der mechanische Reiz auf den Nervus Ophthalmicus leitet ein Signal an den Vagusnerv weiter, das tiefenwirksam beruhigt und paradoxerweise aus einer dissoziativen Schock-Starre zurück in die orientierte Realität holen kann.',
    favorite: false,
    isCustom: false,
  },
  {
    id: 'bridge_self_holding',
    title: 'Self-Holding Umarmung',
    category: 'koerper_intra',
    image: img('Umarmung Selbstfürsorge Halt'),
    description: 'Die eigenen Körpergrenzen fest spüren, wenn sich alles taub oder schwebend anfühlt.',
    levels: [{ level: 1, title: 'Eine Minute halten', description: 'Rechten Arm unter die linke Achselhöhle schlingen, linke Hand auf die rechte Schulter legen — du hältst dich selbst fest umarmt. Die festen Grenzen deines Körpers eine Minute lang spüren.', energyLevel: 1 }],
    tip:
      'Aus dem Somatic Experiencing nach Dr. Peter Levine. Im tiefen Shutdown verliert das Gehirn das „Körper-Schema" — man fühlt sich taub oder schwebend. Die feste Umarmung gibt über Haut- und Druckrezeptoren eine klare topografische Rückmeldung: „Hier fange ich an, hier höre ich auf." Das schafft die biologische Sicherheit, die man braucht, um wieder zu erwachen.',
    favorite: false,
    isCustom: false,
  },
];
