import { test, expect, type Page } from '@playwright/test';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';

async function getAnonymousId(page: Page): Promise<string | null> {
  return page.evaluate(() => localStorage.getItem('anonymous_id'));
}

async function registerCustomer(page: Page, unique: string) {
  const phone = `08${unique.slice(-8)}`;
  const password = '12121212';
  const email = `test.${unique}@example.com`;

  const response = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      prefix: 'นาย',
      name: 'Test User',
      email,
      phone,
      password,
    },
  });

  return { response, email, phone, password };
}

test.describe('User Stitching (Anonymous → Logged In)', () => {
  test('anonymous views stitch to user after login', async ({ page }) => {
    const unique = Date.now().toString();
    
    await page.goto(`${FRONTEND_URL}/tours/1`);
    await page.waitForLoadState('networkidle');
    
    const anonymousIdBefore = await getAnonymousId(page);
    expect(anonymousIdBefore).toBeTruthy();
    
    const { email, phone, password } = await registerCustomer(page, unique);
    
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="identifier"]', email);
    await page.fill('input[name="password"]', password);
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/(my-bookings|admin)?$/, { timeout: 10000 });
    
    const anonymousIdAfter = await getAnonymousId(page);
    expect(anonymousIdAfter).toBe(anonymousIdBefore);
  });

  test('tracking persists anonymous_id after authentication', async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours/1`);
    await page.waitForLoadState('networkidle');
    
    const anonId1 = await getAnonymousId(page);
    
    await page.goto(`${FRONTEND_URL}/login`);
    await page.fill('input[name="identifier"]', 'admin@9tours.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/admin/);
    
    const anonId2 = await getAnonymousId(page);
    expect(anonId2).toBe(anonId1);
  });

  test('views from same anonymous_id attributed after user registration', async ({ page, request }) => {
    const unique = Date.now().toString();
    
    await page.goto(`${FRONTEND_URL}/tours/1`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const anonId = await getAnonymousId(page);
    expect(anonId).toBeTruthy();
    
    const { email, phone, password } = await registerCustomer(page, unique);
    
    const loginResponse = await request.post(`${API_URL}/auth/login`, {
      data: { identifier: email, password, rememberMe: true },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const { access_token } = await loginResponse.json();
    
    await page.goto(`${FRONTEND_URL}/my-bookings`);
    await page.waitForLoadState('networkidle');
    
    await page.request.post(`${API_URL}/auth/logout`, {
      headers: { Authorization: `Bearer ${access_token}` },
    });
  });
});
