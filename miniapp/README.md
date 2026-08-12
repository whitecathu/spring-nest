# 春日小筑 · 微信小程序

原生微信小程序壳层，与 Web/App「春日小筑」工具目录对齐。源目录保留 29 项，其中 24 个工具正式可见；天气 / IP / TTS 已下线，Word→PDF / PDF→Word 因缺少核心转换能力已隐藏且不进入发布包。

## 用微信开发者工具打开

1. 安装 [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)
2. 选择「导入项目」
3. 目录选本仓库的 `miniapp/`（即含 `app.json` / `project.config.json` 的目录）
4. AppID 使用 `project.config.json` 中的正式号（当前 `wx1cba5f9a3dba1eba`）；本地调试也可用测试号
5. 编译后应看到四个 Tab：发现 / 开发 / 效率 / 我的

> Computer Use / 人工 UI QA 前，请先打开开发者工具并完成上述导入；自动化 MCP 不会替你拉起 DevTools。
>
> 若基础库 3.16.2 出现 `enableUpdateWxAppCode` 渲染层异常/白屏，请在「详情 → 本地设置 → 调试基础库」切换到 3.17.0（或重新下载可用稳定版），关闭并重新打开项目后再编译。本仓库测试位于根目录 `tests/miniapp/`，不要在小程序目录创建 `__tests__`（微信开发者工具会把它视为保留目录）。

## 上线前清单（提审）

### 工程侧（本仓库）

- [x] 主包瘦身：移除 `NotoSerifSC-Bold-CN.woff`；中文标题回退系统宋体
- [x] `packOptions.ignore` / `uploadWithSourceMap: false` / 隐私空 `requiredPrivateInfos`
- [x] 天气 / IP / TTS offline，无 `getLocation` / 外网工具域名
- [x] 字体：去掉 WXSS 本地 `@font-face`；`wx.loadFontFace`（HTTPS 优先 + 包内 base64 回退）
- [x] 部署站点使 `/fonts/miniapp/*.woff` 可访问（`public/fonts/miniapp/` → 已上线）
- [x] `ENABLE_REMOTE_FONTS = true`（工程侧已打开）
- [x] 主包 fallback 字体约 90KB（远低于 2MB 主包上限）
- [x] 记账：月份筛选 / 搜索 / 安全 CSV 导出；学习导入限制 2 MiB / 2000 题；资料头像持久化；二维码可保存相册
- [x] Word→PDF / PDF→Word：目录、搜索、历史、收藏、深链隐藏，页面不进入分包
- [x] 密码：使用 `wx.getRandomValues` 安全随机源；番茄钟 / 倒计时 / 考试支持后台时间校准
- [ ] **必做（公众平台）** downloadFile 合法域名：`https://spring-nest.pages.dev`
- [ ] DevTools 真机预览：四 Tab、学习小筑闭环、扫码/记账、头像、后台计时、隐私
- [ ] 上传代码 → 提交审核前再跑一遍 STRICT verify

### 微信公众平台（须人工完成）

路径：**微信公众平台 → 开发 → 开发管理 → 开发设置 → 服务器域名**

1. **downloadFile 合法域名**（字体 HTTPS 必需，否则真机走包内回退）：
   - 添加：`https://spring-nest.pages.dev`
   - 保存后等待生效（通常数分钟；改域名可能需管理员扫码）
2. **request 合法域名**：正式版默认可留空（天气 / IP / TTS 已 offline）
3. **用户隐私保护指引**与代码一致，勾选实际会用到的：
   - 用户主动选择的头像、填写的昵称与简介（仅保存在本机）
   - 选中的照片或视频信息 / 摄像头（扫描）
   - 相册（仅写入）权限（保存扫描结果）
   - 选中的文件（题库 / 文档）
   - 剪切板（复制结果）
   - **不要**勾选位置信息（正式版未使用）
4. 隐私弹窗文案可指向小程序内 `/pages/privacy/index`
5. 类目、简介、图标、截图、版本说明（说明本地工具为主；不要宣传当前隐藏的 Word/PDF 转换）

## 域名白名单（真机 / 正式环境）

正式版默认**不依赖**外网工具 API。品牌字体通过 `wx.loadFontFace` 从站点拉取：

**downloadFile 合法域名**（真机 HTTPS 字体必配）：

| 域名                            | 用途                             |
| ------------------------------- | -------------------------------- |
| `https://spring-nest.pages.dev` | 品牌字体 `/fonts/miniapp/*.woff` |

开发者工具可临时关闭「不校验合法域名」（`project.private.config.json` 已 `urlCheck: false`）。

生产：`ENABLE_REMOTE_FONTS = true`，优先 HTTPS；失败则包内 base64。开发者工具直接使用包内字体，避免其网络字体缓存产生 `ERR_CACHE_MISS`。

若日后重新上线天气 / IP，再额外配置 **request** 域名：

| 域名               | 用途                    |
| ------------------ | ----------------------- |
| `https://wttr.in`  | 天气（当前 offline）    |
| `https://ipapi.co` | IP 查询（当前 offline） |

## 字体

**不要**在 WXSS 里 `@font-face` 引用本地 woff（开发者工具会 500 / `do-not-use-local-path`）。

启动时 `app.js` → `utils/fonts.js` 用 `wx.loadFontFace({ global: true })` 注入：

- **Noto Serif SC**（Latin Bold）— 品牌衬线；中文回退 Songti / 思源宋体
- **Nunito Sans** — 标题 / 标签
- **Plus Jakarta Sans** — 正文与「Spring Nest」拉丁

站点静态资源（已部署）：`https://spring-nest.pages.dev/fonts/miniapp/*.woff`

包内仍保留同名 woff，供开发者工具直接加载并作为真机网络失败时的 base64 回退；请勿改成 Google Fonts CDN。

## Tab 结构

| Tab  | 页面                | 内容                                |
| ---- | ------------------- | ----------------------------------- |
| 发现 | `pages/discover`    | 日常 / 趣味等快捷工具               |
| 开发 | `pages/development` | JSON、编解码等                      |
| 效率 | `pages/efficiency`  | 时间效率、学习写作；学习小筑为 hero |
| 我的 | `pages/profile`     | 收藏 / 记录 / 关于入口              |

学习小筑在分包 `packageStudy/`；扫码与记账在 `packageTools/`。Word/PDF 转换源码仅保留为未来实现参考，不在 `app.json` 注册，也不会进入发布包。

## 常用命令（仓库根目录）

```bash
npm run generate:miniapp
npm run verify:miniapp
# PowerShell 严格模式：
$env:MINIAPP_VERIFY_STRICT=1; npm run verify:miniapp
npx vitest run src/__tests__/miniProgramCatalog.test.ts
npx vitest run tests/miniapp
```
