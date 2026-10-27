import { useMemo, useState, type ReactNode } from 'react';
import { Camera, ChevronLeft, ClipboardPaste, Copy, Droplets, Link2, ListChecks, PenLine, Scale, Shapes, Smile, SquareDashed, StickyNote, Table2, Type, CircleDot } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { EmojiPicker } from '../../components/shared/SymbolColorPicker';
import { ItemTile } from '../../components/shared/ItemTile';
import { FRAME_VARIANTS, NOTE_VARIANTS, SHAPES, type MMNode } from './mindmapModel';
import { ShapeThumb } from './MindmapPanels';
import { REF_KINDS, listRefs, refLabel } from './appRefs';
import type { RefKind } from './mindmapBlocks';
import { defaultGrid } from './mindmapBlocks';
import { fmt, type MindmapExtraTexts } from './mindmapExtraTexts';

type View = 'main' | 'emoji' | 'glyphs' | { refs: RefKind };

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ'.split('');
const DIGITS = '0123456789'.split('');
const SIGNS = ['&', '?', '!', '+', '#', '%', '@', '€', '$', '*', '='];

const Tile = ({ icon, label, sub, onClick, testId }: { icon: ReactNode; label: string; sub?: string; onClick: () => void; testId: string }) => (
  <button type="button" onClick={onClick} className="flex items-center gap-3 text-left rounded-[var(--radius-md)] px-3 py-2.5 bg-[var(--color-surface-muted)] min-w-0" data-testid={testId}>
    <span className="text-[var(--color-primary)] shrink-0">{icon}</span>
    <span className="min-w-0">
      <span className="block text-[14px] text-[var(--color-text)] leading-tight">{label}</span>
      {sub && <span className="block text-[11.5px] text-[var(--color-text-muted)] leading-snug mt-0.5">{sub}</span>}
    </span>
  </button>
);
const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section>
    <h3 className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1.5">{title}</h3>
    {children}
  </section>
);

export interface AddSheetProps {
  open: boolean;
  onClose: () => void;
  lang: 'de' | 'en';
  X: MindmapExtraTexts;
  /** opened from the "+" of an element: the new thing is connected to it */
  parentName?: string;
  copyStyle: boolean;
  setCopyStyle: (v: boolean) => void;
  /** put a new element on the map (and connect it when a parent is set); `edit` opens text or content editing right away */
  onPlace: (patch: Partial<MMNode>, opts?: { edit?: 'text' | 'content' }) => void;
  onPhoto: () => void;
  onDoodle: () => void;
  onDraw: (kind: 'pen' | 'water') => void;
  onMapLink: () => void;
  onPasteButton: () => void;
  clipCount: number;
  onPasteClip: () => void;
  pasting: boolean;
}

