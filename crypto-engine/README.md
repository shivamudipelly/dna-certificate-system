# DNA Crypto Engine

A high-security cryptographic microservice for encrypting sensitive data payloads into synthetic DNA sequences. Built with Python and FastAPI, this engine combines AES-256 encryption with Logistic Map Chaotic Sequences and Watson-Crick DNA encoding rules to provide a quantum-resistant layer of data protection and tamper verification.

---

## ⚡ Key Features

*   **Symmetric AES-256-CBC Encryption:** Industry-standard encryption with secure, randomized Initialization Vectors (IV).
*   **Chaotic Logistic Maps:** Generates a deterministic, highly-sensitive pseudo-random sequence ($x_{n+1} = r \times x_n \times (1 - x_n)$) seeded by the payload's SHA-256 hash.
*   **Dynamic DNA Encoding:** Translates binary ciphertexts into biological nucleotides (A, C, T, G) using 4 distinct substitution dictionaries dynamically selected by the chaotic sequence.
*   **Watson-Crick Mutation:** Applies a final bitwise-equivalent XOR substitution layer using a static DNA master key.
*   **Zero-Knowledge Tamper Detection:** Strict SHA-256 verification during decryption instantly rejects altered sequences with a `403 TAMPERED` error without leaking internal states.

---

## 🔒 Encryption Pipeline
When the `/encrypt` endpoint receives a JSON payload, the engine executes the following deterministic 9-step pipeline:

1.  **Generate Hash:** Computes the SHA-256 fingerprint of the sorted JSON data.
2.  **Envelope Data:** Bundles the original data and the SHA-256 hash into a single payload object.
3.  **AES-256 Encrypt:** Encrypts the envelope using AES-CBC and outputs a Base64 string.
4.  **Binary Translation:** Converts the Base64 ciphertext into a continuous binary stream (1s and 0s).
5.  **Seed Generation:** Derives a normalized floating-point Chaotic Seed ($x_0$) from the first 8 characters of the SHA-256 hash.
6.  **Chaos Generation:** Computes a logistic map sequence matching half the length of the binary stream.
7.  **DNA Encoding:** Iterates through the binary stream (2 bits at a time), selecting 1 of 4 translation rules based on the corresponding chaotic sequence value, resulting in a nucleotide string.
8.  **XOR Mutation:** Mutates the sequence against the environment `DNA_SECRET_KEY` using Watson-Crick pairing rules.
9.  **Output:** Returns the final mutated `dna_payload` and the `chaotic_seed` required for future decryption.

*(Decryption runs this pipeline in exact reverse, strictly validating the internal hash block against the decrypted JSON data.)*

---

## 🛠️ Installation & Setup

### Prerequisites
*   Python 3.10+
*   pip

### Setup Instructions

1.  **Clone the Repository and Navigate to the Engine:**
    ```bash
    cd crypto-engine
    ```

2.  **Create and Activate a Virtual Environment:**
    ```bash
    # Windows
    python -m venv venv
    .\venv\Scripts\activate

    # macOS / Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Configure Environment Variables:**
    Create a `.env` file in the `crypto-engine` directory:
    ```env
    PORT=8000
    AES_KEY="<base64_encoded_32_byte_key>"
    DNA_SECRET_KEY="<256_character_ATCG_string>"
    LOGISTIC_MAP_R="3.99"
    ```

5.  **Start the Server:**
    ```bash
    uvicorn app.main:app --reload
    ```
    The service will start on `http://localhost:8000`.

---

## 📡 API Reference

All endpoints are protected and require the `x-api-key` header matching the internal API Gateway Secret Token. You can explore and test the API interactively using the built-in Swagger UI at `http://localhost:8000/docs`.

### Authentication
*   **Header:** `x-api-key`
*   **Value:** `gateway-secret-token` *(default local dev value)*

### `POST /encrypt`
Encrypts a standard JSON dictionary into a DNA sequence.

**Request Body:**
```json
{
  "data": {
    "certificate_id": "CERT-2026-X",
    "student_name": "Jane Doe"
  }
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "dna_payload": "ATCGGCTAGCTAGCTA...",
  "chaotic_seed": "0.1128615055030355"
}
```

### `POST /decrypt`
Reverses a DNA payload back into the original JSON dictionary. Fails if the sequence was tampered with.

**Request Body:**
```json
{
  "dna_payload": "ATCGGCTAGCTAGCTA...",
  "chaotic_seed": "0.1128615055030355"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "certificate_id": "CERT-2026-X",
    "student_name": "Jane Doe"
  }
}
```

**Tampered Response (403 Forbidden):**
```json
{
  "success": false,
  "error": "TAMPERED"
}
```

### `GET /health`
Validates the microservice is operational.

**Success Response (200 OK):**
```json
{
  "status": "ok",
  "service": "Crypto Engine"
}
```
