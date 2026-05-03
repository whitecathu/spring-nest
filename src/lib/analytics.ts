/**
 * Lightweight analytics utility for Spring Nest.
 *
 * Currently logs to console.debug in development.
 * Replace the implementation with Cloudflare Web Analytics,
 * Umami, GA, or Supabase when ready.
 *
 * All calls are fire-and-forget and never block the UI.
 */

const isDev = import.meta.env.DEV;

function log(event: string, data?: Record<string, unknown>) {
  if (isDev) {
    console.debug(`[analytics] ${event}`, data ?? '');
  }
}

export function trackPageView(path: string) {
  log('page_view', { path });
}

export function trackGameStart(slug: string) {
  log('game_start', { slug });
}

export function trackToolOpen(slug: string) {
  log('tool_open', { slug });
}

export function trackSearch(keyword: string) {
  log('search', { keyword });
}

export function trackFavorite(slug: string) {
  log('favorite', { slug });
}

export function trackError(error: string, context?: string) {
  log('error', { error, context });
}
