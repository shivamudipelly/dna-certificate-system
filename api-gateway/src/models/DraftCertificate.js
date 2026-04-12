import mongoose from 'mongoose';

const DraftCertificateSchema = new mongoose.Schema({
    // Plaintext PII (Personally Identifiable Information) stored temporarily
    name: {
        type: String,
        required: [true, 'Student name is required'],
        trim: true
    },
    roll: {
        type: String,
        required: [true, 'Roll number is required'],
        trim: true
    },
    degree: {
        type: String,
        required: [true, 'Degree program is required'],
        trim: true
    },
    department: {
        type: String,
        required: [true, 'Department is required'],
        trim: true,
        enum: ['CSE', 'ECE', 'EEE', 'ME', 'CE', 'IT', 'AI&ML', 'DS']
    },
    cgpa: {
        type: Number,
        required: [true, 'CGPA is required'],
        min: 0,
        max: 10
    },
    year: {
        type: Number,
        required: [true, 'Graduation year is required'],
        min: 1990,
        max: 2100
    },
    // Workflow tracking
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        required: [true, 'Creator ID is required']
    },
    status: {
        type: String,
        enum: ['Draft', 'Submitted', 'Reverted', 'Verified', 'RevertedToHOD', 'Issued'],
        default: 'Draft'
    },
    remarks: {
        type: String,
        default: null
    },
    history: [{
        action: { type: String, required: true },
        fromStatus: { type: String },
        toStatus: { type: String },
        actor: {
            id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
            email: { type: String },
            role: { type: String }
        },
        remarks: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    certificateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Certificate',
        default: null
    }
}, {
    timestamps: true
});

// Indexes for optimization
DraftCertificateSchema.index({ createdBy: 1 });
DraftCertificateSchema.index({ status: 1, department: 1 });

export default mongoose.model('DraftCertificate', DraftCertificateSchema);
