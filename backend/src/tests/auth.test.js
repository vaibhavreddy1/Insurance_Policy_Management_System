/**
 * Auth API Integration Tests
 * Tests login, logout, and session behavior using supertest
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_for_unit_tests_only';
process.env.JWT_EXPIRES_IN = '15m';
process.env.COOKIE_NAME = 'hdfc_test_token';
process.env.COOKIE_SECURE = 'false';
process.env.COOKIE_SAMESITE = 'lax';

const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const { connect, closeDatabase, clearDatabase } = require('./setup');

beforeAll(async () => {
  await connect();
});

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});

describe('Auth API — POST /api/auth/login', () => {
  let adminUser;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'Admin@12345',
      role: 'admin',
    });
  });

  it('should return 200 and set cookie on valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@12345' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.role).toBe('admin');
    expect(res.body.data.user.email).toBe('admin@test.com');
    // Cookie should be set
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieHeader = res.headers['set-cookie'][0];
    expect(cookieHeader).toContain('hdfc_test_token');
    expect(cookieHeader).toContain('HttpOnly');
  });

  it('should return 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'WrongPassword' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  it('should return 401 on non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'notfound@test.com', password: 'Admin@12345' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 422 when email is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: 'Admin@12345' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('should return 422 when password is missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('password');
  });

  it('should return 422 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'not-an-email', password: 'Admin@12345' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('should return 403 for deactivated account', async () => {
    await User.findByIdAndUpdate(adminUser._id, { isActive: false });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'Admin@12345' });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe('ACCOUNT_DEACTIVATED');
  });
});

describe('Auth API — POST /api/auth/logout', () => {
  it('should return 200 and clear cookie on logout', async () => {
    await User.create({
      name: 'Logout Test',
      email: 'logout@test.com',
      password: 'Admin@12345',
      role: 'admin',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'logout@test.com', password: 'Admin@12345' });

    const cookie = loginRes.headers['set-cookie'][0];

    const logoutRes = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', cookie);

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.success).toBe(true);

    // Cookie should be cleared (expired)
    const setCookie = logoutRes.headers['set-cookie'][0];
    expect(setCookie).toMatch(/expires=Thu, 01 Jan 1970/i);
  });

  it('should return 401 if trying to logout without a session', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(401);
  });
});

describe('Auth API — GET /api/auth/me', () => {
  it('should return current user profile when authenticated', async () => {
    await User.create({
      name: 'Me Test',
      email: 'me@test.com',
      password: 'Admin@12345',
      role: 'admin',
    });

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'me@test.com', password: 'Admin@12345' });

    const cookie = loginRes.headers['set-cookie'][0];

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', cookie);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.user.email).toBe('me@test.com');
    expect(meRes.body.data.user.password).toBeUndefined();
  });
});
