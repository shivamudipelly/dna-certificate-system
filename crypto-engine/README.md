# Crypto Engine Microservice

This microservice handles the high-security cryptography sequence within the DNA Certificate Verification System.

The application receives generic JSON certificate payloads and converts them into an immutable `dna_payload` string utilizing AES-256 Encryption, SHA-256 Hashing, Logistic Chaotic Maps, Dynamic ASCII-DNA Encoding, and Watson-Crick XOR Mutation.

## Requirements
- Python 3.12 or newer
- Virtual Environment Module

## Configuration
Before running the application, make sure your `.env` is fully populated.
Note: Your `AES_KEY` must be a valid 32 byte Base64-Encoded String. Your `DNA_SECRET_KEY` must be a 256 character text sequence containing only `A`, `C`, `G`, and `T`.

You can generate a valid new `AES_KEY` in python via:
```python
import os, base64; print(base64.b64encode(os.urandom(32)).decode('utf-8'))
```

You can generate a valid new `DNA_SECRET_KEY` in python via:
```python
import random; print(''.join(random.choices(['A', 'C', 'G', 'T'], k=256)))
```

## Running the Engine
1. Start your local virtual environment:
   ```bash
   .\venv\Scripts\activate
   ```
2. Install the rigid package dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Start the uvicorn live-reloading development server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
4. Access the API documentation at `http://localhost:8000/docs`.
