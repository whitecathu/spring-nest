# Spring Nest / 春日小筑优化主干计划

更新时间：2026-05-13

## 审查结论

本轮是主干审查与优化落地，不处理正式域名绑定，不修改 DNS，也不把 Cloudflare Pages 分支预览域名视为长期正式域名。本轮不大规模重构，不删除现有工具和游戏功能，不引入大型依赖。

## 当前项目状态

### 技术栈

- 前端框架：React 19、React DOM 19、TypeScript 5.8
- 构建工具：Vite 6，`@vitejs/plugin-react`
- 路由：React Router 6，`BrowserRouter` + `Routes` + `Route`
- 样式：Tailwind CSS 4，通过 `@tailwindcss/vite` 与 `src/index.css` 的 `@theme` 变量驱动；暗色主题通过 `.dark` 覆盖 CSS 变量
- 动画与图标：`motion`、`lucide-react`
- PWA：`vite-plugin-pwa` + Workbox 自动生成 manifest 与 service worker
- 数据/后端：默认 localStorage，Supabase 可选接入
- 测试：Vitest 单元测试，Playwright E2E

### 路由方式

- 入口在 `src/main.tsx`，使用 `BrowserRouter`
- 顶层路由在 `src/App.tsx`
- 列表与详情复用同一页面：
  - `/games` 与 `/games/:slug` 共用 `src/pages/Games.tsx`
  - `/tools` 与 `/tools/:slug` 共用 `src/pages/Tools.tsx`
- SPA 回退：
  - `public/_redirects` 用于 Netlify/Cloudflare Pages 类静态托管
  - `vercel.json` 用于 Vercel rewrite

### 构建工具与部署目录

- 构建命令：`npm run build`，实际执行 `vite build`
- 构建产物目录：`dist/`
- 静态资源目录：`public/`
- 当前仓库包含 `dist/`、`.wrangler/`、`test-results/` 等生成/运行产物目录，应在后续分支确认是否纳入版本管理策略，但本轮不删除。

### 样式方案

- 全局样式集中在 `src/index.css`
- 使用 Tailwind v4 的 CSS-first 配置方式，无独立 `tailwind.config.*`
- 自定义 token 包括主色、背景色、surface、字体和动画 keyframes
- 当前 UI 大量使用 glass/card、渐变按钮、圆角与 motion 动效
- 已有 `prefers-reduced-motion` 基础处理，但仍需按页面审查动画密度与移动端性能

### 数据结构

- 工具与游戏元数据类型在 `src/types/app.ts`
- 工具列表在 `src/data/tools.ts`，当前 25 个工具
- 游戏列表在 `src/data/games.ts`，当前 19 个游戏
- `AppItem` 包含：
  - `id`、`type`、中英文标题/描述、分类、标签、图标/图片、`route`
  - 可选说明、特性、相关推荐、精选、新品、热度、难度、预计时间、FAQ
- 用户、收藏、主题、语言、分数等默认写入 localStorage
- Supabase 相关服务已存在，但配置为空时走本地/访客模式

### 页面结构

- 公共壳层：`Navigation`、`Footer`、`ErrorBoundary`、`ThemeProvider`、`UserProvider`
- 主页面：Home、Games、Tools、Favorites、Profile、SearchResults、Leaderboard、Admin、About、Feedback、Privacy、Terms、NotFound
- 工具页面组件位于 `src/pages/tools/`
- 游戏页面组件位于 `src/pages/games/`
- `Games.tsx` 和 `Tools.tsx` 同时负责列表、分类过滤、收藏按钮、详情页组件懒加载

### 当前 SEO 状态

- `index.html` 已有基础 meta、keywords、OG、Twitter Card、JSON-LD
- `src/components/SEO.tsx` 会在客户端更新 title、description、OG、Twitter 与 canonical
- 站点来源统一在 `src/lib/site.ts` 和 `VITE_SITE_URL`，默认使用 `https://spring-nest.pages.dev`
- `scripts/generate-static-site-files.mjs` 会从工具、游戏和分类数据生成 `robots.txt` 与 `sitemap.xml`
- `scripts/generate-route-heads.mjs` 会在构建后为公开路由输出带独立 title、description、canonical、OG、Twitter 和 JSON-LD 的静态 HTML
- 当前 sitemap 覆盖 65 个公开 URL，包括首页、列表页、工具/游戏详情页、分类页、隐私/条款/排行榜等公开页面
- 本轮仍未处理正式域名绑定；未来绑定正式域名时只应更新环境变量，不应重新硬编码预览域名。

