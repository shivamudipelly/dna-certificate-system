import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Certificate from '../models/Certificate.js';

import { pythonService } from '../services/pythonService.js';
import { qrService } from '../services/qrService.js';
import { validationResult } from 'express-validator';
import { auditLog, logger } from '../utils/logger.js';

const addHistory = (cert, action, req, remarks = null) => {
    cert.history.push({
        action,
        fromStatus: cert.status,
        toStatus: cert.status, // will be updated before save
        actor: {
            id: req.admin._id,
            email: req.admin.email,
            role: req.admin.role
        },
        remarks: remarks || null,
        timestamp: new Date()
    });
};

/**
 * Handle validation errors from express-validator universally
 */
const checkValidations = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation Failed', details: errors.array() });
        return false;
    }

    // Strict Roll Number Validation
    // Format: 22eg105j38 -> 22(year) eg(college) 105(dept/seq) j(section) 38(roll)
    const rollRegex = /^\d{2}[a-z]{2}\d{1,3}[a-z]\d{2,3}$/i;
    if (req.body.roll && !rollRegex.test(req.body.roll)) {
        res.status(400).json({
            success: false,
            error: 'Invalid Roll Number format. Expected format like 22eg105j38.'
        });
        return false;
    }

    return true;
};

export const issueCertificate = async (req, res, next) => {
    try {
        if (!checkValidations(req, res)) return;

        // Combine inputs into a rigid validation object
        const certificateData = {
            name: String(req.body.name),
            roll: String(req.body.roll),
            degree: String(req.body.degree),
            department: String(req.body.department),
            cgpa: Number(req.body.cgpa),
            year: Number(req.body.year)
        };

        // 1. Send purely to Python Engine
        logger.info(`[Cert Controller] Sending payload to Crypto Engine... [ReqID: ${req.id}]`);
        const { dna_payload, chaotic_seed } = await pythonService.encryptCertificate(certificateData);

        // 1.5 Generate standard independent SHA-256 for mathematical validation proof
        const hashPayloadString = `${certificateData.name}|${certificateData.roll}|${certificateData.degree}|${certificateData.department}|${certificateData.cgpa}|${certificateData.year}`;
        const certificate_hash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

        // 2. Build local tracker representations
        const public_id = uuidv4().replace(/-/g, '').substring(0, 10);

        // Check for existing roll number in the SAME department/year (Registry Rule) - Optimized: using mathematically faster .exists()
        const existingCert = await Certificate.exists({
            roll_number: certificateData.roll,
            status: 'active'
        });

        if (existingCert) {
            return res.status(400).json({
                success: false,
                error: `Certificate already exists for Roll Number ${certificateData.roll}`
            });
        }

        // 3. Parallelize DB Tracking and QR Generation to drastically minimize I/O stalling
        const verification_url = qrService.getVerificationUrl(public_id);
        
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
                issued_by: req.admin._id
            }),
            qrService.generateQRCode(verification_url)
        ]);

        auditLog('CERT_ISSUE', req.id, 201, `New Certificate Created: ${public_id} Issuer: ${req.admin._id}`, req.ip, req.get('User-Agent'));

        res.status(201).json({
            success: true,
            public_id: cert.public_id,
            qr_code,
            verification_url
        });

    } catch (error) {
        next(error);
    }
};

export const verifyCertificate = async (req, res, next) => {
    try {
        const { public_id } = req.params;

        // 1. Fast Index lookup on Mongoose Schema String Key - Optimized with lean() memory footprint
        let certificate = await Certificate.findOne({ public_id }).lean();

        if (!certificate) {
            auditLog('CERT_VERIFY_404', req.id, 404, `Lookup Failed - Target Missing: ${public_id}`, req.ip, req.get('User-Agent'));
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        // --- BRAIN FORWARDING LOGIC ---
        // If this record was replaced, follow the chain to the latest active version
        let original_id = null;
        if (certificate.replaced_by) {
            original_id = public_id;
            let current = certificate;
            let depth = 0;
            while (current.replaced_by && depth < 5) { // Prevent circular refs with depth limit
                const successor = await Certificate.findOne({ public_id: current.replaced_by });
                if (!successor) break;
                current = successor;
                depth++;
            }
            logger.info(`[Cert Verify] Forwarding lookup ${public_id} -> ${current.public_id}`);
            certificate = current;
        }

        if (certificate.status === 'revoked') {
            auditLog('CERT_VERIFY_403', req.id, 403, `Revoked Access Blocked: ${public_id}`, req.ip, req.get('User-Agent'));
            return res.status(403).json({ success: false, error: 'REVOKED' });
        }

        // 2. Engage Crypto Engine decoding
        try {
            logger.info(`[Cert Controller] Sending DNA sequence to Crypto Engine for validation... [ReqID: ${req.id}]`);
            const decryptedData = await pythonService.decryptCertificate(
                certificate.dna_payload,
                certificate.chaotic_seed
            );

            // 2.5 Recalculate Hash from Decrypted Data and MATCH
            const hashPayloadString = `${decryptedData.name}|${decryptedData.roll}|${decryptedData.degree}|${decryptedData.department}|${decryptedData.cgpa}|${decryptedData.year}`;
            const recalculatedHash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

            if (recalculatedHash !== certificate.certificate_hash) {
                auditLog('CERT_TAMPERED', req.id, 403, `CRITICAL THREAT Hash Data Tampering Detected! ${public_id}`, req.ip, req.get('User-Agent'));
                return res.status(403).json({ success: false, error: 'TAMPERED' });
            }

            // 3. Mathematical Success -> Update Live Meta Properties without hydrating Mongoose Document
            await Certificate.updateOne(
                { _id: certificate._id },
                {
                    $inc: { verification_count: 1 },
                    $set: { last_verified_at: Date.now() }
                }
            );

            const verification_url = qrService.getVerificationUrl(public_id);
            const qr_code = await qrService.generateQRCode(verification_url);

            auditLog('CERT_VERIFY_SUCCESS', req.id, 200, `Decrypt Clean - Sequence Valid: ${public_id}`, req.ip, req.get('User-Agent'));

            res.status(200).json({
                success: true,
                data: decryptedData,
                verified_at: certificate.last_verified_at,
                qr_code,
                verification_url,
                public_id: certificate.public_id,
                forwarded_from: original_id
            });

        } catch (cryptoError) {
            if (cryptoError.status === 403 && cryptoError.message === 'TAMPERED') {
                auditLog('CERT_TAMPERED', req.id, 403, `CRITICAL THREAT Database Data Tampering Detected! ${public_id}`, req.ip, req.get('User-Agent'));
                return res.status(403).json({ success: false, error: 'TAMPERED' });
            }
            throw cryptoError;
        }

    } catch (error) {
        next(error);
    }
};

export const getAdminCertificates = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 20;
        const query = {};

        const certificates = await Certificate.find(query)
            .select('-dna_payload')
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ issued_at: -1 })
            .lean();

        const total = await Certificate.countDocuments(query);

        res.status(200).json({
            success: true,
            certificates,
            total,
            page
        });
    } catch (error) {
        next(error);
    }
};

