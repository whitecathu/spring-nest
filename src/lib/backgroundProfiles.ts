import { games } from '../data/games';
import { tools } from '../data/tools';

export type BackgroundFamily =
  | 'home'
  | 'tools'
  | 'games'
  | 'favorites'
  | 'settings'
  | 'notFound'
  | 'offline'
  | 'search'
  | 'detail'
  | 'empty';

export type AnimationProfile =
  | 'calm'
  | 'playful'
  | 'focus'
  | 'magic'
  | 'tech'
  | 'nature'
  | 'document'
  | 'color'
  | 'clock'
  | 'grid'
  | 'bubble'
  | 'cards'
  | 'path';

export type BackgroundProfileKey =
  | 'home-garden'
  | 'tools-flow'
  | 'games-playful'
  | 'favorites-glow'
  | 'settings-minimal'
  | 'not-found-path'
  | 'offline-cabin'
  | 'search-focus'
  | 'empty-quiet'
  | 'calculator-grid'
  | 'pomodoro-rings'
  | 'color-halo'
  | 'qr-dots'
  | 'json-scan'
  | 'document-pages'
  | 'nature-wind'
  | 'playful-pop'
  | 'magic-stars'
  | 'tech-grid'
  | 'memory-cards'
  | 'snake-path'
  | 'mines-grid'
  | 'bubble-rise'
  | 'detail-calm';

export type BackgroundSymbol = {
  value: string;
  x: number;
  y: number;
  size: number;
  delay: number;
  drift: number;
  opacity?: number;
};

export type BackgroundProfile = {
  key: BackgroundProfileKey;
  family: BackgroundFamily;
  animation: AnimationProfile;
  intensity: 'quiet' | 'balanced' | 'lively';
  light: {
    base: string;
    wash: string;
    halo: string[];
    line: string;
    particle: string;
    symbol: string;
  };
  dark: {
    base: string;
    wash: string;
    halo: string[];
    line: string;
    particle: string;
    symbol: string;
  };
  particles: number;
  leaves: number;
  lineCount: number;
  symbols: BackgroundSymbol[];
};

const sharedSymbols = {
  tools: ['+', '/', '{}', 'Aa', '#', 'px'],
  stars: ['*', '.', '+', '.', '*', '.'],
  doc: ['P', 'A4', 'TXT', 'DOC', 'PDF', 'md'],
  game: ['x2', '2048', 'WPM', 'LV', '+1', 'HI'],
};

