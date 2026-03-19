# 9Tours E2E Test Cases Summary

> 10 Essential Test Cases ที่ควรมี

---

## TC-001: User Registration

/**
 * Feature: Registration — E2E Tests
 *
 * ครอบคลุม:
 *  - แสดงหน้าลงทะเบียนถูกต้อง: ช่อง prefix, ชื่อ-นามสกุล, email, phone, password, confirm password, ปุ่มสมัคร
 *  - แสดง validation error เมื่อกรอกข้อมูลไม่ครบ (required fields)
 *  - แสดง validation error เมื่อ email ไม่ถูก format (ไม่มี @ หรือ domain)
 *  - แสดง validation error เมื่อ phone ไม่ถูก format (ไม่ใช่ 10 หลัก หรือไม่ขึ้นต้นด้วย 0, 08, 06)
 *  - แสดง validation error เมื่อ password ไม่ตรงกับ confirm password
 *  - แสดง validation error เมื่อ password น้อยกว่า 8 ตัวอักษร
 *  - แสดง validation error เมื่อ password ไม่มีตัวเลข
 *  - ลงทะเบียนสำเร็จ → redirect ไปหน้า login และแสดง success message
 *  - ลงทะเบียนด้วย email ที่มีอยู่แล้ว → แสดง error "อีเมลนี้ถูกใช้งานแล้ว"
 *  - ลงทะเบียนด้วย phone ที่มีอยู่แล้ว → แสดง error "เบอร์โทรศัพท์นี้ถูกใช้งานแล้ว"
 *  - คลิกลิงก์ "มีบัญชีอยู่แล้ว? เข้าสู่ระบบ" → redirect ไปหน้า login
 *  - ปิด modal register → กลับไปหน้าเดิม
 *  - กดปุ่ม login with Google → redirect ไป Google OAuth
 *
 * อ้างอิง: frontend/src/components/RegisterModal.tsx, frontend/src/types/user.ts
 */

---

## TC-002: User Login

/**
 * Feature: Login — E2E Tests
 *
 * ครอบคลุม:
 *  - แสดงหน้า login ถูกต้อง: ช่อง email/phone, password, ปุ่มเข้าสู่ระบบ, checkbox "จำการเข้าสู่ระบบ"
 *  - Login ด้วย email สำเร็จ → redirect ไปหน้าหลัก หรือหน้าที่กด login มา
 *  - Login ด้วย phone number สำเร็จ (รองรับ format 08x-xxx-xxxx หรือ 0812345678)
 *  - Login ด้วย admin account → redirect ไป /admin/dashboard
 *  - Login ด้วย customer account → redirect ไป /my-bookings หรือ /
 *  - แสดง validation error เมื่อไม่กรอก email/phone
 *  - แสดง validation error เมื่อไม่กรอก password
 *  - แสดง error "อีเมลหรือรหัสผ่านไม่ถูกต้อง" เมื่อ login ผิด
 *  - กด checkbox "จำการเข้าสู่ระบบ" → session อยู่นานขึ้น (30 วัน vs 15 นาที)
 *  - หลัง login สำเร็จ → แสดง username ใน navbar
 *  - คลิกลิงก์ "ยังไม่มีบัญชี? สมัครสมาชิก" → redirect ไปหน้า register
 *  - กดปุ่ม login with Google → redirect ไป Google OAuth
 *  - ปิด modal login → กลับไปหน้าเดิม
 *  - Login ซ้ำในขณะที่มี session อยู่ → redirect ไปหน้าหลักโดยไม่ต้อง login ใหม่
 *
 * อ้างอิง: frontend/src/components/LoginModal.tsx, frontend/src/context/AuthContext.tsx
 */

---

## TC-003: Tour Listing & Search

