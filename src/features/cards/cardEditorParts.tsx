import { useMemo } from 'react';
import { useSettings } from '../../state/SettingsContext';
import { getAnyLichtwesen } from '../../components/companion/customLichtwesen';
import { useL } from '../projects/useL';
import { DATE_FORMATS, formatCardDate } from './cardDate';
import { bodyFit } from './cardRender';
import type { CardModel, RatingKind } from './cardTypes';

const chip = (active: boolean): React.CSSProperties => ({
  background: active ? 'var(--color-primary)' : 'var(--color-surface-muted)',
  color: active ? 'var(--color-surface)' : 'var(--color-text)',
});

export type Rating = { kind: RatingKind; value: number } | undefined;

/** Eine Bewertung: Art wählen (Sterne, Energie, Herzen) und Wert antippen. */
function OneRating({ value, onChange, label }: { value: Rating; onChange: (r: Rating) => void; label: string }) {
  const { L } = useL();
  const kind = value?.kind ?? null;
  return (
    <div className="mb-3">
      <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {([null, 'star', 'bolt', 'heart'] as (RatingKind | null)[]).map((r) => (
          <button key={String(r)} type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(kind === r)} onClick={() => onChange(r ? { kind: r, value: value?.value || 3 } : undefined)}>
            {r === null ? L('keine', 'none') : r === 'star' ? '★ Sterne' : r === 'bolt' ? '⚡ Energie' : '♥ Herzen'}
          </button>
        ))}
      </div>
      {kind && (
        <div className="flex gap-1.5">
          {Array.from({ length: kind === 'bolt' ? 4 : 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => onChange({ kind, value: i + 1 === value?.value ? 0 : i + 1 })} className="w-10 h-10 rounded-full text-[18px]" style={{ background: i < (value?.value ?? 0) ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)' }} aria-label={`${i + 1}`}>
              {kind === 'star' ? '★' : kind === 'bolt' ? '⚡' : '♥'}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Bis zu zwei Bewertungen auf einer Karte. */
export function RatingsEditor({ first, second, onFirst, onSecond }: { first: Rating; second: Rating; onFirst: (r: Rating) => void; onSecond: (r: Rating) => void }) {
  const { L } = useL();
  return (
    <div data-testid="card-ratings">
      <OneRating value={first} onChange={onFirst} label={L('Bewertung (freiwillig)', 'Rating (optional)')} />
      {first && first.value > 0 && <OneRating value={second} onChange={onSecond} label={L('Zweite Bewertung (freiwillig)', 'Second rating (optional)')} />}
    </div>
  );
}

/** Den gerade aktiven Begleiter als Sticker auf die Karte setzen. */
export function CompanionStickerToggle({ value, onChange }: { value?: string; onChange: (id: string | undefined) => void }) {
  const { L } = useL();
  const { settings } = useSettings();
  const being = settings.companionChosen ? getAnyLichtwesen(settings.selectedBrainId) : null;
  if (!being) return null;
  const on = !!value;
  return (
    <div className="mb-3">
      <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1.5">{L('Begleiter-Sticker', 'Companion sticker')}</p>
      <button type="button" className="px-3 py-1.5 rounded-full text-[13px]" style={chip(on)} onClick={() => onChange(on ? undefined : being.id)} data-testid="card-companion-sticker">
        🌟 {on ? L(`${being.name} klebt drauf`, `${being.name} is on it`) : L(`${being.name} als Sticker aufkleben`, `Stick ${being.name} on`)}
      </button>
    </div>
  );
}

/** Datum mit wählbarem Format (auch nur Wochentag + Zahlen, nur Zahlen …). */
export function DateEditor({ date, format, onDate, onFormat, formatOnly = false }: { date: string; format?: string; onDate: (d: string) => void; onFormat: (f: string) => void; formatOnly?: boolean }) {
  const { L, lang } = useL();
  return (
    <div data-testid="card-date-editor">
      {!formatOnly && (
        <>
          <label className="block text-[12.5px] text-[var(--color-text-muted)] mt-3 mb-1">{L('Datum (freiwillig)', 'Date (optional)')}</label>
          <div className="flex gap-2 items-center">
            <input type="date" className="input" value={date} onChange={(e) => onDate(e.target.value)} />
            {date && <button type="button" className="text-[12.5px] text-[var(--color-primary)]" onClick={() => onDate('')}>{L('weg', 'clear')}</button>}
          </div>
        </>
      )}
      {formatOnly && <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('So soll das Datum auf der Karte stehen:', 'How the date should appear on the card:')}</p>}
      {date && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {DATE_FORMATS.map((f) => (
            <button key={f.id} type="button" className="px-3 py-1.5 rounded-full text-[12.5px]" style={chip((format ?? 'long') === f.id)} onClick={() => onFormat(f.id)} data-testid={`card-datefmt-${f.id}`}>
              {formatCardDate(date, lang, f.id)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Hinweis, wenn der Text nicht ganz auf die Karte passt. */
export function FitHint({ card }: { card: CardModel }) {
  const { L } = useL();
  const fit = useMemo(() => bodyFit(card), [card]);
  if (!fit.truncated) return null;
  const pct = Math.max(10, Math.min(95, Math.round((fit.shownChars / Math.max(1, fit.totalChars)) * 100)));
  return (
    <p className="text-[12.5px] leading-snug mt-2 p-2.5 rounded-[var(--radius-md)]" style={{ background: 'var(--color-primary-soft)', color: 'var(--color-text)' }} role="status" data-testid="card-fit-hint">
      {L(
        `Auf der Karte ist nicht für alles Platz – gedruckt und im Kartenbild siehst du etwa die ersten ${fit.shownChars} von ${fit.totalChars} Zeichen (${pct} %). In der App kannst du die Karte öffnen und alles ausklappen und lesen.`,
        `The card has no room for everything – printed and in the card picture you see about the first ${fit.shownChars} of ${fit.totalChars} characters (${pct} %). In the app you can open the card and expand to read everything.`,
      )}
    </p>
  );
}
