import type { BackgroundSymbol } from './backgroundProfileTypes';

export const sharedSymbols = {
  tools: ['+', '/', '{}', 'Aa', '#', 'px'],
  stars: ['*', '.', '+', '.', '*', '.'],
  doc: ['P', 'A4', 'TXT', 'DOC', 'PDF', 'md'],
  game: ['x2', '2048', 'WPM', 'LV', '+1', 'HI'],
};

export function makeSymbols(values: string[], startX = 16, startY = 18): BackgroundSymbol[] {
  return values.map((value, index) => ({
    value,
    x: (startX + index * 13) % 86,
    y: (startY + index * 17) % 78,
    size: 12 + (index % 3) * 4,
    delay: index * 0.28,
    drift: 8 + (index % 4) * 3,
    opacity: 0.12 + (index % 2) * 0.05,
  }));
}
