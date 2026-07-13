import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../app.module';

describe('Albums routes', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('registers the album creation endpoint instead of returning 404', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/albums')
      .send({ title: 'Regression test album' });

    expect(response.status).not.toBe(404);
  });
});
