import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import type { Request, Response } from 'express';
import { ensureDirectoryExistsSync, getUploadsRoot } from './common/upload-paths';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const uploadsRoot = ensureDirectoryExistsSync(getUploadsRoot());

  if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
  }

  app.use(cookieParser());

  const configuredOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim()).filter(Boolean)
    : ['http://localhost:5173', 'http://127.0.0.1:5173'];

  app.enableCors({
    origin: configuredOrigins,
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Block direct access to uploaded slips. They must go through the protected payments endpoint.
  app.use('/uploads/slips', (_req: Request, res: Response) => {
    res.status(403).json({ message: 'Direct slip access is disabled' });
  });

  app.useStaticAssets(uploadsRoot, {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Backend is running on port: ${process.env.PORT ?? 3000}`);
}

bootstrap();
