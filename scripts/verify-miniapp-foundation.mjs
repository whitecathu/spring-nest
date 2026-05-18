import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import {
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../src/lib/miniProgram/toolCatalog.ts';

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function readGeneratedTools() {
  const filename = resolve('miniapp/data/tools.js');
  const code = readFileSync(filename, 'utf8');
  const sandbox = { module: { exports: {} }, exports: {} };
  vm.runInNewContext(code, sandbox, { filename });
  return sandbox.module.exports;
}

function readText(path) {
  return readFileSync(resolve(path), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSameJson(actual, expected, message) {
  assert(JSON.stringify(actual) === JSON.stringify(expected), message);
}

const appJson = readJson('miniapp/app.json');
const generated = readGeneratedTools();
const expectedPages = [
  'pages/home/index',
  'pages/tools/index',
  'pages/profile/index',
  'pages/tool-runtime/index',
];

assert(Array.isArray(appJson.pages), 'miniapp/app.json must define pages');
assertSameJson(appJson.pages, expectedPages, 'miniapp/app.json pages must match the foundation pages');
assert(!appJson.pages.some((page) => page.includes('game')), 'miniapp pages must not include games');

assert(appJson.tabBar?.list?.length === 3, 'tabBar must have exactly three tabs');
assert(
  appJson.tabBar.list.map((tab) => tab.text).join(',') === '首页,工具,我的',
  'tabBar labels must be 首页,工具,我的',
);

assert(generated.tabs.length === 3, 'generated tabs must have three entries');
assert(generated.tools.length === 29, 'generated tool catalog must have 29 tools');
assertSameJson(generated.tabs, miniProgramTabs, 'generated tabs are stale');
assertSameJson(generated.categories, miniProgramToolCategories, 'generated categories are stale');
assertSameJson(generated.tools, miniProgramToolCatalog, 'generated tools are stale');
assert(generated.tools.every((tool) => tool.type === 'tool'), 'generated catalog contains non-tool entries');
assert(generated.tools.every((tool) => !tool.route.startsWith('/games')), 'generated catalog contains game routes');
assert(generated.tools.some((tool) => tool.id === 'tool-28'), 'review nest tool missing');
assert(!generated.tabs.some((tab) => tab.id === 'review'), 'review tab must not exist');

for (const file of [
  'miniapp/project.config.json',
  'miniapp/app.json',
  'miniapp/app.js',
  'miniapp/app.wxss',
  'miniapp/sitemap.json',
  'miniapp/data/tools.js',
  'miniapp/utils/storage.js',
  'miniapp/components/tool-card/index.json',
  'miniapp/components/tool-card/index.js',
  'miniapp/components/tool-card/index.wxml',
  'miniapp/components/tool-card/index.wxss',
  'miniapp/components/tool-shell/index.json',
  'miniapp/components/tool-shell/index.js',
  'miniapp/components/tool-shell/index.wxml',
  'miniapp/components/tool-shell/index.wxss',
  'miniapp/components/bottom-action-bar/index.json',
  'miniapp/components/bottom-action-bar/index.js',
  'miniapp/components/bottom-action-bar/index.wxml',
  'miniapp/components/bottom-action-bar/index.wxss',
  'miniapp/components/result-card/index.json',
  'miniapp/components/result-card/index.js',
  'miniapp/components/result-card/index.wxml',
  'miniapp/components/result-card/index.wxss',
  'miniapp/components/preset-chips/index.json',
  'miniapp/components/preset-chips/index.js',
  'miniapp/components/preset-chips/index.wxml',
  'miniapp/components/preset-chips/index.wxss',
  'miniapp/pages/home/index.json',
  'miniapp/pages/home/index.js',
  'miniapp/pages/home/index.wxml',
  'miniapp/pages/home/index.wxss',
  'miniapp/pages/tools/index.json',
  'miniapp/pages/tools/index.js',
  'miniapp/pages/tools/index.wxml',
  'miniapp/pages/tools/index.wxss',
  'miniapp/pages/profile/index.json',
  'miniapp/pages/profile/index.js',
  'miniapp/pages/profile/index.wxml',
  'miniapp/pages/profile/index.wxss',
  'miniapp/pages/tool-runtime/index.json',
  'miniapp/pages/tool-runtime/index.js',
  'miniapp/pages/tool-runtime/index.wxml',
  'miniapp/pages/tool-runtime/index.wxss',
]) {
  assert(existsSync(resolve(file)), `${file} missing`);
  if (file.endsWith('.json')) readJson(file);
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', resolve(file)]);
}

const toolsPageJs = readText('miniapp/pages/tools/index.js');
assert(toolsPageJs.includes("slug: 'recent'"), 'tools tab must include a recent category');
assert(toolsPageJs.includes('getRecentTools'), 'tools tab must read recent tools');

console.log('Mini program foundation verified.');
