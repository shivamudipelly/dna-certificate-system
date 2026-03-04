import mongoose from 'mongoose';

const AuditLogSchema = new mongoose.Schema({
    action: {
        type: String,
        required: true,
        index: true
    },
    adminId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: false, // Could be null for system/public actions like 'LOGIN' or 'VERIFY'
        index: true
    },
    targetId: {
        type: String, // E.g. Draft ID, Certificate public_id, or Email
        required: false,
        index: true
    },
    details: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: false
    },
    userAgent: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

export default mongoose.model('AuditLog', AuditLogSchema);
