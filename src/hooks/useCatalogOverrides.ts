import { useEffect, useMemo, useState } from 'react';
import { applyCatalogOverrides, fetchCatalogOverrides, type CatalogOverride } from '../services/catalogService';
import type { AppItem, AppItemType } from '../types/app';

export function useCatalogItems(items: AppItem[], itemType: AppItemType, platform = 'web') {
  const [overrides, setOverrides] = useState<CatalogOverride[]>([]);

  useEffect(() => {
    let active = true;
    fetchCatalogOverrides(itemType, platform).then((nextOverrides) => {
      if (active) setOverrides(nextOverrides);
    });
    return () => {
      active = false;
    };
  }, [itemType, platform]);

  return useMemo(
    () => applyCatalogOverrides(items, overrides, itemType),
    [items, itemType, overrides],
  );
}
