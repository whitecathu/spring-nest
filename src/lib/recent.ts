import type { RecentItem } from '../types/app';
import { tools } from '../data/tools';
import { games } from '../data/games';

const STORAGE_KEY = 'spring_nest_recent';
const MAX_ITEMS = 10;

/**
 * Record a visit to a tool or game.
 * Call this when the user opens a tool/game page.
 */
export function recordVisit(type: 'tool' | 'game', id: string) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const items: RecentItem[] = raw ? JSON.parse(raw) : [];

    const source = type === 'tool' ? tools : games;
    const item = source.find(i => i.id === id);
    if (!item) return;

    // Remove existing entry for same item
    const filtered = items.filter(r => !(r.type === type && r.id === id));

    // Prepend new entry
    filtered.unshift({
      type,
      id,
      title: item.title,
      titleEn: item.titleEn,
      icon: item.icon,
      route: item.route,
      visitedAt: Date.now(),
    });

    // Keep only recent N items
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {
    // Silently fail
  }
}

/**
 * Clear all recent items from localStorage.
 */
export function clearRecentItems() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

/**
 * Get recent items from localStorage, enriched with latest data.
 * Returns up to `limit` items (default 6).
 */
export function getRecentItems(limit = 6): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const items: RecentItem[] = JSON.parse(raw);
    const allItems = [...tools, ...games];

    return items
      .map(recent => {
        const match = allItems.find(i => i.id === recent.id && i.type === recent.type);
        if (!match) return null;
        return {
          ...recent,
          title: match.title,
          titleEn: match.titleEn,
          icon: match.icon,
          route: match.route,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .slice(0, limit);
  } catch {
    return [];
  }
}
