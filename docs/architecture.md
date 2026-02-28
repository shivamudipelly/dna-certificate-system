# System Architecture

## Overview

The DNA Certificate System is a **three-tier microservices architecture** designed around the principle of cryptographic separation of concerns. No single service holds all the information needed to compromise a certificate — the encryption keys live only in the Crypto Engine, while MongoDB holds only the encrypted DNA payload.

---

## Component Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                         PUBLIC INTERNET                           │
│                                                                    │
│  Admin Browser ──────────────────────┐                            │
│  Verifier Browser ────────────────┐  │                            │
└───────────────────────────────────┼──┼────────────────────────────┘
                                    │  │
                         ┌──────────▼──▼─────────┐
                         │      FRONTEND           │
                         │  React 18 + TypeScript  │
                         │  Built by Vite          │
                         │  Served by nginx        │
                         │  Hosted: Vercel         │
                         │  Port: 80 (public)      │
                         └───────────┬─────────────┘
                                     │ HTTPS (VITE_API_URL)
                                     │ CORS: only this origin allowed
                         ┌───────────▼─────────────┐
                         │      API GATEWAY          │
                         │  Node.js 18 + Express     │
                         │  Hosted: Render.com       │
                         │  Port: 5000 (public)      │
                         │                           │
                         │  • JWT authentication     │
                         │  • Rate limiting          │
                         │  • Input validation       │
                         │  • MongoDB operations     │
                         │  • QR code generation     │
                         │  • Audit logging          │
                         └──────────┬────────────────┘
                                    │ Internal only
                                    │ x-api-key header
                                    │ Docker service name: crypto-engine
                         ┌──────────▼────────────────┐
                         │      CRYPTO ENGINE          │
                         │  Python 3.11 + FastAPI      │
                         │  Hosted: Render.com         │
                         │  Port: 8000 (PRIVATE)       │
                         │                             │
                         │  • AES-256-CBC encryption   │
                         │  • SHA-256 hashing          │
                         │  • DNA base encoding        │
                         │  • Chaotic logistic map     │
                         │  • HMAC tamper detection    │
                         └──────────┬──────────────────┘
                                    │
                         ┌──────────▼────────────────┐
                         │       MONGODB ATLAS         │
                         │   Cloud-managed NoSQL DB    │
                         │                             │
                         │  Stores ONLY:               │
                         │  • public_id (UUID subset)  │
                         │  • dna_payload (encrypted)  │
                         │  • chaotic_seed             │
                         │  • status (active/revoked)  │
                         │  • metadata (timestamps)    │
                         │                             │
                         │  NO plaintext PII stored    │
                         └────────────────────────────┘
```

---

## Component Descriptions

### Frontend (React + Vite)

The user-facing layer served by nginx. Compiled to static assets at build time.

**Responsibilities:**
- Admin login form with JWT storage in memory (never localStorage)
- Admin dashboard: issue certificates, view certificate list, see QR codes
- Public verification portal: enter `public_id` or scan QR code → see certificate data or tamper alert
- Responsive design (Tailwind CSS)

**Key files:** `src/pages/`, `src/context/AuthContext`, `src/services/` (axios client)

### API Gateway (Node.js + Express)

The only publicly accessible backend. Acts as orchestrator between frontend and the private crypto service.

**Responsibilities:**
- JWT-based authentication (`jsonwebtoken` + bcryptjs)
- Input validation and XSS sanitization (`express-validator` + custom middleware)
- Rate limiting: 5 login attempts/min, 100 API requests/min
- Forwarding encryption/decryption requests to the Crypto Engine with `x-api-key`
- Storing only encrypted data in MongoDB (never plaintext certificate fields)
- Generating QR codes pointing to the public verification URL
- Structured audit logging (`winston-daily-rotate-file`)

### Crypto Engine (Python + FastAPI)

An internal-only microservice. **Never directly accessible from the internet.**

**Responsibilities:**
- Receives raw certificate JSON → returns `dna_payload` + `chaotic_seed`
- Receives `dna_payload` + `chaotic_seed` → returns decrypted certificate data OR `TAMPERED`
- All cryptographic operations occur in isolated Python services

**Encryption pipeline:**
```
Certificate JSON
       │
       ▼
  SHA-256 Hash  ─────────────────────────▶ appended to data for integrity
       │
       ▼
  AES-256-CBC  ─────────────────────────▶ encrypted bytes
