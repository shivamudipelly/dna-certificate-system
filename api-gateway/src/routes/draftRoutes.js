import express from 'express';
import { body } from 'express-validator';
import {
    createDraft,
    editDraft,
    getDrafts,
    submitDraft,
    verifyDraft,
    revertToClerk,
    revertToHOD,
    approveDraft
} from '../controllers/draftController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { checkExistingRegistry } from '../middleware/checkExisting.js';
const router = express.Router();

// Validation Middleware
const draftValidation = [
    body('name').trim().notEmpty().withMessage('Student name is required'),
    body('roll').trim().notEmpty().withMessage('Roll number is required'),
    body('degree').trim().notEmpty().withMessage('Degree is required'),
    body('department').trim().notEmpty().withMessage('Department is required'),
    body('cgpa').isFloat({ min: 0, max: 10 }).withMessage('Valid CGPA required'),
    body('year').isInt({ min: 1990, max: 2100 }).withMessage('Valid graduation year required')
];

// All routes require authentication
router.use(protect);

// Clerk
router.post('/', authorize('Clerk', 'HOD', 'SuperAdmin'), draftValidation, checkExistingRegistry, createDraft);
router.put('/:id', authorize('Clerk', 'HOD', 'SuperAdmin'), draftValidation, checkExistingRegistry, editDraft);
router.put('/:id/submit', authorize('Clerk', 'HOD', 'SuperAdmin'), submitDraft);

// Get route for everyone (filtered in controller based on role)
router.get('/', getDrafts);

// HOD & SuperAdmin flows
router.put('/:id/verify', authorize('HOD', 'SuperAdmin'), verifyDraft);
router.put('/:id/revert-clerk', authorize('HOD', 'SuperAdmin'), revertToClerk);

// SuperAdmin flows
router.put('/:id/revert-hod', authorize('SuperAdmin'), revertToHOD);
router.put('/:id/approve', authorize('SuperAdmin'), approveDraft);

export default router;
