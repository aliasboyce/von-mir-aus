import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { bookmarksRepo, bookmarkCategoriesStore } from './bookmarksRepo';
import { createId } from '../../services/storage/repository';

interface SharedBookmarkPayload {
  title: string;
  url: string;
  note?: string;
  categoryLabel?: string;
}

/** Same no-backend, link-encoded approach as resource/bridge import. */
export function BookmarkImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);

  const payload = useMemo<SharedBookmarkPayload | null>(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (typeof parsed.title !== 'string' || typeof parsed.url !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }, [searchParams]);

  function accept() {
    if (!payload) return;
    const fallbackCategory = bookmarkCategoriesStore.getAll()[0];
    const now = new Date().toISOString();
    bookmarksRepo.save({
      id: createId('bm'),
      title: payload.title,
      url: payload.url,
      note: payload.categoryLabel
        ? [payload.note, t.bookmarks.importedFromCategory.replace('{category}', payload.categoryLabel)]
            .filter(Boolean)
            .join('\n')
        : payload.note,
      categoryId: fallbackCategory?.id ?? '',
      createdAt: now,
      updatedAt: now,
    });
    setSaved(true);
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-6">
        {!payload ? (
          <EmptyState title={t.bookmarks.importInvalid} />
        ) : saved ? (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[16px] text-[var(--color-text)]">{t.bookmarks.importSaved}</p>
            <Button onClick={() => navigate('/entdecken/lesezeichen')}>{t.bookmarks.title}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <InlineCompanionNote />
              <p className="text-[14px] text-[var(--color-text)] flex-1">{t.bookmarks.importIntro}</p>
            </div>
            <Card className="mb-5">
              <p className="text-[17px] text-[var(--color-text)] mb-1">{payload.title}</p>
              <p className="text-[13px] text-[var(--color-primary)] break-all mb-2">{payload.url}</p>
              {payload.note && <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{payload.note}</p>}
            </Card>
            <Button fullWidth onClick={accept}>
              {t.bookmarks.importAccept}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
