/** Shared color tokens for the forest immersion layer. */
export const FOREST_PALETTE = {
  ink: '#2D4A36',
  body: '#4A5A50',
  muted: '#7A8A80',
  moss: '#5B7A4E',
  gold: '#C4A35A',
  mist: '#D4DDD6',
  bark: '#6B5344',
  water: '#4A7B8C',
  shadow: 'rgba(45, 74, 54, 0.22)',
} as const;

export type ForestPaletteKey = keyof typeof FOREST_PALETTE;
