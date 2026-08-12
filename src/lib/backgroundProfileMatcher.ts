import { games } from '../data/games';
import { tools } from '../data/tools';
import { backgroundProfiles } from './backgroundProfileData';
import type {
  AnimationProfile,
  BackgroundProfile,
  BackgroundProfileKey,
} from './backgroundProfileTypes';

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
