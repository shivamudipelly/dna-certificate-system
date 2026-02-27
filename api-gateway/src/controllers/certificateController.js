import { v4 as uuidv4 } from 'uuid';
import Certificate from '../models/Certificate.js';
import { pythonService } from '../services/pythonService.js';
import { qrService } from '../services/qrService.js';
import { validationResult } from 'express-validator';

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
            cgpa: req.body.cgpa,
            year: req.body.year
        };

        // 1. Send purely to Python Engine
        // No local state preservation of structural inputs mapping. Total architecture safety.
        console.log(`[Cert Controller] Sending payload to Crypto Engine...`);
        const { dna_payload, chaotic_seed } = await pythonService.encryptCertificate(certificateData);

        // 2. Build local tracker representations
        const public_id = uuidv4().replace(/-/g, '').substring(0, 10); // 10-char alphanumeric subset 

        const cert = await Certificate.create({
            public_id,
            dna_payload,
            chaotic_seed,
            issued_by: req.admin._id
        });

        // 3. Return Verification URIs for FrontEnd Distribution (Or email payloads)
        const verification_url = qrService.getVerificationUrl(public_id);
        const qr_code = await qrService.generateQRCode(verification_url);

        console.info(`[Issuance Event] New Certificate Created: ${public_id} Issuer: ${req.admin._id}`);

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
            console.warn(`[Verification Alert] Lookup Failed - Target Missing: ${public_id} IP: ${req.ip}`);
            return res.status(404).json({ success: false, error: 'Certificate not found' });
        }

        if (certificate.status === 'revoked') {
            console.warn(`[Verification Alert] Revoked Access Blocked: ${public_id} IP: ${req.ip}`);
            return res.status(403).json({ success: false, error: 'REVOKED' });
        }

        // 2. Engage Crypto Engine decoding
        try {
            console.log(`[Cert Controller] Sending DNA sequence to Crypto Engine for validation...`);
            const decryptedData = await pythonService.decryptCertificate(
                certificate.dna_payload,
                certificate.chaotic_seed
            );

            // 3. Mathematical Success -> Update Live Meta Properties
            certificate.verification_count += 1;
            certificate.last_verified_at = Date.now();
            await certificate.save();

            console.info(`[Verification Success] Decrypt Clean - Sequence Valid: ${public_id}`);

            res.status(200).json({
                success: true,
                data: decryptedData,
                verified_at: certificate.last_verified_at
            });

        } catch (cryptoError) {
            // Hard Tamper Block Event Router
            if (cryptoError.status === 403 && cryptoError.message === 'TAMPERED') {
                console.error(`💥 [CRITICAL THREAT] Database Data Tampering Detected! ${public_id}`);
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

        // Ensure we isolate viewing specifically to the tracking object creator
        const certificates = await Certificate.find({ issued_by: req.admin._id })
            .select('-dna_payload') // EXPLICIT OVERRIDE: NEVER leak the DNA to the user portal lists
            .skip((page - 1) * limit)
            .limit(limit)
            .sort({ issued_at: -1 });

        const total = await Certificate.countDocuments({ issued_by: req.admin._id });

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

        console.warn(`[Access Event] Administrator ${req.admin._id} actively revoked Certificate ${public_id}`);

        res.status(200).json({
            success: true,
            message: 'Certificate has been successfully revoked.'
        });

    } catch (error) {
        next(error);
    }
};
