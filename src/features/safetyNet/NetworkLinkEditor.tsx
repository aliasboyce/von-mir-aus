import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, Unlink } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { ColorPicker } from '../../components/shared/SymbolColorPicker';
import { PALETTE_COLORS } from '../../content/emojiGroups';
import { useSettings } from '../../state/SettingsContext';
import { createId } from '../../services/storage/repository';
import { LINK_SUGGESTIONS, linkCategoriesRepo, linkMetaStore, DEFAULT_LINK_COLOR, type LinkCategory } from './networkLinks';
import type { NetworkEntry } from '../../data/types';

const TXT = {
  de: {
    title: 'Verbindung',
    name: 'Wie nennst du diese Verbindung?',
    namePh: 'z. B. befreundet, am selben Platz',
    kinds: 'Deine Arten von Verbindung',
    kindsNote: 'Einmal angelegt, kannst du sie immer wieder benutzen.',
    none: 'Noch keine eigene Art. Leg unten eine an – oder nimm einen Vorschlag.',
    suggestions: 'Vorschläge',
    newKind: 'Neue Art anlegen',
    newKindPh: 'Name der Art',
    ownColor: 'Eigene Farbe für diese Art',
    create: 'Anlegen',
    edit: 'Art bearbeiten',
    rename: 'Name',
    colorOfKind: 'Farbe der Art',
    removeKind: 'Art löschen',
    removeKindConfirm: 'Diese Art löschen? Verbindungen behalten ihren Namen, verlieren aber die Zuordnung.',
    lineColor: 'Farbe nur dieser Linie',
    sameAsKind: 'Wie die Art',
    removeLine: 'Verbindung entfernen',
    removeLineConfirm: 'Diese Verbindung wirklich entfernen?',
    detach: 'Aus Unterelement lösen (wird eigenständig)',
    parentNote: 'Unterelement von {a}',
    done: 'Fertig',
  },
  en: {
    title: 'Connection',
    name: 'What do you call this connection?',
    namePh: 'e.g. friends, same place',
    kinds: 'Your kinds of connection',
    kindsNote: 'Once created, you can use them again and again.',
    none: 'No kind of your own yet. Create one below – or take a suggestion.',
    suggestions: 'Suggestions',
    newKind: 'Create a new kind',
    newKindPh: 'Name of the kind',
    ownColor: 'Own colour for this kind',
    create: 'Create',
    edit: 'Edit kind',
    rename: 'Name',
    colorOfKind: 'Colour of the kind',
    removeKind: 'Delete kind',
    removeKindConfirm: 'Delete this kind? Connections keep their name but lose the assignment.',
    lineColor: 'Colour of this line only',
    sameAsKind: 'Like the kind',
    removeLine: 'Remove connection',
    removeLineConfirm: 'Really remove this connection?',
    detach: 'Detach from parent (becomes independent)',
    parentNote: 'Sub-element of {a}',
    done: 'Done',
  },
};

/**
 * Edit one line of the net: give it a name, pick one of your reusable kinds ("befreundet", "am selben
 * Platz" …) which may carry a colour, or colour just this line. Everything saves as you go.
 */