function makeSymbols(values: string[], startX = 16, startY = 18): BackgroundSymbol[] {
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

export const backgroundProfiles: Record<BackgroundProfileKey, BackgroundProfile> = {
  'home-garden': {
    key: 'home-garden',
    family: 'home',
    animation: 'nature',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.018 88), oklch(96% 0.035 144) 48%, oklch(97% 0.028 43))',
      wash:
        'radial-gradient(circle at 18% 20%, oklch(88% 0.08 142 / 0.28), transparent 32%), radial-gradient(circle at 78% 18%, oklch(88% 0.07 48 / 0.24), transparent 34%)',
      halo: ['oklch(86% 0.09 143 / 0.34)', 'oklch(89% 0.07 57 / 0.28)', 'oklch(83% 0.07 198 / 0.18)'],
      line: 'oklch(64% 0.09 145 / 0.2)',
      particle: 'oklch(67% 0.12 146 / 0.36)',
      symbol: 'oklch(48% 0.08 145 / 0.18)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(18% 0.02 148), oklch(13% 0.017 164) 52%, oklch(17% 0.022 91))',
      wash:
        'radial-gradient(circle at 18% 22%, oklch(57% 0.1 145 / 0.18), transparent 34%), radial-gradient(circle at 78% 20%, oklch(78% 0.12 82 / 0.14), transparent 30%)',
      halo: ['oklch(48% 0.09 145 / 0.24)', 'oklch(70% 0.09 92 / 0.14)', 'oklch(55% 0.08 210 / 0.13)'],
      line: 'oklch(73% 0.08 142 / 0.16)',
      particle: 'oklch(78% 0.13 95 / 0.36)',
      symbol: 'oklch(78% 0.09 143 / 0.2)',
    },
    particles: 22,
    leaves: 8,
    lineCount: 3,
    symbols: makeSymbols(['leaf', 'sprout', 'wind', 'dew'], 12, 16),
  },
  'tools-flow': {
    key: 'tools-flow',
    family: 'tools',
    animation: 'focus',
    intensity: 'quiet',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.012 102), oklch(96% 0.018 166) 55%, oklch(97% 0.014 215))',
      wash:
        'radial-gradient(circle at 20% 18%, oklch(84% 0.055 152 / 0.2), transparent 31%), radial-gradient(circle at 82% 70%, oklch(83% 0.045 214 / 0.16), transparent 32%)',
      halo: ['oklch(84% 0.06 150 / 0.24)', 'oklch(83% 0.05 214 / 0.18)', 'oklch(92% 0.04 88 / 0.18)'],
      line: 'oklch(57% 0.07 159 / 0.2)',
      particle: 'oklch(58% 0.08 158 / 0.25)',
      symbol: 'oklch(42% 0.05 160 / 0.16)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(16% 0.016 154), oklch(13% 0.018 190) 58%, oklch(15% 0.014 105))',
      wash:
        'radial-gradient(circle at 18% 18%, oklch(53% 0.08 150 / 0.14), transparent 32%), radial-gradient(circle at 82% 70%, oklch(60% 0.07 220 / 0.12), transparent 34%)',
      halo: ['oklch(52% 0.08 152 / 0.18)', 'oklch(60% 0.07 214 / 0.13)', 'oklch(70% 0.06 90 / 0.1)'],
      line: 'oklch(75% 0.08 158 / 0.15)',
      particle: 'oklch(72% 0.1 158 / 0.24)',
      symbol: 'oklch(78% 0.07 160 / 0.17)',
    },
    particles: 14,
    leaves: 2,
    lineCount: 7,
    symbols: makeSymbols(sharedSymbols.tools, 11, 22),
  },
  'games-playful': {
    key: 'games-playful',
    family: 'games',
    animation: 'playful',
    intensity: 'lively',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.016 75), oklch(96% 0.032 151) 45%, oklch(96% 0.032 22))',
      wash:
        'radial-gradient(circle at 18% 24%, oklch(84% 0.12 151 / 0.22), transparent 32%), radial-gradient(circle at 76% 18%, oklch(84% 0.11 34 / 0.18), transparent 30%), radial-gradient(circle at 72% 78%, oklch(82% 0.08 255 / 0.16), transparent 34%)',
      halo: ['oklch(84% 0.11 151 / 0.28)', 'oklch(86% 0.1 35 / 0.22)', 'oklch(82% 0.09 250 / 0.18)'],
      line: 'oklch(62% 0.09 150 / 0.18)',
      particle: 'oklch(70% 0.16 33 / 0.36)',
      symbol: 'oklch(45% 0.08 150 / 0.17)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(16% 0.022 151), oklch(13% 0.02 250) 48%, oklch(16% 0.024 35))',
      wash:
        'radial-gradient(circle at 18% 24%, oklch(57% 0.12 151 / 0.16), transparent 33%), radial-gradient(circle at 76% 18%, oklch(70% 0.12 35 / 0.12), transparent 32%), radial-gradient(circle at 72% 78%, oklch(61% 0.1 255 / 0.13), transparent 34%)',
      halo: ['oklch(56% 0.12 151 / 0.2)', 'oklch(68% 0.11 35 / 0.14)', 'oklch(59% 0.1 250 / 0.14)'],
      line: 'oklch(76% 0.1 150 / 0.14)',
      particle: 'oklch(78% 0.15 48 / 0.32)',
      symbol: 'oklch(80% 0.09 150 / 0.18)',
    },
    particles: 28,
    leaves: 4,
    lineCount: 4,
    symbols: makeSymbols(sharedSymbols.game, 8, 20),
  },
  'favorites-glow': {
    key: 'favorites-glow',
    family: 'favorites',
    animation: 'magic',
    intensity: 'quiet',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.014 70), oklch(96% 0.026 25) 52%, oklch(97% 0.016 150))',
      wash:
        'radial-gradient(circle at 32% 22%, oklch(88% 0.08 45 / 0.22), transparent 34%), radial-gradient(circle at 76% 72%, oklch(88% 0.07 145 / 0.18), transparent 32%)',
      halo: ['oklch(87% 0.08 45 / 0.24)', 'oklch(88% 0.07 145 / 0.2)', 'oklch(86% 0.06 288 / 0.12)'],
      line: 'oklch(66% 0.08 45 / 0.16)',
      particle: 'oklch(72% 0.14 55 / 0.34)',
      symbol: 'oklch(55% 0.08 42 / 0.18)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(16% 0.018 50), oklch(12% 0.018 150) 55%, oklch(16% 0.02 286))',
      wash:
        'radial-gradient(circle at 32% 22%, oklch(70% 0.09 55 / 0.14), transparent 34%), radial-gradient(circle at 76% 72%, oklch(64% 0.08 145 / 0.12), transparent 32%)',
      halo: ['oklch(70% 0.09 55 / 0.14)', 'oklch(62% 0.08 145 / 0.14)', 'oklch(62% 0.07 286 / 0.12)'],
      line: 'oklch(78% 0.08 55 / 0.12)',
      particle: 'oklch(80% 0.12 65 / 0.28)',
      symbol: 'oklch(82% 0.08 70 / 0.18)',
    },
    particles: 22,
    leaves: 1,
    lineCount: 2,
    symbols: makeSymbols(['*', '+', 'bookmark', '*', 'save'], 14, 16),
  },
  'settings-minimal': {
    key: 'settings-minimal',
    family: 'settings',
    animation: 'calm',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 100), oklch(96% 0.018 152))',
      wash: 'radial-gradient(circle at 55% 15%, oklch(86% 0.06 145 / 0.18), transparent 36%)',
      halo: ['oklch(86% 0.05 145 / 0.2)', 'oklch(90% 0.04 80 / 0.14)', 'oklch(86% 0.04 215 / 0.1)'],
      line: 'oklch(62% 0.06 150 / 0.12)',
      particle: 'oklch(64% 0.07 150 / 0.2)',
      symbol: 'oklch(48% 0.05 150 / 0.12)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(15% 0.014 150), oklch(11% 0.015 180))',
      wash: 'radial-gradient(circle at 55% 15%, oklch(60% 0.06 145 / 0.12), transparent 36%)',
      halo: ['oklch(58% 0.07 145 / 0.14)', 'oklch(70% 0.05 80 / 0.1)', 'oklch(58% 0.05 215 / 0.1)'],
      line: 'oklch(74% 0.06 150 / 0.12)',
      particle: 'oklch(76% 0.08 150 / 0.18)',
      symbol: 'oklch(78% 0.05 150 / 0.12)',
    },
    particles: 10,
    leaves: 0,
    lineCount: 2,
    symbols: [],
  },
  'not-found-path': {
    key: 'not-found-path',
    family: 'notFound',
    animation: 'nature',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(145deg, oklch(98% 0.016 82), oklch(95% 0.03 140), oklch(97% 0.018 58))',
      wash:
        'radial-gradient(circle at 42% 74%, oklch(76% 0.08 85 / 0.2), transparent 30%), radial-gradient(circle at 18% 18%, oklch(86% 0.08 142 / 0.18), transparent 34%)',
      halo: ['oklch(86% 0.08 142 / 0.22)', 'oklch(80% 0.08 85 / 0.18)', 'oklch(88% 0.07 40 / 0.14)'],
      line: 'oklch(57% 0.08 120 / 0.18)',
      particle: 'oklch(62% 0.1 132 / 0.26)',
      symbol: 'oklch(46% 0.07 125 / 0.16)',
    },
    dark: {
      base:
        'linear-gradient(145deg, oklch(15% 0.018 122), oklch(12% 0.02 160), oklch(16% 0.018 70))',
      wash:
        'radial-gradient(circle at 42% 74%, oklch(62% 0.08 85 / 0.12), transparent 30%), radial-gradient(circle at 18% 18%, oklch(58% 0.08 142 / 0.14), transparent 34%)',
      halo: ['oklch(58% 0.08 142 / 0.17)', 'oklch(62% 0.08 85 / 0.12)', 'oklch(68% 0.08 40 / 0.1)'],
      line: 'oklch(76% 0.08 120 / 0.13)',
      particle: 'oklch(76% 0.1 132 / 0.22)',
      symbol: 'oklch(78% 0.07 125 / 0.15)',
    },
    particles: 14,
    leaves: 9,
    lineCount: 5,
    symbols: makeSymbols(['?', 'path', 'leaf', '404'], 20, 14),
  },
  'offline-cabin': {
    key: 'offline-cabin',
    family: 'offline',
    animation: 'calm',
    intensity: 'quiet',
    light: {
      base:
        'linear-gradient(135deg, oklch(97% 0.016 78), oklch(95% 0.018 130) 58%, oklch(96% 0.016 45))',
      wash:
        'radial-gradient(circle at 50% 52%, oklch(84% 0.07 68 / 0.28), transparent 28%), radial-gradient(circle at 22% 18%, oklch(86% 0.06 145 / 0.16), transparent 34%)',
      halo: ['oklch(84% 0.08 70 / 0.24)', 'oklch(82% 0.06 145 / 0.16)', 'oklch(86% 0.05 210 / 0.1)'],
      line: 'oklch(60% 0.06 80 / 0.13)',
      particle: 'oklch(67% 0.08 70 / 0.2)',
      symbol: 'oklch(50% 0.06 80 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(13% 0.018 76), oklch(11% 0.018 145) 58%, oklch(14% 0.018 38))',
      wash:
        'radial-gradient(circle at 50% 52%, oklch(72% 0.09 70 / 0.16), transparent 26%), radial-gradient(circle at 22% 18%, oklch(56% 0.07 145 / 0.1), transparent 34%)',
      halo: ['oklch(72% 0.09 70 / 0.13)', 'oklch(56% 0.07 145 / 0.11)', 'oklch(58% 0.06 210 / 0.09)'],
      line: 'oklch(76% 0.06 80 / 0.1)',
      particle: 'oklch(80% 0.11 75 / 0.22)',
      symbol: 'oklch(80% 0.07 80 / 0.13)',
    },
    particles: 12,
    leaves: 0,
    lineCount: 1,
    symbols: makeSymbols(['light', 'home', 'offline'], 28, 30),
  },
  'search-focus': {
    key: 'search-focus',
    family: 'search',
    animation: 'focus',
    intensity: 'quiet',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.012 95), oklch(96% 0.02 155), oklch(97% 0.014 218))',
      wash: 'radial-gradient(circle at 50% 30%, oklch(84% 0.07 155 / 0.24), transparent 33%)',
      halo: ['oklch(84% 0.07 155 / 0.25)', 'oklch(84% 0.05 218 / 0.14)', 'oklch(90% 0.04 85 / 0.12)'],
      line: 'oklch(58% 0.07 160 / 0.18)',
      particle: 'oklch(60% 0.08 160 / 0.24)',
      symbol: 'oklch(45% 0.05 160 / 0.15)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(15% 0.016 155), oklch(12% 0.018 210), oklch(14% 0.015 95))',
      wash: 'radial-gradient(circle at 50% 30%, oklch(58% 0.08 155 / 0.14), transparent 33%)',
      halo: ['oklch(58% 0.08 155 / 0.15)', 'oklch(58% 0.06 218 / 0.11)', 'oklch(70% 0.05 85 / 0.09)'],
      line: 'oklch(78% 0.07 160 / 0.12)',
      particle: 'oklch(78% 0.09 160 / 0.2)',
      symbol: 'oklch(80% 0.06 160 / 0.13)',
    },
    particles: 10,
    leaves: 0,
    lineCount: 5,
    symbols: makeSymbols(['search', 'q', 'tag', 'filter'], 20, 18),
  },
  'empty-quiet': {
    key: 'empty-quiet',
    family: 'empty',
    animation: 'calm',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 86), oklch(96% 0.018 142))',
      wash:
        'radial-gradient(circle at 44% 28%, oklch(86% 0.06 142 / 0.16), transparent 36%), radial-gradient(circle at 78% 78%, oklch(88% 0.05 70 / 0.12), transparent 32%)',
      halo: ['oklch(86% 0.06 142 / 0.16)', 'oklch(88% 0.05 70 / 0.12)', 'oklch(84% 0.04 220 / 0.08)'],
      line: 'oklch(64% 0.06 142 / 0.1)',
      particle: 'oklch(64% 0.08 142 / 0.16)',
      symbol: 'oklch(50% 0.05 142 / 0.1)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(14% 0.014 142), oklch(11% 0.016 180))',
      wash:
        'radial-gradient(circle at 44% 28%, oklch(58% 0.06 142 / 0.1), transparent 36%), radial-gradient(circle at 78% 78%, oklch(68% 0.05 70 / 0.08), transparent 32%)',
      halo: ['oklch(58% 0.06 142 / 0.1)', 'oklch(68% 0.05 70 / 0.08)', 'oklch(58% 0.04 220 / 0.08)'],
      line: 'oklch(76% 0.06 142 / 0.09)',
      particle: 'oklch(76% 0.08 142 / 0.14)',
      symbol: 'oklch(78% 0.05 142 / 0.1)',
    },
    particles: 8,
    leaves: 2,
    lineCount: 1,
    symbols: makeSymbols(['quiet', 'leaf'], 36, 24),
  },
  'calculator-grid': {
    key: 'calculator-grid',
    family: 'detail',
    animation: 'grid',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 92), oklch(96% 0.018 190))',
      wash:
        'radial-gradient(circle at 50% 22%, oklch(84% 0.06 205 / 0.18), transparent 34%), radial-gradient(circle at 76% 74%, oklch(86% 0.06 142 / 0.16), transparent 30%)',
      halo: ['oklch(84% 0.06 205 / 0.18)', 'oklch(86% 0.06 142 / 0.16)', 'oklch(88% 0.04 80 / 0.12)'],
      line: 'oklch(55% 0.06 205 / 0.18)',
      particle: 'oklch(60% 0.08 205 / 0.22)',
      symbol: 'oklch(42% 0.06 205 / 0.16)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(14% 0.016 205), oklch(12% 0.016 150))',
      wash:
        'radial-gradient(circle at 50% 22%, oklch(58% 0.07 205 / 0.12), transparent 34%), radial-gradient(circle at 76% 74%, oklch(57% 0.07 142 / 0.1), transparent 30%)',
      halo: ['oklch(58% 0.07 205 / 0.12)', 'oklch(57% 0.07 142 / 0.1)', 'oklch(70% 0.05 80 / 0.08)'],
      line: 'oklch(76% 0.07 205 / 0.12)',
      particle: 'oklch(78% 0.09 205 / 0.18)',
      symbol: 'oklch(80% 0.07 205 / 0.14)',
    },
    particles: 12,
    leaves: 0,
    lineCount: 8,
    symbols: makeSymbols(['+', '-', 'x', '/', '7', '3.14'], 15, 16),
  },
  'pomodoro-rings': {
    key: 'pomodoro-rings',
    family: 'detail',
    animation: 'clock',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 80), oklch(96% 0.024 34))',
      wash: 'radial-gradient(circle at 52% 34%, oklch(85% 0.08 34 / 0.22), transparent 32%)',
      halo: ['oklch(85% 0.08 34 / 0.22)', 'oklch(86% 0.06 88 / 0.14)', 'oklch(86% 0.05 145 / 0.11)'],
      line: 'oklch(62% 0.08 34 / 0.16)',
      particle: 'oklch(68% 0.1 34 / 0.2)',
      symbol: 'oklch(50% 0.08 34 / 0.16)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(14% 0.016 34), oklch(12% 0.016 80))',
      wash: 'radial-gradient(circle at 52% 34%, oklch(62% 0.09 34 / 0.13), transparent 32%)',
      halo: ['oklch(62% 0.09 34 / 0.13)', 'oklch(70% 0.06 88 / 0.09)', 'oklch(58% 0.05 145 / 0.08)'],
      line: 'oklch(78% 0.08 34 / 0.11)',
      particle: 'oklch(80% 0.1 34 / 0.16)',
      symbol: 'oklch(80% 0.08 34 / 0.13)',
    },
    particles: 10,
    leaves: 0,
    lineCount: 3,
    symbols: makeSymbols(['25', '05', 'focus', 'rest'], 24, 20),
  },
  'color-halo': {
    key: 'color-halo',
    family: 'detail',
    animation: 'color',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.018 40), oklch(96% 0.03 150), oklch(96% 0.03 255))',
      wash:
        'conic-gradient(from 90deg at 52% 40%, oklch(86% 0.1 25 / 0.2), oklch(84% 0.12 145 / 0.18), oklch(82% 0.1 260 / 0.16), oklch(86% 0.1 25 / 0.2))',
      halo: ['oklch(86% 0.1 25 / 0.2)', 'oklch(84% 0.12 145 / 0.18)', 'oklch(82% 0.1 260 / 0.16)'],
      line: 'oklch(60% 0.08 180 / 0.14)',
      particle: 'oklch(68% 0.14 155 / 0.24)',
      symbol: 'oklch(45% 0.07 180 / 0.13)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(14% 0.018 40), oklch(12% 0.022 150), oklch(13% 0.022 255))',
      wash:
        'conic-gradient(from 90deg at 52% 40%, oklch(62% 0.12 25 / 0.12), oklch(58% 0.12 145 / 0.11), oklch(58% 0.1 260 / 0.11), oklch(62% 0.12 25 / 0.12))',
      halo: ['oklch(62% 0.12 25 / 0.12)', 'oklch(58% 0.12 145 / 0.11)', 'oklch(58% 0.1 260 / 0.11)'],
      line: 'oklch(78% 0.08 180 / 0.1)',
      particle: 'oklch(78% 0.14 155 / 0.18)',
      symbol: 'oklch(80% 0.07 180 / 0.11)',
    },
    particles: 18,
    leaves: 0,
    lineCount: 4,
    symbols: makeSymbols(['HEX', 'RGB', 'HSL', '#'], 16, 18),
  },
  'qr-dots': {
    key: 'qr-dots',
    family: 'detail',
    animation: 'tech',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 90), oklch(96% 0.02 190))',
      wash: 'radial-gradient(circle at 50% 32%, oklch(83% 0.07 185 / 0.18), transparent 32%)',
      halo: ['oklch(83% 0.07 185 / 0.18)', 'oklch(86% 0.06 145 / 0.14)', 'oklch(88% 0.04 85 / 0.1)'],
      line: 'oklch(56% 0.06 185 / 0.18)',
      particle: 'oklch(58% 0.08 185 / 0.25)',
      symbol: 'oklch(42% 0.06 185 / 0.14)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(13% 0.016 185), oklch(12% 0.016 145))',
      wash: 'radial-gradient(circle at 50% 32%, oklch(58% 0.07 185 / 0.12), transparent 32%)',
      halo: ['oklch(58% 0.07 185 / 0.12)', 'oklch(57% 0.06 145 / 0.1)', 'oklch(70% 0.04 85 / 0.08)'],
      line: 'oklch(76% 0.07 185 / 0.11)',
      particle: 'oklch(78% 0.09 185 / 0.2)',
      symbol: 'oklch(80% 0.07 185 / 0.12)',
    },
    particles: 26,
    leaves: 0,
    lineCount: 2,
    symbols: makeSymbols(['qr', '01', '10', 'scan'], 20, 18),
  },
  'json-scan': {
    key: 'json-scan',
    family: 'detail',
    animation: 'tech',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 110), oklch(96% 0.02 160))',
      wash: 'radial-gradient(circle at 48% 28%, oklch(83% 0.08 150 / 0.18), transparent 34%)',
      halo: ['oklch(83% 0.08 150 / 0.18)', 'oklch(84% 0.06 210 / 0.12)', 'oklch(88% 0.04 80 / 0.1)'],
      line: 'oklch(56% 0.07 150 / 0.18)',
      particle: 'oklch(60% 0.09 150 / 0.2)',
      symbol: 'oklch(42% 0.07 150 / 0.16)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(13% 0.016 150), oklch(12% 0.017 210))',
      wash: 'radial-gradient(circle at 48% 28%, oklch(57% 0.08 150 / 0.12), transparent 34%)',
      halo: ['oklch(57% 0.08 150 / 0.12)', 'oklch(58% 0.06 210 / 0.1)', 'oklch(70% 0.04 80 / 0.08)'],
      line: 'oklch(76% 0.08 150 / 0.12)',
      particle: 'oklch(78% 0.1 150 / 0.18)',
      symbol: 'oklch(80% 0.08 150 / 0.14)',
    },
    particles: 12,
    leaves: 0,
    lineCount: 9,
    symbols: makeSymbols(['{', '}', '[ ]', ':', 'true', 'null'], 12, 18),
  },
  'document-pages': {
    key: 'document-pages',
    family: 'detail',
    animation: 'document',
    intensity: 'quiet',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.012 84), oklch(96% 0.018 110), oklch(97% 0.012 170))',
      wash: 'radial-gradient(circle at 50% 24%, oklch(86% 0.05 95 / 0.18), transparent 34%)',
      halo: ['oklch(86% 0.05 95 / 0.18)', 'oklch(86% 0.05 150 / 0.12)', 'oklch(84% 0.04 210 / 0.1)'],
      line: 'oklch(62% 0.05 110 / 0.13)',
      particle: 'oklch(64% 0.06 120 / 0.18)',
      symbol: 'oklch(45% 0.04 110 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(14% 0.014 84), oklch(12% 0.016 145), oklch(13% 0.014 210))',
      wash: 'radial-gradient(circle at 50% 24%, oklch(62% 0.05 95 / 0.1), transparent 34%)',
      halo: ['oklch(62% 0.05 95 / 0.1)', 'oklch(58% 0.05 150 / 0.1)', 'oklch(58% 0.04 210 / 0.08)'],
      line: 'oklch(76% 0.05 110 / 0.1)',
      particle: 'oklch(76% 0.06 120 / 0.15)',
      symbol: 'oklch(80% 0.05 110 / 0.12)',
    },
    particles: 10,
    leaves: 0,
    lineCount: 4,
    symbols: makeSymbols(sharedSymbols.doc, 14, 20),
  },
  'nature-wind': {
    key: 'nature-wind',
    family: 'detail',
    animation: 'nature',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.014 92), oklch(95% 0.032 142), oklch(97% 0.018 198))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(84% 0.08 142 / 0.22), transparent 34%), radial-gradient(circle at 76% 72%, oklch(84% 0.06 198 / 0.14), transparent 34%)',
      halo: ['oklch(84% 0.08 142 / 0.22)', 'oklch(84% 0.06 198 / 0.14)', 'oklch(88% 0.05 70 / 0.1)'],
      line: 'oklch(60% 0.08 142 / 0.18)',
      particle: 'oklch(64% 0.1 142 / 0.24)',
      symbol: 'oklch(45% 0.07 142 / 0.15)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(14% 0.016 142), oklch(12% 0.018 198), oklch(13% 0.016 90))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(57% 0.08 142 / 0.13), transparent 34%), radial-gradient(circle at 76% 72%, oklch(58% 0.06 198 / 0.1), transparent 34%)',
      halo: ['oklch(57% 0.08 142 / 0.13)', 'oklch(58% 0.06 198 / 0.1)', 'oklch(70% 0.05 70 / 0.08)'],
      line: 'oklch(76% 0.08 142 / 0.12)',
      particle: 'oklch(78% 0.1 142 / 0.2)',
      symbol: 'oklch(80% 0.07 142 / 0.13)',
    },
    particles: 18,
    leaves: 10,
    lineCount: 5,
    symbols: makeSymbols(['leaf', 'wind', 'path'], 18, 20),
  },
  'playful-pop': {
    key: 'playful-pop',
    family: 'detail',
    animation: 'playful',
    intensity: 'lively',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.016 70), oklch(96% 0.03 146), oklch(96% 0.028 25))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(84% 0.1 146 / 0.2), transparent 34%), radial-gradient(circle at 76% 72%, oklch(86% 0.1 30 / 0.16), transparent 34%)',
      halo: ['oklch(84% 0.1 146 / 0.2)', 'oklch(86% 0.1 30 / 0.16)', 'oklch(82% 0.08 250 / 0.12)'],
      line: 'oklch(60% 0.08 146 / 0.14)',
      particle: 'oklch(70% 0.15 35 / 0.3)',
      symbol: 'oklch(45% 0.07 146 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(14% 0.018 146), oklch(12% 0.019 250), oklch(14% 0.018 30))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(58% 0.1 146 / 0.12), transparent 34%), radial-gradient(circle at 76% 72%, oklch(68% 0.1 30 / 0.1), transparent 34%)',
      halo: ['oklch(58% 0.1 146 / 0.12)', 'oklch(68% 0.1 30 / 0.1)', 'oklch(58% 0.08 250 / 0.1)'],
      line: 'oklch(76% 0.08 146 / 0.1)',
      particle: 'oklch(80% 0.15 35 / 0.24)',
      symbol: 'oklch(80% 0.07 146 / 0.12)',
    },
    particles: 26,
    leaves: 2,
    lineCount: 3,
    symbols: makeSymbols(['+1', 'combo', 'tap', 'go'], 16, 18),
  },
  'magic-stars': {
    key: 'magic-stars',
    family: 'detail',
    animation: 'magic',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.014 82), oklch(96% 0.022 145), oklch(97% 0.016 285))',
      wash:
        'radial-gradient(circle at 25% 18%, oklch(86% 0.08 145 / 0.18), transparent 34%), radial-gradient(circle at 76% 70%, oklch(84% 0.07 285 / 0.12), transparent 34%)',
      halo: ['oklch(86% 0.08 145 / 0.18)', 'oklch(84% 0.07 285 / 0.12)', 'oklch(88% 0.06 60 / 0.12)'],
      line: 'oklch(62% 0.08 145 / 0.14)',
      particle: 'oklch(72% 0.14 70 / 0.32)',
      symbol: 'oklch(48% 0.07 145 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(13% 0.018 145), oklch(11% 0.019 285), oklch(14% 0.016 70))',
      wash:
        'radial-gradient(circle at 25% 18%, oklch(58% 0.08 145 / 0.12), transparent 34%), radial-gradient(circle at 76% 70%, oklch(58% 0.07 285 / 0.1), transparent 34%)',
      halo: ['oklch(58% 0.08 145 / 0.12)', 'oklch(58% 0.07 285 / 0.1)', 'oklch(74% 0.08 70 / 0.1)'],
      line: 'oklch(78% 0.08 145 / 0.1)',
      particle: 'oklch(82% 0.14 70 / 0.26)',
      symbol: 'oklch(82% 0.08 145 / 0.13)',
    },
    particles: 24,
    leaves: 2,
    lineCount: 3,
    symbols: makeSymbols(sharedSymbols.stars, 12, 16),
  },
  'tech-grid': {
    key: 'tech-grid',
    family: 'detail',
    animation: 'tech',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.01 102), oklch(96% 0.018 215))',
      wash: 'radial-gradient(circle at 58% 28%, oklch(82% 0.06 215 / 0.16), transparent 34%)',
      halo: ['oklch(82% 0.06 215 / 0.16)', 'oklch(86% 0.06 150 / 0.12)', 'oklch(88% 0.04 80 / 0.08)'],
      line: 'oklch(56% 0.06 215 / 0.17)',
      particle: 'oklch(60% 0.08 215 / 0.2)',
      symbol: 'oklch(43% 0.06 215 / 0.14)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(13% 0.016 215), oklch(12% 0.016 150))',
      wash: 'radial-gradient(circle at 58% 28%, oklch(58% 0.06 215 / 0.11), transparent 34%)',
      halo: ['oklch(58% 0.06 215 / 0.11)', 'oklch(58% 0.06 150 / 0.1)', 'oklch(70% 0.04 80 / 0.07)'],
      line: 'oklch(76% 0.06 215 / 0.11)',
      particle: 'oklch(78% 0.08 215 / 0.17)',
      symbol: 'oklch(80% 0.06 215 / 0.12)',
    },
    particles: 12,
    leaves: 0,
    lineCount: 9,
    symbols: makeSymbols(['net', 'api', 'ip', 'b64', 'url'], 14, 20),
  },
  'memory-cards': {
    key: 'memory-cards',
    family: 'detail',
    animation: 'cards',
    intensity: 'balanced',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.014 84), oklch(96% 0.026 150), oklch(97% 0.018 290))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(84% 0.08 150 / 0.18), transparent 34%), radial-gradient(circle at 76% 70%, oklch(84% 0.07 290 / 0.12), transparent 34%)',
      halo: ['oklch(84% 0.08 150 / 0.18)', 'oklch(84% 0.07 290 / 0.12)', 'oklch(88% 0.06 50 / 0.1)'],
      line: 'oklch(62% 0.08 150 / 0.14)',
      particle: 'oklch(68% 0.12 150 / 0.22)',
      symbol: 'oklch(48% 0.07 150 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(13% 0.018 150), oklch(12% 0.019 290), oklch(14% 0.016 50))',
      wash:
        'radial-gradient(circle at 22% 20%, oklch(58% 0.08 150 / 0.12), transparent 34%), radial-gradient(circle at 76% 70%, oklch(58% 0.07 290 / 0.1), transparent 34%)',
      halo: ['oklch(58% 0.08 150 / 0.12)', 'oklch(58% 0.07 290 / 0.1)', 'oklch(72% 0.07 50 / 0.08)'],
      line: 'oklch(78% 0.08 150 / 0.1)',
      particle: 'oklch(80% 0.12 150 / 0.18)',
      symbol: 'oklch(82% 0.08 150 / 0.12)',
    },
    particles: 16,
    leaves: 0,
    lineCount: 4,
    symbols: makeSymbols(['card', 'flip', 'pair', 'memo'], 18, 18),
  },
  'snake-path': {
    key: 'snake-path',
    family: 'detail',
    animation: 'path',
    intensity: 'balanced',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.014 88), oklch(95% 0.032 142))',
      wash: 'radial-gradient(circle at 32% 28%, oklch(84% 0.09 142 / 0.2), transparent 34%)',
      halo: ['oklch(84% 0.09 142 / 0.2)', 'oklch(86% 0.06 85 / 0.12)', 'oklch(84% 0.04 220 / 0.08)'],
      line: 'oklch(58% 0.09 142 / 0.18)',
      particle: 'oklch(64% 0.12 142 / 0.23)',
      symbol: 'oklch(43% 0.07 142 / 0.14)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(13% 0.018 142), oklch(11% 0.016 90))',
      wash: 'radial-gradient(circle at 32% 28%, oklch(58% 0.09 142 / 0.12), transparent 34%)',
      halo: ['oklch(58% 0.09 142 / 0.12)', 'oklch(70% 0.06 85 / 0.08)', 'oklch(58% 0.04 220 / 0.07)'],
      line: 'oklch(78% 0.09 142 / 0.12)',
      particle: 'oklch(80% 0.12 142 / 0.18)',
      symbol: 'oklch(82% 0.08 142 / 0.12)',
    },
    particles: 16,
    leaves: 4,
    lineCount: 5,
    symbols: makeSymbols(['path', 'turn', 'grow'], 20, 22),
  },
  'mines-grid': {
    key: 'mines-grid',
    family: 'detail',
    animation: 'grid',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.01 95), oklch(96% 0.014 205))',
      wash: 'radial-gradient(circle at 52% 28%, oklch(84% 0.04 205 / 0.14), transparent 34%)',
      halo: ['oklch(84% 0.04 205 / 0.14)', 'oklch(86% 0.05 142 / 0.1)', 'oklch(88% 0.04 80 / 0.08)'],
      line: 'oklch(55% 0.04 205 / 0.18)',
      particle: 'oklch(60% 0.06 205 / 0.16)',
      symbol: 'oklch(42% 0.05 205 / 0.12)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(13% 0.014 205), oklch(11% 0.014 145))',
      wash: 'radial-gradient(circle at 52% 28%, oklch(58% 0.05 205 / 0.1), transparent 34%)',
      halo: ['oklch(58% 0.05 205 / 0.1)', 'oklch(58% 0.05 142 / 0.08)', 'oklch(70% 0.04 80 / 0.07)'],
      line: 'oklch(76% 0.05 205 / 0.1)',
      particle: 'oklch(78% 0.07 205 / 0.14)',
      symbol: 'oklch(80% 0.06 205 / 0.1)',
    },
    particles: 10,
    leaves: 0,
    lineCount: 10,
    symbols: makeSymbols(['1', '2', '3', 'flag'], 16, 16),
  },
  'bubble-rise': {
    key: 'bubble-rise',
    family: 'detail',
    animation: 'bubble',
    intensity: 'lively',
    light: {
      base:
        'linear-gradient(135deg, oklch(98% 0.012 85), oklch(96% 0.028 190), oklch(97% 0.018 150))',
      wash:
        'radial-gradient(circle at 24% 72%, oklch(84% 0.08 190 / 0.18), transparent 34%), radial-gradient(circle at 76% 22%, oklch(84% 0.09 150 / 0.16), transparent 34%)',
      halo: ['oklch(84% 0.08 190 / 0.18)', 'oklch(84% 0.09 150 / 0.16)', 'oklch(86% 0.08 34 / 0.1)'],
      line: 'oklch(60% 0.08 190 / 0.14)',
      particle: 'oklch(70% 0.12 190 / 0.28)',
      symbol: 'oklch(46% 0.07 190 / 0.14)',
    },
    dark: {
      base:
        'linear-gradient(135deg, oklch(13% 0.018 190), oklch(12% 0.019 150), oklch(14% 0.016 34))',
      wash:
        'radial-gradient(circle at 24% 72%, oklch(58% 0.08 190 / 0.12), transparent 34%), radial-gradient(circle at 76% 22%, oklch(58% 0.09 150 / 0.1), transparent 34%)',
      halo: ['oklch(58% 0.08 190 / 0.12)', 'oklch(58% 0.09 150 / 0.1)', 'oklch(68% 0.08 34 / 0.08)'],
      line: 'oklch(78% 0.08 190 / 0.1)',
      particle: 'oklch(80% 0.12 190 / 0.22)',
      symbol: 'oklch(82% 0.08 190 / 0.12)',
    },
    particles: 28,
    leaves: 0,
    lineCount: 2,
    symbols: makeSymbols(['bubble', 'pop', '+3'], 18, 22),
  },
  'detail-calm': {
    key: 'detail-calm',
    family: 'detail',
    animation: 'calm',
    intensity: 'quiet',
    light: {
      base: 'linear-gradient(135deg, oklch(98% 0.012 90), oklch(96% 0.02 145))',
      wash: 'radial-gradient(circle at 50% 24%, oklch(85% 0.06 145 / 0.18), transparent 34%)',
      halo: ['oklch(85% 0.06 145 / 0.18)', 'oklch(88% 0.05 70 / 0.12)', 'oklch(84% 0.04 210 / 0.1)'],
      line: 'oklch(62% 0.06 145 / 0.12)',
      particle: 'oklch(64% 0.08 145 / 0.18)',
      symbol: 'oklch(46% 0.06 145 / 0.12)',
    },
    dark: {
      base: 'linear-gradient(135deg, oklch(14% 0.016 145), oklch(12% 0.017 210))',
      wash: 'radial-gradient(circle at 50% 24%, oklch(58% 0.06 145 / 0.11), transparent 34%)',
      halo: ['oklch(58% 0.06 145 / 0.11)', 'oklch(70% 0.05 70 / 0.08)', 'oklch(58% 0.04 210 / 0.08)'],
      line: 'oklch(76% 0.06 145 / 0.1)',
      particle: 'oklch(78% 0.08 145 / 0.15)',
      symbol: 'oklch(80% 0.06 145 / 0.1)',
    },
    particles: 12,
    leaves: 2,
    lineCount: 2,
    symbols: [],
  },
};

