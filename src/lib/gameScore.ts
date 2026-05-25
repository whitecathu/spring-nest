/**
 * Shared game score persistence utilities.
 *
 * Eliminates duplicated loadBestScore/saveBestScore functions
 * across individual game files.
 */

const PREFIX = 'spring_nest_';

function storageKey(gameSlug: string, suffix = 'best'): string {
  return `${PREFIX}${gameSlug}_${suffix}`;
}

/** Load best score for a game from localStorage. */
export function loadBestScore(gameSlug: string): number {
  try {
    return JSON.parse(localStorage.getItem(storageKey(gameSlug)) || '0') as number;
  } catch {
    return 0;
  }
}

/** Save best score for a game to localStorage (only if higher). */
export function saveBestScore(gameSlug: string, score: number): void {
  try {
    const current = loadBestScore(gameSlug);
    if (score > current) {
      localStorage.setItem(storageKey(gameSlug), JSON.stringify(score));
    }
  } catch {
    // localStorage may be unavailable
  }
}

/** Load a generic numeric value from localStorage. */
export function loadGameValue(key: string): number {
  try {
    return JSON.parse(localStorage.getItem(key) || '0') as number;
  } catch {
    return 0;
  }
}

/** Save a generic numeric value to localStorage. */
export function saveGameValue(key: string, value: number): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage may be unavailable
  }
}
