// Game dimensions
export const GAME_WIDTH = 400;
export const GAME_HEIGHT = 600;

// Bird configuration
export const BIRD_SIZE = 32;
export const BIRD_X = 80;
export const GRAVITY = 0.38;
export const JUMP_FORCE = -7.5;

// Pipe configuration
export const PIPE_WIDTH = 56;
export const PIPE_GAP = 170;
export const PIPE_SPEED = 2.2;
export const PIPE_SPAWN_INTERVAL = 1800; // ms

// Environment
export const GROUND_HEIGHT = 20;
export const CLOUD_COUNT = 5;

// Grass tufts data for ground decoration
export const GRASS_TUFTS = Array.from({ length: 20 }, (_, i) => ({
  x: i * 20 + Math.sin(i * 1.7) * 6,
  height: 4 + Math.sin(i * 2.3) * 2,
  shade: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#16a34a' : '#15803d',
}));

// Death particle color palette
export const DEATH_PARTICLE_COLORS = [
  '#fbbf24',
  '#f59e0b',
  '#ef4444',
  '#fb923c',
  '#f87171',
  '#ffffff',
  '#ff6b6b',
  '#ffd93d',
  '#ff8a5c',
  '#a855f7',
];

// Game interfaces
export interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

// CSS keyframe animations for all game elements
export const FLAPPY_BIRD_ANIMATIONS = `
  @keyframes flappy-shake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-4px); }
    40% { transform: translateX(4px); }
    60% { transform: translateX(-3px); }
    80% { transform: translateX(3px); }
  }
  @keyframes particle-fly {
    from { transform: translate(0, 0); opacity: 1; }
    to { transform: translate(var(--px), var(--py)); opacity: 0; }
  }
  @keyframes bird-flap {
    0%, 100% { transform: translateY(0px) scaleY(1); }
    25% { transform: translateY(-2px) scaleY(0.92); }
    50% { transform: translateY(0px) scaleY(1.04); }
    75% { transform: translateY(1px) scaleY(0.96); }
  }
  @keyframes bird-breathing {
    0%, 100% { filter: drop-shadow(0 0 4px rgba(251, 191, 36, 0.3)); }
    50% { filter: drop-shadow(0 0 10px rgba(251, 191, 36, 0.6)); }
  }
  @keyframes bird-shadow {
    0%, 100% { transform: scaleX(1); opacity: 0.2; }
    50% { transform: scaleX(0.8); opacity: 0.12; }
  }
  @keyframes jump-squash {
    0% { transform: scaleY(1) scaleX(1); }
    30% { transform: scaleY(0.78) scaleX(1.12); }
    60% { transform: scaleY(1.08) scaleX(0.95); }
    100% { transform: scaleY(1) scaleX(1); }
  }
  @keyframes pulse-glow {
    0%, 100% { text-shadow: 0 0 8px rgba(255,255,255,0.4), 0 0 16px rgba(255,255,255,0.1); }
    50% { text-shadow: 0 0 16px rgba(255,255,255,0.8), 0 0 32px rgba(255,255,255,0.3); }
  }
  @keyframes milestone-pop {
    0% { transform: scale(0.5) translateY(0); opacity: 0; }
    30% { transform: scale(1.3) translateY(-8px); opacity: 1; }
    70% { transform: scale(1) translateY(-16px); opacity: 1; }
    100% { transform: scale(0.9) translateY(-30px); opacity: 0; }
  }
  @keyframes score-breakdown {
    from { transform: translateX(-20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes tap-pulse {
    0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.4); }
    100% { box-shadow: 0 0 0 20px rgba(255,255,255,0); }
  }
  @keyframes score-popup {
    0% { transform: translateY(0) scale(0.5); opacity: 0; }
    20% { transform: translateY(-8px) scale(1.2); opacity: 1; }
    60% { transform: translateY(-20px) scale(1); opacity: 1; }
    100% { transform: translateY(-40px) scale(0.8); opacity: 0; }
  }
  @keyframes countdown-pop {
    0% { transform: scale(0.3); opacity: 0; }
    40% { transform: scale(1.3); opacity: 1; }
    70% { transform: scale(0.95); opacity: 1; }
    100% { transform: scale(1); opacity: 1; }
  }
  @keyframes countdown-fade {
    0% { opacity: 1; }
    80% { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes ready-bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-12px); }
  }
`;
