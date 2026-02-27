import QRCode from 'qrcode';
import { configureEnvironment } from '../config/index.js';

const config = configureEnvironment();

export const qrService = {
    /**
     * Uses the qrcode npm module to generate a DataImage payload string embedded with the validation verification direct URI
     */
    generateQRCode: async (url) => {
        try {
            return await QRCode.toDataURL(url, {
                errorCorrectionLevel: 'M', // Medium 15% Error Correction (Solid balance for data size and readability)
                width: 256, // 256x256 image size mapping
                margin: 2
            });
        } catch (error) {
            console.error(`💥 [QR Generation Error] Generation Failed: ${error.message}`);
            throw new Error('Failed to generate validation QR code.');
        }
    },

    /**
     * Safely constructs the canonical verify URI link based on environment
     */
    getVerificationUrl: (public_id) => {
        // Strip out trailing slashes from Frontend URI config to keep canonical uniform
        const cleanBase = config.frontendUrl.replace(/\/+$/, '');
        return `${cleanBase}/verify/${public_id}`;
    }
};
