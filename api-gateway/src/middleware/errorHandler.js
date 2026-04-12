import { logger } from '../utils/logger.js';

export const errorHandler = (err, req, res, next) => {
    // Log complete stack traces server side
    logger.error(`[Error] ${req.id} - ${err.message}`, {
        stack: err.stack,
        requestId: req.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
    });

    let statusCode = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';

    // Handle common mongoose errors
    if (err.name === 'CastError') {
        statusCode = 400;
        message = `Resource not found with that ID: ${err.value}`;
    }

    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = Object.values(err.errors).map(val => val.message).join(', ');
    }

    // Sanitize 500s completely to prevent internal metric leaking
    if (statusCode === 500) {
        message = 'Internal Server Error';
    }

    res.status(statusCode).json({
        success: false,
        error: message
    });
};
