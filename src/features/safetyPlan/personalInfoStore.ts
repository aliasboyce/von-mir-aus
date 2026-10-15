import { createKeyValueStore } from '../../services/storage/keyValueStore';

/**
 * Freiwillige persönliche Angaben und Klinik-/Behandlungswünsche für den
 * Sicherheitsplan. Beides gehört zur Person (nicht zu einem einzelnen Plan)
 * und wird deshalb nur einmal gepflegt; pro Plan (SafetyPlan.pdfParts) wird
 * entschieden, ob es im PDF/Teilen-Text mitkommt. Alles ist optional – im
 * PDF erscheint nur, was ausgefüllt wurde.
 */
export interface PlanMedication {
  id: string;
  name: string;
  /** Menge / Dosis, z. B. „50 mg“ */
  dose?: string;
  /** Wann, z. B. „morgens und abends“ oder „bei Panik“ */
  when?: string;
  /** Id der Dauermedikation in der Medikamenten-Seite, falls übernommen */
  fromRecurringId?: string;
}

export interface PlanEmergencyContact {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  /** NetworkEntry.id, falls aus dem Sicheren Netz übernommen */
  fromNetworkId?: string;
}

export interface PersonalInfo {
  name?: string;
  birthdate?: string;
  address?: string;
  regularMeds?: PlanMedication[];
  /** Bedarfsmedikation: `when` = bei welchem Bedarf */
  asNeededMeds?: PlanMedication[];
  allergies?: string;
  preconditions?: string;
  diagnoses?: string;
  contacts?: PlanEmergencyContact[];
  insurance?: string;
  insuranceNumber?: string;
  copayExemption?: string;
  gdb?: string;
  pets?: string;
}

export interface ClinicWishes {
  treatment?: string;
  placement?: string;
  placementFallback?: string;
  never?: string;
  excludedMeds?: string;
  history?: string;
  additions?: string;
}

export const personalInfoStore = createKeyValueStore<PersonalInfo>('safety-personal-info', {});
export const clinicWishesStore = createKeyValueStore<ClinicWishes>('safety-clinic-wishes', {});

const filled = (v?: string) => !!v && v.trim().length > 0;

export function personalHasContent(p: PersonalInfo): boolean {
  return (
    [p.name, p.birthdate, p.address, p.allergies, p.preconditions, p.diagnoses, p.insurance, p.insuranceNumber, p.copayExemption, p.gdb, p.pets].some(filled) ||
    (p.regularMeds ?? []).some((m) => filled(m.name)) ||
    (p.asNeededMeds ?? []).some((m) => filled(m.name)) ||
    (p.contacts ?? []).some((c) => filled(c.name))
  );
}

export function clinicHasContent(c: ClinicWishes): boolean {
  return Object.values(c).some((v) => filled(v));
}

export const DEFAULT_PDF_PARTS = { personal: false, plan: true, clinic: false };
