import crypto from 'crypto';
import { validationResult } from 'express-validator';
import DraftCertificate from '../models/DraftCertificate.js';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import { pythonService } from '../services/pythonService.js';
import { qrService } from '../services/qrService.js';
import { auditLog, logger } from '../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const checkValidations = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation Failed', details: errors.array() });
        return false;
    }
    return true;
};

// POST /api/drafts - Clerk creates a new draft
export const createDraft = async (req, res, next) => {
    try {
        if (!checkValidations(req, res)) return;

        // Guard: Clerk MUST have a department assigned in their account
        if (req.admin.role === 'Clerk' && !req.admin.department) {
            return res.status(400).json({
                success: false,
                error: 'Your account has no department assigned. Please contact the SuperAdmin to assign you a department before creating drafts.'
            });
        }

        const draft = await DraftCertificate.create({
            name: req.body.name,
            roll: req.body.roll,
            degree: req.body.degree,
            // SECURITY: If Clerk, force their own department mathematically
            department: req.admin.role === 'Clerk' ? req.admin.department : req.body.department,
            cgpa: req.body.cgpa,
            year: req.body.year,
            createdBy: req.admin._id,
            status: 'Draft'
        });

        await AuditLog.create({
            action: 'DRAFT_CREATED',
            adminId: req.admin._id,
            targetId: draft._id,
            details: `Clerk drafted a new certificate for ${draft.roll}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(201).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id - Clerk edits a draft (only if Draft or Reverted)
export const editDraft = async (req, res, next) => {
    try {
        if (!checkValidations(req, res)) return;
        const draft = await DraftCertificate.findById(req.params.id);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        // Only allow edit if status is Draft or Reverted
        if (!['Draft', 'Reverted'].includes(draft.status)) {
            return res.status(400).json({ success: false, error: 'Cannot edit draft in current status' });
        }

        draft.name = req.body.name;
        draft.roll = req.body.roll;
        draft.degree = req.body.degree;
        // SECURITY: If Clerk, force their own department mathematically; else accept payload
        draft.department = req.admin.role === 'Clerk' ? req.admin.department : req.body.department;
        draft.cgpa = req.body.cgpa;
        draft.year = req.body.year;
        await draft.save();
        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// GET /api/drafts - List drafts conditionally base on roles
export const getDrafts = async (req, res, next) => {
    try {
        let query = {};
        if (req.admin.role === 'Clerk') {
            query = { createdBy: req.admin._id };
        } else if (req.admin.role === 'HOD') {
            query = {
                status: { $in: ['Submitted', 'RevertedToHOD'] },
                department: req.admin.department
            };
        } else if (req.admin.role === 'SuperAdmin') {
            query = { status: 'Verified' };
        }

        const drafts = await DraftCertificate.find(query)
            .populate('createdBy', 'email role')
            .sort({ createdAt: -1 });

        res.status(200).json({ success: true, drafts });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/submit - Clerk submits to HOD
export const submitDraft = async (req, res, next) => {
    try {
        const draft = await DraftCertificate.findById(req.params.id);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
        if (!['Draft', 'Reverted'].includes(draft.status)) {
            return res.status(400).json({ success: false, error: 'Only Draft or Reverted can be submitted' });
        }
        draft.status = 'Submitted';
        draft.remarks = null; // clear remarks
        await draft.save();

        await AuditLog.create({
            action: 'DRAFT_SUBMITTED',
            adminId: req.admin._id,
            targetId: draft._id,
            details: `Clerk submitted draft ${draft._id} to HOD for verification`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/verify - HOD verifies and forwards to Super Admin
export const verifyDraft = async (req, res, next) => {
    try {
        const draft = await DraftCertificate.findById(req.params.id);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });
        // Can verify from Submitted or RevertedToHOD
        if (!['Submitted', 'RevertedToHOD'].includes(draft.status)) {
            return res.status(400).json({ success: false, error: 'Only Submitted or RevertedToHOD drafts can be verified' });
        }

        // HOD Authorization Check: Must match draft's department
        if (req.admin.role === 'HOD' && draft.department !== req.admin.department) {
            return res.status(403).json({ success: false, error: 'Forbidden: You can only verify drafts for your own department' });
        }
        draft.status = 'Verified';
        draft.remarks = null;
        await draft.save();

        await AuditLog.create({
            action: 'DRAFT_VERIFIED',
            adminId: req.admin._id,
            targetId: draft._id,
            details: `HOD verified draft ${draft._id} and forwarded to SuperAdmin`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/revert-clerk - HOD or SuperAdmin reverts to Clerk
export const revertToClerk = async (req, res, next) => {
    try {
        const { remarks } = req.body;
        if (!remarks) return res.status(400).json({ success: false, error: 'Remarks are required for reversion' });
        const draft = await DraftCertificate.findById(req.params.id);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        draft.status = 'Reverted';
        draft.remarks = remarks;

        // HOD Authorization Check: Must match draft's department
        if (req.admin.role === 'HOD' && draft.department !== req.admin.department) {
            return res.status(403).json({ success: false, error: 'Forbidden: You can only revert drafts for your own department' });
        }
        await draft.save();

        await AuditLog.create({
            action: 'DRAFT_REVERTED_CLERK',
            adminId: req.admin._id,
            targetId: draft._id,
            details: `HOD/SuperAdmin reverted draft ${draft._id} to Clerk. Reason: ${remarks}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/revert-hod - SuperAdmin reverts to HOD
export const revertToHOD = async (req, res, next) => {
    try {
        const { remarks } = req.body;
        if (!remarks) return res.status(400).json({ success: false, error: 'Remarks are required for reversion' });
        const draft = await DraftCertificate.findById(req.params.id);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        draft.status = 'RevertedToHOD';
        draft.remarks = remarks;
        await draft.save();

        await AuditLog.create({
            action: 'DRAFT_REVERTED_HOD',
            adminId: req.admin._id,
            targetId: draft._id,
            details: `SuperAdmin reverted draft ${draft._id} to HOD. Reason: ${remarks}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/approve - SuperAdmin issues certificate
export const approveDraft = async (req, res, next) => {
    try {
        const draft = await DraftCertificate.findById(req.params.id);
        console.log(draft);
        if (!draft) return res.status(404).json({ success: false, error: 'Draft not found' });

        if (draft.status !== 'Verified') {
            return res.status(400).json({ success: false, error: 'Only Verified drafts can be issued' });
        }

        const certificateData = {
            name: draft.name,
            roll: draft.roll,
            degree: draft.degree,
            department: draft.department,
            cgpa: draft.cgpa,
            year: draft.year
        };

        logger.info(`[Draft Controller] Approving and passing to Crypto Engine... [ReqID: ${req.id}]`);
        const { dna_payload, chaotic_seed } = await pythonService.encryptCertificate(certificateData);
        console.log('dna payload: ', dna_payload);
        console.log('seed: ', chaotic_seed);
        const public_id = uuidv4().replace(/-/g, '').substring(0, 10);

        // Compute SHA-256 tamper-proof hash (required by Certificate schema)
        const hashPayloadString = `${certificateData.name}|${certificateData.roll}|${certificateData.degree}|${certificateData.department}|${certificateData.cgpa}|${certificateData.year}`;
        const certificate_hash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

        await Certificate.create({
            public_id,
            student_name: certificateData.name,
            roll_number: certificateData.roll,
            department: certificateData.department,
            degree: certificateData.degree,
            cgpa: certificateData.cgpa,
            year: certificateData.year,
            dna_payload,
            chaotic_seed,
            certificate_hash,
            issued_by: req.admin._id
        });

        // SECURE ERASURE: Delete the draft immediately so PII never stays in DB
        await DraftCertificate.findByIdAndDelete(draft._id);

        auditLog('DRAFT_APPROVED', req.id, 201, `Draft ${draft._id} approved and encrypted into Certificate ${public_id}`, req.ip, req.get('User-Agent'));

        await AuditLog.create({
            action: 'DRAFT_APPROVED',
            adminId: req.admin._id,
            targetId: public_id,
            details: `SuperAdmin approved draft ${draft._id} and permanently minted Certificate ${public_id}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        const verification_url = qrService.getVerificationUrl(public_id);
        const qr_code = await qrService.generateQRCode(verification_url);

        res.status(200).json({
            success: true,
            message: 'Draft successfully approved, encrypted, and permanently erased.',
            public_id,
            qr_code,
            verification_url
        });
    } catch (error) {
        next(error);
    }
};
