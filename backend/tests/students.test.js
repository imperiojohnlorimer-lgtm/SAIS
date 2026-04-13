import request from 'supertest';
import app from '../server.js';

describe('Students API', () => {

  test('should return 401 if no token is provided', async () => {
    const res = await request(app)
      .get('/api/students');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 401 if token is invalid', async () => {
    const res = await request(app)
      .get('/api/students')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
