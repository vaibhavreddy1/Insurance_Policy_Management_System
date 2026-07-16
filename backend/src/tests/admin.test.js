/**
 * Admin API Integration Tests
 * Tests agent CRUD operations and role-based access control
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

let adminCookie;
let agentCookie;
let testAgent;

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  // Create admin and get cookie
  await User.create({
    name: 'Test Admin',
    email: 'admin@test.com',
    password: 'Admin@12345',
    role: 'admin',
  });
  const adminLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'Admin@12345' });
  adminCookie = adminLogin.headers['set-cookie'][0];

  // Create agent and get cookie for role-blocking tests
  testAgent = await User.create({
    name: 'Test Agent',
    email: 'agent@test.com',
    password: 'Agent@12345',
    role: 'agent',
    agentCode: 'AGT00001',
  });
  const agentLogin = await request(app)
    .post('/api/auth/login')
    .send({ email: 'agent@test.com', password: 'Agent@12345' });
  agentCookie = agentLogin.headers['set-cookie'][0];
});

const validAgentPayload = {
  name: 'New Agent',
  email: 'newagent@hdfclife.com',
  password: 'NewAgent@1234',
  phone: '9876543210',
};

describe('POST /api/admin/agents — Create Agent', () => {
  it('should create an agent successfully when called by admin', async () => {
    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', adminCookie)
      .send(validAgentPayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.agent.role).toBe('agent');
    expect(res.body.data.agent.email).toBe('newagent@hdfclife.com');
    expect(res.body.data.agent.agentCode).toMatch(/^AGT\d{5}$/);
    expect(res.body.data.agent.password).toBeUndefined();
  });

  it('should return 403 if an agent tries to create another agent', async () => {
    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', agentCookie)
      .send(validAgentPayload);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 if not authenticated', async () => {
    const res = await request(app)
      .post('/api/admin/agents')
      .send(validAgentPayload);

    expect(res.status).toBe(401);
  });

  it('should return 409 if email already exists', async () => {
    // Create first agent
    await request(app)
      .post('/api/admin/agents')
      .set('Cookie', adminCookie)
      .send(validAgentPayload);

    // Attempt duplicate
    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', adminCookie)
      .send(validAgentPayload);

    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('email');
  });

  it('should return 422 if name is missing', async () => {
    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', adminCookie)
      .send({ ...validAgentPayload, name: '' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('name');
  });

  it('should return 422 if password is too weak', async () => {
    const res = await request(app)
      .post('/api/admin/agents')
      .set('Cookie', adminCookie)
      .send({ ...validAgentPayload, password: 'weakpwd' });

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('password');
  });
});

describe('GET /api/admin/agents — List Agents', () => {
  it('should return paginated list of agents for admin', async () => {
    // Create 3 agents
    for (let i = 1; i <= 3; i++) {
      await User.create({
        name: `Agent ${i}`,
        email: `agent${i}@test.com`,
        password: 'Agent@12345',
        role: 'agent',
        agentCode: `AGT0000${i + 1}`,
      });
    }

    const res = await request(app)
      .get('/api/admin/agents?page=1&limit=10')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.data.agents.length).toBeGreaterThanOrEqual(3);
    expect(res.body.data.pagination).toBeDefined();
    expect(res.body.data.pagination.total).toBeGreaterThanOrEqual(3);
  });

  it('should filter agents by active status', async () => {
    const res = await request(app)
      .get('/api/admin/agents?status=active')
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    res.body.data.agents.forEach((a) => expect(a.isActive).toBe(true));
  });

  it('should return 403 for agent role', async () => {
    const res = await request(app)
      .get('/api/admin/agents')
      .set('Cookie', agentCookie);

    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/admin/agents/:id — Soft-Delete Agent', () => {
  it('should deactivate an agent (soft-delete)', async () => {
    const res = await request(app)
      .delete(`/api/admin/agents/${testAgent._id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify in DB
    const updated = await User.findById(testAgent._id);
    expect(updated.isActive).toBe(false);
    expect(updated.deactivatedAt).toBeDefined();
  });

  it('should return 409 if trying to deactivate an already inactive agent', async () => {
    // Deactivate first
    await User.findByIdAndUpdate(testAgent._id, { isActive: false });

    const res = await request(app)
      .delete(`/api/admin/agents/${testAgent._id}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(409);
  });

  it('should return 404 if agent ID does not exist', async () => {
    const fakeId = '64a0000000000000000000aa';
    const res = await request(app)
      .delete(`/api/admin/agents/${fakeId}`)
      .set('Cookie', adminCookie);

    expect(res.status).toBe(404);
  });

  it('should prevent deactivated agent from logging in', async () => {
    await request(app)
      .delete(`/api/admin/agents/${testAgent._id}`)
      .set('Cookie', adminCookie);

    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'agent@test.com', password: 'Agent@12345' });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.code).toBe('ACCOUNT_DEACTIVATED');
  });
});
