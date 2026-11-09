import { getLines, pickLine, pickLineAvoidingRepeats } from './companionRegistry';
import type { CompanionCategory } from './companionRegistry';
import { getCompanionLanguage } from './companionRegistry';
import { getFitFilter } from '../../state/fitFilterStore';
import { missingChannels } from '../../content/fitCriteria';
import type { AccessChannel } from '../../data/types';

/**
 * When the person has marked an access channel as MISSING right now (Zugangskanäle / "Was geht gerade?"), the Wesen
 * leans quiet: it offers a small thing that works WITHOUT that channel instead of an ordinary tip – never a task.
 */
const ACCESS_TIPS: Record<AccessChannel, { de: string[]; en: string[] }> = {
  denken: { de: ['Denken muss gerade nicht sein. Spüren reicht: Was fühlen deine Hände?', 'Du musst gerade nichts verstehen. Ein Gegenstand in der Hand genügt.'], en: ['Thinking does not have to happen right now. Feeling is enough: what do your hands feel?', 'You do not have to understand anything right now. Holding one object is enough.'] },
  erinnerung: { de: ['Was war, darf gerade fern sein. Schau nur: Was siehst du jetzt?', 'Du musst dich an nichts erinnern. Nur dieser eine Moment zählt.'], en: ['What was can stay far away right now. Just look: what do you see now?', 'You do not have to remember anything. Only this one moment counts.'] },
  fuehlen: { de: ['Fühlen ist gerade weit weg – das ist okay. Etwas Handfestes geht: Wasser, Decke, Boden unter den Füßen.', 'Du musst nichts fühlen. Du darfst einfach etwas tun, das sich gut anfasst.'], en: ['Feeling is far away right now – that is okay. Something tangible works: water, a blanket, the floor under your feet.', 'You do not have to feel anything. You may simply do something that is good to touch.'] },
  koerper_innen: { de: ['Der Körper innen ist gerade still oder zu laut. Außen geht: Schau dich um und nenne drei Dinge.', 'Du musst deinen Körper gerade nicht lesen. Der Raum um dich herum reicht.'], en: ['Your inner body is quiet or too loud right now. Outside works: look around and name three things.', 'You do not have to read your body right now. The room around you is enough.'] },
  sinne: { de: ['Wenn die Sinne zu viel sind: weniger Licht, weniger Lärm – oder einfach die Augen schließen.', 'Du darfst die Reize runterdrehen. Das ist keine Flucht, das ist Fürsorge.'], en: ['If the senses are too much: less light, less noise – or simply close your eyes.', 'You may turn the input down. That is not running away, that is care.'] },
  aufmerksamkeit: { de: ['Aufmerksamkeit ist gerade schwer zu halten. Eine Sache, eine Minute – mehr nicht.', 'Du darfst abschweifen. Komm einfach wieder, wenn du magst.'], en: ['Attention is hard to hold right now. One thing, one minute – no more.', 'You may drift. Just come back whenever you like.'] },
  bewegung: { de: ['Bewegung ist gerade nicht dran. Sitzen oder liegen bleiben geht auch – dann nur atmen oder schauen.', 'Du musst dich nicht bewegen. Ein kleines Strecken der Finger reicht schon.'], en: ['Movement is not on the table right now. Staying seated or lying down works too – just breathe or look.', 'You do not have to move. Stretching your fingers a little is plenty.'] },
  ausfuehren: { de: ['Etwas zu tun ist gerade zu viel. Nur den allerersten Handgriff – oder noch nicht.', 'Du musst gerade nichts schaffen. Ein halber Schritt ist auch ein Schritt.'], en: ['Doing things is too much right now. Just the very first move – or not yet.', 'You do not have to get anything done. Half a step is still a step.'] },
  beziehung: { de: ['Kontakt ist gerade zu viel? Dann bist du heute mit dir selbst oder mir genug.', 'Du musst niemandem antworten. Ich bin hier, ganz ohne Erwartung.'], en: ['Contact is too much right now? Then being with yourself or me is enough today.', 'You do not have to answer anyone. I am here, without any expectation.'] },
  ort_zeit: { de: ['Wo und wann – das darf gerade verschwimmen. Schau auf die Uhr oder zum Fenster, wenn du magst.', 'Orientierung braucht Zeit. Spür den Boden unter dir und sag leise: hier.'], en: ['Where and when may blur right now. Glance at the clock or the window if you like.', 'Orientation takes time. Feel the ground beneath you and say softly: here.'] },
};


/**
 * Used by CompanionDock on every route change. Mostly shows a page-specific
 * line (erstes_oeffnen on first visit this session, leerlauf on repeat
 * visits — CompanionDock itself decides which via its own "seen pages"
 * tracking), but sometimes surfaces a global unprompted aside instead, so
 * the companion feels alive rather than reciting the same page blurb.
 * `preferredCategories` (the current being's personality) tilts which line
 * gets picked when there's a choice — see companionRegistry.ts pickLine().
 */
export function pickTip(pathname: string, firstVisit: boolean, preferredCategories?: CompanionCategory[]): string | null {
  const missing = missingChannels(getFitFilter().levels);
  if (missing.length > 0 && Math.random() < 0.5) {
    const ch = missing[Math.floor(Math.random() * missing.length)];
    const pool = ACCESS_TIPS[ch]?.[getCompanionLanguage()];
    if (pool && pool.length) return pool[Math.floor(Math.random() * pool.length)];
  }
  if (Math.random() < 0.22) {
    const aside = pickLine({ page: '*', trigger: 'leerlauf', preferredCategories });
    if (aside) return aside;
  }

  const trigger = firstVisit ? 'erstes_oeffnen' : 'leerlauf';
  const primary = pickLine({ page: pathname, trigger, preferredCategories });
  if (primary) return primary;

  // Fall back to any line tagged for this page, regardless of trigger —
  // better to say something relevant than nothing at all.
  const anyForPage = getLines({ page: pathname });
  if (anyForPage.length > 0) {
    return pickLineAvoidingRepeats(anyForPage);
  }
  return null;
}
