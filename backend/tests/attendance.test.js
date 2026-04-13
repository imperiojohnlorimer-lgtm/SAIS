import request from 'supertest';
import app from '../server.js';

describe('Attendance API', () => {

  test('should return 401 if no token is provided for get attendance', async () => {
    const res = await request(app)
      .get('/api/attendance');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 401 if no token is provided for clock-in', async () => {
    const res = await request(app)
      .post('/api/attendance/clock-in')
      .send({ studentId: '123', studentName: 'Test', timeIn: '08:00 AM' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 401 if no token is provided for clock-out', async () => {
    const res = await request(app)
      .patch('/api/attendance/123/clock-out')
      .send({ timeOut: '05:00 PM' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
