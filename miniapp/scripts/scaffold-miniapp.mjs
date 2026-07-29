/**
 * One-shot scaffold for WeChat mini-program shell.
 * Run: node miniapp/scripts/scaffold-miniapp.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import zlib from 'zlib';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const UNTITLED_FONTS = 'G:/untitled/node_modules/@fontsource';

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function write(rel, content) {
  const full = path.join(ROOT, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, content, 'utf8');
  console.log('write', rel);
}

function pageStub(title, bodyText = '') {
  return {
    js: `Page({\n  data: { title: ${JSON.stringify(title)} }\n});\n`,
    json: `{\n  "navigationBarTitleText": ${JSON.stringify(title)},\n  "usingComponents": {}\n}\n`,
    wxml: `<view class="page-pad">\n  <view class="glass-card card-pad">\n    <view class="text-headline-sm text-primary">{{title}}</view>\n    <view class="text-body-sm text-muted mt-sm">${bodyText || '占位页面，稍后完善。'}</view>\n  </view>\n</view>\n`,
    wxss: `.mt-sm { margin-top: 8px; }\n.text-muted { color: var(--on-surface-variant); }\n`,
  };
}

function writePage(relDir, files) {
  write(`${relDir}/index.js`, files.js);
  write(`${relDir}/index.json`, files.json);
  write(`${relDir}/index.wxml`, files.wxml);
  write(`${relDir}/index.wxss`, files.wxss);
}

// --- Minimal PNG (81x81 solid color) via uncompressed IHDR+IDAT ---
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  const crc = crc32(Buffer.concat([typeBuf, data]));
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function solidPng(size, r, g, b) {
  const width = size;
  const height = size;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const i = row + 1 + x * 3;
      raw[i] = r;
      raw[i + 1] = g;
      raw[i + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const compressed = zlib.deflateSync(raw);
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writePng(rel, r, g, b, size = 81) {
  const full = path.join(ROOT, rel);
  ensureDir(path.dirname(full));
  fs.writeFileSync(full, solidPng(size, r, g, b));
  console.log('png', rel);
}

// Copy fonts (latin + a chinese subset if available)
function copyFonts() {
  const dest = path.join(ROOT, 'assets/fonts');
  ensureDir(dest);
  const picks = [
    ['noto-serif-sc', 'noto-serif-sc-latin-700-normal.woff', 'NotoSerifSC-Bold.woff'],
    // Skip full Chinese Noto (~2MB) — exceeds WeChat main package budget; use Songti SC fallback.
    ['nunito-sans', 'nunito-sans-latin-400-normal.woff', 'NunitoSans-Regular.woff'],
    ['nunito-sans', 'nunito-sans-latin-700-normal.woff', 'NunitoSans-Bold.woff'],
    ['plus-jakarta-sans', 'plus-jakarta-sans-latin-400-normal.woff', 'PlusJakartaSans-Regular.woff'],
    ['plus-jakarta-sans', 'plus-jakarta-sans-latin-600-normal.woff', 'PlusJakartaSans-SemiBold.woff'],
  ];
  for (const [pkg, srcName, destName] of picks) {
    const src = path.join(UNTITLED_FONTS, pkg, 'files', srcName);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dest, destName));
      console.log('font', destName);
    } else {
      console.warn('missing font', src);
      // touch placeholder
      fs.writeFileSync(path.join(dest, destName + '.placeholder'), '');
    }
  }
}

// ========== CORE ==========
write('project.config.json', JSON.stringify({
  description: '春日小筑 WeChat Mini Program',
  packOptions: { ignore: [], include: [] },
  setting: {
    bundle: false,
    es6: true,
    postcss: true,
    minified: true,
    urlCheck: false,
    coverView: true,
    lazyloadPlaceholderEnable: false,
  },
  compileType: 'miniprogram',
  libVersion: '3.5.5',
  appid: 'touristappid',
  projectname: 'spring-nest-miniapp',
  condition: {},
  miniprogramRoot: './',
}, null, 2) + '\n');

write('sitemap.json', JSON.stringify({
  desc: '关于本文件的更多信息，请参考文档 https://developers.weixin.qq.com/miniprogram/dev/framework/sitemap.html',
  rules: [{ action: 'allow', page: '*' }],
}, null, 2) + '\n');

write('app.js', `App({
  onLaunch() {
    // Spring Nest mini-program shell
  },
  globalData: {
    brand: '春日小筑',
  },
});
`);

write('app.json', JSON.stringify({
  pages: [
    'pages/discover/index',
    'pages/development/index',
    'pages/efficiency/index',
    'pages/profile/index',
    'pages/favorites/index',
    'pages/history/index',
    'pages/about/index',
    'pages/tool-runtime/index',
  ],
  window: {
    navigationBarBackgroundColor: '#fef8f2',
    navigationBarTitleText: '春日小筑',
    navigationBarTextStyle: 'black',
    backgroundColor: '#fef8f2',
    backgroundTextStyle: 'dark',
  },
  tabBar: {
    color: '#717973',
    selectedColor: '#274f3a',
    backgroundColor: '#fef8f2',
    borderStyle: 'white',
    list: [
      { pagePath: 'pages/discover/index', text: '发现', iconPath: 'assets/icons/tab-discover.png', selectedIconPath: 'assets/icons/tab-discover-active.png' },
      { pagePath: 'pages/development/index', text: '开发', iconPath: 'assets/icons/tab-dev.png', selectedIconPath: 'assets/icons/tab-dev-active.png' },
      { pagePath: 'pages/efficiency/index', text: '效率', iconPath: 'assets/icons/tab-efficiency.png', selectedIconPath: 'assets/icons/tab-efficiency-active.png' },
      { pagePath: 'pages/profile/index', text: '我的', iconPath: 'assets/icons/tab-profile.png', selectedIconPath: 'assets/icons/tab-profile-active.png' },
    ],
  },
  subpackages: [
    {
      root: 'packageStudy',
      name: 'packageStudy',
      pages: [
        'pages/home/index',
        'pages/import/index',
        'pages/set-detail/index',
        'pages/practice/index',
        'pages/incorrect/index',
        'pages/favorites/index',
        'pages/stats/index',
      ],
    },
    {
      root: 'packageTools',
      name: 'packageTools',
      pages: [
        'pages/scanner/index',
        'pages/bookkeeping/index',
        'pages/word-to-pdf/index',
        'pages/pdf-to-word/index',
      ],
    },
  ],
  style: 'v2',
  sitemapLocation: 'sitemap.json',
  lazyCodeLoading: 'requiredComponents',
}, null, 2) + '\n');

write('app.wxss', `/* Spring Nest design tokens — matching untitled App (warm cream + forest green) */

