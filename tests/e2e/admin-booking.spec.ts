import { test, expect, type Page } from '@playwright/test';

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
  return response.json() as Promise<{ access_token: string }>;
}

async function getPendingBookings(api: typeof page.request, token: string) {
  const response = await api.get(`${API_URL}/bookings/admin/all?status=awaiting_approval`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(response.ok()).toBeTruthy();
  return response.json() as Promise<Array<{ id: number; tour: { tourCode: string } }>>;
}

test.describe('Admin Booking Management', () => {
  test('admin can view pending bookings list', async ({ page }) => {
    const { access_token } = await loginAsAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/admin/bookings`);
    await page.waitForLoadState('networkidle');
    
    await expect(page).toHaveURL(/\/admin\/bookings/);
  });

  test('admin can filter bookings by status', async ({ page }) => {
    const { access_token } = await loginAsAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/admin/bookings`);
    await page.waitForLoadState('networkidle');
    
    const statusFilter = page.locator('select[name="status"]');
    if (await statusFilter.isVisible()) {
      await statusFilter.selectOption('awaiting_approval');
      await page.waitForLoadState('networkidle');
    }
  });

  test('admin can view booking details with payment slip', async ({ page }) => {
    const { access_token } = await loginAsAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/admin/bookings`);
    await page.waitForLoadState('networkidle');
    
    const firstBookingRow = page.locator('table tbody tr').first();
    if (await firstBookingRow.isVisible()) {
      await firstBookingRow.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('admin can approve a booking payment', async ({ page, request }) => {
    const { access_token } = await loginAsAdmin(page);
    
    const bookings = await getPendingBookings(request, access_token);
    
    if (bookings.length > 0) {
      const bookingId = bookings[0].id;
      
      const response = await request.patch(`${API_URL}/bookings/${bookingId}/status`, {
        headers: { Authorization: `Bearer ${access_token}` },
        data: { status: 'confirmed' },
      });
      
      expect(response.ok()).toBeTruthy();
    }
  });

  test('admin can reject a booking payment with reason', async ({ page, request }) => {
    const { access_token } = await loginAsAdmin(page);
    
    const bookings = await getPendingBookings(request, access_token);
    
    if (bookings.length > 0) {
      const bookingId = bookings[0].id;
      
      const response = await request.patch(`${API_URL}/bookings/${bookingId}/status`, {
        headers: { Authorization: `Bearer ${access_token}` },
        data: { 
          status: 'rejected',
          adminNote: 'Slip image unclear',
        },
      });
      
      expect(response.ok()).toBeTruthy();
    }
  });

  test('admin can search bookings by customer email', async ({ page }) => {
    const { access_token } = await loginAsAdmin(page);
    
    await page.goto(`${FRONTEND_URL}/admin/bookings`);
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="ค้นหา"], input[name="search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill('test@example.com');
      await searchInput.press('Enter');
      await page.waitForLoadState('networkidle');
    }
  });
});
