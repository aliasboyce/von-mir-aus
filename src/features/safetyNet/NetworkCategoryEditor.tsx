import { useEffect, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { useSettings } from '../../state/SettingsContext';
import { useT } from '../../i18n';
import { categoryLabel } from './networkMeta';
import type { NetworkCategoryConfig } from '../../data/types';

interface NetworkCategoryEditorProps {
  open: boolean;
  onClose: () => void;
  categories: NetworkCategoryConfig[];
  onChangeCategories: (next: NetworkCategoryConfig[]) => void;
}

export function NetworkCategoryEditor({
  open,
  onClose,
  categories,
  onChangeCategories,
}: NetworkCategoryEditorProps) {
  const t = useT();
  const lang = useSettings().settings.language === 'en' ? 'en' : 'de';
  const [draftColors, setDraftColors] = useState<Record<string, string>>(() =>
    Object.fromEntries(categories.map((c) => [c.id, c.color])),
  );

  useEffect(() => {
    if (!open) return;
    setDraftColors(Object.fromEntries(categories.map((c) => [c.id, c.color])));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function setCategoryColor(id: string, color: string) {
    setDraftColors((d) => ({ ...d, [id]: color }));
    onChangeCategories(categories.map((c) => (c.id === id ? { ...c, color } : c)));
  }

  return (
    <Modal open={open} onClose={onClose} title={t.network.manageCategories} subtitle={t.network.manageCategoriesHint}>
      <div className="flex flex-col gap-5">
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-surface-muted)' }} data-testid="network-fixed-colors-note">
          {lang === 'en'
            ? 'The colours of Person, Skill, Tool, Place and Activity are fixed – the same in the network, on the resource pages and on the cards, so your brain recognises them at a glance. Only categories you add yourself can have their own colour.'
            : 'Die Farben von Person, Fähigkeit, Hilfsmittel, Ort und Aktivität sind fest – im Netzwerk, auf den Ressourcen-Seiten und auf den Karten immer gleich. So erkennt dein Gehirn sie sofort wieder. Nur Kategorien, die du selbst anlegst, haben eine eigene Farbe.'}
        </p>

        <div>
          <p className="text-[13px] font-medium text-[var(--color-text-muted)] mb-2">
            {t.network.manageCategories}
          </p>
          <div className="flex flex-col gap-2">
            {categories.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                {c.isCustom ? (
                  <label className="relative w-9 h-9 rounded-full flex-shrink-0 overflow-hidden cursor-pointer border border-[var(--color-border)]">
                    <span className="absolute inset-0" style={{ background: draftColors[c.id] ?? c.color }} />
                    <input
                      type="color"
                      value={draftColors[c.id] ?? c.color}
                      onChange={(e) => setCategoryColor(c.id, e.target.value)}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      aria-label={`Farbe für ${categoryLabel(t, c)}`}
                    />
                  </label>
                ) : (
                  <span className="w-9 h-9 rounded-full flex-shrink-0 border border-[var(--color-border)]" style={{ background: c.color }} aria-hidden="true" />
                )}
                <span className="text-[14px] text-[var(--color-text)] flex-1">{categoryLabel(t, c)}</span>
                {!c.isCustom && <span className="text-[12px] text-[var(--color-text-faint)]">🔒 {lang === 'en' ? 'fixed' : 'fest'}</span>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </Modal>
  );
}