### 当前 PWA 状态

- `vite-plugin-pwa` 已配置：
  - `registerType: 'autoUpdate'`
  - manifest name、short_name、description、theme/background color、standalone、portrait、icons
  - Workbox precache 覆盖 js/css/html/icon/png/svg/woff2
  - Google Fonts runtime cache
- `public/` 中已有 PWA 图标、`offline.html`
- `offline.html` 已纳入 Workbox 预缓存并作为导航离线 fallback
- E2E 已覆盖 manifest、静态 SEO 文件和生产预览 smoke test

### 当前测试和 CI 状态

- `package.json` 脚本：
  - `npm run lint` = `tsc --noEmit`
  - `npm run typecheck` = `tsc --noEmit`
  - `npm run test` = `vitest run`
  - `npm run test:e2e` = `playwright test`
  - `npm run build` = `vite build`
- Vitest 配置在 `vitest.config.ts`，环境为 jsdom
- 单元测试覆盖 authService、favoriteService、searchService、2048、unitConverter
- Playwright 配置在 `playwright.config.ts`，本地先构建再启动 preview，CI 复用前序构建产物
- CI 在 `.github/workflows/ci.yml`：
  - 监听 `main` 与 `master` 分支 push/PR
  - CI 分两段：lint/typecheck/test/build，然后 Playwright E2E

## 当前主要问题

1. `Games.tsx` 与 `Tools.tsx` 仍聚合了列表、路由匹配、分类、收藏、懒加载和详情挂载，后续继续增长时维护成本会升高。
2. `lint` 只是 TypeScript 检查，没有 ESLint/格式规则；短期可以接受，但后续质量分支要明确是否引入轻量规则。
3. localStorage 存储本地账号密码属于产品安全风险；本轮补充了隐私披露，但后续仍应迁移到更合适的认证策略。
4. CSP 仍保留 `unsafe-inline`，用于兼容当前内联 JSON-LD、字体 onload 和构建输出样式；后续若要收紧，需要先移除这些内联资源。

## 优化目标

- 修正索引与站点元信息，让 sitemap、robots、canonical 与真实部署策略解耦。
- 保持所有现有工具和游戏可用，不删除功能。
- 优先修补高风险基础设施：CI 触发、权限策略、PWA 离线和测试断言。
- 控制变更半径，每个分支只处理一个主题。
- 不引入大型依赖；只有在现有工具链无法覆盖时才考虑新增，并在 PR 中说明原因。
- 保持 `dist/` 为构建输出目录，不在优化过程中调整正式域名/DNS。

## 分支拆分计划

### 1. `codex/audit-doc-baseline`

负责：
- 提交本优化主干文档。
- 不改运行时代码、不改 DNS、不改域名配置。

不要改：
- 不修改 `SEO.tsx`、`robots.txt`、`sitemap.xml`。
- 不修改工具/游戏功能。

验证：
- `npm run lint`
- `npm run build`

### 2. `codex/seo-indexing-foundation`

负责：
- 统一站点 URL 来源，避免把 Cloudflare Pages 分支预览域名写死为长期正式域名。
- 更新或生成 sitemap，覆盖全部公开工具/游戏详情页。
- 检查 robots、OG URL、canonical、JSON-LD 的一致性。

不要改：
- 不绑定正式域名。
- 不改 DNS。
- 不改页面视觉与交互。
- 不删除现有 sitemap 公开页面，除非确认是非公开路由。

验证：
- `npm run lint`
- `npm run build`
- 人工检查 `dist/sitemap.xml`、`dist/robots.txt`

### 3. `codex/ci-test-alignment`

负责：
- 修正 CI 分支触发策略，使当前主分支能触发 CI。
- 检查 Playwright manifest 断言与当前 PWA 配置是否一致。
- 明确 `lint`、`typecheck`、`test` 命令边界；如果新增 `typecheck` 脚本，只应指向 `tsc --noEmit`。

