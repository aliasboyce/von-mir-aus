/**
 * "Gestufter Einstieg": how much of the app is shown. Nothing is deleted when the level is lowered –
 * it is only hidden, and a higher level brings everything back.
 *   core = Nur das Nötigste: Wesen, Kurz-Check-in, Krisenmodus, Sicherheitsplan
 *   plan = Mit Sicherheitsplan: dazu Sicherheitsnetz, Verstehen/Handeln (Zugang, Brücken) und Medikamente
 *   all  = Alles
 */
import type { UserSettings } from '../data/types';

export type Scope = 'core' | 'plan' | 'all';
export const scopeOf = (s: Pick<UserSettings, 'scope'>): Scope => s.scope ?? 'all';

const ALWAYS = ['/einstellungen', '/quellen', '/krisenmodus', '/inneres-wetter', '/entdecken/tageskurve', '/entdecken/ressourcen/skill-start', '/tag-beginnen', '/tag-abschliessen', '/nur-jetzt', '/sicherheit/plan'];
const PLAN_EXTRA = ['/sicherheit', '/zugang', '/bruecken', '/entdecken/ressourcen', '/entdecken/medi-log'];
const starts = (path: string, prefixes: string[]) => prefixes.some((p) => path === p || path.startsWith(p + '/'));

/** a shared link (import) is always let through, whatever the level */
export function scopeAllows(scope: Scope, path: string): boolean {
  if (scope === 'all') return true;
  if (path === '/' || path.includes('import') || starts(path, ALWAYS)) return true;
  return scope === 'plan' && starts(path, PLAN_EXTRA);
}
