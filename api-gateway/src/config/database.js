import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async (mongoUri) => {
    const MAX_RETRIES = 3;
    const RETRY_INTERVAL = 5000;

    let retries = 0;

    const connectWithRetry = async () => {
        try {
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000
            });
            logger.info('✅ MongoDB Connection Successful');
        } catch (error) {
            retries += 1;
            logger.error(`❌ MongoDB Connection Failed (Attempt ${retries}/${MAX_RETRIES}).`);

            if (retries < MAX_RETRIES) {
                logger.info(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
                setTimeout(connectWithRetry, RETRY_INTERVAL);
            } else {
                logger.error('💥 Max connection retries reached. Exiting application.');
                process.exit(1);
            }
        }
    };

    // Connection Events Monitoring
    mongoose.connection.on('connected', () => {
        logger.info('⚡ Mongoose established connection to Atlas');
    });

    mongoose.connection.on('error', (err) => {
        logger.error(`💥 Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        logger.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    await connectWithRetry();
    return mongoose.connection;
};
