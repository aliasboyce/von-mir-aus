import { ResourceTile, BridgeTile } from '../../components/shared/ItemTile';
import { useMemo, useState } from 'react';
import { Button } from '../../components/ui/Button';
import { FitSummary } from '../../components/shared/FitSummary';
import { useT } from '../../i18n';
import { useFitFilter } from '../../state/fitFilterStore';
import { availableChannels, filterByFit, isFitFilterActive, subjectOfResource } from '../../content/fitCriteria';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { bridgeNeeds, needsForValues, resourcesForNeeds } from '../bridges/bridgeValues';
import { networkRepo } from '../safetyNet/networkRepo';
import { ACTION_EXAMPLES_DE } from './zugangContent';
import type { Bridge, Resource } from '../../data/types';
import { zl } from './zugangEn';

const FIRST = 6;
const MAX = 18;

interface Props {
  need: string[];
  obstacle: string[];
  connection: string[];
  bridgeId: string | null;
  setBridgeId: (id: string | null) => void;
  usedResources: { id: string; title: string }[];
  setUsedResources: (r: { id: string; title: string }[]) => void;
  action: string;
  setAction: (a: string) => void;
  onUseResources: () => void;
  onUseBridge: () => void;
}

/**
 * The page after "Was geht gerade?": Ressourcen and Brücken that match the
 * chosen need, value and what is possible right now — and two doors. "Direkt
 * zu den Ressourcen" (I roughly know what to do) or "Brücke nutzen" (I need
 * more guidance). Both save the pass first; only afterwards, once the
 * Ressourcen / the Brücke were used, "Wie war es danach?" comes.
 */
