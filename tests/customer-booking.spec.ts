import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000'
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

    const startBookingButton = page.locator('aside').getByRole('button').last()
    await expect(startBookingButton).toBeVisible({ timeout: 15000 })
    await expect(startBookingButton).toBeEnabled()
    await startBookingButton.click()

    await expect(page).toHaveURL(new RegExp(`/booking/${selectedTour.id}\\?`))

    const checkoutButton = page.getByRole('button', { name: 'ชำระเงิน' })
    await expect(checkoutButton).toBeEnabled()
    await checkoutButton.click()


    await expect(page).toHaveURL(/\/payment\/\d+$/)
    await expect(page.getByAltText('PromptPay QR Code')).toBeVisible()

    const fileChooserPromise = page.waitForEvent('filechooser')
    await page.getByText('คลิกเพื่ออัปโหลดสลิป').click()
    const fileChooser = await fileChooserPromise
    await fileChooser.setFiles(slipPath)

    await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

    const myBookingsCta = page.getByRole('button', { name: 'การจองของฉัน' })
    await expect(myBookingsCta).toBeVisible()
    await myBookingsCta.click()

    await expect(page).toHaveURL(/\/my-bookings$/)

    const bookingRow = page.locator('main').filter({ hasText: selectedTour.tourCode }).first()
    await expect(bookingRow).toContainText(selectedTour.tourCode)
    await expect(bookingRow).toContainText('รอตรวจสอบ')


  })
})

