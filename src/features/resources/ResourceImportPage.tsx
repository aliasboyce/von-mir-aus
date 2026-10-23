import { useMemo, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { resourcesRepo } from './resourcesRepo';
import { createId } from '../../services/storage/repository';
import { symbolImage } from '../../components/shared/symbolImage';
import { builtInResourceColor, NEUTRAL_COLOR } from '../../components/shared/itemColors';
import { PhotoBackground } from '../../components/shared/PhotoBackground';
import { isAcceptableSharedImage } from '../../services/shareImage';
import { sanitizeDetails, sanitizeFit, sharedStr, sharedStrList, type SharedResourcePayload } from '../../services/resourceShare';
import { addUmstand } from '../bridges/conditions';
import { RESOURCE_CATEGORY_TO_GROUP } from './resourceMeta';
import { HILFSMITTEL_MAIN, subtypesFor } from '../../content/hilfsmittelCategories';
import type { NeedDirection, AccessChannel, Resource } from '../../data/types';
import { isShareKind } from '../../services/sharedLinks';
import { SharedIdeaIntro, useSharedIdeaTexts } from '../../components/shared/SharedIdeaIntro';
import { BrowserTabNotice } from '../../components/shared/BrowserTabNotice';
import { useSettings } from '../../state/SettingsContext';
import { ORTE_CATEGORY, AKTIVITAETEN_CATEGORY } from '../../content/hilfsmittelCategories';

/**
 * No backend, no accounts - the shared resource's data travels entirely
 * inside the link itself (URL query param), decoded here. This genuinely
 * works between any two people who both have the app open at the same
 * deployed URL; it does NOT work if the app is only running locally on
 * the sender's machine (localhost links aren't reachable by anyone else)
 * - see docs/open-issues.md for this limitation spelled out plainly.
 *
 * Everything the sender filled in travels along (see services/resourceShare.ts),
 * including the picture as a small thumbnail. The category id is only used
 * when it is a built-in one the receiving app knows; the sender's own custom
 * categories don't exist here, so those land in "Sonstiges" (or Achtsamkeit
 * for a skill) with the original category name folded into the note.
 */
export function ResourceImportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const { settings } = useSettings();
  const X = useSharedIdeaTexts();

  const payload = useMemo<SharedResourcePayload | null>(() => {
    const raw = searchParams.get('data');
    if (!raw) return null;
    try {
      const parsed = JSON.parse(decodeURIComponent(raw));
      if (typeof parsed.title !== 'string') return null;
      if (!isShareKind(parsed.kind)) parsed.kind = undefined;
      return parsed;
    } catch {
      return null;
    }
  }, [searchParams]);

  function accept() {
    if (!payload) return;
    const now = new Date().toISOString();
    const lang = settings.language === 'en' ? 'en' : 'de';
    const details = sanitizeDetails(payload);
    const knownCategory = (c: unknown): c is string =>
      typeof c === 'string' &&
      (!!RESOURCE_CATEGORY_TO_GROUP[c] || c === 'sonstiges' || c === 'menschen' || c === ORTE_CATEGORY || c === AKTIVITAETEN_CATEGORY || (HILFSMITTEL_MAIN as readonly string[]).includes(c));
    const category =
      payload.kind === 'ort'
        ? ORTE_CATEGORY
        : payload.kind === 'aktivitaet'
          ? AKTIVITAETEN_CATEGORY
          : knownCategory(payload.category)
            ? payload.category
            : details.skillDetails
              ? 'achtsamkeit'
              : 'sonstiges';
    const categoryWasKnown = knownCategory(payload.category) || payload.kind === 'ort' || payload.kind === 'aktivitaet';
    const subcategory = payload.subcategory && subtypesFor(category).some((x) => x.id === payload.subcategory) ? payload.subcategory : undefined;
    const needs = sharedStrList(payload.needs, 20) ?? [];
    const image = isAcceptableSharedImage(payload.image)
      ? payload.image
      : symbolImage(payload.title, builtInResourceColor(category) ?? NEUTRAL_COLOR);
    const umstaende = (payload.umstaende ?? [])
      .filter((u) => u && typeof u.label === 'string' && u.label.trim())
      .slice(0, 12)
      .map((u) => addUmstand(u.label.slice(0, 80)).key);
    const resource: Resource = {
      id: createId('resource'),
      title: payload.title.slice(0, 300),
      description: sharedStr(payload.description),
      category,
      subcategory,
      image,
      note:
        [
          payload.from ? (lang === 'en' ? `Shared by ${payload.from} as an idea` : `Von ${payload.from} als Idee geteilt`) : undefined,
          sharedStr(payload.note),
          needs.length ? (lang === 'en' ? `Needed for this: ${needs.join(', ')}` : `Dafür gebraucht: ${needs.join(', ')}`) : undefined,
          !categoryWasKnown && payload.categoryLabel ? t.resources.importedFromCategory.replace('{category}', payload.categoryLabel) : undefined,
        ]
          .filter(Boolean)
          .join('\n') || undefined,
      link: sharedStr(payload.link, 2000),
      tags: sharedStrList(payload.tags, 20) ?? [],
      umstaende: umstaende.length ? umstaende : undefined,
      linkedNeeds: Array.isArray(payload.linkedNeeds) && payload.linkedNeeds.length ? (sharedStrList(payload.linkedNeeds, 12) as NeedDirection[]) : undefined,
      energyLevel: payload.energyLevel === 1 || payload.energyLevel === 2 || payload.energyLevel === 3 || payload.energyLevel === 4 ? payload.energyLevel : undefined,
      fit: sanitizeFit(payload.fit),
      accessChannels: Array.isArray(payload.accessChannels) && payload.accessChannels.length ? (sharedStrList(payload.accessChannels, 12) as AccessChannel[]) : undefined,
      skillDetails: details.skillDetails,
      hilfsmittelDetails: details.hilfsmittelDetails,
      favorite: false,
      createdAt: now,
      updatedAt: now,
    };
    resourcesRepo.save(resource);
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
            <BrowserTabNotice />
            <SharedIdeaIntro kind={payload.kind} from={payload.from} />
            <Card className="mb-5">
              {isAcceptableSharedImage(payload.image) && (
                <PhotoBackground src={payload.image} className="w-full h-40 rounded-[var(--radius-md)] bg-cover bg-center mb-3" />
              )}
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
            <div className="flex flex-col gap-2">
              <Button fullWidth onClick={accept} data-testid="import-accept">
                {X.accept}
              </Button>
              <Button fullWidth variant="ghost" onClick={() => navigate('/entdecken/ressourcen')}>
                {X.later}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
