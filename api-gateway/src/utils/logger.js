import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

// Custom format to completely redact sensitive information before it hits logs
const redactSensitive = winston.format((info) => {
    const sensitiveKeys = ['password', 'passwordHash', 'token', 'jwt', 'chaotic_seed', 'dna_payload', 'privateKey', 'AES_KEY', 'x-api-key'];

    const censor = (obj) => {
        if (obj == null) return obj;
        if (typeof obj !== 'object') return obj;

        const newObj = Array.isArray(obj) ? [] : {};
        for (const [key, value] of Object.entries(obj)) {
            if (sensitiveKeys.includes(key.toLowerCase()) || sensitiveKeys.includes(key)) {
                newObj[key] = '[REDACTED]';
            } else if (typeof value === 'object') {
                newObj[key] = censor(value);
            } else {
                newObj[key] = value;
            }
        }
        return newObj;
    };

    info.message = typeof info.message === 'object' ? censor(info.message) : info.message;
    if (info.meta) info.meta = censor(info.meta);
    return info;
});

const logFormat = winston.format.combine(
    redactSensitive(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(
        ({ timestamp, level, message, stack, requestId, ip, userAgent }) => {
            const reqContext = requestId ? ` [ReqID: ${requestId}]` : '';
            const ipContext = ip ? ` [IP: ${ip}]` : '';
            const uaContext = userAgent ? ` [UA: ${userAgent}]` : '';
            const stackContext = stack ? `\n${stack}` : '';
            return `[${timestamp}] ${level.toUpperCase()}${reqContext}${ipContext}${uaContext}: ${message}${stackContext}`;
        }
    )
);

// Specific transport for Application Error Traces
const errorRotateTransport = new DailyRotateFile({
    filename: 'logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '100m',
    maxFiles: '7d',
    level: 'error'
});

// Specific transport for Audit Trail (Auth, Certificates)
const auditRotateTransport = new DailyRotateFile({
    filename: 'logs/audit-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '100m',
    maxFiles: '7d',
    level: 'info'
});

export const logger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: logFormat,
    transports: [
        errorRotateTransport,
        auditRotateTransport,
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                logFormat
            )
        })
    ]
});

export const auditLog = (event, requestId, res_status, message, ip, userAgent) => {
    logger.info(`EVENT: [${event}] ${message} | STATUS: ${res_status}`, { requestId, ip, userAgent });
};
