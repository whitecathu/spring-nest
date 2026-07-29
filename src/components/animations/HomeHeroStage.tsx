import { memo } from 'react';
import { Gamepad2, Leaf, Search, Wrench } from 'lucide-react';
import { useReducedMotion } from '../../lib/animations';
import { useForestRuntimeOptional } from '../../lib/forest/ForestRuntime';
import { tierAllowsVideo } from '../../lib/forest/forestTier';

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
  const forest = useForestRuntimeOptional();
  const forestVideo =
    !!forest && tierAllowsVideo(forest.tier) && !reducedMotion;

  return (
    <div
      aria-hidden="true"
      className={cx('home-hero-stage', className)}
      data-games-count={gamesCount}
      data-reduced-motion={reducedMotion ? 'true' : 'false'}
      data-forest-video={forestVideo ? 'true' : 'false'}
      data-testid="home-hero-stage"
      data-tools-count={toolsCount}
    >
      {!forestVideo && (
        <>
          <span className="home-hero-stage__orb home-hero-stage__orb--primary" />
          <span className="home-hero-stage__orb home-hero-stage__orb--warm" />
          <div className="home-hero-stage__grid" />

          <svg className="home-hero-stage__flow" viewBox="0 0 100 100" preserveAspectRatio="none">
            {[0, 1, 2].map((line) => (
              <path
                key={line}
                d={`M -8 ${34 + line * 13} C 22 ${20 + line * 14}, 58 ${
                  55 - line * 9
                }, 108 ${32 + line * 12}`}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="0.28"
                style={reducedMotion ? { opacity: 0.12 } : undefined}
              />
            ))}
          </svg>

          {panels.map(({ id, Icon, className: panelClassName, bars }) => (
            <div key={id} className={cx('home-hero-stage__panel', panelClassName)}>
              <div className="home-hero-stage__panel-float">
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
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default memo(HomeHeroStageInner);
