### ER Diagram — รายการแก้ไขให้ตรงกับ Code

> วันที่: 25 ก.พ. 2026  
> อ้างอิงจาก: Entity files ใน `backend/src/`

---

## 1. ตาราง `users` ✅

- [x] แก้ `id` จาก integer เป็น **UUID (varchar)** เพราะใน code ใช้ `@PrimaryGeneratedColumn('uuid')`
- [x] เปลี่ยน `full_name` เป็น `name` เพราะใน code ใช้ชื่อ `name`
- [x] เพิ่ม `updated_at` (timestamp) เพราะใน code มี `@UpdateDateColumn()`

---

## 2. ตาราง `tours` ✅

- [x] เปลี่ยน `title` เป็น `name` เพราะใน code ใช้ชื่อ `name`
- [x] เปลี่ยน `price_per_person` เป็น `price` (decimal 10,2) เพราะใน code ใช้ชื่อ `price`
- [x] เปลี่ยน `image_url` (varchar, 1 รูป) เป็น `images` (jsonb, array หลายรูป) เพราะใน code เก็บรูปภาพเป็น array
- [x] เปลี่ยน `is_visible` เป็น `isActive` (boolean, default: true) เพราะใน code ใช้ชื่อ `isActive`
- [x] เพิ่ม `tour_type` — enum(`one_day`, `package`) เพราะใน code แยกประเภททัวร์วันเดียวกับแพ็กเกจ
- [x] เพิ่ม `original_price` — decimal(10,2), nullable เพราะใช้เก็บราคาก่อนลดเพื่อแสดงส่วนลด
- [x] เพิ่ม `highlights` — jsonb เพราะใช้เก็บจุดเด่นของทัวร์เป็น array
- [x] เพิ่ม `itinerary` — jsonb เพราะใช้เก็บกำหนดการ `[{time, title, description}]`
- [x] เพิ่ม `transportation` — varchar, nullable เพราะใช้ระบุยานพาหนะ
- [x] เพิ่ม `duration` — varchar เพราะใช้ระบุระยะเวลาทัวร์
- [x] เพิ่ม `accommodation` — varchar, nullable เพราะใช้ระบุที่พักสำหรับทัวร์แบบ package
- [x] เพิ่ม `rating` — float (default: 0) เพราะใช้เก็บคะแนนรีวิวเฉลี่ย
- [x] เพิ่ม `review_count` — integer (default: 0) เพราะใช้เก็บจำนวนรีวิว
- [x] เพิ่ม `categories` — jsonb เพราะใช้เก็บหมวดหมู่ย่อยเป็น array of string
- [x] เพิ่ม `updated_at` — timestamp เพราะใน code มี `@UpdateDateColumn()`

---

## 3. ตาราง `tour_schedules` ✅

- [x] เปลี่ยน `travel_date` เป็น `start_date` (date) เพราะใน code ใช้ชื่อ `startDate`
- [x] เพิ่ม `end_date` (date) เพราะใน code มีฟิลด์ `endDate` สำหรับรองรับทัวร์หลายวัน
- [x] เปลี่ยน `total_capacity` เป็น `max_capacity` (integer) เพราะใน code ใช้ชื่อ `maxCapacity`
- [x] เปลี่ยน `available_seats` เป็น `current_booked` (integer, default: 0) เพราะใน code เก็บเป็น "จำนวนที่จองแล้ว" แทน "จำนวนที่เหลือ"
- [x] เพิ่ม `time_slot` — varchar, nullable เพราะใช้ระบุรอบเวลา เช่น รอบเช้า/รอบบ่าย
- [x] เพิ่ม `round_name` — varchar, nullable เพราะใช้ตั้งชื่อรอบสำหรับทัวร์ที่มีหลายรอบต่อวัน

---

## 4. Relationship Lines ที่ต้องเพิ่ม/แก้ไข ✅

- [x] เพิ่มเส้น `tours` → `festivals` (FK: `festival_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- [x] เพิ่มเส้น `tours` → `tour_categories` (FK: `category_id`, N:1) เพราะใน Diagram เส้นไม่ชัดเจน
- [x] เพิ่มเส้น `tour_views` → `users` (FK: `user_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- [x] เพิ่มเส้น `tour_views` → `tours` (FK: `tour_id`, N:1) เพราะใน code มี relation แต่ใน Diagram ไม่มีเส้นเชื่อม
- [x] แก้เส้น `provinces` → `regions` (FK: `region_id`, N:1) ให้ชัดเจนขึ้น เพราะเส้นปัจจุบันจางมาก
- [x] ทุกเส้นควรมี **crow's foot notation** ระบุ cardinality (1:N) ให้ชัดเจน

---

### ข้อมูลที่ยังขาดและควรเก็บเพิ่มถ้าจะทำ Recomendation

- **เวลาที่อยู่ในหน้าทัวร์** (dwell time) — อยู่นานแปลว่าสนใจ
- **การ scroll ดูรูปภาพ/itinerary** — ดูลึกแค่ไหน
- **Wishlist / Favorite** — ทัวร์ที่กดบันทึก (ยังไม่มีฟีเจอร์นี้)
- **Search queries** — คำค้นหา
- **Ratings/Reviews จากผู้ใช้** — มี rating กับ reviewCount แต่ยังไม่มีตาราง reviews จริง