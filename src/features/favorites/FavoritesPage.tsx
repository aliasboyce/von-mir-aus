import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { useMemo } from 'react';
import { Library, GitBranch, Users, Star, Layers } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { ResourceTile, BridgeTile } from '../../components/shared/ItemTile';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';
import { skillkettenRepo } from '../resources/skillkettenRepo';
import { buildAllCards } from '../cards/autoCards';
import { getPrefs } from '../cards/cardStore';
import { useSettings } from '../../state/SettingsContext';
import { FavStar } from '../../components/ui/FavStar';
import { useFavoriteEntries, describeFavorite, FAV_KIND_ORDER, FAV_KIND_LABEL, type FavEntry, type FavView } from '../../services/favorites';

/**
 * Deliberately not a new data silo - pulls from the three existing
 * "starred" concepts already in the app (Resource.favorite,
 * Bridge.favorite, NetworkEntry.isImportantContact) instead of asking the
 * person to favorite things twice in two different systems.
 */
export function FavoritesPage() {
  const t = useT();
  const { settings } = useSettings();
  const lang = settings.language === 'en' ? 'en' : 'de';
  const L = (de: string, en: string) => (lang === 'en' ? en : de);
  const stored = useFavoriteEntries();
  const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title, lang);
  // alles, was über den gemeinsamen Stern gemerkt wurde (+ Skillketten mit altem Stern), nach Art sortiert
  const generic = useMemo(() => {
    const entries: FavEntry[] = [...stored];
    skillkettenRepo.getAll().filter((k) => k.favorite).forEach((k) => {
      if (!entries.some((e) => e.kind === 'kette' && e.id === k.id)) entries.push({ kind: 'kette', id: k.id, at: k.updatedAt });
    });
    const views = entries.map((e) => describeFavorite(e, lang)).filter((v): v is FavView => !!v);
    return FAV_KIND_ORDER.map((kind) => ({ kind, items: views.filter((v) => v.kind === kind).sort(byTitle) })).filter((g) => g.items.length > 0);
  }, [stored, lang]); // eslint-disable-line react-hooks/exhaustive-deps
  const favoriteCards = useMemo(() => {
    const keys = getPrefs().favorites;
    if (keys.length === 0) return [];
    return buildAllCards({ t, lang, settings }).filter((c) => keys.includes(c.key)).sort(byTitle);
  }, [t, lang, settings]); // eslint-disable-line react-hooks/exhaustive-deps
  const favoriteResources = resourcesRepo.getAll().filter((r) => r.favorite).sort((a, b) => a.title.localeCompare(b.title, lang));
  const favoriteBridges = bridgesRepo.getAll().filter((b) => b.favorite).sort((a, b) => a.title.localeCompare(b.title, lang));
  const importantContacts = networkRepo.getAll().filter((e) => e.isImportantContact && !e.isExample);

  const totalCount = favoriteResources.length + favoriteBridges.length + importantContacts.length + favoriteCards.length + generic.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="favoriten" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.favorites.title}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.favorites.subtitle}</p>

        {totalCount === 0 ? (
          <EmptyState title={t.favorites.empty} />
        ) : (
          <div className="flex flex-col gap-6">
            {favoriteResources.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <Library size={13} />
                  {t.favorites.resourcesTitle} · {favoriteResources.length}
                </p>
                <div className="flex flex-col gap-2">
                  {favoriteResources.map((r) => (
                    <Link key={r.id} to={`/entdecken/ressourcen?open=${r.id}`} className="block">
                      <ResourceTile resource={r} trailing={<Star size={14} className="text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {favoriteBridges.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <GitBranch size={13} />
                  {t.favorites.bridgesTitle} · {favoriteBridges.length}
                </p>
                <div className="flex flex-col gap-2">
                  {favoriteBridges.map((b) => (
                    <Link key={b.id} to={`/bruecken/${b.id}`} className="block">
                      <BridgeTile bridge={b} trailing={<Star size={14} className="text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />} />
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {importantContacts.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <Users size={13} />
                  {t.favorites.contactsTitle} · {importantContacts.length}
                </p>
                <div className="flex flex-col gap-2">
                  {importantContacts.map((c) => (
                    <Link key={c.id} to={`/sicherheit/netzwerk?open=${c.id}`}>
                      <Card interactive className="flex items-center gap-2.5">
                        <Star size={14} className="text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />
                        <span className="text-[14px] text-[var(--color-text)] truncate">{c.name}</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {favoriteCards.length > 0 && (
              <div data-testid="fav-group-cards">
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <Layers size={13} />
                  {L('Sammelkarten', 'Collector cards')} · {favoriteCards.length}
                </p>
                <div className="flex flex-col gap-2">
                  {favoriteCards.map((c) => (
                    <Link key={c.key} to="/sammelalbum">
                      <Card interactive className="flex items-center gap-2.5">
                        <span aria-hidden>{c.emoji}</span>
                        <span className="text-[14px] text-[var(--color-text)] truncate">{c.title}</span>
                        <Star size={14} className="ml-auto text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {generic.map((g) => (
              <div key={g.kind} data-testid={`fav-group-${g.kind}`}>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <span aria-hidden>{FAV_KIND_LABEL[g.kind].emoji}</span>
                  {lang === 'en' ? FAV_KIND_LABEL[g.kind].en : FAV_KIND_LABEL[g.kind].de} · {g.items.length}
                </p>
                <div className="flex flex-col gap-2">
                  {g.items.map((v) => (
                    <div key={v.key} className="flex items-center gap-1">
                      <Link to={v.to} className="flex-1 min-w-0" data-testid="fav-item">
                        <Card interactive className="flex items-center gap-2.5">
                          <span aria-hidden>{v.emoji}</span>
                          <span className="text-[14px] text-[var(--color-text)] truncate">{v.title}</span>
                        </Card>
                      </Link>
                      <FavStar kind={v.kind} id={v.key.slice(v.kind.length + 1)} testId="fav-unstar" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
