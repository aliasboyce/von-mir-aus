import { useState } from 'react';
import { EMOJI_GROUPS, PALETTE_COLORS } from '../../content/emojiGroups';
import { useSettings } from '../../state/SettingsContext';

/** Symbol picker: a few group tabs, one calm grid at a time. */
export function EmojiPicker({ value, onChange, label }: { value: string; onChange: (e: string) => void; label?: string }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const startGroup = Math.max(0, EMOJI_GROUPS.findIndex((g) => g.items.includes(value)));
  const [gi, setGi] = useState(startGroup);
  const g = EMOJI_GROUPS[gi];
  return (
    <div data-testid="emoji-picker">
      {label && <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{label}</p>}
      <div className="flex gap-1 mb-2 overflow-x-auto pb-1" role="tablist">
        {EMOJI_GROUPS.map((x, i) => (
          <button key={x.id} type="button" role="tab" aria-selected={i === gi} onClick={() => setGi(i)} className="flex-shrink-0 px-2.5 py-1 rounded-full text-[12px] whitespace-nowrap" style={{ background: i === gi ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', color: 'var(--color-text)', outline: i === gi ? '1.5px solid var(--color-primary)' : 'none' }} data-testid={`emoji-tab-${x.id}`}>
            {x.icon} {en ? x.labelEn : x.label}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {g.items.map((e, i) => (
          <button key={e + i} type="button" onClick={() => onChange(e)} className="w-9 h-9 rounded-full text-[18px] flex items-center justify-center" style={{ background: value === e ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', outline: value === e ? '2px solid var(--color-primary)' : 'none' }} aria-label={e}>
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Colour picker: a soft palette plus "own colour". */
export function ColorPicker({ value, onChange, label, colors = PALETTE_COLORS }: { value: string; onChange: (c: string) => void; label?: string; colors?: string[] }) {
  const { settings } = useSettings();
  const en = settings.language === 'en';
  const custom = !colors.includes(value);
  return (
    <div data-testid="color-picker">
      {label && <p className="text-[12px] text-[var(--color-text-faint)] mb-1">{label}</p>}
      <div className="flex flex-wrap gap-2 items-center">
        {colors.map((c) => (
          <button key={c} type="button" onClick={() => onChange(c)} className="w-7 h-7 rounded-full" style={{ background: c, outline: value === c ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} aria-label={c} />
        ))}
        <label className="relative w-7 h-7 rounded-full flex items-center justify-center text-[13px] cursor-pointer overflow-hidden" style={{ background: custom ? value : 'conic-gradient(#e8a83d, #6fbf73, #4a8f9e, #9a7bc4, #d9778a, #e8a83d)', outline: custom ? '3px solid var(--color-text)' : 'none', outlineOffset: 2 }} title={en ? 'Own colour' : 'Eigene Farbe'}>
          <input type="color" value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#6fbf73'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" aria-label={en ? 'Own colour' : 'Eigene Farbe'} data-testid="color-custom" />
        </label>
      </div>
    </div>
  );
}
