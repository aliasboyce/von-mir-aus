import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Trash2, Pencil, ArrowUpRight, Link2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { categoryLabel, helpsWithLabel } from './networkMeta';
import { getIcon } from '../../components/icons/networkIcons';
import { NetworkEntryForm } from './NetworkEntryForm';
import { resourcesRepo } from '../resources/resourcesRepo';
import type { NetworkCategoryConfig, NetworkEntry } from '../../data/types';

interface NetworkDetailModalProps {
  entry: NetworkEntry | null;
  entries: NetworkEntry[];
  categories: NetworkCategoryConfig[];
  onAddCategory: (category: NetworkCategoryConfig) => void;
  onClose: () => void;
  onSave: (entry: NetworkEntry) => void;
  onDelete: (id: string) => boolean | void;
  onStartConnecting?: (id: string) => void;
  onRemoveConnection?: (fromId: string, toId: string) => void;
}

export function NetworkDetailModal({
  entry,
  entries,
  categories,
  onAddCategory,
  onClose,
  onSave,
  onDelete,
  onStartConnecting,
  onRemoveConnection,
}: NetworkDetailModalProps) {
  const t = useT();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NetworkEntry | null>(null);

  if (!entry) return null;

  const active = draft ?? entry;
  const category = categories.find((c) => c.id === active.category) ?? categories[0];
  const Icon = getIcon(active.iconKey, category.iconKey);
  const linkedResource = active.linkedResourceId ? resourcesRepo.getById(active.linkedResourceId) : undefined;
  const connectedEntries = entries.filter(
    (e) => e.id !== active.id && ((active.linkedTo ?? []).includes(e.id) || (e.linkedTo ?? []).includes(active.id)),
  );
  const personEntries = entries.filter((e) => e.category === 'person');

  function startEdit() {
    setDraft(entry);
    setEditing(true);
  }

  function save() {
    if (!draft || !draft.name.trim()) return;
    onSave(draft);
    setEditing(false);
    setDraft(null);
  }

  function close() {
    setEditing(false);
    setDraft(null);
    onClose();
  }

  function goToResource() {
    if (!linkedResource) return;
    close();
    navigate(`/entdecken/ressourcen?open=${linkedResource.id}`);
  }

  return (
    <Modal open={!!entry} onClose={close} title={editing ? t.common.edit : active.name}>
      {!editing ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-full flex items-center justify-center text-[var(--color-surface)] flex-shrink-0 overflow-hidden"
              style={{ background: category.color }}
            >
              {active.photoDataUrl ? (
                <img
                  src={active.photoDataUrl}
                  alt=""
                  className="w-full h-full object-cover"
                  style={{
                    transform: `translate(${active.photoOffsetX ?? 0}%, ${active.photoOffsetY ?? 0}%) scale(${active.photoScale ?? 1})`,
                  }}
                />
              ) : (
                <Icon size={20} />
              )}
            </span>
            <div className="min-w-0">
              <p className="text-[13px] text-[var(--color-text-faint)]">{categoryLabel(t, category)}</p>
              {active.role && <p className="text-[14px] text-[var(--color-text-muted)]">{active.role}</p>}
            </div>
          </div>

          {active.description && <p className="text-[14px] text-[var(--color-text)]">{active.description}</p>}
          {active.note && <p className="text-[13px] text-[var(--color-text-muted)] italic">„{active.note}“</p>}

          {active.helpsWith.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {active.helpsWith.map((h) => (
                <span
                  key={h}
                  className="text-[12px] bg-[var(--color-primary-soft)] text-[var(--color-primary-soft-text)] rounded-full px-3 py-1"
                >
                  {helpsWithLabel(t, h)}
                </span>
              ))}
            </div>
          )}

          {(active.phone || active.email) && (
            <div className="flex gap-2">
              {active.phone && (
                <a href={`tel:${active.phone}`} className="flex-1">
                  <Button variant="secondary" fullWidth icon={<Phone size={15} />}>
                    Anrufen
                  </Button>
                </a>
              )}
              {active.email && (
                <a href={`mailto:${active.email}`} className="flex-1">
                  <Button variant="secondary" fullWidth icon={<Mail size={15} />}>
                    E-Mail
                  </Button>
                </a>
              )}
            </div>
          )}

          {linkedResource && (
            <Button variant="secondary" fullWidth icon={<ArrowUpRight size={15} />} onClick={goToResource}>
              {t.network.goToResource}
            </Button>
          )}

          {connectedEntries.length > 0 && (
            <div>
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">
                {t.network.connectionsTitle}
              </p>
              <div className="flex flex-col gap-1.5">
                {connectedEntries.map((other) => (
                  <div
                    key={other.id}
                    className="flex items-center justify-between gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2"
                  >
                    <span className="text-[13px] text-[var(--color-text)]">{other.name}</span>
                    <button
                      onClick={() => onRemoveConnection?.(active.id, other.id)}
                      aria-label={`${t.common.delete}: ${other.name}`}
                      className="text-[var(--color-text-faint)] hover:text-[var(--color-danger)] text-[16px] leading-none"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            variant="ghost"
            fullWidth
            icon={<Link2 size={15} />}
            onClick={() => {
              onStartConnecting?.(active.id);
              close();
            }}
          >
            {t.network.addConnection}
          </Button>

          <div className="flex gap-2 pt-2 border-t border-[var(--color-border)] mt-1">
            <Button variant="ghost" icon={<Pencil size={15} />} onClick={startEdit}>
              {t.common.edit}
            </Button>
            <Button
              variant="danger"
              icon={<Trash2 size={15} />}
              onClick={() => {
                const deleted = onDelete(active.id);
                if (deleted !== false) close();
              }}
            >
              {t.common.delete}
            </Button>
          </div>
        </div>
      ) : (
        draft && (
          <NetworkEntryForm
            draft={draft}
            onChange={setDraft}
            categories={categories}
            onAddCategory={onAddCategory}
            allPersonEntries={personEntries}
            submitLabel={t.common.save}
            onSubmit={save}
            onCancel={() => setEditing(false)}
          />
        )
      )}
    </Modal>
  );
}
