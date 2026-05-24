# Tools Mini Program Foundations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first independently testable foundation for a native-style tools-only mini program: three tabs, generated tool catalog, reusable shell components, and a tool runtime entry.

**Architecture:** Keep the existing React Web app unchanged and add a separate `miniapp/` tree for WeChat Mini Program code. Reuse the existing `src/data/tools.ts` catalog through a tested TypeScript adapter and a generator that writes native mini program data. This plan intentionally ships a navigable foundation before tool-specific workbench implementations are planned.

**Tech Stack:** React/Vite/TypeScript/Vitest for existing shared catalog validation; native WeChat Mini Program files (`.json`, `.js`, `.wxml`, `.wxss`) for `miniapp/`; Node scripts for generation and static verification.

---

## Scope

This plan implements Phase 1 from `docs/superpowers/specs/2026-05-18-tools-mini-program-design.md`.

It includes:

- `miniapp/` project shell.
- Three tabs: 首页、工具、我的.
- No games and no game routes.
- Generated mini program catalog from existing 29 tools.
- Tool search, category browsing, recent tools, favorites, and a tool runtime shell.
- Static verification for the mini program foundation.

It does not include:

- Tool-specific full workbenches for all 29 tools.
- Game pages or game catalog data.
- Cloud sync.
- Web mobile refactors.

## File Structure

Create:

- `src/lib/miniProgram/toolCatalog.ts`: TypeScript catalog adapter for the tools-only mini program.
- `src/__tests__/miniProgramCatalog.test.ts`: Vitest coverage for three tabs, 29 tools, no games, categories, and high-priority tools.
- `scripts/generate-miniapp-tools.ts`: Generates native mini program catalog data from the TypeScript adapter.
- `scripts/verify-miniapp-foundation.mjs`: Validates `miniapp/` routes, tab labels, generated catalog, and absence of games.
- `miniapp/project.config.json`: WeChat DevTools project config.
- `miniapp/app.json`: Mini program pages, window settings, and three-tab configuration.
- `miniapp/app.js`: App bootstrap.
- `miniapp/app.wxss`: Global mini program tokens and layout utilities.
- `miniapp/sitemap.json`: Mini program sitemap.
- `miniapp/data/tools.js`: Generated catalog file.
- `miniapp/utils/storage.js`: Favorites and recent-tools storage helpers.
- `miniapp/components/tool-card/index.{json,js,wxml,wxss}`: Reusable tool card.
- `miniapp/components/tool-shell/index.{json,js,wxml,wxss}`: Reusable runtime shell.
- `miniapp/components/bottom-action-bar/index.{json,js,wxml,wxss}`: Safe-area action bar.
- `miniapp/components/result-card/index.{json,js,wxml,wxss}`: Reusable result/status card.
- `miniapp/pages/home/index.{json,js,wxml,wxss}`: Home tab.
- `miniapp/pages/tools/index.{json,js,wxml,wxss}`: Tools tab.
- `miniapp/pages/profile/index.{json,js,wxml,wxss}`: Profile tab.
- `miniapp/pages/tool-runtime/index.{json,js,wxml,wxss}`: Tool runtime entry.

Modify:

- `package.json`: Add `generate:miniapp` and `verify:miniapp` scripts.

---

### Task 1: Create The Tested Tools-Only Catalog Adapter

**Files:**

- Create: `src/lib/miniProgram/toolCatalog.ts`
- Create: `src/__tests__/miniProgramCatalog.test.ts`

- [ ] **Step 1: Write the failing catalog tests**

Create `src/__tests__/miniProgramCatalog.test.ts` with:

```ts
import {
  findMiniProgramToolBySlug,
  getMiniProgramHomeTools,
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../lib/miniProgram/toolCatalog';

describe('mini program tool catalog', () => {
  it('uses the approved three-tab information architecture', () => {
    expect(miniProgramTabs.map((tab) => tab.id)).toEqual(['home', 'tools', 'profile']);
    expect(miniProgramTabs.map((tab) => tab.text)).toEqual(['首页', '工具', '我的']);
    expect(miniProgramTabs.some((tab) => tab.id === 'review')).toBe(false);
  });

  it('contains all 29 tools and no games', () => {
    expect(miniProgramToolCatalog).toHaveLength(29);
    expect(miniProgramToolCatalog.every((tool) => tool.type === 'tool')).toBe(true);
    expect(miniProgramToolCatalog.every((tool) => !tool.route.startsWith('/games'))).toBe(true);
    expect(miniProgramToolCatalog.some((tool) => /游戏|game/i.test(tool.title))).toBe(false);
  });

  it('keeps review nest as a high-priority tool rather than a tab', () => {
    const reviewNest = findMiniProgramToolBySlug('question-bank-importer');
    expect(reviewNest?.id).toBe('tool-28');
    expect(reviewNest?.workbenchType).toBe('local-data');
    expect(reviewNest?.homePriority).toBe(98);
    expect(getMiniProgramHomeTools(6).map((tool) => tool.id)).toContain('tool-28');
  });

  it('maps every tool into a mini program category and workbench type', () => {
    const categorySlugs = new Set(miniProgramToolCategories.map((category) => category.slug));
    const allowedWorkbenchTypes = new Set([
      'quick-calc',
      'text-process',
      'device-file',
      'focus-timer',
      'local-data',
      'privacy',
    ]);

    for (const tool of miniProgramToolCatalog) {
      expect(categorySlugs.has(tool.miniCategorySlug), `${tool.id} category`).toBe(true);
      expect(allowedWorkbenchTypes.has(tool.workbenchType), `${tool.id} workbench`).toBe(true);
      expect(tool.slug.length, `${tool.id} slug`).toBeGreaterThan(0);
    }
  });

  it('prioritizes the tools expected on the mini program home screen', () => {
    expect(getMiniProgramHomeTools(5).map((tool) => tool.id)).toEqual([
      'tool-28',
      'tool-29',
      'tool-2',
      'tool-1',
      'tool-3',
    ]);
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run:

```bash
npm test -- miniProgramCatalog.test.ts
```

Expected: FAIL with an import error for `../lib/miniProgram/toolCatalog`.

- [ ] **Step 3: Create the catalog adapter**

Create `src/lib/miniProgram/toolCatalog.ts` with:

```ts
import { tools } from '../../data/tools';
import type { AppItem } from '../../types/app';

export type MiniProgramTabId = 'home' | 'tools' | 'profile';

export type MiniProgramWorkbenchType =
  | 'quick-calc'
  | 'text-process'
  | 'device-file'
  | 'focus-timer'
  | 'local-data'
  | 'privacy';

export interface MiniProgramTab {
  id: MiniProgramTabId;
  text: string;
  textEn: string;
  pagePath: string;
}

export interface MiniProgramToolCategory {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
}

