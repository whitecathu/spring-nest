# Spring Nest (春日小筑)

[![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)

> 藏尽春日好物，聚齐实用与欢喜 — 一个治愈系数字角落

<!-- AUTO:STATS_START -->

Spring Nest 是一个汇集实用工具与休闲小游戏的 PWA Web 应用，提供 29 个效率工具和 19 个休闲小游戏，支持中英双语、本地账号、收藏功能、暗色主题、离线访问和可选的 Supabase 云端同步。

<!-- AUTO:STATS_END -->

## 技术栈

| 技术                   | 用途                |
| ---------------------- | ------------------- |
| React 19               | UI 框架             |
| Vite 6                 | 构建工具            |
| TypeScript 5.8         | 类型安全            |
| Tailwind CSS 4         | 原子化 CSS          |
| React Router 6         | 客户端路由          |
| Motion (Framer Motion) | 动画                |
| Lucide React           | 图标库              |
| qrcode                 | 二维码生成          |
| Vite PWA Plugin        | PWA 离线支持        |
| Vitest                 | 单元测试 (83 tests) |
| Playwright             | E2E 端到端测试      |

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

### 工具列表（共 29 个）

<!-- AUTO:TOOLS_START -->

| 工具                                      | 功能                                                                                                    | 分类     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- | -------- |
| [计算器](/tools/calculator)               | 极简风格计算器，支持加减乘除、历史记录，让每一次运算都清晰明了。                                        | 日常实用 |
| [番茄钟](/tools/pomodoro)                 | 25 分钟专注 + 5 分钟休息循环，助你快速进入心流状态。                                                    | 时间效率 |
| [单位换算](/tools/converter)              | 支持长度、重量、温度、面积实时换算，操作简单快捷。                                                      | 日常实用 |
| [密码生成器](/tools/password)             | 自定义长度与字符类型，一键生成强密码，支持复制。                                                        | 安全隐私 |
| [二维码生成器](/tools/qrcode)             | 输入文本或链接快速生成二维码，支持下载保存。                                                            | 日常实用 |
| [指南针](/tools/compass)                  | 支持设备传感器的电子罗盘，桌面端可拖动操作。                                                            | 日常实用 |
| [轻量扫描仪](/tools/scanner)              | 拍摄或上传文档，支持多种滤镜调整，下载 PNG 保存。                                                       | 日常实用 |
| [微风天气](/tools/weather)                | 自动定位或搜索城市，查看实时天气和三天预报。                                                            | 日常实用 |
| [随机选择器](/tools/random-picker)        | 输入选项，随机抽取一个结果。适合抽签、决定吃什么、小组分配。                                            | 趣味工具 |
| [倒计时与秒表](/tools/timer-stopwatch)    | 支持倒计时和秒表两种模式，常用时间快捷设置。                                                            | 时间效率 |
| [字数统计](/tools/word-counter)           | 实时统计字数、字符数、中文字符、英文单词、行数和段落数。                                                | 学习写作 |
| [Markdown 预览](/tools/markdown-preview)  | 左侧编辑 Markdown，右侧实时预览渲染效果。                                                               | 学习写作 |
| [JSON 格式化](/tools/json-formatter)      | 格式化、压缩、校验 JSON 数据，快速定位语法错误。                                                        | 开发辅助 |
| [Base64 编解码](/tools/base64-codec)      | 文本与 Base64 互相转换，支持中文和 Unicode 字符。                                                       | 开发辅助 |
| [URL 编解码](/tools/url-codec)            | URL 编码与解码转换，处理特殊字符和中文链接。                                                            | 开发辅助 |
| [颜色转换器](/tools/color-converter)      | HEX、RGB、HSL 颜色格式互转，附带春日主题色板。                                                          | 趣味工具 |
| [日期计算器](/tools/date-calculator)      | 计算两个日期之间的天数差，或从某日期推算 N 天后的日期。                                                 | 时间效率 |
| [文本对比](/tools/text-diff)              | 逐行对比两段文本，高亮显示新增和删除的内容，支持差异统计。                                              | 学习写作 |
| [随机文本生成](/tools/lorem-generator)    | 快速生成 Lorem Ipsum 占位文本，可自定义段落数和每段句数。                                               | 学习写作 |
| [IP 查询](/tools/ip-lookup)               | 查看您的公网 IP 地址及地理位置、运营商、时区等详细信息。                                                | 开发辅助 |
| [小费计算器](/tools/tip-calculator)       | 快速计算小费金额和分账，支持自定义小费比例和多人分账。                                                  | 日常实用 |
| [大小写转换](/tools/case-converter)       | 快速转换文本大小写格式，支持大写、小写、首字母大写、句首大写等多种模式。                                | 学习写作 |
| [随机数生成](/tools/random-number)        | 生成指定范围内的随机数，支持批量生成和常用范围预设。                                                    | 趣味工具 |
| [BMI 计算器](/tools/bmi-calculator)       | 输入身高体重，快速计算 BMI 指数，查看健康范围和建议。                                                   | 日常实用 |
| [文字朗读](/tools/text-to-speech)         | 输入文字即可朗读，支持多种语言和语速调节，让文字开口说话。                                              | 趣味工具 |
| [Word 转 PDF](/tools/word-to-pdf)         | 上传 .docx 文件，在浏览器本地生成 PDF，尽量保留文本、标题、表格和图片。                                 | 文档转换 |
| [PDF 转 Word](/tools/pdf-to-word)         | 上传文本型 PDF，在浏览器本地提取文字并生成 .docx，适合整理可复制文本。                                  | 文档转换 |
| [复习小筑](/tools/question-bank-importer) | 把 txt、md、csv、json、zip、rar、docx 题库和兼容式 doc 文本整理成可搜索、可复习、可导出的本地学习卡片。 | 学习写作 |
| [本地记账](/tools/bookkeeping)            | 快速记录收入和支出，按月查看结余、分类占比和明细，并导出 CSV 备份。                                     | 日常实用 |

<!-- AUTO:TOOLS_END -->

### 游戏列表（共 19 个）

<!-- AUTO:GAMES_START -->

| 游戏                                | 功能                                                                 | 分类     |
| ----------------------------------- | -------------------------------------------------------------------- | -------- |
| [2048](/games/2048)                 | 经典数字合并游戏，滑动方块合并相同数字，挑战 2048 及更高分。         | 益智解谜 |
| [记忆翻牌](/games/memory)           | 翻转卡片找出配对，锻炼记忆力，挑战最少步数完成。                     | 益智解谜 |
| [打地鼠](/games/whackamole)         | 快速点击冒出的地鼠，考验反应速度，连击加分。                         | 反应挑战 |
| [色彩拼图](/games/colormerge)       | 交换相邻色块，三个同色连线即可消除，支持连锁反应。                   | 益智解谜 |
| [森林漫步](/games/forestwalk)       | 点击收集落叶，避开树枝，抓住小动物加分，60秒限时挑战。               | 反应挑战 |
| [贪吃蛇](/games/snake)              | 控制蛇吃食物不断变长，避免撞墙和撞到自己。                           | 反应挑战 |
| [反应测试](/games/reaction-test)    | 等待屏幕变绿后尽快点击，测试你的反应速度。                           | 反应挑战 |
| [数字华容道](/games/number-puzzle)  | 滑动数字方块，将打乱的数字还原为正确顺序。                           | 益智解谜 |
| [井字棋](/games/tic-tac-toe)        | 经典井字棋，支持双人对战和人机对战。                                 | 益智解谜 |
| [打字挑战](/games/typing-challenge) | 看着目标句子快速输入，统计准确率和速度。                             | 学习练习 |
| [色彩挑战](/games/color-stroop)     | 文字颜色和含义不一致时，选择文字的实际颜色。考验专注力。             | 反应挑战 |
| [扫雷](/games/minesweeper)          | 经典扫雷游戏，三种难度可选，点击揭开格子，长按标旗，小心地雷！       | 益智解谜 |
| [像素小鸟](/games/flappy-bird)      | 点击屏幕让小鸟飞翔，穿过管道得分，简单又上瘾的休闲游戏。             | 反应挑战 |
| [打砖块](/games/brick-breaker)      | 用挡板反弹小球击碎上方的彩色砖块，支持触屏滑动控制，多关卡挑战。     | 反应挑战 |
| [西蒙说](/games/simon-says)         | 记住颜色出现的顺序，然后按相同顺序点击。考验记忆力和反应速度。       | 反应挑战 |
| [数独](/games/sudoku)               | 经典数字谜题，在 9×9 格子中填入 1-9，每行每列每宫不重复。            | 益智解谜 |
| [打字测速](/games/typing-speed)     | 测试你的英文打字速度，支持限时和限词两种模式，统计 WPM 和准确率。    | 学习练习 |
| [找词游戏](/games/word-search)      | 在字母网格中找出隐藏的单词，支持横竖斜八个方向，锻炼观察力和词汇量。 | 益智解谜 |
| [泡泡消消](/games/bubble-pop)       | 点击相同颜色的泡泡消除，连锁反应加分，挑战高分极限。                 | 反应挑战 |

<!-- AUTO:GAMES_END -->

## 路由

| 路径            | 页面     |
| --------------- | -------- |
| `/`             | 首页     |
| `/games`        | 游戏列表 |
| `/games/:slug`  | 游戏详情 |
| `/tools`        | 工具列表 |
| `/tools/:slug`  | 工具详情 |
| `/favorites`    | 收藏列表 |
| `/profile`      | 个人中心 |
| `/leaderboard`  | 排行榜   |
| `/about`        | 关于我们 |
| `/search?q=xxx` | 搜索结果 |
| `/feedback`     | 意见反馈 |
| `/privacy`      | 隐私政策 |
| `/terms`        | 服务条款 |
| `/offline`      | 离线提示 |
| `*`             | 404      |

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

## 工具小程序

本仓库包含一个独立的工具小程序基础工程，目录为 `miniapp/`。小程序只包含工具，不包含游戏；当前 Web 端仍保留工具与游戏。

常用命令：

```bash
npm run generate:miniapp # 从现有工具目录生成 miniapp/data/tools.js
npm run verify:miniapp   # 校验三 Tab、29 个工具和无游戏入口
```

小程序设计文档见 `docs/superpowers/specs/2026-05-18-tools-mini-program-design.md`。

## 构建与测试

```bash
npm run build    # ✅ 通过，约 30 chunks，gzip ~160KB
npm run test     # ✅ 通过，5 files / 83 tests
npm run test:e2e # ✅ 通过，15 个 Playwright 生产预览 E2E 测试
npm run lint     # ✅ 通过，无 TypeScript 错误
```

## CI/CD

项目使用 GitHub Actions 进行持续集成，每次 push 或 PR 到 `main` / `master` 分支自动运行：

| 阶段          | 内容                                           | 依赖                 |
| ------------- | ---------------------------------------------- | -------------------- |
| lint-and-test | TypeScript 类型检查 + 83 个单元测试 + 生产构建 | 无                   |
| e2e           | Playwright 端到端测试                          | lint-and-test 通过后 |

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
│   ├── games/           # 19 个游戏
│   └── tools/           # 29 个工具
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

| 存储 Key                            | 内容                         |
| ----------------------------------- | ---------------------------- |
| `spring_nest_users`                 | 注册用户账号列表             |
| `spring_nest_current_user`          | 当前登录用户                 |
| `spring_nest_favorites`             | 收藏数据（按用户ID分组）     |
| `spring_nest_lang`                  | 语言偏好                     |
| `spring_nest_theme`                 | 主题偏好 (light/dark/system) |
| `spring_nest_2048_best`             | 2048 最高分                  |
| `spring_nest_memory_best`           | 记忆翻牌最佳步数             |
| `spring_nest_whackamole_best`       | 打地鼠最高分                 |
| `spring_nest_colormerge_best`       | 色彩拼图最高分               |
| `spring_nest_forest_best`           | 森林漫步最高分               |
| `spring_nest_pomodoro`              | 番茄钟完成统计 + 设置        |
| `spring_nest_whackamole_best_combo` | 打地鼠最高连击               |
| `spring_nest_pomodoro_settings`     | 番茄钟自定义设置             |

### Supabase 云端数据库

| 表名            | 内容                          |
| --------------- | ----------------------------- |
| `profiles`      | 用户资料 (用户名、简介、头像) |
| `favorites`     | 用户收藏 (游戏+工具)          |
| `game_scores`   | 游戏分数记录                  |
| `user_settings` | 用户设置 (主题、语言、通知)   |
| `tool_usage`    | 工具使用记录                  |

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
