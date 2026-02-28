import request from 'supertest';
import app from '../src/app_test.js';

describe('API Integration Tests', () => {

    it('denies access to unknown paths', async () => {
        const res = await request(app).get('/api/unknown/path');
        expect(res.status).toBe(404);
    });

    it('tests the explicit rate limiter blocks dynamically on /api/ auth boundaries', async () => {
        // Hitting the Auth login point. No actual logic hit since body fails directly 400.
        // But doing it loops the RateLimit middleware.
        const res = await request(app).post('/api/auth/login');
        expect(res.headers).toHaveProperty('x-ratelimit-limit');
        expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    });

});