/**
 * Feature: Tour Listing & Search — E2E Tests
 *
 * ครอบคลุม:
 *  - แสดงรายการ tour cards ถูกต้อง: รูปภาพ, ชื่อทัวร์, ราคา, rating, จังหวัด
 *  - แสดง tour cards อย่างน้อย 1 รายการ (ถ้ามี tour ในระบบ)
 *  - Pagination: แสดง tours ที่ 1-12, กด next → แสดง tours ที่ 13-24
 *  - Search: พิมพ์ชื่อทัวร์ → แสดงผลลัพธ์ที่ตรง (case-insensitive)
 *  - Search: พิมพ์ชื่อที่ไม่มี → แสดง "ไม่พบทัวร์ที่ค้นหา"
 *  - Search: clear คำค้น → แสดง tours ทั้งหมด
 *  - Filter Region: เลือกภาคเหนือ → แสดงเฉพาะทัวร์ในภาคเหนือ
 *  - Filter Region: เลือกหลายภาค → แสดงทัวร์ในภาคที่เลือก
 *  - Filter Region: clear filter → แสดงทัวร์ทั้งหมด
 *  - Filter Category: เลือกหมวดหมู่ (ทริป, ค่าย, โรงแรม) → กรองถูกต้อง
 *  - Filter Price: เลือกช่วงราคา 0-1000 → แสดงทัวร์ในช่วงนั้น
 *  - Filter Date: เลือกวันที่ → แสดงเฉพาะทัวร์ที่มี schedule ในวันนั้น
 *  - Sort: เรียงราคาต่ำไปสูง
 *  - Sort: เรียงราคาสูงไปต่ำ
 *  - Sort: เรียงตาม rating สูงสุด
 *  - Sort: เรียงตามใหม่ล่าสุด
 *  - กด card → redirect ไปหน้า tour detail
 *  - กดปุ่ม heart/favorite → เพิ่มในรายการโปรด (ต้อง login ก่อน)
 *  - Responsive: บนมือถือแสดง 1 คอลัมน์, แท็บเล็ต 2 คอลัมน์, desktop 3-4 คอลัมน์
 *
 * อ้างอิง: frontend/src/pages/ToursPage.tsx, frontend/src/components/tour/FilterSidebar.tsx
 */

---

## TC-004: Tour Detail

/**
 * Feature: Tour Detail — E2E Tests
 *
 * ครอบคลุม:
 *  - แสดงข้อมูลหลัก: ชื่อทัวร์, ราคา, ราคาเด็ก (ถ้ามี), rating, จำนวนรีวิว, จังหวัด
 *  - แสดงรูปภาพ gallery: thumbnail และ main image
 *  - คลิก thumbnail → แสดงรูปใหญ่
 *  - กด next/prev ใน gallery → เปลี่ยนรูป
 *  - แสดง description: คำอธิบายทัวร์
 *  - แสดง highlights: จุดเด่นของทัวร์ (bullet points)
 *  - แสดง itinerary: รายละเอียดวันต่อวัน (day 1, day 2, ...)
 *  - แสดง transportation: ข้อมูลการเดินทาง
 *  - แสดง duration: ระยะเวลาทัวร์
 *  - แสดง accommodation: ที่พัก (ถ้ามี)
 *  - แสดง region/province: ภาคและจังหวัด
 *  - แสดง reviews: รีวิวจากผู้ใช้ พร้อม rating
 *  - แสดง rating เฉลี่ย: คะแนนเฉลี่ยของทัวร์
 *  - แสดง schedule: ตารางวันที่ที่เปิดให้จอง
 *  - เลือก schedule → highlight วันที่เลือก
 *  - schedule ที่เต็มแล้ว → แสดงสถานะ "เต็ม" และไม่สามารถเลือกได้
 *  - แสดง sidebar booking: ราคา, วันที่, จำนวน
 *  - กดปุ่ม "จองเลย" → ไปหน้า booking (ถ้าเลือก schedule แล้ว)
 *  - กดปุ่ม "จองเลย" โดยไม่เลือก schedule → แสดง error "กรุณาเลือกวันที่"
 *  - กดปุ่ม heart/favorite → เพิ่มในรายการโปรด
 *  - กดปุ่ม share → แชร์ลิงก์ (copy link หรือ social)
 *  - Responsive: ข้อมูลเรียงตามบนมือถือ
 *
 * อ้างอิง: frontend/src/pages/TourDetailPage.tsx, frontend/src/components/tour/TourGallery.tsx
 */

