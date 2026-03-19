# Storage Service Guide

## Overview

โปรเจกต์นี้รองรับ 2 รูปแบบการจัดเก็บไฟล์:
1. **Local Storage** - เก็บไฟล์บน disk ของ server (เหมาะสำหรับ development)
2. **AWS S3** - เก็บไฟล์บน AWS S3 bucket (แนะนำสำหรับ production)

## Architecture

### Storage Service Interface
ทุก storage implementation ต้อง implement `StorageService` abstract class:
- `uploadFile()` - อัปโหลดไฟล์
- `deleteFile()` - ลบไฟล์
- `getFile()` - ดึงไฟล์สำหรับ serve
- `fileExists()` - ตรวจสอบว่าไฟล์มีอยู่หรือไม่
- `buildPublicUrl()` - สร้าง public URL

### Implementations
1. **LocalStorageService** - จัดการไฟล์บน local disk
2. **S3StorageService** - จัดการไฟล์บน AWS S3

## Configuration

### Local Storage (Default)

```env
STORAGE_TYPE=local
UPLOADS_ROOT=./uploads
BACKEND_PUBLIC_URL=http://localhost:3000
```

- ไฟล์จะถูกเก็บใน `uploads/` directory
- Public URL: `http://localhost:3000/uploads/{filename}`
- เหมาะสำหรับ: Development, Testing, Small-scale applications

### AWS S3 Storage

```env
STORAGE_TYPE=s3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_CLOUDFRONT_DOMAIN=d111111abcdef8.cloudfront.net  # Optional
```

- ไฟล์จะถูกอัปโหลดไปยัง S3 bucket
- Public URL: S3 URL หรือ CloudFront URL (ถ้ามี)
- เหมาะสำหรับ: Production, Scalable applications

## AWS S3 Setup Guide

### 1. สร้าง S3 Bucket

```bash
# Using AWS CLI
aws s3 mb s3://your-bucket-name --region us-east-1
```

หรือผ่าน AWS Console:
1. ไปที่ S3 Console
2. คลิก "Create bucket"
3. ตั้งชื่อ bucket และเลือก region
4. ปิด "Block all public access" (ถ้าต้องการให้ไฟล์เป็น public)
5. สร้าง bucket

### 2. ตั้งค่า Bucket Policy สำหรับ Public Read

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### 3. สร้าง IAM User และ Access Key

1. ไปที่ IAM Console
2. สร้าง User ใหม่สำหรับ application
3. Attach policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    }
  ]
}
```

4. สร้าง Access Key และเก็บ `ACCESS_KEY_ID` และ `SECRET_ACCESS_KEY`

### 4. (Optional) ตั้งค่า CloudFront CDN

1. ไปที่ CloudFront Console
2. สร้าง Distribution ใหม่
3. ตั้ง Origin เป็น S3 bucket
4. เลือก Origin Access Identity (OAI)
5. Update bucket policy ให้ CloudFront เข้าถึงได้
6. นำ CloudFront Domain มาใส่ใน `AWS_CLOUDFRONT_DOMAIN`

### 5. ติดตั้ง Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Usage

### ใช้งานผ่าน Controller

```typescript
import { StorageService } from '../common/storage.interface';

@Controller('files')
export class FilesController {
  constructor(private readonly storageService: StorageService) {}

  @Post('upload')
  async upload(@UploadedFile() file: Express.Multer.File) {
    const result = await this.storageService.uploadFile({
      buffer: file.buffer,
      originalName: file.originalname,
      mimetype: file.mimetype,
      folder: 'uploads',
    });

    return { url: result.publicUrl };
  }
}
```

### ลบไฟล์

```typescript
await this.storageService.deleteFile({
  storedPath: 'slips/12345.jpg',
});
```

### ดึงไฟล์สำหรับ Serve

```typescript
const fileResult = await this.storageService.getFile({
  storedPath: 'slips/12345.jpg',
});

// Local storage
if (fileResult.localPath) {
  res.sendFile(fileResult.localPath);
}

// S3 storage
if (fileResult.buffer) {
  res.setHeader('Content-Type', fileResult.contentType);
  res.send(fileResult.buffer);
}
```

## Migration from Local to S3

### ขั้นตอนการ Migrate

1. **Backup ไฟล์ Local**
   ```bash
   tar -czf uploads-backup.tar.gz uploads/
   ```

2. **อัปโหลดไฟล์ไปยัง S3**
   ```bash
   aws s3 sync ./uploads s3://your-bucket-name/ --region us-east-1
   ```

3. **อัปเดต Environment Variables**
   ```env
   STORAGE_TYPE=s3
   AWS_S3_REGION=us-east-1
   AWS_S3_BUCKET_NAME=your-bucket-name
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```

4. **Update Database Records** (ถ้าจำเป็น)
   - เปลี่ยน stored path จาก `uploads/slips/12345.jpg` → `slips/12345.jpg`
   - หรือเก็บ full path ไว้และปรับ logic ใน service

5. **Restart Application**
   ```bash
   npm run start:prod
   ```

6. **ทดสอบ**
   - ทดสอบการอัปโหลดไฟล์ใหม่
   - ทดสอบการดาวน์โหลดไฟล์เก่า
   - ทดสอบการลบไฟล์

## Best Practices

### Security
- ใช้ IAM roles แทน hardcoded credentials (ใน production)
- ตั้งค่า bucket policy อย่างระมัดระวัง
- ใช้ pre-signed URLs สำหรับไฟล์ private
- Enable versioning สำหรับ critical files

### Performance
- ใช้ CloudFront CDN สำหรับ static files
- ตั้ง Cache-Control headers
- Compress images ก่อน upload
- ใช้ S3 lifecycle policies สำหรับ archiving

### Cost Optimization
- ใช้ S3 Intelligent-Tiering
- ตั้ง lifecycle rules ลบไฟล์ชั่วคราว
- Monitor storage usage
- ใช้ CloudFront เพื่อลด data transfer cost

## Troubleshooting

### Error: Access Denied
- ตรวจสอบ IAM permissions
- ตรวจสอบ bucket policy
- ตรวจสอบ CORS configuration

### Error: File not found
- ตรวจสอบ storedPath ใน database
- ตรวจสอบว่าไฟล์มีอยู่ใน S3
- ตรวจสอบ region configuration

### Slow Upload/Download
- ใช้ CloudFront CDN
- เช็ค network latency
- เช็ค S3 region (ควรใกล้ server)

## File Structure

```
backend/src/
  common/
    storage.interface.ts        # Abstract interface
    storage.module.ts           # Module with conditional provider
    local-storage.service.ts    # Local implementation
    s3-storage.service.ts       # S3 implementation
    upload-paths.ts             # Helper functions
```

## Environment Switching

### Development
```env
STORAGE_TYPE=local
```

### Staging
```env
STORAGE_TYPE=s3
AWS_S3_BUCKET_NAME=staging-bucket
```

### Production
```env
STORAGE_TYPE=s3
AWS_S3_BUCKET_NAME=production-bucket
AWS_CLOUDFRONT_DOMAIN=cdn.yoursite.com
```

## Additional Features

### S3 Pre-signed URLs
สำหรับไฟล์ที่ต้องการ temporary access:

```typescript
const signedUrl = await s3StorageService.getSignedUrl(
  'private/document.pdf',
  3600 // expires in 1 hour
);
```

### File Validation
- Max file size: 5MB (slips), 10MB (tour images)
- Allowed formats: JPG, PNG, GIF, WebP
- Image dimension validation (for slips)

## Support

สำหรับคำถามหรือปัญหา กรุณาติดต่อทีมพัฒนา
