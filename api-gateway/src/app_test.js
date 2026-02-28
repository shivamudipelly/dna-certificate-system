import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/authRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

// An isolated app wrapper specifically so Jest/Supertest can hit the API 
// without needing mongoose.connect() directly fired in server.js
const app = express();

app.use(helmet());
app.use((req, res, next) => {
    req.id = uuidv4();
    next();
});
app.use(cors());
const apiLimiter = rateLimit({ windowMs: 60 * 1000, max: 100 });
app.use('/api/', apiLimiter);
app.use(express.json({ limit: '10kb' }));

app.use('/api/auth', authRoutes);
app.use('/api/certificates', certificateRoutes);
app.use(errorHandler);

export default app;
