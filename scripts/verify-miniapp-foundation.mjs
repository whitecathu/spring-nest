import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

const STRICT = process.env.MINIAPP_VERIFY_STRICT === '1';

const expectedTabs = [
  { id: 'discover', text: '发现', textEn: 'Discover', pagePath: 'pages/discover/index' },
  { id: 'development', text: '开发', textEn: 'Development', pagePath: 'pages/development/index' },
  { id: 'efficiency', text: '效率', textEn: 'Efficiency', pagePath: 'pages/efficiency/index' },
  { id: 'profile', text: '我的', textEn: 'Me', pagePath: 'pages/profile/index' },
];

const expectedCategories = [
  {
    slug: 'daily',
    title: '日常实用',
    titleEn: 'Daily',
    description: '计算、扫描、记账等随手工具',
  },
  { slug: 'fun', title: '趣味工具', titleEn: 'Fun', description: '抽签、颜色与随机数' },
  { slug: 'quick', title: '常用', titleEn: 'Quick', description: '发现页快捷入口' },
  { slug: 'dev', title: '开发辅助', titleEn: 'Dev', description: 'JSON、编码与文本处理' },
  { slug: 'security', title: '安全隐私', titleEn: 'Security', description: '密码与敏感内容处理' },
  { slug: 'time', title: '时间效率', titleEn: 'Time', description: '专注、倒计时、日期推算' },
  { slug: 'learning', title: '学习写作', titleEn: 'Learning', description: '题库、写作与文本处理' },
  { slug: 'doc', title: '文档转换', titleEn: 'Docs', description: '文档格式说明与辅助' },
];

const expectedOfflineSlugs = ['weather', 'ip-lookup', 'text-to-speech'];

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

const expectedPages = [
  'pages/discover/index',
  'pages/development/index',
  'pages/efficiency/index',
  'pages/profile/index',
  'pages/favorites/index',
  'pages/history/index',
  'pages/about/index',
  'pages/privacy/index',
  'pages/tool-runtime/index',
];

