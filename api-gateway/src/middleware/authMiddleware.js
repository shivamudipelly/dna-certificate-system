import { tokenService } from '../services/tokenService.js';
import Admin from '../models/Admin.js';

/**
 * Route protection middleware to verify JWT via Bearer Header
 */
export const protect = async (req, res, next) => {
    try {
        let token;

        // 1. Extract Bearer token
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, error: 'Not authorized to access this route, no token provided' });
        }

        // 2. Mathematically verify Token Integrity & Signature
        const decoded = tokenService.verifyToken(token);

        // 3. Verify user still exists in the Database and is active
        const admin = await Admin.findById(decoded.sub);
        if (!admin || !admin.isActive) {
            return res.status(401).json({ success: false, error: 'The administrator token belongs to no longer exists or is inactive.' });
        }

        // 4. Attach admin object context to Request
        req.admin = admin;
        next();
    } catch (error) {
        console.error(`[Auth Middleware Error] - ${error.message}`);
        return res.status(401).json({ success: false, error: 'Not authorized: ' + error.message });
    }
};

/**
 * Role-Based Access Control (RBAC) abstraction
 * Can pass multiple roles e.g. authorize('SuperAdmin', 'HOD')
 */
export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.admin) {
            return res.status(500).json({ success: false, error: 'Server authentication pipeline error: Missing request object.' });
        }

        if (!roles.includes(req.admin.role)) {
            console.warn(`[RBAC Violation Attempt] User ${req.admin.email} (Role: ${req.admin.role}) attempted to access blocked route.`);
            return res.status(403).json({
                success: false,
                error: `User role '${req.admin.role}' is not authorized to access this resource`
            });
        }
        next();
    };
};