export const animationProfileAliases: Record<AnimationProfile, BackgroundProfileKey> = {
  calm: 'detail-calm',
  playful: 'playful-pop',
  focus: 'tools-flow',
  magic: 'magic-stars',
  tech: 'tech-grid',
  nature: 'nature-wind',
  document: 'document-pages',
  color: 'color-halo',
  clock: 'pomodoro-rings',
  grid: 'calculator-grid',
  bubble: 'bubble-rise',
  cards: 'memory-cards',
  path: 'snake-path',
};

export const toolBackgroundProfilesBySlug: Record<string, BackgroundProfileKey> = {
  calculator: 'calculator-grid',
  pomodoro: 'pomodoro-rings',
  converter: 'calculator-grid',
  password: 'tech-grid',
  qrcode: 'qr-dots',
  compass: 'nature-wind',
  scanner: 'document-pages',
  weather: 'nature-wind',
  'random-picker': 'playful-pop',
  'timer-stopwatch': 'pomodoro-rings',
  'word-counter': 'document-pages',
  'markdown-preview': 'document-pages',
  'json-formatter': 'json-scan',
  'base64-codec': 'tech-grid',
  'url-codec': 'tech-grid',
  'color-converter': 'color-halo',
  'date-calculator': 'pomodoro-rings',
  'text-diff': 'document-pages',
  'lorem-generator': 'document-pages',
  'ip-lookup': 'tech-grid',
  'tip-calculator': 'calculator-grid',
  'case-converter': 'document-pages',
  'random-number': 'playful-pop',
  'bmi-calculator': 'calculator-grid',
  'text-to-speech': 'magic-stars',
  'word-to-pdf': 'document-pages',
  'pdf-to-word': 'document-pages',
  'question-bank-importer': 'document-pages',
  bookkeeping: 'calculator-grid',
};

