import asyncio
import time
import logging
from fastapi import FastAPI, Request, HTTPException, status, Depends
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from .config import settings
from .schemas import EncryptRequest, EncryptResponse, DecryptRequest, DecryptResponse
from .services.crypto_orchestrator import crypto_orchestrator, TamperedError

# Setup minimal sanitized logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger("api")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)

# Initialize FastAPI App
app = FastAPI(
    title="DNA Crypto Engine",
    description="Microservice for encrypting data into DNA sequences and verifying them.",
    version="1.0.0"
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Allowed origins
origins = [
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

MAX_REQUEST_SIZE = 10 * 1024 # 10 KB
REQUEST_TIMEOUT_SECONDS = 30

@app.middleware("http")
async def security_middleware(request: Request, call_next):
    # 1. Request logging (start)
    start_time = time.time()
    
    # 2. Body size limit
    if request.method in ["POST", "PUT", "PATCH"]:
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > MAX_REQUEST_SIZE:
            logger.warning(f"Request body size exceeded limit on {request.url.path}")
            return JSONResponse(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                content={"success": False, "error": "Request body size exceeds the 10KB limit"}
            )
            
    # 3. Timeout enforcement using asyncio.wait_for
    try:
        response = await asyncio.wait_for(call_next(request), timeout=REQUEST_TIMEOUT_SECONDS)
        
        # Log response status
        process_time = time.time() - start_time
        logger.info(f"[{request.method}] {request.url.path} - Status: {response.status_code} - Completed in {process_time:.3f}s")
        return response
        
    except asyncio.TimeoutError:
        logger.error(f"Request timeout on {request.url.path}")
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={"success": False, "error": "Request timed out"}
        )
    except Exception as e:
        logger.error(f"Internal unhandled error on {request.url.path}")
        # Sanitize all error messages (no stack traces)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"success": False, "error": "Internal server error"}
        )

# Simple API Key validation
API_KEY_SECRET = "gateway-secret-token" # In production, this goes to .env

api_key_header = APIKeyHeader(name="x-api-key", auto_error=False)

async def verify_api_key(api_key: str = Depends(api_key_header)):
    if api_key != API_KEY_SECRET:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API Key"
        )

@app.get("/health")
@limiter.limit("100/minute")
async def health_check(request: Request):
    return {"status": "ok", "service": "Crypto Engine"}

@app.post("/encrypt", response_model=EncryptResponse)
@limiter.limit("100/minute")
async def encrypt_data(request: Request, body: EncryptRequest, api_key: str = Depends(verify_api_key)):
    try:
        result = crypto_orchestrator.full_encrypt(body.data)
        return {"success": True, "dna_payload": result["dna_payload"], "chaotic_seed": result["chaotic_seed"]}
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid data provided for encryption")
    except Exception as e:
        logger.error("Encrypt Endpoint internal error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Encryption process failed")

@app.post("/decrypt", response_model=DecryptResponse)
@limiter.limit("100/minute")
async def decrypt_data(request: Request, body: DecryptRequest, api_key: str = Depends(verify_api_key)):
    try:
        data = crypto_orchestrator.full_decrypt(body.dna_payload, body.chaotic_seed)
        return {"success": True, "data": data}
        
    except TamperedError:
        # Return 403 Forbidden with false success standard per requirements
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={"success": False, "error": "TAMPERED"}
        )
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid DNA sequence or chaotic seed format")
    except Exception as e:
        logger.error("Decrypt Endpoint internal error")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Decryption process failed")
