import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { SharedIdeaIntro, useSharedIdeaTexts } from '../../components/shared/SharedIdeaIntro';
import { BrowserTabNotice } from '../../components/shared/BrowserTabNotice';
import { useT } from '../../i18n';
import { bridgesRepo } from './bridgesRepo';
import { createId } from '../../services/storage/repository';
import { symbolImage } from '../../components/shared/symbolImage';
import { builtInBridgeColor } from '../../components/shared/itemColors';
import { isAcceptableSharedImage } from '../../services/shareImage';
import { CONNECTION_ITEMS_DE } from '../zugang/zugangContent';
import { categoryForValues } from './bridgeValues';
import type { BridgeLevel } from '../../data/types';

interface SharedBridgePayload {
  title: string;
  description?: string;
  categoryLabel?: string;
  connectionTags?: string[];
  linkedNeeds?: string[];
  reflection?: string;
  levels: BridgeLevel[];
  tip?: string;
  from?: string;
  image?: string;
}

/** Same no-backend, link-encoded approach as the resource import. */
export function BridgeImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const X = useSharedIdeaTexts();

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
    const values = (payload.connectionTags ?? []).filter((v) => typeof v === 'string' && CONNECTION_ITEMS_DE.includes(v));
    bridgesRepo.save({
      id: createId('bridge'),
      title: payload.title,
      category: categoryForValues(values, 'sonstiges'),
      connectionTags: values.length > 0 ? values : undefined,
      linkedNeeds: Array.isArray(payload.linkedNeeds) ? payload.linkedNeeds.filter((n) => typeof n === 'string').slice(0, 30) : undefined,
      reflection: typeof payload.reflection === 'string' ? payload.reflection : undefined,
      // the sender's picture if it came along, else the drawn symbol picture (never a blank card)
      image: isAcceptableSharedImage(payload.image) ? payload.image : symbolImage(payload.title, builtInBridgeColor(categoryForValues(values, 'sonstiges')), '🌉'),
      description: payload.categoryLabel
        ? [payload.description, t.bridges.importedFromCategory.replace('{category}', payload.categoryLabel)]
            .filter(Boolean)
            .join('\n')
        : (payload.description ?? ''),
      // only the plain step content: resources attached to a step are ids on the sender's device
      levels: payload.levels.map((l, i) => ({ level: i + 1, title: String(l.title ?? ''), description: String(l.description ?? ''), energyLevel: l.energyLevel })),
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
            <BrowserTabNotice />
            <SharedIdeaIntro kind="bruecke" from={payload.from} />
            <Card className="mb-5">
              <p className="text-[17px] text-[var(--color-text)] mb-2">{payload.title}</p>
              {payload.description && (
                <p className="text-[14px] text-[var(--color-text-muted)] leading-relaxed mb-3">{payload.description}</p>
              )}
              <div className="flex flex-col gap-2">
                {payload.levels.map((l) => (
                  <p key={l.level} className="text-[13px] text-[var(--color-text-muted)]">
                    {t.bridges.level} {l.level} — {l.title}
                  </p>
                ))}
              </div>
            </Card>
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={accept} data-testid="import-accept">
                {X.accept}
              </Button>
              <Button fullWidth variant="ghost" onClick={() => navigate('/bruecken')}>
                {X.later}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
