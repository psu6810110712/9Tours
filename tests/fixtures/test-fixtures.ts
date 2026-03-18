import { test as base } from '@playwright/test';
import { LoginPage } from '../page-objects/LoginPage';
import { DashboardPage } from '../page-objects/DashboardPage';
import { TrackingPage } from '../page-objects/TrackingPage';

type MyFixtures = {
  loginPage: LoginPage;
  dashboardPage: DashboardPage;
  trackingPage: TrackingPage;
  authenticatedPage: void;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  trackingPage: async ({ page }, use) => {
    await use(new TrackingPage(page));
  },
  authenticatedPage: async ({ page, request }, use) => {
    const apiUrl = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';
    
    // Login via API - this sets httpOnly cookies on the request context
    const response = await request.post(`${apiUrl}/auth/login`, {
      data: {
        identifier: 'admin@9tours.com',
        password: 'password123',
        rememberMe: true,
      },
    });
    
    if (!response.ok()) {
      throw new Error(`Login failed: ${response.status()}`);
    }
    
    // The request context now has cookies set - use the page for UI interactions
    // The browser context shares cookies with the request context
    await use();
  },
});

export { expect } from '@playwright/test';
