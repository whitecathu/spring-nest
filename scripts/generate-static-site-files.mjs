import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const fallbackOrigin = 'https://spring-nest.pages.dev';

function normalizeOrigin(value) {
  if (!value) return fallbackOrigin;
  try {
    return new URL(value).origin;
  } catch {
    return fallbackOrigin;
  }
}

function extractRoutes(relativePath, prefix) {
  const content = readFileSync(resolve(root, relativePath), 'utf8');
  return [...content.matchAll(/route:\s*['"`](\/[^'"`]+)['"`]/g)]
    .map((match) => match[1])
    .filter((route) => route.startsWith(prefix));
}

function extractCategoryRoutes() {
  const content = readFileSync(resolve(root, 'src/lib/catalogRoutes.ts'), 'utf8');
  const toolRoutes = content.match(/toolCategoryRoutes[\s\S]*?];/m)?.[0] ?? '';
  const gameRoutes = content.match(/gameCategoryRoutes[\s\S]*?];/m)?.[0] ?? '';
  const slugs = (block, prefix) => [...block.matchAll(/slug:\s*['"`]([^'"`]+)['"`]/g)].map((match) => `/${prefix}/${match[1]}`);
  return [...slugs(toolRoutes, 'tools'), ...slugs(gameRoutes, 'games')];
}

const siteOrigin = normalizeOrigin(process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.VITE_PUBLIC_SITE_URL);
const publicRoutes = [
  '/',
  '/tools',
  '/games',
  '/about',
  '/privacy',
  '/terms',
  '/feedback',
  '/search',
  '/leaderboard',
  ...extractCategoryRoutes(),
  ...extractRoutes('src/data/tools.ts', '/tools/'),
  ...extractRoutes('src/data/games.ts', '/games/'),
];

const uniqueRoutes = [...new Set(publicRoutes)].sort((a, b) => {
  if (a === '/') return -1;
  if (b === '/') return 1;
  return a.localeCompare(b);
});

const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${uniqueRoutes
  .map((route) => `  <url><loc>${siteOrigin}${route}</loc><lastmod>${today}</lastmod></url>`)
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /profile
Disallow: /favorites
Disallow: /admin

Sitemap: ${siteOrigin}/sitemap.xml
`;

writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap);
writeFileSync(resolve(root, 'public/robots.txt'), robots);
console.log(`Generated sitemap.xml and robots.txt for ${siteOrigin} with ${uniqueRoutes.length} routes.`);
