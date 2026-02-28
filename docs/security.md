# Security Architecture

## Overview

The DNA Certificate System is designed with a **Zero Trust, defence-in-depth** security model. Every layer independently validates inputs, authentication, and data integrity — no single layer's compromise can reveal plaintext certificate data.

---

## 1. Threat Model

| Threat | Attack Vector | Mitigation |
|---|---|---|
| **Credential brute force** | Repeated login attempts | 5 login attempts/min rate limit per IP |
| **Token theft** | XSS injection | JWT stored only in memory (never localStorage/cookies) |
| **SQL / NoSQL injection** | Malicious request body | Input sanitization middleware + `express-validator` |
| **XSS injection** | Script tags in form fields | HTML escaping via `.escape()` on all user inputs |
| **Database compromise** | DB breach / insider threat | Only encrypted DNA payload stored — no readable PII |
| **Tampered DB record** | Attacker modifies `dna_payload` in MongoDB | SHA-256 hash embedded inside ciphertext; mismatch → `TAMPERED` |
| **Crypto Engine exposure** | Direct traffic to internal service | Service runs as Render private service; no public port |
| **API key theft** | Environment variable leak | Keys in `.env` (gitignored); never returned in API responses |
| **DDoS / scraping** | High-volume automated requests | 100 req/min/IP global rate limit |
| **Request smuggling** | Oversized payloads | 10KB body limit enforced at both gateway and engine |
| **Clickjacking** | iframe embedding | `X-Frame-Options: SAMEORIGIN` header via Helmet.js |
| **MIME sniffing** | Content-type attacks | `X-Content-Type-Options: nosniff` via Helmet.js |

---

## 2. Network Security (Perimeter)

### CORS — Strict Origin Matching
The API Gateway uses strict CORS configuration:
```js
cors({ origin: config.frontendUrl })  // only the deployed frontend domain
```
All cross-origin requests from any other origin are rejected at the HTTP layer.

### Crypto Engine — Private Network Only
The Crypto Engine has **no public ingress**:
- In Docker Compose: port `8000` is exposed only within the `dna_network` bridge, not bound to `0.0.0.0:8000`
- In production (Render.com): deployed as a `pserv` (private service) with no public URL

**Any direct attempt to reach `http://crypto-engine:8000` from outside the Docker/Render network drops silently.**

### Internal Authentication — `x-api-key`
Even within the private network, the Crypto Engine validates a shared secret on every request:
```
x-api-key: <ENGINE_API_KEY>
```
Mismatched or absent keys return `HTTP 401 Unauthorized`. The key is a 32-byte random hex string generated with `openssl rand -hex 32` and stored only in environment variables.

---

## 3. API Gateway Hardening

### Helmet.js — HTTP Security Headers
```js
helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: []
    }
  }
})
```
Headers automatically set:
- `Content-Security-Policy` — blocks inline scripts and external script sources
- `X-Frame-Options: SAMEORIGIN` — prevents clickjacking
- `X-Content-Type-Options: nosniff` — prevents MIME-type sniffing
- `X-DNS-Prefetch-Control: off` — prevents DNS leak via prefetching
- `Referrer-Policy: no-referrer`

### Rate Limiting
| Route | Limit | Purpose |
|---|---|---|
| `POST /api/auth/login` | 5 req/min/IP | Brute force prevention |
| All `/api/*` routes | 100 req/min/IP | DDoS / scraping prevention |
| `GET /api/certificates/verify/:id` | 100 req/min/IP | Certificate scraping prevention |

### Input Validation and Sanitization
Every certificate field passes through `express-validator`:
- `.trim()` — removes leading/trailing whitespace
- `.escape()` — HTML-encodes `<`, `>`, `"`, `'`, `&`
- Type checks: CGPA is a float 0–10; year is an integer 1990–2100

Furthermore, a global sanitization middleware blocks requests containing:
- `<script>` tags
- SQL special characters (`'`, `--`, `#`)

### Request Timeout
All requests are hard-terminated at **30 seconds**, preventing slow-loris style resource exhaustion attacks.

### Body Size Limit
Body parser configured with a **10KB maximum**:
```js
express.json({ limit: '10kb' })
```

---

## 4. Authentication System

### Password Storage
- Passwords are **never stored in plaintext**
- Bcrypt with **12 salt rounds** is applied in a Mongoose `pre('save')` hook
- The hook fires automatically, meaning no dev path can accidentally bypass hashing
- `passwordHash` is **never included in API responses** (explicitly excluded with `.select('-passwordHash')`)

