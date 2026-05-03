# Spring Nest (春日小筑)

[![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)

> 藏尽春日好物，聚齐实用与欢喜 — 一个治愈系数字角落

Spring Nest 是一个汇集实用工具与休闲小游戏的 PWA Web 应用，提供 5 个真实可用的效率工具和 3 个可玩的休闲小游戏，支持中英双语、本地账号、收藏功能、暗色主题和离线访问。

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
| Vitest | 单元测试 (82 tests) |
| Playwright | E2E 端到端测试 |

## 已实现功能

### 核心功能
- 登录/注册（localStorage 本地账号，邮箱校验，密码>=6位）
- 收藏功能（游戏+工具，按用户ID持久化）
- 全文搜索（搜索名称、描述、分类、标签，结果排序）
- 中英双语切换
- 暗色/浅色/跟随系统主题切换
- React Router URL 路由（支持浏览器前进/后退）
- 404 页面
- ErrorBoundary 全局错误处理
- PWA 支持（可安装到桌面，离线访问）

### 5 个真实工具
| 工具 | 功能 |
|---|---|
| 计算器 | 加减乘除、小数、历史记录 |
| 番茄钟 | 25分钟专注 + 5分钟休息、完成统计、localStorage 持久化 |
| 单位换算 | 长度/重量/温度/面积实时换算 |
| 密码生成器 | 自定义长度、大小写/数字/特殊字符、一键复制、强度指示 |
| 二维码生成器 | 文本/链接转二维码、下载PNG |

### 3 个可玩游戏
| 游戏 | 功能 |
|---|---|
| 2048 | 4x4棋盘、方向键/触屏滑动、分数+最高分、游戏结束判定 |
| 记忆翻牌 | 8对卡片、步数/用时统计、最佳成绩持久化 |
| 打地鼠 | 30秒限时、3秒倒计时、9洞随机出鼠、难度递增、最高分记录 |

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
| `/privacy` | 隐私政策 |
| `/terms` | 服务条款 |
| `*` | 404 |

## 本地运行

**前置要求**: Node.js 18+

```bash
npm install        # 安装依赖
npm run dev        # 启动开发服务器 (http://localhost:3000)
npm run build      # 生产构建
npm run preview    # 预览构建产物
npm run test       # 运行 82 个单元测试
npm run test:e2e   # 运行 Playwright E2E 测试
npm run lint       # TypeScript 类型检查
```

## 构建与测试

```bash
npm run build    # ✅ 通过，约 30 chunks，gzip ~160KB
npm run test     # ✅ 通过，5 files / 82 tests
npm run test:e2e # ✅ 通过，Playwright E2E 测试
npm run lint     # ✅ 通过，无 TypeScript 错误
```

## CI/CD

项目使用 GitHub Actions 进行持续集成，每次 push 或 PR 到 `main` 分支自动运行：

| 阶段 | 内容 | 依赖 |
|---|---|---|
| lint-and-test | TypeScript 类型检查 + 82 个单元测试 + 生产构建 | 无 |
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
├── 功能测试报告.md
├── 部署说明.md
├── 部署检查清单.md
├── 项目实际可用性说明.md
├── 上线说明.md
├── 评审展示说明.md
├── 演示脚本.md
├── 数据库设计.md
├── 安全规则.md
└── RLS-SQL.md
```

## 数据持久化

本项目采用 **localStorage + Supabase** 双重数据持久化策略:

- **localStorage**: 离线缓存，保证无网络时也能正常使用
- **Supabase**: 云端数据库，实现跨设备数据同步

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
| `spring_nest_pomodoro` | 番茄钟完成统计 |

### Supabase 云端数据库

| 表名 | 内容 |
|---|---|
| `profiles` | 用户资料 (用户名、简介、头像) |
| `favorites` | 用户收藏 (游戏+工具) |
| `game_scores` | 游戏分数记录 |
| `user_settings` | 用户设置 (主题、语言、通知) |
| `tool_usage` | 工具使用记录 |

详见 [docs/数据库设计.md](docs/数据库设计.md)。

## Supabase 配置

### 1. 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 并注册/登录
2. 点击 "New Project" 创建新项目
3. 选择组织、输入项目名称和数据库密码
4. 选择离用户最近的区域

### 2. 获取 API 密钥

在 Supabase Dashboard → Settings → API 中获取:

- **Project URL**: `https://your-project.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIs...` (公开密钥，受 RLS 保护)

### 3. 配置环境变量

复制 `.env.example` 为 `.env`，填入 Supabase 配置:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 4. 初始化数据库

在 Supabase Dashboard → SQL Editor 中执行 [docs/RLS-SQL.md](docs/RLS-SQL.md) 中的 SQL 脚本，创建所有表和安全策略。

### 5. 配置认证

在 Supabase Dashboard → Authentication → Settings 中:

- 设置 Site URL: `https://your-domain.com`
- 添加 Redirect URLs: `https://your-domain.com/**`

详见 [docs/安全规则.md](docs/安全规则.md)。

## 部署

构建产物在 `dist/` 目录，可部署到 Vercel、Netlify、GitHub Pages、Cloudflare Pages 等。

### Vercel

项目已包含 `vercel.json`，自动处理 SPA 路由回退。

```bash
# CLI 部署
npx vercel --prod

# 或直接导入 GitHub 仓库，Vercel 自动检测 Vite 项目
```

**环境变量配置**:
1. 在 Vercel Dashboard → Settings → Environment Variables 中添加:
   - `VITE_SUPABASE_URL` = `https://your-project.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your-anon-key`
2. 选择环境: Production / Preview / Development
3. 重新部署以使环境变量生效

### Netlify

项目已包含 `public/_redirects`，构建时自动复制到 `dist/`。

```bash
# CLI 部署
npx netlify deploy --prod --dir=dist

# 或连接 Git 仓库：
# Build command: npm run build
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
