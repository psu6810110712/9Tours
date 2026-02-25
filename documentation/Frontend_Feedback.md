# 🎨 Frontend Feedback

> วันที่: 25 ก.พ. 2026
> จาก: PM

---

## สรุปภาพรวม

โครงสร้าง Frontend ดี — ใช้ React + TypeScript + React Router แบ่ง pages/components ชัดเจน แต่ยังมีหลายจุดที่ต้องแก้ไขเพื่อให้ใช้งานได้จริง

| หัวข้อ | สถานะ |
|---|---|
| หน้า Home, Tours, TourDetail | ✅ ใช้งานได้ |
| Login / Register Modal | ✅ UI สวย ใช้งานได้ |
| AuthContext (state management) | ✅ ครบ (login, register, logout, isAdmin) |
| Admin Pages (list, form) | ⚠️ มีแต่ไม่ได้ป้องกัน |
| Route Protection | ❌ ไม่มี ProtectedRoute |
| Token Expiry Handling | ❌ ไม่มี 401 interceptor |
| "จดจำฉัน" checkbox | ❌ ไม่ทำงานจริง |

---

## ❌ ต้องแก้ไข (เรียงตาม Priority)

### 1. 🔴 ไม่มี ProtectedRoute — หน้า Admin เข้าถึงได้โดยไม่ต้อง login

- ใน `App.tsx` ทุก route ถูก render ตรงๆ ไม่มีการเช็ค auth:
  - `/admin/tours` → ใครก็เข้าได้
  - `/admin/tours/new` → ใครก็สร้างทัวร์ได้
  - `/admin/tours/:id/edit` → ใครก็แก้ไขทัวร์ได้
  - `/booking/:tourId` → ควรต้อง login ก่อนจอง
  - `/my-bookings` → ควรต้อง login ก่อนดูรายการจอง

**สิ่งที่ต้องทำ:**
- สร้าง `ProtectedRoute` component ที่เช็ค `useAuth()` ก่อน render
- สร้าง `AdminRoute` component ที่เช็คว่า `isAdmin === true`
- ครอบ route ที่ต้องป้องกันด้วย component เหล่านี้
- ถ้าไม่ได้ login → redirect ไปหน้า Home + เปิด LoginModal
- ถ้า login แต่ไม่ใช่ admin → แสดง "ไม่มีสิทธิ์เข้าถึง"

---

### 2. 🔴 ไม่มี 401 Interceptor — token หมดอายุแต่ไม่ auto-logout

- ถ้า JWT token หมดอายุ (24 ชม.) API จะ return 401
- แต่ frontend ไม่มี axios interceptor ดัก response 401
- ผู้ใช้จะเห็นหน้าว่างหรือ error แทนที่จะถูก logout อัตโนมัติ

**สิ่งที่ต้องทำ:**
- เพิ่ม response interceptor ใน `services/api.ts`
- ถ้าได้ 401 → ล้าง localStorage + redirect ไป Home + แสดง "กรุณาเข้าสู่ระบบอีกครั้ง"

---

### 3. 🟡 "จดจำฉัน" checkbox ไม่ทำงานจริง

- `LoginModal.tsx` มี `remember` state แต่ไม่ได้ใช้ที่ไหนเลย
- token ถูกเก็บ localStorage เสมอไม่ว่าจะติ๊กหรือไม่

**สิ่งที่ต้องทำ (เลือกอย่างใดอย่างหนึ่ง):**
- ถ้าติ๊ก → เก็บ localStorage (ปิดแท็บยังอยู่) / ถ้าไม่ติ๊ก → เก็บ sessionStorage (ปิดแท็บหาย)
- หรือลบ checkbox ออกถ้ายังไม่พร้อมทำ อย่าแสดง UI ที่ไม่ทำงาน

---

### 4. 🟡 authService.getMe() ยังเรียกไม่ได้

- `authService.ts` มี method `getMe()` ที่เรียก `GET /auth/me`
- แต่ Backend ยังไม่มี endpoint นี้ (อยู่ใน Backend Feedback แล้ว)
- ตอนนี้ `AuthContext` ใช้ localStorage อย่างเดียวตอนโหลดแอป — ควรเรียก `getMe()` เพื่อ verify token ด้วย

**สิ่งที่ต้องทำ:** หลัง Backend เพิ่ม `/auth/me` แล้ว → ให้ `AuthContext` เรียก `getMe()` ตอน `useEffect` เพื่อ verify token

---

## 🔴 หน้า Booking — ต้องเชื่อมกับ Backend ให้เสร็จภายในพฤหัส 26 ก.พ. 17:00

ตอนนี้หน้า Booking (`/booking/:tourId`) มี UI แล้วแต่ยังไม่ได้เชื่อมกับ API จริง

### สิ่งที่ต้องทำ

- สร้าง `bookingService.ts` ใน `services/`
  - `createBooking(scheduleId, paxCount)` → POST /bookings
  - `getMyBookings()` → GET /bookings/my
- หน้า Booking → กดปุ่ม "จอง" แล้วเรียก `createBooking()` จริง
  - ส่ง `scheduleId` + `paxCount` ไปที่ Backend
  - แสดงผลสำเร็จ → redirect ไป My Bookings
  - แสดง error ถ้าจองไม่ได้ (เช่น เต็ม, ไม่ได้ login)
- หน้า My Bookings → เรียก `getMyBookings()` แสดงรายการจองจริงจาก database
  - แสดง: ชื่อทัวร์, วันที่, จำนวนคน, ราคารวม, สถานะ

### ตัวชี้วัด

- กดจองบนหน้าเว็บ → database มี row ใหม่จริง
- หน้า My Bookings แสดงรายการที่เพิ่งจองได้

---

## 💡 ข้อสังเกตเพิ่มเติม

- **API interceptor** — ควรเพิ่ม `Authorization: Bearer <token>` header ใน axios instance (ถ้ายังไม่ได้ทำ)
- **Error Boundary** — ยังไม่มี global error boundary ถ้า component crash จะเห็นหน้าขาว