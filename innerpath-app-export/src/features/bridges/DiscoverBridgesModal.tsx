import { useState } from 'react';
import { Shuffle, Plus, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { BRIDGE_IMPULSES, type BridgeImpulse } from '../../data/seed/bridgeImpulses.seed';
import { bridgesRepo } from './bridgesRepo';
import { resourcesRepo } from '../resources/resourcesRepo';
import { valuesForLegacyCategory } from './bridgeValues';
import { createId } from '../../services/storage/repository';
import { getAdoptedBridgeImpulses, markBridgeImpulseAdopted } from '../../services/adoptedImpulsesStore';
import type { Bridge, StepExtras } from '../../data/types';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

interface DiscoverBridgesModalProps {
  open: boolean;
  onClose: () => void;
  onAdopted: () => void;
}

/** Never re-suggests an impulse the person has already adopted — once
 * all remaining ones are exhausted, falls back to the full pool rather
 * than showing an empty state, since re-seeing an old idea occasionally
 * is a far smaller cost than the discovery feature going silent. */
function randomImpulse(excludeId?: string): BridgeImpulse {
  const adopted = new Set(getAdoptedBridgeImpulses());
  const notAdopted = BRIDGE_IMPULSES.filter((i) => !adopted.has(i.impulseId));
  const basePool = notAdopted.length > 0 ? notAdopted : BRIDGE_IMPULSES;
  const pool = basePool.filter((i) => i.impulseId !== excludeId);
  const source = pool.length > 0 ? pool : basePool;
  return source[Math.floor(Math.random() * source.length)];
}

export function DiscoverBridgesModal({ open, onClose, onAdopted }: DiscoverBridgesModalProps) {
  const t = useT();
  const [current, setCurrent] = useState(() => randomImpulse());
  const [adopted, setAdopted] = useState(false);

  function next() {
    setCurrent(randomImpulse(current.impulseId));
    setAdopted(false);
  }

  function adopt() {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { impulseId, whyThis, ...rest } = current;
    // only attach what still exists in the person's own resources
    const existing = new Set(resourcesRepo.getAll().map((r) => r.id));
    const keep = (ids?: string[]) => (ids ?? []).filter((id) => existing.has(id));
    const levels = rest.levels.map((l) => {
      if (!l.extras) return l;
      const x: StepExtras = {
        skillIds: keep(l.extras.skillIds),
        hilfsmittelIds: keep(l.extras.hilfsmittelIds),
        ortIds: keep(l.extras.ortIds),
        aktivitaetIds: keep(l.extras.aktivitaetIds),
      };
      const cleaned = Object.fromEntries(Object.entries(x).filter(([, v]) => (v as string[]).length > 0)) as StepExtras;
      return { ...l, extras: Object.keys(cleaned).length > 0 ? cleaned : undefined };
    });
    const bridge: Bridge = { ...rest, levels, connectionTags: rest.connectionTags ?? valuesForLegacyCategory(rest.category), id: createId('bridge') };
    bridgesRepo.save(bridge);
    markBridgeImpulseAdopted(impulseId);
    setAdopted(true);
    onAdopted();
    setTimeout(() => {
      setAdopted(false);
      onClose();
    }, 1200);
  }

  const valueLabels = (current.connectionTags ?? valuesForLegacyCategory(current.category)).join(' · ');

  return (
    <Modal open={open} onClose={onClose} title={t.bridges.discoverTitle} subtitle={t.bridges.discoverSubtitle}>
      <div className="flex flex-col gap-4">
        <PhotoBackground src={current.image} className="h-32 rounded-[var(--radius-lg)] bg-cover bg-center" />
        <div>
          <span className="inline-block text-[11px] font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-2.5 py-1 mb-2.5">
            {t.bridges.discoverValueLabel} {valueLabels}
          </span>
          <h3 className="text-[18px] text-[var(--color-text)] mb-2">{current.title}</h3>
          <p className="text-[13.5px] text-[var(--color-text)] leading-relaxed mb-2">{current.description}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed">{current.whyThis}</p>
        </div>
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-faint)] mb-2.5">{t.bridges.discoverStepsLabel}</p>
          <div className="flex flex-col gap-3">
            {current.levels.map((lvl) => {
              const extraTitles = [lvl.extras?.skillIds, lvl.extras?.hilfsmittelIds, lvl.extras?.ortIds, lvl.extras?.aktivitaetIds]
                .flatMap((ids) => ids ?? [])
                .map((id) => resourcesRepo.getById(id)?.title)
                .filter((x): x is string => Boolean(x));
              return (
                <div key={lvl.level} className="flex items-start gap-3 text-[13px]">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center text-[12px] font-medium flex-shrink-0 mt-0.5">
                    {lvl.level}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[14px] font-medium text-[var(--color-text)]">{lvl.title}</span>
                    <span className="block text-[13px] text-[var(--color-text-muted)] leading-relaxed mt-0.5">{lvl.description}</span>
                    {extraTitles.length > 0 && (
                      <span className="block text-[12px] text-[var(--color-primary)] mt-1">
                        {t.bridges.discoverStepWith} {extraTitles.join(' · ')}
                      </span>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {current.tip && <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed rounded-[var(--radius-lg)] bg-[var(--color-surface-muted)] px-3.5 py-3">💡 {current.tip}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Shuffle size={15} />} onClick={next}>
            {t.bridges.discoverAnother}
          </Button>
          <Button icon={adopted ? <Check size={15} /> : <Plus size={15} />} onClick={adopt} disabled={adopted}>
            {adopted ? t.bridges.discoverAdopted : t.bridges.discoverAdopt}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
