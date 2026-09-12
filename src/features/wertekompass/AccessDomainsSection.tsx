import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { LinkedItemsPicker } from '../safetyPlan/LinkedItemsPicker';
import { useT } from '../../i18n';
import { accessWheelRepo, seedAccessWheelIfEmpty, normalizeWheelEntry } from '../accessWheel/accessWheelRepo';
import { ACCESS_WHEEL_DOMAIN_META } from '../accessWheel/accessWheelMeta';
import { AccessWheelChart } from '../accessWheel/AccessWheelChart';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { ACCESS_WHEEL_DOMAIN_ORDER } from '../../data/types';
import type { AccessWheelEntry } from '../../data/types';

seedAccessWheelIfEmpty();

/**
 * Audit follow-up, Problem 4 — the former standalone Zugangsrad page's
 * seven-domain sliders (Wissen/Fähigkeiten/Ressourcen/Menschen/Orte/
 * Handlung/Strategien), moved here as a collapsible section rather than
 * kept as a second, disconnected page. All underlying logic (repo,
 * chart, domain meta, three-level access buttons, linked
 * resources/bridges/contacts) is reused unchanged — only the container
 * changed. Collapsed by default so it doesn't compete with the values
 * content above; this is a related but distinct question ("wie
 * zugänglich sind mir gerade verschiedene Lebensbereiche?" rather than
 * "was ist mir gerade wichtig?").
 */
export type AccessLevel = 'ja' | 'eher_schwer' | 'gerade_nicht';
export const ACCESS_LEVEL_ORDER: AccessLevel[] = ['gerade_nicht', 'eher_schwer', 'ja'];
export const ACCESS_LEVEL_VALUE: Record<AccessLevel, number> = {
  gerade_nicht: 10,
  eher_schwer: 50,
  ja: 90,
};
export function accessLevelFromValue(value: number): AccessLevel {
  if (value >= 70) return 'ja';
  if (value >= 35) return 'eher_schwer';
  return 'gerade_nicht';
}

