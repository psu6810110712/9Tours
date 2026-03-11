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

interface RegisteredCustomer {
  email: string
  phone: string
  password: string
}

async function registerFreshCustomer(page: Page): Promise<RegisteredCustomer> {
  const unique = Date.now().toString()
  const phone = `08${unique.slice(-8)}`
  const password = '12121212'
  const email = `playwright.${unique}@example.com`

  const response = await page.request.post(`${API_URL}/auth/register`, {
    data: {
      prefix: 'นาย',
      name: 'Playwright Customer',
      email,
      phone,
      password,
    },
  })

  expect(response.ok()).toBeTruthy()
  return { email, phone, password }
}

async function loginSeededAdmin(page: Page) {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      identifier: 'admin@9tours.com',
      password: 'password123',
      rememberMe: true,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json() as Promise<{ access_token: string }>
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
  test('customer can complete booking, upload slip, and booking contact snapshot is saved', async ({ page }) => {
    const customer = await registerFreshCustomer(page)
    const selectedTour = await pickBookableTour(page)
    const customContact = {
      prefix: 'นางสาว',
      name: 'Booking Contact',
      email: `contact.${Date.now()}@example.com`,
      phone: `08${String(Date.now() + 1).slice(-8)}`,
    }

    await page.goto(`${FRONTEND_URL}/my-bookings`)
    await expect(page).toHaveURL(/\/my-bookings$/)
    await expect(page.getByText('ไม่พบรายการ')).toBeVisible()

    await page.goto(`${FRONTEND_URL}/tours/${selectedTour.id}`)

    const startBookingButton = page.locator('aside').getByRole('button').last()
    await expect(startBookingButton).toBeVisible({ timeout: 15000 })
    await expect(startBookingButton).toBeEnabled()
    await startBookingButton.click()

    await expect(page).toHaveURL(new RegExp(`/booking/${selectedTour.id}\\?`))

    const nameInput = page.getByTestId('contact-name')
    const emailInput = page.getByTestId('contact-email')
    const phoneInput = page.getByTestId('contact-phone')
    const specialRequest = page.getByTestId('special-request')

    await expect(nameInput).toHaveValue('Playwright Customer')
    await expect(emailInput).toHaveValue(customer.email)
    await expect(phoneInput).toHaveValue(customer.phone)

    await page.getByTestId('use-manual-info').check({ force: true })
    await expect(nameInput).toHaveValue('Playwright Customer')

    await page.getByTestId('contact-prefix').selectOption(customContact.prefix)
    await nameInput.fill(customContact.name)
    await phoneInput.fill(customContact.phone)
    await emailInput.fill(customContact.email)
    await specialRequest.fill('Need vegetarian meal')

    await expect(nameInput).toHaveValue(customContact.name)
    await expect(emailInput).toHaveValue(customContact.email)
    await expect(phoneInput).toHaveValue(customContact.phone)

    await page.getByTestId('use-account-info').check({ force: true })
    await expect(nameInput).toHaveValue('Playwright Customer')
    await expect(emailInput).toHaveValue(customer.email)
    await expect(phoneInput).toHaveValue(customer.phone)
    await expect(specialRequest).toHaveValue('Need vegetarian meal')

    await page.getByTestId('use-manual-info').check({ force: true })
    await expect(nameInput).toHaveValue(customContact.name)
    await expect(emailInput).toHaveValue(customContact.email)
    await expect(phoneInput).toHaveValue(customContact.phone)
    await expect(specialRequest).toHaveValue('Need vegetarian meal')

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

    const adminAuth = await loginSeededAdmin(page)
    const adminBookingsResponse = await page.request.get(`${API_URL}/bookings/admin/all`, {
      headers: {
        Authorization: `Bearer ${adminAuth.access_token}`,
      },
    })
    expect(adminBookingsResponse.ok()).toBeTruthy()

    const adminBookings = await adminBookingsResponse.json() as Array<{
      contactPrefix?: string
      contactName?: string
      contactEmail?: string
      contactPhone?: string
      user?: { email?: string }
    }>

    const savedBooking = adminBookings.find((booking) => booking.contactEmail === customContact.email || booking.user?.email === customContact.email)
    expect(savedBooking).toBeTruthy()
    expect(savedBooking?.contactPrefix).toBe(customContact.prefix)
    expect(savedBooking?.contactName).toBe(customContact.name)
    expect(savedBooking?.contactEmail).toBe(customContact.email)
    expect(savedBooking?.contactPhone).toBe(customContact.phone)
    expect(customer.email).not.toBe(customContact.email)
  })

  test('customer can log in with a phone number', async ({ page }) => {
    const customer = await registerFreshCustomer(page)
    await page.request.post(`${API_URL}/auth/logout`)

    await page.goto(FRONTEND_URL)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).click()
    await page.locator('input[placeholder="name@example.com หรือ 0812345678"]').fill(customer.phone)
    await page.locator('input[placeholder="โปรดระบุรหัสผ่านของท่าน"]').fill(customer.password)
    await page.getByRole('button', { name: 'เข้าสู่ระบบ' }).last().click()

    await expect(page.getByText('การจองของฉัน')).toBeVisible({ timeout: 10000 })
  })
})
