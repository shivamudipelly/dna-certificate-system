import express from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, getProfile, getAllUsers, deleteUser, editUser } from '../controllers/authController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Route Protection Rate Limiter (Brute Force Security)
const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: 'Maximum login attempts exceeded. Please try again in 1 minute.' },
    standardHeaders: true,
    legacyHeaders: false
});

// Login endpoint
router.post('/login', loginRateLimiter, login);

// Register — SuperAdmin only
router.post('/register', protect, authorize('SuperAdmin'), register);

// Profile
router.get('/profile', protect, getProfile);

// SuperAdmin Only: List all users
router.get('/users', protect, authorize('SuperAdmin'), getAllUsers);

// SuperAdmin Only: Edit a user's role/department
router.put('/users/:id', protect, authorize('SuperAdmin'), editUser);

// SuperAdmin Only: Delete a specific user
router.delete('/users/:id', protect, authorize('SuperAdmin'), deleteUser);

export default router;
