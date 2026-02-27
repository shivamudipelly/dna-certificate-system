from pydantic import BaseModel, Field
from typing import Dict, Any

class EncryptRequest(BaseModel):
    # Will accept any dict for payload, but usually it contains student info
    payload: Dict[str, Any] = Field(..., description="JSON payload to encrypt into DNA")

class EncryptResponse(BaseModel):
    success: bool
    dna_payload: str = Field(..., description="Resulting DNA sequence")
    chaotic_seed: float = Field(..., description="The original chaotic seed used for encryption (x0) to store in the DB")
    
class DecryptRequest(BaseModel):
    dna_payload: str = Field(..., description="DNA sequence to decrypt")
    chaotic_seed: float = Field(..., description="The original chaotic seed used for encryption (x0)")
    
class DecryptResponse(BaseModel):
    status: str = Field(..., description="'authentic' or 'tampered'")
    data: Dict[str, Any] | None = Field(default=None, description="Decrypted payload if authentic")
    issued_at: str | None = Field(default=None)
    verification_timestamp: str | None = Field(default=None)