export interface MiniProgramTool extends Pick<
  AppItem,
  | 'id'
  | 'type'
  | 'title'
  | 'titleEn'
  | 'description'
  | 'descriptionEn'
  | 'category'
  | 'categoryEn'
  | 'tags'
  | 'icon'
  | 'route'
  | 'features'
  | 'featuresEn'
  | 'popularScore'
> {
  slug: string;
  miniCategorySlug: string;
  miniCategoryTitle: string;
  workbenchType: MiniProgramWorkbenchType;
  homePriority: number;
  sensitive: boolean;
}

export const miniProgramTabs: MiniProgramTab[] = [
  { id: 'home', text: '首页', textEn: 'Home', pagePath: 'pages/home/index' },
  { id: 'tools', text: '工具', textEn: 'Tools', pagePath: 'pages/tools/index' },
  { id: 'profile', text: '我的', textEn: 'Me', pagePath: 'pages/profile/index' },
];

export const miniProgramToolCategories: MiniProgramToolCategory[] = [
  {
    slug: 'daily',
    title: '日常实用',
    titleEn: 'Daily',
    description: '计算、扫描、天气、记账等随手工具',
  },
  { slug: 'time', title: '时间效率', titleEn: 'Time', description: '专注、倒计时、日期推算' },
  { slug: 'text', title: '文本学习', titleEn: 'Text', description: '写作、格式化、朗读和复习' },
  { slug: 'dev', title: '开发辅助', titleEn: 'Dev', description: 'JSON、编码、颜色和网络查询' },
  { slug: 'document', title: '文档转换', titleEn: 'Docs', description: 'Word 与 PDF 本地转换' },
  { slug: 'random', title: '随机趣味', titleEn: 'Random', description: '抽签、随机数和占位文本' },
  { slug: 'security', title: '安全隐私', titleEn: 'Security', description: '密码与敏感内容处理' },
];

const categorySlugByToolCategory: Record<string, string> = {
  日常实用: 'daily',
  时间效率: 'time',
  学习写作: 'text',
  开发辅助: 'dev',
  文档转换: 'document',
  趣味工具: 'random',
  安全隐私: 'security',
};

const workbenchByToolId: Record<string, MiniProgramWorkbenchType> = {
  'tool-1': 'quick-calc',
  'tool-2': 'focus-timer',
  'tool-3': 'quick-calc',
  'tool-4': 'privacy',
  'tool-5': 'device-file',
  'tool-6': 'device-file',
  'tool-7': 'device-file',
  'tool-8': 'device-file',
  'tool-9': 'quick-calc',
  'tool-10': 'focus-timer',
  'tool-11': 'text-process',
  'tool-12': 'text-process',
  'tool-13': 'text-process',
  'tool-14': 'text-process',
  'tool-15': 'text-process',
  'tool-16': 'text-process',
  'tool-17': 'quick-calc',
  'tool-18': 'text-process',
  'tool-19': 'text-process',
  'tool-20': 'device-file',
  'tool-21': 'quick-calc',
  'tool-22': 'text-process',
  'tool-23': 'quick-calc',
  'tool-24': 'quick-calc',
  'tool-25': 'text-process',
  'tool-26': 'device-file',
  'tool-27': 'device-file',
  'tool-28': 'local-data',
  'tool-29': 'local-data',
};

const homePriorityByToolId: Record<string, number> = {
  'tool-28': 98,
  'tool-29': 96,
  'tool-2': 94,
  'tool-1': 92,
  'tool-3': 90,
  'tool-13': 86,
  'tool-5': 84,
  'tool-7': 82,
  'tool-26': 80,
  'tool-27': 78,
};

const sensitiveToolIds = new Set([
  'tool-4',
  'tool-13',
  'tool-14',
  'tool-15',
  'tool-26',
  'tool-27',
  'tool-28',
  'tool-29',
]);

function getSlug(route: string) {
  return route.split('/').filter(Boolean).pop() ?? route;
}

function getCategoryTitle(slug: string) {
  return miniProgramToolCategories.find((category) => category.slug === slug)?.title ?? '工具';
}

export const miniProgramToolCatalog: MiniProgramTool[] = tools.map((tool) => {
  const miniCategorySlug = categorySlugByToolCategory[tool.category] ?? 'daily';
  return {
    id: tool.id,
    type: tool.type,
    title: tool.title,
    titleEn: tool.titleEn,
    description: tool.description,
    descriptionEn: tool.descriptionEn,
    category: tool.category,
    categoryEn: tool.categoryEn,
    tags: tool.tags,
    icon: tool.icon,
    route: tool.route,
    features: tool.features,
    featuresEn: tool.featuresEn,
    popularScore: tool.popularScore,
    slug: getSlug(tool.route),
    miniCategorySlug,
    miniCategoryTitle: getCategoryTitle(miniCategorySlug),
    workbenchType: workbenchByToolId[tool.id],
    homePriority: homePriorityByToolId[tool.id] ?? 0,
    sensitive: sensitiveToolIds.has(tool.id),
  };
});

export function findMiniProgramToolBySlug(slug: string) {
  return miniProgramToolCatalog.find((tool) => tool.slug === slug);
}

