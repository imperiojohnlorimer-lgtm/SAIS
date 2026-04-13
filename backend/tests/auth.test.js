import request from 'supertest';
import app from '../server.js';

describe('Auth API - Register', () => {

  test('should return 400 if name, email, password are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Name, email, and password are required');
  });

  test('should return 400 if password is less than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test', email: 'test@gmail.com', password: '123' });
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Password must be at least 6 characters long');
  });

});

describe('Auth API - Login', () => {

  test('should return 400 if email and password are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});
    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Email and password are required');
  });

  test('should return 401 for invalid email or password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notexist@gmail.com', password: 'wrongpass' });
    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Invalid email or password');
  });

});
