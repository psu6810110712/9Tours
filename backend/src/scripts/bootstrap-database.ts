import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';

async function bootstrapDatabase() {
  process.env.DB_SYNCHRONIZE = process.env.DB_SYNCHRONIZE || 'true';
  process.env.ENABLE_TOUR_JSON_IMPORT = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    console.log('Database bootstrap completed successfully.');
  } finally {
    await app.close();
  }
}

bootstrapDatabase().catch((error) => {
  console.error('Database bootstrap failed.', error);
  process.exitCode = 1;
});
