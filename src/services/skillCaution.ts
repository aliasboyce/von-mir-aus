import type { Resource } from '../data/types';

/**
 * „Vorsicht“-Markierung für körperlich intensive Skills: überall gleich (Karte, Detail, Skill-Lauf, Skillkette, „Nur jetzt“).
 * Gilt für die hier aufgeführten Skills UND für jeden eigenen Skill, bei dem unter „Gegenanzeigen“ etwas steht.
 * Kein Verbot – ein ruhiger Hinweis, wann dieser Skill nicht passt; „Das hilft gerade nicht“ geht immer.
 */
interface CautionText { de: string; en: string }

const BREATH_HOLD: CautionText = {
  de: 'Nicht bei Atemproblemen (z. B. Asthma), Schwindel oder wenn Anhalten der Luft sich bedrohlich anfühlt. Kürzer machen oder das Anhalten weglassen ist völlig in Ordnung.',
  en: 'Not with breathing problems (e.g. asthma), dizziness, or if holding your breath feels threatening. Making it shorter or skipping the hold is fine.',
};

export const CAUTION_SKILLS: Record<string, CautionText> = {
  res_skill_tipp: {
    de: 'Nicht bei Herzproblemen, sehr niedrigem Puls/Blutdruck, Essstörung mit Untergewicht oder wenn dir ärztlich davon abgeraten wurde. Intensive Bewegung nur in Maßen, nicht bis zur Erschöpfung. Bei Schwindel aufhören.',
    en: 'Not with heart problems, very low pulse/blood pressure, an eating disorder with underweight, or if a doctor advised against it. Intense movement only in moderation, never to exhaustion. Stop if dizzy.',
  },
  res_skill_carotis_druck: {
    de: 'Nicht bei Herz- oder Kreislaufproblemen, Schwindel, nach Schlaganfall, bei Verengung der Halsschlagader oder wenn Druck am Hals Angst oder Erinnerungen an Würgen/Festhalten weckt. Nie an beiden Seiten gleichzeitig. Im Zweifel lieber einen anderen Skill oder vorher ärztlich klären.',
    en: 'Not with heart or circulation problems, dizziness, after a stroke, with narrowed carotid arteries, or if pressure on the neck brings up fear or memories of choking/being held. Never on both sides at once. If in doubt, choose another skill or ask a doctor first.',
  },
  res_skill_oculocardiac: {
    de: 'Nicht bei Augenerkrankungen (z. B. Glaukom, Netzhautprobleme), nach Augen-OP, mit Kontaktlinsen oder wenn Druck auf das Gesicht Angst macht. Nur ganz sanft, nie fest drücken. Im Zweifel lieber einen anderen Skill oder vorher ärztlich klären.',
    en: 'Not with eye conditions (e.g. glaucoma, retina problems), after eye surgery, with contact lenses, or if pressure on the face makes you anxious. Only very gently, never press hard. If in doubt, choose another skill or ask a doctor first.',
  },
  res_skill_isometrischer_zug: {
    de: 'Nicht bei Herz- oder Kreislaufproblemen, hohem Blutdruck oder Schulter-/Armverletzungen. Beim Ziehen ruhig weiteratmen, nicht die Luft anhalten; nur so fest, wie es sich gut anfühlt.',
    en: 'Not with heart or circulation problems, high blood pressure, or shoulder/arm injuries. Keep breathing calmly while pulling, do not hold your breath; only as hard as feels good.',
  },
  res_skill_salamander_blick: {
    de: 'Nicht bei Schwindel, Augenerkrankungen oder wenn die Augenbewegung Unwohlsein auslöst. Sanft und langsam, jederzeit abbrechen.',
    en: 'Not with dizziness, eye conditions, or if the eye movement makes you uncomfortable. Gentle and slow, stop at any time.',
  },
  res_skill_eiskaltes_wasser: {
    de: 'Nicht bei Herzerkrankungen, Herzrhythmusstörungen, sehr niedrigem Puls oder Blutdruck, Essstörung mit Untergewicht oder wenn dir davon abgeraten wurde. Bei Schwindel sofort aufhören. Nur das Gesicht, nicht den ganzen Kopf.',
    en: 'Not with heart conditions, rhythm problems, very low pulse or blood pressure, an eating disorder with underweight, or if advised against it. Stop at once if dizzy. Face only, not the whole head.',
  },
  res_skill_gewichtsdecke: {
    de: 'Nicht bei Atemproblemen, starken Kreislauf-/Herzproblemen, Klaustrophobie oder wenn du dich unter Gewicht eingeengt oder festgehalten fühlst. Dann lieber nur auf Beine oder Schoß legen. Die Decke muss sich jederzeit ohne Kraft wegschieben lassen.',
    en: 'Not with breathing problems, strong circulation/heart problems, claustrophobia, or if weight makes you feel trapped or held down. Then rather put it only on legs or lap. You must be able to push it off at any time without effort.',
  },
  res_skill_478_atmung: BREATH_HOLD,
  res_skill_box_atmung: BREATH_HOLD,
  res_skill_36_bauchatmung: {
    de: 'Nicht bei Schwindel oder wenn tiefes Atmen Angst macht. Sanft atmen, nicht pressen; jederzeit zurück zum normalen Atem.',
    en: 'Not with dizziness or if deep breathing makes you anxious. Breathe gently, do not force it; return to normal breathing at any time.',
  },
  res_skill_shaking: {
    de: 'Nicht bei akuten Schmerzen, Verletzungen, Gelenk- oder Kreislaufproblemen. Locker und klein anfangen; bei Schwindel aufhören und hinsetzen.',
    en: 'Not with acute pain, injuries, joint or circulation problems. Start loose and small; stop and sit down if dizzy.',
  },
  res_skill_voo_atem: {
    de: 'Nicht bei Schwindel. Leise und kurz anfangen; bei Unwohlsein zurück zum normalen Atem.',
    en: 'Not with dizziness. Start quietly and briefly; return to normal breathing if uncomfortable.',
  },
};

export interface Caution { text: string }

/** Gibt die Vorsicht-Angabe zurück oder undefined, wenn der Skill keine braucht. */
export function cautionFor(r: Pick<Resource, 'id' | 'skillDetails'> | undefined, lang: 'de' | 'en'): Caution | undefined {
  if (!r) return undefined;
  const own = r.skillDetails?.gegenanzeigen?.trim();
  if (own) return { text: own };
  const c = CAUTION_SKILLS[r.id];
  return c ? { text: lang === 'en' ? c.en : c.de } : undefined;
}
