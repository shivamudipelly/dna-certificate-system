import pytest
from app.services.hash_service import hash_service

def test_generate_sha256():
    data1 = {"b": 2, "a": 1}
    data2 = {"a": 1, "b": 2} # Should generate the exact same hash
    h1 = hash_service.generate_sha256(data1)
    h2 = hash_service.generate_sha256(data2)
    assert h1 == h2
    assert isinstance(h1, str)
    assert len(h1) == 64 # SHA-256 output length

def test_verify_hash():
    data = {"b": 2, "a": 1}
    h = hash_service.generate_sha256(data)
    assert hash_service.verify_hash(data, h) is True
    assert hash_service.verify_hash(data, "wrong_hash_string") is False

def test_invalid_hash_types():
    with pytest.raises(TypeError):
        hash_service.generate_sha256("string_not_dict")
    assert hash_service.verify_hash("string", "hash") is False
