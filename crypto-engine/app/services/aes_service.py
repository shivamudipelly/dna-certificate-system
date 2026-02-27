import json
import base64
import secrets
import logging
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

from ..config import settings

# Setup logging for the service
logger = logging.getLogger(__name__)

class AESService:
    @staticmethod
    def derive_key_from_env() -> bytes:
        """
        Load AES_KEY from environment, validate it is exactly 32 bytes,
        and return the key bytes.
        """
        try:
            key_b64 = settings.AES_KEY
            key_bytes = base64.b64decode(key_b64)
            if len(key_bytes) != 32:
                logger.error("AES Key validation failed: Incorrect byte length")
                raise ValueError("AES key must be exactly 32 bytes")
            return key_bytes
        except Exception as e:
            logger.error("Failed to derive AES key")
            raise ValueError("Invalid AES key setup")

    @staticmethod
    def encrypt_data(data: dict, key: bytes) -> str:
        """
        Serialize dict to JSON, encrypt using AES-256-CBC with a secure random IV.
        Prepend IV to ciphertext and return as base64.
        """
        if not isinstance(data, dict):
            raise TypeError("Data must be a dictionary")
            
        try:
            json_str = json.dumps(data)
            
            # Secure random IV generation (16 bytes for AES block size)
            iv = secrets.token_bytes(16)
            
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            encryptor = cipher.encryptor()
            
            # Pad data to block size
            padder = padding.PKCS7(128).padder()
            padded_data = padder.update(json_str.encode('utf-8')) + padder.finalize()
            
            ciphertext = encryptor.update(padded_data) + encryptor.finalize()
            
            # Prepend IV and Base64 encode
            combined = iv + ciphertext
            b64_cipher = base64.b64encode(combined).decode('utf-8')
            
            logger.info("Data encryption successful")
            return b64_cipher
            
        except TypeError as te:
            logger.error("Encryption type error")
            raise ValueError("Invalid data type for encryption")
        except Exception as e:
            logger.error("Encryption unexpected error")
            raise ValueError("Encryption operation failed")

    @staticmethod
    def decrypt_data(encrypted_string: str, key: bytes) -> dict:
        """
        Decode base64, extract 16-byte IV, decrypt the ciphertext,
        and return the parsed JSON dictionary.
        """
        if not isinstance(encrypted_string, str):
            raise TypeError("Encrypted data must be a string")
            
        try:
            # Ensure proper padding for base64
            pad_len = len(encrypted_string) % 4
            if pad_len != 0:
                encrypted_string += "=" * (4 - pad_len)
                
            combined = base64.b64decode(encrypted_string)
            
            if len(combined) < 16:
                raise ValueError("Ciphertext too short to contain IV")
                
            iv = combined[:16]
            ciphertext = combined[16:]
            
            cipher = Cipher(algorithms.AES(key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            
            padded_data = decryptor.update(ciphertext) + decryptor.finalize()
            
            unpadder = padding.PKCS7(128).unpadder()
            unpadded_data = unpadder.update(padded_data) + unpadder.finalize()
            
            parsed_data = json.loads(unpadded_data.decode('utf-8'))
            logger.info("Data decryption successful")
            return parsed_data
            
        except ValueError as ve:
            logger.warning("Decryption payload manipulation detected or padding error")
            raise ValueError("Decryption failed: Data corrupted or invalid padding")
        except TypeError as te:
            logger.warning("Decryption type format error")
            raise ValueError("Decryption failed: Invalid format")
        except Exception as e:
            logger.error("Decryption unexpected error")
            raise ValueError("Decryption operation failed")

aes_service = AESService()
