import { useT } from '../../i18n';
import { useFitFilter } from '../../state/fitFilterStore';

/** Friendly empty state when the "Was geht gerade?" filter leaves nothing: says it is okay, and offers the two ways out. */
export function FitEmpty({ hiddenUnmarked = 0 }: { hiddenUnmarked?: number }) {
  const t = useT();
  const { filter, setFilter, reset } = useFitFilter();
  return (
    <div className="flex flex-col items-center text-center gap-3 py-10 px-6" data-testid="fit-empty">
      <p className="text-[15px] text-[var(--color-text)] max-w-[300px]">{t.fit.noResults}</p>
      <p className="text-[12.5px] text-[var(--color-text-muted)] leading-relaxed max-w-[300px]">{t.fit.noResultsHint}</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {hiddenUnmarked > 0 && !filter.includeUnmarked && (
          <button type="button" onClick={() => setFilter({ includeUnmarked: true })} className="rounded-full border px-4 py-2 text-[13.5px]" style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text)' }} data-testid="fit-empty-unmarked">
            {t.fit.showUnmarked} ({hiddenUnmarked})
          </button>
        )}
        <button type="button" onClick={reset} className="rounded-full px-4 py-2 text-[13.5px] text-white" style={{ background: 'var(--color-primary)' }} data-testid="fit-empty-all">
          {t.fit.showAllFit}
        </button>
      </div>
    </div>
  );
}
