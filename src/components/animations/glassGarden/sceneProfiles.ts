export type GlassGardenProfileKey =
  | 'startup'
  | 'home'
  | 'tools'
  | 'games'
  | 'detail'
  | 'search'
  | 'empty';

export type GlassGardenProfile = {
  scene: 'terrarium-emergence' | 'ambient-terrarium';
  opacity: number;
  soilClumps: number;
  dewDrops: number;
  rootCurves: number;
  particleCount: number;
  parallaxStrength: number;
  sproutScale: number;
  glassStrength: number;
  warmth: number;
};

export const glassGardenProfiles: Record<GlassGardenProfileKey, GlassGardenProfile> = {
  startup: {
    scene: 'terrarium-emergence',
    opacity: 1,
    soilClumps: 34,
    dewDrops: 18,
    rootCurves: 9,
    particleCount: 42,
    parallaxStrength: 0,
    sproutScale: 1.12,
    glassStrength: 0.86,
    warmth: 0.78,
  },
  home: {
    scene: 'ambient-terrarium',
    opacity: 0.42,
    soilClumps: 12,
    dewDrops: 9,
    rootCurves: 5,
    particleCount: 24,
    parallaxStrength: 10,
    sproutScale: 0.74,
    glassStrength: 0.42,
    warmth: 0.66,
  },
  tools: {
    scene: 'ambient-terrarium',
    opacity: 0.26,
    soilClumps: 6,
    dewDrops: 4,
    rootCurves: 4,
    particleCount: 10,
    parallaxStrength: 6,
    sproutScale: 0.52,
    glassStrength: 0.28,
    warmth: 0.54,
  },
  games: {
    scene: 'ambient-terrarium',
    opacity: 0.34,
    soilClumps: 8,
    dewDrops: 8,
    rootCurves: 4,
    particleCount: 28,
    parallaxStrength: 12,
    sproutScale: 0.62,
    glassStrength: 0.34,
    warmth: 0.6,
  },
  detail: {
    scene: 'ambient-terrarium',
    opacity: 0.18,
    soilClumps: 3,
    dewDrops: 2,
    rootCurves: 2,
    particleCount: 6,
    parallaxStrength: 4,
    sproutScale: 0.38,
    glassStrength: 0.18,
    warmth: 0.48,
  },
  search: {
    scene: 'ambient-terrarium',
    opacity: 0.24,
    soilClumps: 4,
    dewDrops: 5,
    rootCurves: 3,
    particleCount: 8,
    parallaxStrength: 5,
    sproutScale: 0.4,
    glassStrength: 0.3,
    warmth: 0.52,
  },
  empty: {
    scene: 'ambient-terrarium',
    opacity: 0.16,
    soilClumps: 2,
    dewDrops: 2,
    rootCurves: 1,
    particleCount: 4,
    parallaxStrength: 2,
    sproutScale: 0.3,
    glassStrength: 0.16,
    warmth: 0.44,
  },
};

export function getGlassGardenProfile(key: string): GlassGardenProfile {
  if (key in glassGardenProfiles) return glassGardenProfiles[key as GlassGardenProfileKey];
  return glassGardenProfiles.detail;
}
