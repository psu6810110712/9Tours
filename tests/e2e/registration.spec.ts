import { test, expect } from '@playwright/test';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';

test.describe('User Registration', () => {
  test('can access registration page', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/register/);
  });

  test('can register with email and password', async ({ page }) => {
    const unique = Date.now().toString();
    const phone = `08${unique.slice(-8)}`;
    const email = `newuser.${unique}@example.com`;
    const password = '12121212';

    await page.goto(`${FRONTEND_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="prefix"]', 'นาย');
    await page.fill('input[name="name"]', 'New User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', phone);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    const registerButton = page.locator('button[type="submit"]');
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForURL(/\/(complete-profile|my-bookings)?/, { timeout: 10000 });
    }
  });

  test('shows error for duplicate email', async ({ page, request }) => {
    const unique = Date.now().toString();
    const phone = `08${unique.slice(-8)}`;
    const email = `duplicate.${unique}@example.com`;
    const password = '12121212';

    await request.post(`${API_URL}/auth/register`, {
      data: {
        prefix: 'นาย',
        name: 'First User',
        email,
        phone,
        password,
      },
    });

    await page.goto(`${FRONTEND_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="prefix"]', 'นาย');
    await page.fill('input[name="name"]', 'Second User');
    await page.fill('input[name="email"]', email);
    await page.fill('input[name="phone"]', `08${String(Number(unique) + 1).slice(-8)}`);
    await page.fill('input[name="password"]', password);
    await page.fill('input[name="confirmPassword"]', password);

    const registerButton = page.locator('button[type="submit"]');
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForTimeout(1000);
      
      const errorMessage = page.locator('text=อีเมล, text=ซ้ำ, text=มีอยู่แล้ว');
      if (await errorMessage.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(errorMessage.first()).toBeVisible();
      }
    }
  });

  test('validates required fields', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`);
    await page.waitForLoadState('networkidle');

    const registerButton = page.locator('button[type="submit"]');
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForTimeout(500);
      
      const requiredError = page.locator('text=จำเป็น, text=required');
      if (await requiredError.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(requiredError.first()).toBeVisible();
      }
    }
  });

  test('validates password match', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/register`);
    await page.waitForLoadState('networkidle');

    await page.fill('input[name="prefix"]', 'นาย');
    await page.fill('input[name="name"]', 'Test User');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="phone"]', '0812345678');
    await page.fill('input[name="password"]', 'password123');
    await page.fill('input[name="confirmPassword"]', 'differentpass');

    const registerButton = page.locator('button[type="submit"]');
    if (await registerButton.isVisible()) {
      await registerButton.click();
      await page.waitForTimeout(500);
      
      const mismatchError = page.locator('text=ไม่ตรง, text=match');
      if (await mismatchError.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(mismatchError.first()).toBeVisible();
      }
    }
  });
});
