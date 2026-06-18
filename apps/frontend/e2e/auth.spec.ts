import { test, expect } from '@playwright/test';

test.describe('登录页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
  });

  test('页面加载 — 表单字段可见', async ({ page }) => {
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('输入密码')).toBeVisible();
    await expect(page.getByRole('button', { name: '登录' })).toBeVisible();
  });

  test('"返回首页"链接跳转', async ({ page }) => {
    await page.getByRole('link', { name: '返回首页' }).click();
    await expect(page).toHaveURL('/');
  });

  test('"注册"链接跳转', async ({ page }) => {
    await page.getByRole('link', { name: '注册' }).click();
    await expect(page).toHaveURL(/\/register/);
  });
});

test.describe('注册页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/register', { waitUntil: 'domcontentloaded' });
  });

  test('页面加载 — 三字段表单可见', async ({ page }) => {
    await expect(page.getByPlaceholder('你的昵称（至少2个字符）')).toBeVisible({ timeout: 15000 });
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.getByPlaceholder('至少 8 个字符')).toBeVisible();
    await expect(page.getByRole('button', { name: '注册' })).toBeVisible();
  });

  test('"返回首页"链接跳转', async ({ page }) => {
    await page.getByRole('link', { name: '返回首页' }).click();
    await expect(page).toHaveURL('/');
  });

  test('"登录"链接跳转', async ({ page }) => {
    await page.getByRole('link', { name: '登录' }).click();
    await expect(page).toHaveURL(/\/login/);
  });
});
