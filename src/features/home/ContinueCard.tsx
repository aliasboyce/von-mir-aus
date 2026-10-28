import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { RECENT_CHANGED, dismissRecent, recentViews, type RecentView } from '../../services/recentPages';

/** „Weiterbearbeiten“ – ganz unten auf der Startseite: die letzten drei Seiten, mit einem Tipp wieder da. */
export function ContinueCard({ lang }: { lang: 'de' | 'en' }) {
  const [list, setList] = useState<RecentView[]>(() => recentViews(lang));
  useEffect(() => {
    const on = () => setList(recentViews(lang));
    on();
    window.addEventListener(RECENT_CHANGED, on);
    return () => window.removeEventListener(RECENT_CHANGED, on);
  }, [lang]);
  if (!list.length) return null;
  return (
    <section className="mt-8" data-testid="home-continue" aria-label={lang === 'en' ? 'Continue' : 'Weiterbearbeiten'}>
      <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">{lang === 'en' ? 'Continue' : 'Weiterbearbeiten'}</p>
      <ul className="flex flex-col gap-2">
        {list.map((v) => (
          <li key={v.key} className="flex items-center rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)]" data-testid="home-continue-item">
            <Link to={v.path} className="flex-1 min-w-0 flex items-center gap-3 px-3.5 py-3 text-[14.5px] text-[var(--color-text)]">
              <span className="text-[20px]" aria-hidden="true">{v.emoji}</span>
              <span className="truncate">{v.label}</span>
            </Link>
            <button type="button" onClick={() => dismissRecent(v.key)} aria-label={lang === 'en' ? 'Remove from this list' : 'Aus dieser Liste entfernen'} className="w-11 h-11 shrink-0 flex items-center justify-center text-[var(--color-text-faint)]" data-testid="home-continue-x"><X size={16} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}
