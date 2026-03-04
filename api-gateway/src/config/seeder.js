import Admin from '../models/Admin.js';
import { logger } from '../utils/logger.js';
import bcrypt from 'bcryptjs';

/**
 * Initializes the Root Super Admin if it doesn't already exist.
 * This ensures the system ALWAYS has at least one indestructible owner.
 */
export const seedRootAdmin = async () => {
    try {
        const rootEmail = process.env.ROOT_ADMIN_EMAIL;
        const rootPassword = process.env.ROOT_ADMIN_PASSWORD;
        const rootDepartment = process.env.ROOT_ADMIN_DEPARTMENT;

        // Check if root already exists based on the absolute is_root flag
        const existingRoot = await Admin.findOne({ is_root: true });

        if (!existingRoot) {
            logger.info('🌱 Seeding Root SuperAdmin account into the database...');

            await Admin.create({
                email: rootEmail,
                passwordHash: rootPassword, // pre-save hook will hash it
                role: 'SuperAdmin',
                department: rootDepartment,
                is_root: true,
                isActive: true
            });

            logger.info(`✅ Root SuperAdmin seeded successfully. [Email: ${rootEmail}]`);
        } else {
            logger.debug('🌿 Root SuperAdmin already exists in the system.');
        }
    } catch (error) {
        logger.error(`❌ Failed to seed Root SuperAdmin: ${error.message}`);
    }
};
