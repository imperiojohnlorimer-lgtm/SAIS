import request from 'supertest';
import app from '../server.js';

describe('Tasks API', () => {

  test('should return 401 if no token is provided for get tasks', async () => {
    const res = await request(app)
      .get('/api/tasks');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 401 if no token is provided for create task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'Test Task', description: 'Test Description', assignedTo: '123', dueDate: '2025-12-01' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('should return 401 if no token is provided for delete task', async () => {
    const res = await request(app)
      .delete('/api/tasks/123');
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

});
