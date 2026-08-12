# Spring Nest Miniapp QA Log

> 春日小筑（Spring Nest）微信小程序验收与回归记录
>
> 工程路径：`G:\wanzan-main\miniapp`

## Computer Use 前置条件

**Computer Use / 人工 UI QA 必须先满足：**

1. 微信开发者工具已打开
2. 已导入本仓库 `miniapp/` 目录并成功编译预览
3. （建议）对照窗打开 untitled App，便于同屏 UI 对标

MCP / Computer Use **不会**自动拉起微信开发者工具。未导入项目时，G0–G5 的 UI 剧本无法执行。

## G0–G5 验收清单

| Gate   | 范围                                                                           | 状态                     | 说明                                                                              |
| ------ | ------------------------------------------------------------------------------ | ------------------------ | --------------------------------------------------------------------------------- |
| **G0** | 脚手架 + 字体子集 + design tokens + tool-card / tool-shell / 底栏              | **simulator smoke PASS** | 3.17.0 模拟器已确认 brand-header、工具卡与 custom tabBar 正常渲染                 |
| **G1** | 发现 / 开发 / 效率 / 我的 + 收藏 / 记录 / 关于 + storage                       | **simulator smoke PASS** | Computer Use 已逐一切换四 Tab，页面内容与选中态均正常；二级入口仍待真机矩阵       |
| **G2** | `packageStudy` 学习小筑 P0（bento 首页、题集、背/刷/考、导入、错题/收藏/统计） | code done                | 首页含 bento；需并排跑通学习闭环                                                  |
| **G3** | 工具工作台（29 源目录项，24 个正式可见工具）                                   | **automated PASS**       | weather/ip/tts offline；Word/PDF 转换 hidden 且不入包                             |
| **G4** | 发布目录 + 隐私字段 / 工程配置 / QA 文档                                       | **automated PASS**       | 严格目录契约、主包瘦身、隐私配置与 CI gate 已接通                                 |
| **G5** | 整包回归 + P0/P1 bug 清零                                                      | **simulator smoke PASS** | 3.17.0 模拟器四 Tab 已正常渲染；3.16.2 渲染层兼容故障已隔离，完整真机矩阵仍待执行 |

## 已知降级 / 诚实边界（degraded tools）

| 工具                          | 行为                                             | 备注                                                           |
| ----------------------------- | ------------------------------------------------ | -------------------------------------------------------------- |
| **weather**                   | `offline: true`，目录隐藏                        | runtime 仅 stub；无 `getLocation` / `wttr.in`                  |
| **ip-lookup**                 | `offline: true`，目录隐藏                        | runtime 仅 stub；无 `ipapi.co`                                 |
| **text-to-speech (TTS)**      | `offline: true`，目录隐藏                        | 正式版不下发朗读能力                                           |
| **word-to-pdf / pdf-to-word** | `hidden: true`，目录/搜索/收藏/历史/深链均不可达 | 当前小程序不具备核心转换能力，页面已从 `app.json` 分包清单移除 |

## 自动化校验状态

| 命令                                                      | 用途                                             | 状态                          |
| --------------------------------------------------------- | ------------------------------------------------ | ----------------------------- |
| `npm run generate:miniapp`                                | 从 Web catalog 生成 `miniapp/data/tools.js`      | **PASS** (29 tools)           |
| `npm run verify:miniapp`                                  | 脚手架 + 29 工具 catalog 结构                    | **PASS**                      |
| `$env:MINIAPP_VERIFY_STRICT=1; npm run verify:miniapp`    | 严格：runtime 全 slug case、无「敬请期待」等占位 | **PASS**                      |
| `npx vitest run src/__tests__/miniProgramCatalog.test.ts` | 目录 IA / slug / Tab 单测                        | **PASS** (7/7)                |
| `npx vitest run tests/miniapp`                            | 发布、安全、数据与计时专项回归                   | **PASS** (5 files / 49 tests) |

Last run: 2026-07-30 — `MINIAPP_VERIFY_STRICT=1 npm run verify:miniapp` **PASS**；DevTools CLI `open` **PASS**。Computer Use 已导入项目并清除小程序保留目录 `__tests__` 报错。基础库 3.16.2 曾触发开发者工具内部 `enableUpdateWxAppCode` 空对象异常并造成白屏；重新打开项目并使用 3.17.0 编译后，发现 / 开发 / 效率 / 我的四 Tab 均完整渲染且可正常切换。开发者工具改用包内字体后不再出现字体 `ERR_CACHE_MISS`；剩余 `SdkReport ERR_CONNECTION_CLOSED` 为微信工具自身上报网络失败，不影响业务渲染。

## Sanity（G4 prep）

- [x] `packageStudy/pages/home` 非 stub，含 `.bento` 四宫格
- [x] `tool-runtime` 对 29 个 slug 均有 `case`
- [x] `tool-runtime` 无用户可见「敬请期待」占位文案
- [x] `app.json`：`requiredPrivateInfos` / `permission` / `__usePrivacyCheck__` / `networkTimeout`
- [x] `project.config.json`：正式 AppID、春日小筑描述、miniprogramRoot `./`
- [x] `miniapp/README.md`：DevTools 打开方式、域名、字体、Tab

