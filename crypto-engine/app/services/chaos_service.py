import logging

# Setup logging
logger = logging.getLogger(__name__)

class ChaosService:
    @staticmethod
    def generate_seed_from_hash(hash_string: str) -> float:
        """
        Take the first 8 characters of a SHA-256 hash (hex string),
        convert to decimal, and normalize to [0, 1] range to serve as x0.
        """
        try:
            seed_hex = hash_string[:8]
            seed_decimal = int(seed_hex, 16)
            # 0xFFFFFFFF is the maximum value for an 8-character hex string (32-bit integer)
            x_0 = seed_decimal / 0xFFFFFFFF
            return x_0
        except Exception as e:
            logger.error(f"Failed to generate chaos seed from hash. Error: {str(e)}")
            raise ValueError("Invalid hash string provided for seed generation")

    @staticmethod
    def generate_chaotic_sequence(seed: float, length: int, r: float = 3.99) -> list[float]:
        """
        Use the Logistic Map formula x_n+1 = r * x_n * (1 - x_n)
        Generate 'length' number of values between 0 and 1.
        """
        if not (0 <= seed <= 1):
            raise ValueError("Seed must be normalized strictly between 0 and 1")
            
        sequence = []
        x_n = seed
        
        for _ in range(length):
            x_n = r * x_n * (1 - x_n)
            sequence.append(x_n)
            
        return sequence

    @staticmethod
    def get_encoding_rule(x_n: float) -> int:
        """
        Map a chaotic float value x_n to one of four DNA encoding rules.
        """
        if x_n < 0.25:
            return 1
        elif x_n < 0.50:
            return 2
        elif x_n < 0.75:
            return 3
        else:
            return 4

chaos_service = ChaosService()