@font-face {
  font-family: "Noto Serif SC";
  src: url("/assets/fonts/NotoSerifSC-Bold.woff") format("woff");
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "Nunito Sans";
  src: url("/assets/fonts/NunitoSans-Regular.woff") format("woff");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Nunito Sans";
  src: url("/assets/fonts/NunitoSans-Bold.woff") format("woff");
  font-weight: 700;
  font-display: swap;
}

@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("/assets/fonts/PlusJakartaSans-Regular.woff") format("woff");
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: "Plus Jakarta Sans";
  src: url("/assets/fonts/PlusJakartaSans-SemiBold.woff") format("woff");
  font-weight: 600;
  font-display: swap;
}

page {
  --surface: #fef8f2;
  --surface-dim: #ded9d3;
  --surface-bright: #fef8f2;
  --surface-container-lowest: #ffffff;
  --surface-container-low: #f8f3ec;
  --surface-container: #f3ede6;
  --surface-container-high: #ede7e1;
  --surface-container-highest: #e7e2db;
  --on-surface: #1d1b18;
  --on-surface-variant: #414943;
  --inverse-surface: #32302c;
  --inverse-on-surface: #f6f0e9;
  --outline: #717973;
  --outline-variant: #c1c8c1;
  --surface-tint: #3f6751;
  --primary: #274f3a;
  --on-primary: #ffffff;
  --primary-container: #3f6751;
  --on-primary-container: #b7e3c8;
  --inverse-primary: #a5d0b6;
  --secondary: #336a3a;
  --on-secondary: #ffffff;
  --secondary-container: #b4f2b5;
  --on-secondary-container: #397040;
  --tertiary: #604033;
  --on-tertiary: #ffffff;
  --tertiary-container: #7a5749;
  --on-tertiary-container: #ffd0be;
  --error: #ba1a1a;
  --on-error: #ffffff;
  --error-container: #ffdad6;
  --on-error-container: #93000a;
  --primary-fixed: #c0edd1;
  --primary-fixed-dim: #a5d0b6;
  --on-primary-fixed: #002112;
  --on-primary-fixed-variant: #274e3a;
  --secondary-fixed: #b4f2b5;
  --secondary-fixed-dim: #99d59b;
  --on-secondary-fixed: #002107;
  --on-secondary-fixed-variant: #195125;
  --tertiary-fixed: #ffdbce;
  --tertiary-fixed-dim: #eabdab;
  --on-tertiary-fixed: #2d150a;
  --on-tertiary-fixed-variant: #5f3f32;
  --background: #fef8f2;
  --on-background: #1d1b18;
  --font-serif: "Noto Serif SC", "Songti SC", "Noto Serif", serif;
  --font-sans: "Plus Jakarta Sans", "PingFang SC", "Helvetica Neue", sans-serif;
  --font-heading: "Nunito Sans", "PingFang SC", "Helvetica Neue", sans-serif;
  --radius-card: 24px;
  --radius-chip: 999px;
  --safe-pb: env(safe-area-inset-bottom);
  --safe-pt: env(safe-area-inset-top);

  background: var(--background);
  color: var(--on-background);
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  box-sizing: border-box;
  min-height: 100%;
}

