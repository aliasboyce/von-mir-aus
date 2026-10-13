import { ResourceTile } from '../../components/shared/ItemTile';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { WesenInfoButton } from '../../components/companion/WesenInfoButton';
import { INFO_NUDGE, NUDGE_LINES } from '../../components/companion/wesenFunctions';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { useFitFilter } from '../../state/fitFilterStore';
import { filterByFit, subjectOfResource } from '../../content/fitCriteria';
import { resourcesRepo } from '../resources/resourcesRepo';
import { resourceOpenPath } from '../zugang/ZugangFollowUpPages';
import { RESOURCE_CATEGORY_TO_GROUP } from '../resources/resourceMeta';
import { createKeyValueStore } from '../../services/storage/keyValueStore';

interface NudgeState { slot: string; dismissed: boolean; shuffle: number }
const store = createKeyValueStore<NudgeState | null>('resource-nudge', null);

/** Four slots over the day; each one may or may not show a nudge (deterministic per day, so it does not flicker). */
function currentSlot(now = new Date()): string {
  const h = now.getHours();
  const part = h < 11 ? 0 : h < 14 ? 1 : h < 18 ? 2 : 3;
  const d = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${d}-${part}`;
}

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

/**
 * "Hilfsmittel in den Weg legen": with dissociation, stress or exhaustion
 * what one HAS is often not retrievable — so the Wesen puts one of the
 * person's own Ressourcen in view now and then, spread over the day ("hey, du
 * hast da übrigens …"). Nothing to decide or remember; "Gerade nicht" hides it
 * until the next slot, and it can be switched off in the settings.
 */
export function ResourceNudgeCard() {
  const t = useT();
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const { filter } = useFitFilter();
  const slot = currentSlot();
  const [state, setState] = useState<NudgeState | null>(() => {
    const s = store.get();
    return s && s.slot === slot ? s : { slot, dismissed: false, shuffle: 0 };
  });

  const enabled = settings.resourceNudgeEnabled !== false && settings.brainEnabled && settings.brainState === 'awake';
  const shows = hash(`show-${slot}`) < 0.8;

  const pick = useMemo(() => {
    if (!enabled || !shows || !state || state.dismissed) return null;
    const all = resourcesRepo.getAll();
    const fitting = filterByFit(all, subjectOfResource, filter);
    const pool = (fitting.length > 0 ? fitting : all).flatMap((r) => (r.favorite ? [r, r] : [r]));
    if (pool.length === 0) return null;
    const r = pool[Math.floor(hash(`res-${slot}-${state.shuffle}`) * pool.length)];
    const line = NUDGE_LINES[Math.floor(hash(`line-${slot}-${state.shuffle}`) * NUDGE_LINES.length)];
    return { resource: r, text: (en ? line.en : line.de).replace('{res}', r.title) };
  }, [enabled, shows, state, filter, slot, en]);

  if (!pick || !state) return null;

  function update(next: NudgeState) {
    store.set(next);
    setState(next);
  }

  const isSkill = RESOURCE_CATEGORY_TO_GROUP[pick.resource.category] === 'faehigkeiten';
  const openPath = resourceOpenPath(pick.resource);

  return (
    <Card className="mb-5 animate-in" data-testid="resource-nudge">
      <div className="flex items-start gap-3">
        <InlineCompanionNote />
        <div className="flex-1 min-w-0">
          <p className="text-[14.5px] text-[var(--color-text)] leading-relaxed mb-2.5">{pick.text}</p>
          <Link to={openPath} className="block mb-2.5" aria-hidden="true" tabIndex={-1}>
            <ResourceTile resource={pick.resource} subtitle={pick.resource.description || undefined} compact />
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <Link to={openPath} className="px-3.5 py-1.5 rounded-full text-[13px] bg-[var(--color-primary)] text-[var(--color-surface)]">
              {isSkill ? (en ? 'Start' : 'Starten') : (en ? 'Look' : 'Ansehen')}
            </Link>
            <button type="button" onClick={() => update({ ...state, shuffle: state.shuffle + 1 })} className="px-3 py-1.5 rounded-full text-[13px] bg-[var(--color-surface-muted)] text-[var(--color-text)]">
              {en ? 'Another one' : 'Eine andere'}
            </button>
            <button type="button" onClick={() => update({ ...state, dismissed: true })} className="text-[12.5px] text-[var(--color-text-faint)] underline px-1">
              {en ? 'Not now' : 'Gerade nicht'}
            </button>
          </div>
        </div>
        <WesenInfoButton info={INFO_NUDGE} className="w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-faint)] flex-shrink-0" />
      </div>
      <span className="sr-only">{t.common.help}</span>
    </Card>
  );
}