export function getMiniProgramHomeTools(limit = 8) {
  return [...miniProgramToolCatalog]
    .filter((tool) => tool.homePriority > 0)
    .sort((a, b) => {
      if (b.homePriority !== a.homePriority) return b.homePriority - a.homePriority;
      return (b.popularScore ?? 0) - (a.popularScore ?? 0);
    })
    .slice(0, limit);
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
npm test -- miniProgramCatalog.test.ts
```

Expected: PASS for all catalog tests.

- [ ] **Step 5: Run typecheck**

Run:

```bash
npm run typecheck
```

Expected: PASS with no TypeScript errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/miniProgram/toolCatalog.ts src/__tests__/miniProgramCatalog.test.ts
git commit -m "feat: add tools mini program catalog"
```

---

### Task 2: Generate Native Mini Program Tool Data

**Files:**

- Create: `scripts/generate-miniapp-tools.ts`
- Create: `scripts/verify-miniapp-foundation.mjs`
- Create: `miniapp/data/tools.js`
- Modify: `package.json`

- [ ] **Step 1: Add generation and verification scripts to `package.json`**

Add these two entries inside the existing `"scripts"` object:

```json
"generate:miniapp": "tsx scripts/generate-miniapp-tools.ts",
"verify:miniapp": "node scripts/verify-miniapp-foundation.mjs"
```

Keep the existing scripts unchanged.

- [ ] **Step 2: Create the generator**

Create `scripts/generate-miniapp-tools.ts` with:

```ts
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import {
  miniProgramTabs,
  miniProgramToolCatalog,
  miniProgramToolCategories,
} from '../src/lib/miniProgram/toolCatalog';

const outputPath = resolve('miniapp/data/tools.js');
const payload = {
  generatedAt: new Date().toISOString(),
  tabs: miniProgramTabs,
  categories: miniProgramToolCategories,
  tools: miniProgramToolCatalog,
};

mkdirSync(dirname(outputPath), { recursive: true });
writeFileSync(outputPath, `module.exports = ${JSON.stringify(payload, null, 2)};\n`, 'utf8');

console.log(`Generated ${miniProgramToolCatalog.length} mini program tools at ${outputPath}`);
```

- [ ] **Step 3: Create the static verifier**

Create `scripts/verify-miniapp-foundation.mjs` with:

```js
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), 'utf8'));
}

function readGeneratedTools() {
  const raw = readFileSync(resolve('miniapp/data/tools.js'), 'utf8')
    .replace(/^module\.exports = /, '')
    .replace(/;\s*$/, '');
  return JSON.parse(raw);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const appJson = readJson('miniapp/app.json');
const generated = readGeneratedTools();

assert(Array.isArray(appJson.pages), 'miniapp/app.json must define pages');
assert(appJson.pages.includes('pages/home/index'), 'home page missing');
assert(appJson.pages.includes('pages/tools/index'), 'tools page missing');
assert(appJson.pages.includes('pages/profile/index'), 'profile page missing');
assert(appJson.pages.includes('pages/tool-runtime/index'), 'tool runtime page missing');

assert(appJson.tabBar?.list?.length === 3, 'tabBar must have exactly three tabs');
assert(
  appJson.tabBar.list.map((tab) => tab.text).join(',') === '首页,工具,我的',
  'tabBar labels must be 首页,工具,我的',
);

assert(generated.tabs.length === 3, 'generated tabs must have three entries');
assert(generated.tools.length === 29, 'generated tool catalog must have 29 tools');
assert(
  generated.tools.every((tool) => tool.type === 'tool'),
  'generated catalog contains non-tool entries',
);
assert(
  generated.tools.every((tool) => !tool.route.startsWith('/games')),
  'generated catalog contains game routes',
);
assert(
  generated.tools.some((tool) => tool.id === 'tool-28'),
  'review nest tool missing',
);
assert(!generated.tabs.some((tab) => tab.id === 'review'), 'review tab must not exist');

for (const file of [
  'miniapp/app.js',
  'miniapp/app.wxss',
  'miniapp/sitemap.json',
  'miniapp/pages/home/index.js',
  'miniapp/pages/tools/index.js',
  'miniapp/pages/profile/index.js',
  'miniapp/pages/tool-runtime/index.js',
]) {
  assert(existsSync(resolve(file)), `${file} missing`);
}

console.log('Mini program foundation verified.');
```

- [ ] **Step 4: Run the generator before `miniapp/app.json` exists**

Run:

```bash
npm run generate:miniapp
```

Expected: PASS and output contains this generated-file message:

```text
Generated 29 mini program tools at G:\wanzan-main\miniapp\data\tools.js
```

- [ ] **Step 5: Run the verifier and confirm the expected failure**

Run:

```bash
npm run verify:miniapp
```

Expected: FAIL because `miniapp/app.json` does not exist yet.

- [ ] **Step 6: Commit**

```bash
git add package.json scripts/generate-miniapp-tools.ts scripts/verify-miniapp-foundation.mjs miniapp/data/tools.js
git commit -m "chore: generate mini program tool data"
```

---

### Task 3: Add The Mini Program App Shell

**Files:**

- Create: `miniapp/project.config.json`
- Create: `miniapp/app.json`
- Create: `miniapp/app.js`
- Create: `miniapp/app.wxss`
- Create: `miniapp/sitemap.json`

- [ ] **Step 1: Create WeChat project config**

Create `miniapp/project.config.json` with:

```json
{
  "description": "Spring Nest tools-only mini program",
  "packOptions": {
    "ignore": []
  },
  "setting": {
    "urlCheck": true,
    "es6": true,
    "enhance": true,
    "postcss": true,
    "minified": true
  },
  "compileType": "miniprogram",
  "libVersion": "latest",
  "appid": "touristappid",
  "projectname": "spring-nest-tools",
  "condition": {}
}
```

- [ ] **Step 2: Create app configuration**

Create `miniapp/app.json` with:

```json
{
  "pages": [
    "pages/home/index",
    "pages/tools/index",
    "pages/profile/index",
    "pages/tool-runtime/index"
  ],
  "window": {
    "navigationBarTitleText": "春日小筑工具箱",
    "navigationBarBackgroundColor": "#FFF9F2",
    "navigationBarTextStyle": "black",
    "backgroundColor": "#FFF9F2"
  },
  "tabBar": {
    "color": "#6B6A66",
    "selectedColor": "#3F6751",
    "backgroundColor": "#FFF9F2",
    "borderStyle": "white",
    "list": [
      {
        "pagePath": "pages/home/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/tools/index",
        "text": "工具"
      },
      {
        "pagePath": "pages/profile/index",
        "text": "我的"
      }
    ]
  },
  "style": "v2",
  "sitemapLocation": "sitemap.json"
}
```

- [ ] **Step 3: Create app bootstrap**

Create `miniapp/app.js` with:

```js
App({
  globalData: {
    appName: '春日小筑工具箱',
    version: '0.1.0',
  },
});
```

- [ ] **Step 4: Create global styles**

Create `miniapp/app.wxss` with:

```css
page {
  min-height: 100vh;
  background: #fff9f2;
  color: #1a1c1a;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Noto Sans SC', sans-serif;
}

.page {
  min-height: 100vh;
  padding: 28rpx 28rpx calc(32rpx + env(safe-area-inset-bottom));
  box-sizing: border-box;
}

.section {
  margin-top: 28rpx;
}

.surface {
  border: 1rpx solid rgba(226, 227, 223, 0.9);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.88);
  box-shadow: 0 16rpx 42rpx rgba(63, 103, 81, 0.08);
}

.muted {
  color: #615e59;
}

.primary {
  color: #3f6751;
}

.button-reset {
  padding: 0;
  border: 0;
  background: transparent;
  line-height: 1;
}

.button-reset::after {
  border: 0;
}

.safe-bottom {
  padding-bottom: env(safe-area-inset-bottom);
}
```

- [ ] **Step 5: Create sitemap**

Create `miniapp/sitemap.json` with:

```json
{
  "rules": [
    {
      "action": "allow",
      "page": "*"
    }
  ]
}
```

- [ ] **Step 6: Run the verifier and confirm the page-file failure**

Run:

```bash
npm run verify:miniapp
```

Expected: FAIL because the page `.js` files do not exist yet.

- [ ] **Step 7: Commit**

```bash
git add miniapp/project.config.json miniapp/app.json miniapp/app.js miniapp/app.wxss miniapp/sitemap.json
git commit -m "feat: add mini program app shell"
```

---

### Task 4: Add Mini Program Storage Helpers And Shared Components

**Files:**

- Create: `miniapp/utils/storage.js`
- Create: `miniapp/components/tool-card/index.json`
- Create: `miniapp/components/tool-card/index.js`
- Create: `miniapp/components/tool-card/index.wxml`
- Create: `miniapp/components/tool-card/index.wxss`
- Create: `miniapp/components/tool-shell/index.json`
- Create: `miniapp/components/tool-shell/index.js`
- Create: `miniapp/components/tool-shell/index.wxml`
- Create: `miniapp/components/tool-shell/index.wxss`
- Create: `miniapp/components/bottom-action-bar/index.json`
- Create: `miniapp/components/bottom-action-bar/index.js`
- Create: `miniapp/components/bottom-action-bar/index.wxml`
- Create: `miniapp/components/bottom-action-bar/index.wxss`
- Create: `miniapp/components/result-card/index.json`
- Create: `miniapp/components/result-card/index.js`
- Create: `miniapp/components/result-card/index.wxml`
- Create: `miniapp/components/result-card/index.wxss`

- [ ] **Step 1: Create storage helpers**

Create `miniapp/utils/storage.js` with:

```js
const STORAGE_KEYS = {
  favorites: 'spring_nest_miniapp_favorite_tools',
  recent: 'spring_nest_miniapp_recent_tools',
};

function readArray(key) {
  const value = wx.getStorageSync(key);
  return Array.isArray(value) ? value : [];
}

function writeArray(key, value) {
  wx.setStorageSync(key, value);
}

function getFavoriteToolIds() {
  return readArray(STORAGE_KEYS.favorites);
}

function isFavoriteTool(toolId) {
  return getFavoriteToolIds().includes(toolId);
}

function toggleFavoriteTool(toolId) {
  const current = getFavoriteToolIds();
  const next = current.includes(toolId)
    ? current.filter((id) => id !== toolId)
    : [toolId, ...current];
  writeArray(STORAGE_KEYS.favorites, next);
  return next;
}

function getRecentTools() {
  return readArray(STORAGE_KEYS.recent);
}

function recordRecentTool(tool) {
  const current = getRecentTools().filter((item) => item.id !== tool.id);
  const next = [
    {
      id: tool.id,
      slug: tool.slug,
      title: tool.title,
      icon: tool.icon || '',
      visitedAt: Date.now(),
    },
    ...current,
  ].slice(0, 12);
  writeArray(STORAGE_KEYS.recent, next);
  return next;
}

function clearMiniProgramLocalData() {
  wx.removeStorageSync(STORAGE_KEYS.favorites);
  wx.removeStorageSync(STORAGE_KEYS.recent);
}

module.exports = {
  STORAGE_KEYS,
  clearMiniProgramLocalData,
  getFavoriteToolIds,
  getRecentTools,
  isFavoriteTool,
  recordRecentTool,
  toggleFavoriteTool,
};
```

- [ ] **Step 2: Create `tool-card`**

Create `miniapp/components/tool-card/index.json` with:

```json
{
  "component": true
}
```

Create `miniapp/components/tool-card/index.js` with:

```js
Component({
  properties: {
    tool: {
      type: Object,
      value: {},
    },
    compact: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    handleTap() {
      this.triggerEvent('open', this.properties.tool);
    },
  },
});
```

Create `miniapp/components/tool-card/index.wxml` with:

```xml
<button class="tool-card {{compact ? 'tool-card--compact' : ''}}" bindtap="handleTap" hover-class="tool-card--active">
  <view class="tool-card__icon">{{tool.icon || '工具'}}</view>
  <view class="tool-card__body">
    <view class="tool-card__title">{{tool.title}}</view>
    <view class="tool-card__desc">{{tool.description}}</view>
    <view class="tool-card__meta">{{tool.miniCategoryTitle}} · {{tool.workbenchType}}</view>
  </view>
</button>
```

Create `miniapp/components/tool-card/index.wxss` with:

```css
.tool-card {
  display: flex;
  width: 100%;
  min-height: 112rpx;
  gap: 22rpx;
  align-items: center;
  padding: 24rpx;
  box-sizing: border-box;
  border: 1rpx solid rgba(226, 227, 223, 0.9);
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.92);
  text-align: left;
}

.tool-card::after {
  border: 0;
}

.tool-card--active {
  background: #eef8f2;
}

.tool-card__icon {
  display: flex;
  width: 76rpx;
  height: 76rpx;
  flex: 0 0 76rpx;
  align-items: center;
  justify-content: center;
  border-radius: 22rpx;
  background: #e8f4ed;
  color: #3f6751;
  font-size: 34rpx;
  font-weight: 800;
}

.tool-card__body {
  min-width: 0;
}

.tool-card__title {
  color: #1a1c1a;
  font-size: 32rpx;
  font-weight: 800;
}

.tool-card__desc {
  display: -webkit-box;
  margin-top: 8rpx;
  overflow: hidden;
  color: #615e59;
  font-size: 24rpx;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.tool-card__meta {
  margin-top: 10rpx;
  color: #3f6751;
  font-size: 22rpx;
  font-weight: 700;
}

.tool-card--compact {
  min-height: 96rpx;
  padding: 20rpx;
}
```

- [ ] **Step 3: Create `tool-shell`**

Create `miniapp/components/tool-shell/index.json` with:

```json
{
  "component": true,
  "options": {
    "multipleSlots": true
  }
}
```

Create `miniapp/components/tool-shell/index.js` with:

```js
Component({
  properties: {
    tool: {
      type: Object,
      value: {},
    },
    favorite: {
      type: Boolean,
      value: false,
    },
  },
  methods: {
    toggleFavorite() {
      this.triggerEvent('favorite', this.properties.tool);
    },
  },
});
```

Create `miniapp/components/tool-shell/index.wxml` with:

```xml
<view class="tool-shell">
  <view class="tool-shell__header">
    <view>
      <view class="tool-shell__category">{{tool.miniCategoryTitle}}</view>
      <view class="tool-shell__title">{{tool.title}}</view>
      <view class="tool-shell__desc">{{tool.description}}</view>
    </view>
    <button class="tool-shell__favorite" bindtap="toggleFavorite" aria-label="{{favorite ? '取消收藏' : '收藏'}}">
      {{favorite ? '已藏' : '收藏'}}
    </button>
  </view>
  <slot></slot>
  <view class="tool-shell__privacy">默认本地处理。敏感内容不会写入最近使用明文。</view>
</view>
```

Create `miniapp/components/tool-shell/index.wxss` with:

```css
.tool-shell {
  padding-bottom: 152rpx;
}

.tool-shell__header {
  display: flex;
  gap: 20rpx;
  align-items: flex-start;
  justify-content: space-between;
  padding: 28rpx;
  border-radius: 28rpx;
  background: linear-gradient(135deg, #ffffff, #eef8f2);
  box-shadow: 0 18rpx 46rpx rgba(63, 103, 81, 0.08);
}

.tool-shell__category {
  color: #3f6751;
  font-size: 24rpx;
  font-weight: 800;
}

.tool-shell__title {
  margin-top: 8rpx;
  color: #1a1c1a;
  font-size: 44rpx;
  font-weight: 900;
}

.tool-shell__desc {
  margin-top: 10rpx;
  color: #615e59;
  font-size: 26rpx;
  line-height: 1.55;
}

.tool-shell__favorite {
  min-width: 112rpx;
  min-height: 72rpx;
  padding: 0 20rpx;
  border-radius: 999rpx;
  background: #3f6751;
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 800;
}

.tool-shell__favorite::after {
  border: 0;
}

.tool-shell__privacy {
  margin-top: 24rpx;
  padding: 18rpx 22rpx;
  border-radius: 20rpx;
  background: rgba(63, 103, 81, 0.08);
  color: #3f6751;
  font-size: 24rpx;
  line-height: 1.5;
}
```

- [ ] **Step 4: Create `bottom-action-bar`**

Create `miniapp/components/bottom-action-bar/index.json` with:

```json
{
  "component": true
}
```

Create `miniapp/components/bottom-action-bar/index.js` with:

```js
Component({
  properties: {
    primaryText: {
      type: String,
      value: '开始',
    },
    secondaryText: {
      type: String,
      value: '',
    },
  },
  methods: {
    handlePrimary() {
      this.triggerEvent('primary');
    },
    handleSecondary() {
      this.triggerEvent('secondary');
    },
  },
});
```

Create `miniapp/components/bottom-action-bar/index.wxml` with:

```xml
<view class="bottom-action safe-bottom">
  <button wx:if="{{secondaryText}}" class="bottom-action__secondary" bindtap="handleSecondary">{{secondaryText}}</button>
  <button class="bottom-action__primary" bindtap="handlePrimary">{{primaryText}}</button>
</view>
```

Create `miniapp/components/bottom-action-bar/index.wxss` with:

```css
.bottom-action {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 16rpx;
  padding: 18rpx 28rpx calc(18rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid rgba(226, 227, 223, 0.9);
  background: rgba(255, 249, 242, 0.96);
}

.bottom-action__secondary,
.bottom-action__primary {
  min-height: 88rpx;
  border-radius: 22rpx;
  font-size: 28rpx;
  font-weight: 850;
}

.bottom-action__secondary::after,
.bottom-action__primary::after {
  border: 0;
}

.bottom-action__secondary {
  background: #eef0ec;
  color: #3f6751;
}

.bottom-action__primary {
  background: #3f6751;
  color: #ffffff;
}
```

- [ ] **Step 5: Create `result-card`**

Create `miniapp/components/result-card/index.json` with:

```json
{
  "component": true
}
```

Create `miniapp/components/result-card/index.js` with:

```js
Component({
  properties: {
    title: {
      type: String,
      value: '',
    },
    content: {
      type: String,
      value: '',
    },
    tone: {
      type: String,
      value: 'default',
    },
  },
});
```

Create `miniapp/components/result-card/index.wxml` with:

```xml
<view class="result-card result-card--{{tone}}">
  <view class="result-card__title">{{title}}</view>
  <view class="result-card__content">{{content}}</view>
</view>
```

Create `miniapp/components/result-card/index.wxss` with:

```css
.result-card {
  margin-top: 24rpx;
  padding: 24rpx;
  border-radius: 24rpx;
  background: #ffffff;
  box-shadow: 0 14rpx 36rpx rgba(63, 103, 81, 0.08);
}

.result-card--warning {
  background: #fff7e8;
}

.result-card--success {
  background: #eef8f2;
}

.result-card__title {
  color: #1a1c1a;
  font-size: 28rpx;
  font-weight: 850;
}

.result-card__content {
  margin-top: 10rpx;
  color: #615e59;
  font-size: 26rpx;
  line-height: 1.6;
}
```

- [ ] **Step 6: Commit**

```bash
git add miniapp/utils/storage.js miniapp/components
git commit -m "feat: add mini program foundation components"
```

---

### Task 5: Implement The Home Tab

**Files:**

- Create: `miniapp/pages/home/index.json`
- Create: `miniapp/pages/home/index.js`
- Create: `miniapp/pages/home/index.wxml`
- Create: `miniapp/pages/home/index.wxss`

- [ ] **Step 1: Create page configuration**

Create `miniapp/pages/home/index.json` with:

```json
{
  "navigationBarTitleText": "春日小筑工具箱",
  "usingComponents": {
    "tool-card": "../../components/tool-card/index",
    "result-card": "../../components/result-card/index"
  }
}
```

- [ ] **Step 2: Create page logic**

Create `miniapp/pages/home/index.js` with:

```js
const { categories, tools } = require('../../data/tools');
const { getRecentTools } = require('../../utils/storage');

function getHomeTools() {
  return tools
    .filter((tool) => tool.homePriority > 0)
    .sort((a, b) => b.homePriority - a.homePriority)
    .slice(0, 8);
}

Page({
  data: {
    query: '',
    categories,
    homeTools: getHomeTools(),
    recentTools: [],
    searchResults: [],
  },

  onShow() {
    this.setData({
      recentTools: getRecentTools(),
    });
  },

  handleSearchInput(event) {
    const query = event.detail.value.trim();
    const lowerQuery = query.toLowerCase();
    const searchResults = query
      ? tools
          .filter((tool) =>
            [tool.title, tool.description, tool.miniCategoryTitle, ...(tool.tags || [])]
              .join(' ')
              .toLowerCase()
              .includes(lowerQuery),
          )
          .slice(0, 8)
      : [];
    this.setData({ query, searchResults });
  },

  openTool(event) {
    const tool = event.detail || event.currentTarget.dataset.tool;
    if (!tool?.slug) return;
    wx.navigateTo({
      url: `/pages/tool-runtime/index?slug=${tool.slug}`,
    });
  },

  openToolsTab() {
    wx.switchTab({
      url: '/pages/tools/index',
    });
  },
});
```

- [ ] **Step 3: Create page markup**

Create `miniapp/pages/home/index.wxml` with:

```xml
<view class="page home-page">
  <view class="home-hero">
    <view class="home-hero__eyebrow">Spring Nest</view>
    <view class="home-hero__title">工具箱</view>
    <view class="home-hero__subtitle">打开就能用，数据默认留在本机。</view>
  </view>

  <view class="search-box">
    <input
      class="search-box__input"
      value="{{query}}"
      placeholder="搜索工具、说明或标签"
      confirm-type="search"
      bindinput="handleSearchInput"
    />
  </view>

  <view wx:if="{{searchResults.length}}" class="section">
    <view class="section-title">搜索结果</view>
    <block wx:for="{{searchResults}}" wx:key="id">
      <tool-card tool="{{item}}" compact bind:open="openTool" />
    </block>
  </view>

  <view wx:if="{{recentTools.length}}" class="section">
    <view class="section-title">最近使用</view>
    <scroll-view scroll-x class="recent-strip">
      <button
        wx:for="{{recentTools}}"
        wx:key="id"
        class="recent-chip"
        data-tool="{{item}}"
        bindtap="openTool"
      >
        {{item.icon}} {{item.title}}
      </button>
    </scroll-view>
  </view>

  <view class="section">
    <view class="section-title">高频工具</view>
    <block wx:for="{{homeTools}}" wx:key="id">
      <tool-card tool="{{item}}" bind:open="openTool" />
    </block>
  </view>

  <view class="section category-panel surface">
    <view class="section-title">按任务找工具</view>
    <view class="category-grid">
      <button wx:for="{{categories}}" wx:key="slug" class="category-item" bindtap="openToolsTab">
        <view class="category-item__title">{{item.title}}</view>
        <view class="category-item__desc">{{item.description}}</view>
      </button>
    </view>
  </view>

  <result-card title="小程序范围" content="这里只放工具，不包含游戏。当前 Web 端保持原来的工具与游戏入口。" tone="success" />
</view>
```

- [ ] **Step 4: Create page styles**

Create `miniapp/pages/home/index.wxss` with:

```css
.home-hero {
  padding: 36rpx 30rpx;
  border-radius: 32rpx;
  background: linear-gradient(135deg, #eef8f2, #fff7e8);
}

.home-hero__eyebrow {
  color: #3f6751;
  font-size: 24rpx;
  font-weight: 850;
}

.home-hero__title {
  margin-top: 10rpx;
  color: #1a1c1a;
  font-size: 52rpx;
  font-weight: 950;
}

.home-hero__subtitle {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 26rpx;
}

.search-box {
  margin-top: 24rpx;
}

.search-box__input {
  min-height: 92rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #1a1c1a;
  font-size: 28rpx;
}

.section-title {
  margin-bottom: 16rpx;
  color: #1a1c1a;
  font-size: 30rpx;
  font-weight: 900;
}

.recent-strip {
  white-space: nowrap;
}

.recent-chip {
  display: inline-flex;
  min-height: 72rpx;
  margin-right: 14rpx;
  align-items: center;
  border-radius: 999rpx;
  background: #eef8f2;
  color: #3f6751;
  font-size: 26rpx;
  font-weight: 800;
}

.recent-chip::after,
.category-item::after {
  border: 0;
}

.category-panel {
  padding: 24rpx;
}

.category-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.category-item {
  min-height: 126rpx;
  padding: 20rpx;
  border-radius: 22rpx;
  background: #f4f5f1;
  text-align: left;
}

.category-item__title {
  color: #3f6751;
  font-size: 28rpx;
  font-weight: 850;
}

.category-item__desc {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 22rpx;
  line-height: 1.45;
}
```

- [ ] **Step 5: Run static verification and confirm expected missing-page failure remains**

Run:

```bash
npm run verify:miniapp
```

Expected: FAIL because `miniapp/pages/tools/index.js`, `miniapp/pages/profile/index.js`, and `miniapp/pages/tool-runtime/index.js` do not exist yet.

- [ ] **Step 6: Commit**

```bash
git add miniapp/pages/home
git commit -m "feat: add mini program home tab"
```

---

### Task 6: Implement The Tools Tab

**Files:**

- Create: `miniapp/pages/tools/index.json`
- Create: `miniapp/pages/tools/index.js`
- Create: `miniapp/pages/tools/index.wxml`
- Create: `miniapp/pages/tools/index.wxss`

- [ ] **Step 1: Create page configuration**

Create `miniapp/pages/tools/index.json` with:

```json
{
  "navigationBarTitleText": "全部工具",
  "usingComponents": {
    "tool-card": "../../components/tool-card/index"
  }
}
```

- [ ] **Step 2: Create page logic**

Create `miniapp/pages/tools/index.js` with:

```js
const { categories, tools } = require('../../data/tools');
const { getFavoriteToolIds } = require('../../utils/storage');

function filterTools({ activeCategory, query, favoriteIds }) {
  const lowerQuery = query.trim().toLowerCase();
  return tools.filter((tool) => {
    const categoryMatch =
      activeCategory === 'all' ||
      activeCategory === 'favorites' ||
      tool.miniCategorySlug === activeCategory;
    const queryMatch =
      !lowerQuery ||
      [tool.title, tool.description, tool.miniCategoryTitle, ...(tool.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(lowerQuery);
    const favoriteMatch = activeCategory !== 'favorites' || favoriteIds.includes(tool.id);
    return categoryMatch && queryMatch && favoriteMatch;
  });
}

Page({
  data: {
    categories: [
      { slug: 'all', title: '全部', description: '29 个工具' },
      { slug: 'favorites', title: '收藏', description: '常用工具' },
      ...categories,
    ],
    activeCategory: 'all',
    query: '',
    favoriteIds: [],
    visibleTools: tools,
  },

  onShow() {
    const favoriteIds = getFavoriteToolIds();
    this.setData({
      favoriteIds,
      visibleTools: filterTools({
        activeCategory: this.data.activeCategory,
        query: this.data.query,
        favoriteIds,
      }),
    });
  },

  setCategory(event) {
    const activeCategory = event.currentTarget.dataset.slug;
    const visibleTools = filterTools({
      activeCategory,
      query: this.data.query,
      favoriteIds: this.data.favoriteIds,
    });
    this.setData({ activeCategory, visibleTools });
  },

  handleSearchInput(event) {
    const query = event.detail.value;
    const visibleTools = filterTools({
      activeCategory: this.data.activeCategory,
      query,
      favoriteIds: this.data.favoriteIds,
    });
    this.setData({ query, visibleTools });
  },

  openTool(event) {
    const tool = event.detail;
    if (!tool?.slug) return;
    wx.navigateTo({
      url: `/pages/tool-runtime/index?slug=${tool.slug}`,
    });
  },
});
```

- [ ] **Step 3: Create page markup**

Create `miniapp/pages/tools/index.wxml` with:

```xml
<view class="page tools-page">
  <view class="tools-header">
    <view class="tools-header__title">全部工具</view>
    <view class="tools-header__desc">只包含工具，不包含游戏。</view>
  </view>

  <view class="search-box">
    <input
      class="search-box__input"
      value="{{query}}"
      placeholder="搜索工具、说明或标签"
      confirm-type="search"
      bindinput="handleSearchInput"
    />
  </view>

  <scroll-view scroll-x class="category-strip">
    <button
      wx:for="{{categories}}"
      wx:key="slug"
      class="category-chip {{activeCategory === item.slug ? 'category-chip--active' : ''}}"
      data-slug="{{item.slug}}"
      bindtap="setCategory"
    >
      {{item.title}}
    </button>
  </scroll-view>

  <view class="tool-count">已显示 {{visibleTools.length}} 个工具</view>

  <view class="tool-list">
    <block wx:for="{{visibleTools}}" wx:key="id">
      <tool-card tool="{{item}}" bind:open="openTool" />
    </block>
  </view>

  <view wx:if="{{!visibleTools.length}}" class="empty surface">
    <view class="empty__title">没有找到工具</view>
    <view class="empty__desc">换一个关键词，或切回全部分类。</view>
  </view>
</view>
```

- [ ] **Step 4: Create page styles**

Create `miniapp/pages/tools/index.wxss` with:

```css
.tools-header {
  padding: 30rpx;
  border-radius: 30rpx;
  background: #ffffff;
}

.tools-header__title {
  color: #1a1c1a;
  font-size: 44rpx;
  font-weight: 950;
}

.tools-header__desc {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 26rpx;
}

.search-box {
  margin-top: 24rpx;
}

.search-box__input {
  min-height: 92rpx;
  padding: 0 28rpx;
  border-radius: 24rpx;
  background: #ffffff;
  color: #1a1c1a;
  font-size: 28rpx;
}

.category-strip {
  margin-top: 22rpx;
  white-space: nowrap;
}

.category-chip {
  display: inline-flex;
  min-height: 72rpx;
  margin-right: 12rpx;
  align-items: center;
  border-radius: 999rpx;
  background: #f1f2ee;
  color: #615e59;
  font-size: 26rpx;
  font-weight: 800;
}

.category-chip::after {
  border: 0;
}

.category-chip--active {
  background: #3f6751;
  color: #ffffff;
}

.tool-count {
  margin: 20rpx 4rpx 12rpx;
  color: #615e59;
  font-size: 24rpx;
}

.tool-list {
  display: grid;
  gap: 16rpx;
}

.empty {
  margin-top: 24rpx;
  padding: 36rpx;
  text-align: center;
}

.empty__title {
  color: #1a1c1a;
  font-size: 30rpx;
  font-weight: 900;
}

.empty__desc {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 24rpx;
}
```

- [ ] **Step 5: Run static verification and confirm expected missing-page failure remains**

Run:

```bash
npm run verify:miniapp
```

Expected: FAIL because `miniapp/pages/profile/index.js` and `miniapp/pages/tool-runtime/index.js` do not exist yet.

- [ ] **Step 6: Commit**

```bash
git add miniapp/pages/tools
git commit -m "feat: add mini program tools tab"
```

---

### Task 7: Implement The Profile Tab

**Files:**

- Create: `miniapp/pages/profile/index.json`
- Create: `miniapp/pages/profile/index.js`
- Create: `miniapp/pages/profile/index.wxml`
- Create: `miniapp/pages/profile/index.wxss`

- [ ] **Step 1: Create page configuration**

Create `miniapp/pages/profile/index.json` with:

```json
{
  "navigationBarTitleText": "我的"
}
```

- [ ] **Step 2: Create page logic**

Create `miniapp/pages/profile/index.js` with:

```js
const {
  clearMiniProgramLocalData,
  getFavoriteToolIds,
  getRecentTools,
} = require('../../utils/storage');

Page({
  data: {
    favoriteCount: 0,
    recentCount: 0,
  },

  onShow() {
    this.refreshStats();
  },

  refreshStats() {
    this.setData({
      favoriteCount: getFavoriteToolIds().length,
      recentCount: getRecentTools().length,
    });
  },

  clearLocalData() {
    wx.showModal({
      title: '清理本地数据',
      content: '这会清空收藏和最近使用记录，不影响当前 Web 端。',
      confirmText: '清理',
      confirmColor: '#C2410C',
      success: (result) => {
        if (!result.confirm) return;
        clearMiniProgramLocalData();
        this.refreshStats();
        wx.showToast({
          title: '已清理',
          icon: 'success',
        });
      },
    });
  },
});
```

- [ ] **Step 3: Create page markup**

Create `miniapp/pages/profile/index.wxml` with:

```xml
<view class="page profile-page">
  <view class="profile-header">
    <view class="profile-header__title">我的</view>
    <view class="profile-header__desc">本地数据、隐私说明和工具偏好。</view>
  </view>

  <view class="stats-grid section">
    <view class="stat-card surface">
      <view class="stat-card__value">{{favoriteCount}}</view>
      <view class="stat-card__label">收藏工具</view>
    </view>
    <view class="stat-card surface">
      <view class="stat-card__value">{{recentCount}}</view>
      <view class="stat-card__label">最近使用</view>
    </view>
  </view>

  <view class="settings-list section surface">
    <view class="settings-row">
      <view>
        <view class="settings-row__title">隐私说明</view>
        <view class="settings-row__desc">工具输入默认本地处理，敏感内容不写入最近明文。</view>
      </view>
    </view>
    <view class="settings-row">
      <view>
        <view class="settings-row__title">数据边界</view>
        <view class="settings-row__desc">小程序数据和当前 Web 端数据分开保存。</view>
      </view>
    </view>
    <button class="settings-action" bindtap="clearLocalData">清理收藏和最近使用</button>
  </view>
</view>
```

- [ ] **Step 4: Create page styles**

Create `miniapp/pages/profile/index.wxss` with:

```css
.profile-header {
  padding: 30rpx;
  border-radius: 30rpx;
  background: linear-gradient(135deg, #ffffff, #eef8f2);
}

.profile-header__title {
  color: #1a1c1a;
  font-size: 44rpx;
  font-weight: 950;
}

.profile-header__desc {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 26rpx;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
}

.stat-card {
  padding: 28rpx;
  text-align: center;
}

.stat-card__value {
  color: #3f6751;
  font-size: 48rpx;
  font-weight: 950;
}

.stat-card__label {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 24rpx;
}

.settings-list {
  overflow: hidden;
}

.settings-row {
  padding: 26rpx;
  border-bottom: 1rpx solid rgba(226, 227, 223, 0.9);
}

.settings-row__title {
  color: #1a1c1a;
  font-size: 30rpx;
  font-weight: 850;
}

.settings-row__desc {
  margin-top: 8rpx;
  color: #615e59;
  font-size: 24rpx;
  line-height: 1.5;
}

.settings-action {
  width: calc(100% - 40rpx);
  min-height: 88rpx;
  margin: 20rpx;
  border-radius: 22rpx;
  background: #fff3ed;
  color: #c2410c;
  font-size: 28rpx;
  font-weight: 850;
}

.settings-action::after {
  border: 0;
}
```

- [ ] **Step 5: Run static verification and confirm expected missing runtime failure remains**

Run:

```bash
npm run verify:miniapp
```

Expected: FAIL because `miniapp/pages/tool-runtime/index.js` does not exist yet.

- [ ] **Step 6: Commit**

```bash
git add miniapp/pages/profile
git commit -m "feat: add mini program profile tab"
```

---

### Task 8: Implement The Tool Runtime Entry

**Files:**

- Create: `miniapp/pages/tool-runtime/index.json`
- Create: `miniapp/pages/tool-runtime/index.js`
- Create: `miniapp/pages/tool-runtime/index.wxml`
- Create: `miniapp/pages/tool-runtime/index.wxss`

- [ ] **Step 1: Create page configuration**

Create `miniapp/pages/tool-runtime/index.json` with:

```json
{
  "navigationBarTitleText": "工具",
  "usingComponents": {
    "tool-shell": "../../components/tool-shell/index",
    "bottom-action-bar": "../../components/bottom-action-bar/index",
    "result-card": "../../components/result-card/index"
  }
}
```

- [ ] **Step 2: Create page logic**

Create `miniapp/pages/tool-runtime/index.js` with:

```js
const { tools } = require('../../data/tools');
const { isFavoriteTool, recordRecentTool, toggleFavoriteTool } = require('../../utils/storage');

function findTool(slug) {
  return tools.find((tool) => tool.slug === slug);
}

Page({
  data: {
    slug: '',
    tool: null,
    favorite: false,
    statusTitle: '工具工作台',
    statusContent: '基础入口已建立。每个工具的专属交互会按工具批次接入。',
  },

  onLoad(options) {
    const slug = options.slug || '';
    const tool = findTool(slug);

    if (!tool) {
      wx.setNavigationBarTitle({ title: '工具不存在' });
      this.setData({
        slug,
        statusTitle: '没有找到工具',
        statusContent: '请返回工具列表重新选择。',
      });
      return;
    }

    recordRecentTool(tool);
    wx.setNavigationBarTitle({ title: tool.title });
    this.setData({
      slug,
      tool,
      favorite: isFavoriteTool(tool.id),
      statusTitle: tool.title,
      statusContent: `${tool.miniCategoryTitle} · ${tool.workbenchType}`,
    });
  },

  handlePrimaryAction() {
    if (this.data.tool) {
      this.copyToolSummary();
      return;
    }
    this.backToTools();
  },

  toggleFavorite() {
    if (!this.data.tool) return;
    const nextFavorites = toggleFavoriteTool(this.data.tool.id);
    this.setData({
      favorite: nextFavorites.includes(this.data.tool.id),
    });
    wx.showToast({
      title: this.data.favorite ? '已收藏' : '已取消',
      icon: 'success',
    });
  },

  copyToolSummary() {
    if (!this.data.tool) return;
    wx.setClipboardData({
      data: `${this.data.tool.title}：${this.data.tool.description}`,
    });
  },

  backToTools() {
    wx.switchTab({
      url: '/pages/tools/index',
    });
  },
});
```

- [ ] **Step 3: Create page markup**

Create `miniapp/pages/tool-runtime/index.wxml` with:

```xml
<view class="page runtime-page">
  <tool-shell wx:if="{{tool}}" tool="{{tool}}" favorite="{{favorite}}" bind:favorite="toggleFavorite">
    <result-card title="{{statusTitle}}" content="{{statusContent}}" tone="success" />

    <view class="runtime-section surface">
      <view class="runtime-section__title">小程序任务流</view>
      <view class="runtime-section__desc">{{tool.description}}</view>
      <view class="runtime-section__meta">分类：{{tool.miniCategoryTitle}}</view>
      <view class="runtime-section__meta">工作台类型：{{tool.workbenchType}}</view>
    </view>
  </tool-shell>

  <view wx:else class="runtime-empty surface">
    <view class="runtime-empty__title">{{statusTitle}}</view>
    <view class="runtime-empty__desc">{{statusContent}}</view>
  </view>

  <bottom-action-bar
    primaryText="{{tool ? '复制工具说明' : '返回工具'}}"
    secondaryText="{{tool ? '返回工具' : ''}}"
    bind:primary="handlePrimaryAction"
    bind:secondary="backToTools"
  />
</view>
```

- [ ] **Step 4: Create page styles**

Create `miniapp/pages/tool-runtime/index.wxss` with:

```css
.runtime-section {
  margin-top: 24rpx;
  padding: 26rpx;
}

.runtime-section__title,
.runtime-empty__title {
  color: #1a1c1a;
  font-size: 30rpx;
  font-weight: 900;
}

.runtime-section__desc,
.runtime-empty__desc {
  margin-top: 10rpx;
  color: #615e59;
  font-size: 26rpx;
  line-height: 1.6;
}

.runtime-section__meta {
  margin-top: 12rpx;
  color: #3f6751;
  font-size: 24rpx;
  font-weight: 800;
}

.runtime-empty {
  margin-top: 180rpx;
  padding: 36rpx;
  text-align: center;
}
```

- [ ] **Step 5: Run static verification and confirm it passes**

Run:

```bash
npm run verify:miniapp
```

Expected: PASS with:

```text
Mini program foundation verified.
```

- [ ] **Step 6: Run Web tests that protect existing behavior**

Run:

```bash
npm test -- miniProgramCatalog.test.ts
npm run typecheck
```

Expected: both PASS.

- [ ] **Step 7: Commit**

```bash
git add miniapp/pages/tool-runtime
git commit -m "feat: add mini program tool runtime shell"
```

---

### Task 9: Final Verification And Documentation Note

**Files:**

- Modify: `README.md`

- [ ] **Step 1: Add a mini program development note to README**

In `README.md`, add this section after the local run commands:

````md
## 工具小程序

本仓库包含一个独立的工具小程序基础工程，目录为 `miniapp/`。小程序只包含工具，不包含游戏；当前 Web 端仍保留工具与游戏。

常用命令：

```bash
npm run generate:miniapp # 从现有工具目录生成 miniapp/data/tools.js
npm run verify:miniapp   # 校验三 Tab、29 个工具和无游戏入口
```
````

小程序设计文档见 `docs/superpowers/specs/2026-05-18-tools-mini-program-design.md`。

````

- [ ] **Step 2: Run all focused verification**

Run:

```bash
npm run generate:miniapp
npm run verify:miniapp
npm test -- miniProgramCatalog.test.ts
npm run typecheck
````

Expected:

- `generate:miniapp`: prints `Generated 29 mini program tools`.
- `verify:miniapp`: prints `Mini program foundation verified.`
- Vitest: mini program catalog tests pass.
- Typecheck: exits successfully.

- [ ] **Step 3: Check that Web build still works**

Run:

```bash
npm run build
```

Expected: PASS. The generated Web build should not include `miniapp/` as an app route.

- [ ] **Step 4: Inspect working tree**

Run:

```bash
git status --short
```

Expected: only the README change is unstaged before the final commit, plus any pre-existing unrelated changes that were already present before this plan execution.

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "docs: document mini program foundation"
```

## Plan Self-Review

Spec coverage:

- Three Tab architecture is covered by Tasks 3, 5, 6, and 7.
- Tools-only catalog and no games are covered by Tasks 1, 2, and 8.
- Web remains separate because no existing Web routes or pages are changed.
- Shared reusable shell components are covered by Task 4.
- Recent, favorite, and local data basics are covered by Tasks 4, 5, 6, 7, and 8.
- Static verification and Web safety checks are covered by Tasks 2, 8, and 9.

Follow-up plans after this foundation:

- Plan 2: quick-calc and focus tools: calculator, unit converter, timer, pomodoro, date, random number, tip, BMI.
- Plan 3: text and developer tools: word counter, Markdown, JSON, Base64, URL, color, text diff, case, lorem, text-to-speech.
- Plan 4: device and document tools: QR code, compass, scanner, weather, IP, Word/PDF.
- Plan 5: local-data tools: review nest and bookkeeping.
