# 🗺️ Team Roadmap — 9Tours
## 🔥 เร่งด่วน — 26 ก.พ. 2026

### Backend — ส่งภายใน 14:00

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

### QA — ตรวจ 18:00

- ทดสอบ Auth Security ตาม `QA_Feedback.md` ข้อ 1:
  - register ด้วย role admin ต้องไม่ได้
  - login ผิดต้อง return 401
  - เข้า admin โดยไม่ login ต้องถูก redirect
- ทดสอบ Booking flow:
  - login → เลือกทัวร์ → จอง → เช็คว่า booking ถูกสร้าง
- ตัวชี้วัด: มีผลทดสอบเป็น pass/fail พร้อมรายงานในที่ประชุม