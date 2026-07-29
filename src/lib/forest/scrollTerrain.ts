/** Parallax / scroll damping multipliers per page section. */
export const TERRAIN_DAMPING = {
  hero: 1.4,
  cards: 1.1,
  list: 1.2,
  footer: 1.0,
} as const;

export type ForestTerrain = keyof typeof TERRAIN_DAMPING;
/** @deprecated Prefer `ForestTerrain` — kept for clarity in resolve helpers. */
export type TerrainSection = ForestTerrain;

/** Resolve damping for a named section; unknown sections fall back to 1.0. */
export function resolveTerrainDamping(section: string): number {
  if (section in TERRAIN_DAMPING) {
    return TERRAIN_DAMPING[section as ForestTerrain];
  }
  return 1.0;
}

/** Pick terrain from `[data-forest-terrain]` nodes relative to scroller mid-viewport. */
export function detectTerrainFromScroller(scroller: HTMLElement): ForestTerrain {
  const mid = scroller.scrollTop + scroller.clientHeight * 0.35;
  const nodes = scroller.querySelectorAll<HTMLElement>('[data-forest-terrain]');
  let best: ForestTerrain = 'hero';
  let bestDist = Number.POSITIVE_INFINITY;

  nodes.forEach((node) => {
    const raw = node.dataset.forestTerrain;
    if (!raw || !(raw in TERRAIN_DAMPING)) return;
    const terrain = raw as ForestTerrain;
    const top = node.offsetTop;
    const bottom = top + node.offsetHeight;
    if (mid >= top && mid <= bottom) {
      best = terrain;
      bestDist = 0;
      return;
    }
    const dist = mid < top ? top - mid : mid - bottom;
    if (dist < bestDist) {
      bestDist = dist;
      best = terrain;
    }
  });

  return best;
}
