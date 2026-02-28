import pytest
import base64
from app.services.aes_service import aes_service
from app.config import settings

def test_derive_key_from_env():
    key = aes_service.derive_key_from_env()
    assert len(key) == 32
    assert isinstance(key, bytes)

def test_aes_round_trip():
    key = aes_service.derive_key_from_env()
    data = {"test_string": "hello", "test_num": 1234}
    
    # Encrypt
    encrypted_str = aes_service.encrypt_data(data, key)
    assert isinstance(encrypted_str, str)
    
    # Decrypt
    decrypted_data = aes_service.decrypt_data(encrypted_str, key)
    assert decrypted_data == data

def test_invalid_types_for_encryption():
    key = aes_service.derive_key_from_env()
    with pytest.raises(TypeError):
        aes_service.encrypt_data("string_not_dict", key)

def test_invalid_decryption():
    key = aes_service.derive_key_from_env()
    with pytest.raises(ValueError):
        aes_service.decrypt_data("invalid_base64_string", key)
    with pytest.raises(ValueError):
        aes_service.decrypt_data("A" * 16, key)  # valid b64 but too short IV
    with pytest.raises(TypeError):
        aes_service.decrypt_data(123, key)

def test_aes_env_failure(monkeypatch):
    monkeypatch.setattr(settings, "AES_KEY", "invalid_base64$$")
    with pytest.raises(ValueError):
        aes_service.derive_key_from_env()

    monkeypatch.setattr(settings, "AES_KEY", base64.b64encode(b"short").decode())
    with pytest.raises(ValueError):
        aes_service.derive_key_from_env()
