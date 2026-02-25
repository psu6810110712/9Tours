# 🔐 Auth System Audit Report

> วันที่ตรวจสอบ: 25 ก.พ. 2026

---

ระบบ Auth ของ 9Tours มี **โครงสร้างพื้นฐานครบ** แต่ยัง**ใช้งานจริงไม่ได้สมบูรณ์** มีจุดที่ต้องแก้ไขก่อน deploy

| หัวข้อ | สถานะ |
|---|---|
| Register (สมัครสมาชิก) | ✅ ทำงานได้ |
| Login (เข้าสู่ระบบ) | ✅ ทำงานได้ |
| JWT Token Generation | ✅ ทำงานได้ |
| Password Hashing (bcrypt) | ✅ ทำงานได้ |
| Role-Based Access (Admin/Customer) | ⚠️ มีแต่ใช้แค่ 1 จุด |
| Token Validation (GET /auth/me) | ❌ ไม่มี endpoint ใน backend |
| Frontend Route Protection | ❌ ไม่มี ProtectedRoute |
| Refresh Token | ❌ ไม่มี |
| JWT Secret Security | ❌ ใช้ fallback key |

---

## ✅ สิ่งที่ทำได้ดี

1. **Password Security** — ใช้ `bcrypt` hash กับ salt round 10 ถูกต้อง ไม่เก็บ plain text
2. **JWT Structure** — Payload มี `sub` (userId), `email`, `role` ครบ token หมดอายุ 24 ชม.
3. **DTO Validation** — ใช้ `class-validator` ตรวจสอบ input ทั้ง login และ register (email format, password min 6 ตัว)
4. **Error Messages เป็นภาษาไทย** — UX ดีสำหรับผู้ใช้ไทย
5. **RolesGuard มีระบบป้องกัน** — เช็ค `if (!user) return false` กันกรณีลืมใส่ JwtAuthGuard
6. **Frontend AuthContext** — ออกแบบดี มี `isLoading` state, persist ลง localStorage
7. **LoginModal UI** — มี loading state, error handling, สลับไป register ได้

---

## ❌ จุดวิกฤต (ต้องแก้ก่อน deploy)

### 1. ไม่มี `GET /auth/me` Endpoint

**ปัญหา:** Frontend มี `authService.getMe()` เรียก `GET /auth/me` แต่ Backend **ไม่มี endpoint นี้เลย**

**ผลกระทบ:** ไม่สามารถ verify token ได้ ถ้า token หมดอายุ frontend จะยังแสดงว่า login อยู่ (เพราะอ่านจาก localStorage)

**แก้ไข:** Backend ต้องเพิ่ม endpoint:
```typescript
@UseGuards(JwtAuthGuard)
@Get('me')
getMe(@Request() req) {
  return req.user;
}
```

### 2. JWT_SECRET ไม่ปลอดภัย

**ปัญหา:** ไม่มีไฟล์ `.env` ในโปรเจกต์ ทำให้ JWT_SECRET ใช้ค่า fallback:
- `auth.module.ts` → `'your-secret-key'`
- `jwt.strategy.ts` → `'fallback_secret_key'`
- ค่า fallback **ไม่ตรงกัน** → token ที่ sign ด้วย key หนึ่ง อาจ verify ไม่ได้ด้วยอีก key หนึ่ง

**แก้ไข:** สร้างไฟล์ `.env` และใส่ `JWT_SECRET=<random-strong-key>`

### 3. Register Endpoint อนุญาตตั้ง Role เป็น Admin ได้

**ปัญหา:** `CreateUserDto` มี `role` เป็น optional field → ใครก็ส่ง `{ role: "admin" }` ตอน register ได้

**ผลกระทบ:** ช่องโหว่ความปลอดภัยร้ายแรง ผู้ใช้ทั่วไปสามารถตั้งตัวเองเป็น admin

**แก้ไข:** ลบ `role` ออกจาก register flow หรือบังคับให้เป็น `customer` เสมอ

---

## ⚠️ จุดที่ควรเพิ่ม

### 4. ไม่มี Frontend Route Protection

**ปัญหา:** ไม่มี `ProtectedRoute` component → หน้า admin dashboard ไม่ถูกป้องกัน ใครก็พิมพ์ URL เข้าถึงได้

**แก้ไข:** สร้าง `ProtectedRoute` component ที่เช็ค `useAuth()` ก่อนแสดงหน้า

### 5. JwtAuthGuard ใช้แค่ 1 จุด

**ปัญหา:** `@UseGuards(JwtAuthGuard)` ใช้เฉพาะใน `users.controller.ts` → endpoint อื่นๆ เช่น bookings, tours (admin CRUD) **ไม่ได้ป้องกัน**

**แก้ไข:** ใส่ `@UseGuards(JwtAuthGuard)` ในทุก controller/endpoint ที่ต้อง login

### 6. ไม่มี Refresh Token

**ปัญหา:** Token หมดอายุ 24 ชม. แล้วต้อง login ใหม่ ไม่มีระบบ refresh อัตโนมัติ

**ผลกระทบ:** UX ไม่ดี ผู้ใช้ที่ใช้งานข้ามวันต้อง login ใหม่

### 7. "จดจำฉัน" Checkbox ไม่ทำงานจริง

