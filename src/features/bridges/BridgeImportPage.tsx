import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { InlineCompanionNote } from '../../components/companion/InlineCompanionNote';
import { useT } from '../../i18n';
import { bridgesRepo } from './bridgesRepo';
import { createId } from '../../services/storage/repository';
import { suggestedImage } from '../../services/suggestedImages';
import type { BridgeLevel } from '../../data/types';

interface SharedBridgePayload {
  title: string;
  description?: string;
  categoryLabel?: string;
  levels: BridgeLevel[];
  tip?: string;
}

/** Same no-backend, link-encoded approach as the resource import. */
export function BridgeImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);

  const payload = useMemo<SharedBridgePayload | null>(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (typeof parsed.title !== 'string' || !Array.isArray(parsed.levels)) return null;
      return parsed;
    } catch {
      return null;
    }
  }, [searchParams]);

  function accept() {
    if (!payload) return;
    bridgesRepo.save({
      id: createId('bridge'),
      title: payload.title,
      category: 'sonstiges',
      // Same fix as ResourceImportPage.tsx: an empty string technically
      // satisfies the required `image: string` type but still renders
      // as a blank card — the exact functional bug the type change
      // alone doesn't catch. A real suggested photo, never blank.
      image: suggestedImage(payload.title, 'sonstiges'),
      description: payload.categoryLabel
        ? [payload.description, t.bridges.importedFromCategory.replace('{category}', payload.categoryLabel)]
            .filter(Boolean)
            .join('\n')
        : (payload.description ?? ''),
      levels: payload.levels,
      tip: payload.tip,
      favorite: false,
      isCustom: true,
    });
    setSaved(true);
  }

  return (
    <div className="animate-in">
      <TopBar />
      <div className="px-5 pb-6">
        {!payload ? (
          <EmptyState title={t.bridges.importInvalid} />
        ) : saved ? (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            <Check size={40} className="text-[var(--color-primary)]" />
            <p className="text-[16px] text-[var(--color-text)]">{t.bridges.importSaved}</p>
            <Button onClick={() => navigate('/bruecken')}>{t.bridges.title}</Button>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 mb-5">
              <InlineCompanionNote />
              <p className="text-[14px] text-[var(--color-text)] flex-1">{t.bridges.importIntro}</p>
            </div>
            <Card className="mb-5">
              <p className="text-[17px] text-[var(--color-text)] mb-2">{payload.title}</p>
              {payload.description && (
                <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-3">{payload.description}</p>
              )}
              <div className="flex flex-col gap-2">
                {payload.levels.map((l) => (
                  <p key={l.level} className="text-[13px] text-[var(--color-text-muted)]">
                    Level {l.level} — {l.title}
                  </p>
                ))}
              </div>
            </Card>
            <Button fullWidth onClick={accept}>
              {t.bridges.importAccept}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
