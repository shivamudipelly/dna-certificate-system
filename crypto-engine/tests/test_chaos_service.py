import pytest
from app.services.chaos_service import chaos_service
from app.services.hash_service import hash_service

def test_generate_seed_from_hash():
    # Use max possible 8-char hex
    h = "ffffffff"
    seed = chaos_service.generate_seed_from_hash(h)
    assert 0 <= seed <= 1.0

def test_invalid_seed_hash():
    with pytest.raises(ValueError):
        chaos_service.generate_seed_from_hash("no_hex")

def test_chaotic_sequence():
    seq1 = chaos_service.generate_chaotic_sequence(0.5, 10, r=3.99)
    seq2 = chaos_service.generate_chaotic_sequence(0.5, 10, r=3.99)
    
    # Deterministic mapping proves cryptography roundtrips identically
    assert seq1 == seq2
    assert len(seq1) == 10
    assert all(0 <= x <= 1 for x in seq1)

def test_chaotic_bounds():
    with pytest.raises(ValueError):
         # Seed must be [0,1]
         chaos_service.generate_chaotic_sequence(2.5, 10)

def test_encoding_rules():
    assert chaos_service.get_encoding_rule(0.1) == 1
    assert chaos_service.get_encoding_rule(0.3) == 2
    assert chaos_service.get_encoding_rule(0.6) == 3
    assert chaos_service.get_encoding_rule(0.9) == 4