### 2026-07-29 — Release hardening

| 项             | 结果                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| **目录发布**   | Word→PDF / PDF→Word 进入 `hiddenSlugs`，默认目录、搜索、收藏、历史和深链均过滤，转换页不再打包        |
| **能力文案**   | 24 个可见工具全部使用明确的小程序专属中英文描述与功能列表                                             |
| **密码**       | `wx.getRandomValues` + 拒绝采样；保证每个启用字符集至少出现一次，无 `Math.random` 回退                |
| **数据可靠性** | 存储写失败抛 `STORAGE_WRITE_FAILED`；CSV 防公式注入；导入限制 2 MiB / 2000 题                         |
| **本机资料**   | 头像通过 `wx.saveFile` 持久化，替换/退出清理旧文件，移除无效 `wx.login` / `sessionId`                 |
| **计时**       | 番茄钟、倒计时、考试改用绝对 deadline，回到前台按真实经过时间校准                                     |
| **工程**       | 目录生成确定性、私有配置忽略、破坏性一次性脚手架移除、CI 增加 STRICT gate                             |
| **桌面核验**   | DevTools CLI 导入成功；保留目录错误已清零；3.17.0 模拟器发现页渲染通过；3.16.2 工具内部渲染异常已隔离 |

仍待人工：DevTools 真机完成四 Tab、学习闭环、扫码/相册权限、头像、记账 CSV 与后台计时矩阵，并在公众平台核对隐私指引。

### 2026-07-25 — Brand fonts via loadFontFace

修复 DevTools「Failed to load local font resource / 500」：

- 移除 `app.wxss` 本地 `@font-face`
- 新增 `utils/fonts.js`：`wx.loadFontFace` 优先 HTTPS `spring-nest.pages.dev/fonts/miniapp/`，失败则包内 base64
- 字体同步到 `public/fonts/miniapp/` 供站点部署
- 中文仍走 Songti / 思源宋体系统栈，拉丁品牌字保留 Noto / Nunito / Jakarta

### 2026-07-25 — Launch hardening

上线前工程收口：

| 项               | 变更                                                                                    |
| ---------------- | --------------------------------------------------------------------------------------- |
| **主包体积**     | 删除 `NotoSerifSC-Bold-CN.woff`（~2.1MB）；`app.wxss` 仅保留 Latin Bold + 系统宋体回退  |
| **打包**         | `packOptions.ignore` 排除 scripts/docs/\*.md/package.json；`uploadWithSourceMap: false` |
| **隐私**         | `requiredPrivateInfos: []`；隐私页写明头像/相册/文件/剪贴板，明确不申请定位             |
| **offline 工具** | weather / ip / TTS runtime 改为 stub，移除 `getLocation` 与 wttr.in / ipapi.co          |
| **文档**         | `miniapp/README.md` 增加提审清单；本 QA 日志同步                                        |

仍待：DevTools 真机 G4/G5 走查 + 公众平台隐私指引勾选。

### 2026-07-26 — Remote fonts production enable

站点 `/fonts/miniapp/*.woff` 已部署（5 文件 `200` + `font/woff`，CORS `Access-Control-Allow-Origin: *`）。

| 项                    | 状态                                                                                           |
| --------------------- | ---------------------------------------------------------------------------------------------- |
| `ENABLE_REMOTE_FONTS` | `true`（HTTPS 优先，包内 base64 回退）                                                         |
| `verify:miniapp`      | 断言远程开启 + 站点/包内 5 字体齐全                                                            |
| 站点部署              | `spring-nest.pages.dev` 已含字体                                                               |
| **仍须人工**          | 公众平台 downloadFile 白名单 `https://spring-nest.pages.dev`；隐私指引勾选；真机预览后上传提审 |

### 2026-07-26 — Honest capability polish

| 项           | 变更                                                                |
| ------------ | ------------------------------------------------------------------- |
| **记账**     | 月份筛选、搜索、CSV 分享/复制导出，对齐目录承诺                     |
| **学习导入** | 页面 + mini catalog 文案改为 TXT/MD/CSV/JSON；明确不含 zip/rar/docx |
| **本机资料** | 「微信登录」→「保存本机资料」；隐私页同步                           |
| **二维码**   | canvas 绘制 + `saveImageToPhotosAlbum` PNG 保存                     |
| **主包字体** | 5× woff ≈ 90KB；verify 断言 < 200KB                                 |

## Sessions

### 2026-07-24 — UI parity vs Capacitor App

对标 `G:\untitled` Capacitor App，对齐小程序壳层与四 Tab 视觉：

