/**
 * Feinschliff F14: ein einheitlicher, ruhiger „Geschafft“-Moment
 * (sanfter Ton + weiches Nachgeben der Vibration) für Abschlüsse, die bisher still waren
 * (Check-in speichern, Medi-Log-Eintrag, Zugang abschließen).
 * Respektiert die Einstellungen Ton / Vibration. Rückgängig: Aufrufe von completionMoment() entfernen.
 */
import type { UserSettings } from '../data/types';
import { playSound } from './sounds';
import { triggerHaptic } from './haptics';

export function completionMoment(settings: Pick<UserSettings, 'soundsEnabled' | 'hapticsEnabled'>): void {
  playSound('settle', settings);
  triggerHaptic('settle', settings);
}
