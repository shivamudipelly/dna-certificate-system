import request from 'supertest';
import app from '../src/app_test.js';
import Admin from '../src/models/Admin.js';
import { connectDB, closeDB, clearDB } from './setup_db.js';
import { jest } from '@jest/globals';

jest.mock('../src/utils/logger.js', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
    auditLog: jest.fn()
}));

beforeAll(async () => await connectDB());
afterAll(async () => await closeDB());
afterEach(async () => await clearDB());

describe('Auth Controller Integration', () => {
    it('denies login without email', async () => {
        const res = await request(app).post('/api/auth/login').send({ password: 'pw' });
        expect(res.status).toBe(400);
    });

    it('denies login on invalid user target', async () => {
        const res = await request(app).post('/api/auth/login').send({ email: 'test@dna.local', password: 'pw' });
        expect(res.status).toBe(401);
    });

    it('successfully logs in and issues JWT', async () => {
        // Create an admin
        const admin = new Admin({
            email: 'admin@dna.local',
            passwordHash: 'password123',
            role: 'SuperAdmin',
            department: 'CS'
        });
        await admin.save();

        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'admin@dna.local', password: 'password123' });

        expect(res.status).toBe(200);
        expect(res.body.token).toBeDefined();

        // Assert invalid password natively too
        const badRes = await request(app).post('/api/auth/login').send({ email: 'admin@dna.local', password: 'wrong' });
        expect(badRes.status).toBe(401);
    });
});