不要改：
- 不调整部署平台。
- 不改应用功能逻辑。
- 不引入大型测试框架。

验证：
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

### 4. `codex/security-permissions-policy`

负责：
- 审查 `public/_headers` 中的 Permissions-Policy。
- 确保相机类功能与策略一致，例如 Scanner 的 `getUserMedia`。
- 检查外部请求能力：天气 `wttr.in`、IP 查询服务、Supabase 可选接入。

不要改：
- 不重写工具功能。
- 不放宽无关权限。
- 不处理正式域名。

验证：
- `npm run lint`
- `npm run build`
- 浏览器手测 Scanner、Weather、IP Lookup、Compass

### 5. `codex/pwa-offline-hardening`

负责：
- 验证 manifest、icons、service worker 注册、更新策略、离线访问。
- 判断 `offline.html` 是否需要纳入导航 fallback。
- 补齐 PWA E2E 或构建后检查。

不要改：
- 不大幅替换 PWA 插件。
- 不改变核心路由方式。
- 不引入复杂运行时缓存库。

验证：
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- 构建后本地 preview + DevTools Application 面板检查

### 6. `codex/docs-content-sync`

负责：
- 同步 README、技术架构、部署说明、产品说明中的工具/游戏数量、路由、测试状态。
- 修正不存在或命名不一致的文档链接。

不要改：
- 不改代码行为。
- 不新增营销性描述盖过真实功能。

验证：
- `npm run build`
- 人工检查文档链接

### 7. `codex/performance-accessibility-pass`

负责：
- 对首页、工具列表、游戏列表、详情页做性能与可访问性专项检查。
- 优化过重动效、图片/字体加载、tap target、焦点顺序、ARIA 文案。
- 优先使用现有 Tailwind、motion、lucide，不新增大型依赖。

不要改：
- 不改变工具/游戏核心玩法。
- 不做大规模组件重构。
- 不引入 UI 框架。

验证：
- `npm run lint`
- `npm run build`
- `npm run test:e2e`
- 桌面/移动视口人工回归

### 8. `codex/games-tools-maintainability`

负责：
- 在不改变功能的前提下，轻量整理 `Games.tsx` 与 `Tools.tsx` 的组件映射、路由查找、分类逻辑。
- 为新增工具/游戏建立更不容易漏 sitemap、组件映射和测试的流程。

不要改：
- 不删除任何工具或游戏。
- 不重写现有小游戏引擎。
- 不合并成大型抽象，除非能明显减少重复。

验证：
- `npm run lint`
- `npm run test`
- `npm run test:e2e`
- `npm run build`

## 合并顺序

1. `codex/audit-doc-baseline`
2. `codex/seo-indexing-foundation`
3. `codex/ci-test-alignment`
4. `codex/security-permissions-policy`
5. `codex/pwa-offline-hardening`
6. `codex/docs-content-sync`
7. `codex/performance-accessibility-pass`
8. `codex/games-tools-maintainability`

理由：先固化审查与索引基础，再保证 CI 能持续验证，然后处理权限/PWA 这类运行环境风险，最后做文档同步、性能可访问性与轻量维护性优化。

## 通用验证命令

```bash
npm install
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

`npm install` 仅在依赖缺失、`node_modules` 不存在或 lockfile 变更后运行。

## 风险点

- SEO URL 策略不能误把 Cloudflare Pages 的 preview/branch 域名固化成正式域名。
- sitemap 已由脚本生成，后续新增公开路由时要同步数据源或脚本规则。
- 过度放宽 Permissions-Policy 会增加权限暴露；过度收紧又会破坏 Scanner 等功能。
- PWA service worker 缓存可能导致用户看到旧资源，需要明确更新策略和缓存边界。
- localStorage 存储本地账号密码属于产品安全风险；如果继续保留，应在文档和后续安全分支中明确限制与迁移路径。
- 公开路由已有构建后静态 meta；仍需在正式部署后用真实 URL 抽样检查 Cloudflare headers 与 HTML。
- 后续优化若同时触碰 `Games.tsx`、`Tools.tsx`、数据文件和 sitemap，容易产生合并冲突，应按上面的顺序拆分。