---

## TC-005: Booking Flow

/**
 * Feature: Booking Flow — E2E Tests
 *
 * ครอบคลุม:
 *  - เข้าหน้า booking โดยต้อง login ก่อน (ถ้ายังไม่ login → redirect ไป login)
 *  - แสดงข้อมูลทัวร์: ชื่อ, วันที่, ราคา
 *  - เลือกวันที่ใน date picker → แสดงราคารวมอัตโนมัติ
 *  - เลือกจำนวนผู้ใหญ่ (adults) → คำนวณราคา adult × price
 *  - เลือกจำนวนเด็ก (children) → คำนวณราคา child × childPrice
 *  - เลือก children แต่ทัวร์ไม่มี child price → แสดง error หรือใช้ราคาผู้ใหญ่
 *  - จำนวน guest เกิน max capacity → แสดง error "จำนวนผู้โดยสารเกินจำนวนที่ว่าง"
 *  - กรอกข้อมูลติดต่อ: prefix (นาย, นาง, นางสาว), ชื่อ, email, phone
 *  - แสดงข้อมูลติดต่อเริ่มต้นจาก account (ถ้า login แล้ว)
 *  - กด "ใช้ข้อมูลจากบัญชี" → ใส่ข้อมูล account อัตโนมัติ
 *  - กด "กรอกเอง" → ให้กรอกข้อมูลใหม่
 *  - ช่อง special request (optional) → กรอกได้
 *  - แสดง booking summary: รายละเอียดทัวร์, วันที่, จำนวน, ราคารวม
 *  - กดปุ่ม "ชำระเงิน" → redirect ไปหน้า payment
 *  - Validation: ไม่เลือกวันที่ → แสดง error "กรุณาเลือกวันที่"
 *  - Validation: ไม่กรอกชื่อ → แสดง error
 *  - Validation: email ไม่ถูก format → แสดง error
 *  - Validation: phone ไม่ถูก format → แสดง error
 *  - กด "ย้อนกลับ" → กลับไปหน้า tour detail
 *  - ถ้า schedule เต็มระหว่างทำ booking → แสดง error "ตารางเดินทางเต็ม กรุณาเลือกวันอื่น"
 *
 * อ้างอิง: frontend/src/pages/BookingPage.tsx, frontend/src/components/tour/BookingSidebar.tsx
 */

---

## TC-006: Payment Slip Upload

/**
 * Feature: Payment Slip Upload — E2E Tests
 *
 * ครอบคลุม:
 *  - แสดง QR Code PromptPay สำหรับ scan ชำระเงิน
 *  - แสดงยอดรวมที่ต้องชำระ (บาท)
 *  - แสดงรายละเอียดการจอง: ชื่อทัวร์, วันที่, จำนวนคน
 *  - แสดงหมายเลขบัญชีที่ต้องโอน
 *  - แสดงเวลาที่เหลือในการชำระ (ถ้ามี timeout)
 *  - คลิก "เลือกไฟล์" หรือ "อัปโหลดสลิป" → เปิด file chooser
 *  - อัปโหลดไฟล์รูปภาพ (jpg, png) → แสดง preview
 *  - อัปโหลดไฟล์ที่ไม่ใช่รูป → แสดง error "กรุณาอัปโหลดไฟล์รูปภาพ"
 *  - อัปโหลดไฟล์ใหญ่เกิน 10MB → แสดง error "ไฟล์ใหญ่เกินไป"
 *  - อัปโหลดสลิปสำเร็จ → แสดงรูป preview
 *  - ลบไฟล์ที่อัปโหลด → ลบออกได้
 *  - กดปุ่ม "ยืนยันการชำระเงิน" → redirect ไป /my-bookings
 *  - ไม่อัปโหลดสลิปแล้วกดยืนยัน → แสดง error "กรุณาอัปโหลดสลิปการชำระเงิน"
 *  - แสดง booking status เป็น "รอตรวจสอบ" หลังยืนยัน
 *  - กด "ดูรายละเอียดการจอง" → แสดงรายละเอียด
 *  - กด "ย้อนกลับ" → กลับไปหน้า booking
 *
 * อ้างอิง: frontend/src/pages/PaymentPage.tsx, backend/src/payments/payments.service.ts
 */

