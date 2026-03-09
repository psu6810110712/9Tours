import { test, expect, type Page } from '@playwright/test'

const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173'
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000'

async function loginSeededAdmin(page: Page) {
  const response = await page.request.post(`${API_URL}/auth/login`, {
    data: {
      email: 'admin@9tours.com',
      password: 'password123',
      rememberMe: true,
    },
  })

  expect(response.ok()).toBeTruthy()
  return response.json()
}

test.describe('Admin auth compatibility', () => {
  test('admin can access protected dashboard endpoints and restore dashboard session after reload', async ({ page }) => {
    const authResponse = await loginSeededAdmin(page) as { access_token: string }

    const dashboardApiResponse = await page.request.get(`${API_URL}/admin/dashboard`, {
      headers: {
        Authorization: `Bearer ${authResponse.access_token}`,
      },
    })
    expect(dashboardApiResponse.ok()).toBeTruthy()

    await page.goto(`${FRONTEND_URL}/admin/dashboard`)
    await expect(page).toHaveURL(/\/admin\/dashboard$/)

    await page.reload()
    await expect(page).toHaveURL(/\/admin\/dashboard$/)
  })
})
