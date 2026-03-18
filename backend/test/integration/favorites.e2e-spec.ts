import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';

/**
 * E2E test stub for /favorites endpoints.
 *
 * These tests require a running Postgres instance with seeded data.
 * Run with:  npm run test:e2e -- --testPathPattern=favorites
 *
 * TODO: seed a customer user + active tour before each run, or use
 *       a transaction-wrapped test harness.
 */
describe('Favorites (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /favorites', () => {
    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .get('/favorites')
        .expect(401);
    });
  });

  describe('POST /favorites/:tourId', () => {
    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/favorites/1')
        .expect(401);
    });
  });

  describe('DELETE /favorites/:tourId', () => {
    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .delete('/favorites/1')
        .expect(401);
    });
  });
});
