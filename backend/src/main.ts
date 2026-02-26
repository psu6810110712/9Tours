import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common'; // 1. อิมพอร์ต ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 2. เพิ่มคำสั่งนี้เพื่อเปิดใช้ Validation ทั้งโปรเจกต์
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // สั่งให้ลบข้อมูลที่ไม่ได้อยู่ใน DTO ทิ้งไปโดยอัตโนมัติ
  }));

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();