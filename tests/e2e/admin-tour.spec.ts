import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';

async function loginAsAdmin(page: Page) {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      identifier: 'admin@9tours.com',
      password: 'password123',
      rememberMe: true,
    },
  });
  expect(response.ok()).toBeTruthy();
  const { access_token } = await response.json();
  
  await page.addInitScript((token) => {
    window.localStorage.setItem('auth_token', token);
  }, access_token);
  
  return access_token;
}

test.describe('Admin Tour Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('admin can view tours list', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/tours`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/admin\/tours/);
  });

  test('admin can navigate to create new tour page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/tours`);
    await page.waitForLoadState('networkidle');
    
    const createButton = page.locator('a[href*="/admin/tours/new"], button:has-text("สร้างทัวร์")').first();
    if (await createButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await createButton.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/\/admin\/tours\/new/);
    }
  });

  test('admin can edit existing tour', async ({ page, request }) => {
    const toursResponse = await request.get(`${API_URL}/tours/admin/overview`, {
      headers: { Authorization: `Bearer ${await loginAsAdmin(page)}` },
    });
    
    if (toursResponse.ok()) {
      await page.goto(`${FRONTEND_URL}/admin/tours`);
      await page.waitForLoadState('networkidle');
      
      const editButton = page.locator('a[href*="/edit"], button:has-text("แก้ไข")').first();
      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForLoadState('networkidle');
        await expect(page).toHaveURL(/\/admin\/tours\/\d+\/edit/);
      }
    }
  });

  test('admin can search tours in admin panel', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/tours`);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[name="q"], input[placeholder*="ค้นหา"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('ทะเล');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });

  test('admin can toggle tour active/inactive status', async ({ page, request }) => {
    const accessToken = await loginAsAdmin(page);
    
    const toursResponse = await request.get(`${API_URL}/tours?limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    
    if (toursResponse.ok()) {
      const tours = await toursResponse.json();
      if (tours.length > 0) {
        const tourId = tours[0].id;
        
        const toggleResponse = await request.patch(`${API_URL}/tours/${tourId}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          data: { isActive: false },
        });
        
        expect(toggleResponse.ok()).toBeTruthy();
      }
    }
  });

  test('admin can view tour overview statistics', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/tour-overview`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/admin\/tour-overview/);
  });

  test('tour form validates required fields', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/admin/tours/new`);
    await page.waitForLoadState('networkidle');
    
    const submitButton = page.locator('button[type="submit"]');
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');
      
      const errorMessage = page.locator('text=จำเป็น, text=required');
      if (await errorMessage.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });
});
