import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const AdminSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
        index: true
    },
    passwordHash: {
        type: String,
        required: [true, 'Password is required']
    },
    role: {
        type: String,
        enum: ['HOD', 'Clerk', 'SuperAdmin'],
        default: 'Clerk'
    },
    department: {
        type: String,
        trim: true,
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date,
        default: null
    }
}, {
    timestamps: true // Automatically manages createdAt and updatedAt
});

// Pre-save hook: Hash password before saving to DB
AdminSchema.pre('save', async function (next) {
    if (!this.isModified('passwordHash')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(12);
        this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Instance method: Compare provided password with hashed password
AdminSchema.methods.comparePassword = async function (plainPassword) {
    return await bcrypt.compare(plainPassword, this.passwordHash);
};

// Static method: Find active user by email
AdminSchema.statics.findByEmail = async function (email) {
    return this.findOne({ email: email.toLowerCase(), isActive: true });
};

export default mongoose.model('Admin', AdminSchema);
