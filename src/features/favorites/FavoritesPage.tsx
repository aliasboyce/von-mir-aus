import { Link } from 'react-router-dom';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Library, GitBranch, Users, Star } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { resourcesRepo } from '../resources/resourcesRepo';
import { bridgesRepo } from '../bridges/bridgesRepo';
import { networkRepo } from '../safetyNet/networkRepo';

/**
 * Deliberately not a new data silo - pulls from the three existing
 * "starred" concepts already in the app (Resource.favorite,
 * Bridge.favorite, NetworkEntry.isImportantContact) instead of asking the
 * person to favorite things twice in two different systems.
 */
export function FavoritesPage() {
  const t = useT();
  const favoriteResources = resourcesRepo.getAll().filter((r) => r.favorite);
  const favoriteBridges = bridgesRepo.getAll().filter((b) => b.favorite);
  const importantContacts = networkRepo.getAll().filter((e) => e.isImportantContact);

  const totalCount = favoriteResources.length + favoriteBridges.length + importantContacts.length;

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
                  {t.favorites.resourcesTitle}
                </p>
                <div className="flex flex-col gap-2">
                  {favoriteResources.map((r) => (
                    <Link key={r.id} to={`/entdecken/ressourcen?open=${r.id}`}>
                      <Card interactive className="flex items-center gap-2.5">
                        <Star size={14} className="text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />
                        <span className="text-[14px] text-[var(--color-text)] truncate">{r.title}</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {favoriteBridges.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <GitBranch size={13} />
                  {t.favorites.bridgesTitle}
                </p>
                <div className="flex flex-col gap-2">
                  {favoriteBridges.map((b) => (
                    <Link key={b.id} to={`/bruecken/${b.id}`}>
                      <Card interactive className="flex items-center gap-2.5">
                        <Star size={14} className="text-[var(--color-primary)] flex-shrink-0" fill="currentColor" />
                        <span className="text-[14px] text-[var(--color-text)] truncate">{b.title}</span>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {importantContacts.length > 0 && (
              <div>
                <p className="flex items-center gap-1.5 text-[12px] uppercase tracking-wide text-[var(--color-text-faint)] mb-2">
                  <Users size={13} />
                  {t.favorites.contactsTitle}
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
          </div>
        )}
      </div>
    </div>
  );
}
