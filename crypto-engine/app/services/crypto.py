import hashlib
import json
import base64
import os
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives import padding

from ..config import settings

class CryptoService:
    def __init__(self):
        # AES key must be exactly 32 bytes
        self.aes_key = base64.b64decode(settings.AES_KEY)
        
    def generate_sha256(self, json_string: str) -> str:
        """
        Sub-Step 4.1: SHA-256 Hash Generation
        Takes a JSON string and returns its 64-character hex hash.
        """
        return hashlib.sha256(json_string.encode('utf-8')).hexdigest()
        
    def encrypt_aes(self, data: dict, data_hash: str) -> str:
        """
        Sub-Step 4.2: AES-256 Encryption
        Takes data dict and hash, bundles them, and encrypts with CBC mode.
        Returns Base64 encoded string.
        """
        payload = json.dumps({
            "data": data,
            "hash": data_hash
        })
        
        # IV: Random 16-byte initialization vector
        iv = os.urandom(16)
        
        cipher = Cipher(algorithms.AES(self.aes_key), modes.CBC(iv), backend=default_backend())
        encryptor = cipher.encryptor()
        
        # PKCS7 Padding
        padder = padding.PKCS7(128).padder()
        padded_data = padder.update(payload.encode('utf-8')) + padder.finalize()
        
        ciphertext = encryptor.update(padded_data) + encryptor.finalize()
        
        # Prepend IV to ciphertext for decryption purposes before base64 (Standard practice)
        combined = iv + ciphertext
        return base64.b64encode(combined).decode('utf-8')
        
    def decrypt_aes(self, b64_ciphertext: str) -> dict:
        """
        Sub-Step 5.5: AES-256 Decryption
        Takes Base64 encoded ciphertext, extracts IV, decrypts, and unpads.
        Returns the parsed JSON dictionary.
        """
        # Ensure base64 padding is correct
        pad_len = len(b64_ciphertext) % 4
        if pad_len != 0:
            b64_ciphertext += "=" * (4 - pad_len)
            
        combined = base64.b64decode(b64_ciphertext)
        
        # Extract 16-byte IV and the rest is ciphertext
        iv = combined[:16]
        ciphertext = combined[16:]
        
        cipher = Cipher(algorithms.AES(self.aes_key), modes.CBC(iv), backend=default_backend())
        decryptor = cipher.decryptor()
        
        padded_data = decryptor.update(ciphertext) + decryptor.finalize()
        
        # Unpad
        unpadder = padding.PKCS7(128).unpadder()
        unpadded_data = unpadder.update(padded_data) + unpadder.finalize()
        
        return json.loads(unpadded_data.decode('utf-8'))

    def string_to_binary(self, b64_string: str) -> str:
        """
        Sub-Step 4.3: Convert AES Ciphertext to Binary
        Returns a string of 1s and 0s.
        """
        binary_str = ""
        # iterate over bytes directly from the base64 string
        for byte in b64_string.encode('utf-8'):
            binary_str += format(byte, '08b')
        return binary_str

    def binary_to_string(self, binary_str: str) -> str:
        """
        Sub-Step 5.4: Binary to AES Ciphertext
        Reverses the binary conversion back to string.
        """
        byte_array = bytearray()
        for i in range(0, len(binary_str), 8):
            byte = binary_str[i:i+8]
            byte_array.append(int(byte, 2))
        return byte_array.decode('utf-8')
    def generate_chaotic_sequence(self, sha256_hash: str, length: int) -> list[float]:
        """
        Sub-Step 4.4 & 4.5: Generate Chaotic Seed & Logistic Map
        Takes the first 8 chars of SHA256 as seed, iterates `length` times.
        Returns a list of x_n values between 0 and 1.
        """
        # Take first 8 characters of hex hash
        seed_hex = sha256_hash[:8]
        # Convert hex to decimal
        seed_decimal = int(seed_hex, 16)
        # Normalize to [0, 1] using 0xFFFFFFFF (max 32-bit int)
        x_n = seed_decimal / 0xFFFFFFFF
        
        sequence = []
        r = settings.LOGISTIC_MAP_R
        
        for _ in range(length):
            x_n = r * x_n * (1 - x_n)
            sequence.append(x_n)
            
        return sequence
            
    def dynamic_dna_encode(self, binary_str: str, chaotic_sequence: list[float]) -> str:
        """
        Sub-Step 4.6: Dynamic DNA Encoding (Position-Based)
        Uses the chaotic sequence to determine which rule to encode 2 bits with.
        Rules:
        1: {00:A, 01:C, 10:G, 11:T}  (0.00 <= x_n < 0.25)
        2: {00:C, 01:G, 10:T, 11:A}  (0.25 <= x_n < 0.50)
        3: {00:G, 01:T, 10:A, 11:C}  (0.50 <= x_n < 0.75)
        4: {00:T, 01:A, 10:C, 11:G}  (0.75 <= x_n <= 1.00)
        """
        rules = [
            {"00": "A", "01": "C", "10": "G", "11": "T"}, # Rule 1
            {"00": "C", "01": "G", "10": "T", "11": "A"}, # Rule 2
            {"00": "G", "01": "T", "10": "A", "11": "C"}, # Rule 3
            {"00": "T", "01": "A", "10": "C", "11": "G"}  # Rule 4
        ]
        
        # Ensure binary string is evenly divisible by 2
        if len(binary_str) % 2 != 0:
            binary_str += "0"
            
        dna_sequence = []
        seq_len = len(chaotic_sequence)
        
        # We need a chaotic value for every 2 bits (1 nucleotide)
        for i in range(0, len(binary_str), 2):
            bits = binary_str[i:i+2]
            chaotic_index = (i // 2) % seq_len
            
            x_n = chaotic_sequence[chaotic_index]
            
            if x_n < 0.25:
                rule = rules[0]
            elif x_n < 0.50:
                rule = rules[1]
            elif x_n < 0.75:
                rule = rules[2]
            else:
                rule = rules[3]
                
            dna_sequence.append(rule[bits])
            
        return "".join(dna_sequence)
        
    def dynamic_dna_decode(self, dna_str: str, chaotic_sequence: list[float]) -> str:
        """
        Sub-Step 5.3: Reverse Dynamic DNA Decoding
        Uses the chaotic sequence to determine which rule maps a nucleotide back to 2 bits.
        """
        # Inverse rules dict mapping Nucleotide -> Bits
        rules_inv = [
            {"A": "00", "C": "01", "G": "10", "T": "11"}, # Rule 1
            {"C": "00", "G": "01", "T": "10", "A": "11"}, # Rule 2
            {"G": "00", "T": "01", "A": "10", "C": "11"}, # Rule 3
            {"T": "00", "A": "01", "C": "10", "G": "11"}  # Rule 4
        ]
        
        binary_str = []
        seq_len = len(chaotic_sequence)
        
        for i, char in enumerate(dna_str):
            x_n = chaotic_sequence[i % seq_len]
            if x_n < 0.25:
                rule_inv = rules_inv[0]
            elif x_n < 0.50:
                rule_inv = rules_inv[1]
            elif x_n < 0.75:
                rule_inv = rules_inv[2]
            else:
                rule_inv = rules_inv[3]
                
            binary_str.append(rule_inv[char])
            
        return "".join(binary_str)

    def watson_crick_xor_mutate(self, dna_sequence: str) -> str:
        """
        Sub-Step 4.7: DNA XOR Mutation (Watson-Crick Pairing)
        Takes encoded DNA sequence and XORs it with the Secret Key Sequence.
        Returns final DNA Payload.
        """
        xor_table = {
            'A': {'A': 'A', 'C': 'G', 'G': 'C', 'T': 'T'},
            'C': {'A': 'G', 'C': 'A', 'G': 'T', 'T': 'C'},
            'G': {'A': 'C', 'C': 'T', 'G': 'A', 'T': 'G'},
            'T': {'A': 'T', 'C': 'C', 'G': 'G', 'T': 'A'}
        }
        
        secret_key = settings.DNA_SECRET_KEY
        key_len = len(secret_key)
        
        mutated_dna = []
        for i, nucleotide in enumerate(dna_sequence):
            key_nucleotide = secret_key[i % key_len]
            mutated_nuc = xor_table[nucleotide][key_nucleotide]
            mutated_dna.append(mutated_nuc)
            
        return "".join(mutated_dna)

    def revert_watson_crick_xor(self, mutated_dna: str) -> str:
        """
        Sub-Step 5.1: Reverse DNA XOR Mutation
        XOR is self-inverse. However, given our specific custom table:
        If Z = X XOR Y, then we need to find X given Z and Y (Y is our secret key).
        Looking at the table, we can reverse map it.
        """
        xor_table = {
            'A': {'A': 'A', 'C': 'G', 'G': 'C', 'T': 'T'},
            'C': {'A': 'G', 'C': 'A', 'G': 'T', 'T': 'C'},
            'G': {'A': 'C', 'C': 'T', 'G': 'A', 'T': 'G'},
            'T': {'A': 'T', 'C': 'C', 'G': 'G', 'T': 'A'}
        }
        
        # Build inverse table: inverse_table[Y_key][Z_mutated] = X_original
        inverse_table = {'A': {}, 'C': {}, 'G': {}, 'T': {}}
        for x_original, row in xor_table.items():
            for y_key, z_mutated in row.items():
                inverse_table[y_key][z_mutated] = x_original
                
        secret_key = settings.DNA_SECRET_KEY
        key_len = len(secret_key)
        
        original_dna = []
        for i, mutated_nuc in enumerate(mutated_dna):
            key_nucleotide = secret_key[i % key_len]
            original_nuc = inverse_table[key_nucleotide][mutated_nuc]
            original_dna.append(original_nuc)
            
        return "".join(original_dna)

crypto_service = CryptoService()