export const gameBackgroundProfilesBySlug: Record<string, BackgroundProfileKey> = {
  '2048': 'calculator-grid',
  memory: 'memory-cards',
  whackamole: 'playful-pop',
  colormerge: 'color-halo',
  forestwalk: 'nature-wind',
  snake: 'snake-path',
  'reaction-test': 'playful-pop',
  'number-puzzle': 'calculator-grid',
  'tic-tac-toe': 'mines-grid',
  'typing-challenge': 'document-pages',
  'color-stroop': 'color-halo',
  minesweeper: 'mines-grid',
  'flappy-bird': 'nature-wind',
  'brick-breaker': 'playful-pop',
  'simon-says': 'magic-stars',
  sudoku: 'calculator-grid',
  'typing-speed': 'document-pages',
  'word-search': 'document-pages',
  'bubble-pop': 'bubble-rise',
};

export function getSlugFromRoute(route: string): string {
  return route.split('/').filter(Boolean).pop() ?? '';
}

export function getBackgroundProfileForLocation(
  pathname: string,
  searchString = '',
): BackgroundProfile {
  const params = new URLSearchParams(searchString);
  const pathParts = pathname.split('/').filter(Boolean);
  const [section, slug] = pathParts;

  if (!section) return backgroundProfiles['home-garden'];

  if (section === 'tools') {
    if (slug && !isToolCategorySlug(slug)) {
      return backgroundProfiles[toolBackgroundProfilesBySlug[slug] ?? 'detail-calm'];
    }
    return backgroundProfiles['tools-flow'];
  }

  if (section === 'games') {
    if (slug && !isGameCategorySlug(slug)) {
      return backgroundProfiles[gameBackgroundProfilesBySlug[slug] ?? 'games-playful'];
    }
    return backgroundProfiles['games-playful'];
  }

  if (section === 'favorites') return backgroundProfiles['favorites-glow'];
  if (
    section === 'profile' ||
    section === 'admin' ||
    section === 'feedback' ||
    section === 'privacy' ||
    section === 'terms' ||
    section === 'about'
  ) {
    return backgroundProfiles['settings-minimal'];
  }
  if (section === 'leaderboard') return backgroundProfiles['games-playful'];
  if (section === 'offline') return backgroundProfiles['offline-cabin'];
  if (section === 'search') {
    const query = params.get('q')?.trim() ?? '';
    if (query && getSearchResultCount(query) === 0) return backgroundProfiles['empty-quiet'];
    return backgroundProfiles['search-focus'];
  }

  return backgroundProfiles['not-found-path'];
}

function isToolCategorySlug(slug: string) {
  return !tools.some((tool) => getSlugFromRoute(tool.route) === slug);
}

function isGameCategorySlug(slug: string) {
  return !games.some((game) => getSlugFromRoute(game.route) === slug);
}

function getSearchResultCount(query: string) {
  const q = query.toLowerCase();
  return [...tools, ...games].filter((item) =>
    [
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
      .includes(q),
  ).length;
}
