# 9Tours Single Machine Deployment

คู่มือนี้ใช้สำหรับ deploy โปรเจกต์บนเครื่องเดียวด้วย Docker Compose โดยให้ `Nginx + Frontend`, `Backend`, และ `PostgreSQL` รันอยู่ในเครื่องเดียวกัน

## 1. เตรียมค่า environment

คัดลอกไฟล์ตัวอย่าง:

```bash
cp .env.example .env
```

ค่าที่ต้องแก้ก่อน deploy จริง:

- `JWT_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGINS`
- `BACKEND_PUBLIC_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` ถ้าใช้ Google login
- ค่า SMTP และ EasySlip/Slip2Go ถ้าระบบคุณใช้งานจริง

ถ้า deploy บน EC2 แล้วเข้าเว็บด้วย IP เช่น `http://3.0.0.10`

- `FRONTEND_URL=http://3.0.0.10`
- `CORS_ORIGINS=http://3.0.0.10`
- `BACKEND_PUBLIC_URL=http://3.0.0.10/api`
- `GOOGLE_CALLBACK_URL=http://3.0.0.10/api/auth/google/callback`

## 2. Build และเปิดระบบ

```bash
docker compose up --build -d
```

เปิดเว็บ:

- frontend: `http://<server-ip>`
- backend ผ่าน nginx proxy: `http://<server-ip>/api`

## 3. สร้างตารางฐานข้อมูลครั้งแรก

หลังจาก backend container ขึ้นแล้ว ให้รัน:

```bash
docker compose exec backend npm run db:bootstrap
docker compose exec backend npm run seed:tours
```

ถ้า seed ไปแล้วและไม่ต้องการข้อมูลซ้ำ ให้ข้าม `seed:tours`

## 4. ตรวจสอบระบบ

เช็กสถานะ container:

```bash
docker compose ps
```

ดู log:

```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f db
```

## 5. สิ่งที่ควรทดสอบก่อนส่งงาน

1. หน้าแรกโหลดได้
2. ดึงรายการทัวร์ได้
3. สมัครสมาชิกและล็อกอินปกติได้
4. Google login ใช้ได้ ถ้าตั้งค่าไว้
5. จองทัวร์และอัปโหลดสลิปได้
6. แอดมินเข้า dashboard ได้
7. รีสตาร์ต container แล้วข้อมูลยังอยู่

## 6. หมายเหตุ

- backend uploads ถูกเก็บใน Docker volume ชื่อ `backend_uploads`
- PostgreSQL เก็บใน Docker volume ชื่อ `postgres_data`
- ถ้าจะใช้โดเมนจริงและ HTTPS ค่อยต่อยอดไป reverse proxy ภายนอกหรือ multi-machine หลังส่งงาน
