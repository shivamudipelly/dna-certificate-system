# Deployment Guide

## Local Development

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 4.x
- Git
- (Optional) Node.js 18+ and Python 3.11+ for running services outside Docker

### Step 1 — Clone and Configure

```bash
git clone https://github.com/your-org/dna-certificate-system.git
cd dna-certificate-system
```

Copy example env files:
```bash
cp crypto-engine/.env.example crypto-engine/.env
cp api-gateway/.env.example api-gateway/.env
cp frontend/.env.example frontend/.env
```

### Step 2 — Generate Secrets

```bash
# AES-256 key (32 bytes, base64) → paste as AES_KEY
openssl rand -base64 32

# JWT signing key (64 bytes, hex) → paste as JWT_SECRET
openssl rand -hex 64

# Shared API key between services → paste as ENGINE_API_KEY in BOTH .env files
openssl rand -hex 32
```

For `DNA_SECRET_KEY`: generate a 256-character string containing only `A`, `T`, `C`, `G`.

### Step 3 — Fill Environment Files

**`crypto-engine/.env`**
```
AES_KEY=<32-byte base64 output>
DNA_SECRET_KEY=<256 ATCG characters>
LOGISTIC_MAP_R=3.99
ENGINE_API_KEY=<shared hex key>
```

**`api-gateway/.env`**
```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/dna_cert_db?retryWrites=true&w=majority
JWT_SECRET=<64-byte hex output>
CRYPTO_ENGINE_URL=http://crypto-engine:8000
ENGINE_API_KEY=<same shared hex key>
FRONTEND_URL=http://localhost
```

**`frontend/.env`**
```
VITE_API_URL=http://localhost:5000/api
```

### Step 4 — Start All Services

```bash
docker-compose up --build
```

Services start in dependency order:
1. `crypto-engine` — waits for health check to pass
2. `api-gateway` — waits for crypto-engine health
3. `frontend` — waits for api-gateway health

Check status:
```bash
docker-compose ps
```

All three should show `healthy`.

### Step 5 — Bootstrap First Admin

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@university.edu","password":"SecurePass123","role":"SuperAdmin","department":"IT"}'
```

Open the frontend at **http://localhost** and log in.

---

## MongoDB Atlas Setup

1. Create a free account at [cloud.mongodb.com](https://cloud.mongodb.com)
2. **Create a cluster** — free M0 tier is sufficient for small deployments
3. **Database Access** → Add User:
   - Username: `dna_app_user`  
   - Password: strong generated password
   - Role: `readWrite` on database `dna_cert_db` only (not `atlas admin`)
4. **Network Access** → Add IP Address:
   - Development: `0.0.0.0/0` (allow anywhere — temporary)
   - Production: add Render.com's static outbound IPs only
5. **Connect** → Drivers → Copy the connection string
   - Replace `<password>` with your DB user password
   - Add `/dna_cert_db` before the `?` query string

---

## Production Deployment

### Frontend → Vercel

1. Push your repository to GitHub
2. Go to [vercel.com](https://vercel.com) → **New Project** → import your repo
3. Set **Root Directory** to `frontend`
4. Framework preset: **Vite** (auto-detected from `frontend/vercel.json`)
5. **Environment Variables** in Vercel dashboard:
   - `VITE_API_URL` = `https://dna-api-gateway.onrender.com/api`
6. Click **Deploy**

Every push to `main` triggers an automatic re-deployment. The `frontend/vercel.json` handles:
- SPA routing (React Router fallback to `index.html`)
- Static asset caching (1 year, immutable)
- Security headers

---

### API Gateway + Crypto Engine → Render.com

Render.com reads the root `render.yaml` file automatically.