| 项                | 变更                                                                                                                    |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Brand header**  | 新增 `components/brand-header/`；四 Tab `navigationStyle: custom`；Leaf +「Spring Nest」sticky 顶栏                     |
| **Custom tabBar** | `app.json` → `tabBar.custom: true`；新增 `custom-tab-bar/` glass pill（72px + safe bottom，active `#3f6751`/`#b7e3c8`） |
| **tool-card**     | 对齐 App metrics：grid / hero / quick(圆形 well) / dev(列+chevron+blob) / doc(居中)                                     |
| **发现**          | 标题「发现」on-surface；52px 搜索；常用+查看全部；日常 hero；趣味工具（原轻松一下）                                     |
| **开发**          | 「开发辅助」「安全隐私」+ subtitle；mode=dev 全宽                                                                       |
| **效率**          | 标题「生产力」；时间效率 / 学习与创作 / 文档转换；doc 用 mode=doc                                                       |
| **我的**          | 居中 96px 头像、「未登录」、登录 pill stub、两组 glass 列表                                                             |
| **底栏避让**      | `.tab-page` → `padding-bottom: calc(88px + safe-area)`                                                                  |

语法：`app.json` parse OK；相关 JS `node --check` OK。需 DevTools 同屏对标确认。

### 2026-07-24 — Static QA 2026-07-24

静态 QA（对标 untitled App / 计划清单），发现并修复：

| 级别   | 问题                                                                            | 修复                                                                                    |
| ------ | ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **P1** | 发现页日常区未按 `homePriority` 排序，hero 误为 calculator 而非 bookkeeping(96) | `discover/index.js` 对 daily/fun 按 priority 排序                                       |
| **P1** | `tool-shell` 收藏态始终显示空心 ♡，无实心反馈                                   | wxml 改为 `favorite ? ♥ : ♡`（练习页同步）                                              |
| **P1** | weather/ip 域名未白名单时错误文案不清晰                                         | `utils/request.js` 新增 `formatRequestError`；runtime catch 传入 `wttr.in` / `ipapi.co` |
| **P1** | 历史页 `data-tool="{{item.tool}}"` 对象 dataset 不可靠，打开工具可能失败        | 改为 `data-slug` + `findBySlug`                                                         |

核对通过（无需改）：

- 发现页：搜索 / 常用 3 列 / 日常 hero / 轻松一下 / `openTool` 导航
- 效率页：学习 hero → `packageStudy/pages/home`
- packageStudy bento 色值：`#FCF7F2` / `#FDF3F3` / `#F2FAF5` / `#F4F3FC` 等与计划一致
- `app.wxss`：`@font-face`（Noto Serif SC / Nunito / Plus Jakarta）+ design tokens
- `require` 路径抽查：catalog / packageStudy / packageTools / qrcode 均可达

DevTools：**已在运行**（`G:\微信web开发者工具\wechatdevtools.exe`，窗口 `spring-nest-miniprogram`）。本机 `%LOCALAPPDATA%\微信开发者工具\` 存在；CLI `G:\微信web开发者工具\cli.bat open --project G:\wanzan-main\miniapp` → **open OK**。STRICT verify **PASS**。

### 2026-07-24 — UI fine polish vs untitled App

对标 `G:\untitled`，**不大改架构**，接通已写好但未启用的壳层，并收口视觉细节：

| 项                | 变更                                                                                                                                 |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Custom tabBar** | `app.json` → `tabBar.custom: true`；玻璃底栏启用（72px + pt 8 + safe，active `#3f6751`/`#b7e3c8`，inactive `on-surface-variant/70`） |
| **Brand header**  | 四 Tab `navigationStyle: custom` + `<brand-header />`（Leaf + Spring Nest sticky）                                                   |
| **发现**          | 去掉内联品牌行；统一 `page-pad`/`section-gap`；搜索清空钮 + 空结果态；发现页同步 `getTabBar().setData({ selected: 0 })`              |
| **触感**          | tool-card / tab / 我的列表 / 学习 bento / chips / 历史行：`active:scale(0.98)`                                                       |
| **tool-shell**    | 间距对齐 App（header gap/px、body gap-6）；学习模式标题绝对居中；收藏态颜色                                                          |
| **清理**          | 移除 `app.js` / `discover` 内 `127.0.0.1:7319` debug ingest                                                                          |

需 DevTools 编译后同屏对标 untitled 确认 G4。

### 2026-07-24 — G4 acceptance prep

- 写入仓库根 `docs/miniapp-qa-log.md`（本文件）；`miniapp/docs/miniapp-qa-log.md` 可作历史脚手架笔记。
- `app.json` 补齐隐私声明、`__usePrivacyCheck__` 与 `networkTimeout`。
- `project.config.json` / `miniapp/README.md` 对齐交付说明。
- `generate:miniapp` → 29 tools；`verify:miniapp` + STRICT → PASS；vitest catalog → 7/7 PASS。
- Sanity：学习小筑 home 含 bento；tool-runtime 覆盖 29 slug；无「敬请期待」。
- Computer Use UI QA 仍待 DevTools 导入后执行（G4 手工对标 / G5 回归）。
