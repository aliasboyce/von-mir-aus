import { useState } from 'react';
import { Shuffle, Plus, Check } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { RESOURCE_IMPULSES, type ResourceImpulse } from '../../data/seed/resourceImpulses.seed';
import { resourcesRepo } from './resourcesRepo';
import { resourceCategoryLabel } from './resourceMeta';
import { createId } from '../../services/storage/repository';
import { getAdoptedResourceImpulses, markResourceImpulseAdopted } from '../../services/adoptedImpulsesStore';
import type { Resource } from '../../data/types';
import { PhotoBackground } from '../../components/shared/PhotoBackground';

interface DiscoverResourcesModalProps {
  open: boolean;
  onClose: () => void;
  onAdopted: () => void;
}

function randomImpulse(excludeId?: string): ResourceImpulse {
  const adopted = new Set(getAdoptedResourceImpulses());
  const notAdopted = RESOURCE_IMPULSES.filter((i) => !adopted.has(i.impulseId));
  const basePool = notAdopted.length > 0 ? notAdopted : RESOURCE_IMPULSES;
  const pool = basePool.filter((i) => i.impulseId !== excludeId);
  const source = pool.length > 0 ? pool : basePool;
  return source[Math.floor(Math.random() * source.length)];
}

export function DiscoverResourcesModal({ open, onClose, onAdopted }: DiscoverResourcesModalProps) {
  const t = useT();
  const [current, setCurrent] = useState(() => randomImpulse());
  const [adopted, setAdopted] = useState(false);

  function next() {
    setCurrent(randomImpulse(current.impulseId));
    setAdopted(false);
  }

  function adopt() {
    const { impulseId, ...rest } = current;
    const now = new Date().toISOString();
    const resource: Resource = { ...rest, id: createId('res'), createdAt: now, updatedAt: now };
    resourcesRepo.save(resource);
    markResourceImpulseAdopted(impulseId);
    setAdopted(true);
    onAdopted();
    setTimeout(() => {
      setAdopted(false);
      onClose();
    }, 1200);
  }

  return (
    <Modal open={open} onClose={onClose} title={t.resources.discoverTitle} subtitle={t.resources.discoverSubtitle}>
      <div className="flex flex-col gap-4">
        <PhotoBackground src={current.image} className="h-32 rounded-[var(--radius-lg)] bg-cover bg-center" />
        <div>
          <span className="inline-block text-[11px] font-medium bg-[var(--color-primary-soft)] text-[var(--color-primary)] rounded-full px-2.5 py-1 mb-2">
            {resourceCategoryLabel(t, current.category)}
          </span>
          <h3 className="text-[17px] text-[var(--color-text)] mb-1">{current.title}</h3>
          <p className="text-[13px] text-[var(--color-text-muted)]">{current.description}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Shuffle size={15} />} onClick={next}>
            {t.resources.discoverAnother}
          </Button>
          <Button icon={adopted ? <Check size={15} /> : <Plus size={15} />} onClick={adopt} disabled={adopted}>
            {adopted ? t.resources.discoverAdopted : t.resources.discoverAdopt}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