export function NetworkLinkEditor({
  open,
  a,
  b,
  kind,
  entries,
  onClose,
  onChanged,
  onRemove,
  onDetach,
}: {
  open: boolean;
  a: string;
  b: string;
  kind: 'free' | 'parent';
  entries: NetworkEntry[];
  onClose: () => void;
  onChanged: () => void;
  onRemove: (a: string, b: string) => void;
  onDetach: (childId: string) => void;
}) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const L = en ? TXT.en : TXT.de;
  const [, bump] = useState(0);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('');
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const meta = linkMetaStore.get(a, b);
  const cats = linkCategoriesRepo.getAll();
  const ea = entries.find((e) => e.id === a);
  const eb = entries.find((e) => e.id === b);
  const refresh = () => {
    bump((n) => n + 1);
    onChanged();
  };
  const setMeta = (patch: Partial<typeof meta>) => {
    linkMetaStore.set(a, b, { ...meta, ...patch });
    refresh();
  };
  const nextColor = () => PALETTE_COLORS[(cats.length * 5 + 3) % PALETTE_COLORS.length];

  function createKind(name: string, color?: string) {
    const n = name.trim();
    if (!n) return;
    const existing = cats.find((c) => c.name.toLowerCase() === n.toLowerCase());
    const cat: LinkCategory = existing ?? { id: createId('lkc'), name: n, color: color || nextColor() };
    if (!existing) linkCategoriesRepo.save(cat);
    linkMetaStore.set(a, b, { ...meta, categoryId: cat.id });
    setNewName('');
    setNewColor('');
    setAdding(false);
    refresh();
  }

  const lang = en ? 'en' : 'de';
  const suggestions = LINK_SUGGESTIONS[lang].filter((s) => !cats.some((c) => c.name.toLowerCase() === s.toLowerCase()));
  const parentId = kind === 'parent' ? (eb?.parentId === a ? a : b) : '';
  const childId = kind === 'parent' ? (parentId === a ? b : a) : '';
  const parentName = entries.find((e) => e.id === parentId)?.name ?? '';
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] border ${active ? 'text-white border-transparent' : 'text-[var(--color-text)] border-[var(--color-border-strong)]'}`;

  return (
    <Modal open={open} onClose={onClose} title={L.title} subtitle={`${ea?.name ?? ''} ↔ ${eb?.name ?? ''}`}>
      <div className="flex flex-col gap-4" data-testid="link-editor">
        {kind === 'parent' && <p className="text-[12.5px] text-[var(--color-text-faint)]">{L.parentNote.replace('{a}', parentName)}</p>}
        <div>
          <label className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L.name}</label>
          <input
            value={meta.label ?? ''}
            onChange={(e) => setMeta({ label: e.target.value })}
            placeholder={L.namePh}
            data-testid="link-label"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2.5 text-[15px] outline-none"
          />
        </div>

        <div>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-0.5">{L.kinds}</p>
          <p className="text-[11.5px] text-[var(--color-text-faint)] mb-2" data-hint>{L.kindsNote}</p>
          {cats.length === 0 && <p className="text-[12.5px] text-[var(--color-text-faint)] mb-2">{L.none}</p>}
          <div className="flex flex-wrap gap-2 mb-2">
            {cats.map((c) => {
              const active = meta.categoryId === c.id;
              return (
                <span key={c.id} className="inline-flex items-center">
                  <button
                    type="button"
                    onClick={() => setMeta({ categoryId: active ? undefined : c.id, ...(active ? {} : { label: meta.label === c.name ? '' : meta.label }) })}
                    className={chip(active)}
                    style={active ? { background: c.color } : undefined}
                    data-testid={`link-kind-${c.id}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: c.color, outline: active ? '2px solid #fff' : 'none' }} />
                    {c.name}
                  </button>
                  <button type="button" onClick={() => setEditing(editing === c.id ? null : c.id)} aria-label={`${L.edit}: ${c.name}`} className="ml-1 w-7 h-7 rounded-full flex items-center justify-center text-[var(--color-text-faint)]">
                    <Pencil size={13} />
                  </button>
                </span>
              );
            })}
          </div>

          {editing && cats.find((c) => c.id === editing) && (() => {
            const c = cats.find((x) => x.id === editing)!;
            return (
              <div className="rounded-[var(--radius-md)] p-3 mb-2 flex flex-col gap-2" style={{ background: 'var(--color-surface-muted)' }} data-testid="link-kind-edit">
                <input
                  value={c.name}
                  onChange={(e) => {
                    linkCategoriesRepo.save({ ...c, name: e.target.value });
                    refresh();
                  }}
                  aria-label={L.rename}
                  className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[14px] outline-none"
                />
                <ColorPicker
                  label={L.colorOfKind}
                  value={c.color}
                  onChange={(color) => {
                    linkCategoriesRepo.save({ ...c, color });
                    refresh();
                  }}
                />
                <button
                  type="button"
                  className="self-start flex items-center gap-1.5 text-[13px] text-[var(--color-danger)]"
                  onClick={() => {
                    if (!window.confirm(L.removeKindConfirm)) return;
                    linkCategoriesRepo.remove(c.id);
                    setEditing(null);
                    // lines that used this kind keep its name as their own label
                    Object.entries(linkMetaStore.all()).forEach(([k, m]) => {
                      if (m.categoryId === c.id) {
                        const [x, y] = k.split('::');
                        linkMetaStore.set(x, y, { ...m, categoryId: undefined, label: m.label || c.name, color: m.color || c.color });
                      }
                    });
                    refresh();
                  }}
                >
                  <Trash2 size={14} /> {L.removeKind}
                </button>
              </div>
            );
          })()}

          {suggestions.length > 0 && !adding && (
            <div className="mb-2">
              <p className="text-[11.5px] text-[var(--color-text-faint)] mb-1">{L.suggestions}</p>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s) => (
                  <button key={s} type="button" onClick={() => createKind(s)} className="px-3 py-1.5 rounded-full text-[13px] border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)]" data-testid={`link-suggest-${s}`}>
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!adding ? (
            <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-1.5 text-[13.5px] text-[var(--color-primary)]" data-testid="link-kind-new">
              <Plus size={15} /> {L.newKind}
            </button>
          ) : (
            <div className="rounded-[var(--radius-md)] p-3 flex flex-col gap-2" style={{ background: 'var(--color-surface-muted)' }}>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={L.newKindPh}
                data-testid="link-kind-name"
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface)] px-3 py-2 text-[14px] outline-none"
              />
              <ColorPicker label={L.ownColor} value={newColor || nextColor()} onChange={setNewColor} />
              <button type="button" onClick={() => createKind(newName, newColor || undefined)} className="self-start flex items-center gap-1.5 px-4 py-2 rounded-full text-[13.5px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="link-kind-create">
                <Check size={14} /> {L.create}
              </button>
            </div>
          )}
        </div>

        <div>
          <ColorPicker label={L.lineColor} value={meta.color ?? ''} onChange={(color) => setMeta({ color })} />
          {meta.color && (
            <button type="button" className="mt-1.5 text-[12.5px] text-[var(--color-text-muted)] underline underline-offset-2" onClick={() => setMeta({ color: undefined })}>
              {L.sameAsKind}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 pt-3 border-t border-[var(--color-border)]">
          <button type="button" onClick={onClose} className="w-full px-5 py-2.5 rounded-full text-[14px] text-white" style={{ background: meta.color || DEFAULT_LINK_COLOR }} data-testid="link-done">
            {L.done}
          </button>
          {kind === 'free' ? (
            <button
              type="button"
              className="self-start flex items-center gap-1.5 text-[13px] text-[var(--color-danger)]"
              onClick={() => {
                if (!window.confirm(L.removeLineConfirm)) return;
                onRemove(a, b);
                linkMetaStore.remove(a, b);
                onClose();
              }}
              data-testid="link-remove"
            >
              <Unlink size={14} /> {L.removeLine}
            </button>
          ) : (
            <button
              type="button"
              className="self-start flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]"
              onClick={() => {
                onDetach(childId);
                linkMetaStore.remove(a, b);
                onClose();
              }}
              data-testid="link-detach"
            >
              <Unlink size={14} /> {L.detach}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
