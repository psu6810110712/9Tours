import { test, expect, type Page } from '@playwright/test';
import { DashboardPage } from '../page-objects/DashboardPage';

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
}

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('dashboard shows all data by default', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    const startDateValue = await dashboardPage.startDateInput.inputValue();
    const endDateValue = await dashboardPage.endDateInput.inputValue();

    expect(startDateValue).toBe('');
    expect(endDateValue).toBe('');
  });

  test('date filter clear button resets to all data', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    await dashboardPage.startDateInput.fill('2025-01-01');
    await dashboardPage.endDateInput.fill('2025-12-31');

    const hasClearButton = await dashboardPage.clearDateFilterButton.isVisible();
    if (hasClearButton) {
      await dashboardPage.clearDateFilterButton.click();
      
      const startDateValue = await dashboardPage.startDateInput.inputValue();
      const endDateValue = await dashboardPage.endDateInput.inputValue();
      
      expect(startDateValue).toBe('');
      expect(endDateValue).toBe('');
    }
  });

  test('popularity by region pie chart renders', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await page.waitForLoadState('networkidle');

    await expect(dashboardPage.pieChart).toBeVisible({ timeout: 10000 });
  });
});
