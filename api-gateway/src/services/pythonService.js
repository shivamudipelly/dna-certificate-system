import axios from 'axios';
import { configureEnvironment } from '../config/index.js';

const config = configureEnvironment();

export const pythonService = {
    /**
     * Reaches out to the Internal mathematical Crypto Engine to Encrypt Standard JSON Data
     */
    encryptCertificate: async (data) => {
        try {
            const response = await axios.post(
                `${config.cryptoEngineUrl}/encrypt`,
                { data: data }, // Match the EncryptRequest payload structure: { payload: { data } } wait the Python main expects: payload: { data: {} } ? No it expects {"data": {...}}
                {
                    headers: {
                        'x-api-key': 'gateway-secret-token',
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30-Seconds hard-stop
                }
            );

            if (response.data && response.data.success) {
                return {
                    dna_payload: response.data.dna_payload,
                    chaotic_seed: response.data.chaotic_seed
                };
            }
            throw new Error('Crypto Engine Encryption Error');

        } catch (error) {
            console.error(`💥 [Crypto Engine Bridge] Encrypt Failed: ${error.message}`);
            // Fallback gracefully instead of leaking microservice architectures to the end-user
            throw new Error('Encryption Service temporarily unavailable. Please try again later.');
        }
    },

    /**
     * Reaches out to the internal mathematical Crypto Engine to verify and Decrypt DNA mutations
     */
    decryptCertificate: async (dna_payload, chaotic_seed) => {
        try {
            const response = await axios.post(
                `${config.cryptoEngineUrl}/decrypt`,
                {
                    dna_payload: dna_payload,
                    chaotic_seed: chaotic_seed
                },
                {
                    headers: {
                        'x-api-key': 'gateway-secret-token',
                        'Content-Type': 'application/json'
                    },
                    timeout: 30000 // 30-Seconds hard-stop
                }
            );

            if (response.data && response.data.success) {
                return response.data.data;
            }

            console.error('[Crypto Engine Bridge] Unexpected Decrypt Response Format');
            throw new Error('Unknown Decryption format failure');

        } catch (error) {
            // Handle Crypto Engine strictly catching a tampered package
            if (error.response && error.response.status === 403 && error.response.data && error.response.data.error === 'TAMPERED') {
                console.warn(`[Crypto Engine Bridge] TAMPERED PAYLOAD DETECTED! Denying validation.`);
                const customErr = new Error("TAMPERED");
                customErr.status = 403;
                throw customErr;
            }

            console.error(`💥 [Crypto Engine Bridge] Decrypt Failed: ${error.message}`);
            throw new Error('Decryption Service temporarily unavailable.');
        }
    }
};
