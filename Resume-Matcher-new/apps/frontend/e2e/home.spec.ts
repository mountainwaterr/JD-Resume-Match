import { test, expect } from '@playwright/test';

test.describe('首页', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('页面加载正常 — 标题、Hero区可见', async ({ page }) => {
    await expect(page).toHaveTitle(/Resume/);
    await expect(page.locator('h1')).toBeVisible({ timeout: 15000 });
  });

  test('Hero区显示中文关键文案', async ({ page }) => {
    await expect(page.locator('text=用 AI 打造完美简历')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('text=开始使用')).toBeVisible();
    await expect(page.locator('text=了解更多')).toBeVisible();
  });

  test('功能卡片区可见并显示3个功能', async ({ page }) => {
    await expect(page.locator('text=核心功能')).toBeVisible({ timeout: 15000 });
    const featureCards = page.locator('#features .grid > div');
    await expect(featureCards).toHaveCount(3);
  });

  test('点击"开始使用"跳转到登录页', async ({ page }) => {
    await page.locator('text=开始使用').first().click();
    await expect(page).toHaveURL(/\/login/);
  });

  test('点击"了解更多"后功能区域存在', async ({ page }) => {
    await page.locator('text=了解更多').click();
    await expect(page.locator('#features')).toBeVisible();
  });

  test('顶部品牌链接指向首页', async ({ page }) => {
    const brandLink = page.locator('header a[href="/"]');
    await expect(brandLink).toBeVisible();
    await expect(brandLink).toContainText('Resume');
  });

  test('统计区域显示核心数据', async ({ page }) => {
    await expect(page.locator('text=10k+')).toBeVisible();
    await expect(page.locator('text=95%')).toBeVisible();
  });

  test('Footer有GitHub链接', async ({ page }) => {
    const githubLink = page.locator('footer a[href*="github.com"]');
    await expect(githubLink).toBeVisible();
  });
});
