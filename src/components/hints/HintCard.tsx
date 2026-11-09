import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { hintById, isHintAvailable, markTipShown, snoozeHint, hideHintForever } from '../../services/hintCards';
import { useSettings } from '../../state/SettingsContext';
import { useL } from '../../features/projects/useL';
import { Button } from '../ui/Button';

/**
 * A gentle hint card. `variant="after"` dims the page softly and sits in the
 * middle (right after a function ended); `variant="tip"` is a small card at
 * the bottom that does not cover anything important.
 *  ✕ = close for now (it may come back), "Gar nicht mehr anzeigen" = never again.
 */
export function HintCard({ hintId, delayMs = 600 }: { hintId: string; delayMs?: number }) {
  const { L, lang } = useL();
  const { settings } = useSettings();
  const hint = hintById(hintId);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hint || settings.hintCards === false || !isHintAvailable(hintId)) return;
    const tm = window.setTimeout(() => { setOpen(true); if (hint.kind === 'tip') markTipShown(); }, delayMs);
    return () => window.clearTimeout(tm);
  }, [hint, hintId, delayMs, settings.hintCards]);

  if (!hint || !open) return null;
  const c = lang === 'en' ? hint.en : hint.de;
  const after = hint.kind === 'after';
  const closeNow = () => { snoozeHint(hintId); setOpen(false); };
  const never = () => { hideHintForever(hintId); setOpen(false); };

  const card = (
    <div role="dialog" aria-label={c.title} className="relative w-full rounded-[var(--radius-xl)] p-5 pr-12 animate-in" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-md)', maxWidth: 380 }} data-testid={`hint-${hintId}`}>
      <button type="button" onClick={closeNow} aria-label={L('Schließen – kommt später wieder', 'Close – may come back later')} className="absolute top-2.5 right-2.5 w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]" data-testid="hint-close">
        <X size={18} />
      </button>
      <p className="text-[16px] font-medium text-[var(--color-text)] mb-1.5">{c.title}</p>
      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{c.text}</p>
      {hint.links.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {hint.links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => { snoozeHint(hintId, 7 * 24 * 3600 * 1000); setOpen(false); }} data-testid="hint-link">
              <Button fullWidth variant="secondary" size="sm">{lang === 'en' ? l.en : l.de}</Button>
            </Link>
          ))}
        </div>
      )}
      <div className="flex items-center justify-between mt-3">
        <button type="button" onClick={never} className="text-[12.5px] text-[var(--color-text-faint)] underline underline-offset-2 py-2" data-testid="hint-never">
          {L('Gar nicht mehr anzeigen', 'Never show again')}
        </button>
        <button type="button" onClick={closeNow} className="text-[12.5px] text-[var(--color-text-muted)] py-2 px-2" data-testid="hint-ok">
          {L('Okay', 'Okay')}
        </button>
      </div>
    </div>
  );

  if (after) {
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center px-5" style={{ background: 'rgba(20,20,20,0.32)' }} data-testid="hint-overlay">
        {card}
      </div>
    );
  }
  return (
    <div className="fixed left-0 right-0 z-[55] flex justify-center px-4" style={{ bottom: 'calc(84px + env(safe-area-inset-bottom))' }} data-testid="hint-tip">
      {card}
    </div>
  );
}
