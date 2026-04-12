import express from 'express';
import { body } from 'express-validator';
import rateLimit from 'express-rate-limit';
import {
    issueCertificate,
    verifyCertificate,
    getAdminCertificates,
    revokeCertificate,
    reissueCertificate
} from '../controllers/certificateController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkExistingRegistry } from '../middleware/checkExisting.js';
const router = express.Router();

// Route Protection Rate Limiter (Public Scraper Protection)
// Maximum 100 verification attempts per IP per minute
const verifyRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many verification attempts from this IP, please try again after a minute' },
    standardHeaders: true,
    legacyHeaders: false
});

// XSS Sanitization & Input Validation Rule Matrix
const certificateValidators = [
    body('name').trim().notEmpty().escape().withMessage('Name is required and must not contain executable symbols'),
    body('roll').trim().notEmpty().escape().withMessage('Roll number is required'),
    body('degree').trim().notEmpty().escape().withMessage('Degree is required'),
    body('department').trim().notEmpty().escape().withMessage('Department is required'),
    body('cgpa').trim().notEmpty().escape().isFloat({ min: 0, max: 10 }).withMessage('CGPA must be a standard float between 0 and 10'),
    body('year').trim().notEmpty().escape().isInt({ min: 1990, max: 2100 }).withMessage('Must be a valid graduation year range')
];


/**
 * 🔒 PROTECTED AUTHENTICATED ROUTES
 */

// POST /api/certificates - Only HOD & SuperAdmin can issue certificates (Clerks are strictly view-only).
router.post('/', protect, authorize('HOD', 'SuperAdmin'), certificateValidators, checkExistingRegistry, issueCertificate);

// GET /api/certificates - Current Admin lists only their certificates
router.get('/', protect, getAdminCertificates);

// PUT /api/certificates/:public_id/revoke - SuperAdmin ONLY override module
router.put('/:public_id/revoke', protect, authorize('SuperAdmin'), revokeCertificate);

// PUT /api/certificates/:public_id/reissue - Restore tampered/fix records
router.put('/:public_id/reissue', protect, authorize('HOD', 'SuperAdmin'), reissueCertificate);

/**
 * 🔓 PUBLIC ROUTES
 */

// GET /api/certificates/verify/:public_id
router.get('/verify/:public_id', verifyRateLimiter, verifyCertificate);

export default router;
