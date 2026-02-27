import hashlib
import json
import hmac

class HashService:
    @staticmethod
    def generate_sha256(data: dict) -> str:
        """
        Generate SHA-256 hash from a dictionary.
        Keys are sorted to ensure consistent string representation.
        """
        if not isinstance(data, dict):
            raise TypeError("Data must be a dictionary")
        json_str = json.dumps(data, sort_keys=True)
        return hashlib.sha256(json_str.encode('utf-8')).hexdigest()

    @staticmethod
    def verify_hash(data: dict, expected_hash: str) -> bool:
        """
        Recalculate the hash of the data and compare it with the expected_hash
        using a constant-time comparison to prevent timing attacks.
        """
        if not isinstance(data, dict) or not isinstance(expected_hash, str):
            return False
            
        calculated_hash = HashService.generate_sha256(data)
        return hmac.compare_digest(calculated_hash, expected_hash)

hash_service = HashService()
