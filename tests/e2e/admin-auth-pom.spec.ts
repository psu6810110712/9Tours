import { test, expect } from '../fixtures/test-fixtures';

test.describe('Admin Authentication (POM)', () => {
  test('admin can login and persist session', async ({ dashboardPage, authenticatedPage, page }) => {
    // authenticatedPage fixture already handled the login via API and setting the token
    
    await dashboardPage.goto();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);

    await page.reload();
    await expect(page).toHaveURL(/\/admin\/dashboard$/);
  });
});
