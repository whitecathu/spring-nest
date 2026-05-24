import { memo, useRef, useCallback, type ReactNode, type PointerEvent } from 'react';
import { useReducedMotion } from '../../lib/animations';

interface GlareHoverProps {
  children?: ReactNode;
  className?: string;
  glareColor?: string;
  glareSize?: number;
  transitionDuration?: number;
  borderRadius?: number;
}

function GlareHoverInner({
  children,
  className = '',
  glareColor = 'rgba(255, 255, 255, 0.15)',
  glareSize = 30,
  transitionDuration = 220,
  borderRadius,
}: GlareHoverProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useReducedMotion();

  const handlePointerMove = useCallback(
    (e: PointerEvent<HTMLDivElement>) => {
      if (reducedMotion) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--glare-x', `${x}%`);
      el.style.setProperty('--glare-y', `${y}%`);
      el.style.setProperty('--glare-opacity', '1');
    },
    [reducedMotion],
  );

  const handlePointerLeave = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    el.style.setProperty('--glare-opacity', '0');
  }, []);

  if (reducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      ref={containerRef}
      className={`glare-hover ${className}`}
      style={{
        '--glare-color': glareColor,
        '--glare-size': `${glareSize}%`,
        '--glare-duration': `${transitionDuration}ms`,
        ...(borderRadius !== undefined ? { borderRadius: `${borderRadius}px` } : {}),
      } as React.CSSProperties}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {children}
    </div>
  );
}

export default memo(GlareHoverInner);
