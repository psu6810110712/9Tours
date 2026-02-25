# 🧪 QA Feedback

> วันที่: 25 ก.พ. 2026
> จาก: PM

---

## สรุปภาพรวม

ระบบยังไม่มี automated tests เลย QA ต้องเริ่มต้นวางแผนการทดสอบทั้งหมด

---

## ❌ สิ่งที่ยังไม่มีและต้องทำ

### 1. 🔴 ทดสอบ Auth Security

- ลอง register ด้วย `{ role: "admin" }` → ต้องไม่สามารถตั้ง admin ได้
- ลอง login ด้วย password ผิด → ต้อง return 401 + ข้อความ "อีเมลหรือรหัสผ่านไม่ถูกต้อง"
- ลอง register ด้วย email ซ้ำ → ต้อง return 400 + ข้อความ "อีเมลนี้มีผู้ใช้แล้ว"
- ลอง register ด้วย password น้อยกว่า 6 ตัว → ต้อง return validation error
- ลองเข้าหน้า `/admin/tours` โดยไม่ login → ต้องถูก redirect (หลัง frontend แก้แล้ว)
- ลองเข้า admin endpoint ด้วย token ของ user role customer → ต้อง return 403

### 2. 🔴 ทดสอบ API Endpoints

- `POST /auth/register` — ส่ง body ถูกต้อง, body ว่าง, email ซ้ำ
- `POST /auth/login` — email ถูก + password ผิด, email ไม่มีในระบบ
- `GET /auth/me` — ส่ง token ถูก, token หมดอายุ, ไม่ส่ง token (หลัง Backend เพิ่มแล้ว)
- ทดสอบว่า token ที่ได้จาก login ใช้เข้า protected endpoint ได้จริง

### 3. 🟡 ทดสอบ Frontend UI

- **LoginModal**
  - กรอก email + password แล้วกด login → ต้อง login สำเร็จ + modal ปิด
  - กรอกข้อมูลผิด → ต้องแสดง error message สีแดง
  - กด "สมัครเลย" → ต้องเปิด RegisterModal
  - กดนอก modal → ต้องปิด modal
  - กด ✕ → ต้องปิด modal
- **RegisterModal**
  - กรอกข้อมูลครบ → สมัครสำเร็จ + login อัตโนมัติ
  - กรอก email ซ้ำ → ต้องแสดง error
- **Navbar**
  - ก่อน login → แสดงปุ่ม "เข้าสู่ระบบ"
  - หลัง login → แสดงชื่อ user + ปุ่ม logout
  - หลัง logout → กลับไปแสดงปุ่ม "เข้าสู่ระบบ"

### 4. 🔴 ทดสอบ Booking Flow — ต้องเสร็จก่อนประชุมพฤหัส 26 ก.พ. 20:00

- **จอง booking สำเร็จ (end-to-end)**
  - login → เปิดหน้าทัวร์ → เลือกวัน → กดจอง
  - ตรวจสอบว่า database มี row ใหม่ในตาราง `bookings`
  - ตรวจสอบว่า `tour_schedules.currentBooked` อัปเดตจริง
  - ตรวจสอบว่า `paxCount` และ `totalPrice` ถูกต้อง
  - ตรวจสอบว่าหน้า My Bookings แสดงรายการที่เพิ่งจอง
- **จองโดยไม่ login** → ต้องถูก redirect ให้ login ก่อน
- **จองเกิน capacity** → ต้อง return error ไม่ให้จอง
- **ดู My Bookings** → ต้องแสดงเฉพาะ booking ของ user ที่ login ไม่ใช่ของคนอื่น
- **Admin เปลี่ยนสถานะ** → PATCH status แล้วต้องอัปเดตจริงใน database

### 5. 🟢 ทดสอบ Cross-Browser

- Chrome, Firefox, Safari, Edge
- ตรวจสอบว่า localStorage ทำงานถูกต้อง
- ตรวจสอบว่า CSS animation ทำงาน (date slider buttons, hover effects)

---

## 💡 แนะนำเพิ่มเติม

- เริ่มจากทดสอบ **ข้อ 1 (Auth Security)** + **ข้อ 4 (Booking Flow)** ก่อน เพราะเป็นสิ่งที่ต้อง demo ในวันพฤหัส
- ใช้ **Postman** หรือ **Thunder Client** ทดสอบ API ก่อนทดสอบ UI
- หลังทดสอบ API แล้ว ให้ทดสอบบนหน้าเว็บจริง (Frontend) ว่าจองได้ครบ loop
- บันทึกผลทดสอบเป็น pass/fail พร้อมรายงานในที่ประชุม 20:00
