import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { ValidationPipe } from '@nestjs/common'; // 1. อิมพอร์ต ValidationPipe

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  });

  // เปิดใช้งาน ValidationPipe ทั่วทั้งแอป
  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  //โค้ดสำหรับเปิดใช้งานโฟลเดอร์ uploads
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`🚀 Backend is running on port: ${process.env.PORT ?? 3000}`);
}
bootstrap();