view, text, image, button, input, textarea, scroll-view {
  box-sizing: border-box;
}

.glass-card {
  background: rgba(248, 243, 236, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4px 18px rgba(63, 103, 81, 0.05);
  border-radius: var(--radius-card);
}

.glass-nav {
  background: rgba(254, 248, 242, 0.95);
  border-top: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 0 -2px 14px rgba(63, 103, 81, 0.06);
}

.text-display-lg {
  font-family: var(--font-serif);
  font-size: 28px;
  font-weight: 900;
  line-height: 1.2;
  letter-spacing: -0.02em;
}

.text-headline-md {
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 700;
  line-height: 1.3;
}

.text-headline-sm {
  font-family: var(--font-heading);
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.text-body-lg {
  font-family: var(--font-sans);
  font-size: 16px;
  font-weight: 400;
  line-height: 1.6;
}

.text-body-sm {
  font-family: var(--font-sans);
  font-size: 14px;
  font-weight: 400;
  line-height: 1.5;
}

.text-label-md {
  font-family: var(--font-heading);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.05em;
}

.text-primary { color: var(--primary); }
.text-on-surface { color: var(--on-surface); }
.text-muted { color: var(--on-surface-variant); }
.text-secondary { color: var(--secondary); }
.text-tertiary { color: var(--tertiary); }

.bg-surface { background: var(--surface); }
.bg-primary { background: var(--primary); color: var(--on-primary); }
.bg-primary-container { background: var(--primary-container); color: var(--on-primary-container); }

.page-pad {
  padding: 16px 20px calc(24px + var(--safe-pb));
  min-height: 100vh;
  background: linear-gradient(180deg, rgba(165, 208, 182, 0.18) 0%, transparent 220px), var(--background);
}

.safe-pt { padding-top: max(var(--safe-pt), 8px); }
.safe-pb { padding-bottom: max(var(--safe-pb), 16px); }

.card-pad { padding: 16px; }
.section-gap { margin-top: 28px; }
.row { display: flex; flex-direction: row; align-items: center; }
.col { display: flex; flex-direction: column; }
.flex-1 { flex: 1; min-width: 0; }
.gap-sm { gap: 8px; }
.gap-md { gap: 12px; }
.gap-lg { gap: 16px; }

.btn-primary {
  background: var(--primary);
  color: var(--on-primary);
  border-radius: 999px;
  font-weight: 700;
  font-size: 14px;
  padding: 12px 20px;
  text-align: center;
  border: none;
  line-height: 1.4;
}

.btn-primary::after { border: none; }

.btn-ghost {
  background: rgba(39, 79, 58, 0.08);
  color: var(--primary);
  border-radius: 999px;
  font-weight: 700;
  font-size: 13px;
  padding: 10px 16px;
  text-align: center;
  border: none;
}

.btn-ghost::after { border: none; }

.field {
  width: 100%;
  background: var(--surface-container-high);
  border: 1px solid rgba(193, 200, 193, 0.35);
  border-radius: 18px;
  padding: 12px 14px;
  color: var(--on-surface);
  font-size: 14px;
}

.field-focus {
  border-color: rgba(39, 79, 58, 0.5);
}

.icon-well {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
  flex-shrink: 0;
}

.icon-emoji {
  font-size: 22px;
  line-height: 1;
}

.hide-scrollbar::-webkit-scrollbar { display: none; width: 0; height: 0; }
`);

write('docs/miniapp-qa-log.md', `# Miniapp QA Log

> 春日小筑微信小程序壳层验收记录

## Meta

- Created: 2026-07-24
- Shell: warm cream (#fef8f2) + forest green (#274f3a)
- Source UI reference: G:\\untitled

## Checklist

| Area | Status | Notes |
|------|--------|-------|
| project.config / app.json | pending | |
| Tab bar icons | pending | |
| Discover / Dev / Efficiency / Profile | pending | |
| Favorites / History / About | pending | |
| tool-runtime (29 tools) | pending | |
| packageStudy stubs | pending | |
| packageTools stubs | pending | |
| Design tokens / fonts | pending | |

## Sessions

### 2026-07-24 — Initial scaffold

- Created miniapp shell matching untitled App UI.
- Temporary \`data/tools.js\` stub until catalog generate is ready.

`);

// Icons
writePng('assets/icons/tab-discover.png', 113, 121, 115);
writePng('assets/icons/tab-discover-active.png', 39, 79, 58);
writePng('assets/icons/tab-dev.png', 113, 121, 115);
writePng('assets/icons/tab-dev-active.png', 39, 79, 58);
writePng('assets/icons/tab-efficiency.png', 113, 121, 115);
writePng('assets/icons/tab-efficiency-active.png', 39, 79, 58);
writePng('assets/icons/tab-profile.png', 113, 121, 115);
writePng('assets/icons/tab-profile-active.png', 39, 79, 58);
writePng('assets/icons/leaf.png', 39, 79, 58, 64);

copyFonts();

console.log('core done');
