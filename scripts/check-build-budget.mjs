import { readFileSync, readdirSync, statSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import process from 'node:process';

const distDir = path.resolve(process.cwd(), 'dist');
const indexPath = path.join(distDir, 'index.html');
const html = readFileSync(indexPath, 'utf8');

const toFilePath = (url) =>
  path.join(distDir, decodeURIComponent(url.split(/[?#]/, 1)[0]).replace(/^\/+/, ''));

const gzipBytes = (url) => gzipSync(readFileSync(toFilePath(url))).byteLength;
const unique = (values) => [...new Set(values)];

const initialJs = unique([
  ...[...html.matchAll(/<script[^>]+type="module"[^>]+src="([^"]+)"/g)].map((match) => match[1]),
  ...[...html.matchAll(/<link[^>]+rel="modulepreload"[^>]+href="([^"]+)"/g)].map(
    (match) => match[1],
  ),
]);
const initialCss = unique(
  [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)].map((match) => match[1]),
);

const initialJsGzip = initialJs.reduce((total, url) => total + gzipBytes(url), 0);
const initialCssGzip = initialCss.reduce((total, url) => total + gzipBytes(url), 0);
const preloadedThree = initialJs.filter((url) => {
  return /three(?:-vendor)?|GlassGardenCanvas/i.test(url);
});

const swPath = path.join(distDir, 'sw.js');
const sw = readFileSync(swPath, 'utf8');
const precachedUrls = unique(
  [...sw.matchAll(/\{url:"([^"]+)",revision:/g)].map((match) => match[1]),
).filter((url) => !/^https?:/i.test(url));
const precacheBytes = precachedUrls.reduce((total, url) => {
  const filePath = toFilePath(url);
  try {
    return total + statSync(filePath).size;
  } catch {
    return total;
  }
}, 0);

const limits = {
  initialJsGzip: 250 * 1024,
  initialCssGzip: 40 * 1024,
  precacheBytes: 2.5 * 1024 * 1024,
  backgroundVideo: 9 * 1024 * 1024,
  splashVideo: 1.2 * 1024 * 1024,
  poster: 250 * 1024,
  pagesAsset: 25 * 1024 * 1024,
};

const assetsDir = path.join(distDir, 'assets');
const assetNames = readdirSync(assetsDir);
const findAsset = (prefix, extension) => {
  const matches = assetNames.filter(
    (name) => name.startsWith(`${prefix}-`) && name.endsWith(`.${extension}`),
  );
  if (matches.length !== 1) {
    throw new Error(`Expected one ${prefix} asset, found ${matches.length}: ${matches.join(', ')}`);
  }
  return path.join(assetsDir, matches[0]);
};

const mediaAssets = {
  backgroundVideo: findAsset('bg-stream', 'mp4'),
  splashVideo: findAsset('splash-startup', 'mp4'),
  backgroundPoster: findAsset('bg-poster', 'webp'),
  splashPoster: findAsset('splash-poster', 'webp'),
};

const mediaSizes = Object.fromEntries(
  Object.entries(mediaAssets).map(([name, filePath]) => [name, statSync(filePath).size]),
);

const hasFastStart = (filePath) => {
  const bytes = readFileSync(filePath);
  const moov = bytes.indexOf(Buffer.from('moov'));
  const mdat = bytes.indexOf(Buffer.from('mdat'));
  return moov >= 0 && mdat >= 0 && moov < mdat;
};

const formatKb = (bytes) => `${(bytes / 1024).toFixed(1)} KiB`;
const failures = [];
if (initialJsGzip > limits.initialJsGzip) {
  failures.push(`首屏 JS gzip ${formatKb(initialJsGzip)} 超过 ${formatKb(limits.initialJsGzip)}`);
}
if (initialCssGzip > limits.initialCssGzip) {
  failures.push(
    `首屏 CSS gzip ${formatKb(initialCssGzip)} 超过 ${formatKb(limits.initialCssGzip)}`,
  );
}
if (preloadedThree.length > 0) {
  failures.push(`首屏 preload 包含 Three.js：${preloadedThree.join(', ')}`);
}
if (precacheBytes > limits.precacheBytes) {
  failures.push(`PWA precache ${formatKb(precacheBytes)} 超过 ${formatKb(limits.precacheBytes)}`);
}
if (mediaSizes.backgroundVideo > limits.backgroundVideo) {
  failures.push(
    `背景视频 ${formatKb(mediaSizes.backgroundVideo)} 超过 ${formatKb(limits.backgroundVideo)}`,
  );
}
if (mediaSizes.splashVideo > limits.splashVideo) {
  failures.push(
    `开屏视频 ${formatKb(mediaSizes.splashVideo)} 超过 ${formatKb(limits.splashVideo)}`,
  );
}
for (const key of ['backgroundPoster', 'splashPoster']) {
  if (mediaSizes[key] > limits.poster) {
    failures.push(`${key} ${formatKb(mediaSizes[key])} 超过 ${formatKb(limits.poster)}`);
  }
}
for (const [name, size] of Object.entries(mediaSizes)) {
  if (size > limits.pagesAsset) {
    failures.push(`${name} ${formatKb(size)} 超过 Cloudflare Pages 单文件上限`);
  }
}
for (const key of ['backgroundVideo', 'splashVideo']) {
  if (!hasFastStart(mediaAssets[key])) {
    failures.push(`${key} 缺少 MP4 fast-start 结构（moov 必须位于 mdat 前）`);
  }
}

console.log(
  [
    `Initial JS (gzip): ${formatKb(initialJsGzip)}`,
    `Initial CSS (gzip): ${formatKb(initialCssGzip)}`,
    `PWA precache: ${formatKb(precacheBytes)}`,
    `Background video: ${formatKb(mediaSizes.backgroundVideo)}`,
    `Splash video: ${formatKb(mediaSizes.splashVideo)}`,
    `Background poster: ${formatKb(mediaSizes.backgroundPoster)}`,
    `Splash poster: ${formatKb(mediaSizes.splashPoster)}`,
    `Initial files: ${initialJs.join(', ')}`,
  ].join('\n'),
);

if (failures.length > 0) {
  console.error(`\nBuild budget failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
}
