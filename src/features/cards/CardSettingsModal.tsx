import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { PALETTE_COLORS } from '../../content/emojiGroups';
import { useL } from '../projects/useL';
import { colorForKind, getPrefs, patchPrefs } from './cardStore';
import { KIND_META, KIND_ORDER, type CardKind } from './cardTypes';

/** Farben der Kartenarten, Ton, Rückseiten beim Drucken. Die Farben gelten nur für das Album. */
export function CardSettingsModal({ onClose }: { onClose: () => void }) {
  const { L, lang } = useL();
  const [prefs, setPrefs] = useState(getPrefs());
  const [open, setOpen] = useState<CardKind | null>(null);

  function setColor(kind: CardKind, color: string | null) {
    const colors = { ...prefs.colors };
    if (color) colors[kind] = color;
    else delete colors[kind];
    setPrefs(patchPrefs({ colors }));
  }

  return (
    <Modal open onClose={onClose} title={L('Farben & Ton', 'Colours & sound')}>
      <div className="flex flex-col gap-3 pb-2" data-testid="card-settings">
        <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
          {L('Jede Kartenart hat ihre Farbe. Ohne eigene Wahl nimmt das Album die Farbe aus deinem Netzwerk (Person, Hilfsmittel, Ort, Ressource).', 'Every kind of card has its colour. Without your own pick the album uses the colour from your network (person, tool, place, resource).')}
        </p>
        <div className="flex flex-col gap-2">
          {KIND_ORDER.filter((k) => !['eigen'].includes(k)).map((k) => {
            const color = colorForKind(k, prefs);
            return (
              <div key={k}>
                <button type="button" onClick={() => setOpen(open === k ? null : k)} className="w-full flex items-center gap-3 px-3 py-2 rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] text-left" aria-expanded={open === k}>
                  <span className="w-7 h-7 rounded-full flex-shrink-0" style={{ background: color, border: '2px solid rgba(0,0,0,0.12)' }} />
                  <span className="flex-1 text-[14px]">
                    {KIND_META[k].emoji} {lang === 'en' ? KIND_META[k].en : KIND_META[k].de}
                  </span>
                  {prefs.colors[k] && <span className="text-[11px] text-[var(--color-text-faint)]">{L('eigene Wahl', 'your pick')}</span>}
                </button>
                {open === k && (
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
