import jwt from 'jsonwebtoken';
import { configureEnvironment } from '../config/index.js';

const config = configureEnvironment();

class TokenService {
    /**
     * Generate a JWT for horizontal session scaling
     */
    generateToken(adminId, email, role) {
        const payload = {
            sub: adminId,
            email: email,
            role: role
        };

        return jwt.sign(payload, config.jwtSecret, {
            expiresIn: '24h',
            algorithm: 'HS256'
        });
    }

    /**
     * Decode and mathematically verify the cryptographic signature of the JWT token
     */
    verifyToken(token) {
        try {
            return jwt.verify(token, config.jwtSecret);
        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                throw new Error('Token has expired. Please login again.');
            }
            throw new Error('Invalid authentication token.');
        }
    }
}

export const tokenService = new TokenService();
