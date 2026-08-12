import { COLOR_POINTS, GAME_WIDTH, type Brick } from './constants';

export interface Vector {
  x: number;
  y: number;
}

export function clampPaddlePosition(position: number, paddleWidth: number): number {
  return Math.max(0, Math.min(GAME_WIDTH - paddleWidth, position));
}

export function enforceMinimumVerticalVelocity(velocity: Vector, minimumRatio: number): Vector {
  const speed = Math.hypot(velocity.x, velocity.y);
  if (speed === 0 || Math.abs(velocity.y) >= speed * minimumRatio) {
    return velocity;
  }

  const y = Math.sign(velocity.y || 1) * speed * minimumRatio;
  const x = Math.sign(velocity.x || 1) * Math.sqrt(speed ** 2 - y ** 2);
  return { x, y };
}

interface PaddleBounceInput {
  ballCenterX: number;
  paddleX: number;
  paddleWidth: number;
  velocity: Vector;
  random?: () => number;
}

export function calculatePaddleBounce({
  ballCenterX,
  paddleX,
  paddleWidth,
  velocity,
  random = Math.random,
}: PaddleBounceInput): Vector {
  const hitPosition = (ballCenterX - paddleX) / paddleWidth;
  const normalizedHit = hitPosition - 0.5;
  const curvedHit =
    normalizedHit * 0.7 + Math.sign(normalizedHit) * normalizedHit * normalizedHit * 0.6;
  let bounceAngle = -Math.PI / 2 + curvedHit * 1.5;

  bounceAngle += (random() - 0.5) * ((Math.PI / 180) * 10);

  const minimumAngle = 0.3;
  if (bounceAngle > -minimumAngle) bounceAngle = -minimumAngle;
  if (bounceAngle < -Math.PI + minimumAngle) bounceAngle = -Math.PI + minimumAngle;
  if (bounceAngle > -Math.PI / 2 - 0.15 && bounceAngle < -Math.PI / 2 + 0.15) {
    bounceAngle = bounceAngle < -Math.PI / 2 ? -Math.PI / 2 - 0.3 : -Math.PI / 2 + 0.3;
  }

  let speed = Math.hypot(velocity.x, velocity.y);
  if (Math.abs(normalizedHit) < 0.15) speed *= 1.08;

  return enforceMinimumVerticalVelocity(
    {
      x: speed * Math.cos(bounceAngle),
      y: speed * Math.sin(bounceAngle),
    },
    0.3,
  );
}

export function hitBrick(brick: Brick): { destroyed: boolean; points: number } {
  brick.hits -= 1;
  if (brick.hits > 0) return { destroyed: false, points: 0 };

  brick.alive = false;
  return { destroyed: true, points: COLOR_POINTS[brick.color] };
}
