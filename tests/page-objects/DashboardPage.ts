import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';

export class DashboardPage extends BasePage {
  readonly startDateInput: Locator;
  readonly endDateInput: Locator;
  readonly clearDateFilterButton: Locator;
  readonly pieChart: Locator;
  readonly viewsCount: Locator;
  readonly bookingsCount: Locator;
  readonly revenueCount: Locator;

  constructor(page: Page) {
    super(page);
    this.startDateInput = page.locator('input[type="date"]').first();
    this.endDateInput = page.locator('input[type="date"]').last();
    this.clearDateFilterButton = page.locator('button:has-text("✕")').first();
    this.pieChart = page.locator('.recharts-pie');
    this.viewsCount = page.locator('text=ยอดวิวรวม').first();
    this.bookingsCount = page.locator('text=ยอดการจองรวม').first();
    this.revenueCount = page.locator('text=ยอดรายได้รวม').first();
  }

  async goto() {
    await this.page.goto(`${FRONTEND_URL}/admin/dashboard`);
  }
}
