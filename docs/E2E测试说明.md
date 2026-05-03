# E2E 测试说明

本文档说明 Spring Nest 项目的端到端 (E2E) 测试方案，包括测试框架、用例清单、运行方式和常见问题排查。

---

## 测试框架

项目使用 [Playwright](https://playwright.dev/) 作为 E2E 测试框架。

| 配置项 | 值 |
|--------|-----|
| 配置文件 | `playwright.config.ts` |
| 测试目录 | `e2e/` |
| 测试文件 | `e2e/app.spec.ts` |
| 浏览器 | Chromium (Microsoft Edge) |
| 基础URL | `http://localhost:3000` |
| 并行执行 | 是 |
| CI 重试次数 | 2 次 |
| 失败截图 | 自动保存 |
| 失败追踪 | 首次重试时记录 |

---

## 测试用例清单

当前共 **11 个** E2E 测试用例，覆盖核心用户流程：

| 编号 | 测试场景 | 验证内容 |
|------|----------|----------|
| 1 | 首页正常加载 | 页面标题、导航链接（首页/游戏天堂/实用小筑） |
| 2 | 工具列表进入计算器 | 工具列表页标题、计算器卡片可见、点击跳转到 `/tools/calculator` |
| 3 | 游戏列表进入 2048 | 游戏列表页标题、2048 卡片可见、点击跳转到 `/games/2048` |
| 4 | 搜索关键词并进入结果 | 搜索按钮交互、输入"计算器"、跳转到搜索结果页、结果包含计算器 |
| 5 | 注册账号 | 打开登录弹窗、切换注册模式、填写邮箱密码、提交成功 |
| 6 | 登录账号 | 预置用户数据、打开登录弹窗、填写凭据、登录成功 |
| 7 | 收藏工具 | 登录后进入工具页、点击收藏按钮、按钮状态变为"取消收藏" |
| 8 | 收藏游戏 | 登录后进入游戏页、点击收藏按钮、按钮状态变为"取消收藏" |
| 9 | 刷新后收藏仍存在 | 收藏工具后刷新页面、收藏状态保持不变 |
| 10 | 切换暗色主题 | 点击主题切换按钮、验证 class 变化、二次点击验证循环切换 |
| 11 | 访问不存在路由显示 404 | 访问 `/nonexistent`、显示 404 和"页面未找到"、点击"返回首页"跳转 |

---

## 运行方式

### 前置条件

```bash
npm install    # 安装依赖
npx playwright install --with-deps chromium    # 安装 Playwright 浏览器
```

### 运行全部测试

```bash
npm run test:e2e
```

这会自动启动开发服务器 (`npm run dev`)，运行所有测试，然后关闭服务器。

### 打开 Playwright UI 模式

```bash
npm run test:e2e:ui
```

UI 模式提供可视化界面，可以逐步执行测试、查看截图和追踪记录，适合调试。

### 直接使用 Playwright CLI

```bash
# 运行指定测试文件
npx playwright test e2e/app.spec.ts

# 运行指定测试用例（按标题匹配）
npx playwright test -g "首页正常加载"

# 以 headed 模式运行（显示浏览器窗口）
npx playwright test --headed

# 查看测试报告
npx playwright show-report
```

---

## 测试架构

### 文件结构

```
e2e/
└── app.spec.ts          # 所有 E2E 测试用例
playwright.config.ts     # Playwright 配置
```

### 测试前置处理

每个测试用例执行前，会自动清理 localStorage：

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});
```

这保证了测试之间的隔离性，避免数据残留影响结果。

### 测试模式

测试采用以下模式编写：

1. **页面导航**: 使用 `page.goto()` 跳转到目标路由
2. **元素定位**: 使用 `page.locator()` 定位 DOM 元素
3. **交互操作**: 使用 `.click()`、`.fill()`、`.press()` 模拟用户操作
4. **断言验证**: 使用 `expect()` 验证页面状态
5. **数据预置**: 使用 `page.evaluate()` 直接写入 localStorage 模拟登录状态

---

## CI 集成

E2E 测试已集成到 GitHub Actions CI 流水线中。

### 执行流程

```
push/PR to main
    ↓
lint-and-test (类型检查 + 单元测试 + 构建)
    ↓ (通过后)
e2e (Playwright 测试)
```

### CI 配置要点

- **依赖**: E2E 阶段依赖 `lint-and-test` 通过
- **浏览器缓存**: 使用 `actions/cache` 缓存 Playwright 浏览器，加速安装
- **失败处理**: 测试失败时自动上传 `playwright-report/` 作为 artifact
- **重试**: CI 环境下自动重试 2 次，减少偶发失败影响
- **单线程**: CI 环境下使用 1 个 worker，避免资源竞争

相关配置见 [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)。

---

## 常见问题排查

### 1. 测试启动失败：浏览器未安装

**错误信息**: `Executable doesn't exist ... chromium`

**解决方法**:

```bash
npx playwright install --with-deps chromium
```

### 2. 端口被占用

**错误信息**: `EADDRINUSE: address already in use :::3000`

**解决方法**:

```bash
# 查找占用端口的进程
netstat -ano | findstr :3000

# 终止进程后重新运行测试
npm run test:e2e
```

### 3. 测试超时

**错误信息**: `Timeout 30000ms exceeded`

**可能原因**:
- 开启了 VPN 或代理，影响本地连接
- 电脑性能不足，页面加载慢
- 开发服务器启动失败

**解决方法**:
- 关闭 VPN/代理
- 检查 `npm run dev` 能否正常启动
- 在 `playwright.config.ts` 中增大 `timeout` 值

### 4. 元素定位失败

**错误信息**: `locator.click: Target closed` 或 `locator not found`

**可能原因**:
- 页面结构变更，选择器失效
- 动画未完成就执行了操作

**解决方法**:
- 使用 Playwright UI 模式 (`npm run test:e2e:ui`) 逐步调试
- 检查页面实际 DOM 结构
- 添加 `await page.waitForTimeout()` 等待动画完成

### 5. CI 中偶发失败

**可能原因**:
- 网络波动
- 资源竞争

**解决方法**:
- CI 已配置自动重试 2 次
- 检查 GitHub Actions 日志中的具体错误
- 确认测试用例之间无数据依赖（beforeEach 已清理 localStorage）
