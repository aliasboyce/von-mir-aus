/**
 * Zones (zone1..zone6) for the starter skills whose use does not follow
 * their module's default. Used both for fresh installs
 * (assignDefaultZoneIdsToSkills) and once for existing data
 * (services/migrations.ts — only where the zones still equal the old
 * automatic defaults, so anything the person edited is left alone).
 *
 * Zone 6 (Rueckzug / Hypoarousal) needs body-led skills that bring
 * someone BACK into the room — orienting, sensing weight and sound, warmth,
 * touch, cold, movement. They were all tagged for zone 5 only, which
 * meant the Rueckzug landing page had nothing to offer once the zone
 * filter stopped showing untagged items everywhere.
 */
export const SEED_SKILL_ZONES: Record<string, string[]> = {
  res_skill_tipp: ['zone5', 'zone6'],
  res_skill_54321: ['zone4', 'zone5', 'zone6'],
  res_skill_voo_atem: ['zone4', 'zone5', 'zone6'],
  res_skill_gewichtswahrnehmung: ['zone4', 'zone5', 'zone6'],
  res_skill_auditives_verankern: ['zone4', 'zone5', 'zone6'],
  res_skill_schmetterling_klopf: ['zone4', 'zone5', 'zone6'],
  res_skill_self_holding: ['zone4', 'zone5', 'zone6'],
  res_skill_peripheres_sehen: ['zone4', 'zone5', 'zone6'],
  res_skill_shaking: ['zone5', 'zone6'],
  res_waermequelle: ['zone4', 'zone5', 'zone6'],
  res_klavier: ['zone4', 'zone5'],
};
