import request from 'supertest';
import app from '../src/app.js';

describe('Pruebas básicas del backend', () => {

  test('GET /health debe responder 200 y status OK', async () => {
    const res = await request(app).get('/health');

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });

  test('GET /api debe responder algo (200, 404 o como esté configurado)', async () => {
    const res = await request(app).get('/api');

    expect([200, 404]).toContain(res.statusCode);
  });

});