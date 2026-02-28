import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    // Log complete stack traces server side
    logger.error(`[Error] ${req.id} - ${err.message}`, {
        stack: err.stack,
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    const statusCode = err.status || err.statusCode || 500;

    // Sanitize 500s completely to prevent internal metric leaking
    const message = statusCode === 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error');

    res.status(statusCode).json({
        success: false,
        error: message
    });
};
