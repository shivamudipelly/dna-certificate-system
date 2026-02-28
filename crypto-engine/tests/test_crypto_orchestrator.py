import pytest
from app.services.crypto_orchestrator import crypto_orchestrator, TamperedError

def test_crypto_orchestrator_exceptions():
    with pytest.raises(ValueError):
        crypto_orchestrator.full_encrypt("not_dict")
    with pytest.raises(TamperedError):
        crypto_orchestrator.full_decrypt("not_string", 0.5)
    with pytest.raises(ValueError):
        crypto_orchestrator.full_decrypt("ATCG", "not_float")
