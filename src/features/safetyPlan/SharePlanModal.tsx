import { useState } from 'react';
import { FileDown, Printer, Share2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useSettings } from '../../state/SettingsContext';
import { planTexts } from './planTexts';

export type PdfParts = { personal: boolean; plan: boolean; clinic: boolean };

interface SharePlanModalProps {
  open: boolean;
  onClose: () => void;
  planName: string;
  parts: PdfParts;
  onPartsChange: (p: PdfParts) => void;
  hasPersonal: boolean;
  hasClinic: boolean;
  onPdf: () => Promise<boolean>;
  onPrint: () => void;
  onText: () => void;
}

/**
 * "Es soll was sein, was man anklickt, was mit drauf soll oder nicht – bei
 * jedem Sicherheitsplan individuell neu entscheidbar." Auch ein Plan ohne
 * die persönlichen Angaben und ohne den Klinik-Teil ist als PDF möglich.
 */
export function SharePlanModal({ open, onClose, planName, parts, onPartsChange, hasPersonal, hasClinic, onPdf, onPrint, onText }: SharePlanModalProps) {
  const { settings } = useSettings();
  const T = planTexts(settings.language);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const none = !parts.personal && !parts.plan && !parts.clinic;

  const rows: { key: keyof PdfParts; label: string; empty: boolean }[] = [
    { key: 'plan', label: T.partPlan, empty: false },
    { key: 'personal', label: T.partPersonal, empty: !hasPersonal },
    { key: 'clinic', label: T.partClinic, empty: !hasClinic },
  ];

  async function makePdf() {
    setBusy(true);
    setError('');
    const ok = await onPdf();
    setBusy(false);
    if (!ok) setError(T.pdfFailed);
  }

  return (
    <Modal open={open} onClose={onClose} title={`${T.shareTitle} · ${planName}`}>
      <div className="flex flex-col gap-4" data-testid="share-plan-modal">
        <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{T.shareIntro}</p>
        <div className="flex flex-col gap-2">
          {rows.map((r) => (
            <label
              key={r.key}
              className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3.5 py-3 cursor-pointer"
              style={{ opacity: r.empty && !parts[r.key] ? 0.7 : 1 }}
            >
              <input
                type="checkbox"
                className="w-5 h-5 flex-shrink-0"
                checked={parts[r.key]}
                onChange={(e) => onPartsChange({ ...parts, [r.key]: e.target.checked })}
                data-testid={`part-${r.key}`}
              />
              <span className="flex-1">
                <span className="block text-[14px] text-[var(--color-text)]">{r.label}</span>
                {r.empty && <span className="block text-[12px] text-[var(--color-text-faint)]">{T.partEmpty}</span>}
              </span>
            </label>
          ))}
        </div>
        {none && <p className="text-[12.5px] text-[var(--color-danger)]">{T.nothingSelected}</p>}
        {error && <p className="text-[12.5px] text-[var(--color-danger)]" role="alert">{error}</p>}
        <div className="flex flex-col gap-2">
          <Button fullWidth icon={<FileDown size={16} />} disabled={none || busy} onClick={makePdf} data-testid="share-pdf">
            {T.makePdf}
          </Button>
          <div className="flex gap-2">
            <Button fullWidth variant="secondary" icon={<Printer size={16} />} disabled={none || busy} onClick={onPrint} data-testid="share-print">
              {T.print}
            </Button>
            <Button fullWidth variant="secondary" icon={<Share2 size={16} />} disabled={none} onClick={onText} data-testid="share-text">
              {T.shareText}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
