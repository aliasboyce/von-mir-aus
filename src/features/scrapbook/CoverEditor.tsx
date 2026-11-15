import { useL } from '../projects/useL';
import { ScrapCover } from './ScrapCover';
import { COVER_COLORS, COVER_STYLES, type ScrapBook } from './scrapModel';

const EMOJI = ['📖', '🌿', '🌸', '☀️', '🌙', '🧸', '🎞️', '✈️', '🍃', '💛', '🕊️', '🐚'];

/** Titel + Einband wählen, mit Vorschau – für „Neues Buch“ und „Einband ändern“. */
export function CoverEditor({ title, cover, onChange }: { title: string; cover: ScrapBook['cover']; onChange: (v: { title: string; cover: ScrapBook['cover'] }) => void }) {
  const { L, lang } = useL();
  const set = (patch: Partial<ScrapBook['cover']>) => onChange({ title, cover: { ...cover, ...patch } });
  return (
    <div className="flex flex-col gap-4" data-testid="cover-editor">
      <div className="mx-auto" style={{ width: 150 }}>
        <ScrapCover book={{ title: title || L('Mein Scrapbook', 'My scrapbook'), cover }} />
      </div>
      <input className="input" value={title} onChange={(e) => onChange({ title: e.target.value, cover })} placeholder={L('Titel (zum Beispiel „Sommer 2026“)', 'Title (e.g. “Summer 2026”)')} data-testid="scrap-new-title" />
      <div>
        <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Einband', 'Cover')}</p>
        <div className="flex flex-wrap gap-2">
          {COVER_STYLES.map((c) => (
            <button key={c.id} type="button" onClick={() => set({ style: c.id })} className={`px-3.5 py-2 rounded-full text-[13px] border ${cover.style === c.id ? 'bg-[var(--color-primary)] text-[var(--color-surface)] border-transparent' : 'border-[var(--color-border-strong)] text-[var(--color-text)]'}`}>
              {lang === 'en' ? c.en : c.de}
            </button>
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Farbe', 'Colour')}</p>
        <div className="flex flex-wrap gap-2.5">
          {COVER_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => set({ color: c })} aria-label={c} className="w-10 h-10 rounded-full" style={{ background: c, outline: cover.color === c ? '3px solid var(--color-primary)' : '1px solid rgba(0,0,0,.15)', outlineOffset: 2 }} />
          ))}
        </div>
      </div>
      <div>
        <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Symbol auf dem Schild', 'Symbol on the label')}</p>
        <div className="flex flex-wrap gap-2">
          {EMOJI.map((e) => (
            <button key={e} type="button" onClick={() => set({ emoji: e })} className="w-11 h-11 rounded-full text-[20px]" style={{ background: cover.emoji === e ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }}>{e}</button>
          ))}
          <button type="button" onClick={() => set({ emoji: '' })} className="px-3 h-11 rounded-full text-[12.5px] text-[var(--color-text-muted)]" style={{ background: !cover.emoji ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }}>{L('ohne', 'none')}</button>
        </div>
      </div>
    </div>
  );
}
