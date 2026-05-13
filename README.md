# Spring Nest (春日小筑)

[![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)

> 藏尽春日好物，聚齐实用与欢喜 — 一个治愈系数字角落

Spring Nest 是一个汇集实用工具与休闲小游戏的 PWA Web 应用，提供 25 个效率工具和 19 个休闲小游戏，支持中英双语、本地账号、收藏功能、暗色主题、离线访问和可选的 Supabase 云端同步。

## 技术栈

| 技术 | 用途 |
|---|---|
| React 19 | UI 框架 |
| Vite 6 | 构建工具 |
| TypeScript 5.8 | 类型安全 |
| Tailwind CSS 4 | 原子化 CSS |
| React Router 6 | 客户端路由 |
| Motion (Framer Motion) | 动画 |
| Lucide React | 图标库 |
| qrcode | 二维码生成 |
| Vite PWA Plugin | PWA 离线支持 |
| Vitest | 单元测试 (83 tests) |
| Playwright | E2E 端到端测试 |

## 已实现功能

### 核心功能
- 登录/注册（localStorage 本地账号，邮箱校验，密码>=6位，本地密码以哈希形式保存）
- 收藏功能（游戏+工具，按用户ID持久化）
- 全文搜索（搜索名称、描述、分类、标签，结果排序）
- 中英双语切换
- 暗色/浅色/跟随系统主题切换
- React Router URL 路由（支持浏览器前进/后退）
- 404 页面
- ErrorBoundary 全局错误处理
- PWA 支持（可安装到桌面，离线访问）
- 意见反馈入口（邮件或 `VITE_FEEDBACK_URL`，不在页面内伪造提交结果）
- 排行榜系统（需配置 Supabase）
- 后台管理页面（需配置 Supabase）

### 工具示例（共 25 个）
| 工具 | 功能 |
|---|---|
| 计算器 | 加减乘除、小数、键盘输入、历史记录、一键复制结果 |
| 番茄钟 | 自定义时长、Web Audio 提示音、完成统计、localStorage 持久化 |
| 单位换算 | 长度/重量/温度/面积实时换算 |
| 密码生成器 | 自定义长度、大小写/数字/特殊字符、一键复制、强度指示 |
| 二维码生成器 | 文本/链接转二维码、下载PNG |
| 指南针 | 设备传感器电子罗盘、桌面端拖动操作、方位角显示 |
| 轻量扫描仪 | 拍摄/上传文档、多种滤镜调整、下载PNG保存 |
| 微风天气 | 自动定位/搜索城市、实时天气、三天预报 |

### 游戏示例（共 19 个）
| 游戏 | 功能 |
|---|---|
| 2048 | 4x4棋盘、方向键/触屏滑动、撤回一步、分数+最高分、游戏结束判定 |
| 记忆翻牌 | 4/8/12对难度选择、步数/用时统计、最佳成绩按难度持久化 |
| 打地鼠 | 30秒限时、连击加成系统、9洞随机出鼠、难度递增、最高分记录 |
| 色彩拼图 | 4x4棋盘、交换相邻色块三连线消除、连锁反应、步数统计 |
| 森林漫步 | 60秒限时、点击收集落叶、避开树枝、连击加成、动物加分 |

## 路由

| 路径 | 页面 |
|---|---|
| `/` | 首页 |
| `/games` | 游戏列表 |
| `/games/:slug` | 游戏详情 |
| `/tools` | 工具列表 |
| `/tools/:slug` | 工具详情 |
| `/favorites` | 收藏列表 |
| `/profile` | 个人中心 |
| `/about` | 关于我们 |
| `/search?q=xxx` | 搜索结果 |
| `/feedback` | 意见反馈 |
| `/privacy` | 隐私政策 |
| `/terms` | 服务条款 |
| `*` | 404 |

## 本地运行

**前置要求**: Node.js 18+

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (http://localhost:3000)
npm run typecheck  # TypeScript 类型检查
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run test       # 运行 83 个单元测试
npm run test:e2e   # 运行 15 个 Playwright 生产预览 E2E 测试
npm run lint       # TypeScript 类型检查
```

## 构建与测试

```bash
npm run build    # ✅ 通过，约 30 chunks，gzip ~160KB
npm run test     # ✅ 通过，5 files / 83 tests
npm run test:e2e # ✅ 通过，15 个 Playwright 生产预览 E2E 测试
npm run lint     # ✅ 通过，无 TypeScript 错误
```

## CI/CD

项目使用 GitHub Actions 进行持续集成，每次 push 或 PR 到 `main` / `master` 分支自动运行：

| 阶段 | 内容 | 依赖 |
|---|---|---|
| lint-and-test | TypeScript 类型检查 + 83 个单元测试 + 生产构建 | 无 |
| e2e | Playwright 端到端测试 | lint-and-test 通过后 |

CI 配置见 [`.github/workflows/ci.yml`](.github/workflows/ci.yml)。

## 项目结构

```
src/
├── types/               # TypeScript 类型定义
├── data/                # 数据文件
├── services/            # 业务逻辑（纯函数）
├── hooks/               # React Hooks
├── contexts/            # UserContext + ThemeContext
├── components/          # 公共组件 (Navigation, Footer, LoginModal, ErrorBoundary)
├── pages/               # 页面组件
│   ├── games/           # 3 个游戏
│   └── tools/           # 5 个工具
├── __tests__/           # 单元测试 (Vitest)
├── App.tsx              # 路由配置
└── main.tsx             # 入口文件
e2e/                     # Playwright E2E 测试
.github/workflows/       # GitHub Actions CI 配置
docs/                    # 文档
├── 技术架构.md
├── 部署说明.md
├── 数据库设计.md
├── 安全规则.md
├── RLS-SQL.md
├── E2E测试说明.md
└── 产品说明书.md
```

## 数据持久化

本项目当前版本采用 **localStorage** 数据持久化策略:

- **localStorage**: 所有数据保存在浏览器本地，无需后端服务，支持离线使用
- 未来版本可选接入 Supabase 实现云端数据同步

### localStorage 存储

| 存储 Key | 内容 |
|---|---|
| `spring_nest_users` | 注册用户账号列表 |
| `spring_nest_current_user` | 当前登录用户 |
| `spring_nest_favorites` | 收藏数据（按用户ID分组） |
| `spring_nest_lang` | 语言偏好 |
| `spring_nest_theme` | 主题偏好 (light/dark/system) |
| `spring_nest_2048_best` | 2048 最高分 |
| `spring_nest_memory_best` | 记忆翻牌最佳步数 |
| `spring_nest_whackamole_best` | 打地鼠最高分 |
| `spring_nest_colormerge_best` | 色彩拼图最高分 |
| `spring_nest_forest_best` | 森林漫步最高分 |
| `spring_nest_pomodoro` | 番茄钟完成统计 + 设置 |
| `spring_nest_whackamole_best_combo` | 打地鼠最高连击 |
| `spring_nest_pomodoro_settings` | 番茄钟自定义设置 |

### Supabase 云端数据库

| 表名 | 内容 |
|---|---|
| `profiles` | 用户资料 (用户名、简介、头像) |
| `favorites` | 用户收藏 (游戏+工具) |
| `game_scores` | 游戏分数记录 |
| `user_settings` | 用户设置 (主题、语言、通知) |
| `tool_usage` | 工具使用记录 |

详见 [docs/数据库设计.md](docs/数据库设计.md)。

## Supabase 配置（可选）

本项目默认使用 localStorage 本地存储，无需任何后端。如需云端同步、排行榜等功能，可配置 Supabase：

1. 复制 `.env.example` 为 `.env`，填入 Supabase 项目 URL 和 Anon Key
2. 在 Supabase SQL Editor 中执行 `docs/RLS-SQL.md` 中的脚本
3. 在 Supabase Auth Settings 中配置 Site URL 和 Redirect URLs

详见 [docs/安全规则.md](docs/安全规则.md) 和 [docs/数据库设计.md](docs/数据库设计.md)。

## 部署

构建产物在 `dist/` 目录，可部署到 Vercel、Netlify、GitHub Pages、Cloudflare Pages 等。

### Vercel

项目已包含 `vercel.json`，自动处理 SPA 路由回退。

```bash
# CLI 部署
npx vercel --prod

# 或直接导入 GitHub 仓库，Vercel 自动检测 Vite 项目
```

如需 Supabase，在 Vercel/Netlify 环境变量中添加 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`。

### Netlify

项目已包含 `public/_redirects`，构建时自动复制到 `dist/`。

```bash
npx netlify deploy --prod --dir=dist
# Publish directory: dist
```

**环境变量配置**:
1. 在 Netlify Dashboard → Site settings → Environment variables 中添加:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
2. 重新部署以使环境变量生效

### 部署验证

部署后请验证：
- 直接访问子路由（如 `/games/2048`）不返回 404
- 刷新页面路由正常
- PWA 安装提示出现
- 离线访问正常

详见 [docs/部署说明.md](docs/部署说明.md) 和 [docs/部署检查清单.md](docs/部署检查清单.md)。

## License

Apache-2.0
