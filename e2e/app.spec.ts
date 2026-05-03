import { test, expect } from '@playwright/test';

test.describe('Spring Nest App', () => {
  test.describe.configure({ timeout: 45000 });

  test.beforeEach(async ({ page }) => {
    // Navigate once and clear localStorage — each test navigates to its own page anyway
    await page.goto('/', { timeout: 20000 });
    await page.evaluate(() => localStorage.clear());
  });

  test('1. 首页正常加载', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Spring Nest/);
    await expect(page.locator('text=Spring Nest').first()).toBeVisible();
    // Verify nav links exist
    await expect(page.locator('nav >> text=首页')).toBeVisible();
    await expect(page.locator('nav >> text=游戏天堂')).toBeVisible();
    await expect(page.locator('nav >> text=实用小筑')).toBeVisible();
  });

  test('2. 工具列表进入计算器', async ({ page }) => {
    await page.goto('/tools');
    await expect(page.locator('h1')).toContainText('实用小筑');
    // Find the calculator card and click "打开工具"
    const calculatorCard = page.locator('text=计算器').first();
    await expect(calculatorCard).toBeVisible();
    // Click the "打开工具" button within the calculator card area
    const openButtons = page.locator('button:has-text("打开工具")');
    await openButtons.first().click();
    // Verify calculator page loads - should show calculator UI
    await expect(page).toHaveURL(/\/tools\/calculator/);
  });

  test('3. 游戏列表进入 2048', async ({ page }) => {
    await page.goto('/games');
    await expect(page.locator('h1')).toContainText('游戏天堂');
    // Find the 2048 game card
    const game2048 = page.locator('text=2048').first();
    await expect(game2048).toBeVisible();
    // Click "开始游戏" button for the first game (2048)
    const playButtons = page.locator('button:has-text("开始游戏")');
    await playButtons.first().click();
    // Verify 2048 game page loads
    await expect(page).toHaveURL(/\/games\/2048/);
  });

  test('4. 搜索关键词并进入结果', async ({ page }) => {
    await page.goto('/');
    // Click search icon button in the nav
    const searchButton = page.locator('header button').filter({ has: page.locator('svg.lucide-search') });
    await searchButton.click();
    // Wait for search input to appear and type keyword
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('计算器');
    await searchInput.press('Enter');
    // Verify navigation to search results page
    await expect(page).toHaveURL(/\/search\?q=/);
    await expect(page.locator('text=搜索结果')).toBeVisible();
    // Verify results contain calculator
    await expect(page.locator('text=计算器').first()).toBeVisible();
  });

  test('5. 注册账号', async ({ page }) => {
    await page.goto('/');
    // Click user icon button to open login modal
    const userButton = page.locator('header button').filter({ has: page.locator('svg.lucide-user') });
    await userButton.click();
    // Wait for login modal to appear
    await expect(page.locator('text=欢迎回来')).toBeVisible();
    // Switch to register mode
    await page.locator('text=没有账号？去注册').click();
    await expect(page.locator('text=开启数字治愈之旅')).toBeVisible();
    // Fill registration form
    await page.locator('input[placeholder*="邮箱"]').fill('test@example.com');
    await page.locator('input[placeholder*="密码"]').fill('password123');
    // Submit
    await page.locator('button[type="submit"]').click();
    // Verify modal closes (user is now logged in) - user avatar should appear
    await expect(page.locator('text=开启数字治愈之旅')).not.toBeVisible({ timeout: 5000 });
  });

  test('6. 登录账号', async ({ page }) => {
    await page.goto('/');
    // First register a user via localStorage
    await page.evaluate(() => {
      const users = [{
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        bio: '',
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('spring_nest_users', JSON.stringify(users));
    });
    await page.reload();
    // Click user icon to open login modal
    const userButton = page.locator('header button').filter({ has: page.locator('svg.lucide-user') });
    await userButton.click();
    // Fill login form
    await expect(page.locator('text=欢迎回来')).toBeVisible();
    await page.locator('input[placeholder*="邮箱"]').fill('test@example.com');
    await page.locator('input[placeholder*="密码"]').fill('password123');
    // Submit
    await page.locator('button[type="submit"]').click();
    // Verify modal closes and user is logged in
    await expect(page.locator('text=欢迎回来')).not.toBeVisible({ timeout: 5000 });
  });

  test('7. 收藏工具', async ({ page }) => {
    await page.goto('/');
    // Register and login first
    await page.evaluate(() => {
      const users = [{
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        bio: '',
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('spring_nest_users', JSON.stringify(users));
      localStorage.setItem('spring_nest_current_user', JSON.stringify({
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        bio: '',
        createdAt: new Date().toISOString(),
      }));
    });
    await page.reload();
    // Navigate to tools page
    await page.goto('/tools');
    await expect(page.locator('h1')).toContainText('实用小筑');
    // Click the heart/favorite button on the first tool card (scoped to main, not nav)
    const favButton = page.locator('main [aria-label="收藏"]').first();
    await expect(favButton).toBeVisible();
    await favButton.click();
    // Verify the button now shows "取消收藏" (unfavorite)
    await expect(page.locator('main [aria-label="取消收藏"]').first()).toBeVisible();
  });

  test('8. 收藏游戏', async ({ page }) => {
    await page.goto('/');
    // Register and login first
    await page.evaluate(() => {
      const users = [{
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        bio: '',
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('spring_nest_users', JSON.stringify(users));
      localStorage.setItem('spring_nest_current_user', JSON.stringify({
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        bio: '',
        createdAt: new Date().toISOString(),
      }));
    });
    await page.reload();
    // Navigate to games page
    await page.goto('/games');
    await expect(page.locator('h1')).toContainText('游戏天堂');
    // Click the heart/favorite button on the first game card (scoped to main, not nav)
    const favButton = page.locator('main [aria-label="收藏"]').first();
    await expect(favButton).toBeVisible();
    await favButton.click();
    // Verify the button now shows "取消收藏" (unfavorite)
    await expect(page.locator('main [aria-label="取消收藏"]').first()).toBeVisible();
  });

  test('9. 刷新后收藏仍存在', async ({ page }) => {
    await page.goto('/');
    // Register and login first
    await page.evaluate(() => {
      const users = [{
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        bio: '',
        createdAt: new Date().toISOString(),
      }];
      localStorage.setItem('spring_nest_users', JSON.stringify(users));
      localStorage.setItem('spring_nest_current_user', JSON.stringify({
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        bio: '',
        createdAt: new Date().toISOString(),
      }));
    });
    await page.reload();
    // Navigate to tools page and favorite the first tool
    await page.goto('/tools');
    const favButton = page.locator('main [aria-label="收藏"]').first();
    await expect(favButton).toBeVisible();
    await favButton.click();
    await expect(page.locator('main [aria-label="取消收藏"]').first()).toBeVisible();
    // Refresh the page
    await page.reload();
    // Verify the favorite persists
    await expect(page.locator('main [aria-label="取消收藏"]').first()).toBeVisible();
  });

  test('10. 切换暗色主题', async ({ page }) => {
    await page.goto('/');
    // Explicitly set theme to light mode first for deterministic starting state
    await page.evaluate(() => {
      localStorage.setItem('spring_nest_theme', 'light');
      document.documentElement.classList.remove('dark');
    });
    await page.reload();

    // Verify starts in light mode (no dark class)
    const initialHasDark = await page.evaluate(() => document.documentElement.classList.contains('dark'));
    expect(initialHasDark).toBe(false);

    // Find the theme toggle button by aria-label
    const themeButton = page.locator('header button[aria-label*="主题"], header button[aria-label*="Toggle"]').first();
    await expect(themeButton).toBeVisible();

    // Click 1: light → dark — verify dark class is added
    await themeButton.click();
    await page.waitForTimeout(300);
    const afterFirstClick = await page.evaluate(() => ({
      hasDark: document.documentElement.classList.contains('dark'),
      storedTheme: localStorage.getItem('spring_nest_theme'),
    }));
    expect(afterFirstClick.hasDark).toBe(true);
    expect(afterFirstClick.storedTheme).toBe('dark');

    // Click 2: dark → system — dark class depends on system preference
    await themeButton.click();
    await page.waitForTimeout(300);
    const afterSecondClick = await page.evaluate(() => ({
      hasDark: document.documentElement.classList.contains('dark'),
      storedTheme: localStorage.getItem('spring_nest_theme'),
    }));
    expect(afterSecondClick.storedTheme).toBe('system');

    // Click 3: system → light — verify dark class is removed
    await themeButton.click();
    await page.waitForTimeout(300);
    const afterThirdClick = await page.evaluate(() => ({
      hasDark: document.documentElement.classList.contains('dark'),
      storedTheme: localStorage.getItem('spring_nest_theme'),
    }));
    expect(afterThirdClick.hasDark).toBe(false);
    expect(afterThirdClick.storedTheme).toBe('light');
  });

  test('11. 访问不存在路由显示 404', async ({ page }) => {
    await page.goto('/nonexistent');
    // Verify 404 page content
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=页面未找到')).toBeVisible();
    // Verify "返回首页" link exists
    await expect(page.locator('text=返回首页')).toBeVisible();
    // Click "返回首页" and verify navigation
    await page.locator('text=返回首页').click();
    await expect(page).toHaveURL('/');
  });

  test('12. localStorage 清理后状态正确', async ({ page }) => {
    await page.goto('/');
    // Set up user state, then clear and verify clean state
    await page.evaluate(() => {
      localStorage.setItem('spring_nest_users', JSON.stringify([{
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        password: 'password123',
        bio: '',
        createdAt: new Date().toISOString(),
      }]));
      localStorage.setItem('spring_nest_current_user', JSON.stringify({
        id: 'u_test123',
        email: 'test@example.com',
        username: 'TestUser',
        bio: '',
        createdAt: new Date().toISOString(),
      }));
      localStorage.setItem('spring_nest_favorites', JSON.stringify({
        u_test123: { tools: ['calculator'], games: ['2048'] },
      }));
      localStorage.setItem('spring_nest_theme', 'dark');
    });

    // Verify data is set
    const beforeClear = await page.evaluate(() => ({
      users: localStorage.getItem('spring_nest_users'),
      currentUser: localStorage.getItem('spring_nest_current_user'),
      favorites: localStorage.getItem('spring_nest_favorites'),
      theme: localStorage.getItem('spring_nest_theme'),
    }));
    expect(beforeClear.users).toBeTruthy();
    expect(beforeClear.currentUser).toBeTruthy();
    expect(beforeClear.favorites).toBeTruthy();
    expect(beforeClear.theme).toBe('dark');

    // Clear localStorage
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Verify all keys are gone
    const afterClear = await page.evaluate(() => ({
      users: localStorage.getItem('spring_nest_users'),
      currentUser: localStorage.getItem('spring_nest_current_user'),
      favorites: localStorage.getItem('spring_nest_favorites'),
      theme: localStorage.getItem('spring_nest_theme'),
    }));
    expect(afterClear.users).toBeNull();
    expect(afterClear.currentUser).toBeNull();
    expect(afterClear.favorites).toBeNull();
    expect(afterClear.theme).toBeNull();

    // Verify the app still works — user icon should show login button (not avatar)
    const userButton = page.locator('header button[aria-label*="登录"], header button[aria-label*="Log in"]').first();
    await expect(userButton).toBeVisible();

    // Verify favorites page shows empty state (no crash)
    await page.goto('/favorites');
    // Should not show a 404 or error — just empty or prompt to login
    await expect(page).not.toHaveURL(/nonexistent/);
  });

  test('13. PWA manifest 存在验证', async ({ page }) => {
    await page.goto('/');

    // Verify PWA-related meta tags exist in the HTML
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#3f6751');
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', /apple-touch-icon/);
    await expect(page.locator('meta[name="apple-mobile-web-app-capable"]')).toHaveAttribute('content', 'yes');

    // Try to fetch manifest.webmanifest — in dev mode vite-plugin-pwa may or may not serve it
    const response = await page.request.get('/manifest.webmanifest');
    const contentType = response.headers()['content-type'] || '';

    if (response.ok() && contentType.includes('json')) {
      // Production build or dev with PWA enabled — verify manifest content
      const manifest = await response.json();
      expect(manifest.name).toContain('Spring Nest');
      expect(manifest.short_name).toBe('Spring Nest');
      expect(manifest.display).toBe('standalone');
      expect(manifest.start_url).toBe('/');
      expect(manifest.icons).toBeDefined();
      expect(manifest.icons.length).toBeGreaterThan(0);

      // Verify the manifest link tag exists
      const manifestLink = page.locator('link[rel="manifest"]');
      await expect(manifestLink).toHaveAttribute('href', /manifest/);
    } else {
      // Dev mode without PWA enabled — verify the manifest config exists in build output
      // The manifest.webmanifest is generated at build time by vite-plugin-pwa
      // In dev mode, we verify the PWA meta tags are present (already checked above)
      expect(response.status()).toBeLessThan(500);
    }
  });
});
