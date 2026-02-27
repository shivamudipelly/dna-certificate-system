import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route Protection Rate Limiter (Brute Force Security)
// Maximum 5 attempts per IP per Window length
const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: 'Maximum login attempts exceeded. Please try again in 1 minute.' },
    standardHeaders: true,
    legacyHeaders: false
});

/**
 * 🔓 PUBLIC ROUTES
 */

// Login endpoint (Requires strictly enforced 5 request/minute block algorithm lock)
router.post('/login', loginRateLimiter, login);

/**
 * 🔒 PROTECTED AUTHENTICATED ROUTES
 */

// Temporarily bypassing the authorize('SuperAdmin') block layer per User architecture mapping requirements for Phase 3 to allow database bootsrap.
// router.post('/register', protect, authorize('SuperAdmin'), register); 
router.post('/register', register);

// Retrieve Current Logged In Admin credentials (No Password)
router.get('/profile', protect, getProfile);

export default router;
