import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://localhost:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://localhost:3000'
const slipPath = path.join(process.cwd(), 'frontend', 'public', 'logo.png')

interface TourSchedule {
  startDate: string
  maxCapacity: number
  currentBooked: number
}

interface TourSummary {
  id: number
  tourCode: string
  schedules: TourSchedule[]
}

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

async function pickBookableTour(page: Page): Promise<TourSummary> {
  const response = await page.request.get(`${API_URL}/tours`)
  expect(response.ok()).toBeTruthy()

  const tours = (await response.json()) as TourSummary[]
  const today = new Date().toISOString().slice(0, 10)
  const selectedTour = tours.find((tour) =>
    tour.schedules?.some((schedule) =>
      schedule.startDate >= today && schedule.currentBooked < schedule.maxCapacity,
    ),
  )

  expect(selectedTour, 'Expected an active tour with a future available schedule').toBeTruthy()
  return selectedTour!
}

test.describe('Customer booking flow', () => {
  test('customer can complete booking, upload slip, and see it in My Bookings', async ({ page }) => {
    await registerFreshCustomer(page)
    const selectedTour = await pickBookableTour(page)

    await page.goto(`${FRONTEND_URL}/my-bookings`)
    await expect(page).toHaveURL(/\/my-bookings$/)
    await expect(page.getByTestId('my-booking-card')).toHaveCount(0)

    await page.goto(`${FRONTEND_URL}/tours/${selectedTour.id}`)

    const startBookingButton = page.getByTestId('start-booking')
    await expect(startBookingButton).toBeVisible({ timeout: 15000 })
    await expect(startBookingButton).toBeEnabled()
    await startBookingButton.click()

    await expect(page).toHaveURL(new RegExp(`/booking/${selectedTour.id}\\?`))
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
    await expect(page.getByTestId('my-booking-card').first()).toContainText(selectedTour.tourCode)
  })
})
