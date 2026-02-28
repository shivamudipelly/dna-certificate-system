import dotenv from 'dotenv';
dotenv.config();

export const configureEnvironment = () => {
    const requiredVars = [
        'PORT',
        'MONGO_URI',
        'JWT_SECRET',
        'CRYPTO_ENGINE_URL',
        'FRONTEND_URL',
        'ENGINE_API_KEY'
    ];

    const missingVars = requiredVars.filter((v) => !process.env[v]);

    if (missingVars.length > 0) {
        console.error(`💥 FATAL ERROR: Missing required environment variables: ${missingVars.join(', ')}`);
        process.exit(1);
    }

    return {
        port: parseInt(process.env.PORT, 10),
        mongoUri: process.env.MONGO_URI,
        jwtSecret: process.env.JWT_SECRET,
        cryptoEngineUrl: process.env.CRYPTO_ENGINE_URL,
        frontendUrl: process.env.FRONTEND_URL,
        engineApiKey: process.env.ENGINE_API_KEY
    };
};
