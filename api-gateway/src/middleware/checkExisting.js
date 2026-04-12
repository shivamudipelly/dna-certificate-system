import Certificate from '../models/Certificate.js';
import DraftCertificate from '../models/DraftCertificate.js';

/**
 * Middleware to check if an active Certificate or unresolved Draft already exists
 * for the incoming generic student payload (identified by roll number)
 */
export const checkExistingRegistry = async (req, res, next) => {
    try {
        const { roll } = req.body;
        if (!roll) {
            // Let the express-validator handle 'roll is missing' in the next middleware array
            return next();
        }

        const exactRoll = roll.trim().toUpperCase(); // Normalize payload

        // 1. Check for Active Certificate
        // If a certificate exists but is 'revoked', we completely ignore it,
        // allowing a "re-issue" document to take its place.
        const hasActiveCert = await Certificate.exists({
            roll_number: exactRoll,
            status: 'active'
        });

        if (hasActiveCert) {
            return res.status(409).json({
                success: false,
                error: 'Student already has an active mathematical certificate mapping. Revoke the existing active certificate before issuing a new one.'
            });
        }

        // 2. Check for Pending/Active Draft
        // If a draft is Verified, it means the workflow successfully finished. We don't block the user.
        // We strictly block unresolved processing documents ('Draft', 'Submitted', 'RevertedToHOD', etc.)
        const draftQuery = {
            roll: exactRoll,
            status: { $in: ['Draft', 'Submitted', 'RevertedToHOD', 'Reverted'] } // Let 'Verified' fall through. Note: Reverted is kept here because it means the clerk must edit it, not spawn a new one.
        };

        // If the user is Editing a draft (PUT /:id), exclude the current draft from the collision check
        if (req.params.id) {
            draftQuery._id = { $ne: req.params.id };
        }

        const hasProcessingDraft = await DraftCertificate.exists(draftQuery);

        if (hasProcessingDraft) {
            return res.status(409).json({
                success: false,
                error: 'An unresolved draft already exists for this roll number. Please review Drafts or revise the existing submission.'
            });
        }

        // All clears
        next();
    } catch (error) {
        next(error);
    }
};
