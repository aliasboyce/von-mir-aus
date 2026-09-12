import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { TensionScale } from './TensionScale';
import { SURVIVAL_STATE_META } from '../zugang/zugangContent';
import type { TensionEntry, ZugangSurvivalState } from '../../data/types';

interface TensionEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (value: number, time: string, survivalState?: ZugangSurvivalState) => void;
  onDelete?: () => void;
  editing?: TensionEntry | null;
}

const SURVIVAL_STATE_ORDER: ZugangSurvivalState[] = ['verbunden', 'mobilisiert', 'flucht', 'kampf', 'angepasst', 'erstarren', 'kollaps'];

function nowTimeString(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * "Anspannungsskala + Zustandsauswahl zusammenfuehren"-Auftrag — two
 * short steps in one flow: first the 0-100% tension scale (color-coded
 * per the clinical thresholds, see TensionScale.tsx), then an optional
 * "which state specifically" pick from the same seven states Zugang
 * uses. The state step is skippable (a person may only want the quick
 * percentage) — tapping "Weiter" without picking one just saves the
 * percentage alone, matching this modal's original "one slider, no
 * mandatory form" spirit.
 */
export function TensionEntryModal({ open, onClose, onSave, onDelete, editing }: TensionEntryModalProps) {
  const t = useT();
  const [step, setStep] = useState<'scale' | 'state'>('scale');
  const [value, setValue] = useState(editing?.value ?? 50);
  const [survivalState, setSurvivalState] = useState<ZugangSurvivalState | undefined>(editing?.survivalState);
  const [time, setTime] = useState(editing ? new Date(editing.createdAt).toTimeString().slice(0, 5) : nowTimeString());

  function handleClose() {
    setStep('scale');
    onClose();
  }

  function handleSave() {
    onSave(value, time, survivalState);
    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title={editing ? t.tension.editTitle : t.tension.addTitle}>
      {step === 'scale' ? (
        <div className="flex flex-col gap-5">
          <TensionScale value={value} onChange={setValue} descriptionStyle="gentle" />

          <label className="flex items-center justify-between">
            <span className="text-[14px] text-[var(--color-text)]">{t.tension.timeLabel}</span>
            <input type="time" className="input" style={{ width: 110 }} value={time} onChange={(e) => setTime(e.target.value)} />
          </label>

          <Button fullWidth onClick={() => setStep('state')}>
            {t.common.next}
          </Button>
          {editing && onDelete && (
            <button onClick={onDelete} className="text-[13px] text-[var(--color-danger)] text-center">
              {t.common.delete}
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="text-[14px] text-[var(--color-text)]">{t.tension.whichStateTitle}</p>
          <p className="text-[12px] text-[var(--color-text-faint)] -mt-2">{t.tension.whichStateHint}</p>

          <div className="grid grid-cols-2 gap-2">
            {SURVIVAL_STATE_ORDER.map((s) => {
              const meta = SURVIVAL_STATE_META[s];
              const isSelected = survivalState === s;
              return (
                <button
                  key={s}
                  onClick={() => setSurvivalState(isSelected ? undefined : s)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-[var(--radius-md)] border text-left"
                  style={{
                    borderColor: isSelected ? 'var(--color-primary)' : 'var(--color-border)',
                    background: isSelected ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  }}
                >
                  <span className="text-[16px]">{meta.emoji}</span>
                  <span className="text-[13px] text-[var(--color-text)]">{meta.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex gap-2 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setStep('scale')}>
              {t.common.back}
            </Button>
            <Button className="flex-1" onClick={handleSave}>
              {t.common.save}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
