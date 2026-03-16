# 🧬 University Crypto Engine - DNA Cryptography Microservice

A high-performance Python microservice dedicated to encrypting sensitive academic data into synthetic DNA sequences. Built with FastAPI and Python 3.11, the UC-Engine combines industry-standard AES-256-CBC encryption with deterministic **Chaotic Logistic Map sequences** and **Watson-Crick DNA encoding** rules.

---

## ⚡ Core Security Features (Pinch by Inch)

- 🔒 **Symmetric AES-256-CBC** — Industry-standard encryption with randomized Initialization Vectors (IV).
- 🧬 **Chaotic Logistic Maps** — Generates a highly-sensitive pseudo-random sequence ($x_{n+1} = r \times x_n \times (1 - x_n)$) seeded by the payload's unique SHA-256 hash.
- 🔠 **Dynamic DNA Translation** — Converts binary ciphertexts into biological nucleotides (A, C, T, G) using 4 distinct substitution dictionaries selected dynamically by the chaotic sequence.
- 🧬 **Watson-Crick Mutation** — Applies a final bitwise-equivalent XOR layer against a static 256-character DNA master key for extra-depth security.
- 🛡️ **Zero-Knowledge Tamper Protection** — Self-verifying SHA-256 checks during decryption. If even a single bit of the DNA sequence is altered, the engine will fail with a `403 TAMPERED` error.

---

## 🏗️ Technical Pipeline

When the `/encrypt` endpoint is triggered, the engine executes a deterministic 9-step cryptographic workflow:

1.  **Normalization** — The incoming JSON payload is sorted and formatted.
2.  **SHA-256 Fingerprinting** — Computes the cryptographic hash of the data.
3.  **Data Enveloping** — Bundles the raw data + SHA-256 hash into a single binary block.
4.  **AES-256-CBC Layer** — Encrypts the envelope with the system's `AES_KEY`.
5.  **Binary Serialization** — Translates the ciphertext into a raw bitstream.
6.  **Chaotic Seed Derivation** — Normalizes the first 8 characters of the SHA-256 hash into a floating-point seed ($x_0$).
7.  **Dynamic Substitution** — Iterates through bit-pairs, mapping them to (A, T, C, G) using the logistic map's current state.
8.  **XOR Mutation** — Applies the `DNA_SECRET_KEY` mutation layer.
9.  **Output Generation** — Returns the final `dna_payload` string and its corresponding `chaotic_seed`.

*(The decryption process runs this pipeline in exact reverse to reconstruct the original validated record.)*

---

## 🛠️ Stack & Runtime

- **Runtime:** Python 3.10 / 3.11 / 3.12+
- **Framework:** FastAPI (High performance, Asynchronous)
- **Deployment Server:** Uvicorn (ASGI)
- **Encryption Engine:** `cryptography` (Fernet-compatible AES-256)
- **Data Validation:** Pydantic v2 (Strict type schemas)
- **Security:** `python-jose` (JSON Web Token utilities)

---

## 🚀 Getting Started

### Prerequisites
- Python 3.10+
- pip (Python Package Installer)

### Installation
1.  **Navigate and Install:**
    ```bash
    cd crypto-engine
    pip install -r requirements.txt
    ```
2.  **Configure Environment:**
    Create a `.env` file based on `.env.example`:
    ```env
    PORT=8000
    AES_KEY="your-32-byte-base64-key"
    DNA_SECRET_KEY="256-character-ATCG-string"
    LOGISTIC_MAP_R="3.99"
    ENGINE_API_KEY="shared-gateway-secret"
    ```

### Running the Engine
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```
The service will be available internally at `http://localhost:8000`.

---

## 📡 API Specification

> ⚠️ **Note:** This service is **internal-only**. It must not be exposed to the public internet. It validates all requests via the `x-api-key` header matching the API Gateway's shared secret.

### Endpoints
| Path | Method | Headers | Description |
|---|---|---|---|
| `/encrypt` | `POST` | `x-api-key` | Encodes JSON into a DNA string. |
| `/decrypt` | `POST` | `x-api-key` | Decodes DNA into JSON (or returns 403). |
| `/health` | `GET` | None | Returns service status. |

---

## 🧪 Testing & Reliability

Comprehensive unit tests cover all cryptographic modules.
```bash
pytest          # Run core tests
pytest -v       # Run with verbose output
```

### Coverage Areas
- **`test_aes_service`** — Verifies encryption and decryption for various sizes.
- **`test_chaos_service`** — Ensures deterministic logistic sequence generation.
- **`test_dna_encoder`** — Validates nucleotide substitution accuracy.
- **`test_hash_service`** — Verifies SHA-256 integrity checks.
- **`test_endpoints`** — Integration tests for FastAPI routes.
