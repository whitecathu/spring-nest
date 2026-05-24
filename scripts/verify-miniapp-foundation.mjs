import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const expectedTabs = [
  { id: 'home', text: '首页', textEn: 'Home', pagePath: 'pages/home/index' },
  { id: 'tools', text: '工具', textEn: 'Tools', pagePath: 'pages/tools/index' },
  { id: 'profile', text: '我的', textEn: 'Me', pagePath: 'pages/profile/index' },
];

const expectedCategories = [
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

const expectedToolSlugs = [
  'calculator',
  'pomodoro',
  'converter',
  'password',
  'qrcode',
  'compass',
  'scanner',
  'weather',
  'random-picker',
  'timer-stopwatch',
  'word-counter',
  'markdown-preview',
  'json-formatter',
  'base64-codec',
  'url-codec',
  'color-converter',
  'date-calculator',
  'text-diff',
  'lorem-generator',
  'ip-lookup',
  'tip-calculator',
  'case-converter',
  'random-number',
  'bmi-calculator',
  'text-to-speech',
  'word-to-pdf',
  'pdf-to-word',
  'question-bank-importer',
  'bookkeeping',
];

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

function walkFiles(root) {
  const base = resolve(root);
  const files = [];
  for (const entry of readdirSync(base)) {
    const absolute = resolve(base, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) files.push(...walkFiles(absolute));
    else files.push(absolute);
  }
  return files;
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
assertSameJson(
  appJson.pages,
  expectedPages,
  'miniapp/app.json pages must match the foundation pages',
);
assert(
  !appJson.pages.some((page) => page.includes('game')),
  'miniapp pages must not include games',
);

assert(appJson.tabBar?.list?.length === 3, 'tabBar must have exactly three tabs');
assert(
  appJson.tabBar.list.map((tab) => tab.text).join(',') === '首页,工具,我的',
  'tabBar labels must be 首页,工具,我的',
);

assert(generated.tabs.length === 3, 'generated tabs must have three entries');
assert(generated.tools.length === 29, 'generated tool catalog must have 29 tools');
assertSameJson(generated.tabs, expectedTabs, 'generated tabs changed unexpectedly');
assertSameJson(
  generated.categories,
  expectedCategories,
  'generated categories changed unexpectedly',
);
assertSameJson(
  generated.tools.map((tool) => tool.slug),
  expectedToolSlugs,
  'generated tools must keep the expected 29 miniapp slugs',
);
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
  'miniapp/project.config.json',
  'miniapp/app.json',
  'miniapp/app.js',
  'miniapp/app.wxss',
  'miniapp/sitemap.json',
  'miniapp/data/tools.js',
  'miniapp/utils/tool-engines.js',
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

for (const file of walkFiles('miniapp')) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file]);
  if (file.endsWith('.json')) JSON.parse(readFileSync(file, 'utf8'));
}

const toolsPageJs = readText('miniapp/pages/tools/index.js');
assert(toolsPageJs.includes("slug: 'recent'"), 'tools tab must include a recent category');
assert(toolsPageJs.includes('getRecentTools'), 'tools tab must read recent tools');

const runtimeJs = readText('miniapp/pages/tool-runtime/index.js');
const runtimeWxml = readText('miniapp/pages/tool-runtime/index.wxml');
for (const tool of generated.tools) {
  assert(
    runtimeJs.includes(`case '${tool.slug}'`) || runtimeJs.includes(`case "${tool.slug}"`),
    `${tool.slug} must have a dedicated miniapp runtime branch`,
  );
}
for (const forbidden of [
  '基础入口已建立',
  '专属交互会按工具批次接入',
  '工具工作台',
  '开发中',
  '敬请期待',
  'coming soon',
  '占位工作台',
  '后续解析器',
  '后续接入',
  '伪码',
]) {
  assert(!runtimeJs.includes(forbidden), `runtime JS contains placeholder text: ${forbidden}`);
  assert(!runtimeWxml.includes(forbidden), `runtime WXML contains placeholder text: ${forbidden}`);
}
assert(
  !runtimeJs.includes('copyToolSummary'),
  'runtime must not use copy-only summary as the main tool result',
);
assert(runtimeWxml.includes('bindtap="handleAction"'), 'runtime must expose tool actions');
assert(
  runtimeWxml.includes('bindinput="handleFieldInput"'),
  'runtime must expose editable tool inputs',
);
assert(runtimeJs.includes('engines.createQrCode'), 'qrcode must use the QR encoder');
assert(!runtimeJs.includes('makeCodePreview'), 'qrcode must not use seeded fake QR preview');
assert(runtimeWxml.includes('card.qrSize'), 'qrcode grid must render dynamic QR matrix size');
assert(
  runtimeJs.includes("{ label: '背答案', value: 'answer' }"),
  'question bank must support answer-first review mode',
);
assert(
  runtimeJs.includes('this.data.form.qbSearch') && runtimeJs.includes('includes(keyword)'),
  'question bank marked list must apply search filtering',
);
assert(
  runtimeJs.includes('importQuestionBankArchive'),
  'question bank must attempt docx/zip archive import',
);
assert(runtimeJs.includes('this.ipLookupRequestId'), 'IP lookup must guard stale async responses');
assert(runtimeJs.includes('card.fullCopy'), 'copy action must support complete export payloads');

console.log('Mini program foundation verified.');
