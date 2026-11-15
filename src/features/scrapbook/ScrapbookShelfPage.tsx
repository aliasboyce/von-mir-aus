import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDays, Plus } from 'lucide-react';
import { MemoryFamily } from '../../components/shared/MemoryFamily';
import { TopBar } from '../../components/navigation/TopBar';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { useL } from '../projects/useL';
import { ScrapCover } from './ScrapCover';
import { CoverEditor } from './CoverEditor';
import { COVER_COLORS, newBook, scrapBooksRepo, type CoverStyle, type ScrapBook } from './scrapModel';
import { Link } from 'react-router-dom';

/** Das Regal: alle Bücher als Einbände. */
export function ScrapbookShelfPage() {
  const { L } = useL();
  const navigate = useNavigate();
  const [books, setBooks] = useState<ScrapBook[]>(() => scrapBooksRepo.getAll().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState<CoverStyle>('leinen');
  const [color, setColor] = useState(COVER_COLORS[0]);
  const [emoji, setEmoji] = useState('📖');

  const create = () => {
    const b = newBook(title.trim() || L('Mein Scrapbook', 'My scrapbook'), { style, color, emoji });
    setBooks(scrapBooksRepo.getAll());
    setOpen(false);
    navigate(`/scrapbook/${b.id}`);
  };

  return (
    <div className="animate-in" data-testid="scrap-shelf">
      <TopBar action={<HelpButton helpKey="tagebuch" />} />
      <div className="px-5 pb-8">
        <h1 className="text-[24px] mb-1">Scrapbook</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-5">
          {L('Dein Platz für Seiten wie auf Papier: Fotos, Sticker, Stifte, Notizen und Dinge aus der App – in Büchern, die du aufschlagen und durchblättern kannst.', 'Your place for pages like on paper: photos, stickers, pens, notes and things from the app – in books you can open and flip through.')}
        </p>
        <MemoryFamily current="scrapbook" />
        <div className="flex gap-2 mb-6 flex-wrap">
          <Link to="/scrapbook/monat" className="inline-flex items-center gap-1.5 text-[13.5px] px-3.5 py-2 rounded-full border border-[var(--color-border-strong)] text-[var(--color-text)] hit44" data-testid="scrap-month-link">
            <CalendarDays size={15} /> {L('Monatsübersicht', 'Month overview')}
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-x-5 gap-y-7">
          {books.map((b) => (
            <button key={b.id} type="button" onClick={() => navigate(`/scrapbook/${b.id}`)} className="text-left" data-testid="scrap-book-tile">
              <ScrapCover book={b} />
              <p className="text-[13.5px] mt-2 text-[var(--color-text)] truncate">{b.title}</p>
              <p className="text-[12px] text-[var(--color-text-faint)]">{b.pageIds.length} {L(b.pageIds.length === 1 ? 'Seite' : 'Seiten', b.pageIds.length === 1 ? 'page' : 'pages')}</p>
            </button>
          ))}
          <button type="button" onClick={() => setOpen(true)} className="rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--color-border-strong)] flex flex-col items-center justify-center gap-2 text-[var(--color-text-muted)]" style={{ aspectRatio: '794 / 1123' }} data-testid="scrap-new-book">
            <Plus size={26} />
            <span className="text-[13.5px]">{L('Neues Buch', 'New book')}</span>
          </button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={L('Neues Buch', 'New book')}>
        <div className="flex flex-col gap-4" data-testid="scrap-new-modal">
          <CoverEditor title={title} cover={{ style, color, emoji }} onChange={(v) => { setTitle(v.title); setStyle(v.cover.style); setColor(v.cover.color); setEmoji(v.cover.emoji ?? ''); }} />
          <Button fullWidth onClick={create} data-testid="scrap-create">{L('Buch anlegen', 'Create book')}</Button>
        </div>
      </Modal>
    </div>
  );
}
