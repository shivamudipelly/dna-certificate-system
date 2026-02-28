import pytest
from app.services.dna_encoder import dna_encoder
from app.config import settings

def test_binary_to_dna():
    binary = "10110001"
    # Provide a simple sequence array of exactly 4 mappings
    chaotic_seq = [0.1, 0.4, 0.6, 0.9] # Triggers Rule 1, 2, 3, 4 sequentially

    # "10" mapping: Rule 1 -> G
    # "11" mapping: Rule 2 -> A
    # "00" mapping: Rule 3 -> G 
    # "01" mapping: Rule 4 -> A
    expected_dna = "GAGA"
    
    encoded = dna_encoder.binary_to_dna_dynamic(binary, chaotic_seq)
    assert encoded == expected_dna

    # Test Decoding backwards
    decoded_binary = dna_encoder.dna_to_binary_dynamic(encoded, chaotic_seq)
    assert decoded_binary == binary

def test_odd_length_binary_padding():
    # If binary length odd, it appends a '0'
    binary = "101"
    seq = [0.1] # Just use rule 1 for mapping
    # 10 10 -> rule 1 -> G, G
    
    encoded = dna_encoder.binary_to_dna_dynamic(binary, seq)
    assert encoded == "GG"

    # The decoded padding string remains appended 
    decoded = dna_encoder.dna_to_binary_dynamic(encoded, seq)
    assert decoded == "1010"

def test_dna_xor():
    original_dna = "ATCG"
    
    mutated = dna_encoder.dna_xor(original_dna)
    assert isinstance(mutated, str)
    assert len(mutated) == len(original_dna)
    
    # Needs to accurately reverse the XOR logic using the key maps securely
    restored = dna_encoder.dna_xor_reverse(mutated)
    assert restored == original_dna

def test_invalid_binary():
    with pytest.raises(ValueError):
        dna_encoder.binary_to_dna_dynamic("12A", [0.5])

def test_invalid_dna():
    with pytest.raises(ValueError):
        dna_encoder.dna_to_binary_dynamic("XYZ", [0.5])

    with pytest.raises(ValueError):
        dna_encoder.dna_xor("XYZ")
        
def test_empty_sequence():
    with pytest.raises(ValueError):
        dna_encoder.binary_to_dna_dynamic("1010", [])

    with pytest.raises(ValueError):
        dna_encoder.dna_to_binary_dynamic("ATCG", [])
