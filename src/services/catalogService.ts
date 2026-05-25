import { supabase } from '../lib/supabase';
import type { AppItem, AppItemType } from '../types/app';

export interface CatalogOverride {
  item_type: AppItemType;
  item_id: string;
  enabled: boolean;
  featured: boolean | null;
  sort_order: number | null;
  platforms: string[];
  announcement: string | null;
}

const cache = new Map<string, Promise<CatalogOverride[]>>();

function platformMatches(platforms: string[] | null | undefined, platform: string) {
  if (!platforms || platforms.length === 0) return true;
  return platforms.includes(platform);
}

export async function fetchCatalogOverrides(
  itemType: AppItemType,
  platform = 'web',
): Promise<CatalogOverride[]> {
  if (!supabase) return [];

  const cacheKey = `${itemType}:${platform}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('catalog_overrides')
        .select('item_type, item_id, enabled, featured, sort_order, platforms, announcement')
        .eq('item_type', itemType);
      if (error || !data) return [];
      return (data as CatalogOverride[]).filter((override) =>
        platformMatches(override.platforms, platform),
      );
    } catch {
      return [];
    }
  })();

  cache.set(cacheKey, promise);
  return promise;
}

export function applyCatalogOverrides(
  items: AppItem[],
  overrides: CatalogOverride[],
  itemType: AppItemType,
): AppItem[] {
  const overrideMap = new Map(
    overrides
      .filter((override) => override.item_type === itemType)
      .map((override) => [override.item_id, override]),
  );

  return items
    .map((item) => {
      const override = overrideMap.get(item.id);
      if (!override) return item;
      return {
        ...item,
        featured: override.featured ?? item.featured,
        catalogSortOrder: override.sort_order ?? item.catalogSortOrder,
        catalogAnnouncement: override.announcement ?? item.catalogAnnouncement,
      };
    })
    .filter((item) => overrideMap.get(item.id)?.enabled !== false)
    .sort((a, b) => {
      const aOrder = a.catalogSortOrder ?? Number.POSITIVE_INFINITY;
      const bOrder = b.catalogSortOrder ?? Number.POSITIVE_INFINITY;
      if (aOrder !== bOrder) return aOrder - bOrder;
      return 0;
    });
}
