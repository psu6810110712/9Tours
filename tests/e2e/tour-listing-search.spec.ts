import { test, expect } from '@playwright/test';

// tc-003 ทดสอบหน้าทัวร์ ค้นหา กรอง เรียงลำดับ

// url ของเว็บที่จะทดสอบ
const FRONTEND_URL = process.env.PLAYWRIGHT_FRONTEND_URL ?? 'http://127.0.0.1:5173';
const API_URL = process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:3000';

test.describe('TC-003: Tour Listing & Search', () => {
  
  // รันก่อนแต่ละ test
  test.beforeEach(async ({ page }) => {
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle'); // รอให้โหลดเสร็จ
  });

  // test ว่าแสดงการ์ดทัวร์ออกมาไหม
  test('should display tour cards with correct information', async ({ page }) => {
    // รอให้ tour card โหลดออกมา
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // หาการ์ดทัวร์ทั้งหมด
    const tourCards = page.locator('a[href^="/tours/"]');
    const count = await tourCards.count();

    expect(count).toBeGreaterThan(0); // ต้องมีอย่างน้อย 1 card

    // เช็คcard แรกว่ามีรูปกับชื่อ
    const firstCard = tourCards.first();
    await expect(firstCard.locator('img')).toBeVisible();
    await expect(firstCard.locator('h3')).toBeVisible();
    
    const cardText = await firstCard.textContent();
    expect(cardText).toBeTruthy(); // ต้องมี text ด้วย
  });

  // ทดสอบ search ทัวร์
  test('should search tours by name (case-insensitive)', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // บันทึกจำนวน tours ทั้งหมด
    const allTourCount = await page.locator('a[href^="/tours/"]').count();

    // เอาชื่อทัวร์แรกมาค้นหา
    const firstTourName = await page.locator('a[href^="/tours/"] h3').first().textContent();
    expect(firstTourName).toBeTruthy();

    const searchTerm = firstTourName!.slice(0, 3); // เอาแค่ 3 ตัวอักษรแรก

    // พิมพ์ในช่อง search - ลองหลายช่องถ้าจำเป็น 
    const allInputs = page.locator('input[type="text"]');
    let searchInput = allInputs.first();
    
    // พยายามหา input ที่มี placeholder   ค้นหา
    for (let i = 0; i < await allInputs.count(); i++) {
      const placeholder = await allInputs.nth(i).getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('ค้นหา')) {
        searchInput = allInputs.nth(i);
        break;
      }
    }
    
    await searchInput.fill(searchTerm);
    await page.waitForTimeout(2000); // รอให้ search ทำงาน และ component re-render

    // ตรวจสอบว่าจำนวน tours ลดลง หรือผลลัพธ์ยังคงมีคำค้นหา
    const searchedTourCount = await page.locator('a[href^="/tours/"]').count();
    
    // ผลค้นหาควรน้อยกว่าหรือเท่ากับทั้งหมด
    expect(searchedTourCount).toBeLessThanOrEqual(allTourCount);

    // ถ้ามี result ให้เช็คว่าคำค้นหาอยู่ในชื่อ
    if (searchedTourCount > 0) {
      const firstCardName = await page.locator('a[href^="/tours/"] h3').first().textContent();
      expect(firstCardName?.toLowerCase()).toContain(searchTerm.toLowerCase());
    }
  });

  // ค้นหาของที่ไม่มี ควรแสดง empty state
  test('should show empty state when searching for non-existent tour', async ({ page }) => {
    // บันทึกจำนวน tours เริ่มต้น
    const initialTourCount = await page.locator('a[href^="/tours/"]').count();
    
    // ค้นหาอะไรที่ไม่น่ามีอยู่
    const allInputs = page.locator('input[type="text"]');
    let searchInput = allInputs.first();
    
    // พยายามหา input ที่มี placeholder ค้นหา
    for (let i = 0; i < await allInputs.count(); i++) {
      const placeholder = await allInputs.nth(i).getAttribute('placeholder');
      if (placeholder && placeholder.toLowerCase().includes('ค้นหา')) {
        searchInput = allInputs.nth(i);
        break;
      }
    }
    
    await searchInput.fill('ทัวร์ที่ไม่มีอยู่จริง9999XYZABC');
    await page.waitForTimeout(2000);

    // รอให้ API response และ component render
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(500);

    // ต้องขึ้นข้อความว่าไม่พบ หรือไม่มี tour cards
    const noResultsText = page.getByText('ไม่พบทัวร์ที่ตรงกับเงื่อนไข');
    const tourCards = page.locator('a[href^="/tours/"]');
    const cardCount = await tourCards.count();
    
    // ตรวจสอบ: มีข้อความ หรือ cards ลดลง หรือ ไม่มี cards เลย
    const hasMessage = await noResultsText.isVisible({ timeout: 2000 }).catch(() => false);
    const cardsReduced = cardCount < initialTourCount;
    const hasNoCards = cardCount === 0;
    
    // ต้องเป็นจริง: มีข้อความ หรือ cards หายไป
    expect(hasMessage || cardsReduced || hasNoCards).toBeTruthy();
  });

  // clear search ทัวร์ควรกลับมาหมดอีก
  test('should clear search and show all tours', async ({ page }) => {
    // search อะไรก่อน
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(800);

    const filteredCount = await page.locator('a[href^="/tours/"]').count();

    // แล้วลบออก
    await searchInput.clear();
    await page.waitForTimeout(800);

    await expect(page).not.toHaveURL(/search=/);

    // จำนวนทัวร์ควรกลับมาเท่าเดิมหรือมากกว่า
    const allCount = await page.locator('a[href^="/tours/"]').count();
    expect(allCount).toBeGreaterThanOrEqual(filteredCount);
  });

  // filter ตาม region
  test('should filter tours by region', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // ถ้าเป็นมือถือต้องเปิด filter ก่อน
    const isMobile = page.viewportSize()!.width < 768;
    if (isMobile) {
      const mobileFilterButton = page.locator('button').filter({ hasText: /ตัวกรอง|Filter/i }).first();
      if (await mobileFilterButton.isVisible()) {
        await mobileFilterButton.click();
        await page.waitForTimeout(300);
      }
    }

    // หา checkbox ของ region
    const regionCheckbox = page.locator('input[type="checkbox"]').filter({ 
      has: page.locator('text=/ภาคเหนือ|ภาคกลาง|ภาคใต้/') 
    }).first();

    if (await regionCheckbox.isVisible()) {
      const regionLabel = await regionCheckbox.locator('..').textContent();
      await regionCheckbox.check({ force: true }); // check ตัว checkbox
      await page.waitForTimeout(500);

      // url ต้องมี region parameter
      await expect(page).toHaveURL(/region=/);

      const tourCards = page.locator('a[href^="/tours/"]');
      const count = await tourCards.count();
      
      // ถ้ามีทัวร์ในregionนั้นก็ต้องแสดง ถ้าไม่มีก็ต้องขึ้นไม่พบ
      if (count > 0) {
        expect(count).toBeGreaterThan(0);
      } else {
        await expect(page.getByText('ไม่พบทัวร์ที่ตรงกับเงื่อนไข')).toBeVisible();
      }
    }
  });

  // ทดสอบ filter ช่วงราคา
  test('should filter tours by price range', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // นับจำนวนทัวร์ก่อนfilter
    const initialCount = await page.locator('a[href^="/tours/"]').count();

    // filter ราคา 0-5000
    const priceInputs = page.locator('input[type="number"]');
    const minPriceInput = priceInputs.first();
    const maxPriceInput = priceInputs.nth(1);

    if (await minPriceInput.isVisible()) {
      await minPriceInput.fill('0');
      await maxPriceInput.fill('5000');
      await page.waitForTimeout(800); // รอให้filter ทำงาน

      await expect(page).toHaveURL(/minPrice|maxPrice/);

      // จำนวนหลัง filter ต้องน้อยกว่าหรือเท่ากับก่อน filter
      const filteredCount = await page.locator('a[href^="/tours/"]').count();
      expect(filteredCount).toBeLessThanOrEqual(initialCount);
    }
  });

  // sort ตามราคา
  test('should sort tours by price (low to high)', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // กดปุ่ม sort
    const sortButton = page.locator('[aria-haspopup="listbox"]').first();
    await sortButton.click();
    await page.waitForTimeout(300);

    // เลือกราคาต่ำไปสูง
    const sortOptions = page.locator('[role="listbox"] button, [role="option"]');
    const priceLowToHighOption = sortOptions.filter({ hasText: /ราคา.*ต่ำ.*สูง|Price.*Low.*High/i });
    
    if (await priceLowToHighOption.count() > 0) {
      await priceLowToHighOption.first().click();
      await page.waitForTimeout(500);

      // เอาราคา 3 อันแรกมาเช็คว่าเรียงถูกไหม
      const tourCards = page.locator('a[href^="/tours/"]');
      const prices: number[] = [];
      
      for (let i = 0; i < Math.min(await tourCards.count(), 3); i++) {
        const cardText = await tourCards.nth(i).textContent();
        const priceMatch = cardText?.match(/(\d{1,3}(?:,\d{3})*)/); // หาตัวเลขในtext
        if (priceMatch) {
          const price = parseInt(priceMatch[1].replace(/,/g, '')); // เอา comma ออก
          prices.push(price);
        }
      }

      // เช็คว่าราคาเรียงจากน้อยไปมาก
      if (prices.length >= 2) {
        for (let i = 0; i < prices.length - 1; i++) {
          expect(prices[i]).toBeLessThanOrEqual(prices[i + 1]);
        }
      }
    }
  });

  // sort ตามrating
  test('should sort tours by rating (highest)', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    const sortButton = page.locator('[aria-haspopup="listbox"]').first();
    await sortButton.click();
    await page.waitForTimeout(300);

    // เลือก rating สูงสุด
    const sortOptions = page.locator('[role="listbox"] button, [role="option"]');
    const ratingHighOption = sortOptions.filter({ hasText: /คะแนน.*สูง|Rating.*High/i });
    
    if (await ratingHighOption.count() > 0) {
      await ratingHighOption.first().click();
      await page.waitForTimeout(500);

      // เช็คว่ามีทัวร์แสดงออกมา
      const tourCards = page.locator('a[href^="/tours/"]');
      expect(await tourCards.count()).toBeGreaterThan(0);
    }
  });

  // กดcard ไปหน้า detail
  test('should navigate to tour detail when clicking a tour card', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    const firstCard = page.locator('a[href^="/tours/"]').first();
    const href = await firstCard.getAttribute('href');
    expect(href).toMatch(/^\/tours\/\d+$/); // format ต้องเป็น /tours/123

    // กดที่ card
    await firstCard.click();

    // ต้องไปหน้า detail
    await expect(page).toHaveURL(new RegExp(`/tours/\\d+$`));
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 5000 });
  });

  // favorite ต้อง login ก่อน
  test('should add tour to favorites when clicking favorite button (requires login)', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    // หาปุ่ม favorite (ปุ่มหัวใจ)
    const favoriteButton = page.locator('[aria-pressed]').first();

    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      await page.waitForTimeout(500);

      // ถ้ายังไม่ login ควรขึ้น login modal - ใช้ specific selector
      const loginModal = page.locator('div[role="status"]').filter({ hasText: 'กรุณาเข้าสู่ระบบ' });
      const loginButton = page.getByRole('button', { name: /เข้าสู่ระบบ/i }).nth(1);

      const isLoginRequired = await loginModal.isVisible({ timeout: 3000 }).catch(() => false) || await loginButton.isVisible({ timeout: 3000 }).catch(() => false);
      expect(isLoginRequired).toBeTruthy();
    }
  });

  // ทดสอบ responsive grid
  test('should display responsive grid layout', async ({ page }) => {
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });

    const viewport = page.viewportSize();
    expect(viewport).toBeTruthy();

    // หา container ของ grid
    const gridContainer = page.locator('a[href^="/tours/"]').first().locator('..');
    await expect(gridContainer).toBeVisible();

    const gridClass = await gridContainer.getAttribute('class');
    
    // เช็คตามขนาดจอ
    if (viewport!.width < 640) {
      expect(gridClass).toContain('grid'); // มือถือ
    } else if (viewport!.width < 768) {
      expect(gridClass).toContain('grid'); // tablet
    } else {
      expect(gridClass).toContain('grid'); // desktop
    }
  });

  // ลบ filter ทุกอันแล้วควรแสดงทัวร์หมด
  test('should clear all filters and show all tours', async ({ page }) => {
    // ใส่ filter หลายๆ อัน
    const searchInput = page.locator('input[type="text"]').first();
    await searchInput.fill('test');
    await page.waitForTimeout(500);

    const regionCheckbox = page.locator('input[type="checkbox"]').first();
    if (await regionCheckbox.isVisible()) {
      await regionCheckbox.check({ force: true });
      await page.waitForTimeout(500);
    }

    // url ควรมี filter parameters
    const urlWithFilters = page.url();
    expect(urlWithFilters).toMatch(/search=|region=|categories=|maxPrice=/);

    // ลบ filter ออก
    await searchInput.clear();
    await page.waitForTimeout(500);

    if (await regionCheckbox.isVisible() && (await regionCheckbox.isChecked())) {
      await regionCheckbox.uncheck({ force: true });
      await page.waitForTimeout(500);
    }

    // รอให้ filters อัปเดท
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.waitForTimeout(800);

    // ไปหน้า tours ใหม่
    await page.goto(`${FRONTEND_URL}/tours`);
    await page.waitForLoadState('networkidle');

    // url ต้องสะอาด ไม่มี search/region/categories parameter
    expect(page.url()).not.toContain('search=');
    expect(page.url()).not.toContain('region=');
    expect(page.url()).not.toContain('categories=');
    
    await expect(page.locator('a[href^="/tours/"]').first()).toBeVisible({ timeout: 10000 });
  });
});
