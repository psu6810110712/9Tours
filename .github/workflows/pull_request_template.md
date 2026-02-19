## 📝 ประเภทการเปลี่ยนแปลง (Type of Change)
- [ ] ✨ feat: เพิ่มฟีเจอร์ใหม่
- [ ] 🐛 fix: แก้ไขบั๊ก
- [ ] 📄 docs: อัปเดตเอกสาร
- [ ] ♻️ refactor: แก้ไขโครงสร้างโค้ด (ไม่เพิ่มฟีเจอร์)
- [ ] ⚡ chore: งานจิปาถะ (ลง library, แก้ config)

## 🔍 รายละเอียด (Description)
- 

## ✅ Checklist ก่อนส่งงาน
1. Git & Standards (มาตรฐาน Git)
- [ ] Branch Name: ตั้งชื่อ Branch ตามรูปแบบ feature/ชื่อฟีเจอร์ หรือ fix/จุดที่แก้

- [ ] Conventional Commits: ข้อความ Commit ขึ้นต้นด้วย feat:, fix:, docs:, หรือ chore: ตามความเหมาะสม

- [ ] CI Status: ระบบ 9Tours-CI (test-and-build) ต้องขึ้นเครื่องหมายถูกสีเขียว ✅ (Build ผ่าน)

2. Database & Schema (ฐานข้อมูล)
- [ ] ER Diagram Sync: โค้ดที่เขียน (TypeORM Entities) ต้องตรงตาม ER Diagram ที่ตกลงกันไว้ (เช่น Table tours, bookings, payments)

- [ ] Data Types: กำหนดประเภทข้อมูลถูกต้อง (เช่น decimal สำหรับราคาทัวร์, enum สำหรับสถานะการจอง)

- [ ] Relations: เชื่อมต่อความสัมพันธ์ (ManyToOne, OneToMany) ระหว่าง Table ถูกต้องตาม Logic

3. Backend & Logic (ระบบหลังบ้าน)
- [ ] Error Handling: มีการดัก Error พื้นฐาน (เช่น ถ้าหาทัวร์ไม่เจอต้องคืน 404 ไม่ใช่ปล่อยให้ระบบค้าง)

- [ ] Status Logic: การเปลี่ยนสถานะ Booking (เช่น จาก pending ไป awaiting_approval) เป็นไปตาม Flow ที่คุยกัน

- [ ] No Secrets: ตรวจสอบว่าไม่ได้เผลอใส่รหัสผ่าน หรือไฟล์ .env ติดมาในโค้ด

4. Frontend & UI (หน้าบ้าน)
- [ ] Console Logs: ลบ console.log() ที่ใช้ Debug ออกหมดแล้ว

- [ ] Responsive: หน้าจอที่ทำเบื้องต้นดูรู้เรื่อง ไม่แตกกระจาย

- [ ] API Connection: เชื่อมต่อกับ Backend ผ่าน URL ที่กำหนดไว้ใน Environment variable

5. Documentation (เอกสาร)
- [ ] Docs Updated: หากมีการเพิ่ม API ใหม่ หรือแก้ Table ให้ไปอัปเดตไฟล์ในโฟลเดอร์ documentation/ ด้วย