(key from AES_KEY env var)
       │
       ▼
  Chaotic Logistic Map  ────────────────▶ generates dynamic substitution table
(seeded by LOGISTIC_MAP_R)
       │
       ▼
  DNA Base Encoding  ───────────────────▶ bytes → ATCG nucleotide string
(mutated by DNA_SECRET_KEY)
       │
       ▼
  dna_payload (string) + chaotic_seed (float)
```

**Decryption pipeline (verification):**
```
dna_payload + chaotic_seed
       │
       ▼
  DNA Base Decoding (reverse substitution with same seed)
       │
       ▼
  AES-256-CBC Decrypt
       │
       ▼
  SHA-256 Integrity Check ──── MISMATCH? ──▶ raise TamperedError → HTTP 403
       │
       ▼  MATCH
  Original Certificate JSON
```

---

## Data Flow Diagrams

### Certificate Issuance Flow

```
Admin                Frontend              API Gateway           Crypto Engine         MongoDB
  │                      │                     │                      │                   │
  │── POST /login ───────►                      │                      │                   │
  │                      │── POST /api/auth/login                      │                   │
  │                      │                     │── verify password     │                   │
  │                      │◄── JWT token ────────                      │                   │
  │◄── dashboard ─────────                      │                      │                   │
  │                      │                     │                      │                   │
  │── fill cert form ────►                      │                      │                   │
  │                      │── POST /api/certificates ──────────────────►│                   │
  │                      │   {name,roll,degree,cgpa,year}  ──encrypt──►│                   │
  │                      │                     │◄── {dna_payload, chaotic_seed}            │
  │                      │                     │                                           │
  │                      │                     │── INSERT {public_id, dna_payload, ..} ───►
  │                      │                     │── generate QR code                        │
  │                      │◄── {public_id, qr_code, verification_url}   │                   │
  │◄── QR code displayed ─                      │                      │                   │
```

### Certificate Verification Flow

```
Verifier              Frontend              API Gateway           Crypto Engine         MongoDB
   │                     │                     │                      │                   │
   │── scan QR / enter ID►                     │                      │                   │
   │                     │── GET /api/certificates/verify/:public_id  │                   │
   │                     │                     │── findOne({public_id}) ─────────────────►│
   │                     │                     │◄── {dna_payload, chaotic_seed} ──────────│
   │                     │                     │                      │                   │
   │                     │                     │── POST /decrypt ─────►                   │
   │                     │                     │   {dna_payload, chaotic_seed}            │
   │                     │                     │                      │── DNA decode       │
   │                     │                     │                      │── AES decrypt      │
   │                     │                     │                      │── SHA-256 verify   │
   │                     │                     │                      │                   │
   │                     │          ┌──────────┼── TAMPERED? ◄─────── │                   │
   │                     │          │          │                      │                   │
   │                     │          │          │◄── {data: cert JSON}  │                   │
   │                     │◄── cert data ────────                      │                   │
   │◄── green valid card ─                     │                      │                   │
   │ OR red tamper alert  │                     │                      │                   │
```

---

## Security Architecture

See [security.md](security.md) for the full threat model.

**Key security decisions:**

| Decision | Rationale |
|---|---|
| Crypto Engine is private (no public port) | Eliminates direct attack surface on encryption keys |
| DNA payload stored, not plaintext | A compromised DB yields no readable data |
| JWT in memory only | Prevents XSS-based token theft from localStorage |
| Rate limiting on all public routes | Prevents brute force and scraping |
| Separate `x-api-key` authentication between services | Internal services cannot be called without the shared secret |
| SHA-256 hash embedded in encrypted payload | DB modifications detected on first verification attempt |

---

## Scalability Considerations

| Concern | Current Approach | Scaling Path |
|---|---|---|
| Crypto Engine CPU | 2 uvicorn workers | Horizontal scaling — add replicas |
| API Gateway | Single Node process | PM2 cluster mode or Kubernetes pods |
| Database reads | Mongoose indexed on `public_id` | MongoDB Atlas auto-scaling, read replicas |
| QR generation | In-process, synchronous | Offload to a queue (BullMQ) for high volume |
| Static assets | nginx gzip + immutable cache headers | CDN (already true on Vercel) |