---

## TC-007: My Bookings

/**
 * Feature: My Bookings — E2E Tests
 *
 * ครอบคลุม:
 *  - เข้าหน้า /my-bookings ต้อง login ก่อน (ไม่งั้น redirect ไป login)
 *  - แสดงรายการ booking ทั้งหมดของ user ที่ login
 *  - แสดง booking card: ชื่อทัวร์, วันที่, จำนวนคน, ราคารวม
 *  - แสดง status "รอตรวจสอบ" (pending) สีส้ม/เหลือง
 *  - แสดง status "ยืนยันแล้ว" (confirmed) สีเขียว
 *  - แสดง status "เสร็จสิ้น" (completed) สีเทา
 *  - แสดง status "ยกเลิก" (cancelled) สีแดง
 *  - คลิก booking card → แสดงรายละเอียดเต็ม (modal หรือ page ใหม่)
 *  - แสดงข้อมูลติดต่อที่ใช้จอง (prefix, ชื่อ, email, phone)
 *  - แสดงสลิปที่อัปโหลด
 *  - กดปุ่ม "ยกเลิกการจอง" สำหรับ status "รอตรวจสอบ" หรือ "ยืนยันแล้ว"
 *  - กดยกเลิก → แสดง confirm dialog "ต้องการยกเลิกการจองใช่หรือไม่?"
 *  - ยืนยันยกเลิก → status เปลี่ยนเป็น "ยกเลิก"
 *  - กด "ชำระเงิน" สำหรับ booking ที่ยังไม่จ่าย → redirect ไป /payment/{id}
 *  - ไม่มี booking เลย → แสดง "ไม่พบรายการจอง" พร้อมปุ่มไปหน้า tours
 *  - Filter: กรองตามสถานะ (ทั้งหมด, รอตรวจ, ยืนยัน, เสร็จ, ยกเลิก)
 *  - Filter: กรองตามวันที่ (ปี 2025, 2026)
 *  - Responsive: แสดงเป็น card บนมือถือ
 *
 * อ้างอิง: frontend/src/pages/MyBookingsPage.tsx, backend/src/bookings/bookings.controller.ts
 */

---

## TC-008: Admin Dashboard

/**
 * Feature: Admin Dashboard — E2E Tests
 *
 * ครอบคลุม:
 *  - เข้าหน้า /admin/dashboard ต้อง login เป็น admin เท่านั้น
 *  - login เป็น user ธรรมดา → redirect ไปหน้าหลัก (ไม่ให้เข้า)
 *  - แสดง stats cards: จำนวนการจองวันนี้
 *  - แสดง stats cards: รายได้วันนี้ (บาท)
 *  - แสดง stats cards: จำนวนทัวร์ทั้งหมด
 *  - แสดง stats cards: จำนวนผู้ใช้ทั้งหมด
 *  - แสดง line/bar chart: รายได้รายสัปดาห์/เดือน
 *  - แสดง pie chart: จำนวนการจองแต่ละภูมิภาค (เหนือ, กลาง, ใต้, อีสาน, ตะวันออก, ตะวันตก)
 *  - แสดง top tours: ทัวร์ที่มีคนจองมากที่สุด
 *  - แสดง recent bookings: รายการจองล่าสุด 5-10 รายการ
 *  - Date filter: เลือกวันเริ่ม-สิ้น → chart อัปเดตตามช่วง
 *  - Date filter: clear ปุ่ม → แสดงข้อมูลทั้งหมด (all time)
 *  - Refresh data: กด refresh → ดึงข้อมูลใหม่
 *  - แสดง loading state ขณะดึงข้อมูล
 *  - Error state: ถ้าดึงข้อมูลไม่ได้ → แสดง error message
 *  - Navbar: แสดงเมนู Dashboard, Tours, Bookings, Users (ถ้ามี)
 *
 * อ้างอิง: frontend/src/pages/admin/AdminDashboardPage.tsx, backend/src/analytics/dashboard.service.ts
 */

