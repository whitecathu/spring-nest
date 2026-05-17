import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  useTransform,
  type HTMLMotionProps,
} from 'motion/react';
import { useRef, type MouseEvent, type ReactNode } from 'react';
import {
  getSurfaceMotionPreset,
  motionListVariants,
  presenceBlockVariants,
  springMagnetic,
  springSnappy,
  useReducedMotion,
  type SurfaceMotionTone,
} from '../lib/animations';

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

type TiltGlareCardProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
  depth?: number;
  intensity?: number;
};

export function TiltGlareCard({
  children,
  className = '',
  depth = 18,
  intensity = 9,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  style,
  whileHover,
  whileTap,
  ...props
}: TiltGlareCardProps) {
  const reducedMotion = useReducedMotion();
  const rectRef = useRef<DOMRect | null>(null);
  const glareX = useMotionValue(50);
  const glareY = useMotionValue(50);
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const glareOpacity = useMotionValue(0);

  const rotateX = useSpring(tiltX, springMagnetic);
  const rotateY = useSpring(tiltY, springMagnetic);
  const softGlareX = useSpring(glareX, springMagnetic);
  const softGlareY = useSpring(glareY, springMagnetic);
  const softGlareOpacity = useSpring(glareOpacity, springMagnetic);
  const lift = useTransform(softGlareOpacity, [0, 1], [0, depth]);
  const glareBackground = useMotionTemplate`radial-gradient(circle at ${softGlareX}% ${softGlareY}%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.16) 26%, transparent 62%)`;

  const handleMouseEnter = (event: MouseEvent<HTMLDivElement>) => {
    onMouseEnter?.(event);
    if (reducedMotion) return;
    rectRef.current = event.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    onMouseMove?.(event);
    if (reducedMotion) return;

    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const px = ((event.clientX - rect.left) / rect.width) * 100;
    const py = ((event.clientY - rect.top) / rect.height) * 100;

    glareX.set(px);
    glareY.set(py);
    tiltX.set((50 - py) * (intensity / 50));
    tiltY.set((px - 50) * (intensity / 50));
    glareOpacity.set(1);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLDivElement>) => {
    onMouseLeave?.(event);
    rectRef.current = null;
    tiltX.set(0);
    tiltY.set(0);
    glareX.set(50);
    glareY.set(50);
    glareOpacity.set(0);
  };

  return (
    <motion.div
      {...props}
      className={`tilt-card-shell ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={reducedMotion ? undefined : whileHover}
      whileTap={reducedMotion ? undefined : whileTap}
      style={{
        ...style,
        rotateX: reducedMotion ? 0 : rotateX,
        rotateY: reducedMotion ? 0 : rotateY,
        transformStyle: 'preserve-3d',
      }}
    >
      {!reducedMotion && (
        <motion.div
          aria-hidden="true"
          className="tilt-card-glare"
          style={{ background: glareBackground, opacity: softGlareOpacity }}
        />
      )}
      <motion.div className="tilt-card-content" style={{ z: reducedMotion ? 0 : lift }}>
        {children}
      </motion.div>
    </motion.div>
  );
}

type MagneticButtonProps = HTMLMotionProps<'button'> & {
  children: ReactNode;
  magneticStrength?: number;
};

export function MagneticButton({
  children,
  magneticStrength = 0.28,
  onMouseEnter,
  onMouseMove,
  onMouseLeave,
  style,
  whileHover,
  whileTap,
  ...props
}: MagneticButtonProps) {
  const reducedMotion = useReducedMotion();
  const rectRef = useRef<DOMRect | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, springMagnetic);
  const springY = useSpring(y, springMagnetic);

  const handleMouseEnter = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseEnter?.(event);
    if (reducedMotion) return;
    rectRef.current = event.currentTarget.getBoundingClientRect();
  };

  const handleMouseMove = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseMove?.(event);
    if (reducedMotion) return;

    const rect = rectRef.current ?? event.currentTarget.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((event.clientX - centerX) * magneticStrength);
    y.set((event.clientY - centerY) * magneticStrength);
  };

  const handleMouseLeave = (event: MouseEvent<HTMLButtonElement>) => {
    onMouseLeave?.(event);
    rectRef.current = null;
    x.set(0);
    y.set(0);
  };

  return (
    <motion.button
      {...props}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={reducedMotion ? undefined : whileHover}
      whileTap={reducedMotion ? undefined : (whileTap ?? { scale: 0.94 })}
      style={{ ...style, x: reducedMotion ? 0 : springX, y: reducedMotion ? 0 : springY }}
    >
      {children}
    </motion.button>
  );
}

type MotionButtonTone = 'primary' | 'secondary' | 'icon' | 'ghost';

type MotionButtonProps = HTMLMotionProps<'button'> & {
  tone?: MotionButtonTone;
  magnetic?: boolean;
  children: ReactNode;
};

export function MotionButton({
  tone = 'secondary',
  magnetic = false,
  className = '',
  children,
  whileHover,
  whileTap,
  transition,
  ...props
}: MotionButtonProps) {
  const reducedMotion = useReducedMotion();
  const motionClass = cx('motion-button', `motion-button-${tone}`, className);
  const hover = reducedMotion ? undefined : (whileHover ?? { y: -1, scale: 1.02 });
  const tap = reducedMotion ? undefined : (whileTap ?? { scale: 0.96 });
  const motionTransition = transition ?? springSnappy;

  if (magnetic) {
    return (
      <MagneticButton
        {...props}
        className={motionClass}
        whileHover={hover}
        whileTap={tap}
        transition={motionTransition}
      >
        {children}
      </MagneticButton>
    );
  }

  return (
    <motion.button
      {...props}
      className={motionClass}
      whileHover={hover}
      whileTap={tap}
      transition={motionTransition}
    >
      {children}
    </motion.button>
  );
}

type MotionCardProps = HTMLMotionProps<'article'> & {
  tone?: SurfaceMotionTone;
  interactive?: boolean;
  children: ReactNode;
};

export function MotionCard({
  tone = 'tool',
  interactive = true,
  className = '',
  children,
  whileHover,
  whileTap,
  transition,
  style,
  ...props
}: MotionCardProps) {
  const reducedMotion = useReducedMotion();
  const preset = getSurfaceMotionPreset(tone);

  return (
    <motion.article
      {...props}
      className={cx('motion-card', `motion-card-${tone}`, className)}
      whileHover={reducedMotion || !interactive ? undefined : (whileHover ?? preset.hover)}
      whileTap={reducedMotion || !interactive ? undefined : (whileTap ?? preset.tap)}
      transition={transition ?? preset.transition}
      style={{
        transformStyle: 'preserve-3d',
        willChange: reducedMotion || !interactive ? 'auto' : 'transform',
        ...style,
      }}
    >
      {children}
    </motion.article>
  );
}

type MotionPanelProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function MotionPanel({ className = '', children, ...props }: MotionPanelProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-panel', className)}
      variants={reducedMotion ? undefined : presenceBlockVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}

type MotionListProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function MotionList({ className = '', children, ...props }: MotionListProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-list', className)}
      variants={reducedMotion ? undefined : motionListVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}

type AnimatedPresenceBlockProps = HTMLMotionProps<'div'> & {
  children: ReactNode;
};

export function AnimatedPresenceBlock({
  className = '',
  children,
  ...props
}: AnimatedPresenceBlockProps) {
  const reducedMotion = useReducedMotion();

  return (
    <motion.div
      {...props}
      className={cx('motion-presence-block', className)}
      variants={reducedMotion ? undefined : presenceBlockVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      exit={reducedMotion ? undefined : 'exit'}
    >
      {children}
    </motion.div>
  );
}
