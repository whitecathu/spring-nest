/**
 * Lightweight analytics utility for Spring Nest.
 *
 * Currently logs to console.debug in development.
 * Replace the implementation with Cloudflare Web Analytics,
 * Umami, GA, or Supabase when ready.
 *
 * All calls are fire-and-forget and never block the UI.
 */

import { supabase } from './supabase';

const isDev = import.meta.env.DEV;
const sessionKey = 'spring_nest_session_id';

function log(event: string, data?: Record<string, unknown>) {
  if (isDev) {
    console.debug(`[analytics] ${event}`, data ?? '');
  }
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('spring_nest_current_user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === 'string' && parsed.id !== 'guest' ? parsed.id : null;
  } catch {
    return null;
  }
}

function getSessionId() {
  try {
    const existing = localStorage.getItem(sessionKey);
    if (existing) return existing;
    const next = crypto.randomUUID();
    localStorage.setItem(sessionKey, next);
    return next;
  } catch {
    return null;
  }
}

function recordUsage(itemType: 'tool' | 'game', itemId: string) {
  if (!supabase) return;
  void (async () => {
    try {
      await supabase.from('tool_usage_events').insert({
        user_id: getCurrentUserId(),
        item_id: itemId,
        item_type: itemType,
        platform: 'web',
        session_id: getSessionId(),
        metadata: { source: 'web' },
      });
    } catch {
      // Analytics must never block the UI.
    }
  })();
}

export function trackPageView(path: string) {
  log('page_view', { path });
}

export function trackGameStart(slug: string) {
  log('game_start', { slug });
  recordUsage('game', slug);
}

export function trackToolOpen(slug: string) {
  log('tool_open', { slug });
  recordUsage('tool', slug);
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
