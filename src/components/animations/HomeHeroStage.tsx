import { memo } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Leaf, Search, Wrench } from 'lucide-react';
import {
  getAmbientFloatTransition,
  heroPanelVariants,
  heroStageVariants,
  softEase,
  useReducedMotion,
} from '../../lib/animations';

type HomeHeroStageProps = {
  toolsCount: number;
  gamesCount: number;
  reducedMotion?: boolean;
  className?: string;
};

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

const panels = [
  {
    id: 'tools',
    Icon: Wrench,
    className: 'home-hero-stage__panel--tools',
    bars: [68, 46, 56],
  },
  {
    id: 'games',
    Icon: Gamepad2,
    className: 'home-hero-stage__panel--games',
    bars: [50, 72, 42],
  },
  {
    id: 'search',
    Icon: Search,
    className: 'home-hero-stage__panel--search',
    bars: [74, 58, 38],
  },
] as const;

function HomeHeroStageInner({
  toolsCount,
  gamesCount,
  reducedMotion: reducedMotionOverride,
  className = '',
}: HomeHeroStageProps) {
  const prefersReducedMotion = useReducedMotion();
  const reducedMotion = reducedMotionOverride ?? prefersReducedMotion;

  return (
    <motion.div
      aria-hidden="true"
      className={cx('home-hero-stage', className)}
      data-games-count={gamesCount}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-testid="home-hero-stage"
      data-tools-count={toolsCount}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      variants={reducedMotion ? undefined : heroStageVariants}
    >
      <motion.span
        className="home-hero-stage__orb home-hero-stage__orb--primary"
        animate={
          reducedMotion ? undefined : { x: [0, 18, 0], y: [0, -12, 0], opacity: [0.26, 0.42, 0.26] }
        }
        transition={reducedMotion ? undefined : getAmbientFloatTransition(18)}
      />
      <motion.span
        className="home-hero-stage__orb home-hero-stage__orb--warm"
        animate={
          reducedMotion ? undefined : { x: [0, -16, 0], y: [0, 10, 0], opacity: [0.18, 0.34, 0.18] }
        }
        transition={reducedMotion ? undefined : getAmbientFloatTransition(22, 0.4)}
      />
      <div className="home-hero-stage__grid" />

      <svg className="home-hero-stage__flow" viewBox="0 0 100 100" preserveAspectRatio="none">
        {[0, 1, 2].map((line) => (
          <motion.path
            key={line}
            d={`M -8 ${34 + line * 13} C 22 ${20 + line * 14}, 58 ${
              55 - line * 9
            }, 108 ${32 + line * 12}`}
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="0.28"
            initial={reducedMotion ? false : { pathLength: 0.18, opacity: 0 }}
            animate={
              reducedMotion
                ? undefined
                : { pathLength: [0.18, 1, 0.58], opacity: [0.08, 0.22, 0.08] }
            }
            style={reducedMotion ? { opacity: 0.12 } : undefined}
            transition={
              reducedMotion
                ? undefined
                : {
                    duration: 12 + line * 2,
                    repeat: Infinity,
                    delay: line * 0.35,
                    ease: softEase,
                  }
            }
          />
        ))}
      </svg>

      {panels.map(({ id, Icon, className: panelClassName, bars }, index) => (
        <motion.div
          key={id}
          className={cx('home-hero-stage__panel', panelClassName)}
          variants={reducedMotion ? undefined : heroPanelVariants}
        >
          <motion.div
            className="home-hero-stage__panel-float"
            animate={
              reducedMotion
                ? undefined
                : {
                    y: [0, index === 1 ? -7 : 7, 0],
                    rotate: [0, index === 1 ? 1.4 : -1.2, 0],
                  }
            }
            transition={
              reducedMotion ? undefined : getAmbientFloatTransition(8 + index * 1.4, index * 0.2)
            }
          >
            <span className="home-hero-stage__panel-icon">
              <Icon className="h-4 w-4" />
            </span>
            <span className="home-hero-stage__panel-lines">
              {bars.map((width, barIndex) => (
                <span
                  key={`${id}-${barIndex}`}
                  className="home-hero-stage__panel-bar"
                  style={{ width: `${width}%` }}
                />
              ))}
            </span>
            <Leaf className="home-hero-stage__panel-leaf h-3.5 w-3.5" />
          </motion.div>
        </motion.div>
      ))}
    </motion.div>
  );
}

export default memo(HomeHeroStageInner);
