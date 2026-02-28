import request from 'supertest';
import app from '../src/app_test.js';
import Certificate from '../src/models/Certificate.js';
import { connectDB, closeDB, clearDB } from './setup_db.js';
import { jest } from '@jest/globals';
import { pythonService } from '../src/services/pythonService.js';
import Admin from '../src/models/Admin.js';
import mongoose from 'mongoose';

jest.mock('../src/utils/logger.js', () => ({
    logger: { info: jest.fn(), error: jest.fn(), warn: jest.fn() },
    auditLog: jest.fn()
}));

// We only mock python engine
jest.unstable_mockModule('../src/services/pythonService.js', () => ({
    pythonService: {
        encryptCertificate: jest.fn(),
        decryptCertificate: jest.fn()
    }
}));

let token = '';
let adminId = '';

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => await closeDB());
beforeEach(async () => {
    await clearDB();
    const admin = new Admin({ email: 'admin@dna.local', passwordHash: 'pw', role: 'SuperAdmin', department: 'CS' });
    await admin.save();
    const res = await request(app).post('/api/auth/login').send({ email: 'admin@dna.local', password: 'pw' });
    token = res.body.token;
    adminId = res.body.admin.id;
});

describe('Certificate native tests', () => {

    it('issues a certificate using valid token', async () => {
        // Mongoose and Supertest natively handling everything
        const reqPayload = { name: 'John', roll: '123', degree: 'BS', cgpa: 3.9, year: 2026 };

        // Manual override for python service since ESM mock behavior was unstable
        const cryptoMock = jest.spyOn(pythonService, 'encryptCertificate').mockResolvedValueOnce({
            dna_payload: 'ATCG'.repeat(30),
            chaotic_seed: '0.1'
        });

        const res = await request(app)
            .post('/api/certificates')
            .set('Authorization', `Bearer ${token}`)
            .send(reqPayload);

        expect(res.status).toBe(201);
        expect(res.body.public_id).toBeDefined();

        cryptoMock.mockRestore();
    });

    it('verifies existing certificates correctly', async () => {
        const cert = new Certificate({
            public_id: '1234567890',
            dna_payload: 'ATCG'.repeat(30),
            chaotic_seed: '0.1',
            issued_by: new mongoose.Types.ObjectId()
        });
        await cert.save();

        const cryptoMock = jest.spyOn(pythonService, 'decryptCertificate').mockResolvedValueOnce({ name: 'John' });

        const res = await request(app).get('/api/certificates/verify/1234567890');
        expect(res.status).toBe(200);
        expect(res.body.data.name).toBe('John');

        cryptoMock.mockRestore();
        cryptoMock.mockRestore();
    });

    it('fetches admin certificates cleanly without DNA payload', async () => {
        const cert = new Certificate({
            public_id: '9876543210',
            dna_payload: 'ATCG'.repeat(30),
            chaotic_seed: '0.1',
            issued_by: adminId
        });
        await cert.save();

        const res = await request(app).get('/api/certificates').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);
        expect(res.body.certificates.length).toBeGreaterThan(0);
        expect(res.body.certificates[0].dna_payload).toBeUndefined();
    });

    it('revokes certificate successfully', async () => {
        const cert = new Certificate({
            public_id: 'revoke_123',
            dna_payload: 'ATCG'.repeat(30),
            chaotic_seed: '0.1',
            issued_by: adminId
        });
        await cert.save();

        const res = await request(app).put('/api/certificates/revoke_123/revoke').set('Authorization', `Bearer ${token}`);
        expect(res.status).toBe(200);

        const verificationRes = await request(app).get('/api/certificates/verify/revoke_123');
        expect(verificationRes.status).toBe(403);
        expect(verificationRes.body.error).toBe('REVOKED');
    });

});
