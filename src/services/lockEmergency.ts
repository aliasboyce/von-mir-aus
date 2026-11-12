import { createKeyValueStore } from './storage/keyValueStore';

/**
 * Notfall-Zugang im gesperrten Modus: Wenn jemand anderes das Handy in der Hand hat
 * (z. B. um zu helfen), geht ein Knopf auf dem Sperrbildschirm in eine stark begrenzte Ansicht.
 * Was darin steht, legt die Person selbst vorher fest. Ohne Auswahl sind es nur die
 * allgemeinen Anlaufstellen (Notruf, Telefonseelsorge …) – nichts Persönliches.
 */
export type LockInfoKey = 'name' | 'allergies' | 'meds' | 'preconditions' | 'diagnoses' | 'contacts';

export interface LockEmergencyConfig {
  /** Knopf auf dem Sperrbildschirm zeigen */
  enabled: boolean;
  /** welcher Sicherheitsplan gezeigt werden darf; '' = keiner */
  planId: string;
  /** Ids von Menschen im Sicheren Netz, die gezeigt werden dürfen */
  contactIds: string[];
  /** welche Angaben aus „Meine Angaben“ gezeigt werden dürfen */
  info: LockInfoKey[];
}

export const DEFAULT_LOCK_EMERGENCY: LockEmergencyConfig = { enabled: true, planId: '', contactIds: [], info: [] };

const store = createKeyValueStore<LockEmergencyConfig>('lock-emergency', DEFAULT_LOCK_EMERGENCY);

export const getLockEmergency = (): LockEmergencyConfig => ({ ...DEFAULT_LOCK_EMERGENCY, ...store.get() });
export const setLockEmergency = (c: LockEmergencyConfig): void => store.set(c);
