import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Search, X } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { useL } from '../projects/useL';
import { GLOSSAR_CATS, GLOSSAR_TERMS, type GlossarCat } from './glossarData';

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/** Das Wörterbuch: alle Begriffe der App, nach Rubriken, durchsuchbar – jeder mit Link direkt dorthin. */
export function GlossarPage() {
  const { L, lang } = useL();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<GlossarCat | 'all'>('all');

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    GLOSSAR_TERMS.forEach((t) => { m[t.cat] = (m[t.cat] ?? 0) + 1; });
    return m;
  }, []);

  const shown = useMemo(() => {
    const nq = norm(q.trim());
    return GLOSSAR_TERMS.filter((t) => {
      if (cat !== 'all' && t.cat !== cat) return false;
      if (!nq) return true;
      const hay = norm(`${t.de.term} ${t.de.means} ${t.en.term} ${t.en.means} ${t.kw ?? ''}`);
      return hay.includes(nq);
    });
  }, [q, cat]);

  const groups = GLOSSAR_CATS.map((c) => ({
    c,
    items: shown.filter((t) => t.cat === c.id).sort((a, b) => (a.cat === 'funk' ? 0 : a.de.term.localeCompare(b.de.term, 'de'))),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="min-h-dvh pb-24">
      <TopBar />
      <div className="px-5">
        <h1 className="text-[24px] mb-1" data-testid="glossar-title">📖 {L('Wörterbuch', 'Dictionary')}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-4 leading-relaxed">
          {L(
            'Alle Wörter, die in der App vorkommen – nach Rubriken sortiert. Tippe auf „Dorthin“, dann kommst du direkt an die Stelle. Du musst nichts davon auswendig kennen.',
            'All words used in the app – sorted by section. Tap “Go there” to land right on the spot. You do not have to know any of it by heart.',
          )}
        </p>

        <label className="relative block mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)]" aria-hidden="true" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={L('Wort suchen …', 'Search a word …')}
            aria-label={L('Wort suchen', 'Search a word')}
            data-testid="glossar-search"
            className="w-full min-h-[44px] rounded-[var(--radius-lg)] pl-9 pr-10 text-[15px] bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-text)]"
          />
          {q && (
            <button type="button" onClick={() => setQ('')} aria-label={L('Suche leeren', 'Clear search')} className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center text-[var(--color-text-muted)]">
              <X size={16} />
            </button>
          )}
        </label>

        <div className="flex flex-wrap gap-2 mb-5" role="group" aria-label={L('Rubriken', 'Sections')}>
          {([{ id: 'all' as const, emoji: '📖', name: L('Alle', 'All'), n: GLOSSAR_TERMS.length }, ...GLOSSAR_CATS.map((c) => ({ id: c.id, emoji: c.emoji, name: lang === 'en' ? c.en.name : c.de.name, n: counts[c.id] ?? 0 }))]).map((c) => {
            const on = cat === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCat(c.id)}
                aria-pressed={on}
                data-testid={`glossar-cat-${c.id}`}
                className="min-h-[40px] px-3 rounded-full text-[13.5px] border"
                style={{
                  background: on ? 'var(--color-primary-soft)' : 'var(--color-surface)',
                  color: on ? 'var(--color-primary-soft-text)' : 'var(--color-text-muted)',
                  borderColor: on ? 'var(--color-primary)' : 'var(--color-border)',
                }}
              >
                <span aria-hidden="true">{c.emoji} </span>{c.name} <span className="opacity-70">· {c.n}</span>
              </button>
            );
          })}
        </div>

        {groups.length === 0 && (
          <p className="text-[14px] text-[var(--color-text-muted)] py-6" data-testid="glossar-empty">
            {L('Dazu habe ich nichts gefunden. Vielleicht anders geschrieben? Oder ohne Rubrik suchen („Alle“).', 'Nothing found. Maybe spelled differently? Or search without a section (“All”).')}
          </p>
        )}

        <div className="flex flex-col gap-7">
          {groups.map(({ c, items }) => (
            <section key={c.id} aria-labelledby={`gl-h-${c.id}`} data-testid={`glossar-section-${c.id}`}>
              <h2 id={`gl-h-${c.id}`} className="text-[18px] mb-0.5"><span aria-hidden="true">{c.emoji} </span>{lang === 'en' ? c.en.name : c.de.name}</h2>
              <p className="text-[12.5px] text-[var(--color-text-faint)] mb-2.5">{lang === 'en' ? c.en.sub : c.de.sub}</p>
              <div className="flex flex-col gap-2.5">
                {items.map((x) => {
                  const t = lang === 'en' ? x.en : x.de;
                  return (
                    <Card key={x.id} padding="md" data-testid={`glossar-${x.id}`}>
                      <p className="text-[15.5px] text-[var(--color-text)] mb-1"><span aria-hidden="true">{x.emoji} </span>{t.term}</p>
                      <p className="text-[13.5px] text-[var(--color-text-muted)] leading-relaxed">{t.means}</p>
                      {x.to ? (
                        <Link to={x.to} data-testid={`glossar-go-${x.id}`} className="inline-flex items-center gap-0.5 text-[13.5px] text-[var(--color-primary)] mt-2 py-1.5 min-h-[40px]">
                          {L('Dorthin', 'Go there')} <ChevronRight size={15} />
                        </Link>
                      ) : (
                        <p className="text-[12px] text-[var(--color-text-faint)] mt-2">{L('Öffnet sich direkt auf der Startseite.', 'Opens right on the start page.')}</p>
                      )}
                    </Card>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