**ปัญหา:** `LoginModal` มี checkbox "จดจำฉัน" แต่ค่า `remember` **ไม่ถูกใช้งานที่ไหนเลย** token ถูกเก็บ localStorage เสมอไม่ว่าจะติ๊กหรือไม่

### 8. Token Expiry ไม่ถูก Handle ใน Frontend

**ปัญหา:** ถ้า token หมดอายุ API จะ return 401 แต่ frontend ไม่มี interceptor ที่จะจับ 401 แล้ว auto-logout

--------------------------



### ER Diagram — รายการแก้ไขให้ตรงกับ Code

> วันที่: 25 ก.พ. 2026  
> อ้างอิงจาก: Entity files ใน `backend/src/`

---

## 1. ตาราง `users`

- แก้ `id` จาก integer เป็น **UUID (varchar)** เพราะใน code ใช้ `@PrimaryGeneratedColumn('uuid')`
- เปลี่ยน `full_name` เป็น `name` เพราะใน code ใช้ชื่อ `name`
- เพิ่ม `updated_at` (timestamp) เพราะใน code มี `@UpdateDateColumn()`

---

## 2. ตาราง `tours`

- เปลี่ยน `title` เป็น `name` เพราะใน code ใช้ชื่อ `name`
- เปลี่ยน `price_per_person` เป็น `price` (decimal 10,2) เพราะใน code ใช้ชื่อ `price`
- เปลี่ยน `image_url` (varchar, 1 รูป) เป็น `images` (jsonb, array หลายรูป) เพราะใน code เก็บรูปภาพเป็น array
- เปลี่ยน `is_visible` เป็น `isActive` (boolean, default: true) เพราะใน code ใช้ชื่อ `isActive`
- เพิ่ม `tour_type` — enum(`one_day`, `package`) เพราะใน code แยกประเภททัวร์วันเดียวกับแพ็กเกจ
- เพิ่ม `original_price` — decimal(10,2), nullable เพราะใช้เก็บราคาก่อนลดเพื่อแสดงส่วนลด
- เพิ่ม `highlights` — jsonb เพราะใช้เก็บจุดเด่นของทัวร์เป็น array
- เพิ่ม `itinerary` — jsonb เพราะใช้เก็บกำหนดการ `[{time, title, description}]`
- เพิ่ม `transportation` — varchar, nullable เพราะใช้ระบุยานพาหนะ
- เพิ่ม `duration` — varchar เพราะใช้ระบุระยะเวลาทัวร์
- เพิ่ม `accommodation` — varchar, nullable เพราะใช้ระบุที่พักสำหรับทัวร์แบบ package
- เพิ่ม `rating` — float (default: 0) เพราะใช้เก็บคะแนนรีวิวเฉลี่ย
- เพิ่ม `review_count` — integer (default: 0) เพราะใช้เก็บจำนวนรีวิว
- เพิ่ม `categories` — jsonb เพราะใช้เก็บหมวดหมู่ย่อยเป็น array of string
- เพิ่ม `updated_at` — timestamp เพราะใน code มี `@UpdateDateColumn()`

---

## 3. ตาราง `tour_schedules`

- เปลี่ยน `travel_date` เป็น `start_date` (date) เพราะใน code ใช้ชื่อ `startDate`
- เพิ่ม `end_date` (date) เพราะใน code มีฟิลด์ `endDate` สำหรับรองรับทัวร์หลายวัน
- เปลี่ยน `total_capacity` เป็น `max_capacity` (integer) เพราะใน code ใช้ชื่อ `maxCapacity`
- เปลี่ยน `available_seats` เป็น `current_booked` (integer, default: 0) เพราะใน code เก็บเป็น "จำนวนที่จองแล้ว" แทน "จำนวนที่เหลือ"
- เพิ่ม `time_slot` — varchar, nullable เพราะใช้ระบุรอบเวลา เช่น รอบเช้า/รอบบ่าย
- เพิ่ม `round_name` — varchar, nullable เพราะใช้ตั้งชื่อรอบสำหรับทัวร์ที่มีหลายรอบต่อวัน

---

## 4. Relationship Lines ที่ต้องเพิ่ม/แก้ไข

- เพิ่มเส้น `tours` → `festivals` (FK: `festival_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- เพิ่มเส้น `tours` → `tour_categories` (FK: `category_id`, N:1) เพราะใน Diagram เส้นไม่ชัดเจน
- เพิ่มเส้น `tour_views` → `users` (FK: `user_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- เพิ่มเส้น `tour_views` → `tours` (FK: `tour_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- แก้เส้น `provinces` → `regions` (FK: `region_id`, N:1) ให้ชัดเจนขึ้น เพราะเส้นปัจจุบันจางมาก
- ทุกเส้นควรมี **crow's foot notation** ระบุ cardinality (1:N) ให้ชัดเจน

---

### ข้อมูลที่ยังขาดและควรเก็บเพิ่มถ้าจะทำ Recomendation

- **เวลาที่อยู่ในหน้าทัวร์** (dwell time) — อยู่นานแปลว่าสนใจ
- **การ scroll ดูรูปภาพ/itinerary** — ดูลึกแค่ไหน
- **Wishlist / Favorite** — ทัวร์ที่กดบันทึก (ยังไม่มีฟีเจอร์นี้)
- **Search queries** — คำค้นหา
- **Ratings/Reviews จากผู้ใช้** — มี rating กับ reviewCount แต่ยังไม่มีตาราง reviews จริง