const requiredFiles = [
  'miniapp/project.config.json',
  'miniapp/app.json',
  'miniapp/app.js',
  'miniapp/app.wxss',
  'miniapp/sitemap.json',
  'miniapp/data/tools.js',
  'miniapp/utils/storage.js',
  'miniapp/utils/favorites.js',
  'miniapp/utils/history.js',
  'miniapp/utils/toast.js',
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
  'miniapp/pages/discover/index.json',
  'miniapp/pages/discover/index.js',
  'miniapp/pages/discover/index.wxml',
  'miniapp/pages/discover/index.wxss',
  'miniapp/pages/development/index.json',
  'miniapp/pages/development/index.js',
  'miniapp/pages/development/index.wxml',
  'miniapp/pages/development/index.wxss',
  'miniapp/pages/efficiency/index.json',
  'miniapp/pages/efficiency/index.js',
  'miniapp/pages/efficiency/index.wxml',
  'miniapp/pages/efficiency/index.wxss',
  'miniapp/pages/profile/index.json',
  'miniapp/pages/profile/index.js',
  'miniapp/pages/profile/index.wxml',
  'miniapp/pages/profile/index.wxss',
  'miniapp/pages/favorites/index.json',
  'miniapp/pages/favorites/index.js',
  'miniapp/pages/favorites/index.wxml',
  'miniapp/pages/favorites/index.wxss',
  'miniapp/pages/history/index.json',
  'miniapp/pages/history/index.js',
  'miniapp/pages/history/index.wxml',
  'miniapp/pages/history/index.wxss',
  'miniapp/pages/about/index.json',
  'miniapp/pages/about/index.js',
  'miniapp/pages/about/index.wxml',
  'miniapp/pages/about/index.wxss',
  'miniapp/pages/privacy/index.json',
  'miniapp/pages/privacy/index.js',
  'miniapp/pages/privacy/index.wxml',
  'miniapp/pages/privacy/index.wxss',
  'miniapp/utils/auth.js',
  'miniapp/utils/fonts.js',
  'miniapp/pages/tool-runtime/index.json',
  'miniapp/pages/tool-runtime/index.js',
  'miniapp/pages/tool-runtime/index.wxml',
  'miniapp/pages/tool-runtime/index.wxss',
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

assert(appJson.tabBar?.list?.length === 4, 'tabBar must have exactly four tabs');
assert(
  appJson.tabBar.list.map((tab) => tab.text).join(',') === '发现,开发,效率,我的',
  'tabBar labels must be 发现,开发,效率,我的',
);

assert(generated.tabs.length === 4, 'generated tabs must have four entries');
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
assertSameJson(
  generated.offlineSlugs || [],
  expectedOfflineSlugs,
  'offline slugs must match weather / ip-lookup / text-to-speech',
);
assert(
  expectedOfflineSlugs.every((slug) => {
    const tool = generated.tools.find((item) => item.slug === slug);
    return tool && tool.offline === true;
  }),
  'offline tools must be marked offline: true in generated catalog',
);
assert(
  !!appJson.__usePrivacyCheck__,
  'app.json must enable __usePrivacyCheck__ for privacy compliance',
);
assert(
  Array.isArray(appJson.requiredPrivateInfos) && appJson.requiredPrivateInfos.length === 0,
  'requiredPrivateInfos must be empty while location / weather stay offline',
);
assert(
  !appJson.permission || !appJson.permission['scope.userLocation'],
  'location permission should be removed while weather is offline',
);

const projectConfig = readJson('miniapp/project.config.json');
assert(
  projectConfig.setting?.uploadWithSourceMap === false,
  'uploadWithSourceMap must be false for release uploads',
);
assert(
  Array.isArray(projectConfig.packOptions?.ignore) &&
    projectConfig.packOptions.ignore.some(
      (item) => item && item.type === 'folder' && item.value === 'scripts',
    ),
  'packOptions.ignore must exclude scripts/',
);
assert(
  Array.isArray(projectConfig.packOptions?.ignore) &&
    projectConfig.packOptions.ignore.some(
      (item) => item && item.type === 'folder' && item.value === 'docs',
    ),
  'packOptions.ignore must exclude docs/',
);

const appWxss = readText('miniapp/app.wxss');
assert(
  !appWxss.includes('NotoSerifSC-Bold-CN'),
  'app.wxss must not package the full Chinese Noto Serif woff',
);
assert(
  !/@font-face[\s\S]*url\(\s*["']?\/assets\/fonts\//.test(appWxss),
  'app.wxss must not @font-face local /assets/fonts (DevTools 500)',
);
assert(
  !existsSync(resolve('miniapp/assets/fonts/NotoSerifSC-Bold-CN.woff')),
  'NotoSerifSC-Bold-CN.woff must be removed from the miniapp package',
);

const fontsUtil = readText('miniapp/utils/fonts.js');
assert(fontsUtil.includes('loadFontFace'), 'fonts util must use wx.loadFontFace');
assert(
  fontsUtil.includes('spring-nest.pages.dev/fonts/miniapp'),
  'fonts util must point at the site HTTPS font base',
);
assert(
  /ENABLE_REMOTE_FONTS\s*=\s*true/.test(fontsUtil),
  'remote HTTPS fonts must be enabled now that /fonts/miniapp is deployed',
);
const siteFontFiles = [
  'NotoSerifSC-Bold.woff',
  'NunitoSans-Regular.woff',
  'NunitoSans-Bold.woff',
  'PlusJakartaSans-Regular.woff',
  'PlusJakartaSans-SemiBold.woff',
];
for (const file of siteFontFiles) {
  assert(
    existsSync(resolve(`public/fonts/miniapp/${file}`)),
    `site must host miniapp brand font public/fonts/miniapp/${file}`,
  );
  assert(
    existsSync(resolve(`miniapp/assets/fonts/${file}`)),
    `miniapp package must keep base64 fallback font assets/fonts/${file}`,
  );
}
const fontBytes = siteFontFiles.reduce(
  (sum, file) => sum + statSync(resolve(`miniapp/assets/fonts/${file}`)).size,
  0,
);
assert(
  fontBytes < 200 * 1024,
  `miniapp fallback fonts must stay under 200KB (now ${fontBytes} bytes) to protect main-package size`,
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
  generated.tools.every((tool) => tool.tabId && tool.section && tool.bg),
  'every generated tool must include tabId, section, and bg',
);
assert(
  generated.tools.some((tool) => tool.id === 'tool-28'),
  'review nest tool missing',
);
assert(!generated.tabs.some((tab) => tab.id === 'review'), 'review tab must not exist');

for (const file of requiredFiles) {
  assert(existsSync(resolve(file)), `${file} missing`);
  if (file.endsWith('.json')) readJson(file);
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', resolve(file)]);
}

for (const file of walkFiles('miniapp')) {
  if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file]);
  if (file.endsWith('.json')) JSON.parse(readFileSync(file, 'utf8'));
}

const runtimeJs = readText('miniapp/pages/tool-runtime/index.js');
assert(
  /openTool|slug|toolSlug|options\.slug|query\.slug/.test(runtimeJs),
  'tool-runtime must include openTool or slug-based routing',
);

if (STRICT) {
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
  assert(!runtimeJs.includes('wx.getLocation'), 'runtime must not call getLocation while offline');
  assert(!runtimeJs.includes('wttr.in'), 'runtime must not hardcode wttr.in while weather is offline');
  assert(!runtimeJs.includes('ipapi.co'), 'runtime must not hardcode ipapi.co while ip-lookup is offline');
}

console.log(
  STRICT
    ? 'Mini program foundation verified (STRICT).'
    : 'Mini program foundation verified (staged structure + catalog).',
);
