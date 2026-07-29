import { GAME_WIDTH, CLOUD_COUNT, DEATH_PARTICLE_COLORS } from './constants.ts';

export interface DeathParticle {
  id: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  duration: number;
}

export interface Cloud {
  x: number;
  y: number;
  width: number;
  speed: number;
  opacity: number;
}

export interface ScorePopup {
  id: number;
  x: number;
  y: number;
}

let particleIdCounter = 0;

/** Generate initial cloud set for parallax background */
export function createClouds(): Cloud[] {
  return Array.from({ length: CLOUD_COUNT }, (_, i) => ({
    x: (GAME_WIDTH / CLOUD_COUNT) * i + Math.random() * 60,
    y: 20 + Math.random() * 120,
    width: 40 + Math.random() * 50,
    speed: 0.3 + Math.random() * 0.4,
    opacity: 0.15 + Math.random() * 0.2,
  }));
}

/** Create a burst of death particles with randomized physics */
export function createDeathParticles(): DeathParticle[] {
  const count = 10 + Math.floor(Math.random() * 3); // 10-12 particles
  return Array.from({ length: count }, () => ({
    id: particleIdCounter++,
    vx: (Math.random() - 0.5) * 200,
    vy: -Math.random() * 150 - 30,
    color: DEATH_PARTICLE_COLORS[Math.floor(Math.random() * DEATH_PARTICLE_COLORS.length)],
    size: Math.random() * 6 + 2,
    duration: Math.random() * 0.5 + 0.3,
  }));
}

/** Update cloud positions with parallax scrolling; wraps off-screen clouds */
export function updateCloudPositions(clouds: Cloud[]): Cloud[] {
  return clouds.map((cloud) => {
    let newX = cloud.x - cloud.speed;
    if (newX + cloud.width < 0) {
      newX = GAME_WIDTH + Math.random() * 40;
    }
    return { ...cloud, x: newX };
  });
}
