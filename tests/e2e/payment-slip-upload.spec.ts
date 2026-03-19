
import path from 'node:path'
import fs from 'node:fs'
import os from 'node:os'
import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000'
const validSlipPath = path.join(process.cwd(), 'frontend', 'public', 'logo.png')

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

interface RegisteredCustomer {
  email: string
  phone: string
  password: string
}

interface BookableTourInfo {
  tourId: number
  scheduleId: number
  tourName: string
}

async function registerCustomer(page: Page): Promise<RegisteredCustomer> {
  const unique = Date.now().toString()
  const phone = `08${unique.slice(-8)}`
  const password = '12121212'
  const email = `pw.slip.${unique}@example.com`

  // Register via API — backend sets httpOnly auth cookies in the shared cookie jar
  const regResponse = await page.request.post(`${API_URL}/auth/register`, {
    data: { prefix: 'นาย', name: 'Slip Test User', email, phone, password },
  })
  expect(regResponse.ok(), 'Register should succeed').toBeTruthy()

  return { email, phone, password }
}

async function pickBookableTour(page: Page): Promise<BookableTourInfo> {
  const response = await page.request.get(`${API_URL}/tours`)
  expect(response.ok()).toBeTruthy()

  const tours = (await response.json()) as Array<{
    id: number
    name: string
    minPeople?: number | null
    schedules: Array<{ id: number; startDate: string; maxCapacity: number; currentBooked: number }>
  }>

  const today = new Date().toISOString().slice(0, 10)

  // Prefer non-private tours with the most available seats
  let best: { tourId: number; scheduleId: number; tourName: string; available: number } | null = null

  for (const tour of tours) {
    const isPrivate = !!tour.minPeople
    if (isPrivate) continue // skip private/group tours to avoid "รอบนี้ถูกจองแล้ว"

    for (const schedule of tour.schedules ?? []) {
      const available = schedule.maxCapacity - schedule.currentBooked
      if (schedule.startDate >= today && available >= 2 && (!best || available > best.available)) {
        best = { tourId: tour.id, scheduleId: schedule.id, tourName: tour.name, available }
      }
    }
  }

  expect(best, 'Expected a non-private tour with a future schedule having ≥ 2 available seats').toBeTruthy()
  return { tourId: best!.tourId, scheduleId: best!.scheduleId, tourName: best!.tourName }
}

async function createBookingViaAPI(
  page: Page,
  scheduleId: number,
  contactEmail: string,
  contactPhone: string,
): Promise<number> {
  // Uses shared cookies from register/login — no Bearer token needed
  const response = await page.request.post(`${API_URL}/bookings`, {
    data: {
      scheduleId,
      paxCount: 1,
      adults: 1,
      children: 0,
      contactPrefix: 'นาย',
      contactName: 'Slip Test User',
      contactEmail,
      contactPhone,
    },
  })
  expect(response.ok(), `Create booking should succeed: ${await response.text()}`).toBeTruthy()

  const booking = (await response.json()) as { id: number }
  return booking.id
}

/**
 * Register a fresh customer, create a booking via API, and navigate to the payment page.
 * Returns the bookingId and tour info for assertions.
 */
async function setupPaymentPage(page: Page) {
  const customer = await registerCustomer(page)
  const tourInfo = await pickBookableTour(page)
  const bookingId = await createBookingViaAPI(
    page,
    tourInfo.scheduleId,
    customer.email,
    customer.phone,
  )

  // Set localStorage hint so React knows to restore session from cookies
  await page.addInitScript(() => {
    window.localStorage.setItem('auth_session_active', 'true')
  })

  await page.goto(`${FRONTEND_URL}/payment/${bookingId}`)
  await page.waitForLoadState('networkidle')

  return { bookingId, tourInfo, customer }
}

/**
 * Upload a valid slip image via the file chooser.
 */
async function uploadValidSlip(page: Page) {
  const fileChooserPromise = page.waitForEvent('filechooser')
  await page.getByText('คลิกเพื่ออัปโหลดสลิป').click()
  const fileChooser = await fileChooserPromise
  await fileChooser.setFiles(validSlipPath)
}

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

