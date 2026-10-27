import { useState } from 'react';
import { shareOrCopy } from '../../services/shareOrCopy';
import { buildShareText } from '../../services/sharedLinks';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, Trash2, Pencil, ArrowUpRight, Link2, Share2, Plus } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { SlipsHere } from '../parkbox/SlipsHere';
import { Button } from '../../components/ui/Button';
import { useT } from '../../i18n';
import { useSettings } from '../../state/SettingsContext';
import { netExampleTexts } from './exampleTexts';
import { categoryLabel, helpsWithLabel } from './networkMeta';
import { getIcon } from '../../components/icons/networkIcons';
import { NetworkEntryForm } from './NetworkEntryForm';
import { resourcesRepo } from '../resources/resourcesRepo';
import { NextAppointmentBlock } from '../calendar/NextAppointmentBlock';
import { childrenOf, descendantIds, validParentId } from './networkLayout';
import { linkCategoriesRepo, linkMetaStore, resolveLink } from './networkLinks';
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
  /** start a new sub-element under this entry */
  onAddChild?: (parent: NetworkEntry) => void;
  /** edit name/colour of the line between two entries */
  onOpenLink?: (a: string, b: string) => void;
  onChangeParent?: (entry: NetworkEntry, parentId: string | undefined) => void;
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
  onAddChild,
  onOpenLink,
  onChangeParent,
}: NetworkDetailModalProps) {
  const t = useT();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<NetworkEntry | null>(null);

  if (!entry) return null;

  const EX = netExampleTexts(settings.language === 'en' ? 'en' : 'de');
  const active = draft ?? entry;
  const category = categories.find((c) => c.id === active.category) ?? categories[0];
  const Icon = getIcon(active.iconKey, category.iconKey);
  const linkedResource = active.linkedResourceId ? resourcesRepo.getById(active.linkedResourceId) : undefined;
  const connectedEntries = entries.filter(
    (e) => e.id !== active.id && ((active.linkedTo ?? []).includes(e.id) || (e.linkedTo ?? []).includes(active.id)),
  );
  const personEntries = entries.filter((e) => e.category === 'person');
  const en = settings.language === 'en';
  const byId = new Map(entries.map((e) => [e.id, e]));
  const parentEntry = byId.get(validParentId(active, byId) ?? '');
  const kids = childrenOf(entries, active.id);
  const blocked = descendantIds(entries, active.id);
  const parentOptions = entries.filter((e) => e.id !== active.id && !blocked.has(e.id));
  const linkCats = linkCategoriesRepo.getAll();

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

  async function shareContact(entry: NetworkEntry) {
    const payload = {
      name: entry.name,
      role: entry.role,
      description: entry.description,
      helpsWith: entry.helpsWith,
      from: settings.userName || undefined,
    };
    const url = `${window.location.origin}/sicherheit/kontakte/importieren?data=${encodeURIComponent(JSON.stringify(payload))}`;
    await shareOrCopy({ title: entry.name, text: buildShareText({ kind: 'kontakt', title: entry.name, url, from: settings.userName, lang: settings.language === 'en' ? 'en' : 'de' }) }, t.resources.shareLinkCopied);
  }

  return (
    <Modal open={!!entry} onClose={close} title={editing ? t.common.edit : active.name}>
      {!editing ? (
        <div className="flex flex-col gap-4">
          <SlipsHere kind="person" id={active.id} />
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
              <p className="text-[13px] text-[var(--color-text-faint)]">{categoryLabel(t, category)}{parentEntry ? ` · ↳ ${parentEntry.name}` : ''}</p>
              {active.role && <p className="text-[14px] text-[var(--color-text-muted)]">{active.role}</p>}
            </div>
          </div>

          {active.isExample && (
            <div
              data-testid="network-example-detail"
              className="rounded-[var(--radius-md)] px-3 py-2.5 text-[13px] text-[var(--color-text-muted)]"
              style={{ border: '1.5px dashed var(--color-border-strong)', background: 'var(--color-surface-muted)' }}
            >
              <p className="mb-1.5">
                <span className="text-[10.5px] uppercase tracking-wide rounded-full px-2 py-0.5 mr-2" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-primary-soft-text)' }}>
                  {EX.badge}
                </span>
                {EX.detailHint}
              </p>
              <button type="button" onClick={() => onSave({ ...active, isExample: false })} className="text-[12px] text-[var(--color-primary)] underline underline-offset-2" data-testid="network-example-keep">
                {EX.keep}
              </button>
            </div>
          )}
          {active.description && <p className="text-[14px] text-[var(--color-text)]">{active.description}</p>}
          {active.whatHelps && (
            <div className="rounded-[var(--radius-md)] px-3 py-2.5" style={{ background: 'var(--color-primary-soft)' }}>
              <p className="text-[11.5px] uppercase tracking-wide text-[var(--color-text-faint)] mb-0.5">{t.network.whatHelpsLabel}</p>
              <p className="text-[14px] text-[var(--color-text)] whitespace-pre-line">{active.whatHelps}</p>
            </div>
          )}
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

          {active.category === 'person' && <NextAppointmentBlock personId={active.id} personName={active.name} />}

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

          <Button variant="ghost" fullWidth icon={<Share2 size={15} />} onClick={() => shareContact(active)}>
            {t.network.shareContact}
          </Button>

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
                    <button type="button" className="flex-1 text-left text-[13px] text-[var(--color-text)]" onClick={() => onOpenLink?.(active.id, other.id)} data-testid={`detail-link-${other.id}`}>
                      {other.name}
                      {(() => {
                        const r = resolveLink(linkMetaStore.get(active.id, other.id), linkCats);
                        return r.label ? (
                          <span className="ml-2 text-[11.5px] text-[var(--color-text-muted)]">
                            <span className="inline-block w-2 h-2 rounded-full mr-1 align-middle" style={{ background: r.color ?? 'var(--color-primary)' }} />
                            {r.label}
                          </span>
                        ) : null;
                      })()}
                    </button>
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

          {kids.length > 0 && (
            <div data-testid="detail-children">
              <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{en ? 'Sub-elements' : 'Unterelemente'}</p>
              <div className="flex flex-wrap gap-1.5">
                {kids.map((k) => (
                  <span key={k.id} className="text-[12.5px] rounded-full px-3 py-1 bg-[var(--color-surface-muted)] text-[var(--color-text)]">{k.name}</span>
                ))}
              </div>
            </div>
          )}

          <Button variant="secondary" fullWidth icon={<Plus size={15} />} onClick={() => onAddChild?.(active)} data-testid="detail-add-child">
            {en ? 'Add a sub-element' : 'Unterelement hinzufügen'}
          </Button>
          <p data-hint className="text-[11.5px] text-[var(--color-text-faint)] -mt-2">{en ? 'A sub-element hangs only under this one – not under you – like a branch of a mind map.' : 'Ein Unterelement hängt nur an diesem hier – nicht an dir – wie ein Ast einer Mindmap.'}</p>

          <div>
            <label className="block text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5" htmlFor="detail-parent">{en ? 'Belongs to' : 'Gehört zu'}</label>
            <select
              id="detail-parent"
              data-testid="detail-parent"
              value={parentEntry?.id ?? ''}
              onChange={(e) => onChangeParent?.(active, e.target.value || undefined)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[14px]"
            >
              <option value="">{en ? 'Directly to me' : 'Direkt zu mir'}</option>
              {parentOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </div>

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
