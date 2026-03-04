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
        trim: true
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
        enum: ['Draft', 'Submitted', 'Reverted', 'Verified', 'RevertedToHOD'],
        default: 'Draft'
    },
    remarks: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

export default mongoose.model('DraftCertificate', DraftCertificateSchema);
