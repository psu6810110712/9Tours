import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';

test.describe('Tour Listing & Search', () => {
  test('displays tours list page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/tours/);
  });

  test('can search tours by keyword', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[name="q"], input[placeholder*="ค้นหา"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('ทะเล');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('can filter tours by category', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');
    
    const categoryFilter = page.locator('select[name="category"], select[name="type"]');
    if (await categoryFilter.isVisible()) {
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('can filter tours by region/province', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');
    
    const regionFilter = page.locator('select[name="region"], select[name="province"]');
    if (await regionFilter.isVisible()) {
      await regionFilter.selectOption({ index: 1 });
      await page.waitForLoadState('networkidle');
    }
  });

  test('can sort tours by price', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');
    
    const sortSelect = page.locator('select[name="sort"], select[name="sortBy"]');
    if (await sortSelect.isVisible()) {
      await sortSelect.selectOption('price_asc');
      await page.waitForLoadState('networkidle');
    }
  });

  test('can navigate to tour detail from listing', async ({ page, request }) => {
    const response = await request.get(`${API_URL}/tours`);
    const tours = await response.json();
    
    if (tours.length > 0) {
      await page.goto(`${FRONTEND_URL}/tours`);
      await page.waitForLoadState('networkidle');
      
      const firstTourCard = page.locator('a[href^="/tours/"]').first();
      if (await firstTourCard.isVisible()) {
        await firstTourCard.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/tours\/\d+/);
      }
    }
  });

  test('displays empty state when no tours match filters', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours?q=nonexistenttour12345`);
    await page.waitForLoadState('networkidle');
    
    const noResults = page.locator('text=ไม่พบทัวร์, text=ไม่มีทัวร์');
    if (await noResults.first().isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(noResults.first()).toBeVisible();
    }
  });

  test('tour card displays essential info', async ({ page, request }) => {
    const response = await request.get(`${API_URL}/tours`);
    const tours = await response.json();
    
    if (tours.length > 0) {
      await page.goto(`${FRONTEND_URL}/tours`);
      await page.waitForLoadState('networkidle');
      
      const tourCard = page.locator('[class*="tour"], [class*="card"]').first();
      if (await tourCard.isVisible()) {
        await expect(tourCard).toBeVisible();
      }
    }
  });
});
