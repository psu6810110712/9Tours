# Manual Test Cases - 9Tours

> เอกสารนี้สำหรับ QA ทดสอบระบบแบบ Manual Testing  
> อิงจาก E2E Test อัตโนมัติใน `tests/e2e/`

---

## สภาพแวดล้อมการทดสอบ

| รายการ | ค่า |
|--------|-----|
| Frontend URL | `http://127.0.0.1:5173` |
| API URL | `http://127.0.0.1:3000` |
| Admin Email | `admin@9tours.com` |
| Admin Password | `password123` |

---

## Test Suite 1: ระบบติดตามแบบไม่ระบุตัวตน (Anonymous Tracking)

### TC-01: ระบบบันทึกการเข้าชมโดยไม่ต้องขอความยินยอม

**วัตถุประสงค์:** ยืนยันว่าระบบติดตามบันทึกการเข้าชมได้โดยไม่ต้องขอความยินยอมจากผู้ใช้

**ขั้นตอนการทดสอบ:**

1. เปิด Browser (Chrome/Firefox) ไปที่ `http://127.0.0.1:5173/tours/1`
2. เปิด Developer Tools (F12) → แท็บ **Application**
3. ในเมนูซ้าย → เลือก **Local Storage** → `http://127.0.0.1:5173`
4. ตรวจสอบว่ามี Key `anonymous_id` ที่มีค่าขึ้นต้นด้วย `anon_`

**ผลลัพธ์ที่คาดหวัง:**
- [ ] มี `anonymous_id` ใน Local Storage
- [ ] ค่าแสดงรูปแบบ `anon_` ตามด้วยตัวอักษรและตัวเลข เช่น `anon_abc123def456`

**Automated Test:** `tests/e2e/tracking.spec.ts` - TC-01

---

### TC-02: ระบบส่ง Header x-anonymous-id

**วัตถุประสงค์:** ยืนยันว่า API request มี Header `x-anonymous-id`

**ขั้นตอนการทดสอบ:**

1. เปิด Browser ไปที่ `http://127.0.0.1:5173/tours/1`
2. เปิด Developer Tools (F12) → แท็บ **Network**
3. รีเฟรชหน้า (F5)
4. กรองเฉพาะ XHR/Fetch requests → ค้นหา `/analytics/events`
5. คลิกที่ request นั้น → ดูแท็บ **Headers**
6. ตรวจสอบว่ามี Request Header ชื่อ `x-anonymous-id`

**ผลลัพธ์ที่คาดหวัง:**
- [ ] มี Header `x-anonymous-id` ใน request
- [ ] ค่า匹配 pattern `anon_[a-f0-9]+`

**Automated Test:** `tests/e2e/tracking.spec.ts` - TC-02

---

### TC-03: anonymous_id คงอยู่หลัง Reload หน้า

**วัตถุประสงค์:** ยืนยันว่า anonymous_id ไม่เปลี่ยนเมื่อผู้ใช้รีเฟรชหน้า

**ขั้นตอนการทดสอบ:**

1. เปิด Browser ไปที่ `http://127.0.0.1:5173/tours/1`
2. เปิด Developer Tools → Application → Local Storage
3. จดบันทึกค่า `anonymous_id`
4. กด F5 เพื่อรีเฟรชหน้า
5. ตรวจสอบค่า `anonymous_id` อีกครั้ง

**ผลลัพธ์ที่คาดหวัง:**
- [ ] ค่า `anonymous_id` ก่อนและหลัง reload เหมือนกัน

**Automated Test:** `tests/e2e/tracking.spec.ts` - TC-03

---

## Test Suite 2: แดชบอร์ดผู้ดูแลระบบ (Admin Dashboard)

### TC-04: แดชบอร์ดแสดงข้อมูลทั้งหมดโดยค่าเริ่มต้น

**วัตถุประสงค์:** ยืนยันว่าแดชบอร์ดแสดงข้อมูลทั้งหมด (ไม่กรองตามเดือนปัจจุบัน)

**ขั้นตอนการทดสอบ:**

1. Login เป็น Admin ที่ `http://127.0.0.1:5173/admin/login`
   - Email: `admin@9tours.com`
   - Password: `password123`
