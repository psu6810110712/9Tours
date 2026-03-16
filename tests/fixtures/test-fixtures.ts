import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: void;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  authenticatedPage: async ({ page, request }, use) => {
    // Example of setting up auth state
    const apiUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';
    const response = await request.post(`${apiUrl}/auth/login`, {
      data: {
        identifier: 'admin@9tours.com',
        password: 'password123',
        rememberMe: true,
      },
    });
    const { access_token } = await response.json();
    
    await page.addInitScript((token) => {
      window.localStorage.setItem('auth_token', token);
    }, access_token);

    await use();
  },
});

export { expect } from '@playwright/test';
