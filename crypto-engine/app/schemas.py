from pydantic import BaseModel, Field
from typing import Dict, Any, Optional

class EncryptRequest(BaseModel):
    data: Dict[str, Any] = Field(..., description="JSON data dict to encrypt")

class EncryptResponse(BaseModel):
    success: bool
    dna_payload: Optional[str] = None
    chaotic_seed: Optional[str] = None
    
class DecryptRequest(BaseModel):
    dna_payload: str = Field(..., description="DNA sequence to decrypt")
    chaotic_seed: str = Field(..., description="The original chaotic seed used for encryption (x0)")
    
class DecryptResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
