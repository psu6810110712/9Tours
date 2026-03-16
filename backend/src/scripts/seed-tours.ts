import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { ToursService } from '../tours/tours.service';

function hasFlag(flag: string) {
  return process.argv.includes(flag);
}

async function seedTours() {
  process.env.ENABLE_TOUR_JSON_IMPORT = 'false';

  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const toursService = app.get(ToursService);
    const result = await toursService.importToursFromJson({
      reset: hasFlag('--reset'),
      force: hasFlag('--force'),
    });

    console.log(`Imported ${result.importedTours} tours from tours-data.json.`);
  } finally {
    await app.close();
  }
}

seedTours().catch((error) => {
  console.error('Tour seed failed.', error);
  process.exitCode = 1;
});
