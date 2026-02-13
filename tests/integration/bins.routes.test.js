const request = require('supertest');
const app = require('../../src/index');
const db = require('../../src/db/database');
const bcrypt = require('bcrypt');

describe('Bins API Integration Tests', () => {
  let authToken;
  let adminToken;
  let collectorToken;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash('testpass123', 10);
    
    await db.query(`TRUNCATE TABLE measurements, bins, users RESTART IDENTITY CASCADE`);
    
    await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      ['admin@test.com', passwordHash, 'admin']
    );
    await db.query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)`,
      ['collector@test.com', passwordHash, 'collector']
    );
    await db.query(
      `INSERT INTO bins (bin_code, latitude, longitude, waste_type, capacity_liters, current_fill_level) 
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['BIN001', 48.8566, 2.3522, 'recyclable', 500, 45]
    );
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('Authentication', () => {
    it('should login with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'testpass123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBeDefined();
      adminToken = res.body.data.accessToken;
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  describe('Bins Routes', () => {
    it('should get all bins without auth (public)', async () => {
      const res = await request(app).get('/api/bins');

      expect(res.status).toBe(401);
    });

    it('should get all bins with auth', async () => {
      const res = await request(app)
        .get('/api/bins')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should create a bin with admin role', async () => {
      const res = await request(app)
        .post('/api/bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bin_code: 'BIN002',
          latitude: 48.8606,
          longitude: 2.3376,
          waste_type: 'organic',
          capacity_liters: 300,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.bin_code).toBe('BIN002');
    });

    it('should reject bin creation with invalid data', async () => {
      const res = await request(app)
        .post('/api/bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bin_code: 'BI',
          latitude: 200,
          waste_type: 'invalid',
        });

      expect(res.status).toBe(400);
    });

    it('should reject bin creation with collector role', async () => {
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'collector@test.com', password: 'testpass123' });
      
      collectorToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .post('/api/bins')
        .set('Authorization', `Bearer ${collectorToken}`)
        .send({
          bin_code: 'BIN003',
          latitude: 48.8584,
          longitude: 2.2945,
          waste_type: 'residual',
          capacity_liters: 400,
        });

      expect(res.status).toBe(403);
    });

    it('should get bin by id', async () => {
      const res = await request(app)
        .get('/api/bins/1')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(1);
    });

    it('should return 404 for non-existent bin', async () => {
      const res = await request(app)
        .get('/api/bins/99999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });

    it('should update a bin', async () => {
      const res = await request(app)
        .put('/api/bins/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ current_fill_level: 60 });

      expect(res.status).toBe(200);
      expect(parseFloat(res.body.data.current_fill_level)).toBe(60);
    });

    it('should delete a bin with admin role', async () => {
      await request(app)
        .post('/api/bins')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          bin_code: 'BIN_DELETE',
          latitude: 48.8584,
          longitude: 2.2945,
          waste_type: 'residual',
          capacity_liters: 400,
        });

      const res = await request(app)
        .delete('/api/bins/2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
    });

    it('should reject delete with non-admin role', async () => {
      const res = await request(app)
        .delete('/api/bins/1')
        .set('Authorization', `Bearer ${collectorToken}`);

      expect(res.status).toBe(403);
    });

    it('should get bin stats', async () => {
      const res = await request(app)
        .get('/api/bins/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.total_bins).toBeDefined();
    });

    it('should get critical bins', async () => {
      const res = await request(app)
        .get('/api/bins/critical?threshold=40')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('Health Checks', () => {
    it('should return health status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should return database health status', async () => {
      const res = await request(app).get('/health/db');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
    });

    it('should return redis health status', async () => {
      const res = await request(app).get('/health/redis');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.redis).toBe('connected');
    });
  });
});
