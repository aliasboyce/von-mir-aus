import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useT } from '../../i18n';
import { tierColorsStore } from './tierColorsStore';
import { TIER_SHORT_LABELS } from './tierMeta';
import { WARNING_TIER_ORDER } from './safetyPlansRepo';
import type { WarningTier } from '../../data/types';

interface TierColorEditorProps {
  open: boolean;
  onClose: () => void;
  onChange: () => void;
}

export function TierColorEditor({ open, onClose, onChange }: TierColorEditorProps) {
  const t = useT();
  const [colors, setColors] = useState(() => tierColorsStore.getAll());

  function setColor(tier: WarningTier, color: string) {
    tierColorsStore.setColor(tier, color);
    setColors(tierColorsStore.getAll());
    onChange();
  }

  return (
    <Modal open={open} onClose={onClose} title={t.safetyPlan.tierColorsTitle} subtitle={t.safetyPlan.tierColorsHint}>
      <div className="flex flex-col gap-4">
        {WARNING_TIER_ORDER.map((tier) => (
          <div key={tier} className="flex items-center gap-3">
            <label className="relative w-10 h-10 rounded-full flex-shrink-0 overflow-hidden cursor-pointer border border-[var(--color-border)]">
              <span className="absolute inset-0" style={{ background: colors[tier].color }} />
              <input
                type="color"
                value={colors[tier].color}
                onChange={(e) => setColor(tier, e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                aria-label={TIER_SHORT_LABELS[tier]}
              />
            </label>
            <span className="text-[14px] text-[var(--color-text)]">{TIER_SHORT_LABELS[tier]}</span>
          </div>
        ))}
      </div>
    </Modal>
  );
}
