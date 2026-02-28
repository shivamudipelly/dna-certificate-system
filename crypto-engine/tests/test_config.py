import pytest
from app.config import Settings

def test_config_validation():
    with pytest.raises(ValueError):
        Settings(AES_KEY="not_base64$$", DNA_SECRET_KEY="A"*256, LOGISTIC_MAP_R=3.99, ENGINE_API_KEY="test")
    with pytest.raises(ValueError):
        Settings(AES_KEY="AAAA", DNA_SECRET_KEY="A"*256, LOGISTIC_MAP_R=3.99, ENGINE_API_KEY="test")
    with pytest.raises(ValueError):
        Settings(AES_KEY="A"*43+"=", DNA_SECRET_KEY="A"*255, LOGISTIC_MAP_R=3.99, ENGINE_API_KEY="test")
    with pytest.raises(ValueError):
        Settings(AES_KEY="A"*43+"=", DNA_SECRET_KEY="A"*255+"X", LOGISTIC_MAP_R=3.99, ENGINE_API_KEY="test")
    with pytest.raises(ValueError):
        Settings(AES_KEY="A"*43+"=", DNA_SECRET_KEY="A"*256, LOGISTIC_MAP_R=3.0, ENGINE_API_KEY="test")
