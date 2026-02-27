import mongoose from 'mongoose';

export const connectDB = async (mongoUri) => {
    const MAX_RETRIES = 3;
    const RETRY_INTERVAL = 5000;

    let retries = 0;

    const connectWithRetry = async () => {
        try {
            await mongoose.connect(mongoUri, {
                serverSelectionTimeoutMS: 5000
            });
            console.log('✅ MongoDB Connection Successful');
        } catch (error) {
            retries += 1;
            console.error(`❌ MongoDB Connection Failed (Attempt ${retries}/${MAX_RETRIES}).`);

            if (retries < MAX_RETRIES) {
                console.log(`Retrying in ${RETRY_INTERVAL / 1000} seconds...`);
                setTimeout(connectWithRetry, RETRY_INTERVAL);
            } else {
                console.error('💥 Max connection retries reached. Exiting application.');
                process.exit(1);
            }
        }
    };

    // Connection Events Monitoring
    mongoose.connection.on('connected', () => {
        console.log('⚡ Mongoose established connection to Atlas');
    });

    mongoose.connection.on('error', (err) => {
        console.error(`💥 Mongoose connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ Mongoose disconnected from MongoDB');
    });

    await connectWithRetry();
    return mongoose.connection;
};
