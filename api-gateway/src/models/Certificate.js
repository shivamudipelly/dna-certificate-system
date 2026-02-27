import mongoose from 'mongoose';

const CertificateSchema = new mongoose.Schema({
    public_id: {
        type: String,
        required: [true, 'Public ID is required'],
        unique: true,
        index: true,
        minlength: 10,
        maxlength: 10
    },
    dna_payload: {
        type: String,
        required: [true, 'DNA Payload is required'],
        minlength: [100, 'DNA Payload securely encrypted string must be substantial in length']
    },
    chaotic_seed: {
        type: String,
        required: [true, 'Chaotic seed is required for decryption algorithms']
    },
    issued_by: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'Issuer Admin ID must be tracked'],
        index: true
    },
    issued_at: {
        type: Date,
        default: Date.now
    },
    verification_count: {
        type: Number,
        default: 0
    },
    last_verified_at: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'revoked'],
        default: 'active'
    }
}, {
    timestamps: true
});

/**
 * Virtual Property for future expirations (Assuming a 5-year expiry as an example feature)
 */
CertificateSchema.virtual('isExpired').get(function () {
    const fiveYearsFromIssue = new Date(this.issued_at).setFullYear(this.issued_at.getFullYear() + 5);
    return Date.now() > fiveYearsFromIssue;
});

// Ensure virtuals are included when converting to JSON
CertificateSchema.set('toJSON', { virtuals: true });
CertificateSchema.set('toObject', { virtuals: true });

export default mongoose.model('Certificate', CertificateSchema);
