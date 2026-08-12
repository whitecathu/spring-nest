export type WindSample = {
  x: number;
  y: number;
  strength: number;
};

export type WindField = {
  update: (dt: number, scrollVy: number) => WindSample;
  pulseStrong: (durationMs?: number) => void;
  pulseGust: (dirX: number, dirY: number) => void;
  reset: () => void;
};

type WindFieldOptions = {
  /** Enable mild sinusoidal turbulence (default true). */
  turb?: boolean;
  /** Base wind strength. */
  baseStrength?: number;
  /** Prevailing wind angle in radians. */
  angle?: number;
};

/**
 * Lightweight procedural wind field driven by time, scroll velocity, and pulses.
 */
export function createWindField(options: WindFieldOptions = {}): WindField {
  const useTurb = options.turb !== false;
  const baseStrength = options.baseStrength ?? 0.35;
  const baseAngle = options.angle ?? Math.PI * 0.12;

  let strengthBoost = 0;
  let boostDecayPerSec = 1.2;
  let gustX = 0;
  let gustY = 0;
  let phase = Math.random() * Math.PI * 2;

  return {
    update(dt: number, scrollVy: number): WindSample {
      const safeDt = Number.isFinite(dt) ? Math.max(0, Math.min(dt, 0.1)) : 0.016;
      phase += safeDt * 0.55;

      if (strengthBoost > 0) {
        strengthBoost = Math.max(0, strengthBoost - boostDecayPerSec * safeDt);
      }

      // Gust vectors decay toward rest.
      const gustDecay = Math.exp(-safeDt * 3.2);
      gustX *= gustDecay;
      gustY *= gustDecay;

      const turbX = useTurb ? Math.sin(phase) * 0.18 + Math.sin(phase * 1.73 + 0.4) * 0.1 : 0;
      const turbY = useTurb ? Math.cos(phase * 0.91) * 0.12 + Math.sin(phase * 2.1) * 0.06 : 0;

      const scrollPush = scrollVy * 0.0015;
      const strength =
        baseStrength + strengthBoost + Math.abs(scrollPush) * 0.35 + Math.abs(turbX) * 0.25;

      const x = Math.cos(baseAngle) * strength + gustX + turbX + scrollPush * 0.15;
      const y = Math.sin(baseAngle) * strength + gustY + turbY + scrollPush * 0.55;

      return { x, y, strength };
    },

    pulseStrong(durationMs = 600) {
      const durationSec = Math.max(0.1, durationMs / 1000);
      strengthBoost = Math.max(strengthBoost, 0.95);
      boostDecayPerSec = strengthBoost / durationSec;
    },

    pulseGust(dirX: number, dirY: number) {
      gustX += dirX;
      gustY += dirY;
      strengthBoost = Math.max(strengthBoost, Math.hypot(dirX, dirY) * 0.35);
    },

    reset() {
      strengthBoost = 0;
      gustX = 0;
      gustY = 0;
    },
  };
}
