function vibrateSafe(pattern: number | number[]): void {
  try {
    if (typeof navigator === 'undefined') return;
    if (typeof navigator.vibrate !== 'function') return;
    navigator.vibrate(pattern);
  } catch {
    // ignore unsupported / blocked vibrate
  }
}

/** Short confirmation tap. */
export function hapticTap(): void {
  vibrateSafe(10);
}

/** Soft grow / blossom pulse. */
export function hapticGrow(): void {
  vibrateSafe([15, 30, 25]);
}

/** Section-enter cue. */
export function hapticSection(): void {
  vibrateSafe([8, 40, 12]);
}
