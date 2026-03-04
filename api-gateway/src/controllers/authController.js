import Admin from '../models/Admin.js';
import AuditLog from '../models/AuditLog.js';
import { tokenService } from '../services/tokenService.js';
import { auditLog } from '../utils/logger.js';

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
            auditLog('AUTH_FAILED', req.id, 401, `Invalid email attempt target: ${email}`, req.ip, req.get('User-Agent'));
            return sendError(res, 401, 'Invalid credentials');
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            auditLog('AUTH_FAILED', req.id, 401, `Invalid password attempt for target: ${email}`, req.ip, req.get('User-Agent'));
            return sendError(res, 401, 'Invalid credentials');
        }

        // 3. Generate Token via Token Service
        const token = tokenService.generateToken(admin._id, admin.email, admin.role);

        // 4. Update login metadata
        admin.lastLogin = Date.now();
        await admin.save({ validateBeforeSave: false }); // Skip extra structural validations on login hook

        auditLog('AUTH_SUCCESS', req.id, 200, `Admin logged in successfully: ${admin.email}`, req.ip, req.get('User-Agent'));

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

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await Admin.find().select('-passwordHash').sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
};

export const deleteUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const targetAdmin = await Admin.findById(id);

        if (!targetAdmin) {
            return sendError(res, 404, 'Admin not found');
        }

        // 1. ROOT PROTECTION: Immutable System Owner check
        if (targetAdmin.is_root) {
            await AuditLog.create({
                action: 'DELETE_DENIED',
                adminId: req.admin._id,
                targetId: id,
                details: 'Attempted to delete the indestructible Root System Owner',
                ipAddress: req.ip,
                userAgent: req.get('User-Agent')
            });
            return sendError(res, 403, 'Cannot delete the Root System Owner.');
        }

        await Admin.findByIdAndDelete(id);

        await AuditLog.create({
            action: 'USER_DELETED',
            adminId: req.admin._id,
            targetId: id,
            details: `Admin ${targetAdmin.email} deleted successfully`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        next(error);
    }
};
export const editUser = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { role, department } = req.body;

        const targetAdmin = await Admin.findById(id);
        if (!targetAdmin) return sendError(res, 404, 'User not found');

        if (targetAdmin.is_root) return sendError(res, 403, 'Cannot modify the Root System Owner.');

        const validRoles = ['HOD', 'Clerk', 'SuperAdmin'];
        if (role && !validRoles.includes(role)) return sendError(res, 400, 'Invalid role');

        if (role) targetAdmin.role = role;
        if (department !== undefined) targetAdmin.department = department;
        await targetAdmin.save({ validateBeforeSave: false });

        await AuditLog.create({
            action: 'USER_EDITED',
            adminId: req.admin._id,
            targetId: id,
            details: `User ${targetAdmin.email} updated — role: ${targetAdmin.role}, dept: ${targetAdmin.department}`,
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
        });

        res.status(200).json({ success: true, user: { _id: targetAdmin._id, email: targetAdmin.email, role: targetAdmin.role, department: targetAdmin.department, isActive: targetAdmin.isActive } });
    } catch (error) { next(error); }
};
