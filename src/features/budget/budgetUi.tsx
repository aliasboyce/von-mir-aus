import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Camera, Trash2, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import type { HelpKey } from '../../components/navigation/helpContent';
import { useSettings } from '../../state/SettingsContext';
import { deleteOwnMedia, ownMediaUrl, saveOwnMedia } from '../../services/mediaStore';
import { resizeImageKeepAlpha } from '../../services/imageResize';
import { BUDGET_CHANGED, seedBudget, REMIND_OPTIONS, WHERE_SUGGESTIONS, addMonths, budgetSettingsStore, money, monthName, notifyBudget, parseAmount, type Lfn } from './budgetModel';
import { loadBudget, type BudgetData } from './budgetCalc';

export function useBudget() {
  const { settings } = useSettings();
  const lang: 'de' | 'en' = settings.language === 'en' ? 'en' : 'de';
  const L: Lfn = (de, en) => (lang === 'en' ? en : de);
  const [rev, setRev] = useState(0);
  // Standard-Bereiche und Sparschwein einmalig anlegen (vor dem ersten Lesen)
  useState(() => { try { seedBudget(lang); } catch { /* ignore */ } return 0; });
  useEffect(() => {
    const f = () => setRev((r) => r + 1);
    window.addEventListener(BUDGET_CHANGED, f);
    return () => window.removeEventListener(BUDGET_CHANGED, f);
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data: BudgetData = useMemo(() => loadBudget(), [rev]);
  const cur = budgetSettingsStore.get().currency || '€';
  const m = (n: number, o?: { sign?: boolean; round?: boolean }) => money(n, cur, lang, o);
  return { data, lang, L, cur, m, reduceMotion: !!settings.reduceMotion, changed: notifyBudget };
}

export const card = 'rounded-[var(--radius-lg)] bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-sm)]';
export const pill = (on: boolean) => `px-3 py-1.5 rounded-full text-[13px] border shrink-0 ${on ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)] bg-[var(--color-surface)]'}`;
export const primaryBtn = 'h-11 px-5 rounded-full text-white text-[14.5px] inline-flex items-center justify-center gap-1.5 disabled:opacity-40';
export const ghostBtn = 'h-11 px-4 rounded-full text-[14px] border border-[var(--color-border-strong)] text-[var(--color-text)] bg-[var(--color-surface)] inline-flex items-center justify-center gap-1.5';

/** Seitenkopf jeder Unterseite: eigene Farbe, großes Symbol, ein Satz Erklärung */
export function SubPage({ title, emoji, color, hint, children, helpKey = 'budget' as HelpKey, actions }: { title: string; emoji: string; color: string; hint?: string; children: ReactNode; helpKey?: HelpKey; actions?: ReactNode }) {
  return (
    <div className="pb-28" data-testid="budget-sub">
      <TopBar action={<div className="flex items-center gap-1">{actions}<HelpButton helpKey={helpKey} /></div>} />
      <div className="mx-4 mb-4 rounded-[var(--radius-xl)] px-4 py-4 flex items-center gap-3" style={{ background: `${color}22`, border: `1.5px solid ${color}55` }}>
        <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-[26px] shrink-0" style={{ background: `${color}33` }} aria-hidden>{emoji}</span>
        <div className="min-w-0">
          <h1 className="text-[21px] leading-tight" style={{ color: 'var(--color-text)' }}>{title}</h1>
          {hint && <p className="text-[12.5px] text-[var(--color-text-muted)] mt-0.5">{hint}</p>}
        </div>
      </div>
      <div className="px-4 flex flex-col gap-3">{children}</div>
    </div>
  );
}

export function MonthBar({ ym, onChange, lang, L }: { ym: string; onChange: (ym: string) => void; lang: 'de' | 'en'; L: Lfn }) {
  return (
    <div className="flex items-center justify-between gap-2" data-testid="budget-monthbar">
      <button type="button" onClick={() => onChange(addMonths(ym, -1))} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)]" aria-label={L('Vormonat', 'Previous month')} data-testid="budget-prev"><ChevronLeft size={20} /></button>
      <p className="text-[17px] font-[var(--font-display)] capitalize" data-testid="budget-month">{monthName(ym, lang)}</p>
      <button type="button" onClick={() => onChange(addMonths(ym, 1))} className="w-11 h-11 rounded-full flex items-center justify-center bg-[var(--color-surface)] border border-[var(--color-border)]" aria-label={L('Nächster Monat', 'Next month')} data-testid="budget-next"><ChevronRight size={20} /></button>
    </div>
  );
}

