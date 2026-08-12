// @vitest-environment jsdom

import { createRequire } from 'node:module';

import { describe, expect, it } from 'vitest';

const require = createRequire(import.meta.url);
const timers = require('../../miniapp/utils/deadline-timer');

describe('deadline based timers', () => {
  it('computes remaining time from an absolute deadline', () => {
    const startedAt = Date.parse('2026-07-29T10:00:00+08:00');
    const deadline = timers.createDeadline(300, startedAt);

    expect(timers.getRemainingSeconds(deadline, startedAt + 125_000)).toBe(175);
  });

  it('expires while the mini program is in the background', () => {
    const startedAt = Date.parse('2026-07-29T10:00:00+08:00');
    const deadline = timers.createDeadline(60, startedAt);

    expect(timers.getRemainingSeconds(deadline, startedAt + 70_000)).toBe(0);
    expect(timers.isExpired(deadline, startedAt + 70_000)).toBe(true);
  });

  it('rounds partial seconds up so the display does not finish early', () => {
    expect(timers.getRemainingSeconds(10_001, 10_000)).toBe(1);
  });

  it('rejects invalid durations and deadlines', () => {
    expect(() => timers.createDeadline(-1, 0)).toThrow(/duration/i);
    expect(() => timers.getRemainingSeconds(Number.NaN, 0)).toThrow(/deadline/i);
  });
});
