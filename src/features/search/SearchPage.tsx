import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Clock, ChevronDown, CircleHelp } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { MarkdownLite } from '../../components/shared/MarkdownLite';
import { createKeyValueStore } from '../../services/storage/keyValueStore';
import { useL } from '../projects/useL';
import { HELP_CONTENT } from '../../components/navigation/helpContent';
import { buildSearchIndex, type IndexEntry, type HitKind } from './searchIndex';
import { queryTokens, scoreDoc, snippetFor } from './searchEngine';
import { FAQ } from './faqData';

export const searchRecentStore = createKeyValueStore<string[]>('search-recent', []);

type Filter = 'all' | HitKind;

interface Hit {
  entry: IndexEntry;
  score: number;
  full: boolean;
}

const PAGE = 8;

function runSearch(index: IndexEntry[], q: string): Hit[] {
  const tokens = queryTokens(q);
  if (!tokens.length) return [];
  const hits: Hit[] = [];
  for (const entry of index) {
    const r = scoreDoc(tokens, entry.doc);
    if (r.score > 0) hits.push({ entry, score: r.score + (entry.kind === 'func' ? 2 : 0), full: r.full });
  }
  hits.sort((a, b) => Number(b.full) - Number(a.full) || b.score - a.score);
  return hits;
}

function Marked({ text, marks }: { text: string; marks: [number, number][] }) {
  const parts: React.ReactNode[] = [];
  let at = 0;
  const sorted = [...marks].sort((a, b) => a[0] - b[0]);
  sorted.forEach(([a, b], i) => {
    if (a < at) return;
    if (a > at) parts.push(text.slice(at, a));
    parts.push(
      <mark key={i} className="bg-[color-mix(in_srgb,var(--color-primary)_28%,transparent)] text-[var(--color-text)] rounded px-0.5">
        {text.slice(a, b)}
      </mark>,
    );
    at = b;
  });
  if (at < text.length) parts.push(text.slice(at));
  return <>{parts}</>;
}

