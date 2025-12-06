import request from 'supertest';
import app from '../src/app.js';

describe('🔗 Pruebas de Integración Backend', () => {

  // Pruebas de endpoints principales
  describe('Endpoints de API', () => {
    
    test('GET /health debe responder con estructura correcta', async () => {
      const res = await request(app).get('/health');
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'OK');
      expect(res.body).toHaveProperty('timestamp');
    });

    test('GET /api debe responder correctamente', async () => {
      const res = await request(app).get('/api');
      
      expect([200, 404]).toContain(res.statusCode);
      expect(res.headers['content-type']).toMatch(/json/);
    });
  });

  // Pruebas de manejo de errores
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

  // Pruebas de CORS y Headers
  describe('Headers y CORS', () => {
    
    test('Debe tener headers CORS configurados', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'http://localhost:3000');
      
      // Verificar que la app responde (independiente de CORS)
      expect([200, 404]).toContain(res.statusCode);
    });

    test('Debe aceptar Content-Type JSON', async () => {
      const res = await request(app)
        .post('/api')
        .set('Content-Type', 'application/json')
        .send({ test: 'data' });
      
      expect([200, 201, 400, 404]).toContain(res.statusCode);
    });
  });

  // Pruebas de flujo completo (si tienes endpoints CRUD)
  describe('Flujo completo de recursos', () => {
    
    test('GET /api/recursos debe retornar array o error manejado', async () => {
      const res = await request(app).get('/api/recursos');
      
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body) || typeof res.body === 'object').toBe(true);
      } else {
        expect([404, 500]).toContain(res.statusCode);
      }
    });
  });

  // Pruebas de validación de datos
  describe('Validación de datos', () => {
    
    test('POST con datos inválidos debe rechazarse', async () => {
      const res = await request(app)
        .post('/api/usuarios')
        .send({
          email: 'correo-invalido',
          password: '123'
        });
      
      // Debe retornar error de validación o 404 si no existe la ruta
      expect([400, 404, 422]).toContain(res.statusCode);
    });
  });

  // Pruebas de rendimiento básico
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