import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Chip } from '../../components/ui/Chip';
import { useL } from '../projects/useL';
import { diaryRepo } from '../diary/diaryRepo';
import { isBookLocked } from '../diary/bookLock';
import { richToPlain } from '../../services/richText';
import { ScrapPageView } from './ScrapPageView';
import { dayKey, firstPhoto, scrapBooksRepo, scrapPagesRepo } from './scrapModel';

type Src = 'all' | 'diary' | 'scrap';
type Item = { kind: 'diary' | 'scrap'; id: string; day: string; photo?: string; title: string; to: string; page?: ReturnType<typeof scrapPagesRepo.getAll>[number] };

const localDay = (iso: string) => dayKey(new Date(iso));

/**
 * Monatsübersicht: auf einen Blick, an welchen Tagen etwas entstanden ist – mit den Fotos dazu.
 * Gilt für das Tagebuch und für das Scrapbook; ein Tipp auf einen Tag öffnet ihn.
 */
export function MonthOverviewPage() {
  const { L, lang } = useL();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const src: Src = sp.get('quelle') === 'tagebuch' ? 'diary' : sp.get('quelle') === 'scrapbook' ? 'scrap' : 'all';
  const today = new Date();
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [sel, setSel] = useState<string | null>(null);

  const items = useMemo(() => {
    const out: Item[] = [];
    for (const e of diaryRepo.getAll()) {
      if (isBookLocked(e.categoryId)) continue;
      const plain = richToPlain(e.content).replace(/\s+/g, ' ').trim();
      out.push({ kind: 'diary', id: e.id, day: localDay(e.createdAt), photo: e.photo, title: plain.slice(0, 70) || L('Eintrag', 'Entry'), to: `/sicherheit/tagebuch?entry=${e.id}` });
    }
    const books = new Map(scrapBooksRepo.getAll().map((b) => [b.id, b]));
    for (const p of scrapPagesRepo.getAll()) {
      if (!p.bookId || !books.has(p.bookId)) continue;
      out.push({ kind: 'scrap', id: p.id, day: p.day ?? localDay(p.createdAt), photo: firstPhoto(p), title: p.title || books.get(p.bookId)!.title, to: `/scrapbook/${p.bookId}/seite/${p.id}`, page: p });
    }
    return out;
  }, [L]);

  const shown = items.filter((i) => src === 'all' || i.kind === src);
  const byDay = new Map<string, Item[]>();
  for (const i of shown) byDay.set(i.day, [...(byDay.get(i.day) ?? []), i]);

  const first = new Date(cursor.y, cursor.m, 1);
  const daysIn = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const lead = (first.getDay() + 6) % 7; // Montag zuerst
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: daysIn }, (_, i) => i + 1)];
  const key = (d: number) => dayKey(new Date(cursor.y, cursor.m, d));
  const monthCount = shown.filter((i) => i.day.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-`)).length;
  const monthName = first.toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { month: 'long', year: 'numeric' });
  const shift = (d: number) => { setSel(null); setCursor((c) => { const n = new Date(c.y, c.m + d, 1); return { y: n.getFullYear(), m: n.getMonth() }; }); };
  const setSrc = (s: Src) => setSp(s === 'all' ? {} : { quelle: s === 'diary' ? 'tagebuch' : 'scrapbook' }, { replace: true });
  const wd = lang === 'en' ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const selItems = sel ? byDay.get(sel) ?? [] : [];

  const open = (list: Item[], d: string) => {
    if (list.length === 1) navigate(list[0].to);
    else setSel(sel === d ? null : d);
  };

  return (
    <div className="animate-in" data-testid="month-page">
      <TopBar action={<HelpButton helpKey="tagebuch" />} />
      <div className="px-4 pb-10">
        <h1 className="text-[24px] mb-1 px-1">{L('Monatsübersicht', 'Month overview')}</h1>
        <div className="flex flex-wrap gap-2 mb-4 px-1">
          <Chip selected={src === 'all'} onClick={() => setSrc('all')}>{L('Alles', 'All')}</Chip>
          <Chip selected={src === 'diary'} onClick={() => setSrc('diary')}>{L('Tagebuch', 'Diary')}</Chip>
          <Chip selected={src === 'scrap'} onClick={() => setSrc('scrap')}>Scrapbook</Chip>
        </div>

        <div className="flex items-center justify-between mb-2">
          <button type="button" onClick={() => shift(-1)} className="w-11 h-11 flex items-center justify-center rounded-full" aria-label={L('Voriger Monat', 'Previous month')} data-testid="month-prev"><ChevronLeft size={20} /></button>
          <div className="text-center">
            <p className="text-[17px] capitalize" data-testid="month-name">{monthName}</p>
            <p className="text-[12px] text-[var(--color-text-faint)]">{monthCount} {L(monthCount === 1 ? 'Eintrag' : 'Einträge', monthCount === 1 ? 'entry' : 'entries')}</p>
          </div>
          <button type="button" onClick={() => shift(1)} className="w-11 h-11 flex items-center justify-center rounded-full" aria-label={L('Nächster Monat', 'Next month')} data-testid="month-next"><ChevronRight size={20} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-1">
          {wd.map((w, i) => <div key={i} className="text-center text-[11.5px] text-[var(--color-text-faint)]">{w}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1" data-testid="month-grid">
          {cells.map((d, i) => {
            if (d === null) return <div key={`e${i}`} />;
            const k = key(d);
            const list = byDay.get(k) ?? [];
            const withPhoto = list.find((x) => x.photo);
            const pageOnly = !withPhoto ? list.find((x) => x.page) : undefined;
            const isToday = k === dayKey(today);
            return (
              <button
                key={k}
                type="button"
                disabled={!list.length}
                onClick={() => open(list, k)}
                className="relative aspect-square rounded-[10px] overflow-hidden text-left"
                style={{ background: list.length ? 'var(--color-surface-muted)' : 'transparent', border: sel === k ? '2px solid var(--color-primary)' : isToday ? '1.5px solid var(--color-primary)' : '1px solid var(--color-border)' }}
                aria-label={`${d}. ${monthName}${list.length ? `, ${list.length}` : ''}`}
                data-testid={list.length ? 'month-day-filled' : 'month-day'}
              >
                {withPhoto?.photo && <img src={withPhoto.photo} alt="" className="absolute inset-0 w-full h-full object-cover" loading="lazy" />}
                {pageOnly?.page && <div className="absolute inset-0 pointer-events-none"><ScrapPageView page={pageOnly.page} /></div>}
                {!withPhoto && !pageOnly && list.length > 0 && <span className="absolute inset-0 flex items-center justify-center text-[18px] opacity-60">{list[0].kind === 'diary' ? '📔' : '📖'}</span>}
                <span className={`absolute top-0.5 left-1 text-[11.5px] px-1 rounded ${list.length ? 'bg-[rgba(255,255,255,0.82)] text-[#333]' : 'text-[var(--color-text-faint)]'}`}>{d}</span>
                {list.length > 1 && <span className="absolute bottom-0.5 right-0.5 text-[10.5px] min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-primary)] text-[var(--color-surface)] flex items-center justify-center">{list.length}</span>}
                {list.length === 1 && list[0].kind === 'scrap' && !pageOnly && <span className="absolute bottom-0.5 right-0.5 text-[11px]">📖</span>}
              </button>
            );
          })}
        </div>

        {sel && selItems.length > 0 && (
          <div className="mt-5 animate-in" data-testid="month-day-list">
            <p className="text-[13px] text-[var(--color-text-muted)] mb-2 px-1">{new Date(sel + 'T12:00:00').toLocaleDateString(lang === 'en' ? 'en-GB' : 'de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            <div className="space-y-2">
              {selItems.map((i) => (
                <Link key={`${i.kind}${i.id}`} to={i.to} className="flex items-center gap-3 p-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]" data-testid="month-day-item">
                  <div className="w-14 h-14 rounded-[8px] overflow-hidden shrink-0 bg-[var(--color-surface-muted)] flex items-center justify-center">
                    {i.photo ? <img src={i.photo} alt="" className="w-full h-full object-cover" /> : i.page ? <div className="w-full h-full"><ScrapPageView page={i.page} /></div> : <span className="text-[20px]">📔</span>}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] text-[var(--color-text)] truncate">{i.title}</p>
                    <p className="text-[12px] text-[var(--color-text-faint)]">{i.kind === 'diary' ? L('Tagebuch', 'Diary') : 'Scrapbook'}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
        {monthCount === 0 && <p className="text-[13.5px] text-[var(--color-text-muted)] mt-6 text-center">{L('In diesem Monat ist noch nichts eingetragen – ganz in Ruhe.', 'Nothing in this month yet – no rush.')}</p>}
      </div>
    </div>
  );
}