export const reissueCertificate = async (req, res, next) => {
    try {
        const { public_id } = req.params;
        const certificate = await Certificate.findOne({ public_id });
        if (!certificate) {
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        // Support Fallbacks to DB values if req.body is partially empty (Automatic Repair Mode)
        const certificateData = {
            name: String(req.body.name || certificate.student_name),
            roll: String(req.body.roll || certificate.roll_number),
            degree: String(req.body.degree || certificate.degree),
            department: String(req.body.department || certificate.department),
            cgpa: Number(req.body.cgpa !== undefined ? req.body.cgpa : certificate.cgpa),
            year: Number(req.body.year || certificate.year)
        };

        logger.info(`[Cert Controller] Re-issuing/Repairing Certificate ${public_id}...`);
        const { dna_payload, chaotic_seed } = await pythonService.encryptCertificate(certificateData);

        const hashPayloadString = `${certificateData.name}|${certificateData.roll}|${certificateData.degree}|${certificateData.department}|${certificateData.cgpa}|${certificateData.year}`;
        const certificate_hash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

        if (req.body.createNewId) {
            // Secure Forwarding Mode: Create a NEW record and link the old one
            const new_public_id = uuidv4().replace(/-/g, '').substring(0, 10);
            const newCert = await Certificate.create({
                public_id: new_public_id,
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

            // Mark old one as forwarded
            addHistory(certificate, 'REPLACED_FORWARDED', req, `Replaced by new ID: ${new_public_id}`);
            certificate.replaced_by = new_public_id;
            certificate.status = 'revoked'; // Old one is formally replaced
            certificate.history[certificate.history.length - 1].toStatus = 'revoked';
            await certificate.save();

            auditLog('CERT_REPLACE', req.id, 201, `Legacy ${public_id} replaced/forwarded to ${new_public_id}`, req.ip, req.get('User-Agent'));

            return res.status(200).json({
                success: true,
                public_id: new_public_id,
                message: 'Certificate replaced and forwarded successfully'
            });
        }

        // Standard Restore Mode: Update in-place
        addHistory(certificate, 'DATA_REPAIR', req, 'In-place data correction performed.');
        certificate.student_name = certificateData.name;
        certificate.roll_number = certificateData.roll;
        certificate.department = certificateData.department;
        certificate.degree = certificateData.degree;
        certificate.cgpa = certificateData.cgpa;
        certificate.year = certificateData.year;
        certificate.dna_payload = dna_payload;
        certificate.chaotic_seed = chaotic_seed;
        certificate.certificate_hash = certificate_hash;
        certificate.status = 'active';
        certificate.history[certificate.history.length - 1].toStatus = 'active';

        await certificate.save();

        auditLog('CERT_REISSUE', req.id, 200, `Fixed/Re-issued Certificate: ${public_id}`, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            public_id: certificate.public_id,
            message: 'Repair successful'
        });

    } catch (error) {
        logger.error(`[Repair Error] ${public_id}: ${error.message}`);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ success: false, error: 'Data validation failed. Check roll no or department format.' });
        }
        next(error);
    }
};

export const revokeCertificate = async (req, res, next) => {
    try {
        const { public_id } = req.params;

        const certificate = await Certificate.findOne({ public_id });
        if (!certificate) {
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        if (certificate.status === 'revoked') {
            return res.status(400).json({ success: false, error: 'Certificate is already revoked' });
        }

        addHistory(certificate, 'REVOKED', req);
        certificate.status = 'revoked';
        certificate.history[certificate.history.length - 1].toStatus = 'revoked';
        await certificate.save();

        auditLog('CERT_REVOKE', req.id, 200, `Administrator ${req.admin._id} actively revoked Certificate ${public_id}`, req.ip, req.get('User-Agent'));

        res.status(200).json({
            success: true,
            message: 'Certificate has been successfully revoked.'
        });

    } catch (error) {
        next(error);
    }
};
