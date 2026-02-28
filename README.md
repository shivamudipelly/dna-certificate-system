# 🧬 DNA Certificate Verification System

> A production-grade, microservices-based platform that issues and verifies academic certificates using DNA-encoding cryptography — combining AES-256 encryption, SHA-256 hashing, and chaotic logistic map DNA encoding to ensure tamper-proof certificate integrity.

[![Node.js](https://img.shields.io/badge/Node.js-18-green)](https://nodejs.org) [![Python](https://img.shields.io/badge/Python-3.11-blue)](https://python.org) [![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org) [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/atlas) [![Docker](https://img.shields.io/badge/Docker-Compose-2496ED)](https://docker.com)

---

## ✨ Features

- 🔐 **DNA-Encoded Certificates** — Certificate data is encrypted into a DNA nucleotide sequence (A, T, C, G) using AES-256 + chaotic logistic map encoding
- 🛡️ **Tamper Detection** — Any modification to the stored DNA payload is cryptographically detected on verification and flagged as `TAMPERED`
- 📱 **QR Code Generation** — Each certificate gets a unique public URL and scannable QR code for instant verification
- 👤 **Role-Based Access** — Three admin roles: `Clerk`, `HOD`, `SuperAdmin` with JWT-protected routes
- 🌐 **Public Verification Portal** — Anyone can verify a certificate without creating an account
- ⚡ **Rate Limiting** — Brute-force protection (5 login attempts/min) and DDoS protection (100 req/min/IP)
- 🏗️ **Microservices Architecture** — Three independent, containerized services that communicate over an internal Docker network
- 🚀 **Production-Ready** — Docker Compose, Vercel (frontend), Render.com (backend services), MongoDB Atlas

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PUBLIC INTERNET                       │
└───────────────────────┬──────────┬──────────────────────┘
                        │          │
              ┌─────────▼──┐  ┌────▼──────────────────┐
              │  Frontend   │  │     API Gateway        │
              │ React/Vite  │  │  Node.js / Express     │
              │  nginx:80   │◄─┤     Port 5000          │
              │  (Vercel)   │  │  JWT Auth, MongoDB,    │
              └─────────────┘  │  QR Code, Rate Limit   │
                               └────────────┬───────────┘
                                            │ Internal only
                                            │ x-api-key header
                               ┌────────────▼───────────┐
                               │    Crypto Engine         │
                               │  Python / FastAPI        │
                               │     Port 8000            │
                               │  AES-256, DNA Encode,    │
                               │  SHA-256, Chaotic Map    │
                               └────────────────────────┘
                                            │
                               ┌────────────▼───────────┐
                               │     MongoDB Atlas        │
                               │  public_id, dna_payload  │
                               │  chaotic_seed, status    │
                               └────────────────────────┘
```

- **Frontend** (`:80` / Vercel) — React + Vite + TypeScript. Admin dashboard and public verification portal.
- **API Gateway** (`:5000` / Render) — Node.js + Express. Manages authentication, certificate issuance, QR generation, and MongoDB operations.
- **Crypto Engine** (`:8000` / Render private) — Python + FastAPI. Provides AES-256 encryption, SHA-256 hashing, and DNA encoding/decoding. **Never publicly exposed.**
- **MongoDB Atlas** — Stores only `public_id`, encrypted `dna_payload`, `chaotic_seed`, and metadata. No PII in plaintext.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| API Gateway | Node.js 18, Express, Mongoose, JWT, Winston |
| Crypto Engine | Python 3.11, FastAPI, Uvicorn, cryptography lib |
| Database | MongoDB Atlas (cloud) |
| Containerization | Docker, Docker Compose |
| Frontend Deploy | Vercel |
| Backend Deploy | Render.com |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Git

### 1. Clone the repository
```bash
git clone https://github.com/your-org/dna-certificate-system.git
cd dna-certificate-system
```

### 2. Configure environment variables
```bash
# Crypto Engine
cp crypto-engine/.env.example crypto-engine/.env

# API Gateway
cp api-gateway/.env.example api-gateway/.env

# Frontend
cp frontend/.env.example frontend/.env
```

Open each `.env` file and fill in the required values (see [Environment Variables](#-environment-variables) below).

### 3. Generate cryptographic keys
```bash
# AES-256 key (32 bytes, base64-encoded)
openssl rand -base64 32

# JWT secret (64-byte hex string)
openssl rand -hex 64

# Shared API key between gateway and engine
openssl rand -hex 32
```

### 4. Start all services with Docker
```bash
docker-compose up --build
```

### 5. Access the application
| Service | URL |
|---|---|
| Frontend | http://localhost |
| API Gateway | http://localhost:5000 |
| Crypto Engine | http://localhost:8000 |
| API Health | http://localhost:5000/api/health |

### 6. Create your first admin account
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@university.edu","password":"SecurePass123","role":"SuperAdmin","department":"IT"}'
```

---

## 🌐 Deployment

See [docs/deployment.md](docs/deployment.md) for the full production deployment guide.

**Quick summary:**
- **Frontend** → Deploy to [Vercel](https://vercel.com) (auto-deploys from `main` branch via `frontend/vercel.json`)
- **API Gateway** → Deploy to [Render.com](https://render.com) as a public web service
- **Crypto Engine** → Deploy to [Render.com](https://render.com) as a **private service** (not publicly accessible)
- **Database** → [MongoDB Atlas](https://cloud.mongodb.com) free tier cluster

The root `render.yaml` defines both backend services and can be imported directly into Render.

---

## 🔧 Environment Variables

### `crypto-engine/.env`
| Variable | Description | Example |
|---|---|---|
| `AES_KEY` | Base64-encoded 32-byte AES-256 key | `openssl rand -base64 32` |
| `DNA_SECRET_KEY` | 256-character ATCG sequence (mutation key) | `ATCGATCG...` |
| `LOGISTIC_MAP_R` | Chaotic map parameter (3.57–4.0) | `3.99` |
| `ENGINE_API_KEY` | Shared secret with API Gateway | `openssl rand -hex 32` |

### `api-gateway/.env`
| Variable | Description | Example |
|---|---|---|
| `PORT` | Port to listen on | `5000` |
| `MONGO_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `JWT_SECRET` | JWT signing secret | `openssl rand -hex 64` |
| `CRYPTO_ENGINE_URL` | URL of crypto engine | `http://crypto-engine:8000` |
| `ENGINE_API_KEY` | Must match crypto engine value | Same as above |
| `FRONTEND_URL` | Allowed CORS origin | `https://your-app.vercel.app` |

### `frontend/.env`
| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | API Gateway base URL | `http://localhost:5000/api` |

---

## 🧪 Running Tests

```bash
# API Gateway (Jest)
cd api-gateway && npm test

# Crypto Engine (pytest)
cd crypto-engine && pytest tests/ -v

# Frontend (Vitest)
cd frontend && npm test
```

---

## 📁 Project Structure

```
dna-certificate-system/
├── crypto-engine/         # Python FastAPI — DNA encryption core
│   ├── app/
│   │   ├── main.py        # FastAPI routes (/health, /encrypt, /decrypt)
│   │   ├── config.py      # Environment settings (pydantic-settings)
│   │   ├── schemas.py     # Pydantic request/response models
│   │   └── services/      # Crypto orchestrator, AES, DNA, SHA-256
│   ├── Dockerfile
│   └── requirements.txt
│
├── api-gateway/           # Node.js Express — Auth, certs, QR, DB
│   ├── src/
│   │   ├── server.js      # Entry point (middleware stack)
│   │   ├── controllers/   # authController, certificateController
│   │   ├── routes/        # authRoutes, certificateRoutes
│   │   ├── models/        # Admin, Certificate (Mongoose schemas)
│   │   ├── middleware/    # authMiddleware, errorHandler
│   │   ├── services/      # pythonService, qrService, tokenService
│   │   └── utils/         # logger (Winston)
│   ├── Dockerfile
│   └── package.json
│
├── frontend/              # React + Vite + TypeScript
│   ├── src/
│   │   ├── pages/         # LoginPage, Dashboard, VerifyPage, etc.
│   │   ├── components/    # UI components
│   │   ├── services/      # axios API client
│   │   ├── context/       # AuthContext (JWT in memory)
│   │   └── types/         # TypeScript type definitions
│   ├── Dockerfile         # Multi-stage: Vite build → nginx serve
│   ├── nginx.conf         # SPA routing, gzip, security headers
│   └── vercel.json
│
├── docker-compose.yml     # All 3 services + networking
├── render.yaml            # Render.com deployment blueprint
├── docs/                  # Full documentation
└── README.md
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make changes and add tests
4. Run all tests: ensure they pass across all services
5. Commit with a descriptive message
6. Open a Pull Request against `main`

**Code standards:**
- Node.js: ESM modules, async/await, proper error handling via `next(error)`
- Python: type hints, Pydantic models, no bare `except`
- All secrets via environment variables — never hardcoded

---

## 📄 Documentation

| Document | Description |
|---|---|
| [Architecture](docs/architecture.md) | System design, data flow, component descriptions |
| [API Specification](docs/api-spec.md) | All endpoints, request/response formats, error codes |
| [Security](docs/security.md) | Threat model, security measures, compliance |
| [Deployment](docs/deployment.md) | Production deployment, env config, monitoring |
| [User Guide](docs/user-guide.md) | Admin and verifier usage guides |

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.