export function AccessDomainsSection() {
  const t = useT();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<AccessWheelEntry[]>(() =>
    accessWheelRepo.getAll().map(normalizeWheelEntry),
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const allResources = useMemo(() => resourcesRepo.getAll(), []);
  const allBridges = useMemo(() => bridgesRepo.getAll(), []);
  const allContacts = useMemo(() => networkRepo.getAll().filter((e) => e.category === 'person'), []);

  function persist(updated: AccessWheelEntry) {
    accessWheelRepo.save(updated);
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }
  function setValue(entry: AccessWheelEntry, value: number) {
    persist({ ...entry, accessibility: value, updatedAt: new Date().toISOString() });
  }
  function updateLinked(entry: AccessWheelEntry, kind: 'linkedResourceIds' | 'linkedBridgeIds' | 'linkedContactIds', ids: string[]) {
    persist({ ...entry, [kind]: ids, updatedAt: new Date().toISOString() });
  }

  const orderedEntries = ACCESS_WHEEL_DOMAIN_ORDER.map(
    (domain) => entries.find((e) => e.domain === domain)!,
  ).filter(Boolean);

  const leastAccessible = [...orderedEntries].sort((a, b) => a.accessibility - b.accessibility)[0];
  const leastAccessibleMeta = leastAccessible ? ACCESS_WHEEL_DOMAIN_META[leastAccessible.domain] : null;
  const hasAnyLink =
    leastAccessible &&
    (leastAccessible.linkedResourceIds.length > 0 ||
      leastAccessible.linkedBridgeIds.length > 0 ||
      leastAccessible.linkedContactIds.length > 0);

  return (
    <Card className="mb-6">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <div>
          <p className="text-[14px] font-medium text-[var(--color-text)]">{t.accessWheel.title}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] mt-0.5">{t.accessWheel.subtitle}</p>
        </div>
        {open ? <ChevronUp size={16} className="text-[var(--color-text-faint)] flex-shrink-0" /> : <ChevronDown size={16} className="text-[var(--color-text-faint)] flex-shrink-0" />}
      </button>

      {open && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
          <p className="text-[12px] text-[var(--color-primary)] mb-3 leading-relaxed">{t.accessWheel.contrastNote}</p>
          <p className="text-[13px] text-[var(--color-text-faint)] mb-4">{t.accessWheel.hint}</p>

          <div className="flex items-center justify-center mb-6">
            <div style={{ maxWidth: 260 }}>
              <AccessWheelChart entries={orderedEntries} order={ACCESS_WHEEL_DOMAIN_ORDER} />
            </div>
          </div>

          {leastAccessible && leastAccessibleMeta && (
            <Card className="mb-5" style={{ borderColor: 'var(--color-primary)', borderWidth: 1.5 }}>
              <div className="flex items-start gap-3 mb-3">
                <InlineCompanionNote />
                <div className="flex-1">
                  <p className="text-[13px] text-[var(--color-text)]">
                    {t.accessWheel.nextStepIntro.replace('{domain}', leastAccessibleMeta.label(t))}
                  </p>
                </div>
              </div>
              {hasAnyLink ? (
                <div className="flex flex-col gap-3">
                  {leastAccessible.linkedResourceIds.length > 0 && (
                    <LinkedItemsPicker
                      title={t.safetyPlan.linkedResources}
                      linkedIds={leastAccessible.linkedResourceIds}
                      allItems={allResources.map((r) => ({ id: r.id, title: r.title, subtitle: r.description }))}
                      onChange={(ids) => updateLinked(leastAccessible, 'linkedResourceIds', ids)}
                      onOpenItem={(id) => navigate(`/entdecken/ressourcen?open=${id}`)}
                      emptyHint=""
                    />
                  )}
                  {leastAccessible.linkedBridgeIds.length > 0 && (
                    <LinkedItemsPicker
                      title={t.safetyPlan.linkedBridges}
                      linkedIds={leastAccessible.linkedBridgeIds}
                      allItems={allBridges.map((b) => ({ id: b.id, title: b.title, subtitle: b.description }))}
                      onChange={(ids) => updateLinked(leastAccessible, 'linkedBridgeIds', ids)}
                      onOpenItem={(id) => navigate(`/bruecken/${id}`)}
                      emptyHint=""
                    />
                  )}
                  {leastAccessible.linkedContactIds.length > 0 && (
                    <LinkedItemsPicker
                      title={t.safetyPlan.linkedContacts}
                      linkedIds={leastAccessible.linkedContactIds}
                      allItems={allContacts.map((c) => ({ id: c.id, title: c.name, subtitle: c.role }))}
                      onChange={(ids) => updateLinked(leastAccessible, 'linkedContactIds', ids)}
                      onOpenItem={(id) => navigate(`/sicherheit/netzwerk?open=${id}`)}
                      emptyHint=""
                    />
                  )}
                </div>
              ) : (
                <button
                  onClick={() => setExpandedId(leastAccessible.id)}
                  className="text-[13px] text-[var(--color-primary)] underline underline-offset-2"
                >
                  {t.accessWheel.nextStepEmptyCta}
                </button>
              )}
            </Card>
          )}

          <div className="flex flex-col gap-3">
            {orderedEntries.map((entry) => {
              const Meta = ACCESS_WHEEL_DOMAIN_META[entry.domain];
              const Icon = Meta.icon;
              const expanded = expandedId === entry.id;
              const linkCount = entry.linkedResourceIds.length + entry.linkedBridgeIds.length + entry.linkedContactIds.length;
              const currentLevel = accessLevelFromValue(entry.accessibility);
              return (
                <Card key={entry.id}>
                  <div className="flex items-center gap-2 mb-3 text-[14px] text-[var(--color-text)]">
                    <Icon size={16} className="text-[var(--color-primary)]" />
                    {Meta.label(t)}
                  </div>
                  <div className="flex gap-2 mb-2">
                    {ACCESS_LEVEL_ORDER.map((level) => (
                      <button
                        key={level}
                        onClick={() => setValue(entry, ACCESS_LEVEL_VALUE[level])}
                        aria-pressed={currentLevel === level}
                        className={[
                          'flex-1 rounded-[var(--radius-md)] py-2 text-[12px] text-center transition-colors',
                          currentLevel === level
                            ? 'bg-[var(--color-primary)] text-[var(--color-surface)]'
                            : 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
                        ].join(' ')}
                      >
                        {t.accessWheel.levels[level]}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setExpandedId(expanded ? null : entry.id)}
                    className="flex items-center gap-1 text-[12px] text-[var(--color-primary)]"
                  >
                    {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    {linkCount > 0 ? `${t.accessWheel.linkedCount} (${linkCount})` : t.accessWheel.addConcreteThings}
                  </button>
                  {expanded && (
                    <div className="flex flex-col gap-3 mt-3 pt-3 border-t border-[var(--color-border)]">
                      <LinkedItemsPicker
                        title={t.safetyPlan.linkedResources}
                        linkedIds={entry.linkedResourceIds}
                        allItems={allResources.map((r) => ({ id: r.id, title: r.title, subtitle: r.description }))}
                        onChange={(ids) => updateLinked(entry, 'linkedResourceIds', ids)}
                        onOpenItem={(id) => navigate(`/entdecken/ressourcen?open=${id}`)}
                        emptyHint={t.safetyPlan.linkedResourcesEmpty}
                      />
                      <LinkedItemsPicker
                        title={t.safetyPlan.linkedBridges}
                        linkedIds={entry.linkedBridgeIds}
                        allItems={allBridges.map((b) => ({ id: b.id, title: b.title, subtitle: b.description }))}
                        onChange={(ids) => updateLinked(entry, 'linkedBridgeIds', ids)}
                        onOpenItem={(id) => navigate(`/bruecken/${id}`)}
                        emptyHint={t.safetyPlan.linkedBridgesEmpty}
                      />
                      <LinkedItemsPicker
                        title={t.safetyPlan.linkedContacts}
                        linkedIds={entry.linkedContactIds}
                        allItems={allContacts.map((c) => ({ id: c.id, title: c.name, subtitle: c.role }))}
                        onChange={(ids) => updateLinked(entry, 'linkedContactIds', ids)}
                        onOpenItem={(id) => navigate(`/sicherheit/netzwerk?open=${id}`)}
                        emptyHint={t.safetyPlan.linkedContactsEmpty}
                      />
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
