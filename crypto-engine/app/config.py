from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
from dotenv import load_dotenv
import base64
import os

# Force load dotenv file
load_dotenv()

class Settings(BaseSettings):
    PORT: int = Field(default=8000, description="Port to run the crypto-engine on")
    AES_KEY: str = Field(..., description="32-byte Base64 encoded AES key")
    DNA_SECRET_KEY: str = Field(..., description="256 character A/T/C/G string")
    LOGISTIC_MAP_R: float = Field(default=3.99, description="Chaotic parameter r")
    ENGINE_API_KEY: str = Field(..., description="API Key for validating requests from Gateway")
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    @field_validator("AES_KEY")
    @classmethod
    def validate_aes_key(cls, v: str) -> str:
        try:
            decoded = base64.b64decode(v)
            if len(decoded) != 32:
                raise ValueError("AES_KEY must decode to exactly 32 bytes")
        except Exception:
            raise ValueError("AES_KEY must be a valid base64 encoded string of 32 bytes")
        return v
    
    @field_validator("DNA_SECRET_KEY")
    @classmethod
    def validate_dna_key(cls, v: str) -> str:
        if len(v) != 256:
            raise ValueError("DNA_SECRET_KEY must be exactly 256 characters long")
        if not all(c in "ATCG" for c in v):
            raise ValueError("DNA_SECRET_KEY must contain only A, T, C, G characters")
        return v
    
    @field_validator("LOGISTIC_MAP_R")
    @classmethod
    def validate_logistic_map(cls, v: float) -> float:
        if not (3.57 < v <= 4.0):
            raise ValueError("LOGISTIC_MAP_R must be between 3.57 and 4.0 for chaos")
        return v

# Instantiate settings to validate environment variables on module load
settings = Settings()
