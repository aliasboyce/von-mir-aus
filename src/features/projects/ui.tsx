import { useState, type ReactNode } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ME, REMIND_CHOICES, type Project, type ProjectBlock, type Remind } from './projectModel';

export type Lfn = (de: string, en: string) => string;

export interface BlockProps<B extends ProjectBlock = ProjectBlock> {
  block: B;
  project: Project;
  L: Lfn;
  lang: 'de' | 'en';
  /** ersetzt den Baustein */
  onChange: (b: B) => void;
  /** ändert das Projekt (Personen, Rollen …) */
  onProject: (fn: (p: Project) => Project) => void;
}

export function IconBtn({ onClick, label, children, danger, testId, disabled }: { onClick: () => void; label: string; children: ReactNode; danger?: boolean; testId?: string; disabled?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} disabled={disabled} className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center disabled:opacity-30 ${danger ? 'text-[var(--color-danger)]' : 'text-[var(--color-text-muted)]'}`} data-testid={testId}>
      {children}
    </button>
  );
}

export function DelBtn({ onClick, L, testId }: { onClick: () => void; L: Lfn; testId?: string }) {
  return <IconBtn onClick={onClick} label={L('Entfernen', 'Remove')} danger testId={testId}><Trash2 size={16} /></IconBtn>;
}

/** eine Zeile eintippen, Enter oder + fügt hinzu */
export function AddRow({ placeholder, onAdd, testId, cta }: { placeholder: string; onAdd: (text: string) => void; testId: string; cta?: string }) {
  const [v, setV] = useState('');
  const go = () => {
    const t = v.trim();
    if (!t) return;
    onAdd(t);
    setV('');
  };
  return (
    <div className="flex gap-2 mt-2">
      <input
        className="input flex-1 min-w-0"
        value={v}
        placeholder={placeholder}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); go(); } }}
        data-testid={`${testId}-input`}
      />
      <button type="button" onClick={go} disabled={!v.trim()} aria-label={cta ?? placeholder} className="h-11 px-3.5 rounded-full text-white disabled:opacity-40 flex items-center gap-1 text-[14px]" style={{ background: 'var(--color-primary)' }} data-testid={`${testId}-add`}>
        <Plus size={16} />{cta ?? ''}
      </button>
    </div>
  );
}

export function PersonSelect({ project, value, onChange, L, withMe, label, testId }: { project: Project; value: string | undefined; onChange: (v: string | undefined) => void; L: Lfn; withMe?: boolean; label?: string; testId?: string }) {
  if (project.people.length === 0 && !withMe) return null;
  return (
    <select className="input !h-9 !py-0 text-[13px] max-w-[9.5rem]" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} aria-label={label ?? L('Wer', 'Who')} data-testid={testId}>
      <option value="">{label ?? L('Wer?', 'Who?')}</option>
      {withMe && <option value={ME}>{L('Ich', 'Me')}</option>}
      {project.people.map((p) => <option key={p.id} value={p.id}>{p.name || '…'}</option>)}
    </select>
  );
}

export function RemindSelect({ value, onChange, L, testId }: { value: Remind; onChange: (v: Remind) => void; L: Lfn; testId?: string }) {
  return (
    <select className="input !h-9 !py-0 text-[13px]" value={value == null ? '' : String(value)} onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))} aria-label={L('Erinnerung', 'Reminder')} data-testid={testId}>
      <option value="">{L('Keine Erinnerung', 'No reminder')}</option>
      {REMIND_CHOICES.map((r) => <option key={r.v} value={r.v}>{L(r.de, r.en)}</option>)}
    </select>
  );
}

export function SmallLabel({ children }: { children: ReactNode }) {
  return <span className="block text-[12px] text-[var(--color-text-muted)] mb-0.5">{children}</span>;
}

export const chipCls = (on: boolean) => `px-3 py-1.5 rounded-full text-[13px] border transition-colors ${on ? 'text-white border-transparent' : 'text-[var(--color-text-muted)] border-[var(--color-border-strong)]'}`;
export const chipOn = { background: 'var(--color-primary)' };

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-[13px] text-[var(--color-text-faint)] py-1">{children}</p>;
}

/** Das Zeichen eines Projekts: eigenes Bild, Symbol – oder (ohne beides) nur ein Farbpunkt. */
export function ProjectIcon({ p, size = 28 }: { p: Pick<Project, 'emoji' | 'image' | 'color'>; size?: number }) {
  if (p.image) return <img src={p.image} alt="" className="rounded-[inherit] object-cover" style={{ width: '100%', height: '100%' }} />;
  if (p.emoji) return <span style={{ fontSize: size }} className="leading-none">{p.emoji}</span>;
  return <span className="rounded-full block" style={{ width: size * 0.7, height: size * 0.7, background: p.color }} aria-hidden="true" />;
}

/** „Steht an“ oder „Schon erledigt“ – damit man auch Geschafftes nachtragen kann. */
export function AddModeToggle({ done, onChange, L, testId }: { done: boolean; onChange: (done: boolean) => void; L: Lfn; testId: string }) {
  return (
    <div className="flex gap-1.5 mt-2" role="group" aria-label={L('Wie eintragen?', 'How to add?')}>
      <button type="button" onClick={() => onChange(false)} aria-pressed={!done} className={chipCls(!done)} style={!done ? chipOn : undefined} data-testid={`${testId}-open`}>{L('Steht an', 'Coming up')}</button>
      <button type="button" onClick={() => onChange(true)} aria-pressed={done} className={chipCls(done)} style={done ? chipOn : undefined} data-testid={`${testId}-done`}>✓ {L('Schon erledigt', 'Already done')}</button>
    </div>
  );
}
