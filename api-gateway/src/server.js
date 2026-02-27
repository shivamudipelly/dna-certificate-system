import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { configureEnvironment } from './config/index.js';
import { connectDB } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';

// 1. Initialize configuration and environment validation
const config = configureEnvironment();

// 2. Database Connection
connectDB(config.mongoUri);

// 3. Initialize Express App
const app = express();

// 4. Security & Logging Middlewares
app.use(helmet()); // Apply Security Headers

// Add request ID and basic response time tracking
app.use((req, res, next) => {
    req.id = uuidv4();
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${req.id}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Configure CORS (Allow only Frontend)
app.use(cors({
    origin: config.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true
}));

// Rate Limiting (100 req/min/IP)
const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 100,
    message: { success: false, error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/', apiLimiter);

// JSON Body Parser with 10KB limit
app.use(express.json({ limit: '10kb' }));

// Input Sanitization (Basic block of script tags/SQL injections in req.body)
app.use((req, res, next) => {
    if (req.body && Object.keys(req.body).length > 0) {
        const payloadString = JSON.stringify(req.body);
        const forbiddenPatterns = [/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, /(\%27)|(\')|(\-\-)|(\%23)|(#)/i];

        for (const pattern of forbiddenPatterns) {
            if (pattern.test(payloadString)) {
                return res.status(403).json({ success: false, error: 'Malicious payload detected' });
            }
        }
    }
    next();
});

// 5. Setup Routes
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', service: 'API Gateway', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);

// 6. Global Error Handler
app.use(errorHandler);

// 7. Start Server
app.listen(config.port, () => {
    console.log(`🚀 API Gateway securely running on port ${config.port}`);
});
