import { type Page, type Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class LoginPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly rememberMeCheckbox: Locator;

  constructor(page: Page) {
    super(page);
    this.emailInput = page.locator('input[name="identifier"]');
    this.passwordInput = page.locator('input[name="password"]');
    this.loginButton = page.locator('button[type="submit"]');
    this.rememberMeCheckbox = page.locator('input[name="rememberMe"]');
  }

  async goto() {
    await this.page.goto('/admin/login');
  }

  async login(email: string, password: string, rememberMe: boolean = true) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    if (rememberMe) {
      await this.rememberMeCheckbox.check();
    }
    await this.loginButton.click();
  }

  async loginViaApi(apiUrl: string, data: any) {
    const response = await this.page.request.post(`${apiUrl}/auth/login`, {
      data,
    });
    return response;
  }
}