export function SearchPage() {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [more, setMore] = useState<Record<string, number>>({});
  const [recent, setRecent] = useState<string[]>(() => searchRecentStore.get());
  const [helpOpen, setHelpOpen] = useState<IndexEntry | null>(null);
  const [index, setIndex] = useState<IndexEntry[] | null>(null);
  const [faqOpen, setFaqOpen] = useState(false);
  const [faqAt, setFaqAt] = useState<string | null>(null);

  // Index frisch aus dem Speicher bauen (nach dem ersten Zeichnen, damit die Seite sofort da ist)
  useEffect(() => {
    const t = window.setTimeout(() => setIndex(buildSearchIndex()), 20);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(q), 120);
    return () => window.clearTimeout(t);
  }, [q]);

  useEffect(() => setMore({}), [debounced, filter]);

  const hits = useMemo(() => (index && debounced.trim() ? runSearch(index, debounced) : []), [index, debounced]);
  const tokens = useMemo(() => queryTokens(debounced), [debounced]);
  const full = hits.filter((h) => h.full);
  const similar = hits.filter((h) => !h.full);
  const shown = full.length ? full : similar;
  const isSimilarOnly = !full.length && similar.length > 0;

  const counts: Record<HitKind, number> = { func: 0, data: 0, help: 0 };
  shown.forEach((h) => counts[h.entry.kind]++);

  const sections: { kind: HitKind; title: string }[] = [
    { kind: 'func', title: L('Funktionen der App', 'App functions') },
    { kind: 'data', title: L('Von dir geschrieben', 'Written by you') },
    { kind: 'help', title: L('Anleitungen', 'Guides') },
  ];

  function remember(text: string) {
    const t = text.trim();
    if (t.length < 2) return;
    const next = [t, ...searchRecentStore.get().filter((r) => r.toLowerCase() !== t.toLowerCase())].slice(0, 8);
    searchRecentStore.set(next);
    setRecent(next);
  }

  function open(e: IndexEntry) {
    remember(q);
    if (e.kind === 'help') {
      setHelpOpen(e);
      return;
    }
    if (e.action === 'grounding') {
      navigate('/', { state: { openGrounding: true } });
      return;
    }
    if (e.to) navigate(e.to);
  }

  const hasQuery = !!debounced.trim();
  const ex = lang === 'en' ? ['diary', 'backup', 'slip', '3D'] : ['Tagebuch', 'Sicherung', 'Zettel', '3D'];

  return (
    <div className="pb-24" data-testid="search-page">
      <TopBar action={<HelpButton helpKey="suche" />} />
      <div className="px-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-[24px] text-[var(--color-text)]">{L('Lupe', 'Magnifier')}</h1>
          <button type="button" onClick={() => setFaqOpen((v) => !v)} aria-pressed={faqOpen} data-testid="search-faq-btn" className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-full text-[14px] border ${faqOpen ? 'bg-[var(--color-primary)] text-[var(--color-bg)] border-transparent' : 'border-[var(--color-border-strong)] text-[var(--color-text)] bg-[var(--color-surface)]'}`}>
            <CircleHelp size={16} />FAQ
          </button>
        </div>
        <p data-hint className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">
          {L(
            'Suche nach Funktionen der App – und nach allem, was du selbst geschrieben hast. Ein Wortteil reicht, kleine Tippfehler sind okay.',
            'Search for app functions — and for everything you wrote yourself. A word part is enough, small typos are fine.',
          )}
        </p>

        <div className="relative mb-3">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-faint)] pointer-events-none" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); if (e.target.value) setFaqOpen(false); }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                remember(q);
                const first = shown[0];
                if (first && shown.length === 1) open(first.entry);
              }
              if (e.key === 'Escape') setQ('');
            }}
            type="text"
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
            placeholder={L('Was suchst du?', 'What are you looking for?')}
            aria-label={L('Suche', 'Search')}
            data-testid="search-input"
            className="w-full h-12 rounded-2xl pl-10 pr-11 bg-[var(--color-surface)] border border-[var(--color-border)] text-[16px] text-[var(--color-text)] outline-none focus:border-[var(--color-primary)]"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ('');
                inputRef.current?.focus();
              }}
              aria-label={L('Leeren', 'Clear')}
              data-testid="search-clear"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-faint)] hover:bg-[var(--color-surface-muted)]"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {faqOpen && !hasQuery && (
          <section data-testid="search-faq" aria-label="FAQ">
            <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed mb-3">{L('Die Fragen, die am ehesten Verwirrung machen – kurz beantwortet.', 'The questions most likely to cause confusion – answered briefly.')}</p>
            <ul className="flex flex-col gap-2">
              {FAQ.map((f) => {
                const t = lang === 'en' ? f.en : f.de;
                const on = faqAt === f.id;
                return (
                  <li key={f.id} className="rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]" data-testid="search-faq-item">
                    <button type="button" onClick={() => setFaqAt(on ? null : f.id)} aria-expanded={on} className="w-full flex items-start gap-3 text-left px-3.5 py-3" data-testid={`search-faq-q-${f.id}`}>
                      <span className="flex-1 text-[15px] leading-snug text-[var(--color-text)]">{t.q}</span>
                      <ChevronDown size={18} className={`shrink-0 mt-0.5 text-[var(--color-text-muted)] transition-transform ${on ? 'rotate-180' : ''}`} />
                    </button>
                    {on && (
                      <div className="px-3.5 pb-3.5 -mt-1" data-testid={`search-faq-a-${f.id}`}>
                        <p className="text-[14px] leading-relaxed text-[var(--color-text-muted)]">{t.a}</p>
                        {f.to && <button type="button" onClick={() => navigate(f.to as string)} className="mt-2.5 h-10 px-4 rounded-full text-[13.5px] border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text)]" data-testid={`search-faq-go-${f.id}`}>{t.toLabel ?? L('Öffnen', 'Open')} →</button>}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {!hasQuery && !faqOpen && (
          <div data-testid="search-start">
            {recent.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[12.5px] text-[var(--color-text-muted)] flex items-center gap-1.5">
                    <Clock size={13} /> {L('Zuletzt gesucht', 'Recent searches')}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      searchRecentStore.set([]);
                      setRecent([]);
                    }}
                    data-testid="search-recent-clear"
                    className="text-[12px] text-[var(--color-text-faint)] underline underline-offset-2"
                  >
                    {L('Liste leeren', 'Clear list')}
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setQ(r)}
                      data-testid="search-recent-item"
                      className="px-3 h-9 rounded-full text-[13.5px] bg-[var(--color-surface-muted)] text-[var(--color-text)]"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <p className="text-[12.5px] text-[var(--color-text-muted)] mb-2">{L('Zum Beispiel', 'For example')}</p>
            <div className="flex flex-wrap gap-2">
              {ex.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setQ(r)}
                  data-testid="search-example"
                  className="px-3 h-9 rounded-full text-[13.5px] border border-[var(--color-border)] text-[var(--color-text-muted)]"
                >
                  {r}
                </button>
              ))}
            </div>
            <p data-hint className="text-[12px] text-[var(--color-text-faint)] leading-relaxed mt-5">
              {L(
                'Gesucht wird nur auf diesem Gerät. Gesperrte Tagebücher und noch ungeöffnete Briefe bleiben außen vor.',
                'Searching happens on this device only. Locked diaries and still-unopened letters are left out.',
              )}
            </p>
          </div>
        )}

        {hasQuery && !index && <p className="text-[13px] text-[var(--color-text-muted)]">{L('Einen Moment …', 'One moment …')}</p>}

        {hasQuery && index && (
          <div data-testid="search-results">
            {shown.length === 0 ? (
              <div className="py-6 text-center" data-testid="search-empty">
                <p className="text-[15px] text-[var(--color-text)] mb-1">{L('Dazu habe ich nichts gefunden.', 'I found nothing for that.')}</p>
                <p className="text-[13px] text-[var(--color-text-muted)] leading-relaxed">
                  {L(
                    'Probier ein kürzeres Wort oder nur den Anfang. Du kannst auch durch „Was die App alles kann“ auf der Startseite stöbern.',
                    'Try a shorter word or just the beginning. You can also browse “Everything the app can do” on the home page.',
                  )}
                </p>
              </div>
            ) : (
              <>
                {isSimilarOnly && (
                  <p className="text-[12.5px] text-[var(--color-text-muted)] mb-3" data-testid="search-similar-note">
                    {L('Nichts passt zu allen Wörtern – das hier kommt dem am nächsten:', 'Nothing matches all words — this comes closest:')}
                  </p>
                )}
                <div className="flex gap-2 mb-4 overflow-x-auto" role="tablist">
                  {([['all', L('Alles', 'All'), shown.length], ...sections.map((s) => [s.kind, s.title, counts[s.kind]] as const)] as const).map(([k, label, n]) =>
                    k !== 'all' && !n ? null : (
                      <button
                        key={k}
                        type="button"
                        role="tab"
                        aria-selected={filter === k}
                        onClick={() => setFilter(k as Filter)}
                        data-testid={`search-filter-${k}`}
                        className={`shrink-0 px-3 h-9 rounded-full text-[13px] ${
                          filter === k ? 'bg-[var(--color-primary)] text-[var(--color-bg)]' : 'bg-[var(--color-surface-muted)] text-[var(--color-text)]'
                        }`}
                      >
                        {label} · {n}
                      </button>
                    ),
                  )}
                </div>

                {sections.map((s) => {
                  if (filter !== 'all' && filter !== s.kind) return null;
                  const list = shown.filter((h) => h.entry.kind === s.kind);
                  if (!list.length) return null;
                  const limit = more[s.kind] ?? PAGE;
                  return (
                    <section key={s.kind} className="mb-5" data-testid={`search-section-${s.kind}`}>
                      <h2 className="text-[13px] uppercase tracking-wide text-[var(--color-text-muted)] mb-2">{s.title}</h2>
                      <ul className="space-y-2">
                        {list.slice(0, limit).map(({ entry }) => {
                          const title = lang === 'en' ? entry.title.en : entry.title.de;
                          const body = lang === 'en' ? entry.body.en : entry.body.de;
                          const sn = snippetFor(body, tokens);
                          const titleSn = snippetFor(title, tokens, 90);
                          return (
                            <li key={entry.id}>
                              <button
                                type="button"
                                onClick={() => open(entry)}
                                data-testid="search-hit"
                                data-kind={entry.kind}
                                data-to={entry.to ?? ''}
                                className="w-full text-left rounded-2xl p-3.5 bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-primary)] transition-colors"
                              >
                                <div className="flex items-start gap-3">
                                  <span className="text-[20px] leading-none mt-0.5">{entry.emoji}</span>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-[15px] text-[var(--color-text)] leading-snug break-words">
                                      <Marked text={titleSn.text} marks={titleSn.marks} />
                                    </p>
                                    {sn.text && sn.text !== titleSn.text && (
                                      <p className="text-[13px] text-[var(--color-text-muted)] leading-snug mt-1 break-words">
                                        <Marked text={sn.text} marks={sn.marks} />
                                      </p>
                                    )}
                                    <p className="text-[11.5px] text-[var(--color-text-faint)] mt-1.5">{lang === 'en' ? entry.group.en : entry.group.de}</p>
                                  </div>
                                </div>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                      {list.length > limit && (
                        <button
                          type="button"
                          onClick={() => setMore((m) => ({ ...m, [s.kind]: limit + 20 }))}
                          data-testid={`search-more-${s.kind}`}
                          className="mt-2 text-[13px] text-[var(--color-primary)] underline underline-offset-2"
                        >
                          {L(`Mehr zeigen (${list.length - limit})`, `Show more (${list.length - limit})`)}
                        </button>
                      )}
                    </section>
                  );
                })}
              </>
            )}
          </div>
        )}
      </div>

      <Modal
        open={!!helpOpen}
        onClose={() => setHelpOpen(null)}
        title={helpOpen ? (lang === 'en' ? helpOpen.title.en : helpOpen.title.de) : ''}
      >
        {helpOpen?.helpKey && (
          <div data-testid="search-help-body">
            <MarkdownLite
              text={(lang === 'en' ? HELP_CONTENT[helpOpen.helpKey].bodyEn : HELP_CONTENT[helpOpen.helpKey].body).replace(/^(#{1,3} .*)\n(?!\n)/gm, '$1\n\n')}
            />
          </div>
        )}
      </Modal>
    </div>
  );
}
