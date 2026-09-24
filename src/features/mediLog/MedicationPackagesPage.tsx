import { useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Camera, AlertTriangle } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { mediLogRepo } from './mediLogRepo';
import { savedMedicationsRepo } from './savedMedicationsRepo';
import { medicationPackagesRepo } from './medicationPackagesRepo';
import { tabletsUsed, tabletsRemaining, daysUntilEmpty, lowStockLevel } from './medicationPackages';
import { resizeImageFile } from '../../services/imageResize';
import { createId } from '../../services/storage/repository';
import type { MedicationPackage } from '../../data/types';

/**
 * "Medi-Packungen eintragen"-Auftrag — a standalone page rather than
 * folding this into the already very large MediLogPage.tsx: package
 * (how much is left, when it'll run low) is a different question from
 * the day-to-day log, even though both work from the same entries.
 * Consumption is never entered by hand — it's always counted live
 * from the existing medi-log entries for that medication, so the
 * number here can never drift out of sync with the log itself.
 */
export function MedicationPackagesPage() {
  const t = useT();
  const navigate = useNavigate();
  const [packages, setPackages] = useState(() => medicationPackagesRepo.getAll());
  const medications = useMemo(() => savedMedicationsRepo.getAll(), []);
  const entries = useMemo(() => mediLogRepo.getAll(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [historyPkg, setHistoryPkg] = useState<MedicationPackage | null>(null);

  function medName(id: string) {
    return medications.find((m) => m.id === id)?.name ?? '?';
  }

  const sorted = [...packages].sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime());

  return (
    <div className="animate-in">
      <TopBar onBack={() => navigate(-1)} />
      <div className="px-4 pb-8">
        <h1 className="text-[20px] font-semibold text-[var(--color-text)] mb-1">{t.medPackages.title}</h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mb-4">{t.medPackages.subtitle}</p>

        <Button onClick={() => setFormOpen(true)} className="mb-4">
          <Plus size={16} /> {t.medPackages.newPackageCta}
        </Button>

        {sorted.length === 0 ? (
          <EmptyState title={t.medPackages.empty} />
        ) : (
          <div className="flex flex-col gap-2.5">
            {sorted.map((pkg) => {
              const remaining = tabletsRemaining(pkg, entries);
              const level = lowStockLevel(pkg, entries);
              const days = Math.round(daysUntilEmpty(pkg, entries));
              return (
                <Card key={pkg.id} onClick={() => setHistoryPkg(pkg)} className="cursor-pointer">
                  <div className="flex items-center gap-3">
                    {pkg.photoDataUrl ? (
                      <img src={pkg.photoDataUrl} alt="" className="w-12 h-12 rounded-[var(--radius-md)] object-cover flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-medium text-[var(--color-text)]">{medName(pkg.medicationId)}</p>
                      <p className="text-[12.5px] text-[var(--color-text-muted)]">
                        {t.medPackages.remainingLabel.replace('{remaining}', String(remaining)).replace('{total}', String(pkg.totalTablets))}
                      </p>
                      {level !== 'none' && (
                        <p className="text-[12px] flex items-center gap-1 mt-0.5" style={{ color: level === 'threeDays' ? '#c1495c' : '#c98a3f' }}>
                          <AlertTriangle size={12} />
                          {t.medPackages.lowStockWarning.replace('{days}', String(Math.max(0, days)))}
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {formOpen && (
        <NewPackageModal
          medications={medications}
          onClose={() => setFormOpen(false)}
          onSaved={(pkg) => {
            medicationPackagesRepo.save(pkg);
            setPackages(medicationPackagesRepo.getAll());
            setFormOpen(false);
          }}
        />
      )}

      {historyPkg && (
        <PackageHistoryModal
          pkg={historyPkg}
          medName={medName(historyPkg.medicationId)}
          entries={entries}
          onClose={() => setHistoryPkg(null)}
          onDelete={() => {
            medicationPackagesRepo.remove(historyPkg.id);
            setPackages(medicationPackagesRepo.getAll());
            setHistoryPkg(null);
          }}
        />
      )}
    </div>
  );
}

function NewPackageModal({
  medications,
  onClose,
  onSaved,
}: {
  medications: { id: string; name: string }[];
  onClose: () => void;
  onSaved: (pkg: MedicationPackage) => void;
}) {
  const t = useT();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [medicationId, setMedicationId] = useState(medications[0]?.id ?? '');
  const [openedAt, setOpenedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [totalTablets, setTotalTablets] = useState('');
  const [tabletsPerDose, setTabletsPerDose] = useState('1');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | undefined>(undefined);

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    resizeImageFile(file, 800)
      .then((dataUrl) => setPhotoDataUrl(dataUrl))
      .catch(() => {
        // rare (corrupt file, no canvas support) — leave without a photo
      });
  }

  function save() {
    const total = Number(totalTablets);
    const perDose = Number(tabletsPerDose);
    if (!medicationId || !total || total <= 0 || !perDose || perDose <= 0) return;
    onSaved({
      id: createId(),
      medicationId,
      openedAt: new Date(openedAt).toISOString(),
      totalTablets: total,
      tabletsPerDose: perDose,
      photoDataUrl,
      createdAt: new Date().toISOString(),
    });
  }

  return (
    <Modal open onClose={onClose} title={t.medPackages.newPackageCta}>
      <div className="flex flex-col gap-3">
        <label className="text-[13px] text-[var(--color-text-muted)]">
          {t.medPackages.medicationLabel}
          <select className="input mt-1" value={medicationId} onChange={(e) => setMedicationId(e.target.value)}>
            {medications.length === 0 && <option value="">{t.medPackages.noMedicationsYet}</option>}
            {medications.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-[13px] text-[var(--color-text-muted)]">
          {t.medPackages.openedAtLabel}
          <input type="date" className="input mt-1" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} />
        </label>
        <label className="text-[13px] text-[var(--color-text-muted)]">
          {t.medPackages.totalTabletsLabel}
          <input type="number" min={1} className="input mt-1" value={totalTablets} onChange={(e) => setTotalTablets(e.target.value)} placeholder="z. B. 30" />
        </label>
        <label className="text-[13px] text-[var(--color-text-muted)]">
          {t.medPackages.tabletsPerDoseLabel}
          <input type="number" min={1} step="0.5" className="input mt-1" value={tabletsPerDose} onChange={(e) => setTabletsPerDose(e.target.value)} />
        </label>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[13px] self-start"
          style={{ border: '1.5px solid var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <Camera size={14} /> {t.medPackages.addPhotoCta}
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        {photoDataUrl && <img src={photoDataUrl} alt="" className="w-20 h-20 rounded-[var(--radius-md)] object-cover" />}

        <Button onClick={save} className="mt-2">
          {t.common.save}
        </Button>
      </div>
    </Modal>
  );
}

function PackageHistoryModal({
  pkg,
  medName,
  entries,
  onClose,
  onDelete,
}: {
  pkg: MedicationPackage;
  medName: string;
  entries: ReturnType<typeof mediLogRepo.getAll>;
  onClose: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const openedTime = new Date(pkg.openedAt).getTime();
  const history = entries
    .filter((e) => e.medicationId === pkg.medicationId && new Date(e.takenAt).getTime() >= openedTime)
    .sort((a, b) => new Date(b.takenAt).getTime() - new Date(a.takenAt).getTime());
  const remaining = tabletsRemaining(pkg, entries);
  const used = tabletsUsed(pkg, entries);

  return (
    <Modal open onClose={onClose} title={medName}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          {pkg.photoDataUrl && <img src={pkg.photoDataUrl} alt="" className="w-16 h-16 rounded-[var(--radius-md)] object-cover" />}
          <div>
            <p className="text-[13px] text-[var(--color-text-muted)]">
              {t.medPackages.remainingLabel.replace('{remaining}', String(remaining)).replace('{total}', String(pkg.totalTablets))}
            </p>
            <p className="text-[12px] text-[var(--color-text-faint)]">{t.medPackages.usedSoFarLabel.replace('{used}', String(used))}</p>
          </div>
        </div>

        <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{t.medPackages.historyLabel}</p>
        {history.length === 0 ? (
          <p className="text-[13px] text-[var(--color-text-faint)]">{t.medPackages.noEntriesYet}</p>
        ) : (
          <div className="flex flex-col gap-1.5 max-h-[240px] overflow-y-auto">
            {history.map((e) => (
              <div key={e.id} className="flex items-center justify-between text-[13px] py-1.5 border-b border-[var(--color-border)]">
                <span className="text-[var(--color-text)]">{new Date(e.takenAt).toLocaleString(undefined, { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                <span className="text-[var(--color-text-faint)]">{e.amount ?? ''}</span>
              </div>
            ))}
          </div>
        )}

        <button onClick={onDelete} className="flex items-center gap-1.5 text-[13px] text-[#c1495c] mt-2 self-start">
          <X size={14} /> {t.common.delete}
        </button>
      </div>
    </Modal>
  );
}