export function ZugangSuggestions({ need, obstacle, connection, bridgeId, setBridgeId, usedResources, setUsedResources, action, setAction, onUseResources, onUseBridge }: Props) {
  const t = useT();
  const z = t.zugang;
  const { filter } = useFitFilter();
  const openChannels = useMemo(() => availableChannels(filter.levels), [filter.levels]);
  const [showMore, setShowMore] = useState(false);

  const allResources = useMemo(() => resourcesRepo.getAll(), []);
  const allBridges = useMemo(() => bridgesRepo.getAll(), []);
  const contacts = useMemo(() => networkRepo.getAll().filter((e) => e.category === 'person').slice(0, 4), []);

  const needWords = useMemo(() => Array.from(new Set([...need, ...needsForValues(connection)])), [need, connection]);

  const { shown, total, hiddenByFilter } = useMemo(() => {
    const matched = resourcesForNeeds(needWords, allResources).map((m) => ({
      ...m,
      rank: m.score + (m.resource.favorite ? 0.75 : 0) + (openChannels.length === 0 ? 0 : (m.resource.accessChannels ?? []).filter((c) => openChannels.includes(c)).length * 0.5),
    }));
    const fit = filterByFit(matched, (m) => subjectOfResource(m.resource), filter).sort((a, b) => b.rank - a.rank);
    return { shown: fit, total: matched.length, hiddenByFilter: matched.length - fit.length };
  }, [needWords, allResources, filter, openChannels]);

  const favorites = useMemo(
    () => filterByFit(allResources.filter((r) => r.favorite && !shown.some((s) => s.resource.id === r.id)), subjectOfResource, filter).slice(0, 6),
    [allResources, shown, filter],
  );

  const scoredBridges = useMemo(() => {
    const picked = new Set([...need, ...obstacle]);
    const scored = allBridges.map((b) => ({
      bridge: b,
      matches:
        [...bridgeNeeds(b), ...(b.linkedObstacles ?? [])].filter((x) => picked.has(x)).length +
        (b.connectionTags ?? []).filter((v) => connection.includes(v)).length +
        (openChannels.length === 0 ? 0 : (b.accessChannels ?? []).filter((c) => openChannels.includes(c)).length),
    }));
    return { matching: scored.filter((s) => s.matches > 0).sort((a, b) => b.matches - a.matches), rest: scored.filter((s) => s.matches === 0) };
  }, [allBridges, need, obstacle, connection, openChannels]);

  function toggleResource(r: Resource) {
    const on = usedResources.some((u) => u.id === r.id);
    setUsedResources(on ? usedResources.filter((u) => u.id !== r.id) : [...usedResources, { id: r.id, title: r.title }]);
  }

  const resourceRow = (r: Resource, key: string) => {
    const on = usedResources.some((u) => u.id === r.id);
    return (
      <ResourceTile
        key={key}
        resource={r}
        onClick={() => toggleResource(r)}
        toggle
        selected={on}
        trailing={on ? <span className="text-[16px] text-[var(--color-primary)] pr-1" aria-hidden="true">✓</span> : undefined}
        extra={<FitSummary subject={subjectOfResource(r)} />}
      />
    );
  };

  const bridgeRow = (b: Bridge) => (
    <BridgeTile
      key={b.id}
      bridge={b}
      onClick={() => setBridgeId(bridgeId === b.id ? null : b.id)}
      toggle
      selected={bridgeId === b.id}
      subtitle={(b.connectionTags ?? []).slice(0, 3).join(' · ') || undefined}
      trailing={bridgeId === b.id ? <span className="text-[16px] text-[var(--color-primary)] pr-1" aria-hidden="true">✓</span> : undefined}
    />
  );

  const visibleResources = showMore ? shown.slice(0, MAX) : shown.slice(0, FIRST);
  const canUseResources = usedResources.length > 0;
  const canUseBridge = !!bridgeId;

  return (
    <div>
      {needWords.length > 0 && (
        <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed mb-4 text-center">
          {z.branchNeedSummary.replace('{need}', needWords.slice(0, 4).map(zl).join(', '))}
          {isFitFilterActive(filter) ? ` · ${z.suggestFilteredNote}` : ''}
        </p>
      )}

      <section className="mb-6" aria-label={z.suggestResourcesTitle}>
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{z.suggestResourcesTitle}</p>
        {shown.length === 0 ? (
          <div className="rounded-[var(--radius-lg)] p-3.5" style={{ background: 'var(--color-surface-muted)' }}>
            <p className="text-[13px] text-[var(--color-text)] leading-relaxed">
              {total > 0 && hiddenByFilter > 0 ? t.fit.noResultsHint : z.suggestNoResources}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">{visibleResources.map((m) => resourceRow(m.resource, m.resource.id))}</div>
            {shown.length > FIRST && !showMore && (
              <button type="button" onClick={() => setShowMore(true)} className="text-[12.5px] text-[var(--color-primary)] mt-2">
                {z.suggestMore} ({shown.length - FIRST})
              </button>
            )}
          </>
        )}
        {favorites.length > 0 && (
          <div className="flex flex-col gap-2 mt-3">
            <p className="text-[11.5px] text-[var(--color-text-faint)]">{t.accessWheel.favoriteResources}</p>
            {favorites.map((r) => resourceRow(r, `fav-${r.id}`))}
          </div>
        )}
      </section>

      <section className="mb-6" aria-label={z.suggestBridgesTitle}>
        <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{z.suggestBridgesTitle}</p>
        {allBridges.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-faint)]">{z.noBridgesYet}</p>
        ) : (
          <>
            {scoredBridges.matching.length > 0 && (
              <>
                <p className="text-[12px] text-[var(--color-text-faint)] mb-2">{z.matchingBridgesLabel}</p>
                <div className="flex flex-col gap-2.5 mb-3">{scoredBridges.matching.slice(0, 5).map((s) => bridgeRow(s.bridge))}</div>
              </>
            )}
            {(scoredBridges.rest.length > 0 || scoredBridges.matching.length > 5) && (
              <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-2">
                <summary className="text-[13px] text-[var(--color-text)] cursor-pointer list-none">
                  {z.moreBridgesLabel.replace('{count}', String(scoredBridges.rest.length + Math.max(0, scoredBridges.matching.length - 5)))}
                </summary>
                <div className="flex flex-col gap-2.5 mt-2.5">
                  {[...scoredBridges.matching.slice(5), ...scoredBridges.rest].map((s) => bridgeRow(s.bridge))}
                </div>
              </details>
            )}
          </>
        )}
      </section>

      <div className="flex flex-col gap-2.5 mb-3">
        <Button fullWidth onClick={onUseResources} disabled={!canUseResources} data-testid="door-resources">
          <span className="block">
            {z.doorResources}
            {canUseResources ? ` · ${z.suggestPickedCount.replace('{n}', String(usedResources.length))}` : ''}
          </span>
        </Button>
        <p className="text-[11.5px] text-[var(--color-text-faint)] -mt-1.5 text-center">{canUseResources ? z.doorResourcesHint : z.doorPickResources}</p>
        <Button fullWidth variant="secondary" onClick={onUseBridge} disabled={!canUseBridge} data-testid="door-bridge">
          {z.doorBridge}
        </Button>
        <p className="text-[11.5px] text-[var(--color-text-faint)] -mt-1.5 text-center">{canUseBridge ? z.doorBridgeHint : z.doorPickBridge}</p>
      </div>
      <p className="text-[11.5px] text-[var(--color-text-faint)] leading-relaxed text-center mb-6">{z.doorsSaveNote}</p>

      <details className="rounded-[var(--radius-lg)] border border-[var(--color-border)] px-3 py-2 mb-3">
        <summary className="text-[13px] text-[var(--color-text)] cursor-pointer list-none">{z.suggestOwnLabel}</summary>
        <div className="mt-3">
          {contacts.length > 0 && (
            <div className="mb-3">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{z.myContactsLabel}</p>
              <div className="flex flex-wrap gap-2">
                {contacts.map((c) => (
                  <button key={c.id} type="button" onClick={() => setAction(c.name)} className="px-3.5 py-2 rounded-full text-[14px]" style={{ background: action === c.name ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: action === c.name ? 'var(--color-surface)' : 'var(--color-text)' }}>
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{z.actionExamplesLabel}</p>
          <div className="flex flex-wrap gap-2">
            {ACTION_EXAMPLES_DE.map((a) => (
              <button key={a} type="button" onClick={() => setAction(a)} className="px-3.5 py-2 rounded-full text-[14px]" style={{ background: action === a ? 'var(--color-primary)' : 'var(--color-surface-muted)', color: action === a ? 'var(--color-surface)' : 'var(--color-text)' }}>
                {a}
              </button>
            ))}
          </div>
          <input className="input mt-3" placeholder={z.actionOwnPlaceholder} value={action} onChange={(e) => setAction(e.target.value)} />
        </div>
      </details>
      <p className="text-[11.5px] text-[var(--color-text-faint)] text-center">
        {z.suggestSkipNote}
      </p>
    </div>
  );
}
