import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { format } from 'prettier';
import { games } from '../src/data/games';
import { tools } from '../src/data/tools';
import { gameCategoryRoutes, toolCategoryRoutes } from '../src/lib/catalogRoutes';
import type { AppItem } from '../src/types/app';

const root = process.cwd();
const fallbackOrigin = 'https://spring-nest.pages.dev';

function normalizeOrigin(value?: string) {
  if (!value) return fallbackOrigin;
  try {
    return new URL(value).origin;
  } catch {
    return fallbackOrigin;
  }
}

function routeSort(a: string, b: string) {
  if (a === '/') return -1;
  if (b === '/') return 1;
  return a.localeCompare(b);
}

function routeForCategory(prefix: 'tools' | 'games', slug: string) {
  return `/${prefix}/${slug}`;
}

function generatedTable(items: AppItem[], name: 'TOOLS' | 'GAMES') {
  const heading =
    name === 'TOOLS'
      ? `### 工具列表（共 ${items.length} 个）`
      : `### 游戏列表（共 ${items.length} 个）`;
  const noun = name === 'TOOLS' ? '工具' : '游戏';
  const rows = items
    .map((item) => `| [${item.title}](${item.route}) | ${item.description} | ${item.category} |`)
    .join('\n');

  return `${heading}
<!-- AUTO:${name}_START -->
| ${noun} | 功能 | 分类 |
|---|---|---|
${rows}
<!-- AUTO:${name}_END -->`;
}

function statsBlock() {
  return `<!-- AUTO:STATS_START -->
Spring Nest 是一个汇集实用工具与休闲小游戏的 PWA Web 应用，提供 ${tools.length} 个效率工具和 ${games.length} 个休闲小游戏，支持中英双语、本地账号、收藏功能、暗色主题、离线访问和可选的 Supabase 云端同步。
<!-- AUTO:STATS_END -->`;
}

function replaceAutoBlock(content: string, name: string, replacement: string) {
  const start = `<!-- AUTO:${name}_START -->`;
  const end = `<!-- AUTO:${name}_END -->`;
  if (!content.includes(start) || !content.includes(end)) return content;
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);
  return content.replace(pattern, replacement);
}

async function updateReadme() {
  const readmePath = resolve(root, 'README.md');
  let readme = readFileSync(readmePath, 'utf8');

  if (readme.includes('<!-- AUTO:STATS_START -->')) {
    readme = replaceAutoBlock(readme, 'STATS', statsBlock());
  } else {
    readme = readme.replace(/Spring Nest 是一个汇集[\s\S]*?Supabase 云端同步。/, statsBlock());
  }

  if (readme.includes('<!-- AUTO:TOOLS_START -->')) {
    readme = readme.replace(
      /### 工具列表（共 \d+ 个）\s*<!-- AUTO:TOOLS_START -->[\s\S]*?<!-- AUTO:TOOLS_END -->/,
      generatedTable(tools, 'TOOLS'),
    );
  } else {
    readme = readme.replace(
      /### 工具示例（共 \d+ 个）[\s\S]*?(?=\n### 游戏示例)/,
      `${generatedTable(tools, 'TOOLS')}\n`,
    );
  }

  if (readme.includes('<!-- AUTO:GAMES_START -->')) {
    readme = readme.replace(
      /### 游戏列表（共 \d+ 个）\s*<!-- AUTO:GAMES_START -->[\s\S]*?<!-- AUTO:GAMES_END -->/,
      generatedTable(games, 'GAMES'),
    );
  } else {
    readme = readme.replace(
      /### 游戏示例（共 \d+ 个）[\s\S]*?(?=\n## 路由)/,
      `${generatedTable(games, 'GAMES')}\n`,
    );
  }

  readme = readme
    .replace(/├── games\/\s+# \d+ 个游戏/, `├── games/           # ${games.length} 个游戏`)
    .replace(/└── tools\/\s+# \d+ 个工具/, `└── tools/           # ${tools.length} 个工具`)
    .replace(
      /提供 \d+ 个效率工具和 \d+ 个休闲小游戏/g,
      `提供 ${tools.length} 个效率工具和 ${games.length} 个休闲小游戏`,
    )
    .replace(/运行 \d+ 个单元测试/g, `运行 83 个单元测试`);

  writeFileSync(readmePath, await format(readme, { filepath: readmePath }));
}

function updateStaticFiles() {
  const siteOrigin = normalizeOrigin(
    process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.VITE_PUBLIC_SITE_URL,
  );
  const publicRoutes = [
    '/',
    '/tools',
    '/games',
    ...toolCategoryRoutes.map((route) => routeForCategory('tools', route.slug)),
    ...gameCategoryRoutes.map((route) => routeForCategory('games', route.slug)),
    ...tools.map((tool) => tool.route),
    ...games.map((game) => game.route),
    '/favorites',
    '/profile',
    '/about',
    '/search',
    '/feedback',
    '/privacy',
    '/terms',
    '/leaderboard',
    '/offline',
  ];

  const uniqueRoutes = [...new Set(publicRoutes)].sort(routeSort);
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
Disallow: /admin

Sitemap: ${siteOrigin}/sitemap.xml
`;

  writeFileSync(resolve(root, 'public/sitemap.xml'), sitemap);
  writeFileSync(resolve(root, 'public/robots.txt'), robots);
  console.log(
    `Generated README.md, sitemap.xml, and robots.txt for ${siteOrigin} with ${uniqueRoutes.length} routes.`,
  );
}

await updateReadme();
updateStaticFiles();
