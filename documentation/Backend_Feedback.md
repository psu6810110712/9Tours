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


## 🔴 Booking API — ต้องเสร็จภายในพฤหัส 26 ก.พ. 14:00

ตอนนี้ Backend มี `Booking` entity แต่ **ไม่มี Controller/API เลย** ทำให้ระบบจองใช้งานจริงไม่ได้

### Endpoints ที่ต้องสร้าง

- `POST /bookings` — สร้าง booking ใหม่ (ต้อง login)
  - รับ: `scheduleId`, `paxCount`
  - คำนวณ: `totalPrice = paxCount × tour.price`
  - ตรวจสอบ: `currentBooked + paxCount <= maxCapacity` (ถ้าเกินต้อง return error)
  - อัปเดต: `tour_schedules.currentBooked += paxCount`
  - ตั้ง status เริ่มต้น: `PENDING_PAYMENT`

- `GET /bookings/my` — ดูรายการจองของ user ที่ login (ต้อง login)
  - คืน booking พร้อม tour info + schedule info + status

- `PATCH /bookings/:id/status` — Admin เปลี่ยนสถานะ (ต้องเป็น admin)
  - รับ: `status` (CONFIRMED, CANCELLED, etc.)

### DTO ที่ต้องสร้าง

```typescript
// create-booking.dto.ts
export class CreateBookingDto {
  @IsNumber()
  scheduleId: number;

  @IsNumber()
  @Min(1)
  paxCount: number;
}
```

### ตัวชี้วัด

- เรียก `POST /bookings` จาก Postman แล้ว database มี row ใหม่ใน `bookings` + `currentBooked` อัปเดตจริง
- เรียก `GET /bookings/my` แล้วได้รายการจองของ user ที่ login