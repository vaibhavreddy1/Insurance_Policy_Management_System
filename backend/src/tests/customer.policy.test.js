/**
 * Customer & Policy API Integration Tests
 * Tests all business rules, ownership isolation, and PII masking
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

let agent1Cookie, agent2Cookie, adminCookie;
let agent1, agent2;

// Helper: future date
const futureDate = (daysFromNow = 30) => {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0];
};

// Helper: valid customer payload
const makeCustomerPayload = (overrides = {}) => ({
  firstName: 'Ravi',
  lastName: 'Kumar',
  dateOfBirth: '1990-06-15',
  gender: 'Male',
  email: 'ravi.kumar@example.com',
  mobile: '9876543210',
  aadhaar: '123456789012',
  pan: 'ABCDE1234F',
  address: {
    line1: '123 MG Road',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560001',
  },
  nominee: {
    name: 'Priya Kumar',
    relationship: 'Spouse',
    dateOfBirth: '1992-08-20',
  },
  ...overrides,
});

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await closeDatabase();
});

beforeEach(async () => {
  await clearDatabase();

  agent1 = await User.create({
    name: 'Agent One', email: 'agent1@test.com',
    password: 'Agent@12345', role: 'agent', agentCode: 'AGT00001',
  });
  agent2 = await User.create({
    name: 'Agent Two', email: 'agent2@test.com',
    password: 'Agent@12345', role: 'agent', agentCode: 'AGT00002',
  });
  await User.create({
    name: 'Admin', email: 'admin@test.com',
    password: 'Admin@12345', role: 'admin',
  });

  // Sequential logins (avoid parallel bcrypt bottleneck)
  const r1 = await request(app).post('/api/auth/login').send({ email: 'agent1@test.com', password: 'Agent@12345' });
  const r2 = await request(app).post('/api/auth/login').send({ email: 'agent2@test.com', password: 'Agent@12345' });
  const r3 = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'Admin@12345' });

  if (!r1.headers['set-cookie']) throw new Error(`Agent1 login failed: ${JSON.stringify(r1.body)}`);
  if (!r2.headers['set-cookie']) throw new Error(`Agent2 login failed: ${JSON.stringify(r2.body)}`);
  if (!r3.headers['set-cookie']) throw new Error(`Admin login failed: ${JSON.stringify(r3.body)}`);

  agent1Cookie = r1.headers['set-cookie'][0];
  agent2Cookie = r2.headers['set-cookie'][0];
  adminCookie = r3.headers['set-cookie'][0];
});

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOMER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/customers — Create Customer', () => {
  it('should create a customer and return masked PII', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload());

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.customer.aadhaar).toBe('XXXX-XXXX-9012');
    expect(res.body.data.customer.pan).toBe('ABCXX12XXF');
    expect(res.body.data.customer.mobile).toBe('98XXXXXX10');
  });

  it('should return 403 if admin tries to create a customer', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', adminCookie)
      .send(makeCustomerPayload());

    expect(res.status).toBe(403);
  });

  // Business Rule #1: Age 18-65
  it('should reject customer under 18 years old', async () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 17);
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ dateOfBirth: dob.toISOString().split('T')[0] }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('dateOfBirth');
  });

  it('should reject customer over 65 years old', async () => {
    const dob = new Date();
    dob.setFullYear(dob.getFullYear() - 66);
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ dateOfBirth: dob.toISOString().split('T')[0] }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('dateOfBirth');
  });

  // Business Rule #3: Nominee != Policyholder
  it('should reject if nominee name matches customer full name', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({
        nominee: { name: 'Ravi Kumar', relationship: 'Spouse', dateOfBirth: '1995-01-01' },
      }));

    expect(res.status).toBe(422);
    expect(res.body.errors['nominee.name']).toMatch(/cannot be the same/i);
  });

  // Business Rule #4: Mobile validation
  it('should reject mobile starting with 5', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ mobile: '5876543210' }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('mobile');
  });

  it('should reject mobile with less than 10 digits', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ mobile: '987654' }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('mobile');
  });

  // Business Rule #5: Aadhaar = 12 digits
  it('should reject Aadhaar with less than 12 digits', async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ aadhaar: '12345678' }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('aadhaar');
  });

  // Business Rule #10: PAN uniqueness
  it('should reject duplicate PAN across customers', async () => {
    await request(app).post('/api/customers').set('Cookie', agent1Cookie).send(makeCustomerPayload());

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ aadhaar: '999988887777', email: 'other@test.com' }));

    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('pan');
  });

  // Business Rule #10: Aadhaar uniqueness
  it('should reject duplicate Aadhaar across customers', async () => {
    await request(app).post('/api/customers').set('Cookie', agent1Cookie).send(makeCustomerPayload());

    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({ pan: 'PQRST5678Z', email: 'other2@test.com' }));

    expect(res.status).toBe(409);
    expect(res.body.errors).toHaveProperty('aadhaar');
  });
});

describe('Customer Ownership Isolation', () => {
  let customer;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload());
    expect(res.status).toBe(201);
    customer = res.body.data.customer;
  });

  it('Agent 1 can view their own customer', async () => {
    const res = await request(app).get(`/api/customers/${customer._id}`).set('Cookie', agent1Cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.customer._id).toBe(customer._id);
  });

  it('Agent 2 CANNOT view Agent 1\'s customer', async () => {
    const res = await request(app).get(`/api/customers/${customer._id}`).set('Cookie', agent2Cookie);
    expect(res.status).toBe(404);
  });

  it('Agent 2 CANNOT update Agent 1\'s customer', async () => {
    const res = await request(app)
      .put(`/api/customers/${customer._id}`)
      .set('Cookie', agent2Cookie)
      .send({ email: 'hacked@evil.com' });
    expect(res.status).toBe(404);
  });
});

describe('GET /api/customers/search', () => {
  beforeEach(async () => {
    const res = await request(app).post('/api/customers').set('Cookie', agent1Cookie).send(makeCustomerPayload());
    expect(res.status).toBe(201);
  });

  it('should return matching customers with masked PII', async () => {
    const res = await request(app).get('/api/customers/search?q=Ravi').set('Cookie', agent1Cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.customers.length).toBeGreaterThan(0);
    expect(res.body.data.customers[0].aadhaar).toMatch(/^XXXX-XXXX-\d{4}$/);
    expect(res.body.data.customers[0].mobile).toMatch(/^\d{2}XXXXXX\d{2}$/);
  });

  it('should return 400 if query is less than 2 chars', async () => {
    const res = await request(app).get('/api/customers/search?q=R').set('Cookie', agent1Cookie);
    expect(res.status).toBe(400);
  });

  it('should NOT return other agents\' customers in search results', async () => {
    const res = await request(app).get('/api/customers/search?q=Ravi').set('Cookie', agent2Cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.customers.length).toBe(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// POLICY TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('POST /api/policies/issue — Issue Policy', () => {
  let customer;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload());
    expect(res.status).toBe(201);
    customer = res.body.data.customer;
  });

  const makePolicyPayload = (customerId, overrides = {}) => ({
    customerId,
    planName: 'HDFC Life Click 2 Protect',
    policyType: 'Term Life',
    sumAssured: 5000000,
    premium: 12000,
    premiumFrequency: 'Yearly',
    policyTerm: 20,
    startDate: futureDate(1),
    ...overrides,
  });

  it('should issue a policy with a valid policy number', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(customer._id));

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.policy.policyNumber).toMatch(/^HDFC-\d{8}-\d{5}$/);
    expect(res.body.data.policy.agentId).toBeDefined();
  });

  // Business Rule #8: Min premium ₹5,000
  it('should reject premium below ₹5,000', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(customer._id, { premium: 3000 }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('premium');
  });

  // Business Rule #9: Start date not in past
  it('should reject a start date in the past', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(customer._id, { startDate: '2020-01-01' }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('startDate');
  });

  // Business Rule #6: Policy term restricted values
  it('should reject invalid policy term (e.g., 12 years)', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(customer._id, { policyTerm: 12 }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('policyTerm');
  });

  // Business Rule #7: Premium frequency
  it('should reject invalid premium frequency', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(customer._id, { premiumFrequency: 'Weekly' }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('premiumFrequency');
  });

  // Business Rule #2: PAN mandatory if premium > ₹50,000
  it('should reject premium > ₹50,000 when customer has no PAN', async () => {
    // Create a second customer without PAN
    const noPanRes = await request(app)
      .post('/api/customers')
      .set('Cookie', agent1Cookie)
      .send(makeCustomerPayload({
        aadhaar: '999988887766',
        email: 'nopan@test.com',
        mobile: '7011112222',
        pan: null,
        nominee: { name: 'Nominee Test Person', relationship: 'Child', dateOfBirth: '2000-01-01' },
      }));

    expect(noPanRes.status).toBe(201);

    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent1Cookie)
      .send(makePolicyPayload(noPanRes.body.data.customer._id, { premium: 60000 }));

    expect(res.status).toBe(422);
    expect(res.body.errors).toHaveProperty('pan');
  });

  // Ownership isolation
  it('should prevent agent 2 from issuing policy for agent 1\'s customer', async () => {
    const res = await request(app)
      .post('/api/policies/issue')
      .set('Cookie', agent2Cookie)
      .send(makePolicyPayload(customer._id));

    expect(res.status).toBe(404);
  });
});

describe('GET /api/policies/customer/:customerId', () => {
  it('should return all policies for a customer owned by the agent', async () => {
    const custRes = await request(app).post('/api/customers').set('Cookie', agent1Cookie).send(makeCustomerPayload());
    expect(custRes.status).toBe(201);
    const cust = custRes.body.data.customer;

    const polRes = await request(app).post('/api/policies/issue').set('Cookie', agent1Cookie).send({
      customerId: cust._id,
      planName: 'Test Plan',
      policyType: 'Term Life',
      sumAssured: 1000000,
      premium: 8000,
      premiumFrequency: 'Yearly',
      policyTerm: 20,
      startDate: futureDate(1),
    });
    expect(polRes.status).toBe(201);

    const res = await request(app).get(`/api/policies/customer/${cust._id}`).set('Cookie', agent1Cookie);
    expect(res.status).toBe(200);
    expect(res.body.data.policies.length).toBe(1);
  });

  it('should return 404 for agent 2 viewing agent 1\'s customer policies', async () => {
    const custRes = await request(app).post('/api/customers').set('Cookie', agent1Cookie).send(makeCustomerPayload());
    expect(custRes.status).toBe(201);

    const res = await request(app)
      .get(`/api/policies/customer/${custRes.body.data.customer._id}`)
      .set('Cookie', agent2Cookie);

    expect(res.status).toBe(404);
  });
});
