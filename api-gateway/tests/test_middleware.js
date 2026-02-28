import { jest } from '@jest/globals';
import { protect, authorize } from '../src/middleware/authMiddleware.js';
import { tokenService } from '../src/services/tokenService.js';
import Admin from '../src/models/Admin.js';
import { connectDB, closeDB, clearDB } from './setup_db.js';

beforeAll(async () => await connectDB());
afterAll(async () => await closeDB());
afterEach(async () => await clearDB());

describe('Auth Middleware Tests', () => {
    let req, res, next;

    beforeEach(() => {
        req = { headers: {} };
        res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        next = jest.fn();
        jest.clearAllMocks();
    });

    it('protect() blocks missing tokens', async () => {
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ success: false, error: 'Not authorized to access this route, no token provided' });
    });

    it('protect() verifies token and injects req.admin', async () => {
        // Build real admin
        const admin = new Admin({ email: 'admin_mid@dna.local', passwordHash: 'pw', role: 'Clerk' });
        await admin.save();

        // Generate real token
        const token = tokenService.generateToken(admin._id, admin.email, admin.role);
        req.headers.authorization = `Bearer ${token}`;

        await protect(req, res, next);

        expect(next).toHaveBeenCalled();
        expect(req.admin.id).toBe(admin.id);
    });

    it('authorize() handles roles actively', () => {
        req.admin = { role: 'HOD' };

        const middleware = authorize('HOD', 'SuperAdmin');
        middleware(req, res, next);
        expect(next).toHaveBeenCalled();

        const denied_middleware = authorize('SuperAdmin');
        denied_middleware(req, res, next);
        expect(res.status).toHaveBeenCalledWith(403);
    });

    it('protect() block without correct prefixes', async () => {
        req.headers.authorization = 'test_token';
        await protect(req, res, next);
        expect(res.status).toHaveBeenCalledWith(401);
    });
});
