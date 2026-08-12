import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { games } from '../src/data/games';
import { tools } from '../src/data/tools';

const baseRoutes = [
  '/',
  '/tools',
  '/games',
  '/favorites',
  '/profile',
  '/about',
  '/search',
  '/feedback',
  '/privacy',
  '/terms',
  '/leaderboard',
  '/offline',
];

async function expectHealthyRoute(page: Page, route: string) {
  const response = await page.goto(route);
  expect(response?.status(), `${route} status`).toBeLessThan(500);
  await expect(page.locator('body')).not.toContainText('404');
  await expect(page.locator('body')).not.toContainText('页面未找到');
  await expect(page.locator('body')).not.toContainText('Application error');

  const visibleText = (await page.locator('body').innerText()).trim();
  expect(visibleText.length, `${route} visible content`).toBeGreaterThan(20);

  const headings = page.locator('main h1, main h2, main [role="heading"]');
  await expect(headings.first(), `${route} heading/main content`).toBeVisible();
}

test.describe('route and URL-state production coverage', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await page.route(/\.(?:mp4|webm)(?:\?.*)?$/, (route) => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('spring_nest_forest_splash', String(Date.now()));
    });
  });

  test('base app routes render without 404 or crash', async ({ page }) => {
    for (const route of baseRoutes) {
      await expectHealthyRoute(page, route);
    }
  });

  test('all data-backed tool and game routes render', async ({ page }) => {
    const dataRoutes = [...tools.map((item) => item.route), ...games.map((item) => item.route)];

    for (const route of dataRoutes) {
      await expectHealthyRoute(page, route);
      await expect(page.locator('main')).toContainText(/FAQ|使用方法|玩法说明|How to/);
    }
  });

  test('all routes expose real accessible names for visible form controls', async ({ page }) => {
    const routes = [
      ...baseRoutes,
      ...tools.map((item) => item.route),
      ...games.map((item) => item.route),
    ];

    for (const route of routes) {
      await page.goto(route);
      const missingLabels = await page.evaluate(() =>
        Array.from(
          document.querySelectorAll(
            'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled])',
          ),
        )
          .filter((element) => {
            const style = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            if (
              style.display === 'none' ||
              style.visibility === 'hidden' ||
              rect.width === 0 ||
              rect.height === 0
            )
              return false;
            const id = element.getAttribute('id');
            return (
              !element.getAttribute('aria-label') &&
              !element.getAttribute('aria-labelledby') &&
              !element.closest('label') &&
              !(id && document.querySelector(`label[for="${CSS.escape(id)}"]`)) &&
              !element.getAttribute('title')
            );
          })
          .map((element) => ({
            tag: element.tagName.toLowerCase(),
            type: element.getAttribute('type'),
            placeholder: element.getAttribute('placeholder'),
          })),
      );

      expect(missingLabels, `${route} unlabeled visible form controls`).toEqual([]);
    }
  });

  test('sitemap contains every data-backed and base route', async ({ page }) => {
    const sitemap = await (await page.request.get('/sitemap.xml')).text();
    const expectedRoutes = [
      ...baseRoutes,
      ...tools.map((item) => item.route),
      ...games.map((item) => item.route),
    ];

    for (const route of expectedRoutes) {
      expect(sitemap, `sitemap includes ${route}`).toContain(
        `https://spring-nest.pages.dev${route}`,
      );
    }
  });

  test('tools category and sort state are shareable via URL', async ({ page }) => {
    await page.goto(`/tools?category=${encodeURIComponent('学习写作')}&sort=name`);
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('学习写作');
    await expect(page.locator('select')).toHaveValue('name');
    await expect(page.locator('main article.motion-card').first()).toContainText('学习写作');

    await page.getByRole('button', { name: '安全隐私' }).click();
    await expect(page).toHaveURL(/\/tools\/security/);
    await page.locator('select').selectOption('newest');
    await expect(page).toHaveURL(/sort=newest/);

    await page.goto(`/tools?category=${encodeURIComponent('不存在')}&sort=unknown`);
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('全部工具');
    await expect(page.locator('select')).toHaveValue('popular');
  });

  test('games category and sort state are shareable via URL', async ({ page }) => {
    await page.goto(`/games?category=${encodeURIComponent('益智解谜')}&sort=popular`);
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('益智解谜');
    await expect(page.locator('main article.motion-card').first()).toContainText('益智解谜');

    await page.getByRole('button', { name: '学习练习' }).click();
    await expect(page).toHaveURL(/category=%E5%AD%A6%E4%B9%A0%E7%BB%83%E4%B9%A0/);
    await page.locator('select').selectOption('recent');
    await expect(page).toHaveURL(/sort=recent/);

    await page.goto(`/games?category=${encodeURIComponent('不存在')}`);
    await expect(page.locator('button[aria-pressed="true"]')).toContainText('全部游戏');
  });

  test('search supports q, type, sort, Chinese, English, and empty states', async ({ page }) => {
    await page.goto('/search?q=calculator&type=tools&sort=popular');
    await expect(page.locator('button').filter({ hasText: '工具' })).toHaveClass(/bg-primary/);
    await expect(page.locator('select')).toHaveValue('popular');
    await expect(page.locator('main')).toContainText('计算器');

    await page.goto(`/search?q=${encodeURIComponent('计算器')}&type=tools&sort=newest`);
    await expect(page.locator('select')).toHaveValue('newest');
    await expect(page.locator('main')).toContainText('计算器');

    await page.goto('/search?q=2048&type=games');
    await expect(page.locator('button').filter({ hasText: '游戏' })).toHaveClass(/bg-primary/);
    await expect(page.locator('main')).toContainText('2048');

    await page.goto('/search?q=no-such-spring-nest-result&type=all&sort=relevance');
    await expect(page.locator('main')).toContainText(/未找到相关结果|No results found/);
  });

  test('language can switch to English and core pages remain visible', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const user = {
        id: 'u_i18n',
        email: 'i18n@example.com',
        username: 'I18NUser',
        bio: '',
        createdAt: new Date().toISOString(),
      };
      localStorage.setItem(
        'spring_nest_users',
        JSON.stringify([{ ...user, password: 'password123' }]),
      );
      localStorage.setItem('spring_nest_current_user', JSON.stringify(user));
    });

    await page.goto('/profile');
    await page.getByRole('button', { name: '通用设置' }).click();
    await page.getByRole('button', { name: 'English' }).click();
    await expect(page.locator('main')).toContainText('Appearance & Language');

    await page.goto('/');
    await expect(page.locator('main')).toContainText('Free Online Tools and Casual Games');
    await page.goto('/tools');
    await expect(page.locator('main h1')).toContainText('Practical Tools');
    await page.goto('/games');
    await expect(page.locator('main h1')).toContainText('Game Paradise');
  });

  test('primary pages pass basic axe accessibility scan', async ({ page }) => {
    for (const route of ['/', '/tools', '/games', '/search']) {
      await page.goto(route);
      const results = await new AxeBuilder({ page }).include('main').analyze();
      expect(results.violations, `${route} axe violations`).toEqual([]);
    }
  });
});
