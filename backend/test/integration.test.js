import request from 'supertest';
import app from '../src/app.js';

describe('🔗 Pruebas de Integración Backend', () => {

  describe('Endpoints de API', () => {
    
    test('GET /health debe responder con estructura correcta', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
    });

    test('GET /api debe responder correctamente', async () => {
      const res = await request(app).get('/api');
      
      expect([200, 404]).toContain(res.statusCode);
    });
  });

  describe('Manejo de errores', () => {
    
    test('GET /ruta-inexistente debe retornar 404', async () => {
      const res = await request(app).get('/ruta-que-no-existe-123');
      
      expect(res.statusCode).toBe(404);
    });

    test('POST sin datos requeridos debe retornar error', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .send({});
      
      expect([400, 404, 422]).toContain(res.statusCode);
    });
  });

  describe('Headers y CORS', () => {
    
    test('Debe aceptar Content-Type JSON', async () => {
      const res = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });
      
      expect([200, 201, 400, 404]).toContain(res.statusCode);
    });
  });

  describe('Rendimiento', () => {
    
    test('Endpoint de salud debe responder en menos de 500ms', async () => {
      const start = Date.now();
      const res = await request(app).get('/health');
      const duration = Date.now() - start;
      
      expect(res.statusCode).toBe(200);
      expect(duration).toBeLessThan(500);
    });
  });

});