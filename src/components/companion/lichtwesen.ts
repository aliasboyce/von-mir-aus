import type { CompanionCategory } from './companionRegistry';

export type LichtwesenMovement =
  | 'bounce-joy'
  | 'sway-slow'
  | 'still-deep'
  | 'tilt-steady'
  | 'pulse-warm'
  | 'drift-shy'
  | 'rise-gentle'
  | 'listen-tilt'
  | 'quick-alert'
  | 'precise-hover';

export type LichtwesenEyeStyle =
  | 'round'
  | 'half-closed'
  | 'soft-closed'
  | 'direct'
  | 'curved-happy'
  | 'narrow-peek'
  | 'wide-fresh'
  | 'star-sparkle'
  | 'sharp-focused'
  | 'steady-trust';

export interface LichtwesenConfig {
  id: string;
  name: string;
  /** core orb color */
  color: string;
  /** soft glow / halo color, usually a lighter tint */
  glow: string;
  /** one line describing the personality, shown on the selection screen */
  trait: string;
  movement: LichtwesenMovement;
  eyeStyle: LichtwesenEyeStyle;
  /** small friendly freckle-like dots scattered on the body — a subtle
   * character detail, not a redesign. Optional per-being, not a global
   * default, so it stays a deliberate personality trait rather than
   * something every being automatically gets. */
  bodyDots?: boolean;
  /** which kinds of companion lines this being tends to reach for first —
   * gives each personality a real voice, not just a different look.
   * See companionRegistry.ts for what each category means. */
  preferredCategories: CompanionCategory[];
}

/**
 * The 16 selectable light-being personalities. Each gets a distinct color,
 * movement style, eye expression, AND a preferred pair of dialogue
 * categories — the orb shape itself is shared (see LichtCompanion.tsx),
 * but these axes combine to make every being read as genuinely its own
 * small creature with its own voice, not just a different color.
 */
export const LICHTWESEN: LichtwesenConfig[] = [
  { id: 'froehlich', name: 'Fröhlich', color: '#E8B23D', glow: '#FBE7B8', trait: 'Springt gern und freut sich über Kleinigkeiten.', movement: 'bounce-joy', eyeStyle: 'round', preferredCategories: ['positiv', 'humorvoll'] },
  { id: 'gemuetlich', name: 'Gemütlich', color: '#C48A5C', glow: '#EBD3B8', trait: 'Mag es langsam, warm und ohne Eile.', movement: 'sway-slow', eyeStyle: 'half-closed', preferredCategories: ['beruhigend', 'positiv'] },
  { id: 'besinnlich', name: 'Besinnlich', color: '#7B93A8', glow: '#D3DEE7', trait: 'Schaut gern still nach innen.', movement: 'still-deep', eyeStyle: 'soft-closed', preferredCategories: ['erklaerung', 'beruhigend'] },
  { id: 'ehrlich', name: 'Ehrlich', color: '#4F7CA8', glow: '#C6DAEC', trait: 'Sagt, wie es ist — sanft, aber klar.', movement: 'tilt-steady', eyeStyle: 'direct', preferredCategories: ['erklaerung', 'kontext'] },
  { id: 'freundlich', name: 'Freundlich', color: '#8FAF6E', glow: '#DCE9CD', trait: 'Freut sich einfach, dass du da bist.', movement: 'pulse-warm', eyeStyle: 'curved-happy', preferredCategories: ['positiv', 'ermutigung'] },
  { id: 'heimlich', name: 'Heimlich', color: '#6B5B95', glow: '#D6CFE8', trait: 'Hält sich gern ein bisschen im Verborgenen.', movement: 'drift-shy', eyeStyle: 'narrow-peek', preferredCategories: ['humorvoll', 'tipp'] },
  { id: 'morgendlich', name: 'Morgendlich', color: '#E4A15C', glow: '#FBDDB8', trait: 'Ist am liebsten früh und frisch unterwegs.', movement: 'rise-gentle', eyeStyle: 'wide-fresh', preferredCategories: ['positiv', 'tipp'] },
  { id: 'verstaendlich', name: 'Verständlich', color: '#5CA0A0', glow: '#C9E5E5', trait: 'Hört erstmal zu, bevor es etwas sagt.', movement: 'listen-tilt', eyeStyle: 'direct', preferredCategories: ['kontext', 'erklaerung'] },
  { id: 'troestlich', name: 'Tröstlich', color: '#C97F86', glow: '#F0D4D6', trait: 'Rückt gern ganz nah, wenn es schwer ist.', movement: 'pulse-warm', eyeStyle: 'curved-happy', preferredCategories: ['beruhigend', 'ermutigung'] },
  { id: 'feierlich', name: 'Feierlich', color: '#B08FCB', glow: '#E7D9F0', trait: 'Findet, jeder Tag verdient einen Moment Glanz.', movement: 'bounce-joy', eyeStyle: 'star-sparkle', preferredCategories: ['positiv', 'humorvoll'] },
  { id: 'puenktlich', name: 'Pünktlich', color: '#5C7ACB', glow: '#CFD9F0', trait: 'Behält gern ein Auge auf die Zeit.', movement: 'quick-alert', eyeStyle: 'sharp-focused', bodyDots: true, preferredCategories: ['funktionshinweis', 'anleitung'] },
  { id: 'gruendlich', name: 'Gründlich', color: '#4E8A6A', glow: '#CDE4D9', trait: 'Schaut sich Dinge lieber zweimal an.', movement: 'precise-hover', eyeStyle: 'sharp-focused', preferredCategories: ['erklaerung', 'anleitung'] },
  { id: 'herbstlich', name: 'Herbstlich', color: '#C4703D', glow: '#EFD4BC', trait: 'Mag Übergänge und ruhige Veränderung.', movement: 'sway-slow', eyeStyle: 'half-closed', preferredCategories: ['beruhigend', 'erklaerung'] },
  { id: 'naechtlich', name: 'Nächtlich', color: '#3F4C7A', glow: '#C3C9E3', trait: 'Ist auch im Dunkeln ganz entspannt.', movement: 'still-deep', eyeStyle: 'soft-closed', preferredCategories: ['beruhigend', 'kontext'] },
  { id: 'verlaesslich', name: 'Verlässlich', color: '#3E7C63', glow: '#C4E0D3', trait: 'Bleibt einfach da, egal was ist.', movement: 'tilt-steady', eyeStyle: 'steady-trust', preferredCategories: ['ermutigung', 'beruhigend'] },
  { id: 'dringlich', name: 'Dringlich', color: '#C4473F', glow: '#F0C7C3', trait: 'Merkt schnell, wenn etwas wichtig ist.', movement: 'quick-alert', eyeStyle: 'sharp-focused', preferredCategories: ['kontext', 'funktionshinweis'] },
];

export function getLichtwesen(id: string | undefined): LichtwesenConfig {
  return LICHTWESEN.find((l) => l.id === id) ?? LICHTWESEN[0];
}