import { getIcon } from '../../components/icons/networkIcons';
import { useNetworkCategories } from '../safetyNet/useNetworkCategories';
import type { NetworkEntry } from '../../data/types';

/** A network person as the Netzwerk page shows them: their photo when
 * there is one (with the saved zoom/offset), otherwise their symbol on
 * the category color. "Person aus dem Netzwerk, wo Name mit Symbol,
 * Rolle und Bild uebernommen wird"-Auftrag. */
export function PersonAvatar({ entry, size = 32 }: { entry: NetworkEntry; size?: number }) {
  const { categories } = useNetworkCategories();
  const category = categories.find((c) => c.id === entry.category) ?? categories[0];
  const Icon = getIcon(entry.iconKey, category.iconKey);
  return (
    <span className="rounded-full flex items-center justify-center overflow-hidden flex-shrink-0" style={{ width: size, height: size, background: category.color, color: 'var(--color-surface)' }}>
      {entry.photoDataUrl ? (
        <img
          src={entry.photoDataUrl}
          alt=""
          className="w-full h-full object-cover"
          style={{ transform: `translate(${entry.photoOffsetX ?? 0}%, ${entry.photoOffsetY ?? 0}%) scale(${entry.photoScale ?? 1})` }}
        />
      ) : (
        <Icon size={Math.round(size * 0.5)} />
      )}
    </span>
  );
}

/** Avatar + name + role, in one row. */
export function PersonLine({ entry, size = 32 }: { entry: NetworkEntry; size?: number }) {
  return (
    <span className="flex items-center gap-2 min-w-0">
      <PersonAvatar entry={entry} size={size} />
      <span className="min-w-0 text-left">
        <span className="block text-[13.5px] text-[var(--color-text)] truncate">{entry.name}</span>
        {entry.role && <span className="block text-[11.5px] text-[var(--color-text-muted)] truncate">{entry.role}</span>}
      </span>
    </span>
  );
}
