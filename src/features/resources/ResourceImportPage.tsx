import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { createId } from '../../services/storage/repository';
import { suggestedImage } from '../../services/suggestedImages';

interface SharedResourcePayload {
  title: string;
  description?: string;
  categoryLabel?: string;
  link?: string;
  tags?: string[];
}

/**
 * No backend, no accounts - the shared resource's data travels entirely
 * inside the link itself (URL query param), decoded here. This genuinely
 * works between any two people who both have the app open at the same
 * deployed URL; it does NOT work if the app is only running locally on
 * the sender's machine (localhost links aren't reachable by anyone else)
 * - see docs/open-issues.md for this limitation spelled out plainly.
 *
 * Deliberately excludes the image from the link - base64 image data
 * would make the URL far too long to share reliably via messaging apps.
 * Category travels as a plain label (not an id): the sender's custom
 * categories don't exist on the recipient's device, so the imported
 * resource always lands in "Sonstiges" with the original category name
 * folded into the note, rather than silently mismatching category ids.
 */
export function ResourceImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);

  const payload = useMemo<SharedResourcePayload | null>(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (typeof parsed.title !== 'string') return null;
      return parsed;
    } catch {
      return null;
    }
  }, [searchParams]);

  function accept() {
    if (!payload) return;
    const now = new Date().toISOString();
    resourcesRepo.save({
      id: createId('resource'),
      title: payload.title,
      description: payload.description,
      category: 'sonstiges',
      // The share-link deliberately can't carry the sender's actual
      // picked photo (see file header) — this is a real, keyword-matched
      // suggested photo as a sensible default, never a blank card or an
      // icon placeholder. The recipient can change it via the normal
      // edit flow like any other resource.
      image: suggestedImage(payload.title, 'sonstiges'),
      note: payload.categoryLabel ? t.resources.importedFromCategory.replace('{category}', payload.categoryLabel) : undefined,
      link: payload.link,
      tags: payload.tags ?? [],
      favorite: false,
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
          <EmptyState title={t.resources.importInvalid} />
        ) : saved ? (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[16px] text-[var(--color-text)]">{t.resources.importSaved}</p>
            <Button onClick={() => navigate('/entdecken/ressourcen')}>{t.resources.title}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <InlineCompanionNote />
              <p className="text-[14px] text-[var(--color-text)] flex-1">{t.resources.importIntro}</p>
            </div>
            <Card className="mb-5">
              {payload.categoryLabel && (
                <p className="text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-1">
                  {payload.categoryLabel}
                </p>
              )}
              <p className="text-[17px] text-[var(--color-text)] mb-2">{payload.title}</p>
              {payload.description && (
                <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed">{payload.description}</p>
              )}
              {payload.link && <p className="text-[13px] text-[var(--color-primary)] mt-2 break-all">{payload.link}</p>}
            </Card>
            <Button fullWidth onClick={accept}>
              {t.resources.importAccept}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
