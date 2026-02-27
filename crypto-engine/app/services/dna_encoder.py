import logging
from .chaos_service import chaos_service
from ..config import settings

logger = logging.getLogger(__name__)

class DNAEncoderService:
    # 1. Define 4 encoding rules as dictionaries
    RULES_ENCODE = {
        1: {"00": "A", "01": "C", "10": "G", "11": "T"},
        2: {"00": "C", "01": "G", "10": "T", "11": "A"},
        3: {"00": "G", "01": "T", "10": "A", "11": "C"},
        4: {"00": "T", "01": "A", "10": "C", "11": "G"}
    }
    
    # 1B. Deduce decoding rules by reversing the dictionaries
    RULES_DECODE = {
        rule_num: {v: k for k, v in mapping.items()} 
        for rule_num, mapping in RULES_ENCODE.items()
    }
    
    # XOR Table (Watson-Crick Pairing Logic)
    XOR_TABLE_FORWARD = {
        'A': {'A': 'A', 'C': 'G', 'G': 'C', 'T': 'T'},
        'C': {'A': 'G', 'C': 'A', 'G': 'T', 'T': 'C'},
        'G': {'A': 'C', 'C': 'T', 'G': 'A', 'T': 'G'},
        'T': {'A': 'T', 'C': 'C', 'G': 'G', 'T': 'A'}
    }
    
    # Reverse XOR Table mapped dynamically
    # inverse_table[Y_key][Z_mutated] = X_original
    XOR_TABLE_REVERSE = {'A': {}, 'C': {}, 'G': {}, 'T': {}}
    for x_original, row in XOR_TABLE_FORWARD.items():
        for y_key, z_mutated in row.items():
            XOR_TABLE_REVERSE[y_key][z_mutated] = x_original

    @staticmethod
    def _validate_binary(binary_string: str) -> None:
        if not all(c in "01" for c in binary_string):
            raise ValueError("Binary string must contain only 0 and 1 characters")

    @staticmethod
    def _validate_dna(dna_string: str) -> None:
        if not all(c in "ATCG" for c in dna_string):
            raise ValueError("DNA string must contain only A, T, C, G characters")
            
    def binary_to_dna_dynamic(self, binary_string: str, chaotic_sequence: list[float]) -> str:
        """
        Convert Binary to DNA base pairs using Chaotic sequential rules.
        """
        self._validate_binary(binary_string)
        
        # Pad binary if odd length
        if len(binary_string) % 2 != 0:
            binary_string += "0"
            
        dna_sequence = []
        seq_len = len(chaotic_sequence)
        
        if seq_len == 0:
            raise ValueError("Chaotic sequence cannot be empty")
            
        for i in range(0, len(binary_string), 2):
            bits = binary_string[i:i+2]
            
            # Use chaotic_index modulo sequence length to wrap safely
            chaotic_index = (i // 2) % seq_len
            x_n = chaotic_sequence[chaotic_index]
            
            rule_id = chaos_service.get_encoding_rule(x_n)
            mapping = self.RULES_ENCODE[rule_id]
            dna_sequence.append(mapping[bits])
            
        logger.info("Dynamic binary-to-dna encoding completed")
        return "".join(dna_sequence)

    def dna_to_binary_dynamic(self, dna_string: str, chaotic_sequence: list[float]) -> str:
        """
        Convert DNA back to a Binary string via reverse Chaotic mappings.
        """
        self._validate_dna(dna_string)
        
        binary_list = []
        seq_len = len(chaotic_sequence)
        
        if seq_len == 0:
            raise ValueError("Chaotic sequence cannot be empty")
            
        for i, char in enumerate(dna_string):
            x_n = chaotic_sequence[i % seq_len]
            rule_id = chaos_service.get_encoding_rule(x_n)
            
            mapping_inv = self.RULES_DECODE[rule_id]
            binary_list.append(mapping_inv[char])
            
        logger.info("Dynamic dna-to-binary decoding completed")
        return "".join(binary_list)

    def dna_xor(self, dna_string: str) -> str:
        """
        Mutates DNA by applying XOR encryption using the DNA_SECRET_KEY
        from the environment.
        """
        self._validate_dna(dna_string)
        
        # Fetch Key sequence directly from env inside method per secure module access
        key_sequence = settings.DNA_SECRET_KEY
        key_len = len(key_sequence)
        
        mutated_dna = []
        for i, nucleotide in enumerate(dna_string):
            key_nucleotide = key_sequence[i % key_len]
            mutated_nuc = self.XOR_TABLE_FORWARD[nucleotide][key_nucleotide]
            mutated_dna.append(mutated_nuc)
            
        logger.info("DNA XOR forward mutation executed")
        return "".join(mutated_dna)

    def dna_xor_reverse(self, mutated_dna: str) -> str:
        """
        Reverses the DNA XOR mutation using the DNA_SECRET_KEY to reconstruct original DNA.
        """
        self._validate_dna(mutated_dna)
        
        key_sequence = settings.DNA_SECRET_KEY
        key_len = len(key_sequence)
        
        original_dna = []
        for i, mutated_nuc in enumerate(mutated_dna):
            key_nucleotide = key_sequence[i % key_len]
            original_nuc = self.XOR_TABLE_REVERSE[key_nucleotide][mutated_nuc]
            original_dna.append(original_nuc)
            
        logger.info("DNA XOR reverse mutation executed")
        return "".join(original_dna)

dna_encoder = DNAEncoderService()
