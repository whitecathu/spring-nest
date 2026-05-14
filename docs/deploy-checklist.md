# Spring Nest Deploy Checklist

## 1. Local Pre-Deploy Checks

```bash
npm ci
npm run lint        # tsc --noEmit
npm run typecheck   # tsc --noEmit
npm run test        # vitest run
npm run test:e2e    # playwright production preview smoke
npm run build       # vite build
npm run preview     # local preview
```

## 2. Functional Checks

- [ ] Homepage loads with all 6 sections (Hero, Recent, Featured Tools, Featured Games, New Items, Categories)
- [ ] /tools - tool list with category filters
- [ ] /games - game list with category filters
- [ ] /search - search with type tabs, keyword highlighting, empty state recommendations
- [ ] /favorites - empty state with navigation buttons
- [ ] Tool detail page (e.g. /tools/pomodoro) - opens, records recent visit
- [ ] Game detail page (e.g. /games/2048) - opens, records recent visit
- [ ] WhackAMole - 30s timer, combo system, cleanup on exit
- [ ] Recent items appear on homepage after visiting a detail page
- [ ] Favorites persist across page refreshes

## 3. SEO Checks

- [ ] Default title: "Spring Nest - 春日小筑 | 免费在线实用工具与休闲小游戏合集"
- [ ] Default description set
- [ ] OG tags (title, description, type, url, image)
- [ ] Twitter Card (summary_large_image)
- [ ] Canonical URL correct
- [ ] robots.txt exists, references sitemap
- [ ] sitemap.xml includes all public routes (65 URLs)
- [ ] Representative tool/game/category routes have route-specific static title, description, canonical, OG, Twitter and JSON-LD

## 4. PWA Checks

- [ ] manifest.webmanifest generated correctly
- [ ] name: "Spring Nest - 春日小筑"
- [ ] short_name: "春日小筑"
- [ ] Icons: 192x192, 512x512, maskable 512x512
- [ ] theme_color: #3f6751, background_color: #FFF9F2
- [ ] Service worker generated (sw.js)
- [ ] offline.html is precached
- [ ] Offline fallback works for navigation when the network is unavailable

## 5. Cloudflare Pages Checks

- [ ] \_redirects: `/* /index.html 200` (SPA routing)
- [ ] \_headers: Security headers + Cache-Control rules
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`
- [ ] Node version: 18+ (recommend setting NODE_VERSION=18 in CF Pages env)

## 6. Post-Deploy Smoke Test

Test on the configured production origin, currently https://spring-nest.pages.dev/ unless `VITE_SITE_URL` is changed:

- [ ] Homepage loads
- [ ] /tools loads
- [ ] /games loads
- [ ] /search loads
- [ ] /favorites loads
- [ ] A tool detail page loads (e.g. /tools/pomodoro)
- [ ] A game detail page loads (e.g. /games/2048)
- [ ] Refresh on detail page doesn't 404
- [ ] /tools/pomodoro (refresh test)
- [ ] PWA manifest accessible at /manifest.webmanifest
- [ ] robots.txt accessible at /robots.txt
- [ ] sitemap.xml accessible at /sitemap.xml

## 7. Future Domain Migration

When switching from the default Pages origin to a custom domain, update the Pages environment variable:

- `VITE_SITE_URL` - set the canonical public origin, for example `https://example.com`
- Rebuild so `public/sitemap.xml`, `public/robots.txt`, route HTML, canonical URLs and OG image URLs are regenerated from the same origin
- Do not hardcode Cloudflare branch preview domains as the canonical origin