---

## TC-009: Favorites

/**
 * Feature: Favorites — E2E Tests
 *
 * ครอบคลุม:
 *  - เข้าหน้า /favorites ต้อง login ก่อน (ไม่งั้น redirect ไป login)
 *  - กดปุ่ม heart/favorite บน tour card (หน้า tours) → เพิ่มใน favorites
 *  - กดปุ่ม heart/favorite บน tour detail → เพิ่มใน favorites
 *  - กด heart ซ้ำ → ลบออกจาก favorites
 *  - หน้า favorites แสดง tour cards ที่ favorite ไว้
 *  - แสดงรูปภาพ, ชื่อ, ราคา, จังหวัด ของแต่ละ tour
 *  - คลิก tour card → ไปหน้า tour detail
 *  - กดปุ่มลบ (X) บน card → ลบออกจาก favorites
 *  - ยังไม่มี favorites → แสดง "ยังไม่มีรายการโปรด"
 *  - แสดงปุ่ม "ไปหน้าทัวร์" เพื่อไปเลือกทัวร์
 *  - จำนวน favorites แสดงใน navbar (badge)
 *  - ปิด app แล้วเป้าใหม่ → favorites ยังอยู่ (ถ้า login ด้วย rememberMe)
 *  - ลบ tour ออกจากระบบ → favorites หายไปด้วย
 *
 * อ้างอิง: frontend/src/pages/FavoritesPage.tsx, frontend/src/context/FavoritesContext.tsx
 */

---

## TC-010: Session Persistence

/**
 * Feature: Session Persistence — E2E Tests
 *
 * ครอบคลุม:
 *  - Login ด้วย rememberMe = true → session คงอยู่หลัง refresh หน้า
 *  - Login ด้วย rememberMe = false → session หมดหลัง close browser tab
 *  - Session หมดแล้วเข้าหน้าที่ต้อง login → redirect ไปหน้า login
 *  - Session หมดแล้วกด API ที่ต้อง auth → return 401 และ redirect
 *  - Logout: กดปุ่มออกจากระบบ → session ถูกลบ
 *  - Logout แล้วเข้าหน้า /my-bookings → redirect ไป login
 *  - Logout แล้วเข้าหน้า /admin/* → redirect ไป login
 *  - ปิด browser แล้วเปิดใหม่ (มี cookie) → auto login
 *  - ปิด browser แล้วเปิดใหม่ (ไม่มี cookie) → ไม่ auto login
 *  - ลอง login ซ้ำในขณะที่มี token อยู่ → ใช้ session เดิมได้
 *  - Token expires ในขณะใช้งาน → แสดง error และ redirect login
 *  - Remember me token ใช้ได้นาน 30 วัน
 *  - Access token ใช้ได้ 15 นาที แล้วต้อง refresh
 *
 * อ้างอิง: frontend/src/context/AuthContext.tsx, backend/src/auth/auth.service.ts
 */

---

## ✅ Test Checklist

- [ ] TC-001: User Registration
- [ ] TC-002: User Login
- [ ] TC-003: Tour Listing & Search
- [ ] TC-004: Tour Detail
- [ ] TC-005: Booking Flow
- [ ] TC-006: Payment Slip Upload
- [ ] TC-007: My Bookings
- [ ] TC-008: Admin Dashboard
- [ ] TC-009: Favorites
- [ ] TC-010: Session Persistence