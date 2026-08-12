import { readFileSync, statSync } from 'node:fs';
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

console.log(
  [
    `Initial JS (gzip): ${formatKb(initialJsGzip)}`,
    `Initial CSS (gzip): ${formatKb(initialCssGzip)}`,
    `PWA precache: ${formatKb(precacheBytes)}`,
    `Initial files: ${initialJs.join(', ')}`,
  ].join('\n'),
);

if (failures.length > 0) {
  console.error(`\nBuild budget failed:\n- ${failures.join('\n- ')}`);
  process.exitCode = 1;
}
