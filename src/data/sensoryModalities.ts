export interface SensoryModality {
  id: string;
  label: string;
  labelEn: string;
  emoji: string;
}

/**
 * Perspektiven-Audit, Ergotherapeut-Sicht — resources/bridges are
 * currently only sorted by topic category (Natur, Bewegung, ...), not
 * by which SENSE actually does the regulating. Movement, touch,
 * hearing, sight, smell, and cognitive/verbal engagement work very
 * differently for different nervous systems — someone might know
 * "movement helps me" without wanting to browse an entire category to
 * find movement-based options specifically. Deliberately independent
 * of category: a single resource can be both "Natur" (category) and
 * tagged "Bewegung" + "Riechen" (modality) at once.
 */
export const SENSORY_MODALITIES: SensoryModality[] = [
  { id: 'bewegung', label: 'Bewegung', labelEn: 'Movement', emoji: '🏃' },
  { id: 'beruehrung', label: 'Berührung', labelEn: 'Touch', emoji: '✋' },
  { id: 'hoeren', label: 'Hören', labelEn: 'Hearing', emoji: '👂' },
  { id: 'sehen', label: 'Sehen', labelEn: 'Sight', emoji: '👁️' },
  { id: 'riechen', label: 'Riechen', labelEn: 'Smell', emoji: '👃' },
  { id: 'schmecken', label: 'Schmecken', labelEn: 'Taste', emoji: '👅' },
  { id: 'gedanklich', label: 'Gedanklich', labelEn: 'Cognitive', emoji: '💭' },
];