2. ไปที่ `http://127.0.0.1:5173/admin/dashboard`
3. มองหาช่องใส่วันที่ (Date Picker) สองช่อง
   - ช่องแรก = วันเริ่มต้น
   - ช่องที่สอง = วันสิ้นสุด

**ผลลัพธ์ที่คาดหวัง:**
- [ ] ช่องวันที่เริ่มต้นว่างเปล่า (ไม่มีค่า)
- [ ] ช่องวันที่สิ้นสุดว่างเปล่า (ไม่มีค่า)
- [ ] แสดงข้อมูลย้อนหลัง (ไม่ใช่แค่เดือนปัจจุบัน)

**Automated Test:** `tests/e2e/admin-dashboard.spec.ts` - TC-04

---

### TC-05: ปุ่มล้างตัวกรองวันททำงานถูกต้อง

**วัตถุประสงค์:** ยืนยันว่าปุ่ม ✕ ล้างค่าวันที่

**ขั้นตอนการทดสอบ:**

1. Login เป็น Admin → ไปที่ `/admin/dashboard`
2. คลิกที่ช่องวันที่เริ่มต้น → เลือก `2025-01-01`
3. คลิกที่ช่องวันที่สิ้นสุด → เลือก `2025-12-31`
4. มองหาปุ่ม ✕ ข้างช่องวันที่
5. คลิกปุ่ม ✕

**ผลลัพธ์ที่คาดหวัง:**
- [ ] ช่องวันที่เริ่มต้นว่างเปล่าหลังคลิก
- [ ] ช่องวันที่สิ้นสุดว่างเปล่าหลังคลิก

**Automated Test:** `tests/e2e/admin-dashboard.spec.ts` - TC-05

---

### TC-06: แผนภูมิวงกลม (Pie Chart) แสดงผล

**วัตถุประสงค์:** ยืนยันว่า Pie Chart "ความนิยมตามภูมิภาค" แสดงบนแดชบอร์ด

**ขั้นตอนการทดสอบ:**

1. Login เป็น Admin → ไปที่ `/admin/dashboard`
2. รอให้หน้าโหลดสมบูรณ์ (10+ วินาที)
3. เลื่อนหาแผนภูมิวงกลม (Pie Chart)

**ผลลัพธ์ที่คาดหวัง:**
- [ ] เห็น Pie Chart แสดงบนหน้าจอ
- [ ] มีข้อมูลภูมิภาค (เช่น ภาคเหนือ, ภาคกลาง, ภาคใต้)

**Automated Test:** `tests/e2e/admin-dashboard.spec.ts` - TC-06

---

## สรุปผลการทดสอบ

| TC | Test Case | ผ่าน | ไม่ผ่าน | หมายเหตุ |
|----|-----------|:----:|:-------:|----------|
| TC-01 | บันทึกการเข้าชมโดยไม่ต้องขอความยินยอม | ⬜ | ⬜ | |
| TC-02 | ส่ง Header x-anonymous-id | ⬜ | ⬜ | |
| TC-03 | anonymous_id คงอยู่หลัง Reload | ⬜ | ⬜ | |
| TC-04 | แดชบอร์ดแสดงข้อมูลทั้งหมด | ⬜ | ⬜ | |
| TC-05 | ปุ่มล้างตัวกรองทำงาน | ⬜ | ⬜ | |
| TC-06 | Pie Chart แสดงผล | ⬜ | ⬜ | |

---

## เครื่องมือที่ใช้

| เครื่องมือ | วัตถุประสงค์ |
|-----------|-------------|
| Browser DevTools (F12) | ตรวจสอบ Local Storage, Network Headers |
| Network Tab | ดู API Requests และ Responses |
| Application Tab | ตรวจสอบ Local Storage / Session Storage |

---

## Notes

- Test นี้อิงจาก Automated Tests ใน `tests/e2e/tracking.spec.ts` และ `tests/e2e/admin-dashboard.spec.ts`
- หาก Manual Test ไม่ผ่าน → ตรวจสอบ Automated Test ด้วย: `npx playwright test`
- ระบบ Tracking ไม่ต้องขอความยินยอม (PDPA-compliant)
- แดชบอร์ดแสดงข้อมูลย้อนหลังทั้งหมด ไม่กรองตามเดือนปัจจุบัน
