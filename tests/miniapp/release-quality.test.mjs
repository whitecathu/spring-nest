// @vitest-environment jsdom

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

function read(relativePath) {
  return fs.readFileSync(path.join(repoRoot, relativePath), 'utf8');
}

describe('mini program release engineering', () => {
  it('runs the strict miniapp verifier for pull requests targeting main', () => {
    const workflow = read('.github/workflows/ci.yml');

    expect(workflow).toMatch(/pull_request:\s*\n\s*branches:\s*\[main\]/);
    expect(workflow).toMatch(/MINIAPP_VERIFY_STRICT:\s*['"]?1['"]?/);
    expect(workflow).toContain('npm run verify:miniapp');
  });

  it('keeps machine-private project settings out of version control', () => {
    const gitignore = read('.gitignore');

    expect(gitignore).toContain('miniapp/project.private.config.json');
    expect(gitignore).toContain('.tmp-visual-qa/');
    expect(gitignore).toContain('.zcode/');
  });

  it('does not retain destructive one-off scaffold generators', () => {
    expect(fs.existsSync(path.join(repoRoot, 'miniapp/scripts/scaffold-miniapp.mjs'))).toBe(false);
    expect(fs.existsSync(path.join(repoRoot, 'miniapp/scripts/gen-stubs.mjs'))).toBe(false);
  });

  it('labels icon-only study controls for assistive technologies', () => {
    const practice = read('miniapp/packageStudy/pages/practice/index.wxml');

    expect(practice).toMatch(/class="icon-btn"[^>]*aria-label="退出练习"/);
    expect(practice).toMatch(
      /class="fav-btn[^"]*"[^>]*aria-label="\{\{isFavorite \? '取消收藏' : '收藏题目'\}\}"/,
    );
  });

  it('labels the profile avatar picker', () => {
    const profile = read('miniapp/pages/profile/index.wxml');

    expect(profile).toMatch(/class="avatar-btn"[\s\S]*?aria-label="选择本机头像"[\s\S]*?>/);
  });

  it('keeps the local-profile privacy copy aligned with the implemented APIs', () => {
    const privacy = read('miniapp/pages/privacy/index.wxml');

    expect(privacy).not.toContain('wx.login');
    expect(privacy).toContain('仅保存在本机');
  });

  it('uses packaged fonts in DevTools to avoid renderer cache misses', () => {
    const fonts = read('miniapp/utils/fonts.js');

    expect(fonts).toContain('function isDevToolsRuntime()');
    expect(fonts).toMatch(/platform\s*===\s*['"]devtools['"]/);
    expect(fonts).toMatch(/if \(isDevToolsRuntime\(\)\) \{\s*return loadFromPackage\(face\);/);
  });
});
