import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

const root = process.cwd();
const distRoot = resolve(root, 'dist');
const indexPath = resolve(distRoot, 'index.html');
const sitemapPath = resolve(root, 'public/sitemap.xml');
const fallbackOrigin = 'https://spring-nest.pages.dev';

function normalizeOrigin(value) {
  if (!value) return fallbackOrigin;
  try {
    return new URL(value).origin;
  } catch {
    return fallbackOrigin;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeScriptJson(value) {
  return JSON.stringify(value).replaceAll('</script', '<\\/script');
}

function extractItems(relativePath, type) {
  const content = readFileSync(resolve(root, relativePath), 'utf8');
  const blocks = [...content.matchAll(/\{\s*id:\s*['"`]([^'"`]+)['"`]([\s\S]*?)\n\s*\},/g)].map(
    (match) => match[0],
  );

  return blocks
    .map((block) => {
      const field = (name) =>
        block.match(new RegExp(`${name}:\\s*['"\`]([^'"\`]+)['"\`]`))?.[1] ?? '';
      return {
        id: field('id'),
        type,
        title: field('title'),
        titleEn: field('titleEn'),
        description: field('description'),
        descriptionEn: field('descriptionEn'),
        category: field('category'),
        categoryEn: field('categoryEn'),
        route: field('route'),
      };
    })
    .filter((item) => item.route);
}

function extractCategoryRoutes() {
  const content = readFileSync(resolve(root, 'src/lib/catalogRoutes.ts'), 'utf8');
  const readBlock = (name) => content.match(new RegExp(`${name}[\\s\\S]*?];`, 'm'))?.[0] ?? '';
  const parse = (block, prefix) =>
    [
      ...block.matchAll(
        /\{\s*slug:\s*['"`]([^'"`]+)['"`],\s*category:\s*['"`]([^'"`]+)['"`],\s*label:\s*['"`]([^'"`]+)['"`],\s*labelEn:\s*['"`]([^'"`]+)['"`]/g,
      ),
    ].map((match) => ({
      route: `/${prefix}/${match[1]}`,
      title: match[3],
      titleEn: match[4],
      category: match[2],
      type: prefix,
    }));
  return [
    ...parse(readBlock('toolCategoryRoutes'), 'tools'),
    ...parse(readBlock('gameCategoryRoutes'), 'games'),
  ];
}

const siteOrigin = normalizeOrigin(
  process.env.SITE_URL || process.env.VITE_SITE_URL || process.env.VITE_PUBLIC_SITE_URL,
);
const baseHtml = readFileSync(indexPath, 'utf8');
const routes = [
  ...readFileSync(sitemapPath, 'utf8').matchAll(/<loc>https?:\/\/[^/]+([^<]+)<\/loc>/g),
].map((match) => match[1]);
const tools = extractItems('src/data/tools.ts', 'tool');
const games = extractItems('src/data/games.ts', 'game');
const categories = extractCategoryRoutes();
const itemsByRoute = new Map([...tools, ...games].map((item) => [item.route, item]));
const categoriesByRoute = new Map(categories.map((item) => [item.route, item]));

function routeMeta(route) {
  const item = itemsByRoute.get(route);
  if (item) {
    return {
      title: `${item.title} - Spring Nest 春日小筑`,
      description: item.description,
      type: item.type === 'game' ? 'VideoGame' : 'WebApplication',
      jsonLd: {
        '@context': 'https://schema.org',
        '@type': item.type === 'game' ? 'VideoGame' : 'WebApplication',
        name: `${item.title} ${item.titleEn}`,
        description: item.description,
        url: `${siteOrigin}${route}`,
        applicationCategory: item.type === 'game' ? 'GameApplication' : 'UtilitiesApplication',
        operatingSystem: 'Any',
        inLanguage: ['zh-CN', 'en'],
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
    };
  }

  const category = categoriesByRoute.get(route);
  if (category) {
    const label = category.title;
    return {
      title: `${label} - Spring Nest 春日小筑`,
      description:
        category.type === 'tools'
          ? `${label}收录春日小筑中可直接打开的免费在线工具，支持搜索、收藏和最近使用。`
          : `${label}收录春日小筑中可直接开始的免费小游戏，支持分类浏览和本地记录。`,
      type: 'CollectionPage',
    };
  }

  const staticMeta = {
    '/': [
      '免费在线实用工具与休闲小游戏合集 - Spring Nest 春日小筑',
      '春日小筑提供免费、轻量、无需登录、即开即用的在线实用工具与休闲小游戏。',
    ],
    '/tools': [
      '实用小筑 - 免费在线工具合集',
      '浏览春日小筑全部免费在线工具，支持搜索、分类筛选、排序、收藏和最近使用。',
    ],
    '/games': [
      '游戏天堂 - 免费休闲小游戏合集',
      '浏览春日小筑全部免费休闲小游戏，支持分类筛选、本地最高分和无需登录游玩。',
    ],
    '/about': [
      '关于我们 - Spring Nest 春日小筑',
      '了解 Spring Nest 春日小筑的产品定位、隐私优先理念和工具小游戏合集。',
    ],
    '/privacy': [
      '隐私政策 - Spring Nest 春日小筑',
      '了解春日小筑如何以本地优先方式处理收藏、最近使用、游戏分数、反馈入口和联网工具数据。',
    ],
    '/terms': [
      '服务条款 - Spring Nest 春日小筑',
      '阅读春日小筑在线工具与休闲小游戏的使用规则、责任限制、隐私入口和反馈方式。',
    ],
    '/feedback': [
      '反馈建议 - Spring Nest 春日小筑',
      '通过邮件或配置的反馈入口向春日小筑反馈问题和建议，不提供假提交表单。',
    ],
    '/search': [
      '搜索工具和小游戏 - Spring Nest 春日小筑',
      '搜索春日小筑中的免费在线工具、休闲小游戏、分类和标签。',
    ],
    '/leaderboard': [
      '排行榜 - Spring Nest 春日小筑',
      '查看春日小筑小游戏排行榜。未配置云同步时，游戏分数优先保存在浏览器本地。',
    ],
    '/favorites': [
      '我的收藏 - Spring Nest 春日小筑',
      '查看保存在本地浏览器中的春日小筑工具和小游戏收藏。',
    ],
    '/profile': ['个人中心 - Spring Nest 春日小筑', '管理春日小筑本地账号资料、主题和语言偏好。'],
    '/offline': [
      '离线模式 - Spring Nest 春日小筑',
      '当前网络不可用时，继续访问已缓存的春日小筑页面。',
    ],
  };
  const [title, description] = staticMeta[route] ?? staticMeta['/'];
  return {
    title,
    description,
    type: route === '/' ? 'WebSite' : 'website',
    jsonLd:
      route === '/'
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: 'Spring Nest - 春日小筑',
              url: `${siteOrigin}/`,
              inLanguage: ['zh-CN', 'en'],
              potentialAction: {
                '@type': 'SearchAction',
                target: `${siteOrigin}/search?q={search_term_string}`,
                'query-input': 'required name=search_term_string',
              },
            },
            {
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Spring Nest - 春日小筑',
              url: `${siteOrigin}/`,
              logo: `${siteOrigin}/pwa-512x512.png`,
            },
          ]
        : undefined,
  };
}

function replaceHead(html, route) {
  const meta = routeMeta(route);
  const canonical = `${siteOrigin}${route}`;
  const head = [
    `<title>${escapeHtml(meta.title)}</title>`,
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    `<meta property="og:type" content="${escapeHtml(meta.type === 'VideoGame' || meta.type === 'WebApplication' ? 'website' : meta.type)}">`,
    `<meta property="og:title" content="${escapeHtml(meta.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.description)}">`,
    `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    `<meta property="og:image" content="${escapeHtml(`${siteOrigin}/og-image.png`)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(`${siteOrigin}/og-image.png`)}">`,
    meta.jsonLd
      ? `<script type="application/ld+json">${escapeScriptJson(meta.jsonLd)}</script>`
      : '',
  ]
    .filter(Boolean)
    .join('\n    ');

  const cleanedHtml = html
    .replace(/<meta\b(?=[^>]*\bname=["']description["'])[^>]*>\s*/g, '')
    .replace(/<!-- Canonical URL[\s\S]*?-->/g, '')
    .replace(/<!-- <link rel="canonical"[\s\S]*?-->/g, '')
    .replace(/<link\b(?=[^>]*\brel=["']canonical["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:type["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:title["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:description["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:url["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bproperty=["']og:image["'])[^>]*>\s*/g, '')
    .replace(/<!-- <meta property="og:url"[\s\S]*?-->/g, '')
    .replace(/<meta\b(?=[^>]*\bname=["']twitter:card["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bname=["']twitter:title["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bname=["']twitter:description["'])[^>]*>\s*/g, '')
    .replace(/<meta\b(?=[^>]*\bname=["']twitter:image["'])[^>]*>\s*/g, '')
    .replace(
      /<!-- JSON-LD 结构化数据 -->\s*<script type="application\/ld\+json">[\s\S]*?<\/script>/g,
      '',
    )
    .replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, '');

  return cleanedHtml.replace(/<title>[\s\S]*?<\/title>/, head);
}

for (const route of routes) {
  if (route === '/') {
    writeFileSync(indexPath, replaceHead(baseHtml, route));
    continue;
  }

  const routeDir = join(distRoot, route);
  mkdirSync(routeDir, { recursive: true });
  writeFileSync(join(routeDir, 'index.html'), replaceHead(baseHtml, route));
}

const rootFiles = ['robots.txt', 'sitemap.xml', 'manifest.webmanifest', 'offline.html'];
for (const file of rootFiles) {
  const source = resolve(distRoot, file);
  if (!existsSync(source)) continue;
  for (const route of routes.filter((route) => route !== '/')) {
    const target = join(distRoot, route, file);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(source, target);
  }
}

console.log(`Generated static HTML metadata for ${routes.length} routes using ${siteOrigin}.`);
