import logging
from .hash_service import hash_service
from .aes_service import aes_service
from .chaos_service import chaos_service
from .dna_encoder import dna_encoder

logger = logging.getLogger(__name__)

class TamperedError(Exception):
    """Exception raised when decrypted payload hash fails verification."""
    pass

class CryptoOrchestrator:
    @staticmethod
    def full_encrypt(data: dict) -> dict:
        """
        Executes the full DNA Encryption pipeline.
        Returns Dictionary with dna_payload and chaotic_seed.
        """
        try:
            # Step 1: Generate SHA-256 hash
            data_hash = hash_service.generate_sha256(data)
            
            # Step 2: Combine data + hash
            encryption_envelope = {
                "data": data,
                "hash": data_hash
            }
            
            # Step 3: AES-256 encrypt
            key_bytes = aes_service.derive_key_from_env()
            b64_cipher = aes_service.encrypt_data(encryption_envelope, key_bytes)
            
            # Step 4: Convert ciphertext to binary
            binary_stream = "".join(format(ord(c), '08b') for c in b64_cipher)
            
            # Step 5: Generate chaotic seed from hash
            seed_x0 = chaos_service.generate_seed_from_hash(data_hash)
            
            # Step 6: Generate chaotic sequence
            chaotic_sequence = chaos_service.generate_chaotic_sequence(seed_x0, len(binary_stream) // 2)
            
            # Step 7: Convert binary to DNA
            dna_sequence = dna_encoder.binary_to_dna_dynamic(binary_stream, chaotic_sequence)
            
            # Step 8: Apply DNA XOR
            final_dna = dna_encoder.dna_xor(dna_sequence)
            
            logger.info("Full encryption pipeline completed successfully.")
            
            # Step 9: Return
            # Ensure chaotic_seed is returned as string as requested by Requirements
            return {
                "dna_payload": final_dna,
                "chaotic_seed": str(seed_x0)
            }
            
        except Exception as e:
            logger.error("Encryption pipeline failed.")
            raise ValueError("Encryption operation failed due to internal error.")

    @staticmethod
    def full_decrypt(dna_payload: str, chaotic_seed: str) -> dict:
        """
        Executes the full DNA Decryption pipeline.
        Returns the original data dictionary or raises TamperedError.
        """
        try:
            seed_float = float(chaotic_seed)
        except ValueError:
            logger.error("Invalid chaotic seed format.")
            raise ValueError("Invalid chaotic seed format.")

        try:
            # Step 1 & 2: Reverse DNA XOR & determine length for sequence regen
            reverted_dna = dna_encoder.dna_xor_reverse(dna_payload)
            chaotic_sequence = chaos_service.generate_chaotic_sequence(seed_float, len(reverted_dna))
            
            # Step 3: DNA to Binary
            reverted_binary = dna_encoder.dna_to_binary_dynamic(reverted_dna, chaotic_sequence)
            
            # Step 4: Binary to AES ciphertext (base64)
            chars = [chr(int(reverted_binary[i:i+8], 2)) for i in range(0, len(reverted_binary), 8)]
            restored_b64 = "".join(chars)
            
            # Step 5: AES decrypt
            key_bytes = aes_service.derive_key_from_env()
            decrypted_dict = aes_service.decrypt_data(restored_b64, key_bytes)
            
            extracted_data = decrypted_dict.get("data")
            expected_hash = decrypted_dict.get("hash")
            
            if extracted_data is None or expected_hash is None:
                raise TamperedError("Missing data or hash block.")
                
            # Step 6 & 7: Check Hash
            if not hash_service.verify_hash(extracted_data, expected_hash):
                raise TamperedError("Hash verification failed.")
                
            logger.info("Full decryption pipeline completed successfully.")
            
            # Step 8: Return Data
            return extracted_data
            
        except TamperedError:
            logger.warning("Tampered data detected during decryption.")
            raise
        except Exception as e:
            logger.error("Decryption pipeline failed due to format corruption or manipulation.")
            raise TamperedError("Payload decryption failed.")

crypto_orchestrator = CryptoOrchestrator()