/** "What do you want to add?" – the kind of element is chosen first, so nothing appears at random */
export function MindmapAddSheet(p: AddSheetProps) {
  const { lang, X } = p;
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const [view, setView] = useState<View>('main');
  const [q, setQ] = useState('');
  const close = () => {
    setView('main');
    setQ('');
    p.onClose();
  };
  const place = (patch: Partial<MMNode>, opts?: { edit?: 'text' | 'content' }) => {
    setView('main');
    setQ('');
    p.onPlace(patch, opts);
  };
  const refKind = typeof view === 'object' ? view.refs : null;
  const refs = useMemo(() => (refKind && p.open ? listRefs(refKind, lang) : []), [refKind, lang, p.open]);
  const shown = refs.filter((r) => !q.trim() || `${r.snap.title} ${r.snap.sub ?? ''}`.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 80);
  const title = view === 'main' ? L('Was möchtest du hinzufügen?', 'What do you want to add?') : view === 'emoji' ? L('Symbol wählen', 'Choose a symbol') : view === 'glyphs' ? L('Buchstabe, Zahl, Zeichen', 'Letter, number, sign') : refLabel(view.refs, lang);

  return (
    <Modal open={p.open} onClose={close} title={title}>
      <div className="flex flex-col gap-4" data-testid="mm-insert-modal">
        <div data-testid="mm-add-sheet" className="contents" />
        {view !== 'main' && (
          <button type="button" onClick={() => { setView('main'); setQ(''); }} className="self-start inline-flex items-center gap-1 text-[13.5px] text-[var(--color-primary)]" data-testid="mm-add-back">
            <ChevronLeft size={16} /> {L('Zurück zur Auswahl', 'Back to the choice')}
          </button>
        )}

        {view === 'emoji' && <EmojiPicker value="" onChange={(e) => place({ shape: 'sticker', symbol: e, size: 2 })} />}

        {view === 'glyphs' && (
          <div className="flex flex-col gap-2" data-testid="mm-add-glyphs">
            <p className="text-[12.5px] text-[var(--color-text-muted)]">{L('Groß und fett – Schrift und Farbe änderst du danach.', 'Big and bold – change font and colour afterwards.')}</p>
            <div className="flex flex-wrap gap-1.5">
              {[...LETTERS, ...DIGITS, ...SIGNS].map((g) => (
                <button key={g} type="button" onClick={() => place({ shape: 'sticker', symbol: g, font: 'display', size: 3 })} className="w-10 h-10 rounded-[var(--radius-md)] text-[20px] font-bold border border-[var(--color-border)] text-[var(--color-text)]" style={{ fontFamily: 'Georgia, serif' }} data-testid={`mm-add-glyph-${g}`} aria-label={g}>
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {refKind && (
          <div className="flex flex-col gap-2" data-testid="mm-add-refs">
            <p className="text-[12.5px] text-[var(--color-text-muted)]">{L('Die Karte sieht so aus wie in der App und bleibt mit dem Original verbunden – ein Tipp darauf führt dich dorthin.', 'The card looks like in the app and stays connected to the original – a tap leads you there.')}</p>
            {refs.length > 6 && (
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L('Suchen …', 'Search …')} className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-bg)] px-3 text-[14px]" data-testid="mm-add-refs-search" />
            )}
            {shown.length === 0 && <p className="text-[13px] text-[var(--color-text-faint)]" data-testid="mm-add-refs-empty">{L('Hier gibt es noch nichts zum Einfügen.', 'There is nothing to insert here yet.')}</p>}
            <div className="flex flex-col gap-1.5 max-h-[50vh] overflow-y-auto">
              {shown.map((r) => (
                <ItemTile key={r.id} compact color={r.snap.color} emoji={r.snap.emoji} label={r.snap.label} title={r.snap.title} subtitle={r.snap.sub} onClick={() => place({ shape: 'appcard', ref: { kind: refKind, id: r.id }, snap: r.snap, color: r.snap.color, fw: 262 })} testId={`mm-add-ref-${r.id}`} />
              ))}
            </div>
          </div>
        )}

        {view === 'main' && (
          <>
            {p.parentName !== undefined && (
              <label className="flex items-center gap-2 text-[13px] text-[var(--color-text)] rounded-[var(--radius-md)] bg-[var(--color-primary-soft)] px-3 py-2">
                <input type="checkbox" checked={p.copyStyle} onChange={(e) => p.setCopyStyle(e.target.checked)} data-testid="mm-add-copystyle" />
                {fmt(L('Aussehen von „{n}“ übernehmen', 'Take the look of “{n}”'), { n: p.parentName || '…' })}
              </label>
            )}
            {p.clipCount > 0 && (
              <Tile icon={<Copy size={20} />} label={X.insertClip} sub={fmt(X.insertClipSub, { n: p.clipCount })} onClick={() => { close(); p.onPasteClip(); }} testId="mm-insert-clip" />
            )}

            <Section title={L('Grundlagen', 'Basics')}>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<CircleDot size={20} />} label={L('Knoten', 'Node')} sub={L('Kasten mit Text', 'Box with text')} onClick={() => place({ shape: 'rect', round: false }, { edit: 'text' })} testId="mm-add-node-type" />
                <Tile icon={<Type size={20} />} label={X.insertText} sub={X.insertTextSub} onClick={() => place({ shape: 'plain', look: 'soft', size: 3 }, { edit: 'text' })} testId="mm-insert-text" />
              </div>
            </Section>

            <Section title={L('Notizen', 'Notes')}>
              <div className="grid grid-cols-2 gap-2">
                {NOTE_VARIANTS.filter((v) => ['sticky', 'tape', 'pin', 'index'].includes(v.id)).map((v) => (
                  <Tile key={v.id} icon={<StickyNote size={20} />} label={lang === 'en' ? v.en : v.de} onClick={() => place({ shape: 'note', color: '#e8a83d', look: 'soft', round: false, variant: v.id === 'sticky' ? undefined : v.id }, { edit: 'text' })} testId={`mm-add-note-${v.id}`} />
                ))}
              </div>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{L('Weitere Arten (Zettel, Millimeterpapier …) findest du später unter „Gestalten → Form“.', 'More kinds (torn paper, graph paper …) are under “Style → Shape” later.')}</p>
            </Section>

            <Section title={L('Rahmen', 'Frames')}>
              <div className="grid grid-cols-2 gap-2">
                {FRAME_VARIANTS.filter((v) => ['classic', 'header', 'tab', 'card'].includes(v.id)).map((v) => (
                  <Tile key={v.id} icon={<SquareDashed size={20} />} label={lang === 'en' ? v.en : v.de} onClick={() => place({ shape: 'frame', color: '#4a8f9e', fw: 340, fh: 240, round: false, variant: v.id === 'classic' ? undefined : v.id }, { edit: v.id === 'classic' ? undefined : 'text' })} testId={`mm-add-frame-${v.id}`} />
                ))}
              </div>
              <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{L('Weitere Rahmen (Klammern, Wolke, Unterstrich …) unter „Gestalten → Form“.', 'More frames (brackets, blob, underline …) under “Style → Shape”.')}</p>
            </Section>

            <Section title={L('Formen', 'Shapes')}>
              <div className="grid grid-cols-5 gap-1.5">
                {SHAPES.filter((s) => !['plain', 'frame', 'note'].includes(s.id)).map((s) => (
                  <button key={s.id} type="button" onClick={() => place({ shape: s.id, round: false }, { edit: 'text' })} className="flex flex-col items-center gap-0.5 rounded-[var(--radius-md)] py-1.5 text-[var(--color-text-muted)] bg-[var(--color-surface-muted)]" data-testid={`mm-add-shape-${s.id}`} aria-label={lang === 'en' ? s.en : s.de}>
                    <ShapeThumb shape={s.id} active={false} round={false} />
                    <span className="text-[10px] leading-tight text-center">{lang === 'en' ? s.en : s.de}</span>
                  </button>
                ))}
              </div>
            </Section>

            <Section title={L('Symbole', 'Symbols')}>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<Smile size={20} />} label={L('Emoji & Symbole', 'Emoji & symbols')} sub={L('Emoji, Herz, Stern …', 'Emoji, heart, star …')} onClick={() => setView('emoji')} testId="mm-insert-sticker" />
                <Tile icon={<span className="font-bold text-[18px] leading-none" style={{ fontFamily: 'Georgia, serif' }}>Aa1</span>} label={L('Buchstaben & Zahlen', 'Letters & numbers')} sub={L('groß und fett', 'big and bold')} onClick={() => setView('glyphs')} testId="mm-add-glyphs-btn" />
                <Tile icon={<Shapes size={20} />} label={L('Zeichnungen: Dinge & Männchen', 'Drawings: things & figures')} sub={L('Glühbirne, Stift, Zahnrad, Buch, Strichmännchen …', 'Light bulb, pencil, gear, book, stick figures …')} onClick={() => { close(); p.onDoodle(); }} testId="mm-insert-doodle" />
              </div>
            </Section>

            <Section title={L('Listen & Tabellen', 'Lists & tables')}>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<ListChecks size={20} />} label={L('To-do-Liste', 'To-do list')} sub={L('Kreise zum Abhaken', 'circles to tick off')} onClick={() => place({ shape: 'todo', round: false, color: '#6aa08a', fw: 270, items: [{ id: `t${Date.now().toString(36)}`, t: '' }] }, { edit: 'content' })} testId="mm-add-todo" />
                <Tile icon={<Scale size={20} />} label={L('Pro & Contra', 'Pros & cons')} sub={L('zwei Spalten', 'two columns')} onClick={() => place({ shape: 'proscons', round: false, color: '#6aa08a', fw: 320, pros: [''], cons: [''] }, { edit: 'content' })} testId="mm-add-proscons" />
                <Tile icon={<Table2 size={20} />} label={L('Tabelle', 'Table')} sub={L('Zeilen und Spalten', 'rows and columns')} onClick={() => place({ shape: 'table', round: false, color: '#4a8f9e', grid: defaultGrid() }, { edit: 'content' })} testId="mm-add-table" />
              </div>
            </Section>

            <Section title={L('Aus der App', 'From the app')}>
              <div className="grid grid-cols-2 gap-2">
                {REF_KINDS.map((k) => (
                  <Tile key={k.id} icon={<span className="text-[20px] leading-none">{k.emoji}</span>} label={lang === 'en' ? k.en : k.de} onClick={() => setView({ refs: k.id })} testId={`mm-add-ref-${k.id}`} />
                ))}
              </div>
            </Section>

            <Section title={L('Bild & Malen', 'Picture & painting')}>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<Camera size={20} />} label={L('Foto', 'Photo')} onClick={() => p.onPhoto()} testId="mm-insert-photo" />
                <Tile icon={<PenLine size={20} />} label={L('Stift, Bleistift, Textmarker', 'Pen, pencil, highlighter')} onClick={() => { close(); p.onDraw('pen'); }} testId="mm-add-pen" />
                <Tile icon={<Droplets size={20} />} label={L('Aquarell', 'Watercolour')} sub={L('auch riesig – z. B. als Hintergrund', 'also huge – e.g. as a background')} onClick={() => { close(); p.onDraw('water'); }} testId="mm-add-water" />
                <Tile icon={<Link2 size={20} />} label={X.insertMapLink} sub={X.insertMapLinkSub} onClick={() => p.onMapLink()} testId="mm-insert-maplink" />
              </div>
            </Section>

            <Section title={L('Einfügen', 'Paste')}>
              <div className="grid grid-cols-1 gap-2">
                <Tile icon={<ClipboardPaste size={20} />} label={L('Aus der Zwischenablage einfügen', 'Paste from the clipboard')} sub={L('Text oder Bild', 'text or picture')} onClick={() => p.onPasteButton()} testId="mm-insert-paste" />
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-label={X.clipField}
                onBeforeInput={(e) => e.preventDefault()}
                onKeyDown={(e) => { if (!(e.ctrlKey || e.metaKey)) e.preventDefault(); }}
                className="mt-2 rounded-[var(--radius-md)] px-4 py-3 text-[13px] text-[var(--color-text-muted)] border border-dashed border-[var(--color-border-strong)] text-center"
                data-testid="mm-insert-paste-field"
              >
                {p.pasting ? X.clipWorking : X.clipField}
              </div>
              <p className="text-[12px] text-[var(--color-text-faint)] mt-1">{X.clipHow}</p>
            </Section>
          </>
        )}
      </div>
    </Modal>
  );
}

