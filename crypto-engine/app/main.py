from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import ValidationError
import json

from .config import settings
from .schemas import EncryptRequest, EncryptResponse, DecryptRequest, DecryptResponse
from .services.crypto import crypto_service

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(
    title="DNA Crypto Engine",
    description="Microservice for encrypting data into DNA sequences and verifying them.",
    version="1.0.0"
)

# Add rate limiter state to app
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allowed origins - Only API Gateway is allowed
origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Add Max Request Size Middleware (10KB limit)
MAX_REQUEST_SIZE = 10 * 1024 # 10 KB

@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail="Request body size exceeds the 10KB limit"
            )
            
    response = await call_next(request)
    return response

@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    return {"status": "ok", "service": "Crypto Engine"}

@app.post("/encrypt", response_model=EncryptResponse)
@limiter.limit("100/minute")
async def encrypt_data(request: Request, body: EncryptRequest):
    try:
        json_str = json.dumps(body.payload)
        
        data_hash = crypto_service.generate_sha256(json_str)
        b64_cipher = crypto_service.encrypt_aes(body.payload, data_hash)
        binary_stream = crypto_service.string_to_binary(b64_cipher)
        
        chaotic_sequence = crypto_service.generate_chaotic_sequence(data_hash, len(binary_stream) // 2)
        dna_sequence = crypto_service.dynamic_dna_encode(binary_stream, chaotic_sequence)
        final_dna_payload = crypto_service.watson_crick_xor_mutate(dna_sequence)
        
        # Return the derived seed (x0) so API Gateway can save it
        seed_hex = data_hash[:8]
        seed_decimal = int(seed_hex, 16)
        x0 = seed_decimal / 0xFFFFFFFF
        
        return {"success": True, "dna_payload": final_dna_payload, "chaotic_seed": x0}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Encryption failed: {str(e)}")

@app.post("/decrypt", response_model=DecryptResponse)
@limiter.limit("100/minute")
async def decrypt_data(request: Request, body: DecryptRequest):
    try:
        reverted_dna = crypto_service.revert_watson_crick_xor(body.dna_payload)
        
        # Determine sequence length
        # dna length == bits pairs length
        # length of chaos sequence = length of dna
        
        # Start at seed and iterate exactly the length of the string
        x_n = body.chaotic_seed
        r = settings.LOGISTIC_MAP_R
        chaotic_sequence = []
        for _ in range(len(reverted_dna)):
            x_n = r * x_n * (1 - x_n)
            chaotic_sequence.append(x_n)
            
        reverted_binary = crypto_service.dynamic_dna_decode(reverted_dna, chaotic_sequence)
        restored_b64 = crypto_service.binary_to_string(reverted_binary)
        decrypted_payload = crypto_service.decrypt_aes(restored_b64)
        
        recalculated_hash = crypto_service.generate_sha256(json.dumps(decrypted_payload["data"]))
        
        if recalculated_hash == decrypted_payload["hash"]:
            return {"status": "authentic", "data": decrypted_payload["data"]}
        else:
            return {"status": "tampered", "data": None}
            
    except Exception as e:
        return {"status": "tampered", "data": None}

