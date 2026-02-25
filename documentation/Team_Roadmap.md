# 🗺️ Team Roadmap — 9Tours

> 90% DEMO: **11 มี.ค. 2026**
> 100% DEMO: **18 มี.ค. 2026**
> อัปเดตความคืบหน้า: **ทุกวันอาทิตย์ + วันพฤหัส**

---

## 🔥 เร่งด่วน — 27 ก.พ. 2026

### Backend — ส่งภายใน 17:00

- แก้ Auth ตาม `Backend_Feedback.md` ให้ครบ 3 จุด:
  - แก้ JWT_SECRET ให้ใช้ .env จริง (fallback ต้องตรงกัน)
  - ปิดช่อง admin role escalation ตอน register
  - เพิ่ม GET /auth/me endpoint
- สร้าง Booking API ให้ใช้งานได้:
  - POST /bookings — สร้าง booking (ต้อง login)
  - GET /bookings/my — ดูรายการจองของ user ที่ login
  - PATCH /bookings/:id/status — Admin เปลี่ยนสถานะ
- ตัวชี้วัด: เรียก API จาก Postman ได้ทุก endpoint + Auth ปลอดภัย

### Frontend — ส่งภายใน 17:00

- แก้ Auth ตาม `Frontend_Feedback.md`:
  - สร้าง ProtectedRoute + AdminRoute
  - เพิ่ม 401 interceptor ใน axios
- สร้าง/แก้หน้า Booking ให้เชื่อมต่อกับ Booking API จริง:
  - ส่ง paxCount + scheduleId + totalPrice ไปที่ Backend
  - แสดงผลสำเร็จ/ล้มเหลว
- ตัวชี้วัด: จองทัวร์จากหน้าเว็บจริงได้ + หน้า admin เข้าไม่ได้ถ้าไม่ login

### QA — ตรวจก่อนประชุม 19:00

- ทดสอบ Auth Security ตาม `QA_Feedback.md` ข้อ 1:
  - register ด้วย role admin ต้องไม่ได้
  - login ผิดต้อง return 401
  - เข้า admin โดยไม่ login ต้องถูก redirect
- ทดสอบ Booking flow:
  - login → เลือกทัวร์ → จอง → เช็คว่า booking ถูกสร้าง
- ตัวชี้วัด: มีผลทดสอบเป็น pass/fail พร้อมรายงานในที่ประชุม

---

## สัปดาห์ที่ 2 (3 – 9 มี.ค.) — Booking + Payment ครบ loop

### Backend

- สร้าง Booking API: POST /bookings, GET /bookings/my, PATCH /bookings/:id/status
- สร้าง Payment API: POST /payments (upload slip), PATCH /payments/:id/approve
- ตัวชี้วัด: เรียก API จาก Postman ได้ครบ flow (สร้าง booking → upload slip → admin อนุมัติ)
- **ส่งภายใน:** ศุกร์ 7 มี.ค.

### Frontend

- หน้า Booking: เชื่อม API จริง ส่ง paxCount + scheduleId + totalPrice ได้
- หน้า My Bookings: แสดงรายการจองของ user + สถานะ
- หน้า Admin: จัดการ booking (ดู/อนุมัติ/ปฏิเสธ)
- ตัวชี้วัด: จองทัวร์บนหน้าเว็บจริงได้ครบ loop
- **ส่งภายใน:** อาทิตย์ 9 มี.ค.

### QA

- ทดสอบ Booking flow end-to-end (จอง → ชำระ → อนุมัติ)
- ทดสอบ edge cases (จองเกิน capacity, cancel booking)
- ตัวชี้วัด: ไม่มี critical bug ใน booking flow
- **ส่งภายใน:** อาทิตย์ 9 มี.ค.

---

## สัปดาห์ที่ 3 (10 – 11 มี.ค.) — DEMO 90%

### ทุกฝ่าย

- ซ้อม demo flow: ดูทัวร์ → เลือกวัน → จอง → ชำระเงิน → ดูสถานะ
- แก้ bug ที่เจอระหว่างซ้อม
- ตัวชี้วัด: demo ได้ราบรื่นไม่มี crash หรือ error
- **ส่งภายใน:** อังคาร 11 มี.ค. (วัน DEMO)

---

## สัปดาห์ที่ 4 (12 – 18 มี.ค.) — DEMO 100%

### Backend

- เพิ่ม Recommendation API: GET /tours/:id/similar, GET /tours/popular
- ตรวจสอบว่า tour_views ถูกบันทึกถูกต้อง
- ตัวชี้วัด: API คืนทัวร์ที่เกี่ยวข้องจริง
- **ส่งภายใน:** เสาร์ 15 มี.ค.

### Frontend

- เพิ่ม section "ทัวร์ที่คล้ายกัน" ในหน้า Tour Detail
- เพิ่ม section "ทัวร์ยอดนิยม" ในหน้า Home
- ขัดเกลา UI: loading states, error boundary, responsive
- ตัวชี้วัด: ทุกหน้าใช้งานได้ดีทั้ง desktop
- **ส่งภายใน:** อังคาร 17 มี.ค.

### QA

- ทดสอบ full flow ทั้งหมดอีกรอบ
- ทดสอบ recommendation แสดงผลถูกต้อง
- ตัวชี้วัด: ไม่มี bug ใดๆ ในวัน demo
- **ส่งภายใน:** อังคาร 17 มี.ค.

---

## หลักการทำงานร่วมกัน

- ทำงานบน **branch ของตัวเอง** แล้วเปิด **PR เข้า develop**
- PR ต้องมี description สั้นๆ ว่าแก้/เพิ่มอะไร
- ถ้าติดปัญหา — แจ้งในกลุ่มทันที อย่ารอจนวันส่ง
- อ่าน Feedback ของฝ่ายตัวเองใน `documentation/` ให้จบก่อนเริ่มทำ
