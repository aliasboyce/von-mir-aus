import { createKeyValueStore } from './storage/keyValueStore';
import { resourcesRepo } from '../features/resources/resourcesRepo';
import { bridgesRepo } from '../features/bridges/bridgesRepo';
import { networkRepo } from '../features/safetyNet/networkRepo';
import { safetyPlansRepo } from '../features/safetyPlan/safetyPlansRepo';
import { EXAMPLE_REVISIONS } from '../data/seed/exampleRevisions';
import { DEMO_RESOURCES, DBT_SKILL_RESOURCES, STARTER_AKTIVITAETEN } from '../data/seed/resources.seed';

/**
 * „Beispiele durchsehen“ (11.11.2026): Beispiele, die überarbeitet wurden, kommen auch bei bestehenden Daten an –
 * aber nur dort, wo der gespeicherte Text noch genau dem alten Beispiel entspricht. Alles, was jemand selbst
 * geändert hat, bleibt unberührt.
 */
const flag = createKeyValueStore<boolean>('migration-example-cleanup-v1', false);

/** Alte Starter-Ressourcen: waren zwischenzeitlich in Skill-Kategorien einsortiert, gehören aber zu Ort/Musik/Text/Hilfsmittel. */
const STARTER_BACK: Record<string, { from: string; to: string }> = {
  res_waldspaziergang: { from: 'emotionsregulation', to: 'natur' },
  res_klavier: { from: 'stresstoleranz', to: 'musik' },
  res_atemzitat: { from: 'achtsamkeit', to: 'texte' },
  res_waermequelle: { from: 'stresstoleranz', to: 'komfort' },
};

/** Brücken, die eigentlich Einzelübungen/Ressourcen waren → ersetzt durch Skill/Ressource/Aktivität. */
const BRIDGE_TO_RESOURCE: Record<string, { levels: number; resId: string }> = {
  bridge_salamander_blick: { levels: 1, resId: 'res_skill_salamander_blick' },
  bridge_schulterkreisen: { levels: 1, resId: 'res_skill_schulterkreisen' },
  bridge_isometrischer_zug: { levels: 1, resId: 'res_skill_isometrischer_zug' },
  bridge_atem: { levels: 4, resId: 'res_skill_zum_atem_zurueck' },
  bridge_musik: { levels: 4, resId: 'res_musik_klang' },
  bridge_notiz: { levels: 4, resId: 'res_akt_aufschreiben' },
};

/** Netzwerk-Beispiele: alt → neu (nur wenn unverändert). */
const NET_OLD: Record<string, { name: string; role: string; category: string; next: { name: string; role?: string; category?: string } }> = {
  net_aerztin: { name: 'Ärztin', role: 'Fachärztliche Hilfe', category: 'person', next: { name: 'Fachärzt:in' } },
  net_psychotherapeutin: { name: 'Psychotherapeutin', role: 'Therapeutische Begleitung', category: 'person', next: { name: 'Psychotherapeut:in' } },
  net_hausaerztin: { name: 'Hausärztin', role: 'Erste Anlaufstelle', category: 'person', next: { name: 'Hausarztpraxis' } },
  net_freundin: { name: 'Freundin', role: 'Vertraute Person', category: 'person', next: { name: 'Vertraute Person', role: 'Zum Reden und Dasein' } },
  net_katze: { name: 'Meine Katze', role: 'Nähe & Trost', category: 'person', next: { name: 'Ein Tier, das mir guttut', category: 'ressource' } },
};
const NET_UNMARK_IMPORTANT = ['net_aerztin', 'net_psychotherapeutin', 'net_freundin'];

export function migrateExampleCleanup() {
  if (flag.get()) return;

  // 1) überarbeitete Beschreibungen/Titel
  EXAMPLE_REVISIONS.forEach((rev) => {
    const r = resourcesRepo.getById(rev.id);
    if (!r) return;
    if (r[rev.field] === rev.old) resourcesRepo.save({ ...r, [rev.field]: rev.new });
  });

  // 2) Starter-Ressourcen wieder in ihre richtige Schublade
  Object.entries(STARTER_BACK).forEach(([id, m]) => {
    const r = resourcesRepo.getById(id);
    if (r && r.category === m.from) resourcesRepo.save({ ...r, category: m.to, subcategory: undefined });
  });

  // 3) neue Ressourcen nachliefern (Musik & Klang, Etwas aufschreiben, neue Skills)
  [...DEMO_RESOURCES, ...STARTER_AKTIVITAETEN, ...DBT_SKILL_RESOURCES]
    .filter((r) => ['res_musik_klang', 'res_akt_aufschreiben', 'res_skill_salamander_blick', 'res_skill_schulterkreisen', 'res_skill_isometrischer_zug', 'res_skill_zum_atem_zurueck'].includes(r.id))
    .forEach((r) => {
      if (!resourcesRepo.getById(r.id)) resourcesRepo.save(r);
    });

  // 4) die sechs Brücken: nur unveränderte werden entfernt; Favorit und Verknüpfungen im Sicherheitsplan wandern mit
  const removedToNew: Record<string, string> = {};
  bridgesRepo.getAll().forEach((b) => {
    const m = BRIDGE_TO_RESOURCE[b.id];
    if (!m || b.isCustom || b.levels.length !== m.levels) return;
    const target = resourcesRepo.getById(m.resId);
    if (!target) return;
    if (b.favorite && !target.favorite) resourcesRepo.save({ ...target, favorite: true });
    bridgesRepo.remove(b.id);
    removedToNew[b.id] = m.resId;
  });
  if (Object.keys(removedToNew).length) {
    safetyPlansRepo.getAll().forEach((p) => {
      if (!p.linkedByTier) return;
      let changed = false;
      const next = { ...p.linkedByTier } as typeof p.linkedByTier;
      (Object.keys(next) as (keyof typeof next)[]).forEach((tier) => {
        const t = next[tier];
        const gone = (t.bridgeIds ?? []).filter((id) => removedToNew[id]);
        if (!gone.length) return;
        changed = true;
        const resIds = [...(t.resourceIds ?? [])];
        gone.forEach((id) => {
          if (!resIds.includes(removedToNew[id])) resIds.push(removedToNew[id]);
        });
        next[tier] = { ...t, bridgeIds: (t.bridgeIds ?? []).filter((id) => !removedToNew[id]), resourceIds: resIds };
      });
      if (changed) safetyPlansRepo.save({ ...p, linkedByTier: next });
    });
  }

  // 5) Netzwerk-Beispiele: neutrale Namen, keine „wichtig“-Markierung (nur unveränderte Beispiele)
  networkRepo.getAll().forEach((e) => {
    if (!e.isExample) return;
    const untouched = !e.phone && !e.email && !e.description && !e.note && !e.whatHelps && !e.photoDataUrl;
    if (!untouched) return;
    if (e.id === 'net_freund' && e.name === 'Freund') {
      networkRepo.remove(e.id);
      return;
    }
    const old = NET_OLD[e.id];
    let next = e;
    if (old && e.name === old.name && e.role === old.role && e.category === old.category) {
      next = { ...next, name: old.next.name, role: old.next.role ?? next.role, category: (old.next.category ?? next.category) as typeof e.category };
    }
    if (NET_UNMARK_IMPORTANT.includes(e.id) && next.isImportantContact) next = { ...next, isImportantContact: false };
    if (next !== e) networkRepo.save(next);
  });

  flag.set(true);
}
