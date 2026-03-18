import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';

export class DashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/admin/dashboard`);
  }
}