/** Betragsfeld: tippt man „12,5“ oder „12.50“, wird es verstanden */
export function AmountField({ value, onChange, label, testId, autoFocus, big, placeholder = '0', cur }: { value: number | undefined; onChange: (v: number | undefined) => void; label?: string; testId?: string; autoFocus?: boolean; big?: boolean; placeholder?: string; cur?: string }) {
  const [txt, setTxt] = useState(value === undefined ? '' : String(value).replace('.', ','));
  useEffect(() => {
    // von außen geändert (z. B. Münze angetippt)
    const parsed = parseAmount(txt);
    if ((value ?? null) !== (parsed ?? null)) setTxt(value === undefined ? '' : String(value).replace('.', ','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <label className="block">
      {label && <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{label}</span>}
      <span className="relative block">
        <input
          className={`input ${big ? '!h-16 !text-[28px] text-center font-[var(--font-display)]' : ''} ${cur ? '!pr-9' : ''}`}
          inputMode="decimal"
          value={txt}
          placeholder={placeholder}
          autoFocus={autoFocus}
          onChange={(e) => { setTxt(e.target.value); const v = parseAmount(e.target.value); onChange(v === null ? undefined : v); }}
          data-testid={testId}
        />
        {cur && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none">{cur}</span>}
      </span>
    </label>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[11.5px] text-[var(--color-text-faint)] mt-1">{hint}</span>}
    </label>
  );
}

export function TextField({ value, onChange, label, placeholder, testId, hint }: { value: string | undefined; onChange: (v: string) => void; label: string; placeholder?: string; testId?: string; hint?: string }) {
  return (
    <Field label={label} hint={hint}>
      <input className="input" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
    </Field>
  );
}

/** „Wo liegt …?“ mit Vorschlägen zum Antippen */
export function WhereField({ value, onChange, label, L, testId }: { value: string | undefined; onChange: (v: string) => void; label: string; L: Lfn; testId?: string }) {
  return (
    <div>
      <TextField value={value} onChange={onChange} label={label} placeholder={L('z. B. blauer Ordner, Schublade …', 'e.g. blue folder, drawer …')} testId={testId} />
      <div className="flex gap-1.5 flex-wrap mt-1.5">
        {WHERE_SUGGESTIONS.map(([de, en]) => {
          const t = L(de, en);
          return <button key={de} type="button" onClick={() => onChange(t)} className={pill(value === t)} style={value === t ? { background: 'var(--color-primary)' } : undefined}>{t}</button>;
        })}
      </div>
    </div>
  );
}

export function RemindField({ value, onChange, L, cal, onCal, testId }: { value: number | null | undefined; onChange: (v: number | null) => void; L: Lfn; cal: boolean | undefined; onCal: (v: boolean) => void; testId?: string }) {
  return (
    <div className="rounded-[var(--radius-md)] bg-[var(--color-surface-muted)] px-3 py-2.5" data-testid={testId}>
      <label className="flex items-center gap-2 text-[14px]">
        <input type="checkbox" checked={!!cal} onChange={(e) => onCal(e.target.checked)} className="w-5 h-5" data-testid={`${testId}-cal`} />
        {L('Im Kalender zeigen', 'Show in the calendar')}
      </label>
      {cal && (
        <div className="mt-2">
          <p className="text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Mich vorher erinnern (kommt ins Postfach)', 'Remind me beforehand (arrives in the mailbox)')}</p>
          <div className="flex gap-1.5 flex-wrap">
            {REMIND_OPTIONS.map((o) => {
              const on = (value ?? null) === o.v;
              return <button key={String(o.v)} type="button" onClick={() => onChange(o.v)} className={pill(on)} style={on ? { background: 'var(--color-primary)' } : undefined} data-testid={`${testId}-r${o.v ?? 'none'}`}>{L(o.de, o.en)}</button>;
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/** Foto (liegt nur auf diesem Gerät) */
export function PhotoField({ id, onChange, L, label, testId }: { id: string | undefined; onChange: (id: string | undefined) => void; L: Lfn; label: string; testId?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  useEffect(() => {
    let alive = true;
    if (id) void ownMediaUrl(id).then((u) => alive && setUrl(u));
    else setUrl(null);
    return () => { alive = false; };
  }, [id]);
  const pick = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setMsg('');
    try {
      const small = await resizeImageKeepAlpha(file, 1600, 0.82);
      const blob = await (await fetch(small.url)).blob();
      const ref = await saveOwnMedia(blob, file.name);
      if (ref) {
        if (id) void deleteOwnMedia(id);
        onChange(ref.id);
      } else setMsg(L('Das Foto konnte nicht gespeichert werden.', 'The photo could not be saved.'));
    } catch {
      setMsg(L('Das Foto konnte nicht gelesen werden.', 'The photo could not be read.'));
    }
    setBusy(false);
  };
  return (
    <div>
      <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{label}</span>
      {url && id ? (
        <div className="relative inline-block">
          <img src={url} alt="" className="max-h-48 rounded-[var(--radius-md)] border border-[var(--color-border)]" data-testid={`${testId}-img`} />
          <button type="button" onClick={() => { void deleteOwnMedia(id); onChange(undefined); }} className="absolute top-1.5 right-1.5 w-8 h-8 rounded-full bg-[var(--color-surface)] shadow flex items-center justify-center text-[var(--color-danger)]" aria-label={L('Foto entfernen', 'Remove photo')}><Trash2 size={15} /></button>
        </div>
      ) : (
        <label className={`${ghostBtn} cursor-pointer`}>
          <Camera size={17} /> {busy ? L('Einen Moment …', 'One moment …') : L('Foto machen oder aussuchen', 'Take or choose a photo')}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ''; }} data-testid={testId} />
        </label>
      )}
      {msg && <p className="text-[12.5px] text-[var(--color-danger)] mt-1" role="status">{msg}</p>}
      <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1">{L('Das Foto bleibt nur auf diesem Gerät.', 'The photo stays on this device only.')}</p>
    </div>
  );
}

export function Empty({ emoji, text }: { emoji: string; text: string }) {
  return (
    <div className="text-center text-[14px] text-[var(--color-text-muted)] py-6 px-4" data-testid="budget-empty">
      <p className="text-[34px] mb-1" aria-hidden>{emoji}</p>
      <p>{text}</p>
    </div>
  );
}

/** Zeile in einem Kopf mit Schließen-Knopf (für eigene Blätter) */
export function SheetHeader({ title, onClose, L }: { title: string; onClose: () => void; L: Lfn }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-[19px]">{title}</h2>
      <button type="button" onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-muted)]" aria-label={L('Schließen', 'Close')}><X size={19} /></button>
    </div>
  );
}

/** schlichter Balken */
export function Bar({ value, max, color, h = 10, testId }: { value: number; max: number; color: string; h?: number; testId?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className="rounded-full overflow-hidden bg-[var(--color-surface-muted)]" style={{ height: h }} data-testid={testId}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width .4s ease' }} />
    </div>
  );
}

/** kleine Rückmeldung unten, verschwindet von allein */
export interface ToastAction { label: string; run: () => void }
/**
 * Kleine Meldung unten. Farben sind „umgekehrt“ zur Seite (heller Text auf dunklem Grund im hellen Modus, dunkler Text auf hellem Grund
 * im dunklen Modus) – so ist sie in beiden Modi gut lesbar. Optional mit einem Knopf (z. B. „Zurück“) – dann steht sie oben, damit das Wesen unten den Knopf nicht verdeckt.
 */
export function useToast(): [ReactNode, (m: string, action?: ToastAction, ms?: number) => void] {
  const [msg, setMsg] = useState('');
  const [act, setAct] = useState<ToastAction | undefined>();
  const say = (m: string, action?: ToastAction, ms = 2600) => {
    setMsg(m);
    setAct(action);
    window.setTimeout(() => setMsg((c) => (c === m ? '' : c)), action ? Math.max(ms, 9000) : ms);
  };
  const node = msg ? (
    <div className={`fixed left-0 right-0 ${act ? 'top-[76px]' : 'bottom-24'} z-[260] flex justify-center px-4 pointer-events-none`} role="status" data-testid="budget-toast">
      <div className="rounded-[22px] pl-5 pr-2 py-2 text-[14px] shadow-lg flex items-center gap-3 max-w-[92vw] pointer-events-auto" style={{ background: 'var(--color-text)', color: 'var(--color-surface)' }}>
        <span className="py-1">{msg}</span>
        {act && <button type="button" onClick={() => { act.run(); setMsg(''); setAct(undefined); }} className="shrink-0 h-10 px-4 rounded-full text-[14px] font-medium" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }} data-testid="budget-toast-action">{act.label}</button>}
      </div>
    </div>
  ) : null;
  return [node, say];
}

const EMOJI_CHOICES = ['💼', '🏠', '💡', '🔥', '🚰', '📱', '🌐', '🩺', '☂️', '🚆', '🚗', '🎬', '🎧', '🎮', '📚', '🏋️', '🎒', '🧸', '🌿', '🐾', '🧾', '🎁', '🛒', '💊', '💰', '✨'];
export function EmojiRow({ value, onChange, L }: { value: string; onChange: (e: string) => void; L: Lfn }) {
  return (
    <div>
      <span className="block text-[12.5px] text-[var(--color-text-muted)] mb-1">{L('Symbol', 'Symbol')}</span>
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {EMOJI_CHOICES.map((e) => (
          <button key={e} type="button" onClick={() => onChange(e)} className="w-10 h-10 shrink-0 rounded-xl text-[20px] flex items-center justify-center" style={{ background: value === e ? 'var(--color-primary-soft)' : 'var(--color-surface-muted)', outline: value === e ? '2px solid var(--color-primary)' : 'none' }} aria-label={e}>{e}</button>
        ))}
      </div>
    </div>
  );
}

/** Löschen mit zweitem Tippen – nichts geht aus Versehen verloren */
export function DeleteButton({ onDelete, L, label, testId }: { onDelete: () => void; L: Lfn; label?: string; testId?: string }) {
  const [ask, setAsk] = useState(false);
  return ask ? (
    <span className="inline-flex gap-2 items-center">
      <button type="button" onClick={onDelete} className="h-11 px-4 rounded-full text-[14px] text-white" style={{ background: 'var(--color-danger)' }} data-testid={`${testId}-yes`}>{L('Ja, löschen', 'Yes, delete')}</button>
      <button type="button" onClick={() => setAsk(false)} className={ghostBtn}>{L('Doch nicht', 'Never mind')}</button>
    </span>
  ) : (
    <button type="button" onClick={() => setAsk(true)} className={`${ghostBtn} !text-[var(--color-danger)]`} data-testid={testId}><Trash2 size={15} /> {label ?? L('Löschen', 'Delete')}</button>
  );
}

export function DateField({ value, onChange, label, testId }: { value: string | undefined; onChange: (v: string) => void; label: string; testId?: string }) {
  return (
    <Field label={label}>
      <input type="date" className="input" value={value ?? ''} onChange={(e) => onChange(e.target.value)} data-testid={testId} />
    </Field>
  );
}

export function ChipRow<T extends string | number>({ options, value, onChange, testId }: { options: { v: T; label: string }[]; value: T | undefined; onChange: (v: T) => void; testId?: string }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {options.map((o) => (
        <button key={String(o.v)} type="button" onClick={() => onChange(o.v)} className={pill(o.v === value)} style={o.v === value ? { background: 'var(--color-primary)' } : undefined} data-testid={testId ? `${testId}-${o.v}` : undefined}>{o.label}</button>
      ))}
    </div>
  );
}
