const KEY = 'spring_nest_forest_splash';
const TTL_MS = 7 * 24 * 60 * 60 * 1000;

function parseSeenAt(raw: string): number | null {
  const asNum = Number(raw);
  if (Number.isFinite(asNum)) return asNum;
  try {
    const parsed = JSON.parse(raw) as { seenAt?: unknown };
    if (typeof parsed?.seenAt === 'number' && Number.isFinite(parsed.seenAt)) {
      return parsed.seenAt;
    }
  } catch {
    // ignore malformed payloads
  }
  return null;
}

/** True when the forest splash should play (never seen, or last seen > 7 days ago). */
export function shouldShowForestSplash(): boolean {
  try {
    if (typeof localStorage === 'undefined') return true;
    const raw = localStorage.getItem(KEY);
    if (!raw) return true;
    const seenAt = parseSeenAt(raw);
    if (seenAt === null) return true;
    return Date.now() - seenAt > TTL_MS;
  } catch {
    return true;
  }
}

/** Persist that the forest splash was shown now. */
export function markForestSplashSeen(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(KEY, String(Date.now()));
  } catch {
    // ignore quota / private-mode failures
  }
}

/** Clear splash memory so footer "replay splash" can force a re-show. */
export function clearForestSplashMemory(): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export { KEY as FOREST_SPLASH_KEY, TTL_MS as FOREST_SPLASH_TTL_MS };
