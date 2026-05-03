import type { AppItem } from '../types/app';
import { games } from '../data/games';
import { tools } from '../data/tools';

const allItems: AppItem[] = [...games, ...tools];

export interface SearchResult {
  item: AppItem;
  score: number;
}

export function search(query: string): SearchResult[] {
  if (!query || !query.trim()) return [];

  const q = query.trim().toLowerCase();
  const results: SearchResult[] = [];

  for (const item of allItems) {
    let score = 0;
    const titleLower = item.title.toLowerCase();
    const titleEnLower = item.titleEn.toLowerCase();
    const descLower = item.description.toLowerCase();
    const descEnLower = item.descriptionEn.toLowerCase();
    const catLower = item.category.toLowerCase();
    const catEnLower = item.categoryEn.toLowerCase();

    if (titleLower === q || titleEnLower === q) score += 100;
    else if (titleLower.includes(q) || titleEnLower.includes(q)) score += 50;
    else if (titleLower.startsWith(q)) score += 40;

    if (catLower.includes(q) || catEnLower.includes(q)) score += 20;

    if (descLower.includes(q) || descEnLower.includes(q)) score += 10;

    for (const tag of item.tags) {
      if (tag === q) score += 30;
      else if (tag.includes(q)) score += 15;
    }

    if (score > 0) {
      results.push({ item, score });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results;
}

export function getAllItems(): AppItem[] {
  return allItems;
}
