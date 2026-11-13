import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { PALETTE_COLORS } from '../../content/emojiGroups';
import { useL } from '../projects/useL';
import { colorForKind, getPrefs, isFixedKindColor, patchPrefs } from './cardStore';
import { COVER_COLORS, COVER_STYLES, getAlbumCover, patchAlbumCover, resetAlbumCover } from './albumCover';
import { KIND_META, KIND_ORDER, type CardKind } from './cardTypes';

/** Farben der Kartenarten, Ton, Rückseiten beim Drucken. Die Farben gelten nur für das Album. */
export function CardSettingsModal({ onClose }: { onClose: () => void }) {
  const { L, lang } = useL();
  const [prefs, setPrefs] = useState(getPrefs());
  const [open, setOpen] = useState<CardKind | null>(null);
  const [cover, setCover] = useState(getAlbumCover());

  function setColor(kind: CardKind, color: string | null) {
    const colors = { ...prefs.colors };
    if (color) colors[kind] = color;
    else delete colors[kind];
    setPrefs(patchPrefs({ colors }));
  }

  return (
    <Modal open onClose={onClose} title={L('Farben, Cover & Ton', 'Colours, cover & sound')}>
      <div className="flex flex-col gap-3 pb-2" data-testid="card-settings">
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          {L('Person, Fähigkeit, Aktivität, Hilfsmittel und Ort haben feste Farben – dieselben wie im Netzwerk und auf den Seiten dazu. So erkennst du sie überall wieder. Bei den übrigen Kartenarten wählst du die Farbe selbst.', 'Person, skill, activity, tool and place have fixed colours – the same as in the network and on their pages, so you recognise them everywhere. For the other kinds you pick the colour yourself.')}
        </p>
        <div className="flex flex-col gap-2">
          {KIND_ORDER.filter((k) => !['eigen'].includes(k)).map((k) => {
            const color = colorForKind(k, prefs);
            return (
              <div key={k}>
                <button type="button" onClick={() => !isFixedKindColor(k) && setOpen(open === k ? null : k)} className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-left" aria-expanded={open === k}>
                  <span className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: color, border: '2px solid rgba(0,0,0,0.12)' }} />
                  <span className="flex-1 text-[14px]">
                    {KIND_META[k].emoji} {lang === 'en' ? KIND_META[k].en : KIND_META[k].de}
                  </span>
                  {isFixedKindColor(k)
                    ? <span className="text-[11px] text-[var(--color-text-faint)]">{L('🔒 fest', '🔒 fixed')}</span>
                    : prefs.colors[k] && <span className="text-[11px] text-[var(--color-text-faint)]">{L('eigene Wahl', 'your pick')}</span>}
                </button>
                {open === k && !isFixedKindColor(k) && (
                  <div className="px-1 pt-2 pb-1 animate-in">
                    <div className="flex flex-wrap gap-1.5">
                      {PALETTE_COLORS.map((c) => (
                        <button key={c} type="button" onClick={() => setColor(k, c)} aria-label={c} className="w-8 h-8 rounded-full" style={{ background: c, outline: color.toLowerCase() === c.toLowerCase() ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} />
                      ))}
                      <input type="color" value={color.length === 7 ? color : '#999999'} onChange={(e) => setColor(k, e.target.value)} className="w-8 h-8 rounded-full border-0 p-0 bg-transparent" aria-label={L('Eigene Farbe', 'Custom colour')} />
                    </div>
                    {prefs.colors[k] && (
                      <button type="button" onClick={() => setColor(k, null)} className="text-[12.5px] text-[var(--color-primary)] mt-2">
                        {L('Zurück zur Standardfarbe', 'Back to default colour')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-2 pt-3 border-t border-[var(--color-border)]" data-testid="cover-settings">
          <p className="text-[14px] font-semibold mb-1">{L('Cover vom Album', 'Album cover')}</p>
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{L('So wie es dir gefällt: Farbe, Stil und wie schlicht es sein soll.', 'The way you like it: colour, style and how plain it should be.')}</p>
          <div className="flex gap-1.5 flex-wrap mb-3">
            {COVER_STYLES.map((st) => (
              <button key={st.id} type="button" onClick={() => setCover(patchAlbumCover({ style: st.id }))} data-testid={`cover-style-${st.id}`} aria-pressed={cover.style === st.id}
                className="px-3 py-2 rounded-[var(--radius-md)] text-left text-[13px]"
                style={{ background: cover.style === st.id ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', border: `1.5px solid ${cover.style === st.id ? 'var(--color-primary)' : 'transparent'}` }}>
                <span className="block font-medium">{lang === 'en' ? st.en : st.de}</span>
                <span className="block text-[11.5px] text-[var(--color-text-muted)]">{lang === 'en' ? st.hintEn : st.hintDe}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 items-center mb-3">
            {COVER_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setCover(patchAlbumCover({ color: c }))} aria-label={c} data-testid={`cover-color-${c.slice(1)}`} className="w-8 h-8 rounded-full" style={{ background: c, border: '2px solid rgba(0,0,0,0.12)', outline: cover.color.toLowerCase() === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 1 }} />
            ))}
            <input type="color" value={cover.color.length === 7 ? cover.color : '#6b3a35'} onChange={(e) => setCover(patchAlbumCover({ color: e.target.value }))} className="w-8 h-8 rounded-full border-0 p-0 bg-transparent" aria-label={L('Eigene Farbe', 'Custom colour')} />
          </div>
          <label className="block text-[13px] mb-2">
            <span className="text-[var(--color-text-muted)]">{L('Titel (leer = „Meine Sammlung“)', 'Title (empty = “My collection”)')}</span>
            <input value={cover.title} maxLength={32} onChange={(e) => setCover(patchAlbumCover({ title: e.target.value }))} data-testid="cover-title" className="block w-full mt-1 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-[14px]" placeholder={L('Meine Sammlung', 'My collection')} />
          </label>
          <label className="flex items-center gap-2 text-[14px] mb-2">
            <input type="checkbox" checked={cover.showSymbol} onChange={(e) => setCover(patchAlbumCover({ showSymbol: e.target.checked }))} data-testid="cover-symbol" />
            {L('Symbol auf dem Cover zeigen', 'Show the symbol on the cover')}
          </label>
          <button type="button" onClick={() => setCover(resetAlbumCover())} className="text-[12.5px] text-[var(--color-primary)]">{L('Cover zurücksetzen', 'Reset cover')}</button>
        </div>

        <label className="flex items-center gap-2 text-[14px] mt-1">
          <input type="checkbox" checked={prefs.sound} onChange={(e) => setPrefs(patchPrefs({ sound: e.target.checked }))} data-testid="card-sound-toggle" />
          {L('Leise Geräusche beim Blättern und Funkeln', 'Soft sounds when turning pages and sparkling')}
        </label>
        <label className="flex items-center gap-2 text-[14px]">
          <input type="checkbox" checked={!!prefs.printBacks} onChange={(e) => setPrefs(patchPrefs({ printBacks: e.target.checked }))} />
          {L('Beim Drucken auch die Rückseiten (zum doppelseitigen Drucken)', 'Also print the backs (for double-sided printing)')}
        </label>
        {prefs.hidden.length > 0 && (
          <button type="button" onClick={() => setPrefs(patchPrefs({ hidden: [] }))} className="text-[13px] text-[var(--color-primary)] text-left">
            {L(`${prefs.hidden.length} ausgeblendete Karten wieder zeigen`, `Show ${prefs.hidden.length} hidden cards again`)}
          </button>
        )}
        <button type="button" onClick={onClose} className="self-start px-4 py-2 rounded-full text-[14px] bg-[var(--color-primary)] text-[var(--color-surface)]">
          {L('Fertig', 'Done')}
        </button>
      </div>
    </Modal>
  );
}
