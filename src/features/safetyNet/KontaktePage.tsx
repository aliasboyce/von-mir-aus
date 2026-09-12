import { useState } from 'react';
import { HelpButton } from '../../components/navigation/HelpButton';
import { Phone, Mail, Star } from 'lucide-react';
import { TopBar } from '../../components/navigation/TopBar';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { useT } from '../../i18n';
import { networkRepo } from './networkRepo';
import { useNetworkCategories } from './useNetworkCategories';
import { getIcon } from '../../components/icons/networkIcons';
import type { NetworkEntry } from '../../data/types';

export function KontaktePage() {
  const t = useT();
  const { categories } = useNetworkCategories();
  const [entries, setEntries] = useState<NetworkEntry[]>(() =>
    networkRepo.getAll().filter((e) => e.category === 'person'),
  );

  function toggleImportant(entry: NetworkEntry) {
    const updated = { ...entry, isImportantContact: !entry.isImportantContact, updatedAt: new Date().toISOString() };
    networkRepo.save(updated);
    setEntries(networkRepo.getAll().filter((e) => e.category === 'person'));
  }

  return (
    <div className="animate-in">
      <TopBar action={<HelpButton helpKey="kontakte" />} />
      <div className="px-5 pb-6">
        <h1 className="text-[24px] mb-1">{t.network.allContacts}</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-6">{t.network.subtitle}</p>

        {entries.length === 0 ? (
          <EmptyState title={t.network.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {entries.map((entry) => {
              const category = categories.find((c) => c.id === entry.category) ?? categories[0];
              const Icon = getIcon(entry.iconKey, category.iconKey);
              return (
                <Card key={entry.id} className="flex items-center gap-3">
                  <span
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-surface)] flex-shrink-0 overflow-hidden"
                    style={{ background: category.color }}
                  >
                    {entry.photoDataUrl ? (
                      <img
                        src={entry.photoDataUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        style={{
                          transform: `translate(${entry.photoOffsetX ?? 0}%, ${entry.photoOffsetY ?? 0}%) scale(${entry.photoScale ?? 1})`,
                        }}
                      />
                    ) : (
                      <Icon size={16} />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] text-[var(--color-text)] truncate">{entry.name}</p>
                    {entry.role && <p className="text-[13px] text-[var(--color-text-muted)] truncate">{entry.role}</p>}
                  </div>
                  {entry.phone && (
                    <a href={`tel:${entry.phone}`} aria-label={t.network.call} className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
                      <Phone size={16} />
                    </a>
                  )}
                  {entry.email && (
                    <a href={`mailto:${entry.email}`} aria-label={t.network.emailAction} className="p-2 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)]">
                      <Mail size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => toggleImportant(entry)}
                    aria-pressed={!!entry.isImportantContact}
                    aria-label={t.network.markImportant}
                    className="p-2 rounded-full text-[var(--color-accent-sun)] hover:bg-[var(--color-surface-muted)]"
                  >
                    <Star size={16} className={entry.isImportantContact ? 'fill-current' : ''} />
                  </button>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
