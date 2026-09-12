import { useState } from 'react';
import { Shuffle, Plus, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { BRIDGE_IMPULSES, type BridgeImpulse } from '../../data/seed/bridgeImpulses.seed';
import { bridgesRepo } from './bridgesRepo';
import { BRIDGE_CATEGORY_META, BRIDGE_CATEGORY_ORDER } from './bridgeMeta';
import { createId } from '../../services/storage/repository';
import { getAdoptedBridgeImpulses, markBridgeImpulseAdopted } from '../../services/adoptedImpulsesStore';
import type { Bridge } from '../../data/types';
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
    const { impulseId, ...rest } = current;
    const bridge: Bridge = { ...rest, id: createId('bridge') };
    bridgesRepo.save(bridge);
    markBridgeImpulseAdopted(impulseId);
    setAdopted(true);
    onAdopted();
    setTimeout(() => {
      setAdopted(false);
      onClose();
    }, 1200);
  }

  // Defensive fallback: if a category value ever doesn't exist in
  // BRIDGE_CATEGORY_META (e.g. new content shipped before this file
  // was updated), fall back to the first known category rather than
  // crashing the whole modal — the exact failure mode found and fixed
  // during the "Bruecken-Kategorien neu ordnen"-Auftrag.
  const CategoryMeta = BRIDGE_CATEGORY_META[current.category] ?? BRIDGE_CATEGORY_META[BRIDGE_CATEGORY_ORDER[0]];

  return (
    <Modal open={open} onClose={onClose} title={t.bridges.discoverTitle} subtitle={t.bridges.discoverSubtitle}>
      <div className="flex flex-col gap-4">
        <PhotoBackground src={current.image} className="h-32 rounded-[var(--radius-lg)] bg-cover bg-center" />
        <div>
          <span className="inline-block text-[11px] font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-2.5 py-1 mb-2">
            {CategoryMeta.label(t)}
          </span>
          <h3 className="text-[17px] text-[var(--color-text)] mb-1">{current.title}</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">{current.description}</p>
        </div>
        <div className="flex flex-col gap-2">
          {current.levels.map((lvl) => (
            <div key={lvl.level} className="flex items-start gap-2 text-[13px]">
              <span className="w-5 h-5 rounded-full bg-[var(--color-surface-muted)] text-[var(--color-text-muted)] flex items-center justify-center text-[11px] flex-shrink-0 mt-0.5">
                {lvl.level}
              </span>
              <span>
                <span className="text-[var(--color-text)]">{lvl.title}</span>
                <span className="block text-[var(--color-text-muted)]">{lvl.description}</span>
              </span>
            </div>
          ))}
        </div>
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
