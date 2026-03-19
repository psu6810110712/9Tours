# Storage Service Refactoring - Summary

## ✅ สิ่งที่ทำเสร็จแล้ว

### 1. สร้าง Abstraction Layer
- **storage.interface.ts** - Abstract class สำหรับ storage operations
- **storage.module.ts** - Module ที่เลือก implementation ตาม `STORAGE_TYPE`

### 2. Implement Storage Services
- **local-storage.service.ts** - จัดการไฟล์บน local disk
- **s3-storage.service.ts** - จัดการไฟล์บน AWS S3

### 3. Refactor Existing Code
- ✅ **payments.controller.ts** - ใช้ memory storage + StorageService
- ✅ **payments.service.ts** - รับ buffer แทน file path
- ✅ **tours.controller.ts** - ใช้ memory storage + StorageService
- ✅ **slip-file.utils.ts** - validate จาก buffer
- ✅ **easyslip.service.ts** - รับ buffer แทน file path
- ✅ **app.module.ts** - เพิ่ม StorageModule

### 4. Configuration
- ✅ อัปเดต `.env.example` พร้อม S3 configuration
- ✅ สร้างเอกสาร `STORAGE_SERVICE_GUIDE.md`

## 📦 Installation Required

```bash
cd backend
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## ⚙️ Configuration

### Development (Local Storage)
```env
STORAGE_TYPE=local
UPLOADS_ROOT=./uploads
BACKEND_PUBLIC_URL=http://localhost:3000
```

### Production (AWS S3)
```env
STORAGE_TYPE=s3
AWS_S3_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=wJalr...
AWS_CLOUDFRONT_DOMAIN=cdn.yoursite.com  # Optional
```

## 🎯 Key Features

### 1. Automatic Provider Selection
```typescript
// StorageModule เลือก provider อัตโนมัติตาม STORAGE_TYPE
@Global()
@Module({
  providers: [{
    provide: StorageService,
    useFactory: (configService: ConfigService) => {
      if (configService.get('STORAGE_TYPE') === 's3') {
        return new S3StorageService(configService);
      }
      return new LocalStorageService(configService);
    },
    inject: [ConfigService],
  }],
  exports: [StorageService],
})
export class StorageModule {}
```

### 2. Memory-based Upload
```typescript
// ไฟล์จะถูกเก็บใน memory ก่อน แล้วจึง upload ไปยัง storage
FileInterceptor('file', { storage: 'memory' })
```

### 3. Unified Interface
```typescript
// ทั้ง Local และ S3 ใช้ interface เดียวกัน
interface StorageService {
  uploadFile(options: UploadFileOptions): Promise<UploadResult>;
  deleteFile(options: DeleteFileOptions): Promise<void>;
  getFile(options: GetFileOptions): Promise<GetFileResult>;
  fileExists(storedPath: string): Promise<boolean>;
  buildPublicUrl(storedPath: string): string;
}
```

## 📊 Benefits

### Security
- ✅ ไม่มี file path traversal vulnerabilities
- ✅ Buffer validation ก่อน upload
- ✅ IAM-based access control (S3)

### Scalability
- ✅ รองรับ CDN (CloudFront)
- ✅ No disk space limitations
- ✅ Auto-scaling with S3

### Development Experience
- ✅ ใช้ Local storage ใน dev environment
- ✅ Switch to S3 ด้วยการเปลี่ยน env variable เดียว
- ✅ Same code works for both

## 🔄 Migration Path

### จาก Local ไป S3
1. Backup local files
2. Upload ไปยัง S3
3. เปลี่ยน `STORAGE_TYPE=s3`
4. Restart application

### จาก S3 กลับ Local (สำหรับ testing)
1. Sync S3 files down
2. เปลี่ยน `STORAGE_TYPE=local`
3. Restart application

## 📝 Usage Examples

### Upload File
```typescript
const uploadResult = await this.storageService.uploadFile({
  buffer: file.buffer,
  originalName: file.originalname,
  mimetype: file.mimetype,
  folder: 'slips',
});
```

### Delete File
```typescript
await this.storageService.deleteFile({
  storedPath: 'slips/12345.jpg',
});
```

### Serve File
```typescript
const fileResult = await this.storageService.getFile({
  storedPath: 'slips/12345.jpg',
});

if (fileResult.localPath) {
  res.sendFile(fileResult.localPath);  // Local
} else if (fileResult.buffer) {
  res.send(fileResult.buffer);  // S3
}
```

## 🧪 Testing

### Test Local Storage
```bash
STORAGE_TYPE=local npm run start:dev
```

### Test S3 Storage
```bash
STORAGE_TYPE=s3 npm run start:dev
```

## ⚠️ Important Notes

1. **Install Dependencies**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Database Migration** (optional)
   - ถ้า stored paths ใน DB เป็น full path (`uploads/slips/12345.jpg`)
   - อาจต้องเปลี่ยนเป็น relative path (`slips/12345.jpg`)

3. **AWS Credentials**
   - ใช้ IAM roles ใน production (EC2, ECS)
   - ใช้ credentials ใน .env เฉพาะ development

4. **CloudFront Setup** (optional)
   - ตั้งค่า CloudFront distribution
   - เพิ่ม `AWS_CLOUDFRONT_DOMAIN` ใน .env
   - จะใช้ CDN URL แทน direct S3 URL

## 🚀 Next Steps

1. ติดตั้ง AWS SDK packages
2. Test กับ local storage
3. Setup AWS S3 bucket และ IAM user
4. Test กับ S3 storage
5. Deploy to staging/production

## 📚 Documentation

อ่านเพิ่มเติมใน `backend/STORAGE_SERVICE_GUIDE.md`
