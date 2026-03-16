import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class TrackingPage extends BasePage {
  readonly anonymousIdStorageKey: string = 'anonymous_id';

  constructor(page: Page) {
    super(page);
  }

  async gotoTourDetail(tourId: number) {
    await this.page.goto(`/tours/${tourId}`);
  }

  async getAnonymousId(): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), this.anonymousIdStorageKey);
  }

  async waitForTrackingCall() {
    await this.page.waitForResponse(
      (response) => response.url().includes('/analytics/events') && response.request().method() === 'POST',
      { timeout: 10000 }
    );
  }

  async getTrackingRequestHeaders(): Promise<Record<string, string>> {
    const response = await this.page.waitForResponse(
      (response) => response.url().includes('/analytics/events') && response.request().method() === 'POST'
    );
    return response.request().headers();
  }
}
