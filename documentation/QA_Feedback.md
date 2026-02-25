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

### 4. 🟡 ทดสอบ Booking Flow

- ลองจอง booking โดยไม่ login → ต้องถูก redirect ให้ login ก่อน (หลังแก้ ProtectedRoute)
- ลองจอง booking สำเร็จ → paxCount และ totalPrice ถูกต้อง
- ลองเข้าหน้า My Bookings → แสดงรายการจองของ user ที่ login อยู่เท่านั้น

### 5. 🟢 ทดสอบ Cross-Browser

- Chrome, Firefox, Safari, Edge
- ตรวจสอบว่า localStorage ทำงานถูกต้อง
- ตรวจสอบว่า CSS animation ทำงาน (date slider buttons, hover effects)

---

## 💡 แนะนำเพิ่มเติม

- เริ่มจากทดสอบ **ข้อ 1 (Auth Security)** ก่อน เพราะเป็นช่องโหว่ที่อันตราย
- ใช้ **Postman** หรือ **Thunder Client** ทดสอบ API ก่อนทดสอบ UI
- บันทึกผลทดสอบเป็นตาราง (test case / expected / actual / pass/fail)
