import crypto from 'crypto';
import { validationResult } from 'express-validator';
import DraftCertificate from '../models/DraftCertificate.js';
import Certificate from '../models/Certificate.js';

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

const addHistory = (draft, action, req, remarks = null) => {
    draft.history.push({
        action,
        fromStatus: draft.status,
        toStatus: draft.status, // will be updated before save
        actor: {
            id: req.admin._id,
            email: req.admin.email,
            role: req.admin.role
        },
        remarks: remarks || draft.remarks,
        timestamp: new Date()
    });
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
            status: 'Draft',
            history: [{
                action: 'CREATED',
                toStatus: 'Draft',
                actor: { id: req.admin._id, email: req.admin.email, role: req.admin.role },
                timestamp: new Date()
            }]
        });

        auditLog('DRAFT_CREATED', req.id, 201, `Clerk ${req.admin._id} drafted a new certificate ${draft._id} for ${draft.roll}`, req.ip, req.get('User-Agent'));

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
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 50;

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
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        const total = await DraftCertificate.countDocuments(query);

        res.status(200).json({ success: true, drafts, page, total });
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
        addHistory(draft, 'SUBMITTED', req);
        draft.status = 'Submitted';
        draft.remarks = null; // clear current remarks
        draft.history[draft.history.length - 1].toStatus = 'Submitted';
        await draft.save();

        auditLog('DRAFT_SUBMITTED', req.id, 200, `Clerk ${req.admin._id} submitted draft ${draft._id} to HOD for verification`, req.ip, req.get('User-Agent'));

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
        addHistory(draft, 'VERIFIED', req);
        draft.status = 'Verified';
        draft.remarks = null;
        draft.history[draft.history.length - 1].toStatus = 'Verified';
        await draft.save();

        auditLog('DRAFT_VERIFIED', req.id, 200, `HOD ${req.admin._id} verified draft ${draft._id} and forwarded to SuperAdmin`, req.ip, req.get('User-Agent'));

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

        addHistory(draft, 'REVERTED_TO_CLERK', req, remarks);
        draft.status = 'Reverted';
        draft.remarks = remarks;
        draft.history[draft.history.length - 1].toStatus = 'Reverted';
        await draft.save();

        auditLog('DRAFT_REVERTED_CLERK', req.id, 200, `HOD/SuperAdmin ${req.admin._id} reverted draft ${draft._id} to Clerk. Reason: ${remarks}`, req.ip, req.get('User-Agent'));

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

        addHistory(draft, 'REVERTED_TO_HOD', req, remarks);
        draft.status = 'RevertedToHOD';
        draft.remarks = remarks;
        draft.history[draft.history.length - 1].toStatus = 'RevertedToHOD';
        await draft.save();

        auditLog('DRAFT_REVERTED_HOD', req.id, 200, `SuperAdmin ${req.admin._id} reverted draft ${draft._id} to HOD. Reason: ${remarks}`, req.ip, req.get('User-Agent'));

        res.status(200).json({ success: true, draft });
    } catch (error) { next(error); }
};

// PUT /api/drafts/:id/approve - SuperAdmin issues certificate
export const approveDraft = async (req, res, next) => {
    try {
        const draft = await DraftCertificate.findById(req.params.id);
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
        // Optimization: Removing redundant console.logs in production
        const public_id = uuidv4().replace(/-/g, '').substring(0, 10);

        // Compute SHA-256 tamper-proof hash (required by Certificate schema)
        const hashPayloadString = `${certificateData.name}|${certificateData.roll}|${certificateData.degree}|${certificateData.department}|${certificateData.cgpa}|${certificateData.year}`;
        const certificate_hash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

        const verification_url = qrService.getVerificationUrl(public_id);

        // Secure Persistence Mode: Create Certificate but KEEP Draft for history tracking
        const [cert, qr_code] = await Promise.all([
            Certificate.create({
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
                issued_by: req.admin._id,
                history: draft.history // Port over the entire origin story
            }),
            qrService.generateQRCode(verification_url)
        ]);

        // Mark Draft as Issued and link it
        addHistory(draft, 'ISSUED', req);
        draft.status = 'Issued';
        draft.certificateId = cert._id;
        draft.history[draft.history.length - 1].toStatus = 'Issued';
        await draft.save();

        auditLog('DRAFT_APPROVED', req.id, 201, `Draft ${draft._id} approved and encrypted into Certificate ${public_id}`, req.ip, req.get('User-Agent'));

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