### JWT Tokens
- Signed with `HS256` algorithm using a 64-byte hex `JWT_SECRET`
- Tokens **expire after 24 hours**
- Payload contains `{ id, email, role }` — minimal claims
- Frontend stores token **in React state only** (memory), never in localStorage, sessionStorage, or cookies

### Authorization — Role-Based Access Control
| Operation | Clerk | HOD | SuperAdmin |
|---|---|---|---|
| Issue certificates | ✅ | ✅ | ✅ |
| View own certificates | ✅ | ✅ | ✅ |
| Revoke certificates | ❌ | ❌ | ✅ only |
| Public verification | N/A (public) | N/A | N/A |

---

## 5. Cryptographic Integrity — Tamper Detection

This is the core security guarantee of the system.

### How Tampering Is Detected

At issuance time, the SHA-256 hash of the certificate JSON is **embedded inside the ciphertext** before AES encryption and DNA encoding. The stored `dna_payload` therefore contains both the encrypted data AND its integrity hash — inseparably encoded together.

At verification time:
1. DNA decoding → AES decryption → extract data + embedded hash
2. SHA-256 of the decrypted data is recomputed
3. If the hashes match → certificate is valid
4. If the hashes don't match → a `TamperedError` is raised → `HTTP 403 TAMPERED`

**Any modification to the `dna_payload` or `chaotic_seed` in MongoDB — even a single character — causes all future verifications to return `TAMPERED`.**

### Cryptographic Stack
| Component | Algorithm | Key Source |
|---|---|---|
| Symmetric encryption | AES-256-CBC | `AES_KEY` env var (32 bytes) |
| Integrity hash | SHA-256 | Deterministic |
| DNA substitution table | Chaotic logistic map | `LOGISTIC_MAP_R` env var + per-cert seed |
| DNA mutation | Custom nucleotide mapping | `DNA_SECRET_KEY` env var (256 chars) |

---

## 6. Logging and Audit Trail

### Audit Events Logged
| Event | Log Level | Trigger |
|---|---|---|
| `AUTH_SUCCESS` | INFO | Successful admin login |
| `AUTH_FAILED` | WARN | Invalid credentials attempt |
| `CERT_ISSUE` | INFO | New certificate created |
| `CERT_VERIFY_SUCCESS` | INFO | Clean verification |
| `CERT_VERIFY_404` | WARN | Unknown public_id queried |
| `CERT_TAMPERED` | **ERROR** | Tamper detected on verification |
| `CERT_VERIFY_403` | WARN | Revoked cert access attempt |
| `CERT_REVOKE` | INFO | Certificate revoked by SuperAdmin |

### Log Redaction
Winston is configured to scrub the following strings before writing to disk:
- `passwordHash` → `[REDACTED]`
- `chaotic_seed` → `[REDACTED]`
- `dna_payload` → `[REDACTED]`

Stack traces from 500 errors are written to rotating log files on disk **only** — they are never returned to the client (which receives only `"Internal server error"`).

### Log Rotation
- Daily log rotation via `winston-daily-rotate-file`
- Logs stored locally on the server filesystem, disconnected from the database cluster

---

## 7. Frontend Security

### No Sensitive Data in Client Bundle
- The Vite build inlines only `VITE_API_URL` — no secrets
- `VITE_` prefix is required for Vite to include env vars in the build; all other env vars are excluded

### Memory-Only JWT
```typescript
// AuthContext.tsx — state, not storage
const [token, setToken] = useState<string | null>(null);
```
Token is lost on page refresh (by design) — the user re-authenticates. This eliminates XSS token theft.

### nginx Security Headers
The nginx serving layer adds:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: no-referrer-when-downgrade`
- `X-XSS-Protection: 1; mode=block`

---

## 8. Production Security Checklist

Before going live, verify:

- [ ] `JWT_SECRET` is a random 64-byte hex string (not a dictionary word)
- [ ] `AES_KEY` is a random 32-byte base64-encoded value
- [ ] `ENGINE_API_KEY` is a random 32+ byte hex string, identical in both services
- [ ] `DNA_SECRET_KEY` is exactly 256 characters of A/T/C/G
- [ ] Crypto Engine has **no public port** in production
- [ ] MongoDB Atlas has IP whitelist set to Render's static IPs only (not `0.0.0.0/0`)
- [ ] `FRONTEND_URL` in api-gateway `.env` matches the exact Vercel deployment URL
- [ ] HTTPS is enforced end-to-end (Vercel and Render both provide TLS by default)
- [ ] No `.env` files committed to git (confirmed by `.gitignore`)
