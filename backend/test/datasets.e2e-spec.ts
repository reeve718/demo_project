/**
 * End-to-end smoke test for the catalogue endpoints.
 *
 * NOTE: These tests assume a running PostGIS instance populated with the
 * synthetic seed data. Run via:
 *
 *   docker compose up -d db
 *   npm --prefix backend run test:e2e
 *
 * They are not auto-executed by `npm test` because that targets the
 * faster unit suite (`src/**.spec.ts`).
 */
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';

import { AllExceptionsFilter } from '../src/common/all-exceptions.filter';
import { AppModule } from '../src/app.module';

describe('Datasets e2e', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns 200', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body.data.status).toBe('ok');
  });

  it('GET /api/v1/datasets returns data and pagination metadata', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/datasets').expect(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toMatchObject({ page: 1, pageSize: 10 });
    expect(typeof res.body.meta.total).toBe('number');
  });

  it('GET /api/v1/datasets/:slug returns 404 for nonexistent dataset', async () => {
    await request(app.getHttpServer()).get('/api/v1/datasets/no-such-slug').expect(404);
  });

  it('GET /api/v1/datasets/:slug/features returns 400 for invalid bbox', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/datasets/flood-risk-zones/features?minLon=200&minLat=22.2&maxLon=114.3&maxLat=22.4')
      .expect(400);
  });

  it('GET /api/v1/datasets/:slug/features returns GeoJSON FeatureCollection for valid bbox', async () => {
    const res = await request(app.getHttpServer())
      .get(
        '/api/v1/datasets/flood-risk-zones/features?minLon=114.05&minLat=22.20&maxLon=114.35&maxLat=22.45',
      )
      .expect(200);
    expect(res.body.data.type).toBe('FeatureCollection');
    expect(Array.isArray(res.body.data.features)).toBe(true);
  });
});