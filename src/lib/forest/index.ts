export { FOREST_PALETTE, type ForestPaletteKey } from './forestPalette';

export {
  shouldShowForestSplash,
  markForestSplashSeen,
  clearForestSplashMemory,
  FOREST_SPLASH_KEY,
  FOREST_SPLASH_TTL_MS,
} from './forestSplashMemory';

export {
  getForestTier,
  readForestTierInput,
  useForestTier,
  createFpsTierController,
  tierAllowsVideo,
  tierAllowsParticles,
  tierAllowsCursor,
  tierAllowsEggs,
  particleCap,
  type ForestTier,
  type ForestTierInput,
  type FpsTierController,
} from './forestTier';

export { isInteractiveForestTarget, isDecorativeHit } from './hitTest';

export {
  createWindField,
  type WindField,
  type WindSample,
} from './windField';

export {
  TERRAIN_DAMPING,
  resolveTerrainDamping,
  detectTerrainFromScroller,
  type ForestTerrain,
  type TerrainSection,
} from './scrollTerrain';

export { hapticTap, hapticGrow, hapticSection } from './haptics';

export {
  ForestRuntimeProvider,
  useForestRuntime,
  useForestRuntimeOptional,
  useForestRuntimeSelector,
  useForestRuntimeSelectorOptional,
  type ForestPointer,
  type ForestCursorVisual,
  type ForestScroll,
  type ForestRuntimeFlags,
  type ForestRuntimeSnapshot,
  type ForestRuntimeApi,
} from './ForestRuntime';
