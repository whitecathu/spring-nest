// @vitest-environment node

import { createRequire } from 'node:module';

import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const engines = require('../utils/tool-engines');
const originalTimeZone = process.env.TZ;

function secureRandomStub(fillByte = () => 0) {
  return vi.fn(({ length, success }) => {
    const bytes = new Uint8Array(length);
    bytes.forEach((_, index) => {
      bytes[index] = fillByte(index) & 0xff;
    });
    success({ randomValues: bytes.buffer });
  });
}

beforeAll(() => {
  process.env.TZ = 'Asia/Shanghai';
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

afterAll(() => {
  if (originalTimeZone === undefined) {
    delete process.env.TZ;
  } else {
    process.env.TZ = originalTimeZone;
  }
});

describe('secure password generation', () => {
  it('returns a Promise', async () => {
    vi.stubGlobal('wx', { getRandomValues: secureRandomStub() });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = engines.generatePassword(16, {
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    });

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toHaveLength(16);
  });

  it('uses wx.getRandomValues without consulting Math.random', async () => {
    const getRandomValues = secureRandomStub((index) => index);
    vi.stubGlobal('wx', { getRandomValues });
    const insecureRandom = vi.spyOn(Math, 'random').mockImplementation(() => {
      throw new Error('Math.random must not be used');
    });

    await engines.generatePassword(16, {
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    });

    expect(getRandomValues).toHaveBeenCalled();
    expect(insecureRandom).not.toHaveBeenCalled();
  });

  it('includes at least one character from every enabled character set', async () => {
    vi.stubGlobal('wx', { getRandomValues: secureRandomStub() });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const password = await engines.generatePassword(16, {
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    });

    expect(password).toMatch(/[a-z]/);
    expect(password).toMatch(/[A-Z]/);
    expect(password).toMatch(/[0-9]/);
    expect([...password].some((character) => '!@#$%^&*()-_=+[]{};:,.?'.includes(character))).toBe(
      true,
    );
  });

  it('rejects when wx.getRandomValues is unavailable', async () => {
    vi.stubGlobal('wx', {});
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = engines.generatePassword(16, {
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    });

    await expect(result).rejects.toBeTruthy();
  });

  it('rejects when wx.getRandomValues reports a failure', async () => {
    vi.stubGlobal('wx', {
      getRandomValues: vi.fn(({ fail }) => {
        fail(new Error('secure random unavailable'));
      }),
    });
    vi.spyOn(Math, 'random').mockReturnValue(0);

    const result = engines.generatePassword(16, {
      lower: true,
      upper: true,
      digits: true,
      symbols: true,
    });

    await expect(result).rejects.toBeTruthy();
  });
});

describe('local date keys', () => {
  it('keeps the Shanghai calendar day and month after local midnight', () => {
    const { formatLocalDate, formatLocalMonth } = require('../utils/local-date');
    const shanghaiTime = new Date('2026-07-29T00:30:00+08:00');

    expect(formatLocalDate(shanghaiTime)).toBe('2026-07-29');
    expect(formatLocalMonth(shanghaiTime)).toBe('2026-07');
  });

  it('does not roll the first day of a month back to the previous month', () => {
    const { formatLocalDate, formatLocalMonth } = require('../utils/local-date');
    const shanghaiMonthStart = new Date('2026-07-01T00:30:00+08:00');

    expect(formatLocalDate(shanghaiMonthStart)).toBe('2026-07-01');
    expect(formatLocalMonth(shanghaiMonthStart)).toBe('2026-07');
  });
});
