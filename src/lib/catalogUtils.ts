import type { AppItem } from '../types/app';

export type SortMode = 'popular' | 'newest' | 'name' | 'recent';

const SORT_MODES = new Set<SortMode>(['popular', 'newest', 'name', 'recent']);

export function getValidSortMode(value: string | null): SortMode {
  return value && SORT_MODES.has(value as SortMode) ? (value as SortMode) : 'popular';
}

export function getValidCategory(value: string | null, categories: string[]): string {
  if (!value || value === 'all') return 'all';
  return categories.includes(value) ? value : 'all';
}

export function matchesCatalogQuery(item: AppItem, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.trim().toLowerCase();
  return [
    item.title,
    item.titleEn,
    item.description,
    item.descriptionEn,
    item.category,
    item.categoryEn,
    item.instructions ?? '',
    ...(item.tags ?? []),
    ...(item.features ?? []),
  ]
    .join(' ')
    .toLowerCase()
    .includes(q);
}

export function getItemFaq(
  item: AppItem,
  t: (zh: string, en: string) => string,
  defaultQa: Array<{ q: string; qEn: string; a: string; aEn: string }>,
) {
  if (item.faq?.length) {
    return item.faq.map((entry) => ({
      q: t(entry.q, entry.qEn ?? entry.q),
      a: t(entry.a, entry.aEn ?? entry.a),
    }));
  }
  return defaultQa.map((entry) => ({
    q: t(entry.q, entry.qEn),
    a: t(entry.a, entry.aEn),
  }));
}
