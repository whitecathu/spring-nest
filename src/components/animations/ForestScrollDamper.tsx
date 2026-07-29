import { useEffect, useRef, type RefObject } from 'react';

export type ForestScrollDamperProps = {
  scrollerRef: RefObject<HTMLElement | null>;
  enabled: boolean;
  /** Higher = snappier chase of target scroll. Typical ~1.0–1.4. */
  damping: number;
};

/**
 * Side-effect component: damps wheel scrolling on an overflow scroller.
 * Renders nothing.
 */
export default function ForestScrollDamper({
  scrollerRef,
  enabled,
  damping,
}: ForestScrollDamperProps) {
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const rafRef = useRef(0);
  const runningRef = useRef(false);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !enabled) return;

    targetRef.current = el.scrollTop;
    currentRef.current = el.scrollTop;

    const stopLoop = () => {
      runningRef.current = false;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = 0;
    };

    const tick = () => {
      const node = scrollerRef.current;
      if (!node) {
        stopLoop();
        return;
      }
      const max = node.scrollHeight - node.clientHeight;
      targetRef.current = Math.max(0, Math.min(max, targetRef.current));
      const alpha = 1 - Math.exp(-0.016 * Math.max(0.2, damping) * 10);
      currentRef.current += (targetRef.current - currentRef.current) * alpha;
      node.scrollTop = currentRef.current;

      if (Math.abs(targetRef.current - currentRef.current) > 0.35) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        currentRef.current = targetRef.current;
        node.scrollTop = targetRef.current;
        stopLoop();
      }
    };

    const startLoop = () => {
      if (runningRef.current) return;
      runningRef.current = true;
      rafRef.current = requestAnimationFrame(tick);
    };

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) return; // allow pinch-zoom
      e.preventDefault();
      const node = scrollerRef.current;
      if (!node) return;
      // Keep target synced if external scroll changed
      if (Math.abs(node.scrollTop - currentRef.current) > 2) {
        currentRef.current = node.scrollTop;
        targetRef.current = node.scrollTop;
      }
      targetRef.current += e.deltaY;
      startLoop();
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', onWheel);
      stopLoop();
    };
  }, [scrollerRef, enabled, damping]);

  return null;
}
