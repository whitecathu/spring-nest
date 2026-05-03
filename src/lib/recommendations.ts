import type { AppItem } from '../types/app';
import { tools } from '../data/tools';
import { games } from '../data/games';

/**
 * Get items marked as new (isNew === true).
 * Returns up to `limit` items, sorted by popularScore descending.
 */
export function getNewItems(limit = 8): AppItem[] {
  const allItems = [...tools, ...games];
  return allItems
    .filter(item => item.isNew === true)
    .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
    .slice(0, limit);
}

/**
 * Get recommended items for empty search state.
 * Returns a curated mix of popular items across both types.
 */
export function getRecommendedForEmpty(limit = 6): AppItem[] {
  const allItems = [...tools, ...games];
  return allItems
    .filter(item => item.featured || (item.popularScore ?? 0) >= 70)
    .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0))
    .slice(0, limit);
}

/**
 * Get related items for a detail page.
 * Strategy: explicit related → same category → tag overlap → popular fallback.
 * Excludes the current item.
 */
export function getRelatedItems(currentId: string, limit = 4): AppItem[] {
  const allItems = [...tools, ...games];
  const current = allItems.find(i => i.id === currentId);
  if (!current) return allItems.sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0)).slice(0, limit);

  const candidates = allItems.filter(i => i.id !== currentId);

  // 1. Explicit related IDs
  const explicitRelated = (current.related ?? [])
    .map(rid => candidates.find(c => c.id === rid))
    .filter((c): c is AppItem => !!c);

  if (explicitRelated.length >= limit) return explicitRelated.slice(0, limit);

  // 2. Same category
  const sameCategory = candidates.filter(
    c => c.category === current.category && !explicitRelated.find(e => e.id === c.id)
  );

  // 3. Tag overlap
  const tagOverlap = candidates.filter(
    c => c.tags.some(t => current.tags.includes(t)) &&
      !explicitRelated.find(e => e.id === c.id) &&
      !sameCategory.find(s => s.id === c.id)
  );

  // 4. Popular fallback
  const popular = candidates
    .filter(c => c.id !== currentId)
    .sort((a, b) => (b.popularScore ?? 0) - (a.popularScore ?? 0));

  const result = [...explicitRelated, ...sameCategory, ...tagOverlap];
  const seen = new Set(result.map(r => r.id));

  for (const item of popular) {
    if (result.length >= limit) break;
    if (!seen.has(item.id)) {
      result.push(item);
      seen.add(item.id);
    }
  }

  return result.slice(0, limit);
}
