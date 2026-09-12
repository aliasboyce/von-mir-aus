import { networkRepo } from './networkRepo';
import { createId } from '../../services/storage/repository';
import type { Resource } from '../../data/types';

/**
 * Called whenever a resource's favorite flag changes. Auto-CREATES a
 * real NetworkEntry the first time a resource becomes a favorite — not
 * a second, separately-maintained preview list, an actual node the
 * person can then edit, move, and connect exactly like any other
 * network entry (linkedResourceId is what marks it as resource-backed;
 * see NetworkDetailModal, which already reads this to show the linked
 * resource).
 *
 * Deliberately one-directional: removing the favorite mark later does
 * NOT delete or touch the network entry. By the time someone
 * un-favorites a resource, the corresponding network node may already
 * carry their own edits — a custom position they dragged it to, a
 * connection they drew to another contact, a role or note they wrote.
 * Auto-deleting on un-favorite would destroy that manual work as a side
 * effect of an unrelated toggle elsewhere in the app, which is worse
 * than just leaving a no-longer-favorited resource's node in place for
 * the person to remove themselves if they want it gone.
 */
export function syncFavoriteResourceToNetwork(resource: Resource): void {
  if (!resource.favorite) return;
  const already = networkRepo.getAll().some((e) => e.linkedResourceId === resource.id);
  if (already) return;
  const now = new Date().toISOString();
  networkRepo.save({
    id: createId('net'),
    name: resource.title,
    category: 'ressource',
    description: resource.description,
    linkedResourceId: resource.id,
    helpsWith: [],
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * One-time catch-up for resources that were already favorited before
 * this auto-sync existed — called on SafetyNetPage load so a favorite
 * set before this feature shipped doesn't just silently vanish from
 * the network now that the old separate "favorite resources" preview
 * list is gone. Safe to call repeatedly; syncFavoriteResourceToNetwork
 * already no-ops for resources that already have a linked entry.
 */
export function syncAllFavoriteResourcesToNetwork(resources: Resource[]): void {
  resources.filter((r) => r.favorite).forEach(syncFavoriteResourceToNetwork);
}
