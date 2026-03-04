import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import Certificate from '../models/Certificate.js';
import AuditLog from '../models/AuditLog.js';
import { pythonService } from '../services/pythonService.js';
import { qrService } from '../services/qrService.js';
import { validationResult } from 'express-validator';
import { auditLog, logger } from '../utils/logger.js';

/**
 * Handle validation errors from express-validator universally
 */
const checkValidations = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ success: false, error: 'Validation Failed', details: errors.array() });
        return false;
    }
    return true;
};

export const issueCertificate = async (req, res, next) => {
    try {
        if (!checkValidations(req, res)) return;

        // Combine inputs into a rigid validation object
        const certificateData = {
            name: req.body.name,
            roll: req.body.roll,
            degree: req.body.degree,
            department: req.body.department,
            cgpa: req.body.cgpa,
            year: req.body.year
        };

        // 1. Send purely to Python Engine
        // No local state preservation of structural inputs mapping. Total architecture safety.
        logger.info(`[Cert Controller] Sending payload to Crypto Engine... [ReqID: ${req.id}]`);
        const { dna_payload, chaotic_seed } = await pythonService.encryptCertificate(certificateData);

        // 1.5 Generate standard independent SHA-256 for mathematical validation proof
        // We hash purely the strict subset of data that matters to the user verification layer
        const hashPayloadString = `${certificateData.name}|${certificateData.roll}|${certificateData.degree}|${certificateData.department}|${certificateData.cgpa}|${certificateData.year}`;
        const certificate_hash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

        // 2. Build local tracker representations
        const public_id = uuidv4().replace(/-/g, '').substring(0, 10); // 10-char alphanumeric subset 

        const cert = await Certificate.create({
            public_id,
            student_name: certificateData.name,
            roll_number: certificateData.roll,
            dna_payload,
            chaotic_seed,
            certificate_hash,
            issued_by: req.admin._id
        });

        // 3. Return Verification URIs for FrontEnd Distribution (Or email payloads)
        const verification_url = qrService.getVerificationUrl(public_id);
        const qr_code = await qrService.generateQRCode(verification_url);

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

        // 1. Fast Index lookup on Mongoose Schema String Key
        const certificate = await Certificate.findOne({ public_id });

        if (!certificate) {
            auditLog('CERT_VERIFY_404', req.id, 404, `Lookup Failed - Target Missing: ${public_id}`, req.ip, req.get('User-Agent'));
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        if (certificate.status === 'revoked') {
            auditLog('CERT_VERIFY_403', req.id, 403, `Revoked Access Blocked: ${public_id}`, req.ip, req.get('User-Agent'));
            return res.status(403).json({ success: false, error: 'REVOKED' });
        }

        // 2. Engage Crypto Engine decoding
        try {
            console.log(`[Cert Controller] Sending DNA sequence to Crypto Engine for validation...`);
            const decryptedData = await pythonService.decryptCertificate(
                certificate.dna_payload,
                certificate.chaotic_seed
            );

            // 2.5 Recalculate Hash from Decrypted Data and MATCH
            const hashPayloadString = `${decryptedData.name}|${decryptedData.roll}|${decryptedData.degree}|${decryptedData.department}|${decryptedData.cgpa}|${decryptedData.year}`;
            const recalculatedHash = crypto.createHash('sha256').update(hashPayloadString).digest('hex');

            if (recalculatedHash !== certificate.certificate_hash) {
                auditLog('CERT_TAMPERED', req.id, 403, `CRITICAL THREAT Hash Data Tampering Detected! ${public_id}`, req.ip, req.get('User-Agent'));
                await AuditLog.create({
                    action: 'CERT_TAMPERED',
                    targetId: public_id,
                    details: 'SHA-256 Hash check severely mismatched the decoded plaintext against original DB issuance record.',
                    ipAddress: req.ip,
                    userAgent: req.get('User-Agent')
                });
                return res.status(403).json({ success: false, error: 'TAMPERED: The cryptographic hash bounds were broken.' });
            }

            // 3. Mathematical Success -> Update Live Meta Properties
            await Certificate.updateOne(
                { _id: certificate._id },
                {
                    $inc: { verification_count: 1 },
                    $set: { last_verified_at: Date.now() }
                }
            );

            // Keep local object in sync for logging
            certificate.verification_count += 1;
            certificate.last_verified_at = Date.now();

            auditLog('CERT_VERIFY_SUCCESS', req.id, 200, `Decrypt Clean - Sequence Valid: ${public_id}`, req.ip, req.get('User-Agent'));

            // General Audience Log
            await AuditLog.create({
                action: 'VERIFY_SCAN',
                targetId: public_id,
                details: `Public user verified certificate data correctly. Count: ${certificate.verification_count}`,
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });

            const verification_url = qrService.getVerificationUrl(public_id);
            const qr_code = await qrService.generateQRCode(verification_url);

            res.status(200).json({
                success: true,
                data: decryptedData,
                verified_at: certificate.last_verified_at,
                qr_code,
                verification_url
            });

        } catch (cryptoError) {
            // Hard Tamper Block Event Router
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
        // Simple Page Aggregation Wrapper
        const page = parseInt(req.query.page, 10) || 1;
        const limit = 20;

        // HODs and SuperAdmins should see the certificate registry.
        // PII is secure because dna_payload is excluded. 
        // We don't filter by issued_by because SuperAdmins issue the certs, which would hide them from HODs.
        const query = {}; // Return all certificates (metadata only)

        const certificates = await Certificate.find(query)
            .select('-dna_payload') // EXPLICIT OVERRIDE: NEVER leak the DNA to the user portal lists
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ issued_at: -1 });

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

        certificate.status = 'revoked';
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
