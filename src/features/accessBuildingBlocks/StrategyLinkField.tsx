import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useProtectionTexts } from './protectionTexts';
import { oldProtectionStrategies } from './strategyList';
import { allObstacles, type StrategyLinks } from './strategyLinks';

/**
 * "Alternative für …" explained in two sentences, plus the connections in one place:
 * old protection strategy · is itself a new protection strategy · helps with an obstacle.
 * Used for garden plants and routines so both speak the same language as the Schutzstrategien page.
 */
export function StrategyLinkField({ value, onChange, defaultName }: { value: StrategyLinks; onChange: (v: StrategyLinks) => void; defaultName: string }) {
  const px = useProtectionTexts();
  const olds = useMemo(() => oldProtectionStrategies(), []);
  const obstacles = useMemo(() => allObstacles(), []);
  const isNew = value.newStrategy !== undefined;
  const sel = 'input';
  return (
    <div className="rounded-[var(--radius-lg)] p-3.5 mb-4" style={{ background: 'var(--color-surface-muted)' }} data-testid="strategy-link-field">
      <p className="text-[13px] font-medium text-[var(--color-text)] mb-1">{px.linkTitle}</p>
      <p className="text-[12px] text-[var(--color-text-muted)] leading-relaxed mb-3" data-testid="strategy-link-explain">{px.linkExplain}</p>

      <label className="block mb-3">
        <span className="block text-[12.5px] font-medium text-[var(--color-text-muted)] mb-1">{px.linkOld}</span>
        <select className={sel} value={value.alternativeFor ?? ''} onChange={(e) => onChange({ ...value, alternativeFor: e.target.value || undefined })} data-testid="link-old-select">
          <option value="">{px.linkNone}</option>
          {olds.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          {value.alternativeFor && !olds.includes(value.alternativeFor) && <option value={value.alternativeFor}>{value.alternativeFor}</option>}
        </select>
      </label>

      <label className="flex items-center gap-2 mb-1.5">
        <input type="checkbox" className="w-5 h-5 accent-[var(--color-primary)]" checked={isNew} onChange={(e) => onChange({ ...value, newStrategy: e.target.checked ? value.newStrategy ?? '' : undefined })} data-testid="link-is-new" />
        <span className="text-[13px] text-[var(--color-text)]">{px.linkIsNew}</span>
      </label>
      {isNew && (
        <div className="pl-7 mb-3 animate-in">
          <input className="input mb-1" placeholder={defaultName || px.linkNewName} aria-label={px.linkNewName} value={value.newStrategy ?? ''} onChange={(e) => onChange({ ...value, newStrategy: e.target.value })} data-testid="link-new-name" />
          <p className="text-[11.5px] text-[var(--color-text-faint)] leading-snug">{px.linkNewNote}</p>
        </div>
      )}

      <label className="block mb-3">
        <span className="block text-[12.5px] font-medium text-[var(--color-text-muted)] mb-1">{px.linkObstacle}</span>
        <select className={sel} value={value.forObstacle ?? ''} onChange={(e) => onChange({ ...value, forObstacle: e.target.value || undefined })} data-testid="link-obstacle-select">
          <option value="">{px.linkNone}</option>
          {obstacles.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
          {value.forObstacle && !obstacles.includes(value.forObstacle) && <option value={value.forObstacle}>{value.forObstacle}</option>}
        </select>
      </label>

      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <Link to="/entdecken/schutzstrategien" className="text-[12.5px] text-[var(--color-primary)]" data-testid="link-to-strategies">🛡️ {px.linkToStrategies} →</Link>
        <Link to="/entdecken/schutzstrategien#hindernisse" className="text-[12.5px] text-[var(--color-primary)]" data-testid="link-to-obstacles">🚧 {px.linkToObstacles} →</Link>
      </div>
    </div>
  );
}

/** a new strategy's name: what the person typed, else the entry's own title */
export function resolveNewStrategy(value: StrategyLinks, fallbackName: string): string | undefined {
  if (value.newStrategy === undefined) return undefined;
  const n = (value.newStrategy || fallbackName).trim();
  return n || undefined;
}
