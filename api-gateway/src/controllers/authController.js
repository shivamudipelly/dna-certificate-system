import Admin from '../models/Admin.js';
import { tokenService } from '../services/tokenService.js';

/**
 * Custom Error wrapper to enforce strictly 400 Bad Request error standards cleanly
 */
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ success: false, error: message });
};

export const register = async (req, res, next) => {
    try {
        const { email, password, role, department } = req.body;

        // 1. Validation
        if (!email || !password) {
            return sendError(res, 400, 'Please provide an email and password');
        }

        if (password.length < 8) {
            return sendError(res, 400, 'Password must be at least 8 characters long');
        }

        // Optional Role constraint (defaults to Clerk if blank)
        const validRoles = ['HOD', 'Clerk', 'SuperAdmin'];
        if (role && !validRoles.includes(role)) {
            return sendError(res, 400, 'Invalid role assignment');
        }

        // 2. Check Exists
        const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
        if (existingAdmin) {
            return sendError(res, 400, 'The provided email is already registered to an Admin account.');
        }

        // 3. Create & Hash handled natively in DB Pre-Save hook
        const admin = await Admin.create({
            email,
            passwordHash: password, // The Mongoose Pre-save hook uses bcrypt to intercept and mutate this string
            role,
            department
        });

        console.info(`[Auth Event] New Admin Registered - ID: ${admin._id} Role: ${admin.role}`);

        res.status(201).json({
            success: true,
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                department: admin.department
            }
        });

    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 1. Structural Validation
        if (!email || !password) {
            return sendError(res, 400, 'Please provide both email and password');
        }

        // 2. Authenticate Entity
        const admin = await Admin.findByEmail(email);

        if (!admin) {
            console.warn(`[Failed Login] Invalid email target: ${email} IP: ${req.ip}`);
            return sendError(res, 401, 'Invalid credentials');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            console.warn(`[Failed Login] Invalid password for target: ${email} IP: ${req.ip}`);
            return sendError(res, 401, 'Invalid credentials');
        }

        // 3. Generate Token via Token Service
        const token = tokenService.generateToken(admin._id, admin.email, admin.role);

        // 4. Update login metadata
        admin.lastLogin = Date.now();
        await admin.save({ validateBeforeSave: false }); // Skip extra structural validations on login hook

        console.info(`[Auth Success] Admin logged in: ${admin.email} IP: ${req.ip}`);

        res.status(200).json({
            success: true,
            token,
            admin: {
                id: admin._id,
                email: admin.email,
                role: admin.role,
                department: admin.department
            }
        });

    } catch (error) {
        next(error);
    }
};

export const getProfile = async (req, res, next) => {
    try {
        // req.admin is safely extracted mathematically from the token by `authMiddleware.js protect()`
        const admin = await Admin.findById(req.admin._id).select('-passwordHash'); // Ensures BCrypt strings never leak out dynamically

        res.status(200).json({
            success: true,
            admin
        });
    } catch (error) {
        next(error);
    }
};
