export const errorHandler = (err, req, res, next) => {
    console.error(`[Error] ${req.id} - ${err.message}`);

    // Defaulting Error Payload - Stripts Stack Traces
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    res.status(statusCode).json({
        success: false,
        error: message
    });
};