1. Go to [render.com](https://render.com) → **New** → **Blueprint**
2. Connect your GitHub repository
3. Render detects `render.yaml` and shows two services to create:
   - `dna-api-gateway` (web service, public)
   - `dna-crypto-engine` (private service, internal only)
4. Click **Apply**

#### Set Environment Variables in Render Dashboard

For **`dna-api-gateway`**:
| Key | Value |
|---|---|
| `MONGO_URI` | Atlas connection string |
| `JWT_SECRET` | 64-byte hex value |
| `ENGINE_API_KEY` | Shared key (same as engine) |
| `FRONTEND_URL` | `https://your-app.vercel.app` |

For **`dna-crypto-engine`**:
| Key | Value |
|---|---|
| `AES_KEY` | Base64 32-byte key |
| `DNA_SECRET_KEY` | 256-char ATCG string |
| `ENGINE_API_KEY` | Shared key (same as gateway) |
| `LOGISTIC_MAP_R` | `3.99` |

> Render automatically injects the internal hostname of `dna-crypto-engine` into the gateway via the `fromService` reference in `render.yaml`.

5. Update `FRONTEND_URL` in the gateway after getting the Vercel deployment URL
6. Update `VITE_API_URL` in Vercel after getting the Render gateway URL

---

## Environment Configuration Reference

### Security Requirements
| Variable | Min Length | Generation Command |
|---|---|---|
| `AES_KEY` | 32 bytes | `openssl rand -base64 32` |
| `JWT_SECRET` | 32 chars | `openssl rand -hex 64` |
| `ENGINE_API_KEY` | 32 chars | `openssl rand -hex 32` |
| `DNA_SECRET_KEY` | exactly 256 | Custom ATCG generator |

### URL Configuration
In production, environment URLs must be exact — trailing slashes or wrong schemes break CORS:

| Variable | Correct | Wrong |
|---|---|---|
| `FRONTEND_URL` | `https://dna-app.vercel.app` | `https://dna-app.vercel.app/` |
| `VITE_API_URL` | `https://api.onrender.com/api` | `https://api.onrender.com/api/` |
| `CRYPTO_ENGINE_URL` | `http://crypto-engine:8000` | `http://crypto-engine:8000/` |

---

## Monitoring and Logging

### Application Logs

**API Gateway** uses `winston-daily-rotate-file`. Log files are stored in `logs/` (inside the container) and rotate daily. Access them with:
```bash
docker-compose logs api-gateway
docker-compose logs api-gateway --follow   # tail in real time
```

**Crypto Engine** uses Python's `logging` module at `INFO` level. Access:
```bash
docker-compose logs crypto-engine
```

### Health Check Endpoints
| Service | Endpoint | Expected Response |
|---|---|---|
| API Gateway | `GET /api/health` | `{"status":"ok","service":"API Gateway"}` |
| Crypto Engine | `GET /health` | `{"status":"ok","service":"Crypto Engine"}` |
| Frontend (nginx) | `GET /nginx-health` | `healthy` |

### Render.com Monitoring
- Each service has a **Logs** tab in the Render dashboard
- **Metrics** tab shows CPU, memory, and request count
- Set up **alerts** in Render for service crashes or high error rates

---

## Backup and Recovery

### Database Backups (MongoDB Atlas)
- Atlas M0 free tier: no automated backups
- Atlas M10+: automated snapshots every 6 hours, point-in-time recovery
- **Manual backup:**
  ```bash
  mongodump --uri="mongodb+srv://<user>:<pass>@cluster.mongodb.net/dna_cert_db" --out=./backup
  ```
- **Restore:**
  ```bash
  mongorestore --uri="mongodb+srv://<user>:<pass>@cluster.mongodb.net/dna_cert_db" ./backup/dna_cert_db
  ```

### Key Rotation
If cryptographic keys need to be rotated:

> ⚠️ **WARNING:** Rotating `AES_KEY`, `DNA_SECRET_KEY`, or `LOGISTIC_MAP_R` will make **all previously issued certificates unverifiable** (they will return `TAMPERED`). This is by design — keys are baked into the encrypted payload.

**Safe rotation procedure:**
1. Export and re-encrypt all existing certificates with the new keys (custom migration script required)
2. Deploy new key values to all services simultaneously
3. Test verification on a known-good certificate before completing

### Disaster Recovery
| Scenario | Recovery |
|---|---|
| API Gateway crashes | Render auto-restarts on failure |
| Crypto Engine crashes | Render auto-restarts; gateway returns 500 gracefully |
| DB connection lost | Mongoose connection retry (5 retries, exponential backoff) |
| Key lost | Certificates become unverifiable — restore from backup keys |
| Frontend down | Vercel's CDN has 99.99% uptime SLA; no action needed |
