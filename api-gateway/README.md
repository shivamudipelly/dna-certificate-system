# 📡 API Gateway - University Certification Microservice

The API Gateway is the central Node.js orchestrator of the University Certificate System. It manages the public-facing API, handles secure administrator authentication, routes cryptographic requests to the internal DNA engine, and maintains the primary metadata registry in MongoDB.

---

## ⚡ Core Responsibilities

- 🔐 **JWT Authentication & RBAC** — Issues and validates 24-hour JSON Web Tokens. Enforces granular route access for `SuperAdmin`, `HOD`, and `Clerk` roles.
- 🧬 **Crypto Orchestration** — Communicates with the internal Python Crypto Engine using high-speed Axios streams and shared `x-api-key` validation.
- 🗄️ **Metadata Registry** — Stores only the `public_id`, `dna_payload` (encrypted), `chaotic_seed`, and `certificate_hash`. Original student data is **never** stored in plaintext.
- 🖼️ **QR & Verification** — Generates Base64-encoded QR codes and unique verification URLs pointing directly to the public portal for every certificate issued.
- 🛡️ **Defensive Middleware** — Implements a robust security stack (Helmet, CORS, Rate Limiters, and XSS Sanitization) to block brute-force and injection attacks.

---

## 🏗️ Technical Architecture

- **Runtime:** Node.js 18.x (ESM)
- **Framework:** Express 5.x
- **Database:** MongoDB Atlas (Mongoose v8)
- **Security:** 
    - `jsonwebtoken` — HMAC-SHA256 tokens.
    - `bcryptjs` — Salted hashing for administrator passwords.
    - `express-rate-limit` — Brute-force and DDoS protection.
    - `express-validator` — Strict JSON schema enforcement.
- **Logging:** Winston (Rotated JSON logs for audit trails).

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- MongoDB instance (Local or Atlas)
- Running [Crypto Engine](../crypto-engine/)

### Setup Instructions
1.  **Clone and Install:**
    ```bash
    cd api-gateway
    npm install
    ```
2.  **Configure Environment:**
    Create a `.env` file based on `.env.example`:
    ```env
    PORT=5000
    MONGO_URI=mongodb+srv://...
    JWT_SECRET=super-secret-key
    CRYPTO_ENGINE_URL=http://localhost:8000
    ENGINE_API_KEY=shared-secret
    FRONTEND_URL=http://localhost:5173
    ```

### Running the API
```bash
npm run dev     # Development (with nodemon)
npm start       # Production
```

---

## 📡 API Endpoints (Pinch by Inch)

### 1. Authentication (`/api/auth`)
| Method | Endpoint | Access | Usage |
|---|---|---|---|
| `POST` | `/register` | Public | Register an administrator (SuperAdmin/HOD). |
| `POST` | `/login` | Public | Authenticate and receive a JWT. |
| `GET` | `/profile` | JWT Auth | Returns current admin identity. |

### 2. Certificates (`/api/certificates`)
| Method | Endpoint | Access | Role | Usage |
|---|---|---|---|---|
| `POST` | `/` | JWT Auth | HOD/S.Admin | Encrypt & Issue a new certificate. |
| `GET` | `/` | JWT Auth | Any Admin | View registry (paginated, metadata-only). |
| `GET` | `/verify/:id` | Public | None | Decrypt & Verify a certificate ID. |
| `PUT` | `/:id/revoke` | JWT Auth | SuperAdmin | Permantly revoke a record. |

---

## 🧪 Testing and Quality Control

We maintain a high-coverage test suite using Jest.
```bash
npm test                      # Run all unit and integration tests
npm test -- tests/auth.js     # Run specific test suite
```

### Coverage Thresholds
- **Statements:** 85%+
- **Branches:** 75%+
- **Functions:** 90%+

---

## 📁 System Directory Breakdown

- `src/controllers/` — Request handlers and primary business logic.
- `src/models/` — Mongoose schemas for `Admin`, `Certificate`, and `AuditLog`.
- `src/routes/` — Endpoint definitions and role-aware middleware attachments.
- `src/services/` — The `pythonService` bridge and `qrService` barcode logic.
- `src/middleware/` — Auth guards, role authorization, and the universal `errorHandler`.
- `tests/` — Automated test suites for all core functionality.
