import { ArrowLeft, Heart, RotateCcw, Trophy, Zap } from 'lucide-react';
import {
  BALL_SIZE,
  BRICK_GAP,
  BRICK_HEIGHT,
  BRICK_WIDTH,
  COLOR_CLASSES,
  COLOR_HEX,
  GAME_HEIGHT,
  GAME_WIDTH,
  PADDLE_HEIGHT,
  PADDLE_WIDTH,
  PADDLE_WIDTH_MOBILE,
  type BrickColor,
} from './constants';
import type { BrickBreakerGame } from './useBrickBreakerGame';

type Translate = (zh: string, en: string) => string;

interface BrickBreakerViewProps {
  game: BrickBreakerGame;
  onBack: () => void;
  t: Translate;
}

function ScoreHeader({ game, t }: { game: BrickBreakerGame; t: Translate }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-on-surface">{t('打砖块', 'Brick Breaker')}</h1>
          <p className="text-sm text-secondary">
            {t('用挡板弹球消灭砖块！', 'Bounce the ball to break bricks!')}
          </p>
        </div>
        <div className="flex gap-2">
          <div className="rounded-xl bg-surface-container-high px-3 py-2 text-center">
            <div className="text-xs font-medium text-secondary">{t('分数', 'Score')}</div>
            <div className="text-lg font-bold tabular-nums text-primary">{game.score}</div>
          </div>
          <div className="rounded-xl bg-surface-container-high px-3 py-2 text-center">
            <div className="flex items-center gap-1 text-xs font-medium text-secondary">
              <Trophy className="h-3 w-3" />
              {t('最佳', 'Best')}
            </div>
            <div className="text-lg font-bold tabular-nums text-tertiary">{game.bestScore}</div>
          </div>
        </div>
      </div>
      <div className="mx-auto mb-2 flex max-w-md items-center justify-between">
        <div
          className="flex items-center gap-1"
          aria-label={t(`剩余 ${game.lives} 条命`, `${game.lives} lives left`)}
        >
          {Array.from({ length: 3 }, (_, index) => (
            <Heart
              aria-hidden="true"
              key={index}
              className={`h-5 w-5 ${index < game.lives ? 'fill-current text-red-400' : 'text-gray-300'}`}
            />
          ))}
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <div className="text-sm font-semibold text-secondary">
            {t('关卡', 'Level')} {game.level}
          </div>
          {game.gameState === 'playing' && (
            <div className="h-1.5 w-20 overflow-hidden rounded-full bg-surface-container-high">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{
                  width: `${
                    game.bricks.length
                      ? (game.bricks.filter((brick) => !brick.alive).length / game.bricks.length) *
                        100
                      : 0
                  }%`,
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function GameOverlay({ game, t }: { game: BrickBreakerGame; t: Translate }) {
  if (game.gameState === 'playing') return null;

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40">
      {game.gameState === 'idle' && (
        <button
          type="button"
          className="min-h-[48px] cursor-pointer text-center"
          onClick={game.startGame}
          aria-label={t('开始打砖块', 'Start Brick Breaker')}
        >
          <span className="mb-3 block text-5xl" aria-hidden="true">
            🧱
          </span>
          <span className="mb-2 block text-xl font-bold text-white">
            {t('点击开始', 'Tap to Start')}
          </span>
          <span className="block text-sm text-white/80">
            {t('滑动或移动鼠标控制挡板', 'Swipe or move mouse to control paddle')}
          </span>
        </button>
      )}
      {(game.gameState === 'won' || game.gameState === 'lost') && (
        <div className="mx-4 rounded-2xl bg-white/90 p-6 text-center dark:bg-gray-800/90">
          <p className="mb-2 text-2xl font-bold text-on-surface">
            {game.gameState === 'won' ? t('通关！', 'Level Clear!') : t('游戏结束', 'Game Over')}
          </p>
          <p className="mb-3 text-5xl" aria-hidden="true">
            {game.gameState === 'won' ? '🎉' : '😵'}
          </p>
          <p className="mb-1 text-3xl font-black text-primary">{game.score}</p>
          <p className="mb-1 text-sm text-secondary">{t('得分', 'Score')}</p>
          {game.score > 0 && game.score === game.bestScore && (
            <p className="mb-3 text-sm text-green-500">🏆 {t('新纪录！', 'New Record!')}</p>
          )}
          <div className="flex justify-center gap-3">
            {game.gameState === 'won' && (
              <button
                type="button"
                onClick={game.nextLevel}
                className="min-h-[48px] rounded-full bg-primary px-6 py-3 font-semibold text-on-primary"
              >
                {t('下一关', 'Next Level')}
              </button>
            )}
            <button
              type="button"
              onClick={game.startGame}
              className={`min-h-[48px] rounded-full px-6 py-3 font-semibold ${
                game.gameState === 'lost'
                  ? 'bg-primary text-on-primary'
                  : 'bg-surface-container-high text-on-surface'
              }`}
            >
              {game.gameState === 'lost' ? t('再来一局', 'Play Again') : t('重新开始', 'Restart')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function GameBoard({ game, t }: { game: BrickBreakerGame; t: Translate }) {
  const paddleTop = GAME_HEIGHT - PADDLE_HEIGHT - 20;
  const paddleWidth = game.isMobile ? PADDLE_WIDTH_MOBILE : PADDLE_WIDTH;

  return (
    <div ref={game.containerRef} className="mb-4 flex justify-center">
      <div
        className="relative select-none overflow-hidden rounded-2xl touch-none"
        style={{
          width: GAME_WIDTH * game.gameScale,
          height: GAME_HEIGHT * game.gameScale,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          boxShadow:
            '0 0 20px rgba(99,102,241,0.2), 0 0 40px rgba(99,102,241,0.1), inset 0 0 20px rgba(99,102,241,0.05)',
          cursor: game.touchActive ? 'none' : 'default',
        }}
        onTouchMove={game.handleTouchMove}
        onTouchStart={game.handleTouchStart}
        onTouchEnd={game.handleTouchEnd}
        onMouseMove={game.handleMouseMove}
        onKeyDown={game.handleGameKeyDown}
        tabIndex={0}
        aria-label={t(
          '打砖块游戏区域，使用左右方向键移动挡板，回车或空格开始',
          'Brick Breaker game area, use left and right arrows to move the paddle, Enter or Space to start',
        )}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(rgba(99,102,241,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,0.04) 1px, transparent 1px)',
            backgroundSize: `${30 * game.gameScale}px ${30 * game.gameScale}px`,
          }}
        />
        {game.stars.map((star, index) => (
          <div
            key={`star-${index}`}
            className="pointer-events-none absolute rounded-full"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size * game.gameScale,
              height: star.size * game.gameScale,
              opacity: star.opacity,
              backgroundColor: index % 5 === 0 ? '#bfdbfe' : '#fff',
              animation: `bb-twinkle ${2 + star.animDelay * 0.8}s ease-in-out infinite`,
              animationDelay: `${star.animDelay}s`,
            }}
          />
        ))}
        {game.bricks.map((brick) => {
          if (!brick.alive) return null;
          const x = brick.col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP / 2;
          const y = brick.row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_GAP / 2 + 40;
          const hard = brick.maxHits > 1;
          return (
            <div
              key={`${brick.row}-${brick.col}`}
              className={`absolute rounded-md border ${COLOR_CLASSES[brick.color]}`}
              style={{
                left: x * game.gameScale,
                top: y * game.gameScale,
                width: BRICK_WIDTH * game.gameScale,
                height: BRICK_HEIGHT * game.gameScale,
                transform: brick.shaking ? 'translateX(2px)' : undefined,
                filter: hard && brick.hits < brick.maxHits ? 'brightness(0.75)' : undefined,
                boxShadow: hard ? 'inset 0 0 6px rgba(255,255,255,.2)' : undefined,
              }}
            />
          );
        })}
        {game.brickFlashes.map((flash) => (
          <div
            key={`flash-${flash.id}`}
            className="pointer-events-none absolute rounded-md bg-white"
            style={{
              left: flash.x * game.gameScale,
              top: flash.y * game.gameScale,
              width: BRICK_WIDTH * game.gameScale,
              height: BRICK_HEIGHT * game.gameScale,
              mixBlendMode: 'screen',
              boxShadow: `0 0 30px ${COLOR_HEX[flash.color]}, 0 0 60px ${COLOR_HEX[flash.color]}80`,
            }}
          />
        ))}
        {game.particles.map((particle) => {
          const color = COLOR_HEX[particle.color as BrickColor] ?? '#fff';
          return (
            <div
              key={particle.id}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: particle.x * game.gameScale,
                top: particle.y * game.gameScale,
                width: particle.size * game.gameScale,
                height: particle.size * game.gameScale,
                backgroundColor: color,
                boxShadow: `0 0 ${Math.max(4, particle.size * 0.8)}px ${color}`,
              }}
            />
          );
        })}
        {game.paddleMoving && (
          <div
            className="pointer-events-none absolute rounded-full"
            style={{
              left: (game.paddleX - 6) * game.gameScale,
              top: (paddleTop - 4) * game.gameScale,
              width: (paddleWidth + 12) * game.gameScale,
              height: (PADDLE_HEIGHT + 8) * game.gameScale,
              background: 'radial-gradient(ellipse, rgba(96,165,250,.3), transparent 70%)',
              filter: 'blur(4px)',
            }}
          />
        )}
        <div
          className="absolute rounded-full"
          style={{
            left: game.paddleX * game.gameScale,
            top: paddleTop * game.gameScale,
            width: paddleWidth * game.gameScale,
            height: PADDLE_HEIGHT * game.gameScale,
            background: game.paddleHitFlash
              ? 'linear-gradient(90deg, #93c5fd, #dbeafe, #93c5fd)'
              : 'linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6)',
            boxShadow: game.paddleHitFlash
              ? '0 0 30px rgba(96,165,250,.9)'
              : '0 0 12px rgba(59,130,246,.4)',
          }}
        />
        {game.trail.map((position, index) => {
          const ratio = game.trail.length > 1 ? index / (game.trail.length - 1) : 0;
          const size = BALL_SIZE * (0.15 + ratio * 0.85);
          const opacity = ratio * 0.55 + 0.02;
          return (
            <div
              key={`${index}-${position.x}-${position.y}`}
              className="pointer-events-none absolute rounded-full"
              style={{
                left: (position.x + BALL_SIZE / 2 - size / 2) * game.gameScale,
                top: (position.y + BALL_SIZE / 2 - size / 2) * game.gameScale,
                width: size * game.gameScale,
                height: size * game.gameScale,
                background: `rgba(147,197,253,${opacity})`,
              }}
            />
          );
        })}
        <div
          className="pointer-events-none absolute rounded-full"
          style={{
            left: game.ballPos.x * game.gameScale,
            top: game.ballPos.y * game.gameScale,
            width: BALL_SIZE * game.gameScale,
            height: BALL_SIZE * game.gameScale,
            background: 'radial-gradient(circle at 35% 35%, #fff, #e0e7ff)',
            boxShadow: '0 0 8px rgba(255,255,255,.5), 0 0 16px rgba(147,197,253,.3)',
            transform: `rotate(${game.ballRotation}deg) scale(${game.ballSquash ? 1.3 : 1}, ${game.ballSquash ? 0.7 : 1})`,
          }}
        />
        {game.collisionFlashes.map((flash) => (
          <div
            key={`collision-${flash.id}`}
            className="pointer-events-none absolute h-8 w-8 rounded-full"
            style={{
              left: (flash.x - 15) * game.gameScale,
              top: (flash.y - 15) * game.gameScale,
              background: 'radial-gradient(circle, rgba(255,255,255,.8), transparent 70%)',
            }}
          />
        ))}
        {game.scorePopups.map((popup) => (
          <div
            key={`score-${popup.id}`}
            className="pointer-events-none absolute w-10 text-center font-black"
            style={{
              left: (popup.x - 20) * game.gameScale,
              top: popup.y * game.gameScale,
              fontSize: 12 * game.gameScale,
              color: popup.color,
              textShadow: `0 0 8px ${popup.color}`,
            }}
          >
            {popup.text}
          </div>
        ))}
        {game.lifeLostFlash && (
          <div
            className="pointer-events-none absolute inset-0 z-50"
            style={{
              background: 'radial-gradient(ellipse, transparent 15%, rgba(239,68,68,0.65) 100%)',
            }}
          />
        )}
        {game.levelFlash && <div className="pointer-events-none absolute inset-0 z-50 bg-white" />}
        {game.comboDisplay >= 2 && (
          <div className="absolute right-2 top-2 z-30 rounded-full bg-orange-500 px-2.5 py-1.5 text-white">
            <div className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5" />
              <span className="text-sm font-black">{game.comboDisplay}x</span>
            </div>
            <div className="h-0.5 overflow-hidden rounded-full bg-white/30">
              <div
                key={`combo-${game.comboBarKey}`}
                className="h-full rounded-full bg-white"
                style={{ animation: 'combo-bar-shrink 1.2s linear forwards' }}
              />
            </div>
          </div>
        )}
        {game.levelBannerLevel !== null && (
          <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center">
            <p className="rounded-2xl bg-indigo-500/90 px-8 py-4 text-3xl font-black text-white">
              {t('关卡', 'Level')} {game.levelBannerLevel}
            </p>
          </div>
        )}
        {game.touchActive && game.gameState === 'playing' && (
          <div
            className="pointer-events-none absolute rounded-full border-2 border-blue-400/30"
            style={{
              left: (game.paddleX - 10) * game.gameScale,
              top: (paddleTop - 4) * game.gameScale,
              width: (paddleWidth + 20) * game.gameScale,
              height: (PADDLE_HEIGHT + 8) * game.gameScale,
            }}
          />
        )}
        <GameOverlay game={game} t={t} />
      </div>
    </div>
  );
}

export function BrickBreakerView({ game, onBack, t }: BrickBreakerViewProps) {
  return (
    <div className="mx-auto w-full max-w-lg flex-grow px-4 py-8">
      <button
        type="button"
        onClick={onBack}
        className="-ml-2 mb-4 flex min-h-[48px] items-center gap-2 px-2 text-sm font-semibold text-secondary transition-colors hover:text-primary"
      >
        <ArrowLeft className="h-5 w-5" />
        {t('返回游戏列表', 'Back to Games')}
      </button>
      <ScoreHeader game={game} t={t} />
      <GameBoard game={game} t={t} />
      {game.gameState === 'playing' && (
        <div className="flex justify-center gap-4">
          <button
            type="button"
            onClick={game.startGame}
            className="flex min-h-[48px] items-center gap-2 rounded-full bg-surface-container-high px-6 py-3 font-semibold text-on-surface transition-all hover:bg-surface-variant"
          >
            <RotateCcw className="h-5 w-5" />
            {t('重新开始', 'Restart')}
          </button>
        </div>
      )}
      <p className="mt-4 text-center text-xs text-secondary/50">
        {t(
          '在游戏区域内滑动或移动鼠标来控制挡板',
          'Swipe or move mouse within the game area to control the paddle',
        )}
      </p>
    </div>
  );
}
