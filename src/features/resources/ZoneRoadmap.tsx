import { Link } from 'react-router-dom';
import { useT } from '../../i18n';
import { buildRoadmap, valueForRoadmap } from './zoneRoadmap';
import { safetyPlansRepo } from '../safetyPlan/safetyPlansRepo';
import { tierForValue } from '../safetyPlan/tierForValue';
import { resourcesRepo } from './resourcesRepo';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';

function resourceLink(id: string): string {
  const r = resourcesRepo.getById(id);
  return r && RESOURCE_CATEGORY_TO_GROUP[r.category] === 'faehigkeiten' ? `/entdecken/ressourcen/skill-start/${id}` : `/entdecken/ressourcen/hilfsmittel?open=${id}`;
}

/**
 * The personal zone roadmap shown where "zu den Skills" lands. First comes
 * the person's OWN plan — the warning signs of the matching safety-plan
 * tier that have a skill or tool linked ("Wenn ..., dann ...") plus what
 * they chose for that tier — then what has helped before at a similar
 * tension (see zoneRoadmap.ts). Nothing is rendered when there is neither,
 * so the normal list is simply there.
 */
export function ZoneRoadmap({ zoneId, explicitValue }: { zoneId: string | null; explicitValue: string | null }) {
  const t = useT();
  const value = valueForRoadmap(zoneId, explicitValue != null ? Number(explicitValue) : null);
  if (value == null) return null;
  const items = buildRoadmap(value);
  const tier = tierForValue(value);
  const plans = tier ? safetyPlansRepo.getAll() : [];
  const ifThen = plans.flatMap((p) =>
    p.warningSignals
      .filter((w) => w.tier === tier && w.resourceId && resourcesRepo.getById(w.resourceId))
      .map((w) => ({ id: w.id, sign: w.text, resId: w.resourceId as string })),
  );
  const shownIds = new Set(ifThen.map((x) => x.resId));
  const chosen = plans.flatMap((p) => (tier ? p.linkedByTier?.[tier]?.resourceIds ?? [] : [])).filter((id, i, a) => a.indexOf(id) === i && !shownIds.has(id) && resourcesRepo.getById(id));
  if (items.length === 0 && ifThen.length === 0 && chosen.length === 0) return null;
  return (
    <div className="rounded-[var(--radius-lg)] p-4 mb-4" style={{ background: 'var(--color-surface)', border: '1.5px solid var(--color-primary)' }}>
      {(ifThen.length > 0 || chosen.length > 0) && (
        <>
          <p className="text-[13.5px] font-semibold text-[var(--color-text)] mb-2">{t.roadmap.planTitle}</p>
          <div className="flex flex-col gap-2 mb-3">
            {ifThen.map((x) => (
              <Link key={x.id} to={resourceLink(x.resId)} className="block rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }}>
                <span className="block text-[12.5px] text-[var(--color-text-muted)]">{t.roadmap.ifThen.replace('{sign}', x.sign)}</span>
                <span className="block text-[14.5px] text-[var(--color-text)]">{resourcesRepo.getById(x.resId)!.title}</span>
              </Link>
            ))}
            {chosen.map((id) => (
              <Link key={id} to={resourceLink(id)} className="block rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }}>
                <span className="block text-[12.5px] text-[var(--color-text-muted)]">{t.roadmap.fromPlan}</span>
                <span className="block text-[14.5px] text-[var(--color-text)]">{resourcesRepo.getById(id)!.title}</span>
              </Link>
            ))}
          </div>
        </>
      )}
      {items.length > 0 && (
        <>
          <p className="text-[13.5px] font-semibold text-[var(--color-text)] mb-2">{t.roadmap.title}</p>
          <div className="flex flex-col gap-2">
            {items.map((it) => (
              <Link key={it.key} to={it.to} className="block rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }}>
                <span className="block text-[12.5px] text-[var(--color-text-muted)]">{t.roadmap.line.replace('{v}', String(Math.round(value)))}</span>
                <span className="block text-[14.5px] text-[var(--color-text)]">
                  {it.title}, {it.before} → {it.after}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
