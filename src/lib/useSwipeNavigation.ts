import { useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NAV_ORDER = ['/', '/games', '/tools', '/leaderboard', '/about'];

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const swiping = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    // Skip if target is inside an interactive element or a horizontally-scrollable container
    const target = e.target as HTMLElement;
    if (
      target.closest('input, textarea, select, button, a, [role="dialog"], .no-swipe')
    )
      return;

    // Skip if ancestor has horizontal overflow (e.g. card carousels)
    const scrollable = target.closest('[data-swipe-ignore]');
    if (scrollable) return;

    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
    startTime.current = Date.now();
    swiping.current = true;
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (!swiping.current) return;
      swiping.current = false;

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - startX.current;
      const deltaY = endY - startY.current;
      const elapsed = Date.now() - startTime.current;

      // Only trigger on horizontal swipes: min 60px, max 500ms, horizontal > vertical
      if (
        Math.abs(deltaX) < 60 ||
        Math.abs(deltaY) > Math.abs(deltaX) ||
        elapsed > 500
      )
        return;

      const currentPath = location.pathname === '/' ? '/' : location.pathname;
      const idx = NAV_ORDER.indexOf(currentPath);
      if (idx === -1) return;

      if (deltaX > 0 && idx > 0) {
        navigate(NAV_ORDER[idx - 1]);
      } else if (deltaX < 0 && idx < NAV_ORDER.length - 1) {
        navigate(NAV_ORDER[idx + 1]);
      }
    },
    [navigate, location.pathname],
  );

  return { onTouchStart, onTouchEnd };
}