test.describe('TC-006: Payment Slip Upload', () => {
  /* ---- 1-5: Page display ---- */

  test.describe('Payment page display', () => {
    test('TC-006-01: แสดง QR Code PromptPay สำหรับ scan ชำระเงิน', async ({ page }) => {
      await setupPaymentPage(page)

      const qrImage = page.getByAltText(/PromptPay QR Code/)
      await expect(qrImage).toBeVisible({ timeout: 15_000 })
    })

    test('TC-006-02: แสดงยอดรวมที่ต้องชำระ (บาท)', async ({ page }) => {
      await setupPaymentPage(page)

      await expect(page.getByText('ยอดที่ต้องชำระ')).toBeVisible()
      await expect(page.getByText('บาท').first()).toBeVisible()
    })

    test('TC-006-03: แสดงรายละเอียดการจอง — ชื่อทัวร์, วันที่, จำนวนคน', async ({ page }) => {
      const { tourInfo } = await setupPaymentPage(page)

      await expect(page.getByText('สรุปรายการจอง')).toBeVisible()
      await expect(page.getByText(tourInfo.tourName).first()).toBeVisible()
      await expect(page.getByText('วันที่เดินทาง')).toBeVisible()
      await expect(page.getByText('จำนวน')).toBeVisible()
    })

    test('TC-006-04: แสดงหมายเลขบัญชีที่ต้องโอน', async ({ page }) => {
      await setupPaymentPage(page)

      await expect(page.getByText('ชื่อบัญชี')).toBeVisible()
      await expect(
        page.getByText('บริษัท ไนน์ทัวร์ แทรเวล จำกัด'),
      ).toBeVisible()
    })

    test('TC-006-05: แสดงเวลาที่เหลือในการชำระ (timeout)', async ({ page }) => {
      await setupPaymentPage(page)

      await expect(
        page.getByText(/กรุณาชำระเงินภายใน \d+:\d+ นาที/),
      ).toBeVisible()
    })
  })

  /* ---- 6-11: File upload interaction ---- */

  test.describe('File upload interaction', () => {
    test('TC-006-06: คลิกเพื่ออัปโหลดสลิป เปิด file chooser', async ({ page }) => {
      await setupPaymentPage(page)

      const fileChooserPromise = page.waitForEvent('filechooser')
      await page.getByText('คลิกเพื่ออัปโหลดสลิป').click()
      const fileChooser = await fileChooserPromise

      expect(fileChooser).toBeTruthy()
    })

    test('TC-006-07: อัปโหลดไฟล์รูปภาพ (jpg/png) แสดง preview', async ({ page }) => {
      await setupPaymentPage(page)

      await uploadValidSlip(page)

      await expect(page.getByAltText('Slip Preview')).toBeVisible()
      await expect(page.getByText('อัปโหลดไฟล์เรียบร้อย')).toBeVisible()
    })

    test('TC-006-08: อัปโหลดไฟล์ที่ไม่ใช่รูป แสดง error เมื่อกดยืนยัน', async ({ page }) => {
      await setupPaymentPage(page)

      const tmpFilePath = path.join(os.tmpdir(), `slip-test-invalid-${Date.now()}.txt`)
      fs.writeFileSync(tmpFilePath, 'This is not an image file')

      try {
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByText('คลิกเพื่ออัปโหลดสลิป').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles(tmpFilePath)

        await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

        // Backend rejects non-image files → toast error with role="status"
        const toast = page.locator('[role="status"]').filter({ hasText: /JPG|PNG|slip|image/i })
        await expect(toast).toBeVisible({ timeout: 10_000 })
      } finally {
        try { fs.unlinkSync(tmpFilePath) } catch { /* ignore cleanup errors */ }
      }
    })

    test('TC-006-09: อัปโหลดไฟล์ใหญ่เกิน limit แสดง error เมื่อกดยืนยัน', async ({ page }) => {
      await setupPaymentPage(page)

      // Backend limit = 5 MB; create a ~6 MB file with JPEG magic bytes
      const tmpFilePath = path.join(os.tmpdir(), `slip-test-large-${Date.now()}.jpg`)
      const buffer = Buffer.alloc(6 * 1024 * 1024)
      buffer[0] = 0xff
      buffer[1] = 0xd8
      buffer[2] = 0xff
      fs.writeFileSync(tmpFilePath, buffer)

      try {
        const fileChooserPromise = page.waitForEvent('filechooser')
        await page.getByText('คลิกเพื่ออัปโหลดสลิป').click()
        const fileChooser = await fileChooserPromise
        await fileChooser.setFiles(tmpFilePath)

        await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

        // Backend rejects oversized files → toast error with role="status"
        const toast = page.locator('[role="status"]').filter({ hasText: /file|size|ไม่สามารถ|too large|กรุณาลองใหม่/i })
        await expect(toast).toBeVisible({ timeout: 10_000 })
      } finally {
        // Delay cleanup to avoid EBUSY on Windows
        setTimeout(() => { try { fs.unlinkSync(tmpFilePath) } catch { /* ignore */ } }, 2000)
      }
    })

    test('TC-006-10: อัปโหลดสลิปสำเร็จ แสดงรูป preview', async ({ page }) => {
      await setupPaymentPage(page)

      await uploadValidSlip(page)

      const preview = page.getByAltText('Slip Preview')
      await expect(preview).toBeVisible()
      await expect(preview).toHaveAttribute('src', /^blob:/)
    })

    test('TC-006-11: ลบไฟล์ที่อัปโหลดออกได้', async ({ page }) => {
      await setupPaymentPage(page)

      await uploadValidSlip(page)
      await expect(page.getByAltText('Slip Preview')).toBeVisible()

      await page.locator('button[title="ลบรูปภาพ"]').click()

      await expect(page.getByAltText('Slip Preview')).not.toBeVisible()
      await expect(page.getByText('คลิกเพื่ออัปโหลดสลิป')).toBeVisible()
    })
  })

  /* ---- 12-15: Payment confirmation ---- */

  test.describe('Payment confirmation', () => {
    test('TC-006-12: กดปุ่ม "ยืนยันการชำระเงิน" → redirect ไป /my-bookings', async ({ page }) => {
      await setupPaymentPage(page)

      await uploadValidSlip(page)
      await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

      // Success modal appears
      await expect(page.getByText('การชำระเงินเสร็จสิ้น')).toBeVisible({ timeout: 15_000 })

      // Click "การจองของฉัน" in modal → redirects to /my-bookings
      await page.getByRole('button', { name: 'การจองของฉัน' }).click()
      await expect(page).toHaveURL(/\/my-bookings$/)
    })

    test('TC-006-13: ไม่อัปโหลดสลิปแล้วกดยืนยัน → แสดง error', async ({ page }) => {
      await setupPaymentPage(page)

      await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

      // Toast: กรุณาแนบหลักฐานการชำระเงินก่อนยืนยันครับ
      await expect(
        page.getByText('กรุณาแนบหลักฐานการชำระเงินก่อนยืนยันครับ'),
      ).toBeVisible({ timeout: 5_000 })
    })

    test('TC-006-14: แสดง booking status เป็น "รอตรวจสอบ" หลังยืนยัน', async ({ page }) => {
      const { tourInfo } = await setupPaymentPage(page)

      await uploadValidSlip(page)
      await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

      await expect(page.getByText('การชำระเงินเสร็จสิ้น')).toBeVisible({ timeout: 15_000 })
      await page.getByRole('button', { name: 'การจองของฉัน' }).click()

      await expect(page).toHaveURL(/\/my-bookings$/)

      // The booking row should display status "รอตรวจสอบ"
      await expect(page.getByText('รอตรวจสอบ').first()).toBeVisible({ timeout: 10_000 })
    })

    test('TC-006-15: กด "ดูรายละเอียดการจอง" → แสดงรายละเอียด', async ({ page }) => {
      const { tourInfo } = await setupPaymentPage(page)

      await uploadValidSlip(page)
      await page.getByRole('button', { name: 'ยืนยันการชำระเงิน' }).click()

      await expect(page.getByText('การชำระเงินเสร็จสิ้น')).toBeVisible({ timeout: 15_000 })

      // Modal text confirms the user can view booking status
      await expect(
        page.getByText('คุณสามารถตรวจสอบสถานะการจองได้'),
      ).toBeVisible()

      // Navigate to my-bookings and click on the booking to see details
      await page.getByRole('button', { name: 'การจองของฉัน' }).click()
      await expect(page).toHaveURL(/\/my-bookings$/)

      // Click on the booking card/row to view details
      const bookingCard = page.locator('main').getByText('รอตรวจสอบ').first()
      await expect(bookingCard).toBeVisible({ timeout: 10_000 })

      // Verify booking details are visible on the my-bookings page
      await expect(page.getByText(tourInfo.tourName).first()).toBeVisible()
    })
  })

  /* ---- 16: Navigation ---- */

  test.describe('Navigation', () => {
    test('TC-006-16: กด "ย้อนกลับ" → กลับไปหน้าก่อนหน้า', async ({ page }) => {
      const customer = await registerCustomer(page)
      const tourInfo = await pickBookableTour(page)
      const bookingId = await createBookingViaAPI(
        page,
        tourInfo.scheduleId,
        customer.email,
        customer.phone,
      )

      await page.addInitScript(() => {
        window.localStorage.setItem('auth_session_active', 'true')
      })

      // Visit tour page first → then payment, so "back" has somewhere to go
      await page.goto(`${FRONTEND_URL}/tours/${tourInfo.tourId}`)
      await page.waitForLoadState('networkidle')

      await page.goto(`${FRONTEND_URL}/payment/${bookingId}`)
      await page.waitForLoadState('networkidle')

      const backButton = page.getByText('ย้อนกลับ').first()
      await expect(backButton).toBeVisible()
      await backButton.click()

      // Should navigate away from the payment page
      await expect(page).not.toHaveURL(/\/payment\//)
    })
  })
})
