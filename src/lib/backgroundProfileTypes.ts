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
