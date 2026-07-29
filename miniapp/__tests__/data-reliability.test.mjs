// @vitest-environment node

import { createRequire } from 'node:module';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);

function requireFresh(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  return require(modulePath);
}

function createStorageWx() {
  const values = new Map();
  return {
    values,
    wx: {
      getStorageSync: vi.fn((key) => (values.has(key) ? values.get(key) : '')),
      setStorageSync: vi.fn((key, value) => values.set(key, value)),
      removeStorageSync: vi.fn((key) => values.delete(key)),
    },
  };
}

function createAuthWx() {
  const storage = createStorageWx();
  let savedAvatarIndex = 0;
  return {
    values: storage.values,
    wx: {
      ...storage.wx,
      login: vi.fn((options) => options.success({ code: 'legacy-code-must-not-be-used' })),
      saveFile: vi.fn((options) => {
        savedAvatarIndex += 1;
        options.success({ savedFilePath: `wxfile://usr/avatar-${savedAvatarIndex}.png` });
      }),
      removeSavedFile: vi.fn((options) => {
        if (options.success) options.success({});
        if (options.complete) options.complete({});
      }),
    },
  };
}

function requireFreshAuth() {
  delete require.cache[require.resolve('../utils/storage')];
  return requireFresh('../utils/auth');
}

afterEach(() => {
  vi.restoreAllMocks();
  delete globalThis.wx;
});

describe('storage write failures', () => {
  beforeEach(() => {
    globalThis.wx = {
      getStorageSync: vi.fn(),
      setStorageSync: vi.fn(() => {
        throw new Error('quota exceeded');
      }),
      removeStorageSync: vi.fn(() => {
        throw new Error('remove failed');
      }),
    };
  });

  it.each([
    ['set', (storage) => storage.set('profile', { nickName: '春春' })],
    ['setJSON', (storage) => storage.setJSON('ledger', [{ amount: 12 }])],
    ['remove', (storage) => storage.remove('profile')],
  ])('%s throws a typed storage error instead of reporting success', (_name, write) => {
    const storage = requireFresh('../utils/storage');

    let thrown;
    try {
      write(storage);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(Error);
    expect(thrown).toMatchObject({ code: 'STORAGE_WRITE_FAILED' });
  });
});

describe('bookkeeping CSV safety', () => {
  it.each([
    ['=2+3', "'=2+3"],
    [' +2', "' +2"],
    ['  -2', "'  -2"],
    [' @SUM(A1:A2)', "' @SUM(A1:A2)"],
    ['\t=2+3', "'\t=2+3"],
    ['\r=2+3', '"\'\r=2+3"'],
  ])('neutralizes dangerous spreadsheet input %j', (input, expected) => {
    const { csvEscape } = require('../packageTools/utils/bookkeeping');

    expect(csvEscape(input)).toBe(expected);
  });

  it('preserves ordinary Chinese text and standard CSV escaping', () => {
    const { csvEscape } = require('../packageTools/utils/bookkeeping');

    expect(csvEscape('午餐')).toBe('午餐');
    expect(csvEscape('餐饮,晚餐')).toBe('"餐饮,晚餐"');
    expect(csvEscape('他说"好"')).toBe('"他说""好"""');
  });

  it('exports a safe CSV with stable columns', () => {
    const { toCsv } = require('../packageTools/utils/bookkeeping');

    const csv = toCsv([
      {
        date: '2026-07-29',
        type: 'expense',
        category: '餐饮',
        amount: 18.5,
        note: '=HYPERLINK("https://example.invalid")',
      },
    ]);

    expect(csv).toBe(
      'date,type,category,amount,note\n' +
        '2026-07-29,expense,餐饮,18.5,"\'=HYPERLINK(""https://example.invalid"")"',
    );
  });
});

describe('local-only profile avatar persistence', () => {
  it('saves a temporary avatar without invoking wx.login', async () => {
    const fixture = createAuthWx();
    globalThis.wx = fixture.wx;
    const auth = requireFreshAuth();

    const user = await auth.loginWithProfile({
      nickName: '春春',
      avatarUrl: 'wxfile://tmp/avatar.png',
    });

    expect(fixture.wx.login).not.toHaveBeenCalled();
    expect(fixture.wx.saveFile).toHaveBeenCalledWith(
      expect.objectContaining({ tempFilePath: 'wxfile://tmp/avatar.png' }),
    );
    expect(user).toMatchObject({
      nickName: '春春',
      avatarUrl: 'wxfile://usr/avatar-1.png',
      localOnly: true,
    });
    expect(user).not.toHaveProperty('sessionId');
    expect(auth.getUser()).toMatchObject({ avatarUrl: 'wxfile://usr/avatar-1.png' });
  });

  it('removes the previous saved avatar after a replacement is persisted', async () => {
    const fixture = createAuthWx();
    globalThis.wx = fixture.wx;
    const auth = requireFreshAuth();

    await auth.loginWithProfile({
      nickName: '春春',
      avatarUrl: 'wxfile://tmp/avatar-1.png',
    });
    const replacement = await auth.loginWithProfile({
      nickName: '春春',
      avatarUrl: 'wxfile://tmp/avatar-2.png',
    });

    expect(replacement.avatarUrl).toBe('wxfile://usr/avatar-2.png');
    expect(fixture.wx.removeSavedFile).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: 'wxfile://usr/avatar-1.png' }),
    );
  });

  it('removes the saved avatar before clearing local profile data on logout', async () => {
    const fixture = createAuthWx();
    globalThis.wx = fixture.wx;
    const auth = requireFreshAuth();

    await auth.loginWithProfile({
      nickName: '春春',
      avatarUrl: 'wxfile://tmp/avatar.png',
    });
    await auth.logout();

    expect(fixture.wx.removeSavedFile).toHaveBeenCalledWith(
      expect.objectContaining({ filePath: 'wxfile://usr/avatar-1.png' }),
    );
    expect(auth.getUser()).toBeNull();
  });
});
