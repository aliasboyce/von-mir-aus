/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import { ArrowDown, ArrowUp, Ellipsis, StickyNote, Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { RichTextEditor } from '../../components/shared/RichTextEditor';
import { metaOf } from './projectModel';
import { renderBlock } from './blockRender';
import { KIND_COLOR } from './tiles';
import { ProjectSubShell } from './ProjectSubShell';
import type { BlockProps } from './ui';
import type { ProjectApi } from './projectApi';

/** Eine Seite für genau einen Baustein – mit seinen eigenen Werkzeugen und seiner Notiz. */
export function ProjectBlockView({ api, blockId }: { api: ProjectApi; blockId: string }) {
  const { p, L, lang, update, setBlock, go } = api;
  const b = p.blocks.find((x) => x.id === blockId);
  const [menu, setMenu] = useState(false);
  const [noteOpen, setNoteOpen] = useState(!!b?.note?.trim());
  if (!b) {
    return (
      <div className="px-5 pt-8 text-center">
        <p className="text-[14px] text-[var(--color-text-muted)] mb-3">{L('Diese Seite gibt es nicht (mehr).', 'This page does not exist (any more).')}</p>
        <button type="button" className="underline text-[var(--color-primary)]" onClick={() => go('')}>{L('Zur Projekt-Startseite', 'To the project home')}</button>
      </div>
    );
  }
  const meta = metaOf(b.kind);
  const props: BlockProps<any> = { block: b, project: p, L, lang, onChange: setBlock, onProject: update };
  const idx = p.blocks.indexOf(b);
  const move = (dir: -1 | 1) => update((cur) => {
    const i = cur.blocks.findIndex((x) => x.id === b.id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= cur.blocks.length) return cur;
    const blocks = [...cur.blocks];
    [blocks[i], blocks[j]] = [blocks[j], blocks[i]];
    return { ...cur, blocks };
  });
  const remove = () => {
    const filled = JSON.stringify(b).length > 260;
    if (filled && !window.confirm(L(`„${b.title}“ samt Inhalt entfernen?`, `Remove "${b.title}" with its content?`))) return;
    setMenu(false);
    update((cur) => ({ ...cur, blocks: cur.blocks.filter((x) => x.id !== b.id) }));
    go('');
  };
  return (
    <ProjectSubShell
      api={api}
      current={`b/${b.id}`}
      icon={meta.icon}
      title={b.title || L(meta.de, meta.en)}
      color={KIND_COLOR[b.kind] ?? p.color}
      right={<button type="button" onClick={() => setMenu(true)} aria-label={L('Mehr', 'More')} className="w-10 h-10 flex items-center justify-center text-[var(--color-text-muted)]" data-testid="block-menu"><Ellipsis size={20} /></button>}
    >
      <div data-testid={`block-${b.kind}`} data-block-id={b.id}>
        {renderBlock(b, props)}
        <div className="mt-4">
          {!noteOpen && !b.note?.trim() ? (
            <button type="button" onClick={() => setNoteOpen(true)} className="inline-flex items-center gap-1.5 text-[13px] text-[var(--color-text-muted)]" data-testid="block-note-open"><StickyNote size={14} />{L('Notiz dazu', 'Add a note')}</button>
          ) : (
            <div data-testid="block-note">
              <span className="block text-[12px] text-[var(--color-text-muted)] mb-1">{L('Notiz', 'Note')}</span>
              <RichTextEditor value={b.note ?? ''} onChange={(note) => setBlock({ ...b, note })} placeholder={L('Eigene Gedanken dazu …', 'Your own thoughts on this …')} minRows={2} testId="block-note-editor" />
            </div>
          )}
        </div>
      </div>
      <Modal open={menu} onClose={() => setMenu(false)} title={L('Diese Seite', 'This page')} subtitle={b.title}>
        <div className="flex flex-col gap-2" data-testid="block-menu-sheet">
          <label className="block">
            <span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{L('Name der Seite', 'Page name')}</span>
            <input className="input" value={b.title} onChange={(e) => setBlock({ ...b, title: e.target.value })} data-testid="block-title" />
          </label>
          <button type="button" disabled={idx === 0} onClick={() => move(-1)} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] disabled:opacity-40" data-testid="block-up"><ArrowUp size={16} />{L('Kachel nach vorne', 'Tile earlier')}</button>
          <button type="button" disabled={idx === p.blocks.length - 1} onClick={() => move(1)} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] disabled:opacity-40" data-testid="block-down"><ArrowDown size={16} />{L('Kachel nach hinten', 'Tile later')}</button>
          <button type="button" onClick={remove} className="flex items-center gap-2 text-left rounded-[var(--radius-md)] px-4 py-3 bg-[var(--color-surface-muted)] text-[14.5px] text-[var(--color-danger)]" data-testid="block-remove"><Trash2 size={16} />{L('Seite entfernen', 'Remove page')}</button>
        </div>
      </Modal>
    </ProjectSubShell>
  );
}
