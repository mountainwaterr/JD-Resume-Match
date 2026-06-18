import { test, expect } from '@playwright/test';

test.describe('页面间导航', () => {
  test('首页 → 登录 → 注册 → 首页 完整循环', async ({ page }) => {
    // 首页
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });

    // → 登录
    await page.locator('text=开始使用').first().click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 10000 });

    // → 注册
    await page.getByRole('link', { name: '注册' }).click();
    await expect(page).toHaveURL(/\/register/);
    await expect(page.getByPlaceholder('你的昵称（至少2个字符）')).toBeVisible({ timeout: 10000 });

    // → 返回首页
    await page.getByRole('link', { name: '返回首页' }).click();
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
