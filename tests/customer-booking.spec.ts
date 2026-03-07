import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://localhost:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000'
const TOUR_ID = 1
const TOUR_CODE = 'PHK-OLD-001'
const slipPath = path.join(process.cwd(), 'frontend', 'public', 'logo.png')

async function registerFreshCustomer(page: Page) {
  const unique = Date.now().toString()
  const response = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      name: `Playwright Customer ${unique}`,
      email: `playwright.${unique}@example.com`,
      phone: `08${unique.slice(-8)}`,
      password: '12121212',
    },
  })

  expect(response.ok()).toBeTruthy()
}

test.describe('Customer booking flow', () => {
  test('customer can complete booking, upload slip, and see it in My Bookings', async ({ page }) => {
    await registerFreshCustomer(page)

    await page.goto(`${FRONTEND_URL}/my-bookings`)
    await expect(page).toHaveURL(/\/my-bookings$/)
    await expect(page.getByText('ไม่พบรายการ')).toBeVisible()

    await page.goto(`${FRONTEND_URL}/tours/${TOUR_ID}`)
    await expect(page.getByTestId('start-booking')).toBeEnabled()
    await page.getByTestId('start-booking').click()

    await expect(page).toHaveURL(/\/booking\/1\?/)
    await expect(page.getByTestId('checkout-submit')).toBeEnabled()
    await page.getByTestId('checkout-submit').click()

    await expect(page).toHaveURL(/\/payment\/\d+$/)
    await expect(page.getByAltText('PromptPay QR Code')).toBeVisible()

    await page.getByTestId('payment-slip-input').setInputFiles(slipPath)
    await page.getByTestId('confirm-payment').click()
    await expect(page.getByTestId('payment-success-cta')).toBeVisible()
    await page.getByTestId('payment-success-cta').click()

    await expect(page).toHaveURL(/\/my-bookings$/)
    await expect(page.getByTestId('my-booking-card')).toHaveCount(1)
    await expect(page.getByTestId('my-booking-card').first()).toContainText(TOUR_CODE)
    await expect(page.getByTestId('my-booking-card').first()).toContainText('รอตรวจสอบ')
  })
})
